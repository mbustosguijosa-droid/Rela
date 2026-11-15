// Escena 3D de la entrada de Rela Music (three.js, sin modelos externos).
// Un estudio de grabación amplio en penumbra morada. Al fondo, arriba a la izquierda, una cabina
// elevada con alguien cantando a contraluz y un neón "for real music lovers". En la mesa, bajo un
// foco, el móvil en su soporte (la app), los cascos conectados y un vaso de lean.
// La cámara está quieta hasta que tocas el móvil; solo hay animaciones ambientales ligeras
// (neón, cantante, medidores, reproducción en el ordenador, polvo en la luz) y se ajusta la
// calidad sola si el dispositivo va justo.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Person = { id?: string; name: string; handle?: string; avatar_url?: string | null; accent?: string };
export type Album = { id: number; cover: string; title: string };
export type ScreenAction = "enter" | "google" | "email" | "profile" | "messages" | "friends" | "explore" | `person:${string}` | `album:${string}`;
export type ScreenInfo = {
  me: (Person & { handle?: string }) | null;
  friends: (Person & { online: boolean })[];
  top4: Album[];
  online: Person[]; // otras personas conectadas (sin ti)
  onlineCount: number;
  labels: {
    online: string; onlineNow: string; you: string; google: string; email: string; enter: string;
    messages: string; friends: string; explore: string; nobody: string; top4: string; noFriends: string; profile: string; hi: string;
  };
  bg: string;
};

const ACC = "#a77bff"; // morado de Rela
const proxied = (u: string) => (u.startsWith("/") ? u : `/api/img?u=${encodeURIComponent(u)}`);
const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImg(src: string) {
  if (!imgCache.has(src)) imgCache.set(src, new Promise((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = proxied(src); }));
  return imgCache.get(src)!;
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};
// Ruido determinista (mismo estudio en cada visita)
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/* ---------- Texturas del estudio ---------- */
const foamTex = () => canvasTex(256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const vertical = (x + y) % 2 === 0;
    for (let k = 0; k < 4; k++) {
      const gr = vertical ? g.createLinearGradient(x * 64 + k * 16, 0, x * 64 + k * 16 + 16, 0) : g.createLinearGradient(0, y * 64 + k * 16, 0, y * 64 + k * 16 + 16);
      gr.addColorStop(0, "#221e29"); gr.addColorStop(0.5, "#332d3d"); gr.addColorStop(1, "#121017");
      g.fillStyle = gr;
      if (vertical) g.fillRect(x * 64 + k * 16, y * 64, 16, 64); else g.fillRect(x * 64, y * 64 + k * 16, 64, 16);
    }
  }
}, [8, 3]);
/** Listones de madera oscura (pared del fondo). */
const slatTex = () => canvasTex(512, 256, (g) => {
  g.fillStyle = "#0b090d"; g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 32; i++) {
    const x = i * 16, gr = g.createLinearGradient(x, 0, x + 12, 0);
    const v = 30 + rnd() * 14; gr.addColorStop(0, `rgb(${v + 10},${v},${v - 4})`); gr.addColorStop(1, `rgb(${v - 8},${v - 14},${v - 16})`);
    g.fillStyle = gr; g.fillRect(x, 0, 12, 256);
  }
}, [6, 1]);
const woodTex = () => canvasTex(1024, 512, (g) => {
  g.fillStyle = "#1c1519"; g.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 220; i++) { g.strokeStyle = `rgba(255,214,190,${rnd() * 0.05})`; g.lineWidth = 1 + rnd() * 2; g.beginPath(); const y = rnd() * 512; g.moveTo(0, y); g.bezierCurveTo(340, y + 8 * (rnd() - 0.5), 680, y - 8 * (rnd() - 0.5), 1024, y + 3); g.stroke(); }
}, [2, 1]);
const floorTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#121015"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.025})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
  g.strokeStyle = "rgba(0,0,0,.5)"; g.lineWidth = 2; g.strokeRect(0, 0, 512, 512);
}, [10, 10]);
const dawTex = () => canvasTex(1024, 576, (g) => {
  g.fillStyle = "#100e13"; g.fillRect(0, 0, 1024, 576);
  g.fillStyle = "#1b1920"; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 40, 170, 536);
  g.fillStyle = "#a77bff"; g.font = "600 18px Figtree, sans-serif"; g.fillText("new_song_v7 · 92 BPM", 190, 27);
  g.fillStyle = "rgba(255,255,255,.4)"; g.fillText("REC ●", 930, 27);
  const cols = ["#a77bff", "#ff6f91", "#2fbfa6", "#ffd23f", "#7d5cff", "#5f9cff", "#c58bff"];
  for (let tr = 0; tr < 7; tr++) {
    const y = 60 + tr * 72, c = cols[tr % cols.length];
    g.fillStyle = c; g.fillRect(12, y + 10, 8, 46); g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(30, y + 22, 90, 8); g.fillRect(30, y + 38, 60, 6);
    let x = 180 + (tr * 37) % 120;
    while (x < 1000) {
      const w = 80 + ((tr * 53 + x) % 170);
      g.fillStyle = c + "38"; g.fillRect(x, y, w, 62); g.strokeStyle = c; g.lineWidth = 1.5; g.beginPath();
      for (let k = 0; k < w; k += 3) { const a = Math.abs(Math.sin((x + k) * 0.13 + tr)) * Math.abs(Math.sin((x + k) * 0.021)) * 26; g.moveTo(x + k, y + 31 - a); g.lineTo(x + k, y + 31 + a); }
      g.stroke(); x += w + 20 + ((tr * 17) % 60);
    }
  }
});
/** Interior de la cabina: luz morada que sale de arriba y de detrás. */
const boothRoomTex = () => canvasTex(256, 256, (g) => {
  const bg = g.createRadialGradient(150, 70, 10, 128, 128, 220); bg.addColorStop(0, "#d6a8ff"); bg.addColorStop(0.4, "#7a33cf"); bg.addColorStop(1, "#1d0b33");
  g.fillStyle = bg; g.fillRect(0, 0, 256, 256);
  g.globalAlpha = 0.18; g.fillStyle = "#000"; for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 14, 256);
});
/** Silueta de quien canta (de perfil hacia el micro), con fondo transparente. */
const singerTex = () => canvasTex(512, 768, (g) => {
  g.fillStyle = "#06040a";
  // cuerpo y hombros
  g.beginPath(); g.moveTo(120, 768); g.bezierCurveTo(110, 560, 170, 470, 260, 455); g.bezierCurveTo(350, 460, 400, 540, 410, 768); g.closePath(); g.fill();
  // cuello y cabeza (mirando a la izquierda, hacia el micro)
  g.beginPath(); g.moveTo(232, 470); g.lineTo(236, 380); g.lineTo(292, 380); g.lineTo(300, 470); g.closePath(); g.fill();
  g.beginPath(); g.ellipse(262, 318, 64, 78, -0.12, 0, 7); g.fill();
  g.beginPath(); g.moveTo(206, 312); g.quadraticCurveTo(186, 330, 198, 352); g.lineTo(214, 350); g.fill(); // nariz y boca
  // pelo
  g.beginPath(); g.ellipse(282, 266, 70, 48, 0.3, Math.PI, Math.PI * 2.1); g.fill();
  // cascos
  g.lineWidth = 15; g.strokeStyle = "#06040a"; g.beginPath(); g.arc(266, 318, 88, Math.PI * 1.05, Math.PI * 1.98); g.stroke();
  g.beginPath(); g.ellipse(300, 326, 30, 42, 0, 0, 7); g.fill();
  // mano en el casco
  g.beginPath(); g.moveTo(360, 560); g.quadraticCurveTo(390, 420, 334, 336); g.lineTo(312, 352); g.quadraticCurveTo(350, 440, 330, 560); g.closePath(); g.fill();
  // contorno iluminado
  g.globalCompositeOperation = "source-atop"; const rim = g.createLinearGradient(160, 0, 300, 0); rim.addColorStop(0, "rgba(230,190,255,.55)"); rim.addColorStop(0.25, "rgba(230,190,255,0)"); g.fillStyle = rim; g.fillRect(0, 0, 512, 768);
});
/** Neón "for real music lovers": tubo fino + halo. */
const neonCanvas = async (text: string, sub: string) => {
  try { await Promise.all([document.fonts.load("italic 500 120px Fraunces"), document.fonts.load("600 40px Figtree")]); } catch { /* sin fuentes: serif por defecto */ }
  const c = document.createElement("canvas"); c.width = 1400; c.height = 420;
  const g = c.getContext("2d")!;
  g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round";
  const line = (font: string, y: number, glow: string, core: string, width: number, txt: string) => {
    g.font = font;
    for (const [blur, alpha, lw] of [[48, 0.55, width * 3], [22, 0.8, width * 1.6], [8, 1, width]] as const) {
      g.shadowColor = glow; g.shadowBlur = blur; g.globalAlpha = alpha; g.strokeStyle = glow; g.lineWidth = lw; g.strokeText(txt, 700, y);
    }
    g.shadowBlur = 0; g.globalAlpha = 1; g.strokeStyle = core; g.lineWidth = width * 0.45; g.strokeText(txt, 700, y);
  };
  line("italic 500 128px Fraunces, Georgia, serif", 170, "#b67cff", "#fbf4ff", 4.2, text);
  line("600 34px Figtree, Arial, sans-serif", 318, "#ff7ab6", "#ffe6f1", 2.2, sub.split("").join(String.fromCharCode(8202)));
  return c;
};
/* ---------- Pantalla del móvil ---------- */
type Hit = { x: number; y: number; w: number; h: number; action: ScreenAction };
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fitText(g: CanvasRenderingContext2D, t: string, max: number) { let s = t; while (g.measureText(s).width > max && s.length > 2) s = s.slice(0, -2); return s === t ? s : s + "…"; }

