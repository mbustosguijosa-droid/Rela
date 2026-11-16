"use client";

import { useEffect, useRef, useState } from "react";
import { ACCENT_COOKIE, ACCENT_PRESETS, DEFAULT_ACCENT, inkFor, isHex } from "@/lib/accent";
import { useT } from "./I18n";

function apply(hex: string) {
  const r = document.documentElement.style;
  r.setProperty("--accent", hex); r.setProperty("--accent-ink", inkFor(hex));
  document.cookie = `${ACCENT_COOKIE}=${encodeURIComponent(hex)}; path=/; max-age=31536000; samesite=lax`;
}

/** Botón con el color actual: abre una paleta para cambiar el color secundario de toda la web. */
export function AccentPicker({ initial }: { initial: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(isHex(initial) ? initial : DEFAULT_ACCENT);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  const pick = (hex: string) => { setColor(hex); apply(hex); };
  return (
    <div className="accent-pick" ref={box}>
      <button type="button" className="accent-btn" aria-label={t.theme.pick} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="accent-dot" style={{ background: color }} />
      </button>
      {open && (
        <div className="accent-pop" role="dialog" aria-label={t.theme.pick}>
          <b>{t.theme.pick}</b>
          <div className="accent-grid">
            {ACCENT_PRESETS.map((p) => (
              <button key={p.hex} type="button" className={`accent-sw ${p.hex === color ? "on" : ""}`} style={{ background: p.hex }}
                aria-label={t.theme.names[p.k]} aria-pressed={p.hex === color} title={t.theme.names[p.k]} onClick={() => pick(p.hex)} />
            ))}
          </div>
          <label className="accent-custom">
            <input type="color" value={color} onChange={(e) => pick(e.target.value)} />
            <span>{t.theme.custom}</span>
          </label>
          {color !== DEFAULT_ACCENT && <button type="button" className="linkbtn accent-reset" onClick={() => pick(DEFAULT_ACCENT)}>{t.theme.reset}</button>}
        </div>
      )}
    </div>
  );
}
