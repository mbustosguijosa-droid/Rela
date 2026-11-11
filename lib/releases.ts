import type { SupabaseClient } from "@supabase/supabase-js";
import { getAlbum, getArtist } from "./deezer";

export type ReleaseRow = {
  id: number; title: string; artist_id: number; artist_name: string; artist_fans: number | null;
  cover_url: string | null; record_type: string; release_date: string | null; tracks: { id: number; title: string }[];
};

/** Guarda (o refresca) en la base de datos la ficha de un disco de Deezer. */
export async function ensureRelease(sb: SupabaseClient, id: number): Promise<ReleaseRow | null> {
  const { data: existing } = await sb.from("releases").select("*").eq("id", id).maybeSingle<ReleaseRow & { cached_at: string }>();
  if (existing && Date.now() - new Date(existing.cached_at).getTime() < 7 * 864e5) return existing;
  const a = await getAlbum(id);
  if (!a) return existing ?? null;
  const ar = await getArtist(a.artist.id);
  const row = {
    id: a.id, title: a.title, artist_id: a.artist.id, artist_name: a.artist.name, artist_fans: ar?.nb_fan ?? null,
    cover_url: a.cover_big, record_type: a.record_type, release_date: a.release_date || null,
    tracks: a.tracks.data.map((t) => ({ id: t.id, title: t.title })), cached_at: new Date().toISOString(),
  };
  await sb.from("releases").upsert(row);
  return row;
}

export async function releasesByIds(sb: SupabaseClient, ids: number[]) {
  if (!ids.length) return new Map<number, ReleaseRow>();
  const { data } = await sb.from("releases").select("*").in("id", ids);
  return new Map((data ?? []).map((r: ReleaseRow) => [r.id, r]));
}
