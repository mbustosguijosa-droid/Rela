// Acceso al catálogo público de Deezer (no necesita clave).
// Todas las llamadas se hacen desde el servidor y se cachean una hora.

const API = "https://api.deezer.com";

export type ReleaseType = "album" | "single" | "ep" | "compile";

export type Artist = {
  id: number;
  name: string;
  picture_medium?: string;
  picture_big?: string;
  nb_fan?: number;
  nb_album?: number;
};

export type AlbumSummary = {
  id: number;
  title: string;
  cover_medium: string;
  cover_big: string;
  record_type: ReleaseType;
  release_date?: string;
  artist?: Artist;
};

export type Track = { id: number; title: string; duration: number; track_position?: number };

export type Album = AlbumSummary & {
  release_date: string;
  artist: Artist;
  genres?: { data: { id: number; name: string }[] };
  nb_tracks: number;
  duration: number;
  label?: string;
  tracks: { data: Track[] };
  link: string;
};

import { unstable_cache } from "next/cache";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cola para Deezer: como mucho 40 peticiones cada 5 s y 6 a la vez desde este servidor.
 * Sin ella, el inicio pedía de golpe más de lo que Deezer permite y las listas llegaban vacías.
 */
const sent: number[] = [];
let inFlight = 0;
async function slot() {
  for (;;) {
    const now = Date.now();
    while (sent.length && now - sent[0] > 5000) sent.shift();
    if (sent.length < 40 && inFlight < 6) { sent.push(now); inFlight++; return; }
    await wait(sent.length >= 40 ? 5000 - (now - sent[0]) + 20 : 40);
  }
}
async function deezerFetch(url: string, init: RequestInit & { next?: { revalidate: number } }) {
  await slot();
  try { return await fetch(url, init); } finally { inFlight--; }
}

/** Guarda una hora un resultado caro; si sale vacío (Deezer falló), no lo guarda y lo reintenta la próxima vez. */
export function cached<A extends unknown[], R>(fn: (...a: A) => Promise<R[]>, key: string, revalidate = 3600) {
  const c = unstable_cache(async (...a: A) => { const r = await fn(...a); if (!r.length) throw new Error("empty"); return r; }, [key], { revalidate });
  return async (...a: A): Promise<R[]> => { try { return await c(...a); } catch { return []; } };
}

/**
 * Pide algo a Deezer. Si Deezer está saturado (límite de 50 peticiones cada 5 s) responde con un error
 * que antes se quedaba guardado en caché una hora y hacía desaparecer artistas y discos: ahora se reintenta
 * sin caché, con esperas cortas, y los errores nunca se dan por buenos.
 */
async function get<T>(path: string, revalidate = 3600): Promise<T | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await deezerFetch(API + path, attempt === 0 ? { next: { revalidate } } : { cache: "no-store" });
      if (!res.ok) { await wait(300 * (attempt + 1)); continue; }
      const data = await res.json();
      if (data && typeof data === "object" && "error" in data) {
        const code = (data as { error?: { code?: number } }).error?.code;
        if (code === 800) return null; // no existe de verdad
        await wait(400 * (attempt + 1)); continue; // saturado u otro fallo temporal: reintentar
      }
      return data as T;
    } catch {
      await wait(300 * (attempt + 1));
    }
  }
  return null;
}

export async function searchAlbums(q: string, limit = 24) {
  const r = await get<{ data: AlbumSummary[] }>(`/search/album?q=${encodeURIComponent(q)}&limit=${limit}`, 600);
  return r?.data ?? [];
}

export async function searchArtists(q: string, limit = 8) {
  const r = await get<{ data: Artist[] }>(`/search/artist?q=${encodeURIComponent(q)}&limit=${limit}`, 600);
  return r?.data ?? [];
}

export async function getAlbum(id: string | number) {
  return get<Album>(`/album/${id}`);
}

export async function getArtist(id: string | number) {
  return get<Artist>(`/artist/${id}`);
}

export async function getArtistReleases(id: string | number) {
  const r = await get<{ data: AlbumSummary[] }>(`/artist/${id}/albums?limit=100`);
  return r?.data ?? [];
}

export type TopTrack = { id: number; title: string; artist: Artist; album: { id: number; title: string; cover_medium: string; cover_big: string } };

