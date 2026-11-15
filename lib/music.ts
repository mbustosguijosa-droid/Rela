// Conexión con Spotify y Last.fm: lo último que has escuchado, tus temas y artistas top,
// tus playlists y lo que suena ahora. Todo se hace desde el servidor.
import type { SupabaseClient } from "@supabase/supabase-js";
import { pool } from "./deezer";
import { supabaseAdmin } from "./supabase/admin";

export type Play = { track: string; artist: string; album: string; cover: string | null; url: string | null; at?: string | null; now?: boolean; deezer?: number | null };
export type TopArtist = { name: string; image: string | null; url: string | null; deezer?: number | null };
export type Playlist = { name: string; image: string | null; url: string | null; tracks: number | null };
export type Source = "spotify" | "lastfm";
export type Snapshot = { source: Source; recent: Play[]; top_tracks: Play[]; top_artists: TopArtist[]; playlists: Playlist[]; updated_at: string };
export type MusicLink = { user_id: string; spotify_id: string | null; spotify_name: string | null; lastfm_user: string | null; share_listening: boolean };
export type NowRow = { user_id: string; source: Source; track: string | null; artist: string | null; album: string | null; cover: string | null; url: string | null; is_playing: boolean; updated_at: string };

/* ============================== Spotify ============================== */

export const SPOTIFY_SCOPES = ["user-read-recently-played", "user-read-currently-playing", "user-top-read", "playlist-read-private"].join(" ");
export const spotifyConfigured = () => !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
const basic = () => "Basic " + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64");

/** Dirección a la que Spotify vuelve tras conectar. Tiene que estar en el panel de Spotify tal cual. */
export const spotifyRedirect = (origin: string) => process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;

export async function spotifyExchange(code: string, redirectUri: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", cache: "no-store",
    headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { access_token: string; refresh_token: string; expires_in: number; scope: string };
}

async function spotifyRefresh(refresh: string) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST", cache: "no-store",
    headers: { Authorization: basic(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
}

/** Devuelve una clave válida de Spotify para esa persona (la renueva si ha caducado). */
async function spotifyToken(sb: SupabaseClient, userId: string) {
  const { data } = await sb.from("spotify_tokens").select("access_token, refresh_token, expires_at").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() - Date.now() > 60_000) return data.access_token as string;
  const r = await spotifyRefresh(data.refresh_token);
  if (!r) return null;
  await sb.from("spotify_tokens").update({
    access_token: r.access_token, refresh_token: r.refresh_token ?? data.refresh_token,
    expires_at: new Date(Date.now() + r.expires_in * 1000).toISOString(),
  }).eq("user_id", userId);
  return r.access_token;
}

