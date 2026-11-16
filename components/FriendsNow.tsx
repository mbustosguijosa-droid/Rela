"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "./I18n";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";
import { timeAgoT } from "@/lib/i18n";

type Who = { id: string; handle: string; name: string; avatar_url: string | null; accent: string };
type Row = { user_id: string; source: "spotify" | "lastfm"; track: string; artist: string; album: string | null; cover: string | null; url: string | null; is_playing: boolean; updated_at: string; who: Who };

const href = (r: Row) => `/ir?${new URLSearchParams({ artist: r.artist, album: r.album ?? "", track: r.track })}`;

/** Tus amigos escuchando ahora (se actualiza solo cada 40 s mientras la página está abierta). */
export function FriendsNow({ title, sub }: { title: string; sub: string }) {
  const { t } = useT();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      if (document.visibilityState === "visible") {
        try {
          const r = await fetch("/api/now", { cache: "no-store" });
          const j = await r.json();
          if (alive) setRows(j.friends ?? []);
        } catch { /* sin conexión: se reintenta */ }
      }
      if (alive) timer = setTimeout(load, 40_000);
    };
    load();
    const onVis = () => { if (document.visibilityState === "visible") { clearTimeout(timer); load(); } };
    document.addEventListener("visibilitychange", onVis);
    return () => { alive = false; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  if (!rows || rows.length === 0) return null;
  return (
    <section className="section">
      <div className="sec-head"><div><h2>{title}</h2><span>{sub}</span></div></div>
      <div className="fnow">
        {rows.map((r) => (
          <div key={r.user_id} className={`fnow-card ${r.is_playing ? "live" : ""}`}>
            <Link href={href(r)} className="fnow-cover" aria-label={`${t.music.rate}: ${r.track}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {r.cover ? <img src={r.cover} alt="" loading="lazy" /> : <Icon name="music" size={22} />}
              {r.is_playing && <i className="eq"><b /><b /><b /></i>}
            </Link>
            <div className="fnow-txt">
              <Link href={`/u/${r.who.handle}`} className="fnow-who"><Avatar p={r.who} size={20} /> <b>{r.who.name || r.who.handle}</b></Link>
              <Link href={href(r)} className="fnow-track"><b>{r.track}</b><span>{r.artist}</span></Link>
              <small>{r.is_playing ? <span className="live-dot">● {t.music.live}</span> : timeAgoT(t, r.updated_at)} · {t.music.via(r.source === "spotify" ? "Spotify" : "Last.fm")}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
