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
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, user: null, profile: null } as const;
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  return { sb, user, profile } as const;
});

export const needsHandle = (p: Profile | null) => !!p && p.handle.startsWith("user_");
