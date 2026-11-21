"use client";

import { useState, useTransition } from "react";
import { report } from "@/app/actions";
import { useT } from "./I18n";

/** Denunciar con motivo: abre un pequeño menú, envía y avisa. Una denuncia por persona y contenido. */
export function ReportButton({ type, id, label, done }: { type: "review" | "reply" | "profile" | "conversation"; id: string; label?: string; done?: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const send = (reason: string) => start(async () => {
    const r = await report(type, id, reason);
    setOpen(false); setMsg(r.ok ? done ?? t.reviews.reported : r.error); setTimeout(() => setMsg(null), 3500);
  });
  return (
    <span className="report">
      <button type="button" className="linkbtn report-btn" aria-expanded={open} onClick={() => setOpen(!open)}>{label ?? t.grow.report}</button>
      {open && (
        <span className="report-pop" role="menu" aria-label={t.grow.reportWhy}>
          <small>{t.grow.reportWhy}</small>
          {Object.entries(t.grow.reasons).map(([k, l]) => <button key={k} type="button" role="menuitem" disabled={pending} onClick={() => send(k)}>{l}</button>)}
          <button type="button" className="muted" onClick={() => setOpen(false)}>{t.grow.cancel}</button>
        </span>
      )}
      {msg && <span className="toast" role="status">{msg}</span>}
    </span>
  );
}
