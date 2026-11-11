import type { Metadata } from "next";

export const metadata: Metadata = { title: "Términos de uso" };

export default function Terminos() {
  return (
    <div className="wrap legal">
      <section className="hello"><h1>Términos de uso</h1><p>Última actualización: noviembre de 2026</p></section>
      <section className="section">
        <h2>Qué es Rela</h2>
        <p>Rela es una web para puntuar discos canción a canción, escribir reseñas, debatirlas y seguir a otras personas y artistas. Está en fase de pruebas y puede cambiar o fallar.</p>
        <h2>Tu contenido</h2>
        <p>Lo que publicas (reseñas, respuestas, fotos) es tuyo. Al publicarlo nos permites mostrarlo en Rela. Eres responsable de lo que publicas.</p>
        <h2>Normas de convivencia</h2>
        <ul>
          <li>Critica la música, no a las personas. Nada de insultos, acoso, odio ni amenazas.</li>
          <li>No publiques contenido ilegal, sexual explícito, spam ni datos personales de otras personas.</li>
          <li>No suplantes a nadie ni a ningún artista.</li>
        </ul>
        <p>Podemos ocultar contenido que incumpla estas normas o suspender cuentas. Puedes denunciar cualquier reseña desde el botón “Denunciar”.</p>
        <h2>Música y portadas</h2>
        <p>Los datos de los discos y las portadas vienen del catálogo de Deezer y pertenecen a sus titulares. Los enlaces a Spotify, Deezer y Genius llevan a servicios externos con sus propias condiciones.</p>
        <h2>Edad mínima</h2>
        <p>Debes tener al menos 14 años para usar Rela.</p>
      </section>
    </div>
  );
}
