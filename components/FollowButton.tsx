"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/app/actions";

export function FollowButton({ userId, initial, loggedIn, small = false }: { userId: string; initial: boolean; loggedIn: boolean; small?: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button className={`btn ${small ? "sm" : ""} ${on ? "" : "primary"}`} disabled={pending}
      onClick={() => {
        if (!loggedIn) { router.push("/entrar?next=/amigos"); return; }
        const next = !on; setOn(next);
        start(async () => { const r = await toggleFollow(userId, next); if (!r.ok) setOn(!next); else router.refresh(); });
      }}>
      {on ? "✓ Siguiendo" : "Seguir"}
    </button>
  );
}
