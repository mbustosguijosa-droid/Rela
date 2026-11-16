"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase/client";

export type OnlineUser = { key: string; name: string; handle?: string; avatar_url?: string | null; accent?: string; anon?: boolean };
type Me = { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null;

// Un único canal compartido por toda la página
let channel: RealtimeChannel | null = null;
let current: OnlineUser[] = [];
const listeners = new Set<(u: OnlineUser[]) => void>();

function start(me: Me) {
  if (channel) return;
  const sb = supabaseBrowser(); if (!sb) return;
  let key = me?.id;
  if (!key) {
    // Una sola clave por navegador (localStorage): varias pestañas de la misma persona cuentan como una
    try { key = localStorage.getItem("rela:anon") ?? undefined; if (!key) { key = "anon-" + Math.random().toString(36).slice(2, 10); localStorage.setItem("rela:anon", key); } }
    catch { key = "anon-" + Math.random().toString(36).slice(2, 10); }
  }
  channel = sb.channel("rela-online", { config: { presence: { key } } });
  channel
    .on("presence", { event: "sync" }, () => {
      const st = channel!.presenceState<Omit<OnlineUser, "key">>();
      current = Object.entries(st).map(([k, metas]) => ({ key: k, ...(metas[0] ?? { name: "" }) }));
      listeners.forEach((l) => l(current));
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED")
        await channel!.track(me ? { name: me.name || me.handle, handle: me.handle, avatar_url: me.avatar_url, accent: me.accent } : { name: "", anon: true });
    });
}

/** Personas con Rela abierta ahora mismo (incluida tú). */
export function useOnline(me: Me) {
  const [users, setUsers] = useState<OnlineUser[]>(current);
  useEffect(() => {
    start(me);
    listeners.add(setUsers);
    setUsers(current);
    return () => { listeners.delete(setUsers); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);
  return users;
}
