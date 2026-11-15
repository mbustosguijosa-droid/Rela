"use client";

import { useEffect } from "react";
import { useT } from "./I18n";

const KEY = "rela:intro";
const TOTAL_MS = 5600;

/**
 * Animación de entrada: mesa, cascos y móvil. El cable "conecta" los cascos al móvil,
 * la pantalla se enciende y la cámara entra en ella para mostrar la web.
 * Solo sale una vez por sesión y nunca si la persona prefiere menos movimiento.
 */
export function Intro() {
  const { t } = useT();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("show-intro")) return;
    const finish = () => {
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      root.classList.remove("show-intro");
    };
    // Termina cuando acaba la animación de salida (o, por seguridad, a los 9 s)
    const el = document.querySelector(".intro");
    const onEnd = (e: Event) => { if ((e as AnimationEvent).animationName === "intro-out") finish(); };
    el?.addEventListener("animationend", onEnd);
    const timer = setTimeout(finish, TOTAL_MS + 3400);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") finish(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); el?.removeEventListener("animationend", onEnd); window.removeEventListener("keydown", onKey); };
  }, []);

  const skip = () => {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.classList.remove("show-intro");
  };

  return (
    <>
      {/* Decide antes de pintar si se muestra (evita parpadeos) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(!sessionStorage.getItem("${KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("show-intro")}catch(e){}`,
        }}
      />
      <div className="intro" aria-hidden="true">
        <div className="intro-glow" />
        <div className="intro-copy">
          <span className="il il1">{t.intro.l1}</span>
          <span className="il il2">{t.intro.l2}</span>
          <span className="il il3">{t.intro.l3}</span>
        </div>
        <svg className="intro-scene" viewBox="0 0 360 260" role="presentation">
          <defs>
            <linearGradient id="scr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a77bff" />
              <stop offset="1" stopColor="#6d3fe0" />
            </linearGradient>
            <radialGradient id="lamp" cx="0.5" cy="0" r="0.9">
              <stop offset="0" stopColor="#8b5cf6" stopOpacity=".16" />
              <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* luz sobre la mesa */}
          <ellipse cx="180" cy="196" rx="170" ry="40" fill="url(#lamp)" />
          {/* mesa */}
          <g className="desk">
            <rect x="18" y="190" width="324" height="9" rx="4.5" fill="#2b2536" />
            <rect x="40" y="199" width="6" height="61" rx="3" fill="#221d2b" />
            <rect x="314" y="199" width="6" height="61" rx="3" fill="#221d2b" />
          </g>
          {/* cable de los cascos al móvil */}
          <path className="cable" d="M114 186 C 120 192, 128 189.5, 150 189.5 S 196 190, 204 190" fill="none" stroke="#8b5cf6" strokeWidth="2.6" strokeLinecap="round" pathLength="1" />
          <circle className="spark" r="3.4" fill="#fff" />
          {/* cascos (el logo) */}
          <g className="phones" transform="translate(56 125) scale(2.05)">
            <path d="M7 19.5V16a9 9 0 0 1 18 0v3.5" fill="none" stroke="#1b1424" strokeWidth="5" strokeLinecap="round" />
            <path d="M7 19.5V16a9 9 0 0 1 18 0v3.5" fill="none" stroke="#FFD23F" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="2.8" y="16.2" width="8.4" height="12.6" rx="4.2" fill="#FFD23F" stroke="#1b1424" strokeWidth="1.6" />
            <rect x="20.8" y="16.2" width="8.4" height="12.6" rx="4.2" fill="#FFD23F" stroke="#1b1424" strokeWidth="1.6" />
            <rect x="7.6" y="18.6" width="2" height="7.8" rx="1" fill="#E89B00" />
            <rect x="22.4" y="18.6" width="2" height="7.8" rx="1" fill="#E89B00" />
            <path d="M4.9 19.6v2.6M22.9 19.6v2.6" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity=".85" />
          </g>
          {/* ondas de sonido */}
          <g className="waves" fill="none" stroke="#FFD23F" strokeWidth="1.6" strokeLinecap="round">
            <path className="w w1" d="M54 150 a14 14 0 0 0 0 24" />
            <path className="w w2" d="M46 144 a22 22 0 0 0 0 36" />
            <path className="w w3" d="M126 150 a14 14 0 0 1 0 24" />
            <path className="w w4" d="M134 144 a22 22 0 0 1 0 36" />
          </g>
          {/* móvil */}
          <g className="phone">
            <rect x="172" y="78" width="64" height="114" rx="11" fill="#14111a" stroke="#3b3448" strokeWidth="2" />
            <rect className="screen-off" x="177" y="86" width="54" height="98" rx="7" fill="#0b0a0f" />
            <rect className="screen-on" x="177" y="86" width="54" height="98" rx="7" fill="url(#scr)" />
            <g className="eq" fill="#fff">
              <rect className="b b1" x="186" y="122" width="5" height="24" rx="2.5" />
              <rect className="b b2" x="194.5" y="116" width="5" height="36" rx="2.5" />
              <rect className="b b3" x="203" y="112" width="5" height="44" rx="2.5" />
              <rect className="b b4" x="211.5" y="118" width="5" height="32" rx="2.5" />
              <rect className="b b5" x="220" y="124" width="5" height="20" rx="2.5" />
            </g>
            <rect x="198" y="81" width="12" height="2.4" rx="1.2" fill="#2b2536" />
          </g>
        </svg>
        <button type="button" className="intro-skip" onClick={skip}>{t.intro.skip} →</button>
      </div>
    </>
  );
}
