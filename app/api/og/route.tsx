import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getAlbum } from "@/lib/deezer";
import { supabaseServer } from "@/lib/supabase/server";

// Imagen de vista previa (WhatsApp, Instagram, X…) para el enlace de la nota de una persona.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("r") ?? "";
  const handle = (req.nextUrl.searchParams.get("u") ?? "").toLowerCase();
  const lang = req.nextUrl.searchParams.get("l") === "en" ? "en" : "es";
  const a = /^\d+$/.test(id) ? await getAlbum(id) : null;
  if (!a) return new Response("No encontrado", { status: 404 });

  let score: number | null = null;
  let name = "";
  const sb = await supabaseServer();
  if (sb && /^[a-z0-9._]{3,24}$/.test(handle)) {
    const { data: p } = await sb.from("profiles").select("id, name").eq("handle", handle).maybeSingle();
    if (p) {
      name = p.name || handle;
      const { data: r } = await sb.from("ratings").select("overall").eq("user_id", p.id).eq("release_id", a.id).maybeSingle();
      score = r?.overall != null ? Number(r.overall) : null;
    }
  }
  const col = score == null ? "#b7afc4" : score >= 8 ? "#5fd39b" : score >= 6 ? "#ffc04d" : "#ff7f7f";
  const label = lang === "en" ? (score != null ? `${name}'s score` : "Rate it on Rela") : (score != null ? `La nota de ${name}` : "Puntúalo en Rela");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#121016", color: "#f4f0f7", fontFamily: "sans-serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.cover_big} width={630} height={630} alt="" style={{ objectFit: "cover" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 56px 48px", width: 570 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "#b7afc4", textTransform: "uppercase", letterSpacing: 2 }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
              <div style={{ fontSize: 150, fontWeight: 700, color: col, lineHeight: 1 }}>{score != null ? score.toFixed(1) : "?"}</div>
              <div style={{ fontSize: 44, color: "#9c95aa", marginLeft: 10 }}>/10</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 50, fontWeight: 700, lineHeight: 1.05 }}>{a.title.length > 40 ? a.title.slice(0, 38) + "…" : a.title}</div>
            <div style={{ fontSize: 32, color: "#b7afc4", marginTop: 10 }}>{a.artist.name}</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 34, fontSize: 30, fontWeight: 700 }}>
              <div style={{ width: 22, height: 22, borderRadius: 11, background: "#FFD23F", marginRight: 12 }} />
              Rela{handle && score != null ? ` · @${handle}` : ""}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "cache-control": "public, max-age=600, s-maxage=600" } },
  );
}
