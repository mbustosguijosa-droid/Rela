"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signOut, updateProfile } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ACCENTS } from "@/lib/format";
import { Avatar } from "./Avatar";
import type { Profile } from "@/lib/auth";

/** Reduce la imagen en el navegador antes de subirla (más rápido y ocupa menos). */
async function resize(file: File, maxW: number, maxH: number, square: boolean): Promise<Blob> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const cv = document.createElement("canvas");
  if (square) {
    const s = Math.min(img.width, img.height); cv.width = cv.height = Math.min(maxW, s);
    cv.getContext("2d")!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, cv.width, cv.height);
  } else {
    const k = Math.min(1, maxW / img.width, maxH / img.height); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
    cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
  }
  URL.revokeObjectURL(url);
  return new Promise((res) => cv.toBlob((b) => res(b!), "image/jpeg", 0.85));
}

export function ProfileForm({ profile, isNew }: { profile: Profile; isNew: boolean }) {
  const [d, setD] = useState({
    name: profile.name, handle: profile.handle.startsWith("user_") ? "" : profile.handle, bio: profile.bio, city: profile.city,
    accent: profile.accent || "#a77bff", avatar_url: profile.avatar_url, banner_url: profile.banner_url,
  });
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"" | "avatar" | "banner">("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = (k: keyof typeof d, v: string | null) => setD((x) => ({ ...x, [k]: v }));

  async function upload(kind: "avatar" | "banner", file: File | undefined) {
    if (!file) return;
    const sb = supabaseBrowser(); if (!sb) return;
    if (!file.type.startsWith("image/")) { setError("Sube una imagen (JPG o PNG)."); return; }
    setError(null); setUploading(kind);
    try {
      const blob = kind === "avatar" ? await resize(file, 400, 400, true) : await resize(file, 1600, 700, false);
      const path = `${profile.id}/${kind}-${Date.now()}.jpg`;
      const { error: e } = await sb.storage.from("media").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if (e) throw e;
      set(kind === "avatar" ? "avatar_url" : "banner_url", sb.storage.from("media").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError(`No se ha podido subir la imagen: ${(e as Error).message}. Si dice "Bucket not found", falta ejecutar el archivo 002 en Supabase.`);
    } finally { setUploading(""); }
  }

  function save(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    start(async () => {
      const r = await updateProfile(d);
      if (!r.ok) { setError(r.error); return; }
      router.push(`/u/${r.handle}`); router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="pform">
      {isNew && <div className="size-note"><b>¡Bienvenida/o a Rela!</b><span className="muted">Elige tu nombre de usuario y ponle foto a tu perfil. Lo podrás cambiar cuando quieras.</span></div>}
      <div className="pf-banner" style={{ backgroundImage: d.banner_url ? `url('${d.banner_url}')` : `linear-gradient(120deg, ${d.accent}, var(--surface-2))` }}>
        <label className="btn sm file-btn">{uploading === "banner" ? "Subiendo…" : "Cambiar cabecera"}<input type="file" accept="image/*" onChange={(e) => upload("banner", e.target.files?.[0])} /></label>
        {d.banner_url && <button type="button" className="btn sm" onClick={() => set("banner_url", null)}>Quitar</button>}
      </div>
      <div className="pf-avatar">
        <Avatar p={{ ...d, accent: d.accent }} size={104} ring />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="btn sm file-btn">{uploading === "avatar" ? "Subiendo…" : "Subir foto"}<input type="file" accept="image/*" onChange={(e) => upload("avatar", e.target.files?.[0])} /></label>
          {d.avatar_url && <button type="button" className="btn sm" onClick={() => set("avatar_url", null)}>Quitar foto</button>}
        </div>
      </div>
      <div className="field"><label className="lbl" htmlFor="pf-name">Nombre</label><input id="pf-name" value={d.name} maxLength={40} onChange={(e) => set("name", e.target.value)} placeholder="Cómo quieres que te vean" /></div>
      <div className="field"><label className="lbl" htmlFor="pf-handle">Nombre de usuario</label>
        <div className="handle-input"><span>@</span><input id="pf-handle" required value={d.handle} maxLength={24} onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))} placeholder="tu_usuario" /></div>
        <span className="muted" style={{ fontSize: 12 }}>Entre 3 y 24 caracteres: letras minúsculas, números, punto o guion bajo. Tu perfil será rela…/u/{d.handle || "tu_usuario"}</span></div>
      <div className="field"><label className="lbl" htmlFor="pf-bio">Bio</label><textarea id="pf-bio" value={d.bio} maxLength={160} onChange={(e) => set("bio", e.target.value)} placeholder="Discos de cabecera, conciertos, manías…" /><span className="muted" style={{ fontSize: 12 }}>{d.bio.length}/160</span></div>
      <div className="field"><label className="lbl" htmlFor="pf-city">Ciudad</label><input id="pf-city" value={d.city} maxLength={40} onChange={(e) => set("city", e.target.value)} /></div>
      <div className="field"><span className="lbl">Color de tu perfil</span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{ACCENTS.map((c) => <button type="button" key={c} className={`sw ${c === d.accent ? "on" : ""}`} style={{ background: c }} aria-label={`Color ${c}`} aria-pressed={c === d.accent} onClick={() => set("accent", c)} />)}</div></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button type="button" className="btn" onClick={() => start(() => signOut())}>Cerrar sesión</button>
        <button className="btn primary" disabled={pending || !!uploading}>{pending ? "Guardando…" : "Guardar perfil"}</button>
      </div>
    </form>
  );
}