export async function spotifyGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const res = await fetch("https://api.spotify.com/v1" + path, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 204 || !res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

type SImg = { url: string; width?: number | null }[] | undefined;
type STrack = { type?: string; name: string; artists: { name: string }[]; album: { name: string; images: SImg }; external_urls?: { spotify?: string } };
const img = (a: SImg, small = false) => (a && a.length ? (small ? a[a.length - 1] : a[Math.min(1, a.length - 1)]).url : null);
const fromSpotify = (t: STrack, extra: Partial<Play> = {}): Play => ({
  track: t.name, artist: t.artists?.map((a) => a.name).join(", ") ?? "", album: t.album?.name ?? "", cover: img(t.album?.images), url: t.external_urls?.spotify ?? null, ...extra,
});

async function spotifyNow(token: string): Promise<Play | null> {
  const r = await spotifyGet<{ is_playing: boolean; item: STrack | null }>(token, "/me/player/currently-playing");
  if (!r?.item || (r.item.type && r.item.type !== "track")) return null;
  return fromSpotify(r.item, { now: r.is_playing, at: new Date().toISOString() });
}

async function spotifySnapshot(token: string): Promise<Omit<Snapshot, "updated_at"> & { nowPlay: Play | null }> {
  const [recent, tops, artists, lists, nowPlay] = await Promise.all([
    spotifyGet<{ items: { track: STrack; played_at: string }[] }>(token, "/me/player/recently-played?limit=40"),
    spotifyGet<{ items: STrack[] }>(token, "/me/top/tracks?limit=12&time_range=short_term"),
    spotifyGet<{ items: { name: string; images: SImg; external_urls?: { spotify?: string } }[] }>(token, "/me/top/artists?limit=12&time_range=short_term"),
    spotifyGet<{ items: { name: string; images: SImg; external_urls?: { spotify?: string }; tracks?: { total: number }; items?: { total: number } }[] }>(token, "/me/playlists?limit=12"),
    spotifyNow(token),
  ]);
  return {
    source: "spotify",
    recent: (recent?.items ?? []).map((i) => fromSpotify(i.track, { at: i.played_at })),
    top_tracks: (tops?.items ?? []).map((t) => fromSpotify(t)),
    top_artists: (artists?.items ?? []).map((a) => ({ name: a.name, image: img(a.images), url: a.external_urls?.spotify ?? null })),
    playlists: (lists?.items ?? []).filter(Boolean).map((p) => ({ name: p.name, image: img(p.images), url: p.external_urls?.spotify ?? null, tracks: p.tracks?.total ?? p.items?.total ?? null })),
    nowPlay,
  };
}

/* ============================== Last.fm ============================== */

export const lastfmConfigured = () => !!process.env.LASTFM_API_KEY;
const LFM_BLANK = "2a96cbd8b46e442fc41c2b86b821562f";
type LImg = { "#text": string; size: string }[] | undefined;
const limg = (a: LImg) => { const u = a?.find((i) => i.size === "extralarge")?.["#text"] || a?.[a.length - 1]?.["#text"]; return u && !u.includes(LFM_BLANK) ? u : null; };

async function lastfm<T>(params: Record<string, string>, revalidate = 60): Promise<T | null> {
  const key = process.env.LASTFM_API_KEY?.trim();
  if (!key) return null;
  try {
    const res = await fetch("https://ws.audioscrobbler.com/2.0/?" + new URLSearchParams({ ...params, api_key: key, format: "json" }), { next: { revalidate } });
    if (!res.ok) return null;
    const j = await res.json();
    return j && !j.error ? (j as T) : null;
  } catch { return null; }
}

type LTrack = { name: string; artist: { "#text"?: string; name?: string }; album?: { "#text": string }; image: LImg; url: string; date?: { uts: string }; "@attr"?: { nowplaying?: string } };
const fromLastfm = (t: LTrack): Play => ({
  track: t.name, artist: t.artist?.["#text"] ?? t.artist?.name ?? "", album: t.album?.["#text"] ?? "", cover: limg(t.image), url: t.url,
  at: t.date ? new Date(+t.date.uts * 1000).toISOString() : new Date().toISOString(), now: t["@attr"]?.nowplaying === "true",
});

export async function lastfmUserExists(user: string) {
  const r = await lastfm<{ user: { name: string } }>({ method: "user.getinfo", user }, 0);
  return r?.user?.name ?? null;
}

export async function lastfmNow(user: string): Promise<Play | null> {
  const r = await lastfm<{ recenttracks: { track: LTrack[] } }>({ method: "user.getrecenttracks", user, limit: "1" }, 20);
  const t = r?.recenttracks?.track?.[0];
  return t ? fromLastfm(t) : null;
}

async function lastfmSnapshot(user: string): Promise<Omit<Snapshot, "updated_at"> & { nowPlay: Play | null }> {
  const [recent, tops, artists] = await Promise.all([
    lastfm<{ recenttracks: { track: LTrack[] } }>({ method: "user.getrecenttracks", user, limit: "40" }, 60),
    lastfm<{ toptracks: { track: LTrack[] } }>({ method: "user.gettoptracks", user, period: "1month", limit: "12" }, 3600),
    lastfm<{ topartists: { artist: { name: string; url: string; image: LImg }[] } }>({ method: "user.gettopartists", user, period: "1month", limit: "12" }, 3600),
  ]);
  const plays = (recent?.recenttracks?.track ?? []).map(fromLastfm);
  return {
    source: "lastfm",
    recent: plays.filter((p) => !p.now),
    top_tracks: (tops?.toptracks?.track ?? []).map((t) => ({ ...fromLastfm(t), at: null, now: false })),
    top_artists: (artists?.topartists?.artist ?? []).map((a) => ({ name: a.name, url: a.url, image: limg(a.image) })),
    playlists: [],
    nowPlay: plays.find((p) => p.now) ?? null,
  };
}

/* ======================= Enlazar con el catálogo ======================= */

const DZ = "https://api.deezer.com";
async function dz<T>(path: string): Promise<T | null> {
  try { const r = await fetch(DZ + path, { next: { revalidate: 86400 } }); if (!r.ok) return null; const j = await r.json(); return j?.error ? null : (j as T); } catch { return null; }
}
const clean = (s: string) => s.replace(/\s*[\(\[](feat|with|con|prod|remaster|deluxe)[^\)\]]*[\)\]]/gi, "").replace(/\s+-\s+(remaster|single|ep).*$/i, "").trim();
const first = (s: string) => s.split(/,|&| feat\.? | x /i)[0].trim();

