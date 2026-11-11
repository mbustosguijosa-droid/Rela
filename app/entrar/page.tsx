import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LogoMark } from "@/components/Logo";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ next?: string; error?: string; msg?: string }> };

function explain(msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("code verifier") || m.includes("both auth code and code verifier")) return "Abriste el enlace en otro navegador o app. Pide un enlace nuevo y ábrelo en este mismo navegador.";
  if (m.includes("expired") || m.includes("invalid")) return "El enlace ha caducado o ya se usó. Pide uno nuevo.";
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return "El acceso con Google no está activado en Supabase (Authentication → Sign In / Providers → Google).";
  if (m.includes("access_denied")) return "Has cancelado el acceso o Google no lo ha permitido (revisa que la app esté publicada o que tu email sea usuario de prueba).";
  return null;
}

export default async function Entrar({ searchParams }: Props) {
  const { next = "/", error, msg } = await searchParams;
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
      {error && (
        <div className="size-note" role="alert" style={{ marginTop: 16, borderColor: "var(--lo)" }}>
          <div><b style={{ color: "var(--lo)" }}>No se ha podido iniciar sesión</b>
            <span>{explain(msg) ?? "Vuelve a intentarlo. Si usaste el email, abre el enlace en este mismo navegador."}</span>
            {msg && <span className="muted" style={{ display: "block", fontSize: 12, marginTop: 6 }}>Mensaje técnico: {msg}</span>}</div>
        </div>
      )}
      <section className="section"><LoginForm next={safeNext} /></section>
    </div>
  );
}
