"use client";

import { drawLogoTile } from "@/lib/brand";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "./I18n";
import type { RatingState } from "./TrackRater";
import { f1 } from "@/lib/format";

type Album = { id: number; title: string; artist: string; year: string; cover: string; tracks: string[] };
type Viewer = { handle: string; name: string; avatar_url: string | null; accent: string } | null;
type Fmt = "story" | "post";
type Sty = "color" | "dark" | "paper";

const proxied = (u: string) => (u.startsWith("/") || u.startsWith("data:") ? u : `/api/img?u=${encodeURIComponent(u)}`);
const cache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImg(src: string) {
  if (!cache.has(src)) cache.set(src, new Promise((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = proxied(src); }));
  return cache.get(src)!;
}
const scoreCol = (s: number | null, paper: boolean) => s == null ? (paper ? "#6b6577" : "#9c95aa") : paper ? (s >= 8 ? "#1d8a57" : s >= 6 ? "#a06400" : "#c63a3a") : (s >= 8 ? "#5fd39b" : s >= 6 ? "#ffc04d" : "#ff7f7f");
function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function fit(c: CanvasRenderingContext2D, text: string, maxW: number) { let t = text; while (c.measureText(t).width > maxW && t.length > 3) t = t.slice(0, -2); return t === text ? t : t + "…"; }
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, max = 2) {
  const words = text.split(" "); let line = ""; const lines: string[] = [];
  for (const w of words) { const tt = line ? line + " " + w : w; if (c.measureText(tt).width > maxW && line) { lines.push(line); line = w; } else line = tt; }
  lines.push(line);
  const out = lines.slice(0, max); if (lines.length > max) out[max - 1] = fit(c, out[max - 1] + "…", maxW);
  out.forEach((l, i) => c.fillText(l, x, y + i * lh)); return y + out.length * lh;
}

