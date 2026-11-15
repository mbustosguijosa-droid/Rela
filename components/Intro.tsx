"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "./I18n";

const KEY = "rela:intro";
const ZOOM_MS = 1900;

/** Botón para volver a ver la entrada. */
export function ReplayIntro({ label }: { label: string }) {
  return (
    <button type="button" className="q" onClick={() => { document.documentElement.classList.add("show-intro"); window.dispatchEvent(new Event("rela:intro")); }}>
      <span className="qi">▶</span>{label}
    </button>
  );
}

/**
 * Entrada de Rela: un escritorio visto desde arriba con unos cascos de cable conectados al móvil.
 * Espera a que toques el móvil; entonces la cámara gira hasta ponerlo en vertical y entra en la pantalla.
 * Sale una vez por sesión (y se puede repetir desde el inicio).
 */
export function Intro() {
  const { t } = useT();
  const [go, setGo] = useState(false);
  const svg = useRef<SVGSVGElement>(null);

  const finish = useCallback(() => {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.classList.remove("show-intro");
    setGo(false);
  }, []);

  const enter = useCallback(() => {
    if (go) return;
    const el = svg.current;
    if (el) {
      // Centro de la pantalla del móvil (215,215 en el dibujo) en coordenadas de la ventana
      const W = el.clientWidth, H = el.clientHeight, s = Math.max(W / 400, H / 400);
      el.style.transformOrigin = `${W / 2 + 15 * s}px ${H / 2 + 15 * s}px`;
    }
    setGo(true);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(finish, reduce ? 250 : ZOOM_MS);
  }, [go, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!document.documentElement.classList.contains("show-intro")) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); }
      if (e.key === "Escape") finish();
    };
    const onReplay = () => setGo(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("rela:intro", onReplay);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("rela:intro", onReplay); };
  }, [enter, finish]);

  return (
    <>
      {/* Decide antes de pintar si se muestra (evita parpadeos) */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(!sessionStorage.getItem("${KEY}"))document.documentElement.classList.add("show-intro")}catch(e){}` }} />
      <div className={`intro ${go ? "go" : ""}`} role="dialog" aria-label="Rela">
        <svg ref={svg} className="intro-desk" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#5a3f2c" /><stop offset=".5" stopColor="#47311f" /><stop offset="1" stopColor="#33231a" />
            </linearGradient>
            <radialGradient id="lampLight" cx=".54" cy=".52" r=".6">
              <stop offset="0" stopColor="#ffcf9e" stopOpacity=".28" /><stop offset=".6" stopColor="#ffcf9e" stopOpacity=".05" /><stop offset="1" stopColor="#000" stopOpacity=".55" />
            </radialGradient>
            <radialGradient id="cupShell" cx=".4" cy=".35" r=".75">
              <stop offset="0" stopColor="#3b3640" /><stop offset=".55" stopColor="#1e1b22" /><stop offset="1" stopColor="#0e0c10" />
            </radialGradient>
            <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#77727f" /><stop offset=".4" stopColor="#2a2730" /><stop offset="1" stopColor="#5b5763" />
            </linearGradient>
            <radialGradient id="mugIn" cx=".45" cy=".4" r=".6">
              <stop offset="0" stopColor="#7a4a2a" /><stop offset="1" stopColor="#3a2014" />
            </radialGradient>
            <filter id="sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="5" dy="9" stdDeviation="6" floodColor="#120a05" floodOpacity=".55" /></filter>
            <filter id="shs" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2.5" dy="4" stdDeviation="2.5" floodColor="#120a05" floodOpacity=".55" /></filter>
          </defs>

          {/* Mesa de madera */}
          <rect width="400" height="400" fill="url(#wood)" />
          <g stroke="#000" strokeOpacity=".16" strokeWidth=".7" fill="none">
            {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M-10 ${i * 19 + 4} C 90 ${i * 19 - 6}, 210 ${i * 19 + 14}, 410 ${i * 19 + 2}`} />)}
          </g>
          <g stroke="#fff" strokeOpacity=".035" strokeWidth=".5" fill="none">
            {Array.from({ length: 22 }, (_, i) => <path key={i} d={`M-10 ${i * 19 + 12} C 120 ${i * 19 + 4}, 260 ${i * 19 + 20}, 410 ${i * 19 + 9}`} />)}
          </g>

          {/* Vinilo */}
          <g className="prop" filter="url(#sh)">
            <circle cx="38" cy="335" r="96" fill="#0f0e10" />
            {Array.from({ length: 14 }, (_, i) => <circle key={i} cx="38" cy="335" r={40 + i * 4} fill="none" stroke="#fff" strokeOpacity=".045" />)}
            <circle cx="38" cy="335" r="30" fill="#ee9a62" /><circle cx="38" cy="335" r="3" fill="#0f0e10" />
            <path d="M-30 280 A 96 96 0 0 1 60 242" stroke="#fff" strokeOpacity=".12" strokeWidth="6" fill="none" strokeLinecap="round" />
          </g>

          {/* Taza de café */}
          <g className="prop" filter="url(#sh)">
            <path d="M352 96 h14 a10 10 0 0 1 0 20 h-14" fill="none" stroke="#e9dfd2" strokeWidth="6" />
            <circle cx="330" cy="106" r="27" fill="#efe6da" />
            <circle cx="330" cy="106" r="21" fill="url(#mugIn)" />
            <ellipse cx="324" cy="100" rx="6" ry="3" fill="#fff" opacity=".18" />
          </g>

          {/* Cable de los cascos al móvil */}
          <g filter="url(#shs)">
            <path d="M112 143 C 92 196, 108 252, 152 258 S 196 252, 206 270 S 214 296, 230 288" fill="none" stroke="#141216" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M112 143 C 92 196, 108 252, 152 258 S 196 252, 206 270 S 214 296, 230 288" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth=".8" strokeLinecap="round" transform="translate(-.6 -.6)" />
            <g transform="rotate(-12 229 284)">
              <rect x="225.5" y="280" width="7" height="13" rx="2.2" fill="#232026" />
              <rect x="227.2" y="275.5" width="3.6" height="5" rx="1" fill="#c9c6cf" />
            </g>
          </g>

          {/* Cascos vistos desde arriba */}
          <g transform="translate(155 125) rotate(20)" filter="url(#sh)">
            <path d="M-34 -2 C -38 -56, 38 -56, 34 -2" fill="none" stroke="#141216" strokeWidth="11" strokeLinecap="round" />
            <path d="M-31 -6 C -33 -48, 33 -48, 31 -6" fill="none" stroke="#2d2932" strokeWidth="5" strokeLinecap="round" />
            <path d="M-29 -10 C -30 -46, 30 -46, 29 -10" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="1" strokeLinecap="round" />
            {[-1, 1].map((d) => (
              <g key={d} transform={`translate(${d * 34} 12)`}>
                <path d={`M${-d * 2} -18 v -6`} stroke="#a5a1ab" strokeWidth="2.6" strokeLinecap="round" />
                <ellipse rx="16" ry="22" fill="url(#cupShell)" stroke="#3d3843" strokeWidth="1.2" />
                <ellipse rx="11" ry="16" fill="none" stroke="#fff" strokeOpacity=".06" />
                <circle r="3.4" fill="#ee9a62" />
                <path d="M-9 -12 a14 18 0 0 1 10 -6" stroke="#fff" strokeOpacity=".22" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </g>

          {/* Móvil */}
          <g className="phone" transform="rotate(-12 215 215)" filter="url(#sh)" onClick={enter} role="button" aria-label={t.intro.enter}>
            <rect className="tapring" x="179" y="146" width="72" height="138" rx="15" fill="none" stroke="#ee9a62" strokeWidth="2" />
            <rect x="183" y="150" width="64" height="130" rx="12" fill="#121114" stroke="url(#frame)" strokeWidth="2" />
            <rect className="screen" x="187" y="154" width="56" height="122" rx="9" fill="#141117" />
            <g className="ui">
              <rect x="207" y="158" width="16" height="4.5" rx="2.25" fill="#000" />
              <circle cx="195" cy="171" r="3.2" fill="#FFD23F" />
              <rect x="201" y="169.3" width="16" height="3.4" rx="1.7" fill="#efe9f2" opacity=".85" />
              <rect x="192" y="181" width="40" height="5" rx="2.5" fill="#efe9f2" opacity=".9" />
              <rect x="192" y="189" width="28" height="3" rx="1.5" fill="#efe9f2" opacity=".35" />
              <rect x="192" y="198" width="22" height="22" rx="3" fill="#ee9a62" />
              <rect x="216" y="198" width="22" height="22" rx="3" fill="#6b4a6e" />
              <rect x="192" y="222" width="22" height="22" rx="3" fill="#2f6f6a" />
              <rect x="216" y="222" width="22" height="22" rx="3" fill="#f6c28b" />
              <g className="eqb" fill="#fff">
                <rect x="197" y="205" width="2.2" height="8" rx="1.1" /><rect x="201" y="203" width="2.2" height="12" rx="1.1" /><rect x="205" y="206" width="2.2" height="6" rx="1.1" />
              </g>
              <rect x="192" y="250" width="46" height="9" rx="4.5" fill="#ee9a62" opacity=".9" />
              <rect x="196" y="266" width="38" height="3" rx="1.5" fill="#efe9f2" opacity=".25" />
            </g>
          </g>

          {/* Luz de lámpara y viñeta */}
          <rect width="400" height="400" fill="url(#lampLight)" pointerEvents="none" />
        </svg>

        <div className="intro-copy">
          <span className="il il1">{t.intro.l1}</span>
          <span className="il il2">{t.intro.l2}</span>
          <span className="il il3">{t.intro.l3}</span>
        </div>
        <div className="intro-cta">
          <button type="button" className="intro-enter" onClick={enter}><span className="pulse" />{t.intro.hint}</button>
          <button type="button" className="intro-skip" onClick={finish}>{t.intro.skip}</button>
        </div>
      </div>
    </>
  );
}
