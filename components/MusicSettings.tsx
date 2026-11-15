"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "./I18n";
import { connectLastfm, disconnectMusic, setShareListening } from "@/app/actions";

export function LastfmForm({ current }: { current: string | null }) {
  const { t } = useT();
  const router = useRouter();
  const [v, setV] = useState(current ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (current) return <Disconnect source="lastfm" />;
  return (
    <form className="lfm-form" onSubmit={(e) => { e.preventDefault(); setErr(null); start(async () => { const r = await connectLastfm(v); if (!r.ok) setErr(r.error); else router.refresh(); }); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={t.music.lfmPh} aria-label={t.music.lfmPh} autoComplete="off" />
      <button className="btn primary sm" disabled={pending || !v.trim()}>{pending ? "…" : t.music.lfmSave}</button>
      {err && <p className="form-error" role="alert">{err}</p>}
    </form>
  );
}

export function Disconnect({ source }: { source: "spotify" | "lastfm" }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  return <button type="button" className="btn sm" disabled={pending} onClick={() => start(async () => { await disconnectMusic(source); router.refresh(); })}>{t.music.disconnect}</button>;
}

export function ShareToggle({ initial }: { initial: boolean }) {
  const { t } = useT();
  const [on, setOn] = useState(initial);
  const [, start] = useTransition();
  return (
    <label className="share-toggle">
      <input type="checkbox" checked={on} onChange={(e) => { const n = e.target.checked; setOn(n); start(async () => { const r = await setShareListening(n); if (!r.ok) setOn(!n); }); }} />
      <span><b>{t.music.share}</b><small className="muted">{t.music.shareHelp}</small></span>
    </label>
  );
}