export async function getRelated(id: string | number, limit = 6) {
  const r = await get<{ data: Artist[] }>(`/artist/${id}/related?limit=${limit}`, 86400);
  return r?.data ?? [];
}

export async function getTopTracks(id: string | number, limit = 3) {
  const r = await get<{ data: TopTrack[] }>(`/artist/${id}/top?limit=${limit}`, 86400);
  return r?.data ?? [];
}

export async function getChartAlbums(limit = 12, genre = 0) {
  const r = await get<{ data: AlbumSummary[] }>(`/chart/${genre}/albums?limit=${limit}`);
  return r?.data ?? [];
}

export async function getChartArtists(limit = 12, genre = 0) {
  // El ranking por género de Deezer devuelve el global; para un género se usan sus artistas destacados
  const r = await get<{ data: Artist[] }>(genre ? `/genre/${genre}/artists` : `/chart/0/artists?limit=${limit}`);
  return (r?.data ?? []).slice(0, limit);
}

/** Géneros del catálogo (id de Deezer) para Explorar. */
export const GENRES: { id: number; k: string }[] = [
  { id: 0, k: "all" }, { id: 116, k: "rap" }, { id: 132, k: "pop" }, { id: 197, k: "latin" }, { id: 165, k: "rnb" },
  { id: 106, k: "electro" }, { id: 85, k: "alt" }, { id: 152, k: "rock" }, { id: 113, k: "dance" }, { id: 129, k: "jazz" }, { id: 464, k: "metal" }, { id: 98, k: "classical" },
];

/** Ejecuta tareas de pocas en pocas para no pasar el límite de Deezer (50 peticiones cada 5 s). */
export async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}

const NOISE = /\b(live|en vivo|directo|demo|tour|tiny desk|first take|remix|version|versión)\b/i;

/** Lanzamientos más recientes de una lista de artistas (para "Novedades"). */
async function getLatestFromRaw(artistIds: number[], perArtist = 1) {
  const today = new Date().toISOString().slice(0, 10);
  const lists = await pool(artistIds, 4, async (id) => {
    const [artist, releases] = await Promise.all([getArtist(id), getArtistReleases(id)]);
    return releases
      .filter((a) => a.release_date && a.release_date <= today && !NOISE.test(a.title))
      .sort((x, y) => (y.release_date ?? "").localeCompare(x.release_date ?? ""))
      .slice(0, perArtist)
      .map((a) => ({ ...a, artist: a.artist ?? artist ?? undefined }));
  });
  return lists.flat().sort((x, y) => (y.release_date ?? "").localeCompare(x.release_date ?? ""));
}

export const KIND: Record<string, string> = { album: "Álbum", single: "Single", ep: "EP", compile: "Recopilatorio" };

export function tier(fans = 0) {
  if (fans < 10_000) return { k: "under", l: "Underground" } as const;
  if (fans < 100_000) return { k: "culto", l: "De culto" } as const;
  if (fans < 1_000_000) return { k: "conocido", l: "Conocido" } as const;
  return { k: "main", l: "Mainstream" } as const;
}

export const cleanTitle = (t: string) => t.replace(/\s*[\(\[](feat|with|con|prod)[^\)\]]*[\)\]]/gi, "").trim();
export const geniusUrl = (artist: string, title: string) =>
  "https://genius.com/search?q=" + encodeURIComponent(`${artist} ${cleanTitle(title)}`);
export const spotifyUrl = (artist: string, title: string) =>
  "https://open.spotify.com/search/" + encodeURIComponent(`${artist} ${cleanTitle(title)}`);

export type Recommendation = { track: TopTrack; because: Artist };

/**
 * Recomendaciones "de tu nicho": artistas parecidos a los que sigues (que aún no sigues)
 * y una canción destacada de cada uno, alternando entre los artistas de origen.
 */
async function getRecommendationsRaw(followed: { artist_id: number; artist_name: string }[], limit = 12): Promise<Recommendation[]> {
  const sources = followed.slice(0, 8);
  const followedIds = new Set(followed.map((f) => Number(f.artist_id)));
  const relatedLists = await pool(sources, 4, async (f) => (await getRelated(f.artist_id, 6)).map((a) => ({ a, because: { id: Number(f.artist_id), name: f.artist_name } as Artist })));
  const picked: { a: Artist; because: Artist }[] = [];
  const seen = new Set<number>();
  for (let round = 0; picked.length < limit && round < 6; round++) {
    for (const list of relatedLists) {
      const cand = list[round];
      if (cand && !followedIds.has(cand.a.id) && !seen.has(cand.a.id)) { seen.add(cand.a.id); picked.push(cand); }
      if (picked.length >= limit) break;
    }
  }
  const tracks = await pool(picked, 4, async (p) => (await getTopTracks(p.a.id, 1))[0] ?? null);
  return picked.map((p, i) => (tracks[i] ? { track: tracks[i]!, because: p.because } : null)).filter(Boolean) as Recommendation[];
}

