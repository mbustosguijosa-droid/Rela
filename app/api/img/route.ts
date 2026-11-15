import type { NextRequest } from "next/server";

// Sirve imágenes de sitios de confianza desde nuestro dominio para poder dibujarlas
// en las tarjetas para compartir (el navegador no deja usar imágenes de otros dominios sin permiso).
const ALLOWED = [/\.dzcdn\.net$/, /\.supabase\.co$/, /^lh\d\.googleusercontent\.com$/];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return new Response("Falta u", { status: 400 });
  let url: URL;
  try { url = new URL(raw); } catch { return new Response("URL no válida", { status: 400 }); }
  if (url.protocol !== "https:" || !ALLOWED.some((r) => r.test(url.hostname))) return new Response("Host no permitido", { status: 403 });
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return new Response("No encontrada", { status: 404 });
  return new Response(res.body, {
    headers: { "content-type": res.headers.get("content-type")!, "cache-control": "public, max-age=86400, s-maxage=86400" },
  });
}
