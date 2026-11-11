import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** Cliente de Supabase para el servidor (páginas y acciones). Devuelve null si aún no está configurado. */
export async function supabaseServer() {
  const env = supabaseEnv();
  if (!env) return null;
  const { url, key } = env;
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* llamado desde un Server Component */ }
      },
    },
  });
}
