"use client";

import Link from "next/link";
import { useRef } from "react";

export type FanItem = { id: number; cover: string; title: string; artist: string; tag: string; kind: "fav" | "drop" | "new" };

/**
 * Abanico 3D de discos: fundas que se inclinan con el ratón y dejan asomar el vinilo.
 */
export function Fan3D({ items, legend }: { items: FanItem[]; legend: { fav: string; drop: string; new: string } }) {
  const stage = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = stage.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 14).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 22).toFixed(2)}deg`);
  };
  const reset = () => { stage.current?.style.setProperty("--rx", "0deg"); stage.current?.style.setProperty("--ry", "0deg"); };
  const n = items.length;
  return (
    <div className="fan3d" onPointerMove={onMove} onPointerLeave={reset}>
      <div ref={stage} className="fan3d-stage">
        {items.map((it, i) => (
          <Link key={`${it.kind}-${it.id}`} href={`/album/${it.id}`} className={`sleeve ${it.kind}`} style={{ ["--i" as string]: i - (n - 1) / 2, ["--n" as string]: n }} title={`${it.title} · ${it.artist}`}>
            <span className="disc" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.cover} alt={`${it.title} · ${it.artist}`} />
            <span className="sleeve-tag">{it.tag}</span>
          </Link>
        ))}
      </div>
      <div className="fan3d-legend">
        {(["fav", "drop", "new"] as const).filter((k) => items.some((i) => i.kind === k)).map((k) => (
          <span key={k} style={{ ["--c" as string]: k === "fav" ? "#ffd23f" : k === "drop" ? "#5fd39b" : "var(--accent)" }}>{legend[k]}</span>
        ))}
      </div>
    </div>
  );
}
