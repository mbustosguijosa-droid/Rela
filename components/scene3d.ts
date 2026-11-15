// Escena 3D de la entrada de Rela (three.js, sin modelos externos).
// Un estudio de grabación en penumbra morada: cabina con alguien cantando a contraluz, monitores,
// mesa de mezclas y la pantalla del ordenador. En primer plano, bajo un foco, el móvil con
// los cascos conectados y un vaso de lean. La pantalla del móvil es la app: tu top 4, tus amigos
// y la gente conectada. La escena está quieta y solo se mueve al entrar.

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
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
};

/* ---------- Texturas del estudio ---------- */
const foamTex = () => canvasTex(256, 256, (g) => {
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const vertical = (x + y) % 2 === 0;
    for (let k = 0; k < 4; k++) {
      const gr = vertical ? g.createLinearGradient(x * 64 + k * 16, 0, x * 64 + k * 16 + 16, 0) : g.createLinearGradient(0, y * 64 + k * 16, 0, y * 64 + k * 16 + 16);
      gr.addColorStop(0, "#26222e"); gr.addColorStop(0.5, "#383243"); gr.addColorStop(1, "#14121a");
      g.fillStyle = gr;
      if (vertical) g.fillRect(x * 64 + k * 16, y * 64, 16, 64); else g.fillRect(x * 64, y * 64 + k * 16, 64, 16);
    }
  }
}, [6, 3]);
const deskTex = () => canvasTex(512, 512, (g) => {
  g.fillStyle = "#1a1518"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 120; i++) { g.strokeStyle = `rgba(255,220,200,${Math.random() * 0.04})`; g.beginPath(); const y = Math.random() * 512; g.moveTo(0, y); g.bezierCurveTo(170, y + 6, 340, y - 6, 512, y + 2); g.stroke(); }
}, [3, 2]);
const dawTex = () => canvasTex(1024, 576, (g) => {
  g.fillStyle = "#121014"; g.fillRect(0, 0, 1024, 576);
  g.fillStyle = "#1c1a21"; g.fillRect(0, 0, 1024, 40); g.fillRect(0, 40, 170, 536);
  const cols = ["#a77bff", "#ff6f91", "#2fbfa6", "#ffd23f", "#7d5cff", "#5f9cff"];
  for (let tr = 0; tr < 8; tr++) {
    const y = 60 + tr * 62, c = cols[tr % cols.length];
    g.fillStyle = c; g.fillRect(12, y + 8, 8, 40); g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(30, y + 18, 90, 8);
    let x = 180 + (tr * 37) % 120;
    while (x < 1000) {
      const w = 80 + ((tr * 53 + x) % 170);
      g.fillStyle = c + "40"; g.fillRect(x, y, w, 52); g.strokeStyle = c; g.lineWidth = 1.5; g.beginPath();
      for (let k = 0; k < w; k += 3) { const a = Math.abs(Math.sin((x + k) * 0.13 + tr)) * Math.abs(Math.sin((x + k) * 0.021)) * 22; g.moveTo(x + k, y + 26 - a); g.lineTo(x + k, y + 26 + a); }
      g.stroke(); x += w + 20 + ((tr * 17) % 60);
    }
  }
  g.fillStyle = "#ffffff"; g.fillRect(612, 40, 2, 536);
});
const boothTex = () => canvasTex(512, 640, (g) => {
  // cabina de voz: alguien cantando al micro, a contraluz morado
  const bg = g.createRadialGradient(300, 260, 20, 300, 260, 420); bg.addColorStop(0, "#c896ff"); bg.addColorStop(0.45, "#6d2bb8"); bg.addColorStop(1, "#1a0b2c");
  g.fillStyle = bg; g.fillRect(0, 0, 512, 640);
  g.fillStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < 10; i++) g.fillRect(0, i * 64, 512, 30);
  g.fillStyle = "#07050a";
  g.beginPath(); g.moveTo(150, 640); g.bezierCurveTo(150, 470, 210, 430, 300, 425); g.bezierCurveTo(390, 430, 440, 470, 450, 640); g.closePath(); g.fill();
  g.fillRect(278, 360, 44, 80);
  g.beginPath(); g.ellipse(300, 315, 62, 74, 0.08, 0, 7); g.fill();
  g.lineWidth = 16; g.strokeStyle = "#07050a"; g.beginPath(); g.arc(300, 312, 84, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  g.beginPath(); g.ellipse(226, 322, 22, 36, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(374, 322, 22, 36, 0, 0, 7); g.fill();
  g.lineWidth = 8; g.beginPath(); g.moveTo(170, 640); g.lineTo(170, 300); g.lineTo(215, 300); g.stroke();
  g.beginPath(); g.ellipse(230, 312, 26, 40, 0, 0, 7); g.fill();
  g.strokeStyle = "rgba(10,6,14,.85)"; g.lineWidth = 5; g.beginPath(); g.arc(205, 300, 44, 0, 7); g.stroke();
  g.globalCompositeOperation = "lighter"; g.strokeStyle = "rgba(220,170,255,.4)"; g.lineWidth = 4;
  g.beginPath(); g.ellipse(300, 315, 64, 76, 0.08, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
});

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
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#09070c");
  scene.fog = new THREE.Fog("#09070c", 7, 15);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.22;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 40);

  /* Luces: penumbra morada, cabina, ambiente y un foco más fuerte sobre el móvil */
  scene.add(new THREE.HemisphereLight("#e7d8ff", "#120c18", 0.18));
  const fill = new THREE.DirectionalLight("#d9c8ff", 0.35); fill.position.set(-3, 6, 4); scene.add(fill);
  const booth = new THREE.PointLight("#a64dff", 16, 7, 1.6); booth.position.set(-2.6, 1.4, -3.4); scene.add(booth);
  const amb = new THREE.PointLight("#c06bff", 8, 6, 1.6); amb.position.set(3.4, 1.4, -2.4); scene.add(amb);
  const spot = new THREE.SpotLight("#f6f0ff", 55, 9, 0.42, 0.75, 1.6); spot.position.set(0.5, 4.2, 2.2); scene.add(spot); scene.add(spot.target);

  const blobTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,.9)"); r.addColorStop(0.55, "rgba(0,0,0,.4)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const blob = (w: number, h: number, x: number, z: number, rot = 0, opacity = 0.6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
    m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, 0.004, z); scene.add(m);
  };

  /* Sala */
  const wallMat = new THREE.MeshStandardMaterial({ map: foamTex(), roughness: 1 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), wallMat); wall.position.set(0, 1.6, -4.6); scene.add(wall);
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMat); sideL.rotation.y = Math.PI / 2; sideL.position.set(-6.5, 1.6, -0.5); scene.add(sideL);
  const boothWin = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), new THREE.MeshBasicMaterial({ map: boothTex(), toneMapped: false, color: "#d9c8e6" }));
  boothWin.position.set(-2.75, 1.05, -4.55); scene.add(boothWin);
  const frameMat = new THREE.MeshStandardMaterial({ color: "#0e0c10", roughness: 0.6, metalness: 0.3 });
  [[0, 1.27, 2.2, 0.08], [0, -1.27, 2.2, 0.08], [-1.06, 0, 0.08, 2.6], [1.06, 0, 0.08, 2.6]].forEach(([x, y, w, h]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), frameMat); f.position.set(-2.75 + x, 1.05 + y, -4.5); scene.add(f); });
  const led = new THREE.Mesh(new THREE.BoxGeometry(9, 0.04, 0.04), new THREE.MeshBasicMaterial({ color: ACC, toneMapped: false })); led.position.set(0.5, 0.25, -4.5); scene.add(led);

  /* Mesa y mesa de mezclas */
  const desk = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 5.5), new THREE.MeshStandardMaterial({ map: deskTex(), roughness: 0.55, metalness: 0.1 }));
  desk.position.set(0.3, -0.1, -0.6); scene.add(desk);
  const mixer = new THREE.Group();
  const mixBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 1.3), new THREE.MeshStandardMaterial({ color: "#16141a", roughness: 0.45, metalness: 0.5 }));
  mixBody.position.y = 0.08; mixBody.rotation.x = -0.12; mixer.add(mixBody);
  const ch = 18, knobGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.05, 12), faderGeo = new THREE.BoxGeometry(0.07, 0.04, 0.12);
  const knobs = new THREE.InstancedMesh(knobGeo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2 }), ch * 4);
  const faders = new THREE.InstancedMesh(faderGeo, new THREE.MeshStandardMaterial({ color: "#d9d6dd", roughness: 0.3, metalness: 0.6 }), ch);
  const m4 = new THREE.Matrix4(), colorsK = ["#a77bff", "#ff6f91", "#2fbfa6", "#ffd23f"].map((c) => new THREE.Color(c));
  for (let i = 0; i < ch; i++) {
    const x = -1.6 + i * (3.2 / (ch - 1));
    for (let r = 0; r < 4; r++) { m4.makeTranslation(x, 0.2 - r * 0.015, -0.48 + r * 0.16); knobs.setMatrixAt(i * 4 + r, m4); knobs.setColorAt(i * 4 + r, colorsK[r]); }
    m4.makeTranslation(x, 0.12, 0.38 - ((i * 7) % 5) * 0.05); faders.setMatrixAt(i, m4);
  }
  mixer.add(knobs, faders);
  const meter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: "#5fd39b", toneMapped: false })); meter.position.set(0, 0.2, -0.6); mixer.add(meter);
  mixer.position.set(0.2, 0, -1.55); scene.add(mixer); blob(4.4, 2.0, 0.2, -1.5, 0, 0.5);
  const monitorScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.3), new THREE.MeshBasicMaterial({ map: dawTex(), toneMapped: false, color: "#bfb8c6" }));
  monitorScreen.position.set(0.5, 1.05, -2.75); scene.add(monitorScreen);
  const bezel = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.42, 0.06), frameMat); bezel.position.set(0.5, 1.05, -2.79); scene.add(bezel);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.08), frameMat); stand.position.set(0.5, 0.25, -2.8); scene.add(stand);
  const screenGlow = new THREE.PointLight("#9fa8ff", 3, 4, 2); screenGlow.position.set(0.5, 1.0, -2.2); scene.add(screenGlow);
  const speakerMat = new THREE.MeshStandardMaterial({ color: "#121014", roughness: 0.5, metalness: 0.2 });
  const coneMat = new THREE.MeshStandardMaterial({ color: "#2a272e", roughness: 0.35, metalness: 0.4 });
  const ringMat = new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.4, emissive: "#5a2fb0", emissiveIntensity: 0.4 });
  [[-4.3, 0.45], [3.3, -0.45]].forEach(([x, ry]) => {
    const sp = new THREE.Group();
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.75, 1.1, 0.8, 3, 0.06), speakerMat); box.position.y = 0.55; sp.add(box);
    const woofer = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.06, 32), coneMat); woofer.rotation.x = Math.PI / 2; woofer.position.set(0, 0.38, 0.41); sp.add(woofer);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 8, 32), ringMat); ring.position.set(0, 0.38, 0.43); sp.add(ring);
    const tweeter = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.05, 24), coneMat); tweeter.rotation.x = Math.PI / 2; tweeter.position.set(0, 0.85, 0.41); sp.add(tweeter);
    sp.position.set(x, 0, -2.2); sp.rotation.y = ry; scene.add(sp); blob(1.2, 1.2, x, -2.1, 0, 0.55);
  });

  /* Objetos cercanos */
  const matte = new THREE.MeshStandardMaterial({ color: "#1a181d", roughness: 0.45, metalness: 0.15 });
  const leather = new THREE.MeshStandardMaterial({ color: "#2a252c", roughness: 0.55 });
  const metal = new THREE.MeshStandardMaterial({ color: "#cfcbd4", roughness: 0.22, metalness: 1 });
  const accent = new THREE.MeshStandardMaterial({ color: ACC, roughness: 0.35, metalness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#121113", roughness: 0.55 });

  /* Cascos de cerca, a la izquierda del móvil */
  const phones = new THREE.Group(), bandR = 0.9;
  const bandGroup = new THREE.Group();
  bandGroup.add(new THREE.Mesh(new THREE.TorusGeometry(bandR, 0.06, 16, 72, Math.PI), matte));
  const pad = new THREE.Mesh(new THREE.TorusGeometry(bandR - 0.045, 0.09, 16, 64, Math.PI * 0.62), leather); pad.rotation.z = Math.PI * 0.19; bandGroup.add(pad);
  const stitch = new THREE.Mesh(new THREE.TorusGeometry(bandR + 0.025, 0.01, 6, 64, Math.PI * 0.62), metal); stitch.rotation.z = Math.PI * 0.19; bandGroup.add(stitch);
  bandGroup.rotation.x = -Math.PI / 2; bandGroup.position.y = 0.29; phones.add(bandGroup);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Group();
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.024, 10, 40, Math.PI), metal); yoke.rotation.x = -Math.PI / 2; yoke.position.set(0, 0.29, 0.04); yoke.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.42, 0.26, 48), matte); shell.scale.z = 1.22; shell.position.y = 0.19;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.39, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), matte); cap.scale.set(1, 0.18, 1.22); cap.position.y = 0.32;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.018, 8, 64), metal); ring.rotation.x = Math.PI / 2; ring.scale.y = 1.22; ring.position.y = 0.32;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 24), accent); dot.position.y = 0.39;
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.095, 16, 56), leather); cushion.rotation.x = Math.PI / 2; cushion.scale.y = 1.2; cushion.position.y = 0.08;
    cup.add(yoke, shell, cap, ring, dot, cushion); cup.position.set(side * bandR, 0, 0); phones.add(cup);
  });
  phones.scale.setScalar(0.82); phones.position.set(-1.5, 0, 0.0); phones.rotation.y = 0.3; scene.add(phones); blob(2.3, 1.5, -1.45, 0.08, -0.3, 0.6);

  /* Móvil bajo el foco */
  const phone = new THREE.Group();
  const PW = 1.25, PL = 2.6, PT = 0.09;
  const body = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PL, 6, 0.17), new THREE.MeshStandardMaterial({ color: "#1f1d23", metalness: 0.8, roughness: 0.22 }));
  body.position.y = PT / 2; phone.add(body);
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 600; screenCanvas.height = Math.round(600 * (PL - 0.1) / (PW - 0.08));
  const sg = screenCanvas.getContext("2d")!;
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.08, PL - 0.1), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.y = PT + 0.002; phone.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.05, PL - 0.05), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0.2, color: "#ffffff" }));
  glass.rotation.x = -Math.PI / 2; glass.position.y = PT + 0.004; phone.add(glass);
  const fadeMat = new THREE.MeshBasicMaterial({ color: info.bg, transparent: true, opacity: 0, toneMapped: false });
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.08, PL - 0.1), fadeMat); fade.rotation.x = -Math.PI / 2; fade.position.y = PT + 0.006; phone.add(fade);
  phone.position.set(0.2, 0, 0.42); phone.rotation.y = -0.12; scene.add(phone); blob(1.7, 3.1, 0.25, 0.52, -0.12, 0.7);
  spot.target.position.copy(phone.position);
  const poolTex = canvasTex(256, 256, (g) => { const r = g.createRadialGradient(128, 128, 0, 128, 128, 128); r.addColorStop(0, "rgba(236,226,255,.32)"); r.addColorStop(1, "rgba(236,226,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.25, 0.003, 0.47); scene.add(pool);

  /* Cable de los cascos al móvil */
  phones.updateMatrixWorld(); phone.updateMatrixWorld();
  const from = new THREE.Vector3(bandR, 0.1, 0.48).applyMatrix4(phones.matrixWorld);
  const to = new THREE.Vector3(0, PT / 2, PL / 2 + 0.26).applyMatrix4(phone.matrixWorld);
  const curve = new THREE.CatmullRomCurve3([from, new THREE.Vector3(from.x + 0.1, 0.03, from.z + 0.7), new THREE.Vector3(-0.9, 0.028, 2.05), new THREE.Vector3(to.x - 0.2, 0.028, to.z + 0.35), to]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.026, 8), rubber));
  const plug = new THREE.Group();
  const plugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.28, 16), rubber); plugBody.rotation.x = Math.PI / 2;
  const plugTip = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.1, 16), metal); plugTip.rotation.x = Math.PI / 2; plugTip.position.z = -0.17;
  plug.add(plugBody, plugTip); plug.position.copy(new THREE.Vector3(0, PT / 2, PL / 2 + 0.16).applyMatrix4(phone.matrixWorld)); plug.rotation.y = phone.rotation.y; scene.add(plug);

  /* Un vaso de lean (double cup) a la derecha del móvil */
  const foam = new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.95 });
  const cupG = new THREE.Group();
  const Hc = 0.95, rb = 0.33, rt = 0.5;
  const prof = [new THREE.Vector2(0, 0), new THREE.Vector2(rb, 0), new THREE.Vector2(rt, Hc), new THREE.Vector2(rt - 0.03, Hc), new THREE.Vector2(rb - 0.03, 0.03), new THREE.Vector2(0, 0.03)];
  const outerCup = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), foam);
  const outerLip = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.004, 0.028, 10, 48), foam); outerLip.rotation.x = Math.PI / 2; outerLip.position.y = Hc;
  const innerCup = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), foam); innerCup.position.y = 0.15;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.008, 0.046, 12, 56), foam); rim.rotation.x = Math.PI / 2; rim.position.y = Hc + 0.15;
  cupG.add(outerCup, outerLip, innerCup, rim);
  const drink = new THREE.Mesh(new THREE.CircleGeometry(rt - 0.05, 48), new THREE.MeshStandardMaterial({ color: "#8a3ad6", emissive: "#4d168f", emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.1 }));
  drink.rotation.x = -Math.PI / 2; drink.position.y = Hc + 0.04; cupG.add(drink);
  const iceMat = new THREE.MeshStandardMaterial({ color: "#efe4ff", transparent: true, opacity: 0.6, roughness: 0.08 });
  const iceGeo = new RoundedBoxGeometry(0.15, 0.12, 0.15, 2, 0.035);
  for (let k = 0; k < 8; k++) { const a = k * 2.4, r = 0.07 + (k % 3) * 0.12; const c = new THREE.Mesh(iceGeo, iceMat); c.position.set(Math.cos(a) * r, Hc + 0.03 + (k % 2) * 0.035, Math.sin(a) * r); c.rotation.set(0.3 * (k % 3), a, 0.2 * (k % 2)); cupG.add(c); }
  cupG.scale.setScalar(0.88); cupG.position.set(1.6, 0, 0.0); scene.add(cupG); blob(1.35, 1.35, 1.7, 0.1, 0, 0.6);
  const cupGlow = new THREE.PointLight("#9a4dff", 1.6, 2.2, 2); cupGlow.position.set(1.6, 1.3, 0.0); scene.add(cupGlow);

  /* Cámara de frente, mirando al móvil con el estudio detrás */
  const target = new THREE.Vector3(), startPos = new THREE.Vector3();
  let going: { start: number; done: () => void } | null = null;
  function fit() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const portrait = camera.aspect < 1;
    if (portrait) { camera.fov = 52; target.set(0.2, 0.2, 0.1); startPos.set(0.25, 3.9, 3.55); }
    else { camera.fov = 38; target.set(0.15, 0.3, -0.4); startPos.set(0.2, 3.2, 3.9); }
    camera.updateProjectionMatrix();
    if (!going) { camera.position.copy(startPos); camera.up.set(0, 1, 0); camera.lookAt(target); }
  }

  /* Dibujo bajo demanda */
  let ready = false, hits: Hit[] = [], raf = 0;
  const render = () => { if (ready) renderer.render(scene, camera); };
  fit();
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity .4s ease";
  renderer.compileAsync(scene, camera).catch(() => null).then(() => { ready = true; render(); renderer.domElement.style.opacity = "1"; });
  let drawId = 0;
  const redraw = async () => { const id = ++drawId; const h = await drawScreen(sg, info); if (id !== drawId) return; hits = h; screenTex.needsUpdate = true; render(); };
  redraw();

  const fromPos = new THREE.Vector3(), fromUp = new THREE.Vector3(), fromLook = new THREE.Vector3(), endLook = new THREE.Vector3(), endPos = new THREE.Vector3(), endUp = new THREE.Vector3();
  function animate(now: number) {
    if (!going) return;
    const p = Math.min(1, (now - going.start) / 1500), e = ease(p);
    camera.position.lerpVectors(fromPos, endPos, e);
    camera.up.lerpVectors(fromUp, endUp, e).normalize();
    camera.lookAt(new THREE.Vector3().lerpVectors(fromLook, endLook, e));
    fadeMat.opacity = Math.max(0, (p - 0.6) / 0.4);
    render();
    if (p >= 1) { const d = going.done; going = null; d(); return; }
    raf = requestAnimationFrame(animate);
  }

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
    /** Pone el móvil en vertical y entra en la pantalla. */
    enter(done: () => void) {
      if (going) return;
      phone.updateMatrixWorld();
      const center = new THREE.Vector3(0, PT, 0).applyMatrix4(phone.matrixWorld);
      const top = new THREE.Vector3(0, 0, -1).applyQuaternion(phone.quaternion).normalize();
      const fovH = THREE.MathUtils.degToRad(camera.fov) / 2;
      const dist = Math.min((PL - 0.1) / 2 / Math.tan(fovH), (PW - 0.08) / 2 / (Math.tan(fovH) * camera.aspect)) * 0.92;
      fromPos.copy(camera.position); fromUp.copy(camera.up); fromLook.copy(target);
      endLook.copy(center); endPos.copy(center).add(new THREE.Vector3(0, dist, 0)); endUp.copy(top);
      going = { start: performance.now(), done };
      raf = requestAnimationFrame(animate);
    },
    dispose() {
      cancelAnimationFrame(raf); window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove); renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose(); pmrem.dispose(); renderer.domElement.remove();
    },
  };
}

export type Scene3D = ReturnType<typeof createScene>;
