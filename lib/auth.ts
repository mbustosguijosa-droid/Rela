import { cache } from "react";
import { supabaseServer } from "./supabase/server";

export type Profile = {
  id: string; handle: string; name: string; bio: string; city: string;
  avatar_url: string | null; banner_url: string | null; accent: string;
  loop_release_id: number | null; favorites: number[]; created_at: string;
};

/** Persona que está viendo la página (o null si no ha iniciado sesión). Se calcula una vez por petición. */
export const getViewer = cache(async () => {
  const sb = await supabaseServer();
  if (!sb) return { sb: null, user: null, profile: null } as const;
  // getClaims comprueba la sesión sin ir a internet (firma del token) cuando el proyecto usa claves asimétricas;
  // antes, getUser hacía un viaje a Supabase en cada página y cada clic.
  const { data } = await sb.auth.getClaims();
  const sub = data?.claims?.sub;
  if (!sub) return { sb, user: null, profile: null } as const;
  const user = { id: sub, email: (data.claims.email as string | undefined) ?? null };
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  return { sb, user, profile } as const;
});

export const needsHandle = (p: Profile | null) => !!p && p.handle.startsWith("user_");
