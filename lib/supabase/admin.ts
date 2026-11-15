import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Cliente con la clave secreta de Supabase (opcional). Solo se usa en el servidor para refrescar
 * lo que escuchan tus amigos en Spotify aunque no tengan Rela abierto. Si no está configurada, devuelve null.
 */
export function supabaseAdmin() {
  const env = supabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!env || !key) return null;
  return createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
