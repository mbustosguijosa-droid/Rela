# Rela

Web para puntuar discos **canción a canción**, escribir reseñas, debatirlas y compartir tus notas en redes.

## Estado

| Parte | Estado |
|---|---|
| Catálogo real (Deezer): inicio con novedades, búsqueda, álbumes, singles, EPs y artistas | ✅ Hecho |
| Puntuar canción a canción, favorita, escuchado, me gusta | ✅ Hecho (se guarda en el navegador) |
| Enlaces a Spotify, Deezer y letras en Genius | ✅ Hecho |
| Base de datos (perfiles, notas, reseñas, reacciones, respuestas, amigos, denuncias) | ✅ Esquema listo en `supabase/schema.sql` |
| Cuentas (Google y enlace por email) y notas guardadas en el perfil | ✅ Hecho |
| Reseñas con reacciones, respuestas, ranking (destacadas, recientes, votadas, polémicas) y denuncias | ✅ Hecho |
| Amigos: buscar, seguir, actividad en el inicio, compatibilidad musical | ✅ Hecho |
| Perfil: foto, cabecera, color, bio, top 4, "en bucle", insignias, discos | ✅ Hecho |
| Tarjetas para compartir en stories | ⏳ Siguiente paso |

## Ponerla en marcha en tu ordenador

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Conectar Supabase (cuentas y base de datos)

1. Crea un proyecto en https://supabase.com (plan gratis).
2. En **SQL Editor**, pega el contenido de `supabase/schema.sql` y pulsa **Run**. Después haz lo mismo con `supabase/002_perfiles_fotos_y_ranking.sql`.
3. En **Project Settings → API**, copia la *Project URL* y la *anon public key*.
4. Copia `.env.example` como `.env.local` y pega esos dos valores.
   Nunca subas `.env.local` a GitHub ni uses la clave `service_role` en la web.

### Inicio de sesión

- **Authentication → URL Configuration**: en *Site URL* pon la dirección de la web (p. ej. `https://rela-xxxx.vercel.app`) y en *Redirect URLs* añade `https://rela-xxxx.vercel.app/**` y `http://localhost:3000/**`.
- **Google (opcional)**: crea un cliente OAuth en Google Cloud Console con el redirect `https://TU-PROYECTO.supabase.co/auth/v1/callback`, y pega el Client ID y el Client Secret en **Authentication → Sign In / Providers → Google**.
- El email gratuito de Supabase envía pocos correos por hora. Para el lanzamiento, configura un SMTP propio (por ejemplo Resend) en **Authentication → Emails → SMTP Settings**.

## Publicarla (Vercel)

1. En https://vercel.com, **Add New → Project** e importa este repositorio.
2. En **Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Deploy**. Cada cambio que se suba a `main` se publica solo.

## Tecnología

Next.js 16 (App Router) · React 19 · Supabase (Postgres + Auth) · API pública de Deezer.