async function drawScreen(g: CanvasRenderingContext2D, info: ScreenInfo): Promise<Hit[]> {
  const W = g.canvas.width, H = g.canvas.height, hits: Hit[] = [];
  const me = info.me;
  const meImg = me?.avatar_url ? await loadImg(me.avatar_url) : null;
  const covers = await Promise.all(info.top4.slice(0, 4).map((a) => loadImg(a.cover)));
  const friends = info.friends.slice(0, 4);
  const friendImgs = await Promise.all(friends.map((p) => (p.avatar_url ? loadImg(p.avatar_url) : Promise.resolve(null))));
  const people = info.online.slice(0, 4);
  const peopleImgs = await Promise.all(people.map((p) => (p.avatar_url ? loadImg(p.avatar_url) : Promise.resolve(null))));

  g.clearRect(0, 0, W, H);
  g.save(); roundRect(g, 0, 0, W, H, 78); g.clip();
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#2c1a45"); bg.addColorStop(0.55, "#17111f"); bg.addColorStop(1, "#0f0b14"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 1.1); glow.addColorStop(0, "rgba(167,123,255,.45)"); glow.addColorStop(1, "rgba(167,123,255,0)"); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "#000"; roundRect(g, W / 2 - 78, 24, 156, 44, 22); g.fill();
  g.fillStyle = "#f5f0fb"; g.font = "600 28px Figtree, sans-serif"; g.textAlign = "left"; g.fillText("9:41", 50, 58);
  g.textAlign = "right"; g.fillText("▮▮▮", W - 46, 58); g.textAlign = "left";

  const avatar = (x: number, y: number, size: number, img: HTMLImageElement | null, name: string, accent?: string, round = true) => {
    g.save(); if (round) { g.beginPath(); g.arc(x + size / 2, y + size / 2, size / 2, 0, 7); } else roundRect(g, x, y, size, size, size * 0.25); g.clip();
    if (img) g.drawImage(img, x, y, size, size);
    else { g.fillStyle = accent ?? "#6a5c7a"; g.fillRect(x, y, size, size); g.fillStyle = "#1b1424"; g.font = `700 ${size * 0.48}px Fraunces, Georgia, serif`; g.textAlign = "center"; g.fillText((name || "?")[0].toUpperCase(), x + size / 2, y + size * 0.66); g.textAlign = "left"; }
    g.restore();
  };
  const greenDot = (x: number, y: number, r = 9) => { g.fillStyle = "#17111f"; g.beginPath(); g.arc(x, y, r + 5, 0, 7); g.fill(); g.fillStyle = "#5fd39b"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const section = (y: number, text: string) => { g.fillStyle = "rgba(245,240,251,.55)"; g.font = "700 20px Figtree, sans-serif"; g.fillText(text.toUpperCase(), 44, y); };
  const onlinePill = (x: number, y: number) => {
    g.font = "700 22px Figtree, sans-serif"; const w = g.measureText(info.labels.online).width + 58;
    g.fillStyle = "rgba(95,211,155,.16)"; roundRect(g, x - w, y, w, 44, 22); g.fill();
    g.fillStyle = "#5fd39b"; g.beginPath(); g.arc(x - w + 24, y + 22, 7, 0, 7); g.fill();
    g.fillStyle = "#c9f2dc"; g.fillText(info.labels.online, x - w + 40, y + 30);
  };

  if (me) {
    avatar(44, 100, 92, meImg, me.name, me.accent);
    g.strokeStyle = me.accent ?? ACC; g.lineWidth = 5; g.beginPath(); g.arc(90, 146, 51, 0, 7); g.stroke();
    hits.push({ x: 40, y: 96, w: 300, h: 100, action: "profile" });
    g.fillStyle = "#f5f0fb"; g.font = "600 40px Fraunces, Georgia, serif"; g.fillText(fitText(g, info.labels.hi, W - 380), 156, 140);
    g.fillStyle = "rgba(245,240,251,.6)"; g.font = "500 24px Figtree, sans-serif"; g.fillText(`@${me.handle ?? ""}`, 158, 174);
    onlinePill(W - 40, 210);

    let y = 290; section(y, info.labels.top4);
    const cs = (W - 88 - 3 * 16) / 4;
    for (let i = 0; i < 4; i++) {
      const x = 44 + i * (cs + 16), yy = y + 18, img = covers[i], alb = info.top4[i];
      g.save(); roundRect(g, x, yy, cs, cs, 14); g.clip();
      if (img) g.drawImage(img, x, yy, cs, cs); else { g.fillStyle = "rgba(255,255,255,.08)"; g.fillRect(x, yy, cs, cs); g.fillStyle = "rgba(245,240,251,.35)"; g.font = "600 40px Figtree, sans-serif"; g.textAlign = "center"; g.fillText("+", x + cs / 2, yy + cs / 2 + 14); g.textAlign = "left"; }
      g.restore();
      g.fillStyle = ACC; g.beginPath(); g.arc(x + 20, yy + 20, 15, 0, 7); g.fill(); g.fillStyle = "#1b1424"; g.font = "700 18px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(String(i + 1), x + 20, yy + 26); g.textAlign = "left";
      hits.push({ x, y: yy, w: cs, h: cs, action: alb ? `album:${alb.id}` : "profile" });
    }

    y = y + cs + 72; section(y, info.labels.friends);
    y += 16;
    if (!friends.length) {
      g.fillStyle = "rgba(255,255,255,.07)"; roundRect(g, 36, y, W - 72, 92, 26); g.fill();
      g.fillStyle = "rgba(245,240,251,.6)"; g.font = "500 22px Figtree, sans-serif"; g.fillText(fitText(g, info.labels.noFriends, W - 130), 66, y + 54);
      hits.push({ x: 36, y, w: W - 72, h: 92, action: "friends" });
      y += 110;
    }
    friends.forEach((f, i) => {
      const ry = y + i * 92;
      g.fillStyle = "rgba(255,255,255,.07)"; roundRect(g, 36, ry, W - 72, 80, 24); g.fill();
      avatar(52, ry + 12, 56, friendImgs[i], f.name, f.accent);
      if (f.online) greenDot(52 + 50, ry + 18, 7);
      g.fillStyle = "#f5f0fb"; g.font = "600 25px Figtree, sans-serif"; g.fillText(fitText(g, f.name, W - 260), 126, ry + 38);
      g.fillStyle = "rgba(245,240,251,.55)"; g.font = "500 20px Figtree, sans-serif"; g.fillText(fitText(g, `@${f.handle ?? ""}`, W - 260), 126, ry + 64);
      g.fillStyle = "rgba(245,240,251,.4)"; g.font = "600 30px Figtree, sans-serif"; g.fillText("›", W - 70, ry + 50);
      if (f.handle) hits.push({ x: 36, y: ry, w: W - 72, h: 80, action: `person:${f.handle}` });
    });
    y += friends.length * 92 + 8;

    const qs: [string, string, string, ScreenAction][] = [["✉", info.labels.messages, "#5f6fd6", "messages"], ["♫", info.labels.explore, "#8b5cf6", "explore"], ["☺", info.labels.friends, "#2f8a7f", "friends"], ["◎", info.labels.profile, "#c2479b", "profile"]];
    const qw = (W - 72 - 3 * 14) / 4;
    if (y + 110 < H - 210) qs.forEach(([ic, lb, c, a], i) => {
      const x = 36 + i * (qw + 14);
      g.fillStyle = c; roundRect(g, x, y, qw, 100, 24); g.fill(); g.fillStyle = "rgba(255,255,255,.16)"; roundRect(g, x, y, qw, 50, 24); g.fill();
      g.fillStyle = "#fff"; g.font = "600 34px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(ic, x + qw / 2, y + 48);
      g.font = "600 18px Figtree, sans-serif"; g.fillText(fitText(g, lb, qw - 10), x + qw / 2, y + 82); g.textAlign = "left";
      hits.push({ x, y, w: qw, h: 100, action: a });
    });
  } else {
    g.fillStyle = "#f5f0fb"; g.font = "600 52px Fraunces, Georgia, serif"; g.fillText("Rela", 48, 150);
    onlinePill(W - 40, 112);
    const s = 112, gap = (W - 72 - 4 * s) / 3;
    const tile = (i: number, draw: (x: number, y: number) => void, label: string, a: ScreenAction) => {
      const x = 36 + i * (s + gap), y = 220; draw(x, y);
      g.fillStyle = "rgba(245,240,251,.9)"; g.font = "500 21px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(fitText(g, label, s + gap - 6), x + s / 2, y + s + 30); g.textAlign = "left";
      hits.push({ x, y, w: s, h: s, action: a });
    };
    tile(0, (x, y) => {
      g.fillStyle = "#fff"; roundRect(g, x, y, s, s, 28); g.fill();
      const cx = x + s / 2, cy = y + s / 2, r = 32;
      ([["#EA4335", -2.4, -0.7], ["#FBBC05", -0.7 - Math.PI, -2.4], ["#34A853", 0.7, 2.45], ["#4285F4", -0.05, 0.7]] as const).forEach(([c, a0, a1]) => { g.strokeStyle = c; g.lineWidth = 15; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); });
      g.fillStyle = "#4285F4"; g.fillRect(cx, cy - 7.5, r + 7, 15);
    }, info.labels.google, "google");
    const plain = (c1: string, ch: string) => (x: number, y: number) => { g.fillStyle = c1; roundRect(g, x, y, s, s, 28); g.fill(); g.fillStyle = "rgba(255,255,255,.16)"; roundRect(g, x, y, s, s / 2, 28); g.fill(); g.fillStyle = "#fff"; g.font = "600 52px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(ch, x + s / 2, y + s / 2 + 19); g.textAlign = "left"; };
    tile(1, plain("#6a5c7a", "@"), info.labels.email, "email");
    tile(2, plain("#8b5cf6", "♫"), info.labels.explore, "explore");
    tile(3, plain("#2f8a7f", "☺"), info.labels.friends, "friends");
    let y = 430; section(y, info.labels.onlineNow); y += 18;
    if (!people.length) { g.fillStyle = "rgba(245,240,251,.45)"; g.font = "500 22px Figtree, sans-serif"; g.fillText(info.labels.nobody, 44, y + 40); y += 70; }
    people.forEach((p, i) => {
      const x = 36 + i * (s + gap);
      avatar(x, y, s, peopleImgs[i], p.name, p.accent, false); greenDot(x + s - 8, y + 8);
      g.fillStyle = "rgba(245,240,251,.9)"; g.font = "500 21px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(fitText(g, p.name || "Rela", s + gap - 6), x + s / 2, y + s + 30); g.textAlign = "left";
      if (p.handle) hits.push({ x, y, w: s, h: s, action: `person:${p.handle}` });
    });
  }

  const dy = H - 196;
  g.fillStyle = "rgba(255,255,255,.12)"; roundRect(g, 32, dy, W - 64, 156, 50); g.fill();
  const ix = W / 2 - 62, iy = dy + 18;
  const grd = g.createLinearGradient(ix, iy, ix + 124, iy + 124); grd.addColorStop(0, "#c4a6ff"); grd.addColorStop(1, "#7c4dea");
  g.fillStyle = grd; roundRect(g, ix, iy, 124, 120, 30); g.fill();
  g.strokeStyle = "#FFD23F"; g.lineWidth = 11; g.lineCap = "round"; g.beginPath(); g.arc(W / 2, iy + 66, 32, Math.PI, 0); g.stroke();
  g.fillStyle = "#FFD23F"; roundRect(g, W / 2 - 44, iy + 58, 20, 34, 10); g.fill(); roundRect(g, W / 2 + 24, iy + 58, 20, 34, 10); g.fill();
  g.strokeStyle = "#1b1424"; g.lineWidth = 3; roundRect(g, W / 2 - 44, iy + 58, 20, 34, 10); g.stroke(); roundRect(g, W / 2 + 24, iy + 58, 20, 34, 10); g.stroke();
  hits.push({ x: 32, y: dy, w: W - 64, h: 156, action: "enter" });
  g.restore();
  return hits;
}


/* ---------- Escena ---------- */
export function createScene(container: HTMLElement, initial: ScreenInfo, onAction: (a: ScreenAction) => void) {
  let info = initial;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  let dpr = Math.min(maxDpr, 1.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const BG = "#08060b";
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.FogExp2(BG, 0.045);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.2;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);

  /* Medidas: la mesa está en y=0, el suelo en y=-1.15, el techo en y=4.6 */
  const FLOOR = -1.15, CEIL = 5.2, BACK = -13.5;

  /* Luces (pocas: cuesta poco en móviles) */
  scene.add(new THREE.HemisphereLight("#d9c6ff", "#0c0812", 0.22));
  const fill = new THREE.DirectionalLight("#cdb8ff", 0.35); fill.position.set(-3, 6, 5); scene.add(fill);
  const spot = new THREE.SpotLight("#f7f1ff", 70, 10, 0.36, 0.7, 1.4); spot.position.set(0.6, 4.4, 3.6); scene.add(spot, spot.target);
  const boothLight = new THREE.PointLight("#a64dff", 22, 9, 1.5); boothLight.position.set(-4.3, 2.2, -9.9); scene.add(boothLight);
  const neonLight = new THREE.PointLight("#c58bff", 8, 6, 1.6); neonLight.position.set(-4.3, 3.9, -9.2); scene.add(neonLight);
  const lamp = new THREE.PointLight("#ffb070", 6, 7, 1.6); lamp.position.set(4.9, 1.3, -11.0); scene.add(lamp);
  const screenGlow = new THREE.PointLight("#9fa8ff", 3, 4.5, 2); screenGlow.position.set(2.0, 0.9, -0.6); scene.add(screenGlow);

  const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,.35)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const blobTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,.9)"); r.addColorStop(0.55, "rgba(0,0,0,.4)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const blob = (w: number, h: number, x: number, z: number, y = 0.004, rot = 0, opacity = 0.6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
    m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y, z); scene.add(m);
  };
  /** Halo luminoso falso (sustituye al bloom, que es caro). */
  const halo = (color: string, size: number, pos: THREE.Vector3, opacity = 0.5) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
    s.scale.set(size, size, 1); s.position.copy(pos); scene.add(s); return s;
  };
  /** Haz de luz volumétrico falso (cono aditivo). */
  const beamTex = canvasTex(64, 256, (g) => { const r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, "rgba(255,255,255,.55)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 256); });
  const beam = (color: string, top: THREE.Vector3, bottom: THREE.Vector3, r0: number, r1: number, opacity: number) => {
    const len = top.distanceTo(bottom);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, len, 32, 1, true), new THREE.MeshBasicMaterial({ map: beamTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.position.copy(top).add(bottom).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), top.clone().sub(bottom).normalize());
    scene.add(m); return m;
  };

  /* ===== Sala amplia ===== */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.32, metalness: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, -4); scene.add(floor);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 48), new THREE.MeshStandardMaterial({ color: "#241a2e", roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.scale.y = 0.6; rug.position.set(2.4, FLOOR + 0.005, -10.2); scene.add(rug);
  const foamMat = new THREE.MeshStandardMaterial({ map: foamTex(), roughness: 1 });
  const slatMat = new THREE.MeshStandardMaterial({ map: slatTex(), roughness: 0.75 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(22, CEIL - FLOOR), slatMat); back.position.set(0, (CEIL + FLOOR) / 2, BACK); scene.add(back);
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(21, CEIL - FLOOR), foamMat); sideL.rotation.y = Math.PI / 2; sideL.position.set(-7.5, (CEIL + FLOOR) / 2, -4.5); scene.add(sideL);
  const sideR = sideL.clone(); sideR.rotation.y = -Math.PI / 2; sideR.position.x = 7.5; scene.add(sideR);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(22, 21), new THREE.MeshStandardMaterial({ color: "#0c0a0f", roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, CEIL, -4.5); scene.add(ceil);
  // Tiras de luz en el techo, perdiéndose al fondo (dan profundidad)
  const stripMat = new THREE.MeshBasicMaterial({ color: "#4a3d63", toneMapped: false });
  [-3.2, 3.2].forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 16), stripMat); s.position.set(x, CEIL - 0.02, -5.5); scene.add(s); });
  // Tira LED morada a ras de suelo en la pared del fondo
  const floorLed = new THREE.Mesh(new THREE.BoxGeometry(20, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: ACC, toneMapped: false })); floorLed.position.set(0, FLOOR + 0.05, BACK + 0.05); scene.add(floorLed);

  /* ===== Cabina de voz elevada, al fondo a la izquierda ===== */
  const BX = -4.3, BZ = -9.6, BY = 0.35; // centro de la cabina, frente de cristal en BZ, suelo de la cabina en BY
  const stage = new THREE.Mesh(new THREE.BoxGeometry(4.8, BY - FLOOR, 3.4), new THREE.MeshStandardMaterial({ color: "#121016", roughness: 0.6 }));
  stage.position.set(BX, (BY + FLOOR) / 2, BZ - 1.4); scene.add(stage);
  const stageLed = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.025, 0.025), new THREE.MeshBasicMaterial({ color: ACC, toneMapped: false })); stageLed.position.set(BX, BY - 0.02, BZ + 0.31); scene.add(stageLed);
  [[1, 0.75], [0.5, 1.15]].forEach(([k, dz]) => { const hgt = (BY - FLOOR) * k; const st = new THREE.Mesh(new THREE.BoxGeometry(1.3, hgt, 0.4), stage.material); st.position.set(BX + 1.5, FLOOR + hgt / 2, BZ + dz - 0.4); scene.add(st); });
  // Interior iluminado
  const roomMat = new THREE.MeshBasicMaterial({ map: boothRoomTex(), side: THREE.BackSide, toneMapped: false, color: "#b9a3cc", fog: false });
  const roomBox = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 2.6), roomMat); roomBox.position.set(BX, BY + 1.6, BZ - 1.32); scene.add(roomBox);
  // Fachada con ventana
  const wallMat = new THREE.MeshStandardMaterial({ color: "#16131b", roughness: 0.7 });
  const WIN = { x0: BX - 1.5, x1: BX + 1.5, y0: BY + 0.75, y1: BY + 2.55 }, FX0 = BX - 2.4, FX1 = BX + 2.4, FY1 = BY + 3.6;
  const panel = (x0: number, x1: number, y0: number, y1: number) => { const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.18), wallMat); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, BZ); scene.add(m); };
  panel(FX0, FX1, BY, WIN.y0); panel(FX0, FX1, WIN.y1, FY1); panel(FX0, WIN.x0, WIN.y0, WIN.y1); panel(WIN.x1, FX1, WIN.y0, WIN.y1);
  const frameMat = new THREE.MeshStandardMaterial({ color: "#0d0b10", roughness: 0.35, metalness: 0.6 });
  [[0, WIN.y1, 3.1, 0.06], [0, WIN.y0, 3.1, 0.06], [-1.53, (WIN.y0 + WIN.y1) / 2, 0.06, 1.86], [1.53, (WIN.y0 + WIN.y1) / 2, 0.06, 1.86]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.22), frameMat); f.position.set(BX + x, y, BZ + 0.01); scene.add(f); });
  // Cristal con un reflejo diagonal
  const glassTex = canvasTex(256, 160, (g) => { g.fillStyle = "rgba(255,255,255,0)"; g.fillRect(0, 0, 256, 160); const r = g.createLinearGradient(0, 0, 256, 160); r.addColorStop(0.18, "rgba(255,255,255,0)"); r.addColorStop(0.26, "rgba(255,255,255,.22)"); r.addColorStop(0.32, "rgba(255,255,255,0)"); r.addColorStop(0.5, "rgba(255,255,255,0)"); r.addColorStop(0.55, "rgba(255,255,255,.1)"); r.addColorStop(0.6, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 160); });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.8), new THREE.MeshBasicMaterial({ map: glassTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8 }));
  glass.position.set(BX, (WIN.y0 + WIN.y1) / 2, BZ + 0.1); scene.add(glass);
  // Quien canta: silueta a contraluz que se balancea al ritmo
  const singerPivot = new THREE.Group(); singerPivot.position.set(BX + 0.35, BY, BZ - 1.15); scene.add(singerPivot);
  const singer = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 2.18), new THREE.MeshBasicMaterial({ map: singerTex(), transparent: true, toneMapped: false, fog: false, depthWrite: false }));
  singer.position.y = 1.09; singerPivot.add(singer);
  // Micro con antipop
  const micMat = new THREE.MeshBasicMaterial({ color: "#07050a", fog: false });
  const micStand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), micMat); micStand.position.set(BX - 0.55, BY + 0.85, BZ - 0.8); scene.add(micStand);
  const micArm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 8), micMat); micArm.rotation.z = Math.PI / 2.6; micArm.position.set(BX - 0.38, BY + 1.72, BZ - 0.85); scene.add(micArm);
  const mic = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.16, 4, 10), micMat); mic.rotation.z = Math.PI / 2; mic.position.set(BX - 0.18, BY + 1.62, BZ - 0.88); scene.add(mic);
  const pop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 24), micMat); pop.rotation.y = Math.PI / 2; pop.position.set(BX - 0.02, BY + 1.62, BZ - 0.9); scene.add(pop);
  const boothHalo = halo("#a64dff", 6.5, new THREE.Vector3(BX, BY + 1.7, BZ + 0.3), 0.32);
  const boothBeam = beam("#b57dff", new THREE.Vector3(BX - 0.2, BY + 3.0, BZ - 1.0), new THREE.Vector3(BX + 0.3, BY + 0.1, BZ - 1.1), 0.25, 1.1, 0.13);

  /* Neón "for real music lovers" encima de la cabina */
  const neonTex = new THREE.CanvasTexture(document.createElement("canvas")); neonTex.colorSpace = THREE.SRGBColorSpace;
  const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.26), neonMat); neon.position.set(BX, FY1 - 0.5, BZ + 0.11); scene.add(neon);
  const neonHalo = halo("#b67cff", 5.4, new THREE.Vector3(BX, FY1 - 0.55, BZ + 0.2), 0);
  neonCanvas("for real music lovers", "RELA MUSIC").then((c) => { neonTex.image = c; neonTex.needsUpdate = true; kick(); });

  /* Fondo: sofá, guitarra, lámpara y estanterías de vinilos (siluetas con poca luz) */
  const darkMat = new THREE.MeshStandardMaterial({ color: "#1a1620", roughness: 0.8 });
  const sofa = new THREE.Group();
  const seat = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.45, 1.0, 3, 0.12), darkMat); seat.position.y = 0.32; sofa.add(seat);
  const backrest = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.8, 0.3, 3, 0.12), darkMat); backrest.position.set(0, 0.75, -0.38); sofa.add(backrest);
  [-1.45, 1.45].forEach((x) => { const arm = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.6, 1.0, 3, 0.1), darkMat); arm.position.set(x, 0.48, 0); sofa.add(arm); });
  sofa.position.set(2.5, FLOOR, -12.2); scene.add(sofa);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8), frameMat); lampPole.position.set(4.9, FLOOR + 1.1, -12.0); scene.add(lampPole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.36, 24, 1, true), new THREE.MeshBasicMaterial({ color: "#ffb36b", side: THREE.DoubleSide, toneMapped: false }));
  shade.position.set(4.9, FLOOR + 2.25, -12.0); scene.add(shade);
  halo("#ffa45c", 2.6, new THREE.Vector3(4.9, FLOOR + 2.25, -11.9), 0.35);
  // Guitarra en su soporte
  const guitar = new THREE.Group();
  const gBody = new THREE.Mesh(new THREE.LatheGeometry([0, 0.2, 0.3, 0.32, 0.26, 0.2, 0.24, 0.27, 0.22, 0.1, 0].map((r, i) => new THREE.Vector2(r, i * 0.09)), 24), new THREE.MeshStandardMaterial({ color: "#5a2a1c", roughness: 0.35, metalness: 0.1 }));
  gBody.scale.z = 0.3; guitar.add(gBody);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.0, 0.04), darkMat); neck.position.y = 1.35; guitar.add(neck);
  guitar.position.set(0.4, FLOOR + 0.15, -12.9); guitar.rotation.z = 0.12; scene.add(guitar);
  // Estantería con vinilos
  const shelf = new THREE.Group();
  for (let r = 0; r < 3; r++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.4), frameMat); board.position.y = r * 0.55; shelf.add(board);
    for (let k = 0; k < 14; k++) { const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.42, 0.38), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.72 + rnd() * 0.25, 0.4, 0.12 + rnd() * 0.18), roughness: 0.7 })); sleeve.position.set(-1.1 + k * 0.16 + rnd() * 0.03, r * 0.55 + 0.23, 0); sleeve.rotation.z = (rnd() - 0.5) * 0.12; shelf.add(sleeve); }
  }
  shelf.position.set(-0.6, FLOOR + 0.6, BACK + 0.25); scene.add(shelf);

  /* Polvo flotando en la luz */
  const dustN = 260, dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (rnd() - 0.5) * 12; dustPos[i * 3 + 1] = FLOOR + rnd() * 5.5; dustPos[i * 3 + 2] = -1 - rnd() * 11; }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: glowTex, color: "#d8c2ff", size: 0.05, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(dust);

  /* ===== Mesa de producción ===== */
  const desk = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.14, 3.6), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.42, metalness: 0.08 }));
  desk.position.set(0, -0.07, 0.6); scene.add(desk);
  const deskEdge = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: ACC, toneMapped: false })); deskEdge.position.set(0, -0.15, -1.2); scene.add(deskEdge);
  [-3.4, 3.4].forEach((x) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 3.2), frameMat); leg.position.set(x, -0.65, 0.6); scene.add(leg); });

  // Controlador / mesa de mezclas con medidores que se mueven
  const mixer = new THREE.Group();
  const mixBody = new THREE.Mesh(new RoundedBoxGeometry(3.0, 0.12, 0.95, 2, 0.03), new THREE.MeshStandardMaterial({ color: "#151319", roughness: 0.4, metalness: 0.5 }));
  mixBody.position.y = 0.06; mixer.add(mixBody);
  const ch = 16, knobGeo = new THREE.CylinderGeometry(0.03, 0.035, 0.045, 12), faderGeo = new THREE.BoxGeometry(0.06, 0.035, 0.1);
  const knobs = new THREE.InstancedMesh(knobGeo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 }), ch * 3);
  const faders = new THREE.InstancedMesh(faderGeo, new THREE.MeshStandardMaterial({ color: "#d9d6dd", roughness: 0.3, metalness: 0.6 }), ch);
  const meters = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 1, 0.012), new THREE.MeshBasicMaterial({ toneMapped: false }), ch);
  const m4 = new THREE.Matrix4(), colorsK = ["#a77bff", "#ff6f91", "#2fbfa6"].map((c) => new THREE.Color(c));
  const chX = (i: number) => -1.35 + i * (2.7 / (ch - 1));
  for (let i = 0; i < ch; i++) {
    for (let r = 0; r < 3; r++) { m4.makeTranslation(chX(i), 0.14, -0.3 + r * 0.14); knobs.setMatrixAt(i * 3 + r, m4); knobs.setColorAt(i * 3 + r, colorsK[r]); }
    m4.makeTranslation(chX(i), 0.135, 0.3 - ((i * 7) % 5) * 0.04); faders.setMatrixAt(i, m4);
    meters.setColorAt(i, new THREE.Color(i % 5 === 4 ? "#ffd23f" : "#5fd39b"));
  }
  for (let i = 0; i < ch; i++) { m4.makeScale(1, 0.1, 1).setPosition(chX(i), 0.17, -0.46); meters.setMatrixAt(i, m4); }
  mixer.add(knobs, faders, meters);
  mixer.position.set(0, 0, -0.55); scene.add(mixer); blob(3.6, 1.5, 0, -0.55, 0.004, 0, 0.5);

  // Pantalla del ordenador con la canción produciéndose
  const daw = new THREE.Group();
  const dawScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.07), new THREE.MeshBasicMaterial({ map: dawTex(), toneMapped: false, color: "#c9c2d2" }));
  daw.add(dawScreen);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.17, 0.06, 2, 0.02), frameMat); bezel.position.z = -0.035; daw.add(bezel);
  const dstand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.06), frameMat); dstand.position.set(0, -0.78, -0.07); daw.add(dstand);
  const playhead = new THREE.Mesh(new THREE.PlaneGeometry(0.006, 0.98), new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false })); playhead.position.set(0, -0.02, 0.002); daw.add(playhead);
  daw.position.set(2.15, 1.05, -0.95); daw.rotation.y = -0.38; scene.add(daw);
  halo("#8e8cff", 3.2, new THREE.Vector3(2.15, 1.05, -1.0), 0.12);

  // Monitores de estudio
  const speakerMat = new THREE.MeshStandardMaterial({ color: "#121014", roughness: 0.45, metalness: 0.2 });
  const coneMat = new THREE.MeshStandardMaterial({ color: "#2a272e", roughness: 0.35, metalness: 0.4 });
  const ringMat = new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.4, emissive: "#5a2fb0", emissiveIntensity: 0.6 });
  const woofers: THREE.Mesh[] = [];
  [[-3.0, 0.35], [3.2, -0.5]].forEach(([x, ry]) => {
    const sp = new THREE.Group();
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.95, 0.66, 3, 0.05), speakerMat); box.position.y = 0.475; sp.add(box);
    const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.05, 32), coneMat); woofer.rotation.x = Math.PI / 2; woofer.position.set(0, 0.32, 0.34); sp.add(woofer); woofers.push(woofer);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.02, 8, 32), ringMat); ring.position.set(0, 0.32, 0.35); sp.add(ring);
    const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.04, 24), coneMat); tweeter.rotation.x = Math.PI / 2; tweeter.position.set(0, 0.73, 0.34); sp.add(tweeter);
    sp.position.set(x, 0, -0.8); sp.rotation.y = ry; scene.add(sp); blob(1.0, 1.0, x, -0.75, 0.004, 0, 0.55);
  });

  /* ===== Objetos cercanos ===== */
  const matte = new THREE.MeshStandardMaterial({ color: "#1a181d", roughness: 0.42, metalness: 0.15 });
  const leather = new THREE.MeshStandardMaterial({ color: "#2a252c", roughness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: "#d4d0da", roughness: 0.2, metalness: 1 });
  const accent = new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.35, metalness: 0.3, emissive: "#3a1a70", emissiveIntensity: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#121113", roughness: 0.55 });

  /* Cascos de cerca, a la izquierda */
  const phones = new THREE.Group(), bandR = 0.9;
  const bandGroup = new THREE.Group();
  bandGroup.add(new THREE.Mesh(new THREE.TorusGeometry(bandR, 0.06, 20, 96, Math.PI), matte));
  const pad = new THREE.Mesh(new THREE.TorusGeometry(bandR - 0.045, 0.09, 20, 80, Math.PI * 0.62), leather); pad.rotation.z = Math.PI * 0.19; bandGroup.add(pad);
  const stitch = new THREE.Mesh(new THREE.TorusGeometry(bandR + 0.025, 0.01, 6, 80, Math.PI * 0.62), metal); stitch.rotation.z = Math.PI * 0.19; bandGroup.add(stitch);
  bandGroup.rotation.x = -Math.PI / 2; bandGroup.position.y = 0.29; phones.add(bandGroup);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Group();
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.024, 10, 48, Math.PI), metal); yoke.rotation.x = -Math.PI / 2; yoke.position.set(0, 0.29, 0.04); yoke.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.42, 0.26, 64), matte); shell.scale.z = 1.22; shell.position.y = 0.19;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.39, 64, 16, 0, Math.PI * 2, 0, Math.PI / 2), matte); cap.scale.set(1, 0.18, 1.22); cap.position.y = 0.32;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.018, 8, 72), metal); ring.rotation.x = Math.PI / 2; ring.scale.y = 1.22; ring.position.y = 0.32;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 32), accent); dot.position.y = 0.39;
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.095, 16, 64), leather); cushion.rotation.x = Math.PI / 2; cushion.scale.y = 1.2; cushion.position.y = 0.08;
    cup.add(yoke, shell, cap, ring, dot, cushion); cup.position.set(side * bandR, 0, 0); phones.add(cup);
  });
  phones.scale.setScalar(0.66); phones.position.set(-1.4, 0, 0.95); phones.rotation.y = 0.5; scene.add(phones); blob(1.9, 1.3, -1.35, 1.0, 0.004, -0.5, 0.6);

  /* Móvil de pie en su soporte, bajo el foco */
  const phone = new THREE.Group();
  const PW = 0.88, PL = 1.84, PT = 0.07, TILT = 1.12; // inclinación desde la horizontal
  const body = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PL, 6, 0.14), new THREE.MeshStandardMaterial({ color: "#1d1b21", metalness: 0.85, roughness: 0.2 }));
  body.position.y = PT / 2; phone.add(body);
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 640; screenCanvas.height = Math.round(640 * (PL - 0.08) / (PW - 0.06));
  const sg = screenCanvas.getContext("2d")!;
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.06, PL - 0.08), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.y = PT + 0.002; phone.add(screen);
  const glassTop = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.04, PL - 0.04), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.07, roughness: 0.04, metalness: 0.3, color: "#ffffff" }));
  glassTop.rotation.x = -Math.PI / 2; glassTop.position.y = PT + 0.004; phone.add(glassTop);
  const fadeMat = new THREE.MeshBasicMaterial({ color: info.bg, transparent: true, opacity: 0, toneMapped: false });
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.06, PL - 0.08), fadeMat); fade.rotation.x = -Math.PI / 2; fade.position.y = PT + 0.006; phone.add(fade);
  const PZ = 0.7, lift = Math.sin(TILT) * PL / 2 + 0.06;
  phone.position.set(0, lift, PZ); phone.rotation.x = TILT; scene.add(phone);
  // Soporte
  const dockMat = new THREE.MeshStandardMaterial({ color: "#26232b", roughness: 0.3, metalness: 0.7 });
  const dockBase = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.05, 0.7, 2, 0.02), dockMat); dockBase.position.set(0, 0.025, PZ + 0.05); scene.add(dockBase);
  const bottomZ = PZ + Math.cos(TILT) * PL / 2;
  [-0.32, 0.32].forEach((x) => { const lip = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.1, 0.12, 2, 0.03), dockMat); lip.position.set(x, 0.08, bottomZ + 0.06); scene.add(lip); });
  phone.updateMatrixWorld();
  const pNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(phone.quaternion), pTop = new THREE.Vector3(0, 0, -1).applyQuaternion(phone.quaternion);
  const dockBack = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.95, 0.05, 2, 0.02), dockMat); dockBack.rotation.x = TILT - Math.PI / 2;
  dockBack.position.copy(phone.position).addScaledVector(pNormal, -0.06).addScaledVector(pTop, -0.42); scene.add(dockBack);
  blob(1.6, 1.6, 0, PZ + 0.1, 0.004, 0, 0.7);
  phone.updateMatrixWorld();
  spot.target.position.set(0, 0.8, PZ);
  const poolTex = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, "rgba(236,226,255,.3)"); r.addColorStop(1, "rgba(236,226,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.003, PZ + 0.3); scene.add(pool);
  const phoneHalo = halo("#a77bff", 3.4, new THREE.Vector3(0, lift, PZ - 0.25), 0.16);

  /* Cable de los cascos a la base del móvil */
  phones.updateMatrixWorld();
  const from = new THREE.Vector3(bandR, 0.1, 0.48).applyMatrix4(phones.matrixWorld);
  const jack = new THREE.Vector3(0, 0.04, bottomZ + 0.2);
  const curve = new THREE.CatmullRomCurve3([from, new THREE.Vector3(from.x + 0.1, 0.03, from.z + 0.6), new THREE.Vector3(-0.8, 0.028, bottomZ + 0.75), new THREE.Vector3(-0.15, 0.028, bottomZ + 0.55), jack]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.022, 10), rubber));
  const plug = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 16), rubber); plug.rotation.x = Math.PI / 2 - 0.35; plug.position.set(0, 0.07, bottomZ + 0.12); scene.add(plug);

  /* Un vaso de lean (double cup) a la derecha */
  const foam = new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.92 });
  const cupG = new THREE.Group();
  const Hc = 0.95, rb = 0.33, rt = 0.5;
  const prof = [new THREE.Vector2(0, 0), new THREE.Vector2(rb, 0), new THREE.Vector2(rt, Hc), new THREE.Vector2(rt - 0.03, Hc), new THREE.Vector2(rb - 0.03, 0.03), new THREE.Vector2(0, 0.03)];
  const outerCup = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), foam);
  const outerLip = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.004, 0.028, 10, 64), foam); outerLip.rotation.x = Math.PI / 2; outerLip.position.y = Hc;
  const innerCup = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), foam); innerCup.position.y = 0.15;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.008, 0.046, 12, 72), foam); rim.rotation.x = Math.PI / 2; rim.position.y = Hc + 0.15;
  cupG.add(outerCup, outerLip, innerCup, rim);
  const drink = new THREE.Mesh(new THREE.CircleGeometry(rt - 0.05, 64), new THREE.MeshStandardMaterial({ color: "#8a3ad6", emissive: "#4d168f", emissiveIntensity: 0.7, roughness: 0.04, metalness: 0.1 }));
  drink.rotation.x = -Math.PI / 2; drink.position.y = Hc + 0.04; cupG.add(drink);
  const iceMat = new THREE.MeshStandardMaterial({ color: "#efe4ff", transparent: true, opacity: 0.62, roughness: 0.06 });
  const iceGeo = new RoundedBoxGeometry(0.15, 0.12, 0.15, 2, 0.035);
  for (let k = 0; k < 8; k++) { const a = k * 2.4, r = 0.07 + (k % 3) * 0.12; const c = new THREE.Mesh(iceGeo, iceMat); c.position.set(Math.cos(a) * r, Hc + 0.03 + (k % 2) * 0.035, Math.sin(a) * r); c.rotation.set(0.3 * (k % 3), a, 0.2 * (k % 2)); cupG.add(c); }
  cupG.scale.setScalar(0.66); cupG.position.set(1.25, 0, 1.0); scene.add(cupG); blob(1.05, 1.05, 1.3, 1.05, 0.004, 0, 0.6);
  halo("#9a4dff", 1.5, new THREE.Vector3(1.25, 0.8, 1.0), 0.18);

  /* Cámara quieta de frente: mesa delante y el estudio abriéndose al fondo */
  const target = new THREE.Vector3(), startPos = new THREE.Vector3();
  let going: { start: number; done: () => void } | null = null;
  function fit() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    if (camera.aspect < 0.8) { camera.fov = 68; startPos.set(1.09, 1.95, 4.9); target.set(-0.92, 0.85, -3.0); }
    else if (camera.aspect < 1.25) { camera.fov = 52; startPos.set(-0.1, 2.0, 5.5); target.set(-1.1, 0.85, -3.0); }
    else { camera.fov = 40; startPos.set(-0.3, 2.05, 5.7); target.set(-0.65, 0.72, -3.0); }
    camera.updateProjectionMatrix();
    if (!going) { camera.position.copy(startPos); camera.up.set(0, 1, 0); camera.lookAt(target); }
  }

  /* Bucle: animaciones ambientales; la calidad se ajusta si el dispositivo va justo */
  let ready = false, hits: Hit[] = [], raf = 0, alive = true, last = 0, t0 = performance.now(), frames = 0, slow = 0, fast = 0;
  let neonOn = 0; // momento en que el neón ha terminado de encenderse
  const render = () => { if (ready) renderer.render(scene, camera); };
  const fromPos = new THREE.Vector3(), fromUp = new THREE.Vector3(), fromLook = new THREE.Vector3(), endLook = new THREE.Vector3(), endPos = new THREE.Vector3(), endUp = new THREE.Vector3(), tmp = new THREE.Vector3();
  const BPM = 92, beatMs = 60000 / BPM;

  function ambient(now: number) {
    const t = (now - t0) / 1000;
    const beat = Math.pow(1 - ((now - t0) % beatMs) / beatMs, 3); // pulso que cae tras cada golpe
    // Neón: parpadeo al encenderse y luego un brillo estable que respira muy poco
    const nt = t - 0.6;
    let n = 0;
    if (neonTex.image && (neonTex.image as HTMLCanvasElement).width > 0) {
      if (nt < 0) n = 0;
      else if (nt < 1.3) n = [0.9, 0, 0.7, 0.15, 1, 0.3, 1][Math.floor(nt / 0.19)] ?? 1;
      else { n = 0.94 + Math.sin(t * 2.1) * 0.03 + (Math.sin(t * 0.37) > 0.995 ? -0.4 : 0); if (!neonOn) neonOn = now; }
    }
    neonMat.opacity = n; neonHalo.material.opacity = n * 0.22; neonLight.intensity = 8 * n;
    // Cabina: luz al ritmo y quien canta se balancea
    boothLight.intensity = 18 + beat * 7; boothHalo.material.opacity = 0.26 + beat * 0.08; (boothBeam.material as THREE.MeshBasicMaterial).opacity = 0.11 + beat * 0.04;
    singerPivot.rotation.z = Math.sin(t * (Math.PI * 2) * (BPM / 60) / 2) * 0.035; singer.position.y = 1.09 + beat * 0.012;
    // Medidores de la mesa y altavoces
    for (let i = 0; i < ch; i++) {
      const lv = 0.15 + Math.abs(Math.sin(t * (2.1 + i * 0.37) + i)) * 0.5 * (0.6 + beat * 0.6);
      m4.makeScale(1, lv * 0.32, 1).setPosition(chX(i), 0.12 + lv * 0.16, -0.46); meters.setMatrixAt(i, m4);
    }
    meters.instanceMatrix.needsUpdate = true;
    woofers.forEach((w) => { w.scale.y = 1 + beat * 0.6; });
    // Reproducción en el ordenador
    playhead.position.x = -0.95 + 0.25 + (((t * 0.08) % 1) * 1.6);
    // Polvo
    dust.rotation.y = Math.sin(t * 0.05) * 0.08; dust.position.y = Math.sin(t * 0.2) * 0.08;
    phoneHalo.material.opacity = 0.14 + Math.sin(t * 1.6) * 0.03;
  }

  function loop(now: number) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = now - last;
    // Máximo ~60 fps; si el dispositivo va lento, baja resolución y quita el polvo
    if (dt < 15) return;
    last = now;
    if (ready && frames++ > 20 && !going) {
      if (dt > 28) { slow++; fast = 0; } else if (dt < 18) { fast++; slow = 0; }
      if (slow > 25 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); fit(); slow = 0; }
      else if (slow > 25 && dust.visible) { dust.visible = false; slow = 0; }
      else if (fast > 120 && dpr < maxDpr) { dpr = Math.min(maxDpr, dpr + 0.25); renderer.setPixelRatio(dpr); fit(); fast = 0; }
    }
    (window as unknown as { __relaFrame?: number }).__relaFrame = Math.round(dt);
    if (!reduce || going) ambient(now);
    if (going) {
      const p = Math.min(1, (now - going.start) / 1500), e = ease(p);
      camera.position.lerpVectors(fromPos, endPos, e);
      camera.up.lerpVectors(fromUp, endUp, e).normalize();
      camera.lookAt(tmp.lerpVectors(fromLook, endLook, e));
      fadeMat.opacity = Math.max(0, (p - 0.6) / 0.4);
      render();
      if (p >= 1) { const d = going.done; going = null; d(); }
      return;
    }
    render();
    if (reduce) { alive = false; }
  }
  /** Vuelve a pintar (con movimiento reducido no hay bucle continuo). */
  const kick = () => { if (reduce && ready) { neonMat.opacity = 1; neonHalo.material.opacity = 0.22; render(); } };

  fit();
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity .5s ease";
  renderer.compileAsync(scene, camera).catch(() => null).then(() => {
    ready = true; t0 = performance.now();
    renderer.domElement.style.opacity = "1";
    if (reduce) { kick(); render(); } else raf = requestAnimationFrame(loop);
  });
  let drawId = 0;
  const redraw = async () => { const id = ++drawId; const h = await drawScreen(sg, info); if (id !== drawId) return; hits = h; screenTex.needsUpdate = true; if (reduce) render(); };
  redraw();

  const onResize = () => { fit(); render(); };
  window.addEventListener("resize", onResize);
  const raycaster = new THREE.Raycaster();
  const actionAt = (clientX: number, clientY: number): ScreenAction | null => {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1)), camera);
    const onScreen = raycaster.intersectObject(screen)[0];
    if (onScreen?.uv) {
      const x = onScreen.uv.x * screenCanvas.width, y = (1 - onScreen.uv.y) * screenCanvas.height;
      return hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h)?.action ?? "enter";
    }
    return raycaster.intersectObject(phone, true).length ? "enter" : null;
  };
  const onMove = (e: PointerEvent) => { renderer.domElement.style.cursor = actionAt(e.clientX, e.clientY) ? "pointer" : "default"; };
  const onClick = (e: MouseEvent) => { const a = actionAt(e.clientX, e.clientY); if (a) onAction(a); };
  renderer.domElement.addEventListener("pointermove", onMove);
  renderer.domElement.addEventListener("click", onClick);

  return {
    update(next: ScreenInfo) { info = next; fadeMat.color.set(next.bg); redraw(); },
    /** Se acerca al móvil hasta que la pantalla llena la vista. */
    enter(done: () => void) {
      if (going) return;
      phone.updateMatrixWorld();
      const center = new THREE.Vector3(0, PT, 0).applyMatrix4(phone.matrixWorld);
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(phone.quaternion).normalize();
      const top = new THREE.Vector3(0, 0, -1).applyQuaternion(phone.quaternion).normalize();
      const fovH = THREE.MathUtils.degToRad(camera.fov) / 2;
      const dist = Math.min((PL - 0.08) / 2 / Math.tan(fovH), (PW - 0.06) / 2 / (Math.tan(fovH) * camera.aspect)) * 0.92;
      fromPos.copy(camera.position); fromUp.copy(camera.up); fromLook.copy(target);
      endLook.copy(center); endPos.copy(center).addScaledVector(normal, dist); endUp.copy(top);
      going = { start: performance.now(), done };
      if (!alive) { alive = true; last = 0; raf = requestAnimationFrame(loop); }
    },
    dispose() {
      alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("click", onClick);
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.(); const mat = m.material as THREE.Material | THREE.Material[] | undefined; (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => { (x as THREE.MeshBasicMaterial).map?.dispose(); x.dispose(); }); });
      renderer.dispose(); pmrem.dispose(); renderer.domElement.remove();
    },
  };
}

export type Scene3D = ReturnType<typeof createScene>;
