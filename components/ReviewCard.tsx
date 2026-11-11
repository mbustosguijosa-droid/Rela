"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { addReply, report, toggleReaction } from "@/app/actions";
import { Avatar } from "./Avatar";
import { cls, f1, nf } from "@/lib/format";
import { timeAgoT, translateUrl } from "@/lib/i18n";
import { useT } from "./I18n";
import type { ReviewView } from "@/lib/reviews";

const REACTS: [keyof Pick<ReviewView, "likes" | "fuego" | "acuerdo" | "discrepo">, string, string][] = [
  ["likes", "like", "♥"], ["fuego", "fuego", "🔥"], ["acuerdo", "acuerdo", "🤝"], ["discrepo", "discrepo", "🤔"],
];

export function ReviewCard({ rv, viewer, showRelease = false }: { rv: ReviewView; viewer: { id: string; name: string; handle: string; avatar_url: string | null; accent: string } | null; showRelease?: boolean }) {
  const { t, lang } = useT();
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
    if (!viewer) { flash(t.reviews.enterToReact); return; }
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
    if (!viewer) { flash(t.reviews.enterToReply); return; }
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
          <img className="cover" src={rel.cover_url ?? ""} alt={t.common.coverOf(rel.title)} loading="lazy" />
        </Link>
      )}
      <div className="rv-body">
        <div className="rv-head">
          <Link href={a ? `/u/${a.handle}` : "#"} className="who-l"><Avatar p={a} size={30} /><b>{a?.name || a?.handle}</b><span className="muted">@{a?.handle}</span></Link>
          {isMine && <span className="pill acc">{t.common.you}</span>}
          {rv.isFriend && <span className="pill">{t.common.friend}</span>}
          {debate && <span className="pill hot">{t.reviews.debate}</span>}
          <span className={`score s-${cls(rv.score)}`}>{f1(rv.score)}</span>
        </div>
        {showRelease && rel && <Link className="rv-album" href={`/album/${rel.id}`}><b>{rel.title}</b> · {rel.artist_name}</Link>}
        <p className="rv-text">{rv.body}<a className="tr-link" href={translateUrl(rv.body, lang)} target="_blank" rel="noopener" title={t.common.translateTitle}>{t.common.translate}</a></p>
        <div className="reacts">
          {REACTS.map(([field, kind, ic]) => { const label = t.reviews.reacts[kind]; return (
            <button key={kind} className={`react ${mine.includes(kind) ? "on" : ""}`} aria-pressed={mine.includes(kind)} title={label} aria-label={`${label}: ${counts[field]}`} onClick={() => react(field, kind)} disabled={pending && false}>
              <span aria-hidden="true">{ic}</span>{nf(counts[field])}
            </button>
          ); })}
          <button className="react" aria-expanded={open} onClick={() => setOpen(!open)}>💬 {t.reviews.replies(replies.length)}</button>
          <span className="rv-time">{timeAgoT(t, rv.created_at)}</span>
        </div>
        {open && (
          <div className="replies">
            {replies.map((rp) => (
              <div className="reply" key={rp.id}>
                <Link href={rp.author ? `/u/${rp.author.handle}` : "#"}><Avatar p={rp.author} size={26} /></Link>
                <div><b>{rp.author?.name || rp.author?.handle}</b><small>{timeAgoT(t, rp.created_at)}</small><p>{rp.body}<a className="tr-link" href={translateUrl(rp.body, lang)} target="_blank" rel="noopener" title={t.common.translateTitle}>{t.common.translate}</a></p></div>
              </div>
            ))}
            {viewer ? (
              <form className="reply-form" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={t.reviews.replyTo(a?.name || a?.handle || t.reviews.thisReview)} aria-label={t.reviews.writeReply} />
                <button className="btn sm primary" disabled={pending || !text.trim()}>{t.reviews.reply}</button>
              </form>
            ) : <p className="muted" style={{ fontSize: 13, margin: 0 }}><Link className="linkbtn" href="/entrar">{t.reviews.enter}</Link> {t.reviews.toReply}</p>}
            {viewer && !isMine && <button className="linkbtn" style={{ alignSelf: "flex-start", color: "var(--muted)" }} onClick={() => start(async () => { const r = await report("review", rv.id); flash(r.ok ? t.reviews.reported : r.error); })}>{t.reviews.report}</button>}
          </div>
        )}
      </div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </article>
  );
}
