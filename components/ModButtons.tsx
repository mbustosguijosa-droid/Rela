"use client";

import { useTransition, useState } from "react";
import { moderate } from "@/app/actions";
import { useT } from "./I18n";

export function ModButtons({ type, id, canHide, hidden }: { type: "review" | "reply" | "profile" | "conversation"; id: string; canHide: boolean; hidden: boolean }) {
  const { t } = useT();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const act = (a: "hide" | "restore" | "dismiss") => start(async () => { const r = await moderate(type, id, a); setErr(r.ok ? null : r.error); });
  return (
    <div className="mod-actions">
      {canHide && (hidden ? <button className="btn sm" disabled={pending} onClick={() => act("restore")}>{t.grow.restore}</button>
        : <button className="btn sm primary" disabled={pending} onClick={() => act("hide")}>{t.grow.hide}</button>)}
      <button className="btn sm" disabled={pending} onClick={() => act("dismiss")}>{t.grow.dismiss}</button>
      {err && <small className="err">{err}</small>}
    </div>
  );
}
