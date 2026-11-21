"use client";

import { useState } from "react";
import { drawLogoTile } from "@/lib/brand";
import { useT } from "./I18n";
import { f1 } from "@/lib/format";

type Item = { id: number; title: string; artist: string; cover: string; score: number };
const proxied = (u: string) => (u.startsWith("/") ? u : `/api/img?u=${encodeURIComponent(u)}`);
const load = (src: string) => new Promise<HTMLImageElement | null>((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = proxied(src); });
const col = (s: number) => (s >= 8 ? "#5fd39b" : s >= 6 ? "#ffc04d" : "#ff7f7f");
function fit(c: CanvasRenderingContext2D, text: string, maxW: number) { let t = text; while (c.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2); return t === text ? t : t + "…"; }

/** "Tu top del mes" como story 9:16 lista para Instagram / TikTok. */
export function ShareTop({ items, month, handle }: { items: Item[]; month: string; handle: string }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  async function make() {
    setBusy(true);
    try {
      await Promise.all(["800 80px 'Fraunces'", "600 40px 'Figtree'"].map((f) => document.fonts?.load(f).catch(() => null)));
      const W = 1080, H = 1920, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
      const c = cv.getContext("2d")!;
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#8b5cf6";
      const covers = await Promise.all(items.map((i) => load(i.cover)));
      c.fillStyle = "#0e0b11"; c.fillRect(0, 0, W, H);
      if (covers[0]) { c.save(); c.globalAlpha = 0.5; c.filter = "blur(80px) saturate(1.3)"; c.drawImage(covers[0], -300, -300, W + 600, 1100); c.restore(); }
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(14,11,17,.2)"); g.addColorStop(0.45, "rgba(14,11,17,.92)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
      drawLogoTile(c, 80, 84, 56); c.fillStyle = "#f4f0f7"; c.font = "600 44px 'Fraunces', Georgia, serif"; c.fillText("Rela", 154, 128);
      c.fillStyle = accent; c.font = "700 28px 'Figtree', Arial"; c.fillText(t.grow.monthTopOf(month).toUpperCase(), 80, 250);
      c.fillStyle = "#f4f0f7"; c.font = "800 92px 'Fraunces', Georgia, serif"; c.fillText("@" + handle, 80, 350);
      const rowH = 250, y0 = 440;
      items.forEach((it, k) => {
        const y = y0 + k * rowH, im = covers[k];
        c.fillStyle = "rgba(255,255,255,.35)"; c.font = "800 72px 'Fraunces', Georgia, serif"; c.fillText(String(k + 1), 80, y + 130);
        if (im) { c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 30; c.shadowOffsetY = 12; c.drawImage(im, 170, y, 200, 200); c.restore(); }
        c.fillStyle = "#f4f0f7"; c.font = "700 44px 'Figtree', Arial"; c.fillText(fit(c, it.title, 470), 410, y + 82);
        c.fillStyle = "#b7afc4"; c.font = "500 34px 'Figtree', Arial"; c.fillText(fit(c, it.artist, 470), 410, y + 132);
        c.fillStyle = col(it.score); c.font = "600 64px 'Figtree', Arial"; c.textAlign = "right"; c.fillText(f1(it.score), W - 80, y + 120); c.textAlign = "left";
      });
      c.fillStyle = "#b7afc4"; c.font = "500 30px 'Figtree', Arial"; c.textAlign = "center"; c.fillText(t.grow.monthTopCta, W / 2, H - 90); c.textAlign = "left";
      const blob = await new Promise<Blob | null>((r) => cv.toBlob(r, "image/png")); if (!blob) return;
      const file = new File([blob], `rela-top-${month}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: `${t.grow.monthTopOf(month)} · @${handle}` }); } catch { /* cancelado */ } return; }
      const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } finally { setBusy(false); }
  }
  return <button type="button" className="btn sm primary" disabled={busy || !items.length} onClick={make}>{t.grow.shareTop}</button>;
}
