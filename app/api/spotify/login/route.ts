import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { SPOTIFY_SCOPES, spotifyConfigured, spotifyRedirect } from "@/lib/music";

/** Empieza la conexión con Spotify. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const { user } = await getViewer();
  if (!user) return NextResponse.redirect(`${origin}/entrar?next=/perfil/musica`);
  if (!spotifyConfigured()) return NextResponse.redirect(`${origin}/perfil/musica?spotify=config`);
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!, response_type: "code", redirect_uri: spotifyRedirect(origin),
    scope: SPOTIFY_SCOPES, state, show_dialog: "false",
  }).toString();
  const res = NextResponse.redirect(url);
  res.cookies.set("sp_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
