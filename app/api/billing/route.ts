import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { stripe } from "@/lib/billing";

/** "Gestionar suscripción": abre el portal de Stripe para cambiar tarjeta, plan o darse de baja. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const { sb, user } = await getViewer();
  if (!sb || !user) return NextResponse.redirect(new URL("/entrar?next=/pro", origin), 303);
  const { data } = await sb.from("billing").select("stripe_customer").eq("user_id", user.id).maybeSingle();
  if (!data?.stripe_customer) return NextResponse.redirect(new URL("/pro", origin), 303);
  try {
    const s = await stripe<{ url: string }>("billing_portal/sessions", { customer: data.stripe_customer, return_url: `${origin}/pro` });
    return NextResponse.redirect(s.url, 303);
  } catch {
    return NextResponse.redirect(new URL("/pro?error=portal", origin), 303);
  }
}
