"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addReply, report, toggleReaction } from "@/app/actions";
import { Avatar } from "./Avatar";
import { cls, f1, nf, timeAgo } from "@/lib/format";
import type { ReviewView } from "@/lib/reviews";

const REACTS: [keyof Pick<ReviewView, "likes" | "fuego" | "acuerdo" | "discrepo">, string, string, string][] = [
  ["likes", "like", "♥", "Me gusta"], ["fuego", "fuego", "🔥", "Fuego"], ["acuerdo", "acuerdo", "🤝", "De acuerdo"], ["discrepo", "discrepo", "🤔", "No estoy de acuerdo"],
];

export function ReviewCard({ rv, viewer, showRelease = false }: { rv: ReviewView; viewer: { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null; showRelease?: boolean }) {
  const [mine, setMine] = useState<string[]>(rv.mine);
  const [counts, setCounts] = useState({ likes: rv.likes, fuego: rv.fuego, acuerdo: rv.acuerdo, discrepo: rv.discrepo });
  const [replies, setReplies] = useState(rv.replies);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const isMine = viewer?.id === rv.user_id;
  const split = counts.acuerdo + counts.discrepo;
  const debate = split >= 8 && counts.acuerdo / split < 0.66;

  function flash(t: string) { setMsg(t); setTimeout(() => setMsg(null), 2800); }

  function react(field: keyof typeof counts, kind: string) {
    if (!viewer) { flash("Entra para reaccionar a las reseñas."); return; }
    const on = !mine.includes(kind);
    setMine((m) => (on ? [...m, kind] : m.filter((k) => k !== kind)));
    setCounts((c) => ({ ...c, [field]: c[field] + (on ? 1 : -1) }));
    start(async () => {
      const res = await toggleReaction(rv.id, kind, on);
      if (!res.ok) { setMine(rv.mine); setCounts({ likes: rv.likes, fuego: rv.fuego, acuerdo: rv.acuerdo, discrepo: rv.discrepo }); flash(res.error); }
    });
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!viewer) { flash("Entra para responder."); return; }
    const body = text.trim(); if (!body) return;
    start(async () => {
      const res = await addReply(rv.id, body);
      if (res.ok) { setReplies((r) => [...r, { ...res.reply, author: { id: viewer.id, handle: viewer.handle, name: viewer.name, avatar_url: viewer.avatar_url, accent: viewer.accent } }]); setText(""); }
      else flash(res.error);
    });
  }

  const a = rv.author, rel = rv.release;
  return (
    <article className={`rv ${showRelease && rel ? "with-cover" : ""}`}>
      {showRelease && rel && (
        <Link href={`/album/${rel.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cover" src={rel.cover_url ?? ""} alt={`Portada de ${rel.title}`} loading="lazy" />
        </Link>
      )}
      <div className="rv-body">
        <div className="rv-head">
          <Link href={a ? `/u/${a.handle}` : "#"} className="who-l"><Avatar p={a} size={30} /><b>{a?.name || a?.handle}</b><span className="muted">@{a?.handle}</span></Link>
          {isMine && <span className="pill acc">Tú</span>}
          {rv.isFriend && <span className="pill">Amigo</span>}
          {debate && <span className="pill hot">En debate</span>}
          <span className={`score s-${cls(rv.score)}`}>{f1(rv.score)}</span>
        </div>
        {showRelease && rel && <Link className="rv-album" href={`/album/${rel.id}`}><b>{rel.title}</b> · {rel.artist_name}</Link>}
        <p className="rv-text">{rv.body}</p>
        <div className="reacts">
          {REACTS.map(([field, kind, ic, label]) => (
            <button key={kind} className={`react ${mine.includes(kind) ? "on" : ""}`} aria-pressed={mine.includes(kind)} title={label} aria-label={`${label}: ${counts[field]}`} onClick={() => react(field, kind)} disabled={pending && false}>
              <span aria-hidden="true">{ic}</span>{nf(counts[field])}
            </button>
          ))}
          <button className="react" aria-expanded={open} onClick={() => setOpen(!open)}>💬 {replies.length} {replies.length === 1 ? "respuesta" : "respuestas"}</button>
          <span className="rv-time">{timeAgo(rv.created_at)}</span>
        </div>
        {open && (
          <div className="replies">
            {replies.map((rp) => (
              <div className="reply" key={rp.id}>
                <Link href={rp.author ? `/u/${rp.author.handle}` : "#"}><Avatar p={rp.author} size={26} /></Link>
                <div><b>{rp.author?.name || rp.author?.handle}</b><small>{timeAgo(rp.created_at)}</small><p>{rp.body}</p></div>
              </div>
            ))}
            {viewer ? (
              <form className="reply-form" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={`Responde a ${a?.name || a?.handle || "esta reseña"}…`} aria-label="Escribe una respuesta" />
                <button className="btn sm primary" disabled={pending || !text.trim()}>Responder</button>
              </form>
            ) : <p className="muted" style={{ fontSize: 13, margin: 0 }}><Link className="linkbtn" href="/entrar">Entra</Link> para responder.</p>}
            {viewer && !isMine && <button className="linkbtn" style={{ alignSelf: "flex-start", color: "var(--muted)" }} onClick={() => start(async () => { const r = await report("review", rv.id); flash(r.ok ? "Gracias. Revisaremos esta reseña." : r.error); })}>Denunciar reseña</button>}
          </div>
        )}
      </div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </article>
  );
}
