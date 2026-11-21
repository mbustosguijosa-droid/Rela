import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { releasesByIds, type ReleaseRow } from "./releases";

const DAY = 864e5;

/** Lunes 00:00 (hora local del servidor) de la semana actual. */
export function weekStart(d = new Date()) {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const weekNumber = (d = new Date()) => Math.floor((weekStart(d).getTime() + 4 * DAY) / (7 * DAY));

/* ------------------------- Disco de la semana ------------------------- */
export type WeekRecord = { rel: ReleaseRow; n: number; avg: number };

/** El lanzamiento con más notas en los últimos 7 días (a igualdad, el de mejor media). */
export async function getRecordOfWeek(sb: SupabaseClient): Promise<WeekRecord | null> {
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const { data } = await sb.from("ratings").select("release_id, overall").gte("updated_at", since).not("overall", "is", null).limit(2000);
  if (!data?.length) return null;
  const agg = new Map<number, { n: number; sum: number }>();
  for (const r of data) { const k = Number(r.release_id); const a = agg.get(k) ?? { n: 0, sum: 0 }; a.n++; a.sum += Number(r.overall); agg.set(k, a); }
  const [id, best] = [...agg.entries()].sort((x, y) => y[1].n - x[1].n || y[1].sum / y[1].n - x[1].sum / x[1].n)[0];
  const rel = (await releasesByIds(sb, [id])).get(id);
  return rel ? { rel, n: best.n, avg: best.sum / best.n } : null;
}

/* --------------------------- Reto de la semana --------------------------- */
export const CHALLENGES = [
  { k: "culto", goal: 3 }, { k: "tracks", goal: 3 }, { k: "year", goal: 2 }, { k: "review", goal: 2 }, { k: "under", goal: 1 },
] as const;
export type Challenge = { k: (typeof CHALLENGES)[number]["k"]; goal: number; done: number; daysLeft: number; level?: "culto" | "under" };

export function currentChallenge() {
  return CHALLENGES[weekNumber() % CHALLENGES.length];
}

/** Progreso del reto de esta semana a partir de tus notas y reseñas desde el lunes. */
export async function getChallenge(sb: SupabaseClient, userId: string): Promise<Challenge> {
  const ch = currentChallenge();
  const start = weekStart();
  const daysLeft = Math.max(1, Math.ceil((start.getTime() + 7 * DAY - Date.now()) / DAY));
  const since = start.toISOString();
  let done = 0;
  if (ch.k === "review") {
    const { count } = await sb.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since);
    done = count ?? 0;
  } else {
    const { data: rs } = await sb.from("ratings").select("release_id").eq("user_id", userId).gte("updated_at", since).not("overall", "is", null).limit(200);
    const ids = (rs ?? []).map((r) => Number(r.release_id));
    if (ids.length) {
      if (ch.k === "tracks") {
        const { data: tr } = await sb.from("track_ratings").select("release_id, track_index").eq("user_id", userId).in("release_id", ids);
        const rels = await releasesByIds(sb, ids);
        const per = new Map<number, number>(); (tr ?? []).forEach((x) => per.set(Number(x.release_id), (per.get(Number(x.release_id)) ?? 0) + 1));
        done = ids.filter((id) => { const n = rels.get(id)?.tracks.length ?? 0; return n > 1 && (per.get(id) ?? 0) >= n; }).length;
      } else {
        const rels = [...(await releasesByIds(sb, ids)).values()];
        const year = String(new Date().getFullYear());
        done = rels.filter((r) => ch.k === "year" ? (r.release_date ?? "").startsWith(year)
          : ch.k === "under" ? r.artist_fans != null && r.artist_fans < 10_000
          : r.artist_fans != null && r.artist_fans < 100_000).length;
      }
    }
  }
  return { k: ch.k, goal: ch.goal, done: Math.min(done, ch.goal), daysLeft, level: ch.k === "under" ? "under" : ch.k === "culto" ? "culto" : undefined };
}

/* ----------------------------- Top del mes ----------------------------- */
export type TopItem = { rel: ReleaseRow; overall: number };
export async function getMonthTop(sb: SupabaseClient, userId: string, limit = 5): Promise<TopItem[]> {
  const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { data } = await sb.from("ratings").select("release_id, overall").eq("user_id", userId).gte("updated_at", start)
    .not("overall", "is", null).order("overall", { ascending: false }).limit(limit);
  if (!data?.length) return [];
  const rels = await releasesByIds(sb, data.map((r) => Number(r.release_id)));
  return data.map((r) => ({ rel: rels.get(Number(r.release_id))!, overall: Number(r.overall) })).filter((x) => x.rel);
}

/* -------------------------------- Avisos -------------------------------- */
export type Notif = {
  id: string; kind: "like" | "react" | "reply" | "follow" | "fav_rated"; release_id: number | null; review_id: string | null;
  detail: string | null; read: boolean; created_at: string;
  actor: { id: string; handle: string; name: string; avatar_url: string | null; accent: string } | null; rel: ReleaseRow | null;
};

/** null si la tabla aún no existe (falta la migración 006). */
export async function getNotifications(sb: SupabaseClient, userId: string, limit = 60): Promise<Notif[] | null> {
  const { data, error } = await sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) return null;
  if (!data.length) return [];
  const [{ data: actors }, rels] = await Promise.all([
    sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", [...new Set(data.map((n) => n.actor_id).filter(Boolean))]),
    releasesByIds(sb, [...new Set(data.map((n) => Number(n.release_id)).filter(Boolean))]),
  ]);
  const A = new Map((actors ?? []).map((a) => [a.id, a]));
  return data.map((n) => ({ ...n, actor: A.get(n.actor_id) ?? null, rel: n.release_id ? rels.get(Number(n.release_id)) ?? null : null }));
}

export const unreadNotifs = cache(async function unreadNotifs(sb: SupabaseClient, userId: string) {
  const { count, error } = await sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("read", false);
  return error ? 0 : count ?? 0;
});

/** ¿Es moderador? (falso si la tabla aún no existe) */
export async function isAdmin(sb: SupabaseClient, userId: string) {
  const { data, error } = await sb.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  return !error && !!data;
}