/** Busca en Deezer el disco de una escucha para poder puntuarlo en Rela. */
export async function matchAlbum(artist: string, album: string, track?: string) {
  const a = first(artist);
  type T = { data: { album: { id: number; cover_medium: string }; artist: { name: string } }[] };
  const q = async (query: string) => (await dz<T>(`/search/track?q=${encodeURIComponent(query)}&limit=5`))?.data ?? [];
  // 1) la canción dentro de ese disco, 2) la canción, 3) el disco, 4) búsqueda normal (la avanzada falla con algunas tildes)
  if (track && album) { const r = await q(`artist:"${a}" track:"${clean(track)}" album:"${clean(album)}"`); if (r[0]) return { id: r[0].album.id, cover: r[0].album.cover_medium }; }
  if (track) { const r = await q(`artist:"${a}" track:"${clean(track)}"`); if (r[0]) return { id: r[0].album.id, cover: r[0].album.cover_medium }; }
  if (album) {
    const r = await dz<{ data: { id: number; cover_medium: string }[] }>(`/search/album?q=${encodeURIComponent(`artist:"${a}" album:"${clean(album)}"`)}&limit=3`);
    if (r?.data?.[0]) return { id: r.data[0].id, cover: r.data[0].cover_medium };
  }
  const norm = (x: string) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const loose = await q(`${a} ${clean(track || album)}`);
  const hit = loose.find((d) => norm(d.artist.name).includes(norm(a)) || norm(a).includes(norm(d.artist.name)));
  return hit ? { id: hit.album.id, cover: hit.album.cover_medium } : null;
}

export async function matchArtist(name: string) {
  const r = await dz<{ data: { id: number; picture_medium: string }[] }>(`/search/artist?q=${encodeURIComponent(first(name))}&limit=1`);
  return r?.data?.[0] ? { id: r.data[0].id, picture: r.data[0].picture_medium } : null;
}

/** Quita repetidos (mismo disco) y enlaza cada escucha con su disco en el catálogo. */
async function linkPlays(plays: Play[], max: number, dedupe = true) {
  const seen = new Set<string>();
  const list = dedupe ? plays.filter((p) => { const k = (p.artist + "|" + (p.album || p.track)).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }) : plays;
  const out = list.slice(0, max);
  const m = await pool(out, 4, (p) => matchAlbum(p.artist, p.album, p.track));
  return out.map((p, i) => ({ ...p, deezer: m[i]?.id ?? null, cover: p.cover ?? m[i]?.cover ?? null }));
}

/* ============================== Guardar y leer ============================== */

const FRESH_MS = 90_000;

async function buildSnapshot(link: MusicLink, sb: SupabaseClient) {
  if (link.spotify_id) {
    const token = await spotifyToken(sb, link.user_id);
    if (token) return spotifySnapshot(token);
  }
  if (link.lastfm_user) return lastfmSnapshot(link.lastfm_user);
  return null;
}

