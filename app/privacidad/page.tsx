import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacidad" };

export default function Privacidad() {
  return (
    <div className="wrap legal">
      <section className="hello"><h1>Política de privacidad</h1><p>Última actualización: noviembre de 2026</p></section>
      <section className="section">
        <h2>Qué datos guardamos</h2>
        <ul>
          <li><b>Cuenta:</b> tu email y, si entras con Google, tu nombre y foto de Google.</li>
          <li><b>Perfil:</b> lo que tú escribas o subas (nombre, usuario, bio, ciudad, foto, cabecera, color).</li>
          <li><b>Actividad:</b> tus notas, reseñas, reacciones, respuestas, a quién sigues y qué artistas sigues.</li>
        </ul>
        <h2>Para qué los usamos</h2>
        <p>Solo para que Rela funcione: mostrar tu perfil, tus notas y reseñas, tus amigos y recomendarte música. No vendemos tus datos ni los usamos para publicidad.</p>
        <h2>Qué es público</h2>
        <p>Tu perfil, tus notas, reseñas, respuestas y a quién sigues son visibles para cualquiera que visite Rela. Tu email no es público.</p>
        <h2>Dónde se guardan</h2>
        <p>En Supabase (base de datos y autenticación) y Vercel (alojamiento de la web). El catálogo de música viene de la API pública de Deezer; no compartimos tus datos con Deezer.</p>
        <h2>Tus derechos</h2>
        <p>Puedes editar tu perfil cuando quieras y pedir que borremos tu cuenta y todos tus datos. También puedes pedir una copia de tus datos.</p>
        <h2>Edad mínima</h2>
        <p>Para usar Rela debes tener al menos 14 años.</p>
        <h2>Cookies</h2>
        <p>Solo usamos las cookies necesarias para mantener tu sesión iniciada. No usamos cookies de publicidad ni de seguimiento.</p>
      </section>
    </div>
  );
}
