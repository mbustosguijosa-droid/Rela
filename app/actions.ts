"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { ensureRelease } from "@/lib/releases";

type Result = { ok: true } | { ok: false; error: string };
const NEED_LOGIN = { ok: false, error: "Inicia sesión para hacer esto." } as const;

async function viewerOrNull() {
  const v = await getViewer();
  return v.sb && v.user ? { sb: v.sb, user: v.user, profile: v.profile } : null;
}

/* ---------- Notas ---------- */
export async function saveRating(releaseId: number, r: { tracks: Record<number, number>; overall: number | null; fav: number | null; listened: boolean; liked: boolean }): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const rel = await ensureRelease(v.sb, releaseId); if (!rel) return { ok: false, error: "No encontramos este disco." };
  const vals = Object.values(r.tracks).filter((x) => x >= 1 && x <= 10);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const final = r.overall ?? avg;
  const { error } = await v.sb.from("ratings").upsert({
    user_id: v.user.id, release_id: releaseId, overall: final == null ? null : Math.round(final * 10) / 10,
    manual: r.overall != null, fav_track: r.fav, listened: r.listened, liked: r.liked, updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  await v.sb.from("track_ratings").delete().eq("user_id", v.user.id).eq("release_id", releaseId);
  const rows = Object.entries(r.tracks).filter(([, s]) => s >= 1 && s <= 10).map(([i, s]) => ({ user_id: v.user.id, release_id: releaseId, track_index: +i, score: s }));
  if (rows.length) { const { error: e2 } = await v.sb.from("track_ratings").insert(rows); if (e2) return { ok: false, error: e2.message }; }
  revalidatePath(`/album/${releaseId}`);
  return { ok: true };
}

/* ---------- Top 4 y "en bucle" ---------- */
export async function toggleTop4(releaseId: number): Promise<Result> {
  const v = await viewerOrNull(); if (!v || !v.profile) return NEED_LOGIN;
  await ensureRelease(v.sb, releaseId);
  const favs = (v.profile.favorites ?? []).map(Number);
  let next: number[];
  if (favs.includes(releaseId)) next = favs.filter((x) => x !== releaseId);
  else { if (favs.length >= 4) return { ok: false, error: "Tu top 4 está lleno. Quita uno desde tu perfil." }; next = [...favs, releaseId]; }
  const { error } = await v.sb.from("profiles").update({ favorites: next }).eq("id", v.user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setTop4(ids: number[]): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const { error } = await v.sb.from("profiles").update({ favorites: ids.slice(0, 4) }).eq("id", v.user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setLoop(releaseId: number | null): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  if (releaseId) await ensureRelease(v.sb, releaseId);
  const { error } = await v.sb.from("profiles").update({ loop_release_id: releaseId }).eq("id", v.user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- Reseñas, reacciones y respuestas ---------- */
export async function saveReview(releaseId: number, body: string): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const text = body.trim();
  if (!text) {
    await v.sb.from("reviews").delete().eq("user_id", v.user.id).eq("release_id", releaseId);
  } else {
    if (text.length > 5000) return { ok: false, error: "La reseña es demasiado larga (máximo 5.000 caracteres)." };
    await ensureRelease(v.sb, releaseId);
    const { error } = await v.sb.from("reviews").upsert({ user_id: v.user.id, release_id: releaseId, body: text, updated_at: new Date().toISOString() }, { onConflict: "user_id,release_id" });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/album/${releaseId}`);
  return { ok: true };
}

const KINDS = ["like", "fuego", "acuerdo", "discrepo"] as const;
export async function toggleReaction(reviewId: string, kind: string, on: boolean): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  if (!KINDS.includes(kind as (typeof KINDS)[number])) return { ok: false, error: "Reacción no válida." };
  const q = on
    ? v.sb.from("review_reactions").upsert({ review_id: reviewId, user_id: v.user.id, kind })
    : v.sb.from("review_reactions").delete().eq("review_id", reviewId).eq("user_id", v.user.id).eq("kind", kind);
  const { error } = await q;
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function addReply(reviewId: string, body: string): Promise<{ ok: true; reply: { id: string; body: string; created_at: string } } | { ok: false; error: string }> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const text = body.trim();
  if (!text) return { ok: false, error: "Escribe algo antes de responder." };
  if (text.length > 1000) return { ok: false, error: "La respuesta es demasiado larga (máximo 1.000 caracteres)." };
  const { data, error } = await v.sb.from("replies").insert({ review_id: reviewId, user_id: v.user.id, body: text }).select("id, body, created_at").single();
  if (error || !data) return { ok: false, error: error?.message ?? "No se pudo publicar." };
  return { ok: true, reply: data };
}

export async function report(targetType: "review" | "reply" | "profile", targetId: string, reason = ""): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const { error } = await v.sb.from("reports").insert({ reporter_id: v.user.id, target_type: targetType, target_id: targetId, reason });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/* ---------- Amigos ---------- */
export async function toggleFollow(userId: string, on: boolean): Promise<Result> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  if (userId === v.user.id) return { ok: false, error: "No puedes seguirte a ti." };
  const { error } = on
    ? await v.sb.from("follows").upsert({ follower_id: v.user.id, followee_id: userId })
    : await v.sb.from("follows").delete().eq("follower_id", v.user.id).eq("followee_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

/* ---------- Perfil ---------- */
export async function updateProfile(input: {
  name: string; handle: string; bio: string; city: string; accent: string;
  avatar_url?: string | null; banner_url?: string | null;
}): Promise<Result & { handle?: string }> {
  const v = await viewerOrNull(); if (!v) return NEED_LOGIN;
  const handle = input.handle.trim().toLowerCase().replace(/^@/, "");
  if (!/^[a-z0-9._]{3,24}$/.test(handle)) return { ok: false, error: "El usuario debe tener entre 3 y 24 caracteres: letras minúsculas, números, punto o guion bajo." };
  if (handle.startsWith("user_")) return { ok: false, error: "Elige un nombre de usuario propio." };
  if (input.bio.length > 160) return { ok: false, error: "La bio puede tener como máximo 160 caracteres." };
  const patch: Record<string, unknown> = {
    name: input.name.trim().slice(0, 40), handle, bio: input.bio.trim(), city: input.city.trim().slice(0, 40),
    accent: /^#[0-9a-f]{6}$/i.test(input.accent) ? input.accent : "#a77bff",
  };
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  if (input.banner_url !== undefined) patch.banner_url = input.banner_url;
  const { error } = await v.sb.from("profiles").update(patch).eq("id", v.user.id);
  if (error) return { ok: false, error: error.code === "23505" ? "Ese nombre de usuario ya está cogido." : error.message };
  revalidatePath("/", "layout");
  return { ok: true, handle };
}

export async function signOut() {
  const v = await getViewer();
  await v.sb?.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
