"use client";

import { useState } from "react";

export function CopyInvite() {
  const [done, setDone] = useState(false);
  return (
    <button className="btn primary sm" onClick={async () => {
      const url = window.location.origin;
      const data = { title: "Rela", text: "Puntúa tus discos canción a canción conmigo en Rela", url };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2500); }
      } catch { /* cancelado */ }
    }}>{done ? "✓ Enlace copiado" : "Compartir invitación"}</button>
  );
}
