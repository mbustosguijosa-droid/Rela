"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useT } from "./I18n";
import { useOnline } from "@/lib/presence";
import type { Person, Scene3D, ScreenInfo } from "./scene3d";

const KEY = "rela:intro";
type Me = { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null;

/** Botón para volver a ver la entrada. */
export function ReplayIntro({ label }: { label: string }) {
  return (
    <button type="button" className="q" onClick={() => { document.documentElement.classList.add("show-intro"); window.dispatchEvent(new Event("rela:intro")); }}>
      <span className="qi">▶</span>{label}
    </button>
  );
}

/**
 * Entrada de Rela en 3D: un escritorio con unos cascos de cable conectados al móvil.
 * La pantalla del móvil muestra tu foto, tu nombre y cuánta gente está conectada.
 * Al tocar el móvil, la cámara lo pone en vertical y entra en la pantalla.
 */
export function Intro({ me }: { me: Me }) {
  const { t } = useT();
  const holder = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene3D | null>(null);
  const [visible, setVisible] = useState(false);
  const [go, setGo] = useState(false);
  const [noGL, setNoGL] = useState(false);
  const online = useOnline(me);

  const info: ScreenInfo = useMemo(() => {
    const others = online.filter((u) => !u.anon && u.key !== me?.id);
    return {
      me: me ? { name: me.name || me.handle, handle: me.handle, avatar_url: me.avatar_url, accent: me.accent } : null,
      online: (me ? [{ name: me.name || me.handle, avatar_url: me.avatar_url, accent: me.accent }] as Person[] : ([] as Person[])).concat(others.map((u) => ({ name: u.name, avatar_url: u.avatar_url, accent: u.accent }))),
      labels: {
        hi: t.home.hi((me?.name || me?.handle || "").split(" ")[0]),
        guest: t.intro.hint,
        online: t.home.online(online.length),
        onlineNow: t.home.onlineNow,
        apps: ["fresh", "forYou", "reviews", "friends", "messages", "profile"].map((k) => t.home.apps[k]),
      },
      bg: getComputedStyleSafe("--bg") || "#121016",
    };
  }, [online, me, t]);

  const finish = useCallback(() => {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.classList.remove("show-intro");
    setVisible(false); setGo(false);
    scene.current?.dispose(); scene.current = null;
  }, []);

  const enter = useCallback(() => {
    if (go) return;
    setGo(true);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!scene.current || reduce) { setTimeout(finish, 300); return; }
    scene.current.enter(() => setTimeout(finish, 120));
  }, [go, finish]);

  // Mostrar si toca (primera vez en la sesión o al pulsar "Ver la intro")
  useEffect(() => {
    const check = () => setVisible(document.documentElement.classList.contains("show-intro"));
    check();
    window.addEventListener("rela:intro", check);
    return () => window.removeEventListener("rela:intro", check);
  }, []);

  // Cargar la escena 3D solo cuando se muestra
  useEffect(() => {
    if (!visible || scene.current || !holder.current) return;
    let cancelled = false;
    import("./scene3d").then(({ createScene }) => {
      if (cancelled || !holder.current) return;
      try { scene.current = createScene(holder.current, info); } catch { setNoGL(true); }
    }).catch(() => setNoGL(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => { scene.current?.update(info); }, [info]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!document.documentElement.classList.contains("show-intro")) return;
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); enter(); }
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter, finish]);

  return (
    <>
      {/* Decide antes de pintar si se muestra (evita parpadeos) */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(!sessionStorage.getItem("${KEY}"))document.documentElement.classList.add("show-intro")}catch(e){}` }} />
      <div className={`intro ${go ? "go" : ""} ${noGL ? "nogl" : ""}`} role="dialog" aria-label="Rela">
        <div ref={holder} className="intro-3d" onClick={(e) => { if (scene.current?.hitsPhone(e.clientX, e.clientY)) enter(); }} />
        <div className="intro-copy">
          <span className="il il1">{t.intro.l1}</span>
          <span className="il il2">{t.intro.l2}</span>
          <span className="il il3">{t.intro.l3}</span>
        </div>
        <div className="intro-cta">
          <span className="intro-online"><i />{t.home.online(online.length)}</span>
          <button type="button" className="intro-enter" onClick={enter}><span className="pulse" />{t.intro.hint}</button>
          <button type="button" className="intro-skip" onClick={finish}>{t.intro.skip}</button>
        </div>
      </div>
    </>
  );
}

function getComputedStyleSafe(name: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
