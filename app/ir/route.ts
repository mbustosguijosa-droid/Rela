import { NextResponse, type NextRequest } from "next/server";
import { matchAlbum } from "@/lib/music";

/** Lleva de una escucha (artista + disco/canción) a su página en Rela para puntuarla. */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const artist = p.get("artist") ?? "", album = p.get("album") ?? "", track = p.get("track") ?? "";
  const m = artist ? await matchAlbum(artist, album, track) : null;
  const to = m ? `/album/${m.id}${track ? `?pista=${encodeURIComponent(track)}` : ""}` : `/buscar?q=${encodeURIComponent(`${artist} ${album || track}`.trim())}`;
  return NextResponse.redirect(new URL(to, req.nextUrl.origin));
}
