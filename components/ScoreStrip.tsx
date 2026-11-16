"use client";

import { useRef } from "react";
import { cls, f1 } from "@/lib/format";

/**
 * Barra de 10 segmentos para puntuar: tocas (o arrastras) donde quieres la nota, con medios puntos.
 * Teclado: flechas ±0,5, Inicio/Fin, Supr para dejarla sin nota. Sin nota no hay "pulgar" a la mitad.
 */
export function ScoreStrip({ value, onChange, label, hint, clearLabel }: {
  value: number | null; onChange: (v: number | null) => void; label: string; hint: string; clearLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const fromX = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const raw = ((clientX - r.left) / r.width) * 10; // 0..10
    return Math.min(10, Math.max(1, Math.ceil(raw * 2) / 2));
  };
  const set = (v: number | null) => { if (v !== value) onChange(v); };
  const tier = cls(value);
  return (
    <div className="strip-wrap">
      <div ref={ref} className={`strip ${value == null ? "empty" : `t-${tier}`}`} role="slider" tabIndex={0}
        aria-label={label} aria-valuemin={1} aria-valuemax={10} aria-valuenow={value ?? undefined} aria-valuetext={value == null ? hint : f1(value)}
        onPointerDown={(e) => { drag.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); set(fromX(e.clientX)); }}
        onPointerMove={(e) => { if (drag.current) set(fromX(e.clientX)); }}
        onPointerUp={() => { drag.current = false; }} onPointerCancel={() => { drag.current = false; }}
        onKeyDown={(e) => {
          const v = value ?? 5.5;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); set(Math.min(10, v + 0.5)); }
          else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); set(Math.max(1, v - 0.5)); }
          else if (e.key === "Home") { e.preventDefault(); set(1); }
          else if (e.key === "End") { e.preventDefault(); set(10); }
          else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); set(null); }
        }}>
        {Array.from({ length: 10 }, (_, i) => {
          const fill = value == null ? 0 : Math.max(0, Math.min(1, value - i));
          return <span key={i} className="seg"><i style={{ transform: `scaleX(${fill})` }} /></span>;
        })}
        {value == null && <span className="strip-hint" aria-hidden="true">{hint}</span>}
      </div>
      {value != null && <button type="button" className="strip-clear" onClick={() => set(null)} aria-label={clearLabel} title={clearLabel}>×</button>}
    </div>
  );
}

/** La curva del disco: una barra por canción con su nota (y hueco si no tiene). */
export function AlbumCurve({ scores, count, fav, label }: { scores: Record<number, number>; count: number; fav: number | null; label: string }) {
  if (!Object.keys(scores).length) return null;
  const w = 100 / count;
  return (
    <figure className="curve" aria-label={label}>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => {
          const v = scores[i];
          const h = v == null ? 1.5 : (v / 10) * 38;
          return <rect key={i} x={i * w + w * 0.14} width={w * 0.72} y={40 - h} height={h} rx={Math.min(1.2, w * 0.2)} className={v == null ? "c-none" : `c-${cls(v)}${fav === i ? " c-fav" : ""}`} />;
        })}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}
