import type { SupabaseClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabase/admin";

export type Plan = "pro" | "artist";
export type Period = "month" | "year";
export const PLANS: Plan[] = ["pro", "artist"];

/** Precios que se muestran (IVA incluido). Los cobrados de verdad son los de Stripe: tienen que coincidir. */
export const PRICES: Record<Plan, Record<Period, number>> = {
  pro: { month: 2.99, year: 24.99 },
  artist: { month: 4.99, year: 39 },
};

const ENV_PRICE: Record<Plan, Record<Period, string>> = {
  pro: { month: "STRIPE_PRICE_PRO_MONTH", year: "STRIPE_PRICE_PRO_YEAR" },
  artist: { month: "STRIPE_PRICE_ARTIST_MONTH", year: "STRIPE_PRICE_ARTIST_YEAR" },
};
export const priceId = (plan: Plan, period: Period) => process.env[ENV_PRICE[plan][period]] || null;
const secret = () => process.env.STRIPE_SECRET_KEY || null;

/** ¿Se puede cobrar ya este plan? (clave de Stripe + precio + clave secreta de Supabase para activar el plan) */
export const paymentsReady = (plan: Plan, period: Period) => !!(secret() && priceId(plan, period) && supabaseAdmin());

export const isPlan = (v: unknown): v is Plan => v === "pro" || v === "artist";
export const isPeriod = (v: unknown): v is Period => v === "month" || v === "year";

/** Llamada a la API de Stripe sin librerías (formulario codificado). */
export async function stripe<T = Record<string, unknown>>(path: string, params?: Record<string, string>, method: "GET" | "POST" = params ? "POST" : "GET"): Promise<T> {
  const key = secret(); if (!key) throw new Error("stripe_off");
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params).toString() : undefined,
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `stripe_${res.status}`);
  return json as T;
}

/** Comprueba la firma de un aviso de Stripe (cabecera Stripe-Signature). */
export function verifyStripeSignature(body: string, header: string | null, whsec: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = Number(parts.t); const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", whsec).update(`${t}.${body}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

type StripeSub = { id: string; status: string; customer: string; metadata?: Record<string, string>; current_period_end?: number; items?: { data: { current_period_end?: number; price?: { recurring?: { interval?: string } } }[] } };

/** Guarda en la base de datos el estado de una suscripción de Stripe. */
export async function saveSubscription(sub: StripeSub, fallback?: { user_id?: string; plan?: string }) {
  const admin = supabaseAdmin(); if (!admin) throw new Error("admin_off");
  const userId = sub.metadata?.user_id ?? fallback?.user_id; const plan = sub.metadata?.plan ?? fallback?.plan;
  if (!userId || !isPlan(plan)) return;
  const item = sub.items?.data?.[0];
  const end = item?.current_period_end ?? sub.current_period_end;
  const interval = item?.price?.recurring?.interval;
  await admin.from("subscriptions").upsert({
    user_id: userId, plan, status: sub.status, period: interval === "year" ? "year" : "month",
    current_period_end: end ? new Date(end * 1000).toISOString() : null, updated_at: new Date().toISOString(),
  });
  await admin.from("billing").upsert({ user_id: userId, stripe_customer: sub.customer, updated_at: new Date().toISOString() });
}

/** Tras volver del pago: confirma la sesión con Stripe y activa el plan (por si el aviso de Stripe aún no ha llegado). */
export async function confirmCheckout(sessionId: string, userId: string) {
  if (!secret() || !supabaseAdmin() || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return false;
  try {
    const s = await stripe<{ client_reference_id?: string; status?: string; subscription?: StripeSub | string; metadata?: Record<string, string> }>(`checkout/sessions/${sessionId}?expand[]=subscription`);
    if (s.client_reference_id !== userId || s.status !== "complete" || !s.subscription || typeof s.subscription === "string") return false;
    await saveSubscription(s.subscription, { user_id: userId, plan: s.metadata?.plan });
    return true;
  } catch { return false; }
}

const LIVE = ["active", "trialing", "past_due"];
/** Planes activos de una persona (vacío si la tabla aún no existe). */
export async function activePlans(sb: SupabaseClient, userId: string | null | undefined): Promise<Plan[]> {
  if (!userId) return [];
  const { data, error } = await sb.from("subscriptions").select("plan, status").eq("user_id", userId);
  if (error || !data) return [];
  return data.filter((r) => LIVE.includes(r.status) && isPlan(r.plan)).map((r) => r.plan as Plan);
}
