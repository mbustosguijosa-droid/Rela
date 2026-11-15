"use client";

import { useOnline } from "@/lib/presence";
import { Avatar } from "./Avatar";
import { useT } from "./I18n";

type Me = { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null;

/** "● 5 conectados" con las fotos de quien está ahora en Rela. */
export function OnlineNow({ me }: { me: Me }) {
  const { t } = useT();
  const online = useOnline(me);
  const people = online.filter((u) => !u.anon).slice(0, 5);
  return (
    <span className="online-now" aria-live="polite">
      <i />
      <b>{t.home.online(online.length)}</b>
      {people.length > 0 && <span className="online-faces">{people.map((p) => <Avatar key={p.key} p={{ name: p.name, avatar_url: p.avatar_url ?? null, accent: p.accent ?? "#7a6a5c" }} size={22} />)}</span>}
    </span>
  );
}
