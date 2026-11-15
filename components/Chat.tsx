"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markRead, report, sendMessage, toggleBlock } from "@/app/actions";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Msg, Peer } from "@/lib/messages";
import { Avatar } from "./Avatar";
import { useT } from "./I18n";

export function Chat({ me, peer, initial, initiallyBlocked }: { me: Peer; peer: Peer; initial: Msg[]; initiallyBlocked: boolean }) {
  const { t, locale } = useT();
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const add = (list: Msg[]) => setMsgs((cur) => {
    const ids = new Set(cur.map((m) => m.id));
    const merged = [...cur, ...list.filter((m) => !ids.has(m.id))];
    return merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
  });

  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  // Mensajes nuevos: en tiempo real si está activado y, por si acaso, cada 8 s
  useEffect(() => {
    const sb = supabaseBrowser(); if (!sb) return;
    const fetchNew = async () => {
      const last = msgs.at(-1)?.created_at ?? "1970-01-01";
      const { data } = await sb.from("messages").select("*")
        .or(`and(sender_id.eq.${me.id},recipient_id.eq.${peer.id}),and(sender_id.eq.${peer.id},recipient_id.eq.${me.id})`)
        .gt("created_at", last).order("created_at");
      if (data?.length) { add(data as Msg[]); if ((data as Msg[]).some((m) => m.sender_id === peer.id)) markRead(peer.id); }
    };
    const channel = sb.channel(`dm-${me.id}-${peer.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me.id}` }, (p) => {
        const m = p.new as Msg; if (m.sender_id === peer.id) { add([m]); markRead(peer.id); }
      })
      .subscribe();
    const iv = setInterval(fetchNew, 8000);
    return () => { clearInterval(iv); sb.removeChannel(channel); };
  }, [me.id, peer.id, msgs]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim(); if (!body) return;
    start(async () => {
      const r = await sendMessage(peer.id, body);
      if (r.ok) { add([r.message]); setText(""); } else flash(r.error);
    });
  }

  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" });
  const lastMine = [...msgs].reverse().find((m) => m.sender_id === me.id);

  return (
    <div className="chat">
      <div className="chat-tools">
        <button className="linkbtn" style={{ color: "var(--muted)" }} onClick={() => start(async () => { const r = await toggleBlock(peer.id, !blocked); if (r.ok) { setBlocked(!blocked); flash(blocked ? t.dm.unblockedToast : t.dm.blockedToast); router.refresh(); } else flash(r.error); })}>{blocked ? t.dm.unblock : t.dm.block}</button>
        <button className="linkbtn" style={{ color: "var(--muted)" }} onClick={() => start(async () => { const r = await report("conversation", peer.id); flash(r.ok ? t.dm.reported : r.error); })}>{t.dm.report}</button>
      </div>
      {blocked && <p className="notice">{t.dm.blocked}</p>}
      <div className="chat-list" aria-live="polite">
        {msgs.length === 0 && <p className="empty">{t.dm.newChat(peer.name || peer.handle)}</p>}
        {msgs.map((m, i) => {
          const mine = m.sender_id === me.id;
          const showAv = !mine && (i === 0 || msgs[i - 1].sender_id !== m.sender_id);
          return (
            <div key={m.id} className={`bubble-row ${mine ? "mine" : ""}`}>
              {!mine && <span className="bubble-av">{showAv && <Avatar p={peer} size={28} />}</span>}
              <div className="bubble" title={fmt(m.created_at)}>{m.body}<span className="bubble-time">{fmt(m.created_at)}</span></div>
            </div>
          );
        })}
        {lastMine?.read_at && msgs.at(-1)?.id === lastMine.id && <div className="seen">{t.dm.seen}</div>}
        <div ref={end} />
      </div>
      <form className="chat-form" onSubmit={send}>
        <Avatar p={me} size={34} />
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t.dm.placeholder(peer.name || peer.handle)} aria-label={t.dm.sendMessage} />
        <button className="btn primary sm" disabled={pending || !text.trim()}>{pending ? t.dm.sending : t.dm.send}</button>
      </form>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
