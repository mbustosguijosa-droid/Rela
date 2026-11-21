"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./Icon";
import { useRouter } from "next/navigation";
import { useT } from "./I18n";
import { useOnline } from "@/lib/presence";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Album, Scene3D, ScreenAction, ScreenInfo } from "./scene3d";

const KEY = "rela:intro";
type Me = { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null;
type Friend = { id: string; handle: string; name: string; avatar_url: string | null; accent: string };

/** Botón para volver a ver la entrada. */
export function ReplayIntro({ label }: { label: string }) {
  return (
    <button type="button" className="q" onClick={() => { document.documentElement.classList.add("show-intro"); window.dispatchEvent(new Event("rela:intro")); }}>
      <span className="qi"><Icon name="play" filled size={14} /></span>{label}
    </button>
  );
}

/**
 * Entrada de Rela en 3D: mesa con cascos de cable conectados al móvil y un double cup.
 * La pantalla del móvil es una pantalla de inicio con tu foto, la gente conectada y,
 * si no has entrado, "Entrar con Google". Todo está quieto hasta que tocas el móvil.
 */
export function Intro({ me, friends = [], top4 = [] }: { me: Me; friends?: Friend[]; top4?: Album[] }) {
  const { t } = useT();
  const router = useRouter();
  const holder = useRef<HTMLDivElement>(null);
  const scene = useRef<Scene3D | null>(null);
  const [visible, setVisible] = useState(false);
  const [go, setGo] = useState(false);
  const [noGL, setNoGL] = useState(false);
  const online = useOnline(me);

  const info: ScreenInfo = useMemo(() => {
    const others = online.filter((u) => !u.anon && u.key !== me?.id);
    const onlineIds = new Set(online.map((u) => u.key));
    return {
      me: me ? { name: me.name || me.handle, handle: me.handle, avatar_url: me.avatar_url, accent: me.accent } : null,
      online: others.map((u) => ({ name: u.name, handle: u.handle, avatar_url: u.avatar_url, accent: u.accent })),
      friends: [...friends].sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id))).map((f) => ({ ...f, online: onlineIds.has(f.id) })),
      top4,
      onlineCount: online.length,
      labels: {
        online: t.home.online(online.length), onlineNow: t.home.onlineNow, you: t.intro.you, google: t.intro.google, email: t.intro.email,
        enter: t.intro.enter, messages: t.dm.nav, friends: t.nav.friends, explore: t.intro.explore, nobody: t.intro.nobody,
        top4: t.intro.top4, noFriends: t.intro.noFriends, profile: t.intro.profile, hi: t.home.hi((me?.name || me?.handle || "").split(" ")[0]),
      },
      bg: typeof window === "undefined" ? "#121016" : getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#121016",
    };
  }, [online, me, t, friends, top4]);

  const finish = useCallback(() => {
    try { sessionStorage.setItem(KEY, "1"); } catch {}
    document.documentElement.classList.remove("show-intro");
    setVisible(false); setGo(false);
    scene.current?.dispose(); scene.current = null;
  }, []);

  /** Animación de entrar en el móvil; después, opcionalmente, ir a otra página. */
  const enter = useCallback((to?: string) => {
    if (go) return;
    setGo(true);
    let ended = false;
    const done = () => { if (ended) return; ended = true; clearTimeout(safety); if (to) router.push(to); setTimeout(finish, to ? 60 : 120); };
    // Red de seguridad: si por lo que sea la animación no termina (gráfica lenta, modelos sin cargar), se entra igual
    const safety = setTimeout(done, 4000);
    // Antes, con "reducir movimiento" (activado por defecto en muchos Windows) se saltaba la animación del móvil
    if (!scene.current) { setTimeout(done, 250); return; }
    scene.current.enter(done);
  }, [go, finish, router]);

  const onAction = useCallback(async (a: ScreenAction) => {
    if (a === "google") {
      const sb = supabaseBrowser();
      if (!sb) { enter("/entrar"); return; }
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=/` } });
      if (error) enter("/entrar");
      return;
    }
    const routes: Record<string, string> = { email: "/entrar", profile: "/perfil", messages: "/mensajes", friends: "/amigos", explore: "/buscar" };
    if (a.startsWith("person:")) { enter(`/u/${a.slice(7)}`); return; }
    if (a.startsWith("album:")) { enter(`/album/${a.slice(6)}`); return; }
    enter(routes[a]);
  }, [enter]);

  // Empieza a descargar la escena 3D cuanto antes si se va a mostrar
  useEffect(() => { if (document.documentElement.classList.contains("show-intro")) import("./scene3d"); }, []);

  // Mostrar si toca (primera vez en la sesión o al pulsar "Ver la intro")
  useEffect(() => {
    const check = () => setVisible(document.documentElement.classList.contains("show-intro"));
    check();
    window.addEventListener("rela:intro", check);
    return () => window.removeEventListener("rela:intro", check);
  }, []);

  // Cargar la escena 3D solo cuando se muestra
  const actionRef = useRef(onAction);
  actionRef.current = onAction;
  useEffect(() => {
    if (!visible || scene.current || !holder.current) return;
    let cancelled = false;
    import("./scene3d").then(({ createScene }) => {
      if (cancelled || !holder.current) return;
      try { scene.current = createScene(holder.current, info, (a) => actionRef.current(a)); } catch { setNoGL(true); }
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
      {/* Se ve siempre que se abre la web (cada carga completa de la página de inicio) */}
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add("show-intro")` }} />
      <div className={`intro ${go ? "go" : ""} ${noGL ? "nogl" : ""}`} role="dialog" aria-label="Rela Music">
        <div ref={holder} className="intro-3d" />
        <div className="intro-copy">
          <span className="il il1">{t.intro.l1}</span>
          <span className="il il2">{t.intro.l2}</span>
          <span className="il il3">{t.intro.l3}</span>
        </div>
        <div className="intro-cta">
          <button type="button" className="intro-enter" onClick={() => enter()}><span className="pulse" /><span className="hint-touch">{t.intro.hint}</span><span className="hint-mouse">{t.intro.hintMouse}</span></button>
          <button type="button" className="intro-skip" onClick={finish}>{t.intro.skip}</button>
        </div>
      </div>
    </>
  );
}
