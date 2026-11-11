import { createBrowserClient } from "@supabase/ssr";

/** Cliente de Supabase para componentes del navegador. Devuelve null si aún no está configurado. */
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
