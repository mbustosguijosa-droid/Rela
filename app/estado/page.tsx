import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseEnv } from "@/lib/supabase/env";
import { getAlbum } from "@/lib/deezer";

export const metadata: Metadata = { title: "Estado", robots: { index: false } };
export const dynamic = "force-dynamic";

type Check = { name: string; ok: boolean; detail: string };

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  const env = supabaseEnv();
  checks.push({
    name: "Variables de Supabase en Vercel",
    ok: !!env,
    detail: env ? `URL: ${env.url}` : "Faltan NEXT_PUBLIC_SUPABASE_URL o la clave pública. Revisa Settings → Environment Variables y haz Redeploy.",
  });
  if (env) {
    const sb = await supabaseServer();
    try {
      const { error } = await sb!.from("profiles").select("id", { count: "exact", head: true });
      checks.push({
        name: "Conexión con la base de datos",
        ok: !error,
        detail: error
          ? error.message.includes("does not exist") || error.code === "42P01" || error.code === "PGRST205"
            ? "Conecta, pero faltan las tablas. Ejecuta supabase/schema.sql en el SQL Editor de Supabase."
            : `Error: ${error.message}`
          : "Conecta y las tablas existen.",
      });
      const tables = ["releases", "ratings", "track_ratings", "reviews", "review_reactions", "replies", "follows", "reports", "artist_follows"];
      const missing: string[] = [];
      for (const t of tables) {
        const { error: e } = await sb!.from(t).select("*", { count: "exact", head: true });
        if (e) missing.push(t);
      }
      checks.push({ name: "Tablas de Rela", ok: missing.length === 0, detail: missing.length ? `Faltan: ${missing.join(", ")}. Ejecuta en Supabase los archivos SQL que falten (schema, 002 y 003).` : `Las ${tables.length + 1} tablas están creadas.` });
    } catch (e) {
      checks.push({ name: "Conexión con la base de datos", ok: false, detail: `No se pudo conectar: ${(e as Error).message}` });
    }
  }
  if (env) {
    try {
      const res = await fetch(`${env.url}/auth/v1/settings`, { headers: { apikey: env.key }, cache: "no-store" });
      const st = await res.json();
      checks.push({ name: "Inicio de sesión con email", ok: !!st?.external?.email, detail: st?.external?.email ? "Activado." : "Desactivado en Supabase (Authentication → Sign In / Providers → Email)." });
      checks.push({ name: "Inicio de sesión con Google", ok: !!st?.external?.google, detail: st?.external?.google
        ? "Activado en este proyecto de Supabase. Si aún falla, revisa la URI de redireccionamiento en Google y los usuarios de prueba."
        : `Desactivado en el proyecto ${env.url}. Actívalo en Authentication → Sign In / Providers → Google y pulsa Save (comprueba que es este mismo proyecto).` });
    } catch {
      checks.push({ name: "Ajustes de inicio de sesión", ok: false, detail: "No se pudieron leer." });
    }
  }
  const a = await getAlbum(302867697);
  checks.push({ name: "Catálogo de Deezer", ok: !!a, detail: a ? `Responde (ejemplo: ${a.title})` : "No responde ahora mismo." });
  return checks;
}

export default async function Estado() {
  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);
  return (
    <div className="wrap">
      <section className="hello">
        <h1>{allOk ? <>Todo <em>en orden</em></> : "Hay algo por revisar"}</h1>
        <p>Comprobación de la configuración de Rela.</p>
      </section>
      <section className="section">
        {checks.map((c) => (
          <div key={c.name} className="size-note" style={{ marginBottom: 12 }}>
            <span className={`tier ${c.ok ? "under" : "main"}`} style={{ color: c.ok ? "var(--hi)" : "var(--lo)" }}>{c.ok ? "OK" : "Revisar"}</span>
            <div><b>{c.name}</b><span className="muted">{c.detail}</span></div>
          </div>
        ))}
      </section>
    </div>
  );
}
