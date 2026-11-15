import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getFollowing } from "@/lib/reviews";
import { freshNow, type MusicLink } from "@/lib/music";
import { pool } from "@/lib/deezer";

export const dynamic = "force-dynamic";

/** Qué están escuchando ahora tus amigos (y actualiza lo tuyo para que ellos lo vean). */
export async function GET() {
  const { sb, user } = await getViewer();
  if (!sb || !user) return NextResponse.json({ friends: [] });
  const following = await getFollowing(sb, user.id);
  const { data: links } = await sb.from("music_links").select("*").in("user_id", [user.id, ...following]);
  const all = (links ?? []) as MusicLink[];
  const mine = all.find((l) => l.user_id === user.id);
  const friends = all.filter((l) => l.user_id !== user.id && l.share_listening && (l.spotify_id || l.lastfm_user)).slice(0, 24);
  const [me, rows] = await Promise.all([
    mine && (mine.spotify_id || mine.lastfm_user) ? freshNow(sb, mine, true).catch(() => null) : Promise.resolve(null),
    pool(friends, 4, (l) => freshNow(sb, l, false).catch(() => null)),
  ]);
  const live = rows.filter((r) => r && r.track && (r.is_playing || Date.now() - new Date(r.updated_at).getTime() < 20 * 60_000));
  const ids = live.map((r) => r!.user_id);
  const { data: ps } = ids.length ? await sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", ids) : { data: [] };
  const out = live.map((r) => ({ ...r!, who: (ps ?? []).find((p) => p.id === r!.user_id) })).filter((r) => r.who)
    .sort((a, b) => Number(b.is_playing) - Number(a.is_playing) || b.updated_at.localeCompare(a.updated_at));
  return NextResponse.json({ me, friends: out }, { headers: { "Cache-Control": "no-store" } });
}