/** Lanzamientos recientes de artistas parecidos a los que sigues ("nuevo en tu nicho"). */
async function getNicheDropsRaw(followed: { artist_id: number }[], limit = 6) {
  const followedIds = new Set(followed.map((f) => Number(f.artist_id)));
  const related = await pool(followed.slice(0, 6), 3, (f) => getRelated(f.artist_id, 4));
  const ids: number[] = [];
  for (let round = 0; round < 4; round++) for (const list of related) { const a = list[round]; if (a && !followedIds.has(a.id) && !ids.includes(a.id)) ids.push(a.id); }
  const latest = await getLatestFrom(ids.slice(0, 12), 1);
  return latest.slice(0, limit);
}

/** Generador pseudoaleatorio estable (misma semilla → mismo orden), para que la selección cambie cada día y no en cada visita. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
export const dayKey = (d = new Date()) => Math.floor(d.getTime() / 864e5);

export type CultPick = AlbumSummary & { artist: Artist & { nb_fan: number } };

/**
 * "Hoy en De culto": artistas con menos de 100.000 fans (y más de 300, para evitar perfiles vacíos)
 * sacados de los relacionados de una semilla, con su último disco. La selección rota cada día.
 * maxFans = 10_000 para quedarse solo con lo underground.
 */
async function getCultPicksRaw(seedIds: number[], limit = 10, opts: { maxFans?: number; minFans?: number; day?: number } = {}): Promise<CultPick[]> {
  const maxFans = opts.maxFans ?? 100_000, minFans = opts.minFans ?? 300;
  const rnd = seeded((opts.day ?? dayKey()) * 7919 + seedIds.length);
  const seeds = [...new Set(seedIds)].sort(() => rnd() - 0.5).slice(0, 6);
  const exclude = new Set(seedIds);
  let all = (await pool(seeds, 4, (id) => getRelated(id, 20))).flat();
  const small = (a: Artist) => (a.nb_fan ?? 0) >= minFans && (a.nb_fan ?? 0) < maxFans;
  if (all.filter(small).length < limit) {
    // Semillas muy famosas: se baja un escalón más, desde sus relacionados más pequeños
    const step = [...new Map(all.map((a) => [a.id, a])).values()].sort((x, y) => (x.nb_fan ?? 0) - (y.nb_fan ?? 0)).slice(0, 3).map((a) => a.id);
    all = all.concat((await pool(step, 4, (id) => getRelated(id, 20))).flat());
  }
  const seen = new Set<number>();
  const cands = all.filter((a) => {
    const f = a.nb_fan ?? 0;
    if (f < minFans || f >= maxFans || exclude.has(a.id) || seen.has(a.id)) return false;
    seen.add(a.id); return true;
  }).sort(() => rnd() - 0.5).slice(0, limit + 2);
  const today = new Date().toISOString().slice(0, 10);
  const picks = await pool(cands, 4, async (ar) => {
    const rel = (await getArtistReleases(ar.id))
      .filter((x) => x.release_date && x.release_date <= today && !NOISE.test(x.title))
      .sort((x, y) => (y.release_date ?? "").localeCompare(x.release_date ?? ""));
    const best = rel.find((x) => x.record_type === "album" || x.record_type === "ep") ?? rel[0];
    return best ? ({ ...best, artist: { ...ar, nb_fan: ar.nb_fan ?? 0 } } as CultPick) : null;
  });
  return picks.filter((p): p is CultPick => !!p).slice(0, limit);
}

export const getLatestFrom = cached(getLatestFromRaw, "getLatestFrom");
export const getRecommendations = cached(getRecommendationsRaw, "getRecommendations");
export const getNicheDrops = cached(getNicheDropsRaw, "getNicheDrops");
export const getCultPicks = cached(getCultPicksRaw, "getCultPicks");
