import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Supabase vuelve aquí tras entrar con Google o con el enlace del email.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const sb = await supabaseServer();
  if (!code || !sb) return NextResponse.redirect(`${origin}/entrar?error=1`);
  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/entrar?error=1`);
  const { data: profile } = await sb.from("profiles").select("handle").eq("id", data.user.id).maybeSingle();
  if (!profile || profile.handle.startsWith("user_")) return NextResponse.redirect(`${origin}/perfil/editar?nuevo=1`);
  return NextResponse.redirect(`${origin}${next}`);
}
