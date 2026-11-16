"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useOnline } from "@/lib/presence";
import { Avatar } from "./Avatar";
import { useT } from "./I18n";

type Me = { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null;

/** "● 5 conectados": al tocarlo enseña quién está (con cuenta) y cuántos visitantes sin cuenta. */
export function OnlineNow({ me }: { me: Me }) {
  const { t } = useT();
  const online = useOnline(me);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  // Con 0 o 1 persona (tú) el contador transmite "aquí no hay nadie": mejor no mostrarlo
  if (online.length < 2) return null;
  const people = online.filter((u) => !u.anon);
  const others = people.filter((u) => u.key !== me?.id);
  const anon = online.filter((u) => u.anon && u.key !== me?.id).length;
  const meHere = people.find((u) => u.key === me?.id);
  return (
    <div className="online-wrap" ref={box}>
      <button type="button" className="online-now" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <i />
        <b>{t.home.online(online.length)}</b>
        {others.length > 0 && <span className="online-faces">{others.slice(0, 5).map((p) => <Avatar key={p.key} p={{ name: p.name, avatar_url: p.avatar_url ?? null, accent: p.accent ?? "#7a6a5c" }} size={22} />)}</span>}
      </button>
      {open && (
        <div className="online-pop" role="dialog" aria-label={t.home.onlineNow}>
          <b>{t.home.onlineNow}</b>
          <ul>
            {meHere && <li><Avatar p={{ name: meHere.name, avatar_url: meHere.avatar_url ?? null, accent: meHere.accent ?? "#7a6a5c" }} size={30} /><span><b>{meHere.name}</b><small>{t.intro.you}</small></span></li>}
            {others.map((p) => (
              <li key={p.key}>
                <Link href={p.handle ? `/u/${p.handle}` : "#"} onClick={() => setOpen(false)}>
                  <Avatar p={{ name: p.name, avatar_url: p.avatar_url ?? null, accent: p.accent ?? "#7a6a5c" }} size={30} />
                  <span><b>{p.name}</b>{p.handle && <small>@{p.handle}</small>}</span>
                </Link>
              </li>
            ))}
            {anon > 0 && <li className="online-anon"><span className="anon-dot" aria-hidden="true">{anon}</span><span><b>{t.home.anonVisitors(anon)}</b><small>{t.home.anonHint}</small></span></li>}
          </ul>
        </div>
      )}
    </div>
  );
}