export function ShareRating({ album, r, viewer, onClose }: { album: Album; r: RatingState; viewer: Viewer; onClose: () => void }) {
  const { t } = useT();
  const cv = useRef<HTMLCanvasElement>(null);
  const [fmt, setFmt] = useState<Fmt>("story");
  const [sty, setSty] = useState<Sty>("color");
  const [content, setContent] = useState<"all" | "summary" | "curve">(album.tracks.length > 1 ? "all" : "summary");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const vals = Object.values(r.tracks);
  const score = r.overall ?? (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  const handle = viewer?.handle ?? "rela";
  const link = typeof window !== "undefined" ? `${window.location.origin}/album/${album.id}${viewer ? `?de=${viewer.handle}` : ""}` : "";
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 3500); };

  const draw = useCallback(async () => {
    const canvas = cv.current; if (!canvas) return;
    await Promise.all(["700 60px 'Fraunces'", "500 30px 'Figtree'", "700 30px 'Figtree'", "600 40px 'Figtree'"].map((f) => document.fonts?.load(f).catch(() => null)));
    const W = 1080, H = fmt === "story" ? 1920 : 1080; canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d")!;
    const paper = sty === "paper", ink = paper ? "#17141c" : "#f4f0f7", mute = paper ? "#6b6577" : "#b7afc4";
    const disp = "'Fraunces', Georgia, serif", body = "'Figtree', Arial, sans-serif", mono = "'Figtree', Arial, sans-serif";
    const cover = await loadImg(album.cover);
    if (sty === "color" && cover) { c.save(); c.filter = "blur(60px) saturate(1.4)"; c.drawImage(cover, -200, -200, W + 400, H + 400); c.restore(); c.fillStyle = "rgba(12,10,16,.58)"; c.fillRect(0, 0, W, H); }
    else { c.fillStyle = paper ? "#efece4" : "#121016"; c.fillRect(0, 0, W, H); }
    c.textBaseline = "alphabetic";

    const logo = (x: number, y: number, size: number) => {
      drawLogoTile(c, x, y - size * 1.05, size * 1.25);
      c.fillStyle = ink; c.font = `600 ${size}px ${disp}`; c.fillText("Rela", x + size * 1.55, y);
    };
    const avatar = async (x: number, y: number, size: number) => {
      const accent = viewer?.accent ?? "#a77bff";
      c.save(); c.beginPath(); c.arc(x + size / 2, y + size / 2, size / 2, 0, 7); c.clip();
      const im = viewer?.avatar_url ? await loadImg(viewer.avatar_url) : null;
      if (im) c.drawImage(im, x, y, size, size);
      else { c.fillStyle = accent; c.fillRect(x, y, size, size); c.fillStyle = "#1b1424"; c.font = `800 ${size * 0.5}px ${disp}`; c.textAlign = "center"; c.fillText((viewer?.name || handle)[0].toUpperCase(), x + size / 2, y + size * 0.68); c.textAlign = "left"; }
      c.restore(); c.strokeStyle = accent; c.lineWidth = size * 0.05; c.beginPath(); c.arc(x + size / 2, y + size / 2, size / 2 + size * 0.04, 0, 7); c.stroke();
    };
    const rated = Object.entries(r.tracks).map(([i, v]) => [+i, v] as [number, number]);
    const favR: [number, number] | null = r.fav != null && r.tracks[r.fav] != null ? [r.fav, r.tracks[r.fav]] : null;
    const best = favR ?? (rated.length > 1 ? rated.reduce((m, x) => (x[1] > m[1] ? x : m)) : null);
    const worst = rated.length > 1 ? rated.reduce((m, x) => (x[1] < m[1] ? x : m)) : null;
    const top = [...rated].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const full = content === "all" && album.tracks.length > 1;
    const curve = content === "curve" && album.tracks.length > 1;

    /** La curva del disco: una barra por canción, alta según la nota, la favorita con estrella. */
    const curveChart = (x0: number, y0: number, w: number, h: number) => {
      const n = album.tracks.length, gap = Math.max(4, Math.min(16, (w / n) * 0.22)), bw = (w - gap * (n - 1)) / n, base = y0 + h;
      c.strokeStyle = paper ? "rgba(23,20,28,.12)" : "rgba(255,255,255,.12)"; c.lineWidth = 2;
      c.fillStyle = mute; c.font = `500 22px ${mono}`; c.textAlign = "right";
      [10, 8, 6, 4, 2].forEach((g) => { const y = base - (g / 10) * h; c.beginPath(); c.setLineDash([6, 10]); c.moveTo(x0, y); c.lineTo(x0 + w, y); c.stroke(); c.setLineDash([]); c.fillText(String(g), x0 - 14, y + 8); });
      c.textAlign = "left";
      album.tracks.forEach((_, i) => {
        const v = r.tracks[i] ?? null, x = x0 + i * (bw + gap), bh = v == null ? 8 : (v / 10) * h;
        const g = c.createLinearGradient(0, base - bh, 0, base); const col = scoreCol(v, paper);
        g.addColorStop(0, col); g.addColorStop(1, col + (paper ? "66" : "55"));
        c.fillStyle = v == null ? (paper ? "rgba(23,20,28,.15)" : "rgba(255,255,255,.15)") : g;
        roundRect(c, x, base - bh, bw, bh, Math.min(14, bw * 0.3, bh / 2)); c.fill();
        const isFav = (favR && favR[0] === i) || (!favR && best && best[0] === i);
        if (v != null && bw > 34) { c.fillStyle = ink; c.font = `700 ${Math.min(30, bw * 0.42)}px ${mono}`; c.textAlign = "center"; c.fillText(f1(v), x + bw / 2, base - bh - 14); }
        if (isFav) { c.fillStyle = scoreCol(10, paper); c.font = `700 ${Math.min(40, bw * 0.6)}px ${body}`; c.textAlign = "center"; c.fillText("★", x + bw / 2, base - bh - (bw > 34 ? 52 : 14)); }
        c.fillStyle = mute; c.font = `500 ${Math.min(24, bw * 0.45)}px ${mono}`; c.textAlign = "center"; c.fillText(String(i + 1), x + bw / 2, base + 34); c.textAlign = "left";
      });
    };

    const trackList = (x0: number, y0: number, w: number, h: number, cols: number) => {
      const n = album.tracks.length, rows = Math.ceil(n / cols), gap = 24, cw = (w - (cols - 1) * gap) / cols;
      const rh = Math.min(72, h / rows), fs = Math.max(18, Math.min(32, rh * 0.44));
      album.tracks.forEach((tr, i) => {
        const col = Math.floor(i / rows), x = x0 + col * (cw + gap), y = y0 + (i % rows) * rh, v = r.tracks[i] ?? null;
        const isBest = !!best && best[0] === i && (!!favR || best[1] !== worst?.[1]);
        const isWorst = !!worst && worst[0] === i && worst[0] !== best?.[0] && best?.[1] !== worst[1];
        c.fillStyle = paper ? "rgba(23,20,28,.06)" : "rgba(255,255,255,.08)"; roundRect(c, x, y + 3, cw, rh - 6, 10); c.fill();
        if (v != null) { c.fillStyle = scoreCol(v, paper) + (paper ? "38" : "45"); roundRect(c, x, y + 3, Math.max(20, (cw * v) / 10), rh - 6, 10); c.fill(); }
        const base = y + rh / 2 + fs * 0.36;
        c.fillStyle = mute; c.font = `500 ${fs * 0.72}px ${mono}`; c.fillText(String(i + 1).padStart(2, "0"), x + 14, base);
        const short = cw < 600;
        const tag = isBest ? (short ? "★" : favR ? t.share.fav : t.share.best) : isWorst ? (short ? "▼" : t.share.worst) : "";
        c.font = `700 ${fs * 0.6}px ${body}`; const tagW = tag ? c.measureText(tag).width + 18 : 0;
        c.font = `600 ${fs}px ${mono}`; const scoreW = c.measureText("10.0").width;
        c.fillStyle = ink; c.font = `${isBest || isWorst ? 700 : 500} ${fs}px ${body}`;
        c.fillText(fit(c, tr, cw - fs * 2.6 - scoreW - tagW - 30), x + 14 + fs * 1.9, base);
        if (tag) { c.font = `700 ${fs * 0.6}px ${body}`; c.fillStyle = isBest ? scoreCol(10, paper) : scoreCol(1, paper); c.textAlign = "right"; c.fillText(tag, x + cw - scoreW - 28, base - 1); }
        c.textAlign = "right"; c.fillStyle = scoreCol(v, paper); c.font = `600 ${fs}px ${mono}`; c.fillText(v == null ? "–" : f1(v), x + cw - 14, base); c.textAlign = "left";
      });
    };

    if (fmt === "story") {
      logo(80, 130, 44);
      c.fillStyle = mute; c.font = `600 26px ${body}`; c.textAlign = "right"; c.fillText(full ? t.share.trackByTrack : t.share.myScore, W - 80, 122); c.textAlign = "left";
      if (curve) {
        c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 40; c.shadowOffsetY = 18; if (cover) c.drawImage(cover, 80, 190, 310, 310); c.restore();
        c.fillStyle = ink; c.font = `800 58px ${disp}`; const y = wrap(c, album.title, 420, 250, 580, 62, 2);
        c.fillStyle = mute; c.font = `500 32px ${body}`; c.fillText(fit(c, album.artist, 580), 420, y + 2);
        c.fillStyle = scoreCol(score, paper); c.font = `600 120px ${mono}`; c.fillText(f1(score), 412, 492);
        const sw = c.measureText(f1(score)).width; c.fillStyle = mute; c.font = `500 36px ${mono}`; c.fillText("/10", 412 + sw + 8, 492);
        c.fillStyle = mute; c.font = `700 26px ${body}`; c.fillText(t.share.curveTitle, 80, 640);
        c.font = `500 26px ${body}`; c.fillText(t.share.curveHint, 80, 680);
        curveChart(124, 790, W - 204, 640);
        if (top.length) {
          c.fillStyle = mute; c.font = `700 24px ${body}`; c.fillText(t.share.topTracks, 80, 1560);
          top.slice(0, 2).forEach(([i, v], k) => { c.fillStyle = ink; c.font = `500 32px ${body}`; c.fillText(fit(c, `${i + 1}. ${album.tracks[i]}`, 760), 80, 1610 + k * 50); c.fillStyle = scoreCol(v, paper); c.font = `600 32px ${mono}`; c.textAlign = "right"; c.fillText(f1(v), W - 80, 1610 + k * 50); c.textAlign = "left"; });
        }
        await avatar(80, 1790, 72); c.fillStyle = ink; c.font = `700 32px ${body}`; c.fillText("@" + handle, 172, 1838);
        c.fillStyle = mute; c.font = `500 26px ${body}`; c.textAlign = "right"; c.fillText(t.share.cta, W - 80, 1838); c.textAlign = "left";
      } else if (full) {
        c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 40; c.shadowOffsetY = 18; if (cover) c.drawImage(cover, 80, 190, 310, 310); c.restore();
        c.fillStyle = ink; c.font = `800 58px ${disp}`; const y = wrap(c, album.title, 420, 250, 580, 62, 2);
        c.fillStyle = mute; c.font = `500 32px ${body}`; c.fillText(fit(c, album.artist, 580), 420, y + 2);
        c.fillStyle = scoreCol(score, paper); c.font = `600 120px ${mono}`; c.fillText(f1(score), 412, 492);
        const sw = c.measureText(f1(score)).width; c.fillStyle = mute; c.font = `500 36px ${mono}`; c.fillText("/10", 412 + sw + 8, 492);
        trackList(80, 560, W - 160, 1740 - 560, 1);
        await avatar(80, 1790, 72); c.fillStyle = ink; c.font = `700 32px ${body}`; c.fillText("@" + handle, 172, 1838);
        c.fillStyle = mute; c.font = `500 26px ${body}`; c.textAlign = "right"; c.fillText(t.share.cta, W - 80, 1838); c.textAlign = "left";
      } else {
        c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 60; c.shadowOffsetY = 30; if (cover) c.drawImage(cover, 140, 230, 800, 800); c.restore();
        c.fillStyle = ink; c.font = `800 76px ${disp}`; const y = wrap(c, album.title, 90, 1150, 900, 80, 2);
        c.fillStyle = mute; c.font = `500 40px ${body}`; c.fillText(fit(c, `${album.artist} · ${album.year}`, 900), 90, y + 10);
        c.fillStyle = scoreCol(score, paper); c.font = `600 200px ${mono}`; c.fillText(f1(score), 80, 1520);
        const sw = c.measureText(f1(score)).width; c.fillStyle = mute; c.font = `500 52px ${mono}`; c.fillText("/10", 80 + sw + 10, 1520);
        if (top.length && album.tracks.length > 1) {
          c.fillStyle = mute; c.font = `700 24px ${body}`; c.fillText(t.share.topTracks, 90, 1610);
          top.forEach(([i, v], k) => { c.fillStyle = ink; c.font = `500 34px ${body}`; c.fillText(fit(c, `${k + 1}. ${album.tracks[i]}`, 740), 90, 1665 + k * 54); c.fillStyle = scoreCol(v, paper); c.font = `600 32px ${mono}`; c.textAlign = "right"; c.fillText(f1(v), W - 90, 1665 + k * 54); c.textAlign = "left"; });
        }
        await avatar(90, 1815, 70); c.fillStyle = ink; c.font = `700 32px ${body}`; c.fillText("@" + handle, 180, 1862);
        c.fillStyle = mute; c.font = `500 26px ${body}`; c.textAlign = "right"; c.fillText(t.share.ctaShort, W - 90, 1860); c.textAlign = "left";
      }
    } else if (curve) {
      c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 30; c.shadowOffsetY = 14; if (cover) c.drawImage(cover, 60, 60, 210, 210); c.restore();
      c.fillStyle = ink; c.font = `800 48px ${disp}`; const y = wrap(c, album.title, 300, 112, 470, 52, 2);
      c.fillStyle = mute; c.font = `500 28px ${body}`; c.fillText(fit(c, album.artist, 470), 300, y);
      c.fillStyle = scoreCol(score, paper); c.font = `600 96px ${mono}`; c.textAlign = "right"; c.fillText(f1(score), W - 60, 190); c.textAlign = "left";
      logo(W - 200, 252, 28);
      c.fillStyle = mute; c.font = `700 22px ${body}`; c.fillText(t.share.curveTitle, 60, 340);
      curveChart(100, 420, W - 160, 460);
      await avatar(60, 985, 60); c.fillStyle = ink; c.font = `700 28px ${body}`; c.fillText("@" + handle, 136, 1025);
      c.fillStyle = mute; c.font = `500 22px ${body}`; c.textAlign = "right"; c.fillText(t.share.cta, W - 60, 1025); c.textAlign = "left";
    } else if (full) {
      c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 30; c.shadowOffsetY = 14; if (cover) c.drawImage(cover, 60, 60, 210, 210); c.restore();
      c.fillStyle = ink; c.font = `800 48px ${disp}`; const y = wrap(c, album.title, 300, 112, 470, 52, 2);
      c.fillStyle = mute; c.font = `500 28px ${body}`; c.fillText(fit(c, album.artist, 470), 300, y);
      c.fillStyle = scoreCol(score, paper); c.font = `600 96px ${mono}`; c.textAlign = "right"; c.fillText(f1(score), W - 60, 190); c.textAlign = "left";
      logo(W - 200, 252, 28);
      trackList(60, 300, W - 120, 960 - 300, album.tracks.length > 10 ? 2 : 1);
      await avatar(60, 985, 60); c.fillStyle = ink; c.font = `700 28px ${body}`; c.fillText("@" + handle, 136, 1025);
      c.fillStyle = mute; c.font = `500 22px ${body}`; c.textAlign = "right"; c.fillText(t.share.cta, W - 60, 1025); c.textAlign = "left";
    } else {
      c.save(); c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 40; c.shadowOffsetY = 20; if (cover) c.drawImage(cover, 80, 80, 520, 520); c.restore();
      logo(660, 130, 34);
      c.fillStyle = ink; c.font = `800 54px ${disp}`; const y = wrap(c, album.title, 660, 250, 360, 58, 3);
      c.fillStyle = mute; c.font = `500 28px ${body}`; c.fillText(fit(c, album.artist, 360), 660, y + 6);
      c.fillStyle = scoreCol(score, paper); c.font = `600 132px ${mono}`; c.fillText(f1(score), 650, 580);
      if (top.length && album.tracks.length > 1) {
        c.fillStyle = mute; c.font = `700 22px ${body}`; c.fillText(t.share.topTracks, 80, 700);
        top.forEach(([i, v], k) => { c.fillStyle = ink; c.font = `500 36px ${body}`; c.fillText(fit(c, `${k + 1}. ${album.tracks[i]}`, 800), 80, 762 + k * 64); c.fillStyle = scoreCol(v, paper); c.font = `600 34px ${mono}`; c.textAlign = "right"; c.fillText(f1(v), W - 80, 762 + k * 64); c.textAlign = "left"; });
      }
      await avatar(80, 965, 64); c.fillStyle = ink; c.font = `700 30px ${body}`; c.fillText("@" + handle, 164, 1008);
      c.fillStyle = mute; c.font = `500 24px ${body}`; c.textAlign = "right"; c.fillText(t.share.ctaShort, W - 80, 1008); c.textAlign = "left";
    }
  }, [album, r, viewer, fmt, sty, content, score, handle, t]);

  useEffect(() => { draw(); }, [draw]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toFile = () => new Promise<File | null>((res) => cv.current!.toBlob((b) => res(b ? new File([b], `rela-${album.id}.png`, { type: "image/png" }) : null), "image/png"));
  const text = t.share.text(album.title, album.artist, f1(score));

  async function nativeShare(): Promise<boolean> {
    const file = await toFile();
    if (file && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], text: `${text} ${link}` }); } catch { /* cancelado */ }
      return true;
    }
    return false;
  }
  async function download(app?: string) {
    const file = await toFile(); if (!file) return;
    const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (app) flash(t.share.downloaded(app));
  }
  async function shareTo(app: "instagram" | "tiktok" | "whatsapp" | "any") {
    if (score == null) { flash(t.share.noScore); return; }
    setBusy(true);
    try {
      if (await nativeShare()) return;
      if (app === "whatsapp") { window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${link}`)}`, "_blank", "noopener"); return; }
      await download(app === "instagram" ? "Instagram" : app === "tiktok" ? "TikTok" : undefined);
    } catch { flash(t.share.shareFailed); } finally { setBusy(false); }
  }

  const missing = album.tracks.length > 1 && vals.length < album.tracks.length;
  const chip = <T extends string>(cur: T, set: (v: T) => void, v: T, label: string) => <button type="button" className={`chip ${cur === v ? "on" : ""}`} aria-pressed={cur === v} onClick={() => set(v)}>{label}</button>;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet share">
        <canvas ref={cv} width={1080} height={1920} />
        <div className="opts">
          <h2 id="share-title">{t.share.title}</h2>
          <p>{t.share.intro}</p>
          {album.tracks.length > 1 && <div><div className="lbl">{t.share.content}</div><div className="seg">{chip(content, setContent, "all", t.share.allTracks)}{chip(content, setContent, "summary", t.share.summary)}{chip(content, setContent, "curve", t.share.curveOpt)}</div>
            {missing && content !== "summary" && <p style={{ fontSize: 12, marginTop: 8 }}>{t.share.missing}</p>}</div>}
          <div><div className="lbl">{t.share.format}</div><div className="seg">{chip(fmt, setFmt, "story", t.share.story)}{chip(fmt, setFmt, "post", t.share.post)}</div></div>
          <div><div className="lbl">{t.share.style}</div><div className="seg">{chip(sty, setSty, "color", t.share.sColor)}{chip(sty, setSty, "dark", t.share.sDark)}{chip(sty, setSty, "paper", t.share.sPaper)}</div></div>
          <div className="share-to">
            <button type="button" className="btn primary wide" disabled={busy} onClick={() => shareTo("any")}>{t.share.share}</button>
            <button type="button" className="btn brand ig" disabled={busy} onClick={() => shareTo("instagram")}>{t.share.instagram}</button>
            <button type="button" className="btn brand tt" disabled={busy} onClick={() => shareTo("tiktok")}>{t.share.tiktok}</button>
            <button type="button" className="btn brand wa" disabled={busy} onClick={() => shareTo("whatsapp")}>{t.share.whatsapp}</button>
            <button type="button" className="btn" onClick={() => download()}>{t.share.download}</button>
            <button type="button" className="btn wide" onClick={async () => { try { await navigator.clipboard.writeText(link); flash(t.share.copied); } catch { flash(link); } }}>{t.share.copy}</button>
          </div>
          <p style={{ fontSize: 12 }}>{t.share.tipMobile}</p>
          <button type="button" className="btn" onClick={onClose}>{t.share.close}</button>
        </div>
      </div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}
