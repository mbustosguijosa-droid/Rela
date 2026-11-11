import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LogoMark } from "@/components/Logo";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import type { Dict } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.login.title }; }

type Props = { searchParams: Promise<{ next?: string; error?: string; msg?: string }> };

function explain(t: Dict, msg = "") {
  const m = msg.toLowerCase();
  if (m.includes("code verifier") || m.includes("both auth code and code verifier")) return t.login.errVerifier;
  if (m.includes("expired") || m.includes("invalid")) return t.login.errExpired;
  if (m.includes("provider is not enabled") || m.includes("unsupported provider")) return t.login.errProvider;
  if (m.includes("access_denied")) return t.login.errDenied;
  return null;
}

export default async function Entrar({ searchParams }: Props) {
  const { next = "/", error, msg } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const [{ user }, { t }] = await Promise.all([getViewer(), getT()]);
  if (user) redirect(safeNext);
  return (
    <div className="wrap" style={{ maxWidth: 460 }}>
      <section className="hello" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <LogoMark size={64} />
        <h1>{t.login.heading}</h1>
        <p>{t.login.intro}</p>
      </section>
      {error && (
        <div className="size-note" role="alert" style={{ marginTop: 16, borderColor: "var(--lo)" }}>
          <div><b style={{ color: "var(--lo)" }}>{t.login.failed}</b>
            <span>{explain(t, msg) ?? t.login.retry}</span>
            {msg && <span className="muted" style={{ display: "block", fontSize: 12, marginTop: 6 }}>{t.login.tech} {msg}</span>}</div>
        </div>
      )}
      <section className="section"><LoginForm next={safeNext} /></section>
    </div>
  );
}
