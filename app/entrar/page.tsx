import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LogoMark } from "@/components/Logo";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function Entrar({ searchParams }: Props) {
  const { next = "/", error } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const { user } = await getViewer();
  if (user) redirect(safeNext);
  return (
    <div className="wrap" style={{ maxWidth: 460 }}>
      <section className="hello" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <LogoMark size={64} />
        <h1>Entra en Rela</h1>
        <p>Guarda tus notas, escribe reseñas, sigue a tus amigos y personaliza tu perfil.</p>
      </section>
      {error && <p className="form-error" role="alert" style={{ marginTop: 16 }}>No se ha podido iniciar sesión. Vuelve a intentarlo; si usaste el email, abre el enlace en el mismo navegador.</p>}
      <section className="section"><LoginForm next={safeNext} /></section>
    </div>
  );
}
