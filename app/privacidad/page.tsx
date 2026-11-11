import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.footer.privacy }; }

const C = {
  es: {
    title: "Política de privacidad", updated: "Última actualización: noviembre de 2026",
    s: [
      ["Qué datos guardamos", ["<b>Cuenta:</b> tu email y, si entras con Google, tu nombre y foto de Google.", "<b>Perfil:</b> lo que tú escribas o subas (nombre, usuario, bio, ciudad, foto, cabecera, color).", "<b>Actividad:</b> tus notas, reseñas, reacciones, respuestas, a quién sigues y qué artistas sigues."]],
      ["Para qué los usamos", "Solo para que Rela funcione: mostrar tu perfil, tus notas y reseñas, tus amigos y recomendarte música. No vendemos tus datos ni los usamos para publicidad."],
      ["Qué es público", "Tu perfil, tus notas, reseñas, respuestas y a quién sigues son visibles para cualquiera que visite Rela. Tu email no es público."],
      ["Dónde se guardan", "En Supabase (base de datos y autenticación) y Vercel (alojamiento de la web). El catálogo de música viene de la API pública de Deezer; no compartimos tus datos con Deezer."],
      ["Tus derechos", "Puedes editar tu perfil cuando quieras y pedir que borremos tu cuenta y todos tus datos. También puedes pedir una copia de tus datos."],
      ["Edad mínima", "Para usar Rela debes tener al menos 14 años."],
      ["Cookies", "Solo usamos las cookies necesarias para mantener tu sesión iniciada y recordar tu idioma. No usamos cookies de publicidad ni de seguimiento."],
    ],
  },
  en: {
    title: "Privacy policy", updated: "Last updated: November 2026",
    s: [
      ["What data we store", ["<b>Account:</b> your email and, if you sign in with Google, your Google name and photo.", "<b>Profile:</b> whatever you write or upload (name, username, bio, city, photo, header, colour).", "<b>Activity:</b> your scores, reviews, reactions, replies, who you follow and which artists you follow."]],
      ["What we use it for", "Only to make Rela work: showing your profile, scores and reviews, your friends, and recommending music. We don't sell your data or use it for advertising."],
      ["What is public", "Your profile, scores, reviews, replies and who you follow are visible to anyone visiting Rela. Your email is not public."],
      ["Where it's stored", "In Supabase (database and authentication) and Vercel (website hosting). The music catalogue comes from Deezer's public API; we don't share your data with Deezer."],
      ["Your rights", "You can edit your profile at any time and ask us to delete your account and all your data. You can also ask for a copy of your data."],
      ["Minimum age", "You must be at least 14 to use Rela."],
      ["Cookies", "We only use the cookies needed to keep you signed in and remember your language. We don't use advertising or tracking cookies."],
    ],
  },
} as const;

export default async function Privacidad() {
  const { lang } = await getT();
  const c = C[lang];
  return (
    <div className="wrap legal">
      <section className="hello"><h1>{c.title}</h1><p>{c.updated}</p></section>
      <section className="section">
        {c.s.map(([h, body]) => (
          <div key={h}><h2>{h}</h2>
            {Array.isArray(body) ? <ul>{(body as readonly string[]).map((li) => <li key={li} dangerouslySetInnerHTML={{ __html: li }} />)}</ul> : <p>{body as string}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
