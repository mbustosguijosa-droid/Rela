import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { spotifyExchange, spotifyRedirect } from "@/lib/music";

/** Spotify vuelve aquí después de que aceptes la conexión. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const back = (r: string) => { const res = NextResponse.redirect(`${origin}/perfil/musica?spotify=${r}`); res.cookies.delete("sp_state"); return res; };
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (req.nextUrl.searchParams.get("error")) return back("cancel");
  if (!code || !state || state !== req.cookies.get("sp_state")?.value) return back("error");
  const { sb, user } = await getViewer();
  if (!sb || !user) return NextResponse.redirect(`${origin}/entrar?next=/perfil/musica`);

  const tok = await spotifyExchange(code, spotifyRedirect(origin));
  if (!tok) return back("error");
  // En modo desarrollo, Spotify solo deja entrar a las cuentas añadidas en su panel
  const res = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${tok.access_token}` }, cache: "no-store" });
  if (res.status === 403) return back("notallowed");
  const me = res.ok ? ((await res.json()) as { id: string; display_name: string | null }) : null;
  if (!me) return back("error");

  const t1 = await sb.from("spotify_tokens").upsert({
    user_id: user.id, access_token: tok.access_token, refresh_token: tok.refresh_token,
    expires_at: new Date(Date.now() + tok.expires_in * 1000).toISOString(), scope: tok.scope,
  });
  if (t1.error) return back(t1.error.code === "42P01" || t1.error.code === "PGRST205" ? "sql" : "error");
  await sb.from("music_links").upsert({ user_id: user.id, spotify_id: me.id, spotify_name: me.display_name ?? me.id, updated_at: new Date().toISOString() });
  await sb.from("music_snapshots").delete().eq("user_id", user.id);
  return back("ok");
}
