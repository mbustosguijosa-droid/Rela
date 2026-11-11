import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/** Cliente de Supabase para componentes del navegador. Devuelve null si aún no está configurado. */
export function supabaseBrowser() {
  const env = supabaseEnv();
  if (!env) return null;
  const { url, key } = env;
  return createBrowserClient(url, key);
}
