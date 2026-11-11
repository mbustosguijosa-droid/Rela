"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveReview } from "@/app/actions";
import { Avatar } from "./Avatar";

export function ReviewComposer({ releaseId, initial, viewer }: { releaseId: number; initial: string; viewer: { name: string; handle: string; avatar_url: string | null; accent: string } | null }) {
  const [text, setText] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!viewer)
    return <div className="composer" style={{ gridTemplateColumns: "1fr" }}><p style={{ margin: 0 }}><Link className="linkbtn" href={`/entrar?next=/album/${releaseId}`}>Entra</Link> para escribir tu reseña y reaccionar a las de los demás.</p></div>;
  return (
    <form className="composer" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await saveReview(releaseId, text);
      setMsg(r.ok ? (text.trim() ? "Reseña publicada. Si recibe reacciones, subirá en Destacadas." : "Reseña borrada.") : r.error);
      if (r.ok) router.refresh();
      setTimeout(() => setMsg(null), 3000);
    }); }}>
      <Avatar p={viewer} size={36} />
      <div style={{ minWidth: 0 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder="¿Qué te ha parecido? Saldrá junto a tu nota." aria-label="Tu reseña" />
        <div className="composer-foot">
          <span>{initial ? "Ya tienes una reseña: puedes editarla o dejarla vacía para borrarla." : "Las reseñas con más interacción suben arriba."}</span>
          <button className="btn primary sm" disabled={pending || text.trim() === initial.trim()}>{pending ? "Publicando…" : initial ? "Actualizar reseña" : "Publicar reseña"}</button>
        </div>
      </div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </form>
  );
}
