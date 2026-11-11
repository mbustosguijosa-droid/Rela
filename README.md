# Rela

Web para puntuar discos **canción a canción**, escribir reseñas, debatirlas y compartir tus notas en redes.

## Estado

| Parte | Estado |
|---|---|
| Catálogo real (Deezer): inicio con novedades, búsqueda, álbumes, singles, EPs y artistas | ✅ Hecho |
| Puntuar canción a canción, favorita, escuchado, me gusta | ✅ Hecho (se guarda en el navegador) |
| Enlaces a Spotify, Deezer y letras en Genius | ✅ Hecho |
| Base de datos (perfiles, notas, reseñas, reacciones, respuestas, amigos, denuncias) | ✅ Esquema listo en `supabase/schema.sql` |
| Cuentas de usuario y guardar notas en el perfil | ⏳ Siguiente paso |
| Reseñas sociales con ranking, amigos, perfiles, tarjetas para stories | ⏳ Pendiente (ya diseñado en el boceto) |

## Ponerla en marcha en tu ordenador

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install
npm run dev
```

Abre http://localhost:3000.

## Conectar Supabase (cuentas y base de datos)

1. Crea un proyecto en https://supabase.com (plan gratis).
2. En **SQL Editor**, pega el contenido de `supabase/schema.sql` y pulsa **Run**.
3. En **Project Settings → API**, copia la *Project URL* y la *anon public key*.
4. Copia `.env.example` como `.env.local` y pega esos dos valores.
   Nunca subas `.env.local` a GitHub ni uses la clave `service_role` en la web.

## Publicarla (Vercel)

1. En https://vercel.com, **Add New → Project** e importa este repositorio.
2. En **Environment Variables** añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Deploy**. Cada cambio que se suba a `main` se publica solo.

## Tecnología

Next.js 16 (App Router) · React 19 · Supabase (Postgres + Auth) · API pública de Deezer.
