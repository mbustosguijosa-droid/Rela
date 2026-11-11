import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = { title: "Editar perfil" };

export default async function Editar({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await searchParams;
  const { user, profile } = await getViewer();
  if (!user || !profile) redirect("/entrar?next=/perfil/editar");
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <section className="hello"><h1>{nuevo ? "Crea tu perfil" : "Editar perfil"}</h1><p>Así te verán tus amigos. Ponle tu foto, una cabecera y tu color.</p></section>
      <section className="section"><ProfileForm profile={profile} isNew={!!nuevo || profile.handle.startsWith("user_")} /></section>
    </div>
  );
}