/** Guarda la foto de tu música y lo que suena ahora (con tu sesión, o con la clave secreta). */
async function save(sb: SupabaseClient, userId: string, s: Omit<Snapshot, "updated_at"> & { nowPlay: Play | null }) {
  const now = new Date().toISOString();
  const [recent, top_tracks] = await Promise.all([linkPlays(s.recent, 16), linkPlays(s.top_tracks, 12, false)]);
  const top_artists = await Promise.all(s.top_artists.slice(0, 12).map(async (a) => {
    const m = await matchArtist(a.name);
    return { ...a, image: a.image ?? m?.picture ?? null, deezer: m?.id ?? null };
  }));
  const snap: Snapshot = { source: s.source, recent, top_tracks, top_artists, playlists: s.playlists, updated_at: now };
  await sb.from("music_snapshots").upsert({ user_id: userId, ...snap });
  const np = s.nowPlay ?? (s.recent[0] ? { ...s.recent[0], now: false } : null);
  if (np) await sb.from("now_playing").upsert({ user_id: userId, source: s.source, track: np.track, artist: np.artist, album: np.album, cover: np.cover, url: np.url, is_playing: !!np.now, updated_at: np.now ? now : np.at ?? now });
  return snap;
}

export async function getLink(sb: SupabaseClient, userId: string) {
  const { data } = await sb.from("music_links").select("*").eq("user_id", userId).maybeSingle<MusicLink>();
  return data;
}

/**
 * Tu música (o la de otra persona). Si es la tuya y está desfasada, se pide de nuevo a Spotify/Last.fm.
 * Para otra persona: Last.fm se puede leer siempre; Spotify solo con la clave secreta configurada.
 */
export async function getMusic(sb: SupabaseClient, userId: string, own: boolean): Promise<{ link: MusicLink | null; snap: Snapshot | null }> {
  try {
    const link = await getLink(sb, userId);
    if (!link || (!link.spotify_id && !link.lastfm_user)) return { link, snap: null };
    if (!own && !link.share_listening) return { link, snap: null };
    const { data: snap } = await sb.from("music_snapshots").select("*").eq("user_id", userId).maybeSingle<Snapshot>();
    const age = snap ? Date.now() - new Date(snap.updated_at).getTime() : Infinity;
    if (age < (own ? FRESH_MS : 10 * 60_000)) return { link, snap };
    const writer = own ? sb : supabaseAdmin();
    if (own || writer || link.lastfm_user) {
      const fresh = await buildSnapshot(link, writer ?? sb);
      if (fresh && (fresh.recent.length || fresh.top_tracks.length || fresh.top_artists.length)) {
        if (writer) return { link, snap: await save(writer, userId, fresh) };
        // Last.fm de otra persona sin clave secreta: se muestra sin guardar
        const [recent, top_tracks] = await Promise.all([linkPlays(fresh.recent, 16), linkPlays(fresh.top_tracks, 12, false)]);
        return { link, snap: { ...fresh, recent, top_tracks, updated_at: new Date().toISOString() } };
      }
    }
    return { link, snap };
  } catch {
    return { link: null, snap: null };
  }
}

/** Lo que suena ahora para una persona (fresco si se puede). */
export async function freshNow(sb: SupabaseClient, link: MusicLink, own: boolean): Promise<NowRow | null> {
  const { data: row } = await sb.from("now_playing").select("*").eq("user_id", link.user_id).maybeSingle<NowRow>();
  const age = row ? Date.now() - new Date(row.updated_at).getTime() : Infinity;
  if (row && row.is_playing && age < 40_000) return row;
  let play: Play | null = null;
  let source: Source = "lastfm";
  const writer = own ? sb : supabaseAdmin();
  if (link.spotify_id && writer) {
    const token = await spotifyToken(writer, link.user_id);
    if (token) { play = await spotifyNow(token); source = "spotify"; }
  } else if (link.lastfm_user) {
    play = await lastfmNow(link.lastfm_user);
  } else return row;
  if (!play) return row && row.is_playing && age < 5 * 60_000 ? { ...row, is_playing: false } : row;
  const at = play.now ? new Date().toISOString() : play.at ?? new Date().toISOString();
  const next: NowRow = { user_id: link.user_id, source, track: play.track, artist: play.artist, album: play.album, cover: play.cover, url: play.url, is_playing: !!play.now, updated_at: at };
  if (writer) await writer.from("now_playing").upsert(next);
  return next;
}
