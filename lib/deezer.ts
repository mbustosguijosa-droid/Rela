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

export async function getChartAlbums(limit = 12) {
  const r = await get<{ data: AlbumSummary[] }>(`/chart/0/albums?limit=${limit}`);
  return r?.data ?? [];
}

/** Ejecuta tareas de pocas en pocas para no pasar el límite de Deezer (50 peticiones cada 5 s). */
async function pool<T, R>(items: T[], size: number, fn: (x: T) => Promise<R>): Promise<R[]> {
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
