import type { SupabaseClient } from "@supabase/supabase-js";
import { releasesByIds, type ReleaseRow } from "./releases";

export type Sort = "hot" | "new" | "top" | "debate";
export const SORTS: [Sort, string][] = [["hot", "Destacadas"], ["new", "Más recientes"], ["top", "Más votadas"], ["debate", "Más polémicas"]];
export const SORT_NOTE: Record<Sort, string> = {
  hot: "Destacadas: me gusta, reacciones y respuestas, con más peso a lo reciente.",
  new: "Las últimas en publicarse.",
  top: "Las que más interacción acumulan.",
  debate: "Donde hay más gente a favor y en contra a la vez.",
};
const ORDER: Record<Sort, string> = { hot: "hot_score", new: "created_at", top: "engagement", debate: "debate_score" };

export type Author = { id: string; handle: string; name: string; avatar_url: string | null; accent: string };
export type ReplyView = { id: string; body: string; created_at: string; author: Author | null };
export type ReviewView = {
  id: string; body: string; created_at: string; release_id: number; user_id: string;
  likes: number; fuego: number; acuerdo: number; discrepo: number; replies_count: number;
  score: number | null; author: Author | null; release: ReleaseRow | null;
  mine: string[]; replies: ReplyView[]; isFriend: boolean;
};

export async function getReviews(
  sb: SupabaseClient,
  opts: { releaseId?: number; userId?: string; sort?: Sort; limit?: number; viewerId?: string | null; following?: string[] },
): Promise<ReviewView[]> {
  const sort = opts.sort ?? "hot";
  let q = sb.from("review_ranking").select("*").order(ORDER[sort], { ascending: false }).limit(opts.limit ?? 30);
  if (opts.releaseId) q = q.eq("release_id", opts.releaseId);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  const { data: rows, error } = await q;
  if (error || !rows?.length) return [];

  const reviewIds = rows.map((r) => r.id as string);
  const [{ data: replies }, { data: mine }, { data: scores }, releases] = await Promise.all([
    sb.from("replies").select("id, body, created_at, review_id, user_id").in("review_id", reviewIds).order("created_at"),
    opts.viewerId
      ? sb.from("review_reactions").select("review_id, kind").eq("user_id", opts.viewerId).in("review_id", reviewIds)
      : Promise.resolve({ data: [] as { review_id: string; kind: string }[] }),
    sb.from("ratings").select("user_id, release_id, overall").in("user_id", [...new Set(rows.map((r) => r.user_id))]).in("release_id", [...new Set(rows.map((r) => r.release_id))]),
    releasesByIds(sb, [...new Set(rows.map((r) => r.release_id as number))]),
  ]);
  const authorIds = [...new Set([...rows.map((r) => r.user_id as string), ...(replies ?? []).map((r) => r.user_id as string)])];
  const { data: authors } = await sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", authorIds);
  const A = new Map((authors ?? []).map((a: Author) => [a.id, a]));
  const following = new Set(opts.following ?? []);

  return rows.map((r) => ({
    id: r.id, body: r.body, created_at: r.created_at, release_id: r.release_id, user_id: r.user_id,
    likes: r.likes, fuego: r.fuego, acuerdo: r.acuerdo, discrepo: r.discrepo, replies_count: r.replies_count,
    score: (scores ?? []).find((s) => s.user_id === r.user_id && s.release_id === r.release_id)?.overall ?? null,
    author: A.get(r.user_id) ?? null,
    release: releases.get(r.release_id) ?? null,
    mine: (mine ?? []).filter((m) => m.review_id === r.id).map((m) => m.kind),
    replies: (replies ?? []).filter((x) => x.review_id === r.id).map((x) => ({ id: x.id, body: x.body, created_at: x.created_at, author: A.get(x.user_id) ?? null })),
    isFriend: following.has(r.user_id),
  }));
}

export async function getFollowing(sb: SupabaseClient, userId: string | null | undefined) {
  if (!userId) return [] as string[];
  const { data } = await sb.from("follows").select("followee_id").eq("follower_id", userId);
  return (data ?? []).map((f) => f.followee_id as string);
}

export type FollowedArtist = { artist_id: number; artist_name: string; picture_url: string | null; fans: number | null; created_at: string };
/** Artistas que sigue una persona (vacío si aún no existe la tabla). */
export async function getFollowedArtists(sb: SupabaseClient, userId: string | null | undefined): Promise<FollowedArtist[]> {
  if (!userId) return [];
  const { data, error } = await sb.from("artist_follows").select("artist_id, artist_name, picture_url, fans, created_at").eq("user_id", userId).order("created_at", { ascending: false });
  return error ? [] : (data as FollowedArtist[]);
}
