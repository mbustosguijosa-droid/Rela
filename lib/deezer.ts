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

async function get<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    const res = await fetch(API + path, { next: { revalidate } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && typeof data === "object" && "error" in data) return null;
    return data as T;
  } catch {
    return null;
  }
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
export async function getLatestFrom(artistIds: number[], perArtist = 1) {
  const today = new Date().toISOString().slice(0, 10);
  const lists = await pool(artistIds, 6, async (id) => {
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
export async function getRecommendations(followed: { artist_id: number; artist_name: string }[], limit = 12): Promise<Recommendation[]> {
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
export async function getNicheDrops(followed: { artist_id: number }[], limit = 6) {
  const followedIds = new Set(followed.map((f) => Number(f.artist_id)));
  const related = await pool(followed.slice(0, 6), 3, (f) => getRelated(f.artist_id, 4));
  const ids: number[] = [];
  for (let round = 0; round < 4; round++) for (const list of related) { const a = list[round]; if (a && !followedIds.has(a.id) && !ids.includes(a.id)) ids.push(a.id); }
  const latest = await getLatestFrom(ids.slice(0, 12), 1);
  return latest.slice(0, limit);
}
