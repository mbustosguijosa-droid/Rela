"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleArtistFollow } from "@/app/actions";

type A = { id: number; name: string; picture: string | null; fans: number | null };

export function FollowArtistButton({ artist, initial, loggedIn, small = false }: { artist: A; initial: boolean; loggedIn: boolean; small?: boolean }) {
  const [on, setOn] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <button className={`btn ${small ? "sm" : ""} ${on ? "" : "primary"}`} disabled={pending} aria-pressed={on}
        onClick={() => {
          if (!loggedIn) { router.push(`/entrar?next=/artista/${artist.id}`); return; }
          const next = !on; setOn(next);
          start(async () => {
            const r = await toggleArtistFollow(artist, next);
            if (!r.ok) { setOn(!next); setMsg(r.error); }
            else { setMsg(next ? `Sigues a ${artist.name}. Te recomendaremos música de su nicho en el inicio.` : `Has dejado de seguir a ${artist.name}.`); router.refresh(); }
            setTimeout(() => setMsg(null), 3200);
          });
        }}>
        {on ? "✓ Siguiendo" : "+ Seguir artista"}
      </button>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
