"use client";

import { useState } from "react";
import { useT } from "./I18n";

export function CopyInvite() {
  const { t } = useT();
  const [done, setDone] = useState(false);
  return (
    <button className="btn primary sm" onClick={async () => {
      const url = window.location.origin;
      const data = { title: "Rela", text: t.friends.shareText, url };
      try {
        if (navigator.share) await navigator.share(data);
        else { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2500); }
      } catch { /* cancelado */ }
    }}>{done ? t.friends.copied : t.friends.share}</button>
  );
}
