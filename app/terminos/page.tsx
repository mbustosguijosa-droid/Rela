import type { Metadata } from "next";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.footer.terms }; }

const C = {
  es: {
    title: "Términos de uso", updated: "Última actualización: noviembre de 2026",
    s: [
      ["Qué es Rela", "Rela es una web para puntuar discos canción a canción, escribir reseñas, debatirlas y seguir a otras personas y artistas. Está en fase de pruebas y puede cambiar o fallar."],
      ["Tu contenido", "Lo que publicas (reseñas, respuestas, fotos) es tuyo. Al publicarlo nos permites mostrarlo en Rela. Eres responsable de lo que publicas."],
      ["Normas de convivencia", ["Critica la música, no a las personas. Nada de insultos, acoso, odio ni amenazas.", "No publiques contenido ilegal, sexual explícito, spam ni datos personales de otras personas.", "No suplantes a nadie ni a ningún artista."]],
      ["Moderación", "Podemos ocultar contenido que incumpla estas normas o suspender cuentas. Puedes denunciar cualquier reseña desde el botón “Denunciar”."],
      ["Música y portadas", "Los datos de los discos y las portadas vienen del catálogo de Deezer y pertenecen a sus titulares. Los enlaces a Spotify, Deezer, Genius y Google Traductor llevan a servicios externos con sus propias condiciones."],
      ["Edad mínima", "Debes tener al menos 14 años para usar Rela."],
    ],
  },
  en: {
    title: "Terms of use", updated: "Last updated: November 2026",
    s: [
      ["What Rela is", "Rela is a website to rate records track by track, write reviews, debate them and follow other people and artists. It's in beta and may change or break."],
      ["Your content", "What you post (reviews, replies, photos) is yours. By posting it you allow us to show it on Rela. You're responsible for what you post."],
      ["Community rules", ["Criticise the music, not people. No insults, harassment, hate or threats.", "Don't post illegal or sexually explicit content, spam, or other people's personal data.", "Don't impersonate anyone, including artists."]],
      ["Moderation", "We may hide content that breaks these rules or suspend accounts. You can report any review with the “Report” button."],
      ["Music and covers", "Record data and covers come from Deezer's catalogue and belong to their owners. Links to Spotify, Deezer, Genius and Google Translate go to external services with their own terms."],
      ["Minimum age", "You must be at least 14 to use Rela."],
    ],
  },
} as const;

export default async function Terminos() {
  const { lang } = await getT();
  const c = C[lang];
  return (
    <div className="wrap legal">
      <section className="hello"><h1>{c.title}</h1><p>{c.updated}</p></section>
      <section className="section">
        {c.s.map(([h, body]) => (
          <div key={h}><h2>{h}</h2>
            {Array.isArray(body) ? <ul>{(body as readonly string[]).map((li) => <li key={li}>{li}</li>)}</ul> : <p>{body as string}</p>}
          </div>
        ))}
      </section>
    </div>
  );
}
