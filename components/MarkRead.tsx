"use client";

import { useEffect } from "react";
import { markNotifsRead } from "@/app/actions";

/** Al abrir los avisos, se marcan como leídos (sin bloquear la página). */
export function MarkRead() {
  useEffect(() => { const id = setTimeout(() => { markNotifsRead(); }, 1200); return () => clearTimeout(id); }, []);
  return null;
}
