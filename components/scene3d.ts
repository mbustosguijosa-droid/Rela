// Escena 3D de la entrada de Rela (three.js, sin modelos externos).
// Escritorio de madera con unos cascos de cable conectados a un móvil cuya pantalla
// muestra la app: tu foto, tu nombre y la gente conectada.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Person = { name: string; avatar_url?: string | null; accent?: string };
export type ScreenInfo = {
  me: (Person & { handle?: string }) | null;
  online: Person[];
  labels: { hi: string; guest: string; online: string; apps: string[]; onlineNow: string };
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
  const c = document.createElement("canvas"); c.width = 1024; c.height = 1024; const g = c.getContext("2d")!;
  const grd = g.createLinearGradient(0, 0, 1024, 1024); grd.addColorStop(0, "#6a4a32"); grd.addColorStop(1, "#4a3221");
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 260; i++) {
    const y = Math.random() * 1024, amp = 6 + Math.random() * 18, a = Math.random() * 0.10 + 0.02;
    g.strokeStyle = Math.random() > 0.5 ? `rgba(30,18,10,${a})` : `rgba(255,220,180,${a * 0.5})`;
    g.lineWidth = Math.random() * 2.2 + 0.4; g.beginPath();
    for (let x = 0; x <= 1024; x += 16) g.lineTo(x, y + Math.sin(x / (80 + amp * 4) + i) * amp);
    g.stroke();
  }
  for (let k = 0; k < 7; k++) { // nudos
    const x = Math.random() * 1024, y = Math.random() * 1024;
    const r = g.createRadialGradient(x, y, 0, x, y, 30); r.addColorStop(0, "rgba(40,22,12,.45)"); r.addColorStop(1, "rgba(40,22,12,0)");
    g.fillStyle = r; g.beginPath(); g.ellipse(x, y, 60, 18, 0, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.anisotropy = 8;
  return t;
}
function vinylTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 1024; const g = c.getContext("2d")!;
  g.fillStyle = "#0c0b0d"; g.fillRect(0, 0, 1024, 1024);
  for (let r = 160; r < 510; r += 3) { g.strokeStyle = `rgba(255,255,255,${0.025 + Math.random() * 0.03})`; g.lineWidth = 1; g.beginPath(); g.arc(512, 512, r, 0, 7); g.stroke(); }
  const sh = g.createLinearGradient(0, 0, 1024, 1024); sh.addColorStop(0.35, "rgba(255,255,255,0)"); sh.addColorStop(0.5, "rgba(255,255,255,.09)"); sh.addColorStop(0.65, "rgba(255,255,255,0)");
  g.fillStyle = sh; g.beginPath(); g.arc(512, 512, 510, 0, 7); g.fill();
  g.fillStyle = "#ee9a62"; g.beginPath(); g.arc(512, 512, 150, 0, 7); g.fill();
  g.fillStyle = "#2b1607"; g.font = "700 46px Fraunces, Georgia, serif"; g.textAlign = "center"; g.fillText("Rela", 512, 500);
  g.font = "500 22px Figtree, sans-serif"; g.fillText("SIDE A · 33⅓", 512, 540);
  g.fillStyle = "#0c0b0d"; g.beginPath(); g.arc(512, 512, 12, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

/* ---------- Pantalla del móvil ---------- */
function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

async function drawScreen(g: CanvasRenderingContext2D, info: ScreenInfo, tick: number) {
  const W = g.canvas.width, H = g.canvas.height;
  g.clearRect(0, 0, W, H);
  g.save(); roundRect(g, 0, 0, W, H, 78); g.clip();
  const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#241a14"); bg.addColorStop(1, "#110d0b"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.7, H * 0.1, 0, W * 0.7, H * 0.1, W); glow.addColorStop(0, "rgba(238,154,98,.35)"); glow.addColorStop(1, "rgba(238,154,98,0)"); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // barra de estado e isla
  g.fillStyle = "#000"; roundRect(g, W / 2 - 80, 26, 160, 46, 23); g.fill();
  g.fillStyle = "#fbf3ea"; g.font = "600 30px Figtree, sans-serif"; g.textAlign = "left"; g.fillText("9:41", 48, 60);
  g.textAlign = "right"; g.fillText("●●● ▮", W - 44, 60); g.textAlign = "left";

  // Tú
  const me = info.me, accent = me?.accent ?? "#ee9a62";
  const ax = 52, ay = 120, as = 128;
  g.save(); g.beginPath(); g.arc(ax + as / 2, ay + as / 2, as / 2, 0, 7); g.clip();
  const av = me?.avatar_url ? await loadImg(me.avatar_url) : null;
  if (av) g.drawImage(av, ax, ay, as, as);
  else { g.fillStyle = accent; g.fillRect(ax, ay, as, as); g.fillStyle = "#2b1607"; g.font = "700 64px Fraunces, Georgia, serif"; g.textAlign = "center"; g.fillText((me?.name || "R")[0].toUpperCase(), ax + as / 2, ay + as / 2 + 22); g.textAlign = "left"; }
  g.restore();
  g.strokeStyle = accent; g.lineWidth = 6; g.beginPath(); g.arc(ax + as / 2, ay + as / 2, as / 2 + 6, 0, 7); g.stroke();
  g.fillStyle = "#fbf3ea"; g.font = "600 52px Fraunces, Georgia, serif"; g.fillText(me ? info.labels.hi : "Rela", 204, 182);
  g.fillStyle = "rgba(251,243,234,.6)"; g.font = "500 30px Figtree, sans-serif"; g.fillText(me ? `@${me.handle ?? ""}` : info.labels.guest, 206, 226);

  // Conectados
  const py = 300; g.fillStyle = "rgba(255,255,255,.07)"; roundRect(g, 44, py, W - 88, 170, 34); g.fill();
  g.fillStyle = "rgba(251,243,234,.6)"; g.font = "600 24px Figtree, sans-serif"; g.fillText(info.labels.onlineNow.toUpperCase(), 76, py + 48);
  const pulse = 0.5 + 0.5 * Math.sin(tick * 3);
  g.fillStyle = `rgba(95,211,155,${0.25 + pulse * 0.35})`; g.beginPath(); g.arc(90, py + 104, 18 + pulse * 6, 0, 7); g.fill();
  g.fillStyle = "#5fd39b"; g.beginPath(); g.arc(90, py + 104, 11, 0, 7); g.fill();
  g.fillStyle = "#fbf3ea"; g.font = "700 46px Figtree, sans-serif"; g.fillText(info.labels.online, 124, py + 120);
  const people = info.online.slice(0, 5);
  for (let i = people.length - 1; i >= 0; i--) {
    const p = people[i], x = W - 92 - i * 50, y = py + 104, r = 30;
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const im = p.avatar_url ? await loadImg(p.avatar_url) : null;
    if (im) g.drawImage(im, x - r, y - r, r * 2, r * 2);
    else { g.fillStyle = p.accent ?? "#7a6a5c"; g.fillRect(x - r, y - r, r * 2, r * 2); g.fillStyle = "#2b1607"; g.font = "700 28px Figtree, sans-serif"; g.textAlign = "center"; g.fillText((p.name || "?")[0].toUpperCase(), x, y + 10); g.textAlign = "left"; }
    g.restore(); g.strokeStyle = "#1a130f"; g.lineWidth = 5; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  }

  // Iconos de la app
  const icons: [string, string, string][] = [["#ee9a62", "#f6c28b", "♫"], ["#e2615a", "#f39a7c", "✦"], ["#7a5ea8", "#b19ae0", "✎"], ["#2f8a7f", "#7fd3c2", "☺"], ["#3d6fb6", "#86b4f0", "✉"], ["#d8a425", "#ffd23f", "◎"]];
  const cols = 3, s = 128, gapX = (W - 88 - cols * s) / (cols - 1), top = 530;
  icons.forEach(([c1, c2, glyph], i) => {
    const x = 44 + (i % cols) * (s + gapX), y = top + Math.floor(i / cols) * (s + 86);
    const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, c2); gr.addColorStop(1, c1);
    g.fillStyle = gr; roundRect(g, x, y, s, s, 34); g.fill();
    g.fillStyle = "rgba(255,255,255,.18)"; roundRect(g, x, y, s, s / 2, 34); g.fill();
    g.fillStyle = "#fff"; g.font = "600 60px Figtree, sans-serif"; g.textAlign = "center"; g.fillText(glyph, x + s / 2, y + s / 2 + 21);
    g.fillStyle = "rgba(251,243,234,.85)"; g.font = "500 25px Figtree, sans-serif"; g.fillText(info.labels.apps[i] ?? "", x + s / 2, y + s + 36); g.textAlign = "left";
  });
  // Ecualizador en el icono de Novedades
  for (let k = 0; k < 4; k++) { const h = 16 + Math.abs(Math.sin(tick * 4 + k * 1.3)) * 40; g.fillStyle = "rgba(255,255,255,.95)"; roundRect(g, 44 + 30 + k * 18, top + s - 26 - h, 10, h, 5); g.fill(); }

  // Dock
  g.fillStyle = "rgba(255,255,255,.08)"; roundRect(g, 40, H - 170, W - 80, 128, 44); g.fill();
  g.fillStyle = "#FFD23F"; g.beginPath(); g.arc(W / 2, H - 106, 40, Math.PI, 0); g.lineWidth = 14; g.strokeStyle = "#FFD23F"; g.stroke();
  roundRect(g, W / 2 - 52, H - 110, 26, 40, 13); g.fill(); roundRect(g, W / 2 + 26, H - 110, 26, 40, 13); g.fill();
  g.restore();
}

/* ---------- Escena ---------- */
export function createScene(container: HTMLElement, initial: ScreenInfo) {
  let info = initial;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1c130d");
  scene.fog = new THREE.Fog("#1c130d", 14, 26);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);

  // Luces: lámpara cálida + relleno
  const key = new THREE.DirectionalLight("#ffe2c2", 2.6); key.position.set(-3.5, 9, 3); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -7; key.shadow.camera.right = 7; key.shadow.camera.top = 7; key.shadow.camera.bottom = -7; key.shadow.radius = 6; key.shadow.bias = -0.0004;
  scene.add(key);
  scene.add(new THREE.HemisphereLight("#ffe9d6", "#2a1a10", 0.55));
  const lamp = new THREE.PointLight("#ffb780", 18, 9, 1.8); lamp.position.set(1.2, 3.2, -0.6); scene.add(lamp);

  // Mesa
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.62, metalness: 0 }));
  desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; scene.add(desk);

  // Materiales
  const matte = new THREE.MeshPhysicalMaterial({ color: "#17151a", roughness: 0.5, metalness: 0.1, clearcoat: 0.25, clearcoatRoughness: 0.6 });
  const leather = new THREE.MeshPhysicalMaterial({ color: "#221e24", roughness: 0.42, metalness: 0, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color("#4a4250") });
  const metal = new THREE.MeshStandardMaterial({ color: "#cfcbd4", roughness: 0.22, metalness: 1 });
  const accent = new THREE.MeshStandardMaterial({ color: "#ee9a62", roughness: 0.35, metalness: 0.3 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#121113", roughness: 0.55 });
  const cast = (o: THREE.Object3D) => o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = true; m.receiveShadow = true; } });

  /* Cascos */
  const phones = new THREE.Group();
  const bandR = 1.18;
  const band = new THREE.Mesh(new THREE.TorusGeometry(bandR, 0.075, 24, 96, Math.PI), matte);
  const pad = new THREE.Mesh(new THREE.TorusGeometry(bandR - 0.05, 0.11, 24, 96, Math.PI * 0.62), leather);
  pad.rotation.z = Math.PI * 0.19;
  const stitch = new THREE.Mesh(new THREE.TorusGeometry(bandR + 0.035, 0.012, 8, 96, Math.PI * 0.62), metal); stitch.rotation.z = Math.PI * 0.19;
  const bandGroup = new THREE.Group(); bandGroup.add(band, pad, stitch); bandGroup.rotation.x = -Math.PI / 2; bandGroup.position.y = 0.36;
  phones.add(bandGroup);
  [-1, 1].forEach((side) => {
    const cup = new THREE.Group();
    const slider = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.42, 16), metal); slider.position.set(0, 0.36, -0.12); slider.rotation.x = Math.PI / 2;
    const yoke = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.03, 12, 48, Math.PI), metal); yoke.rotation.x = -Math.PI / 2; yoke.position.set(0, 0.36, 0.05); yoke.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.54, 0.34, 64), matte); shell.scale.z = 1.22; shell.position.y = 0.24;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), matte); cap.scale.set(1, 0.18, 1.22); cap.position.y = 0.41;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.022, 12, 80), metal); ring.rotation.x = Math.PI / 2; ring.scale.y = 1.22; ring.position.y = 0.41;
    const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 32), accent); dot.position.y = 0.5;
    const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.12, 24, 80), leather); cushion.rotation.x = Math.PI / 2; cushion.scale.y = 1.2; cushion.position.y = 0.1;
    cup.add(slider, yoke, shell, cap, ring, dot, cushion);
    cup.position.set(side * bandR, 0, 0);
    phones.add(cup);
  });
  phones.position.set(-1.55, 0, -0.75); phones.rotation.y = 0.55; cast(phones); scene.add(phones);

  /* Móvil */
  const phone = new THREE.Group();
  const PW = 1.5, PL = 3.1, PT = 0.1;
  const body = new THREE.Mesh(new RoundedBoxGeometry(PW, PT, PL, 8, 0.2), new THREE.MeshPhysicalMaterial({ color: "#1d1b21", metalness: 0.75, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }));
  body.position.y = PT / 2; phone.add(body);
  const screenCanvas = document.createElement("canvas"); screenCanvas.width = 560; screenCanvas.height = Math.round(560 * (PL - 0.12) / (PW - 0.1));
  const sg = screenCanvas.getContext("2d")!;
  const screenTex = new THREE.CanvasTexture(screenCanvas); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.1, PL - 0.12), new THREE.MeshBasicMaterial({ map: screenTex, transparent: true, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; screen.position.y = PT + 0.002; phone.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.06, PL - 0.06), new THREE.MeshPhysicalMaterial({ transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, clearcoat: 1, color: "#ffffff" }));
  glass.rotation.x = -Math.PI / 2; glass.position.y = PT + 0.004; phone.add(glass);
  const fadeMat = new THREE.MeshBasicMaterial({ color: info.bg, transparent: true, opacity: 0, toneMapped: false });
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.1, PL - 0.12), fadeMat); fade.rotation.x = -Math.PI / 2; fade.position.y = PT + 0.006; phone.add(fade);
  const port = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.04), rubber); port.position.set(0, PT / 2, PL / 2 + 0.005); phone.add(port);
  phone.position.set(1.05, 0, 0.35); phone.rotation.y = -0.28; cast(phone); scene.add(phone);

  /* Cable de los cascos al móvil */
  phones.updateMatrixWorld(); phone.updateMatrixWorld();
  const from = new THREE.Vector3(-bandR, 0.12, 0.62).applyMatrix4(phones.matrixWorld);
  const to = new THREE.Vector3(0, PT / 2, PL / 2 + 0.32).applyMatrix4(phone.matrixWorld);
  const curve = new THREE.CatmullRomCurve3([
    from, new THREE.Vector3(from.x - 0.3, 0.05, from.z + 1.2), new THREE.Vector3(-2.2, 0.035, 2.1), new THREE.Vector3(-0.6, 0.035, 2.9),
    new THREE.Vector3(0.9, 0.035, 2.6), new THREE.Vector3(to.x - 0.2, 0.035, to.z + 0.5), to,
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 260, 0.032, 10), rubber); cable.castShadow = true; scene.add(cable);
  const plug = new THREE.Group();
  const plugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 20), rubber); plugBody.rotation.x = Math.PI / 2;
  const plugTip = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 20), metal); plugTip.rotation.x = Math.PI / 2; plugTip.position.z = -0.22;
  plug.add(plugBody, plugTip); plug.position.copy(new THREE.Vector3(0, PT / 2, PL / 2 + 0.2).applyMatrix4(phone.matrixWorld)); plug.rotation.y = phone.rotation.y; cast(plug); scene.add(plug);

  /* Vinilo y taza */
  const vinyl = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.035, 128), [new THREE.MeshStandardMaterial({ color: "#0c0b0d", roughness: 0.4 }), new THREE.MeshPhysicalMaterial({ map: vinylTexture(), roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }), new THREE.MeshStandardMaterial({ color: "#0c0b0d" })]);
  vinyl.position.set(-4.4, 0.018, 2.6); vinyl.castShadow = true; vinyl.receiveShadow = true; scene.add(vinyl);
  const mug = new THREE.Group();
  const profile = [new THREE.Vector2(0, 0), new THREE.Vector2(0.52, 0), new THREE.Vector2(0.56, 0.06), new THREE.Vector2(0.6, 1.0), new THREE.Vector2(0.54, 1.0), new THREE.Vector2(0.5, 0.12), new THREE.Vector2(0, 0.12)];
  const ceramic = new THREE.MeshPhysicalMaterial({ color: "#efe5d8", roughness: 0.3, clearcoat: 0.6 });
  mug.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 64), ceramic));
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.52, 48), new THREE.MeshPhysicalMaterial({ color: "#3b2013", roughness: 0.15, clearcoat: 1 })); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.82; mug.add(coffee);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 16, 40, Math.PI * 1.2), ceramic); handle.position.set(0.66, 0.5, 0); handle.rotation.z = -Math.PI * 0.6; mug.add(handle);
  mug.position.set(3.6, 0, -2.0); cast(mug); scene.add(mug);

  /* Cámara: vista de 3/4 desde arriba que se ajusta a la pantalla */
  const target = new THREE.Vector3(0.1, 0, 0.35);
  const startPos = new THREE.Vector3();
  function fit() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const portrait = camera.aspect < 1;
    const k = portrait ? Math.max(1, 0.8 / camera.aspect) : 1;
    startPos.set(portrait ? 0.6 : 0.4, 7.6 * k, (portrait ? 3.6 : 4.6) * k);
    target.set(portrait ? 0.6 : 0.1, 0, portrait ? 0.45 : 0.35);
    camera.updateProjectionMatrix();
  }
  fit();
  camera.position.copy(startPos); camera.lookAt(target);

  /* Animación */
  let raf = 0, t0 = performance.now(), lastScreen = 0, going: { start: number; done: () => void } | null = null;
  const pointer = new THREE.Vector2(0, 0);
  const raycaster = new THREE.Raycaster();
  const fromPos = new THREE.Vector3(), fromUp = new THREE.Vector3(), fromLook = new THREE.Vector3();
  const endLook = new THREE.Vector3(), endPos = new THREE.Vector3(), endUp = new THREE.Vector3();
  let drawing = false;

  const redraw = async (tick: number) => {
    if (drawing) return; drawing = true;
    await drawScreen(sg, info, tick); screenTex.needsUpdate = true; drawing = false;
  };
  redraw(0);

  function frame(now: number) {
    const tick = (now - t0) / 1000;
    if (now - lastScreen > 80) { lastScreen = now; redraw(tick); }
    if (!going) {
      // ligero movimiento de cámara que sigue al ratón
      const sway = new THREE.Vector3(Math.sin(tick * 0.25) * 0.35 + pointer.x * 0.6, Math.sin(tick * 0.18) * 0.12, pointer.y * 0.35);
      camera.position.lerp(startPos.clone().add(sway), 0.05);
      camera.up.set(0, 1, 0); camera.lookAt(target);
    } else {
      const p = Math.min(1, (now - going.start) / 1600), e = ease(p);
      camera.position.lerpVectors(fromPos, endPos, e);
      camera.up.lerpVectors(fromUp, endUp, e).normalize();
      camera.lookAt(new THREE.Vector3().lerpVectors(fromLook, endLook, e));
      fadeMat.opacity = Math.max(0, (p - 0.62) / 0.38);
      if (p >= 1) { const d = going.done; going = null; d(); }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  const onResize = () => { fit(); };
  window.addEventListener("resize", onResize);
  const onMove = (e: PointerEvent) => {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
    raycaster.setFromCamera(new THREE.Vector2(pointer.x, -pointer.y), camera);
    renderer.domElement.style.cursor = raycaster.intersectObject(phone, true).length ? "pointer" : "default";
  };
  renderer.domElement.addEventListener("pointermove", onMove);

  return {
    canvas: renderer.domElement,
    hitsPhone(clientX: number, clientY: number) {
      const r = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -(((clientY - r.top) / r.height) * 2 - 1)), camera);
      return raycaster.intersectObject(phone, true).length > 0;
    },
    update(next: ScreenInfo) { info = next; fadeMat.color.set(next.bg); },
    /** Gira la vista hasta poner el móvil en vertical y entra en la pantalla. */
    enter(done: () => void) {
      if (going) return;
      phone.updateMatrixWorld();
      const center = new THREE.Vector3(0, PT, 0).applyMatrix4(phone.matrixWorld);
      const top = new THREE.Vector3(0, 0, -1).applyQuaternion(phone.quaternion).normalize(); // parte de arriba del móvil
      const fovH = THREE.MathUtils.degToRad(camera.fov) / 2;
      // distancia para que la pantalla llene la vista (alto y ancho)
      const dH = (PL - 0.12) / 2 / Math.tan(fovH);
      const dW = (PW - 0.1) / 2 / (Math.tan(fovH) * camera.aspect);
      const dist = Math.min(dH, dW) * 0.92;
      fromPos.copy(camera.position); fromUp.copy(camera.up); fromLook.copy(target);
      endLook.copy(center); endPos.copy(center).add(new THREE.Vector3(0, dist, 0)); endUp.copy(top);
      going = { start: performance.now(), done };
    },
    dispose() {
      cancelAnimationFrame(raf); window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.dispose(); pmrem.dispose(); renderer.domElement.remove();
    },
  };
}

export type Scene3D = ReturnType<typeof createScene>;
