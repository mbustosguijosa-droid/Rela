import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

// Mantiene viva la sesión de Supabase en cada visita.
export async function proxy(request: NextRequest) {
  // Si Supabase nos devuelve a una página que no es /auth/callback (pasa cuando la dirección
  // no está en "Redirect URLs"), reconducimos el código de inicio de sesión al sitio correcto.
  const url = request.nextUrl;
  if (url.pathname !== "/auth/callback") {
    const code = url.searchParams.get("code");
    const errDesc = url.searchParams.get("error_description") || url.searchParams.get("error");
    if (code) {
      const to = url.clone(); to.pathname = "/auth/callback"; to.search = "";
      to.searchParams.set("code", code); to.searchParams.set("next", url.pathname === "/" ? "/" : url.pathname);
      return NextResponse.redirect(to);
    }
    if (errDesc && url.pathname !== "/entrar") {
      const to = url.clone(); to.pathname = "/entrar"; to.search = "";
      to.searchParams.set("error", "1"); to.searchParams.set("msg", errDesc);
      return NextResponse.redirect(to);
    }
  }
  let response = NextResponse.next({ request });
  const env = supabaseEnv();
  if (!env) return response;
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
