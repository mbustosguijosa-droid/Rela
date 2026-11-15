// Escena 3D de la entrada de Rela (three.js, sin modelos externos).
// Mesa de madera con unos cascos de cable conectados a un móvil. La pantalla del móvil es una
// pantalla de inicio: tu foto como icono, la gente conectada y "Entrar con Google" si no has entrado.
// La escena está quieta (solo se dibuja cuando cambia algo) y se mueve únicamente al entrar.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Person = { name: string; handle?: string; avatar_url?: string | null; accent?: string };
export type ScreenAction = "enter" | "google" | "email" | "profile" | "messages" | "friends" | "explore" | `person:${string}`;
export type ScreenInfo = {
  me: (Person & { handle?: string }) | null;
  online: Person[]; // otras personas conectadas (sin ti)
  onlineCount: number;
  labels: {
    online: string; onlineNow: string; you: string; google: string; email: string; enter: string;
    messages: string; friends: string; explore: string; nobody: string;
  };
  bg: string; // color de fondo de la web (para fundir al final)
};

const proxied = (u: string) => (u.startsWith("/") ? u : `/api/img?u=${encodeURIComponent(u)}`);
const imgCache = new Map<string, Promise<HTMLImageElement | null>>();
function loadImg(src: string) {
  if (!imgCache.has(src)) imgCache.set(src, new Promise((res) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => res(i); i.onerror = () => res(null); i.src = proxied(src); }));
  return imgCache.get(src)!;
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------- Texturas generadas ---------- */
function woodTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 1024, 1024); grd.addColorStop(0, "#6e4d34"); grd.addColorStop(1, "#4b3222");
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 220; i++) {
    const y = Math.random() * 1024, amp = 5 + Math.random() * 16, a = Math.random() * 0.1 + 0.02;
    g.strokeStyle = Math.random() > 0.5 ? `rgba(30,18,10,${a})` : `rgba(255,220,180,${a * 0.5})`;
    g.lineWidth = Math.random() * 2 + 0.4; g.beginPath();
    for (let x = 0; x <= 1024; x += 24) g.lineTo(x, y + Math.sin(x / (80 + amp * 4) + i) * amp);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.2, 2.2); t.anisotropy = 4;
  return t;
}
function vinylTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!;
  g.fillStyle = "#0c0b0d"; g.fillRect(0, 0, 512, 512);
  for (let r = 80; r < 255; r += 2) { g.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.03})`; g.beginPath(); g.arc(256, 256, r, 0, 7); g.stroke(); }
  g.fillStyle = "#ee9a62"; g.beginPath(); g.arc(256, 256, 75, 0, 7); g.fill();
  g.fillStyle = "#2b1607"; g.font = "700 26px Fraunces, Georgia, serif"; g.textAlign = "center"; g.fillText("Rela", 256, 252);
  g.font = "500 12px Figtree, sans-serif"; g.fillText("SIDE A · 33⅓", 256, 274);
  g.fillStyle = "#0c0b0d"; g.beginPath(); g.arc(256, 256, 6, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function foamTexture() {
  // poliestireno: blanco mate con un leve granulado
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d")!;
  g.fillStyle = "#f4f2ee"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ---------- Pantalla del móvil: pantalla de inicio con iconos ---------- */
type Hit = { x: number; y: number; w: number; h: number; action: ScreenAction };
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function fitText(g: CanvasRenderingContext2D, t: string, max: number) { let s = t; while (g.measureText(s).width > max && s.length > 2) s = s.slice(0, -2); return s === t ? s : s + "…"; }

async function drawScreen(g: CanvasRenderingContext2D, info: ScreenInfo): Promise<Hit[]> {
  const W = g.canvas.width, H = g.canvas.height, hits: Hit[] = [];
  // carga de imágenes antes de dibujar (evita parpadeos)
  const meImg = info.me?.avatar_url ? await loadImg(info.me.avatar_url) : null;
  const people = info.online.slice(0, info.me ? 7 : 4);
  const peopleImgs = await Promise.all(people.map((p) => (p.avatar_url ? loadImg(p.avatar_url) : Promise.resolve(null))));

  g.clearRect(0, 0, W, H);
  g.save(); roundRect(g, 0, 0, W, H, 78); g.clip();
  // fondo de pantalla
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#3a2418"); bg.addColorStop(0.55, "#1d1410"); bg.addColorStop(1, "#120d0b"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.8, H * 0.05, 0, W * 0.8, H * 0.05, W * 1.1); glow.addColorStop(0, "rgba(238,154,98,.45)"); glow.addColorStop(1, "rgba(238,154,98,0)"); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // isla y barra de estado
  g.fillStyle = "#000"; roundRect(g, W / 2 - 78, 24, 156, 44, 22); g.fill();
  g.fillStyle = "#fbf3ea"; g.font = "600 28px Figtree, sans-serif"; g.textAlign = "left"; g.fillText("9:41", 50, 58);
  g.textAlign = "right"; g.fillText("▮▮▮", W - 46, 58); g.textAlign = "left";

  // Widget de conectados
  const wy = 104;
  g.fillStyle = "rgba(255,255,255,.1)"; roundRect(g, 36, wy, W - 72, 168, 40); g.fill();
  g.fillStyle = "rgba(251,243,234,.6)"; g.font = "700 21px Figtree, sans-serif"; g.fillText(info.labels.onlineNow.toUpperCase(), 68, wy + 46);
  g.fillStyle = "rgba(95,211,155,.3)"; g.beginPath(); g.arc(82, wy + 106, 20, 0, 7); g.fill();
  g.fillStyle = "#5fd39b"; g.beginPath(); g.arc(82, wy + 106, 11, 0, 7); g.fill();
  g.fillStyle = "#fbf3ea"; g.font = "700 46px Figtree, sans-serif"; g.fillText(fitText(g, info.labels.online, W - 200), 116, wy + 122);

  // Iconos (4 por fila)
  const cols = 4, s = 104, gap = (W - 72 - cols * s) / (cols - 1);
  let idx = 0;
  const slot = () => { const i = idx++; return { x: 36 + (i % cols) * (s + gap), y: 312 + Math.floor(i / cols) * (s + 70) }; };
  const label = (x: number, y: number, text: string) => { g.fillStyle = "rgba(251,243,234,.9)"; g.font = "500 21px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(fitText(g, text, s + gap - 6), x + s / 2, y + s + 30); g.textAlign = "left"; };
  const tile = (x: number, y: number, c1: string, c2: string) => { const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, c2); gr.addColorStop(1, c1); g.fillStyle = gr; roundRect(g, x, y, s, s, 26); g.fill(); g.fillStyle = "rgba(255,255,255,.16)"; roundRect(g, x, y, s, s / 2, 26); g.fill(); };
  const glyph = (x: number, y: number, ch: string, color = "#fff", size = 50) => { g.fillStyle = color; g.font = `600 ${size}px Figtree, sans-serif`; g.textAlign = "center"; g.fillText(ch, x + s / 2, y + s / 2 + size * 0.36); g.textAlign = "left"; };
  const avatarIcon = (x: number, y: number, img: HTMLImageElement | null, name: string, accent?: string, ring = false) => {
    g.save(); roundRect(g, x, y, s, s, 26); g.clip();
    if (img) g.drawImage(img, x, y, s, s);
    else { g.fillStyle = accent ?? "#7a6a5c"; g.fillRect(x, y, s, s); g.fillStyle = "#2b1607"; g.font = "700 50px Fraunces, Georgia, serif"; g.textAlign = "center"; g.fillText((name || "?")[0].toUpperCase(), x + s / 2, y + s / 2 + 18); g.textAlign = "left"; }
    g.restore();
    if (ring) { g.strokeStyle = "#ee9a62"; g.lineWidth = 5; roundRect(g, x - 4, y - 4, s + 8, s + 8, 30); g.stroke(); }
    // punto verde de conectado
    g.fillStyle = "#1d1410"; g.beginPath(); g.arc(x + s - 8, y + 8, 14, 0, 7); g.fill();
    g.fillStyle = "#5fd39b"; g.beginPath(); g.arc(x + s - 8, y + 8, 9, 0, 7); g.fill();
  };

  if (info.me) {
    const p = slot(); avatarIcon(p.x, p.y, meImg, info.me.name, info.me.accent, true); label(p.x, p.y, info.labels.you); hits.push({ ...p, w: s, h: s, action: "profile" });
    const m = slot(); tile(m.x, m.y, "#3d6fb6", "#86b4f0"); glyph(m.x, m.y, "✉"); label(m.x, m.y, info.labels.messages); hits.push({ ...m, w: s, h: s, action: "messages" });
    const f = slot(); tile(f.x, f.y, "#2f8a7f", "#7fd3c2"); glyph(f.x, f.y, "☺"); label(f.x, f.y, info.labels.friends); hits.push({ ...f, w: s, h: s, action: "friends" });
    const e = slot(); tile(e.x, e.y, "#ee9a62", "#f6c28b"); glyph(e.x, e.y, "♫"); label(e.x, e.y, info.labels.explore); hits.push({ ...e, w: s, h: s, action: "explore" });
  } else {
    const gq = slot(); g.fillStyle = "#fff"; roundRect(g, gq.x, gq.y, s, s, 26); g.fill();
    // "G" de Google con sus colores
    const cx = gq.x + s / 2, cy = gq.y + s / 2, r = 30;
    ([["#EA4335", -2.4, -0.7], ["#FBBC05", -0.7 - Math.PI, -2.4], ["#34A853", 0.7, 2.45], ["#4285F4", -0.05, 0.7]] as const).forEach(([c, a0, a1]) => { g.strokeStyle = c; g.lineWidth = 14; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke(); });
    g.fillStyle = "#4285F4"; g.fillRect(cx, cy - 7, r + 7, 14);
    label(gq.x, gq.y, info.labels.google); hits.push({ ...gq, w: s, h: s, action: "google" });
    const em = slot(); tile(em.x, em.y, "#8a6a52", "#c9a487"); glyph(em.x, em.y, "@"); label(em.x, em.y, info.labels.email); hits.push({ ...em, w: s, h: s, action: "email" });
    const ex = slot(); tile(ex.x, ex.y, "#ee9a62", "#f6c28b"); glyph(ex.x, ex.y, "♫"); label(ex.x, ex.y, info.labels.explore); hits.push({ ...ex, w: s, h: s, action: "explore" });
    const fr = slot(); tile(fr.x, fr.y, "#2f8a7f", "#7fd3c2"); glyph(fr.x, fr.y, "☺"); label(fr.x, fr.y, info.labels.friends); hits.push({ ...fr, w: s, h: s, action: "friends" });
  }
  // gente conectada como iconos
  people.forEach((p, i) => {
    const q = slot(); avatarIcon(q.x, q.y, peopleImgs[i], p.name, p.accent); label(q.x, q.y, p.name || "Rela");
    if (p.handle) hits.push({ ...q, w: s, h: s, action: `person:${p.handle}` });
  });
  let ny = 312 + Math.ceil(idx / cols) * (s + 70);
  if (!people.length) {
    g.fillStyle = "rgba(251,243,234,.45)"; g.font = "500 22px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(info.labels.nobody, W / 2, ny + 4); g.textAlign = "left";
    ny += 36;
  }
  // Widget de novedades (portadas)
  const wh = Math.min(330, H - 236 - ny - 20);
  if (wh > 180) {
    g.fillStyle = "rgba(255,255,255,.1)"; roundRect(g, 36, ny, W - 72, wh, 40); g.fill();
    g.fillStyle = "rgba(251,243,234,.6)"; g.font = "700 21px Figtree, sans-serif"; g.fillText(info.labels.explore.toUpperCase() + " · RELA", 68, ny + 46);
    const cs = Math.min(150, wh - 96), covers: [string, string][] = [["#ee9a62", "#7a3c1c"], ["#7d2fc4", "#2b1146"], ["#2f8a7f", "#123a35"]];
    covers.forEach(([c1, c2], i) => {
      const x = 68 + i * (cs + 22), y = ny + 70;
      if (x + cs > W - 60) return;
      const gr = g.createLinearGradient(x, y, x + cs, y + cs); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; roundRect(g, x, y, cs, cs, 18); g.fill();
      g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3; g.beginPath(); g.arc(x + cs / 2, y + cs / 2, cs * 0.32, 0, 7); g.stroke();
      g.fillStyle = "rgba(255,255,255,.85)"; g.beginPath(); g.arc(x + cs / 2, y + cs / 2, cs * 0.08, 0, 7); g.fill();
    });
  }

  // Dock con el icono de Rela: "Entrar"
  const dy = H - 196;
  g.fillStyle = "rgba(255,255,255,.12)"; roundRect(g, 32, dy, W - 64, 156, 50); g.fill();
  const ix = W / 2 - 62, iy = dy + 18;
  const grd = g.createLinearGradient(ix, iy, ix + 124, iy + 124); grd.addColorStop(0, "#f6b788"); grd.addColorStop(1, "#e07a3e");
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = false;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1c130d");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 60);

  const key = new THREE.DirectionalLight("#ffe2c2", 2.5); key.position.set(-3, 9, 3.5); 
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 }); key.shadow.camera.updateProjectionMatrix(); key.shadow.radius = 5; key.shadow.bias = -0.0005;
  scene.add(key);
  scene.add(new THREE.HemisphereLight("#ffe9d6", "#2a1a10", 0.6));
  const lamp = new THREE.PointLight("#ffb780", 12, 8, 1.8); lamp.position.set(1.4, 3, -0.4); scene.add(lamp);

  // Mesa grande
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.6 }));
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

  const matte = new THREE.MeshStandardMaterial({ color: "#1a181d", roughness: 0.45, metalness: 0.15 });
  const leather = new THREE.MeshStandardMaterial({ color: "#2a252c", roughness: 0.55, metalness: 0 });
  const metal = new THREE.MeshStandardMaterial({ color: "#cfcbd4", roughness: 0.22, metalness: 1 });
  const accent = new THREE.MeshStandardMaterial({ color: "#ee9a62", roughness: 0.35, metalness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#121113", roughness: 0.55 });
  const cast = (_o: THREE.Object3D) => {};
  // Sombras suaves "pintadas" bajo cada objeto (mucho más ligeras que las sombras en tiempo real)
  const blobCanvas = document.createElement("canvas"); blobCanvas.width = blobCanvas.height = 128;
  { const g = blobCanvas.getContext("2d")!; const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(0,0,0,.85)"); r.addColorStop(.55, "rgba(0,0,0,.35)"); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); }
  const blobTex = new THREE.CanvasTexture(blobCanvas);
  const blob = (w: number, h: number, x: number, z: number, rot = 0, opacity = 0.55) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity, depthWrite: false }));
    m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, 0.004, z); scene.add(m);
  };

  /* Cascos */
  const phones = new THREE.Group(), bandR = 1.05;
  const bandGroup = new THREE.Group();
  bandGroup.add(new THREE.Mesh(new THREE.TorusGeometry(bandR, 0.07, 16, 72, Math.PI), matte));
  const pad = new THREE.Mesh(new THREE.TorusGeometry(bandR - 0.05, 0.1, 16, 64, Math.PI * 0.62), leather); pad.rotation.z = Math.PI * 0.19; bandGroup.add(pad);
  const stitch = new THREE.Mesh(new THREE.TorusGeometry(bandR + 0.03, 0.011, 6, 64, Math.PI * 0.62), metal); stitch.rotation.z = Math.PI * 0.19; bandGroup.add(stitch);
  bandGroup.rotation.x = -Math.PI / 2; bandGroup.position.y = 0.33; phones.add(bandGroup);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Group();
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.028, 10, 40, Math.PI), metal); yoke.rotation.x = -Math.PI / 2; yoke.position.set(0, 0.33, 0.05); yoke.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.49, 0.3, 48), matte); shell.scale.z = 1.22; shell.position.y = 0.22;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), matte); cap.scale.set(1, 0.18, 1.22); cap.position.y = 0.37;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.02, 8, 64), metal); ring.rotation.x = Math.PI / 2; ring.scale.y = 1.22; ring.position.y = 0.37;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 24), accent); dot.position.y = 0.45;
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.11, 16, 56), leather); cushion.rotation.x = Math.PI / 2; cushion.scale.y = 1.2; cushion.position.y = 0.09;
    cup.add(yoke, shell, cap, ring, dot, cushion); cup.position.set(side * bandR, 0, 0); phones.add(cup);
  });
  phones.position.set(-1.75, 0, -0.55); phones.rotation.y = 0.5; scene.add(phones);
  blob(3.2, 2.1, -1.68, -0.42, -0.5, 0.5);

  /* Móvil */
  const phone = new THREE.Group();
  const PW = 1.5, PL = 3.1, PT = 0.1;
  const body = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PL, 6, 0.2), new THREE.MeshStandardMaterial({ color: "#1f1d23", metalness: 0.8, roughness: 0.22 }));
  body.position.y = PT / 2; phone.add(body);
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 600; screenCanvas.height = Math.round(600 * (PL - 0.12) / (PW - 0.1));
  const sg = screenCanvas.getContext("2d")!;
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.1, PL - 0.12), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.y = PT + 0.002; phone.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.06, PL - 0.06), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.2, color: "#ffffff" }));
  glass.rotation.x = -Math.PI / 2; glass.position.y = PT + 0.004; phone.add(glass);
  const fadeMat = new THREE.MeshBasicMaterial({ color: info.bg, transparent: true, opacity: 0, toneMapped: false });
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.1, PL - 0.12), fadeMat); fade.rotation.x = -Math.PI / 2; fade.position.y = PT + 0.006; phone.add(fade);
  phone.position.set(0.45, 0, 0.35); phone.rotation.y = -0.22; scene.add(phone);
  blob(2.0, 3.6, 0.52, 0.45, -0.22, 0.6);

  /* Cable */
  phones.updateMatrixWorld(); phone.updateMatrixWorld();
  const from = new THREE.Vector3(-bandR, 0.11, 0.55).applyMatrix4(phones.matrixWorld);
  const to = new THREE.Vector3(0, PT / 2, PL / 2 + 0.3).applyMatrix4(phone.matrixWorld);
  const curve = new THREE.CatmullRomCurve3([
    from, new THREE.Vector3(from.x - 0.25, 0.04, from.z + 1.0), new THREE.Vector3(-2.3, 0.032, 2.2), new THREE.Vector3(-0.9, 0.032, 2.75), new THREE.Vector3(to.x - 0.25, 0.032, to.z + 0.45), to,
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.03, 8), rubber); scene.add(cable);
  const plug = new THREE.Group();
  const plugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.32, 16), rubber); plugBody.rotation.x = Math.PI / 2;
  const plugTip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 16), metal); plugTip.rotation.x = Math.PI / 2; plugTip.position.z = -0.2;
  plug.add(plugBody, plugTip);
  plug.position.copy(new THREE.Vector3(0, PT / 2, PL / 2 + 0.19).applyMatrix4(phone.matrixWorld)); plug.rotation.y = phone.rotation.y; scene.add(plug);

  /* Vinilo */
  const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.035, 96), [new THREE.MeshStandardMaterial({ color: "#0c0b0d", roughness: 0.4 }), new THREE.MeshStandardMaterial({ map: vinylTexture(), roughness: 0.28, metalness: 0.1 }), new THREE.MeshStandardMaterial({ color: "#0c0b0d" })]);
  vinyl.position.set(-4.3, 0.018, 2.4); scene.add(vinyl); blob(5, 5, -4.2, 2.5, 0, 0.45);

  /* Dos double cups con bebida morada y hielo */
  const foam = new THREE.MeshStandardMaterial({ map: foamTexture(), color: "#ffffff", roughness: 0.95 });
  const drinkMat = new THREE.MeshStandardMaterial({ color: "#8a3ad6", emissive: "#4d168f", emissiveIntensity: 0.55, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.92 });
  const iceMat = new THREE.MeshStandardMaterial({ color: "#efe4ff", transparent: true, opacity: 0.6, roughness: 0.08, metalness: 0.05 });
  const iceGeo = new RoundedBoxGeometry(0.17, 0.13, 0.17, 2, 0.04);
  function doubleCup() {
    const g = new THREE.Group();
    const H = 1.0, rb = 0.36, rt = 0.54;
    const body = [new THREE.Vector2(0, 0), new THREE.Vector2(rb, 0), new THREE.Vector2(rt, H), new THREE.Vector2(rt - 0.035, H), new THREE.Vector2(rb - 0.035, 0.035), new THREE.Vector2(0, 0.035)];
    const outerCup = new THREE.Mesh(new THREE.LatheGeometry(body, 48), foam);
    const outerLip = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.005, 0.03, 10, 48), foam); outerLip.rotation.x = Math.PI / 2; outerLip.position.y = H;
    const innerCup = new THREE.Mesh(new THREE.LatheGeometry(body, 48), foam); innerCup.position.y = 0.16;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(rt + 0.01, 0.05, 12, 56), foam); rim.rotation.x = Math.PI / 2; rim.position.y = H + 0.16;
    g.add(outerCup, outerLip, innerCup, rim);
    const drink = new THREE.Mesh(new THREE.CircleGeometry(rt - 0.06, 48), drinkMat); drink.rotation.x = -Math.PI / 2; drink.position.y = H + 0.03; g.add(drink);
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4, r = 0.08 + (k % 3) * 0.13;
      const c = new THREE.Mesh(iceGeo, iceMat); c.position.set(Math.cos(a) * r, H + 0.02 + (k % 2) * 0.04, Math.sin(a) * r);
      c.rotation.set(0.3 * (k % 3), a, 0.2 * (k % 2)); g.add(c);
    }
    return g;
  }
  const cupA = doubleCup(); cupA.position.set(2.2, 0, -0.25); scene.add(cupA); blob(1.6, 1.6, 2.32, -0.12);
  const cupB = doubleCup(); cupB.position.set(2.95, 0, -1.45); scene.add(cupB); blob(1.6, 1.6, 3.07, -1.32);
  const purpleGlow = new THREE.PointLight("#9a4dff", 2.4, 2.6, 2); purpleGlow.position.set(2.5, 1.8, -0.8); scene.add(purpleGlow);

  /* Cámara cerca del móvil */
  const target = new THREE.Vector3(), startPos = new THREE.Vector3();
  function fit() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const portrait = camera.aspect < 1;
    target.set(portrait ? 0.45 : 0.35, 0, portrait ? 0.25 : -0.15);
    const k = portrait ? Math.max(1, 0.9 / camera.aspect) : 1;
    startPos.set(portrait ? 0.55 : 0.4, (portrait ? 5.4 : 7.0) * k, (portrait ? 2.4 : 3.9) * k);
    if (!going) { camera.position.copy(startPos); camera.up.set(0, 1, 0); camera.lookAt(target); }
  }

  /* Dibujo bajo demanda (nada se mueve hasta entrar) */
  let hits: Hit[] = [], raf = 0, going: { start: number; done: () => void } | null = null;
  let ready = false;
  const render = () => { if (ready) renderer.render(scene, camera); };
  fit();
  
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity .35s ease";
  // Compila los materiales sin bloquear la página y luego muestra la escena
  renderer.compileAsync(scene, camera).catch(() => null).then(() => {
    ready = true;  render();
    renderer.domElement.style.opacity = "1";
  });
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

  const onResize = () => { fit();  render(); };
  window.addEventListener("resize", onResize);
  const raycaster = new THREE.Raycaster();
  const cast2 = (clientX: number, clientY: number) => {
    const r = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1)), camera);
    return raycaster;
  };
  /** Qué icono de la pantalla hay bajo el dedo/ratón (o "enter" si es el móvil). */
  const actionAt = (clientX: number, clientY: number): ScreenAction | null => {
    const rc = cast2(clientX, clientY);
    const onScreen = rc.intersectObject(screen)[0];
    if (onScreen?.uv) {
      const x = onScreen.uv.x * screenCanvas.width, y = (1 - onScreen.uv.y) * screenCanvas.height;
      const hit = hits.find((h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h);
      return hit?.action ?? "enter";
    }
    return rc.intersectObject(phone, true).length ? "enter" : null;
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
      const dist = Math.min((PL - 0.12) / 2 / Math.tan(fovH), (PW - 0.1) / 2 / (Math.tan(fovH) * camera.aspect)) * 0.92;
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
