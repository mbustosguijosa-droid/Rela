"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveReview } from "@/app/actions";
import { Avatar } from "./Avatar";
import { useT } from "./I18n";

export function ReviewComposer({ releaseId, initial, viewer }: { releaseId: number; initial: string; viewer: { name: string; handle: string; avatar_url: string | null; accent: string } | null }) {
  const { t } = useT();
  const [text, setText] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  if (!viewer)
    return <div className="composer" style={{ gridTemplateColumns: "1fr" }}><p style={{ margin: 0 }}><Link className="linkbtn" href={`/entrar?next=/album/${releaseId}`}>{t.reviews.enter}</Link> {t.reviews.composerEnter}</p></div>;
  return (
    <form className="composer" onSubmit={(e) => { e.preventDefault(); start(async () => {
      const r = await saveReview(releaseId, text);
      setMsg(r.ok ? (text.trim() ? t.reviews.published : t.reviews.deleted) : r.error);
      if (r.ok) router.refresh();
      setTimeout(() => setMsg(null), 3000);
    }); }}>
      <Avatar p={viewer} size={36} />
      <div style={{ minWidth: 0 }}>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} placeholder={t.reviews.placeholder} aria-label={t.reviews.yourReview} />
        <div className="composer-foot">
          <span>{initial ? t.reviews.hasReview : t.reviews.climb}</span>
          <button className="btn primary sm" disabled={pending || text.trim() === initial.trim()}>{pending ? t.reviews.publishing : initial ? t.reviews.update : t.reviews.publish}</button>
        </div>
      </div>
      {msg && <div className="toast" role="status">{msg}</div>}
    </form>
  );
}
