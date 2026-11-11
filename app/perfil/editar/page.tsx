import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.editProfile.title }; }

export default async function Editar({ searchParams }: { searchParams: Promise<{ nuevo?: string }> }) {
  const { nuevo } = await searchParams;
  const [{ user, profile }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!user || !profile) redirect("/entrar?next=/perfil/editar");
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <section className="hello"><h1>{nuevo ? t.editProfile.create : t.editProfile.title}</h1><p>{t.editProfile.intro}</p></section>
      <section className="section"><ProfileForm profile={profile} isNew={!!nuevo || profile.handle.startsWith("user_")} /></section>
    </div>
  );
}
