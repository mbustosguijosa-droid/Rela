"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { saveRating, setLoop, toggleTop4 } from "@/app/actions";
import { cls, f1 } from "@/lib/format";

export type RatingState = { tracks: Record<number, number>; overall: number | null; fav: number | null; listened: boolean; liked: boolean };
const empty: RatingState = { tracks: {}, overall: null, fav: null, listened: false, liked: false };
const pct = (v: number) => `${((v - 1) / 9) * 100}%`;

type Props = {
  albumId: number;
  tracks: { id: number; title: string }[];
  links: { spotify: string; deezer: string; genius: string; trackGenius: string[] };
  initial: RatingState | null;
  loggedIn: boolean;
  inTop4: boolean;
  inLoop: boolean;
  children?: React.ReactNode; // contenido extra de la columna principal (reseñas, amigos…)
};

export function TrackRater({ albumId, tracks, links, initial, loggedIn, inTop4, inLoop, children }: Props) {
  const key = `rela:rating:${albumId}`;
  const [r, setR] = useState<RatingState>(initial ?? empty);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  const [msg, setMsg] = useState<string | null>(null);
  const [top4, setTop4] = useState(inTop4);
  const [loop, setLoopState] = useState(inLoop);
  const [, start] = useTransition();
  const dirty = useRef(false);

  // Sin sesión: se guarda en el navegador
  useEffect(() => {
    if (loggedIn) return;
    try { const v = localStorage.getItem(key); if (v) setR({ ...empty, ...JSON.parse(v) }); } catch {}
  }, [key, loggedIn]);

  // Con sesión: guardado automático en la cuenta (agrupa cambios seguidos)
  useEffect(() => {
    if (!dirty.current) return;
    if (!loggedIn) { try { localStorage.setItem(key, JSON.stringify(r)); } catch {} return; }
    setStatus("saving");
    const t = setTimeout(async () => {
      const res = await saveRating(albumId, r);
      setStatus(res.ok ? "saved" : "error");
      if (!res.ok) setMsg(res.error);
    }, 700);
    return () => clearTimeout(t);
  }, [r, albumId, key, loggedIn]);

  const update = (fn: (x: RatingState) => RatingState) => { dirty.current = true; setR(fn); };
  const vals = Object.values(r.tracks);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const score = r.overall ?? avg;

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(null), 2800); }

  return (
    <div className="album-body">
      <div className="col-main">
        <section>
          <header className="panel-head">
            {tracks.length > 1 ? <><h2>Puntúa canción a canción</h2><p>Desliza para poner nota del 1 al 10. Marca tu favorita con la estrella.</p></>
              : <><h2>Puntúa la canción</h2><p>Desliza para poner nota del 1 al 10.</p></>}
          </header>
          <ol className="tracks">
            {tracks.map((t, i) => {
              const v = r.tracks[i];
              return (
                <li className="track" key={t.id}>
                  <span className="n">{i + 1}</span>
                  <span className="tt" title={t.title}>{t.title}</span>
                  <a className="icon-btn" href={links.trackGenius[i]} target="_blank" rel="noopener" aria-label={`Letra de ${t.title} en Genius`} title="Letra en Genius">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 11h12M4 16h9" /><path d="M18 14v6m0 0a2 2 0 1 1-2-2" /></svg>
                  </a>
                  <button className={`star ${r.fav === i ? "on" : ""}`} aria-label={`Marcar ${t.title} como favorita`} aria-pressed={r.fav === i}
                    onClick={() => update((x) => ({ ...x, fav: x.fav === i ? null : i }))}>★</button>
                  <input type="range" min={1} max={10} step={0.5} value={v ?? 5.5} className={v == null ? "unset" : ""}
                    style={{ ["--p" as string]: v == null ? "0%" : pct(v) }} aria-label={`Nota de ${t.title}`}
                    onChange={(e) => { const val = +e.target.value; update((x) => ({ ...x, listened: true, tracks: { ...x.tracks, [i]: val } })); }} />
                  <output className={`score s-${cls(v)}`}>{f1(v)}</output>
                </li>
              );
            })}
          </ol>
        </section>
        {children}
      </div>
      <aside className="col-side">
        <div className="my">
          <span className="lbl">Tu nota</span>
          <div className="my-score"><span className={`score s-${cls(score)}`}>{f1(score)}</span><span className="of">/10</span></div>
          <p className="sub">{vals.length ? <>Media de {vals.length} de {tracks.length} canciones: <b>{f1(avg)}</b></> : "Puntúa las canciones y calculamos la media."}
            {r.overall != null && vals.length > 0 && <> · <button className="linkbtn" onClick={() => update((x) => ({ ...x, overall: null }))}>Usar la media</button></>}</p>
          <label className="lbl" htmlFor="overall">Nota final</label>
          <input id="overall" type="range" min={1} max={10} step={0.1} value={score ?? 5.5} className={score == null ? "unset" : ""}
            style={{ ["--p" as string]: score == null ? "0%" : pct(score) }}
            onChange={(e) => { const val = +e.target.value; update((x) => ({ ...x, listened: true, overall: val })); }} />
          <div className="actions">
            <button className={`btn ${r.listened ? "on" : ""}`} onClick={() => update((x) => ({ ...x, listened: !x.listened }))}>{r.listened ? "✓ Escuchado" : "Escuchado"}</button>
            <button className={`btn like ${r.liked ? "on" : ""}`} onClick={() => update((x) => ({ ...x, liked: !x.liked }))}>{r.liked ? "♥ Me gusta" : "♡ Me gusta"}</button>
            {loggedIn && <>
              <button className={`btn ${top4 ? "on" : ""}`} onClick={() => start(async () => { const res = await toggleTop4(albumId); if (res.ok) { setTop4(!top4); flash(top4 ? "Quitado de tu top 4" : "Añadido a tu top 4"); } else flash(res.error); })}>{top4 ? "★ En tu top 4" : "Añadir al top 4"}</button>
              <button className={`btn ${loop ? "on" : ""}`} onClick={() => start(async () => { const res = await setLoop(loop ? null : albumId); if (res.ok) { setLoopState(!loop); flash(loop ? "Quitado de \"en bucle\"" : "Ahora sale en tu perfil como \"en bucle\""); } else flash(res.error); })}>{loop ? "↻ En bucle" : "Lo tengo en bucle"}</button>
            </>}
            <a className="btn" href={links.spotify} target="_blank" rel="noopener">Spotify ↗</a>
            <a className="btn" href={links.deezer} target="_blank" rel="noopener">Deezer ↗</a>
            <a className="btn wide" href={links.genius} target="_blank" rel="noopener">Letras en Genius ↗</a>
          </div>
          {loggedIn
            ? <p className="notice" aria-live="polite">{status === "saving" ? "Guardando…" : status === "saved" ? "✓ Guardado en tu perfil" : status === "error" ? "No se ha podido guardar. Revisa tu conexión." : "Tu nota se guarda sola en tu perfil."}</p>
            : <p className="notice"><Link href={`/entrar?next=/album/${albumId}`} className="linkbtn">Entra</Link> para guardar tu nota en tu perfil y que la vean tus amigos.</p>}
        </div>
      </aside>
      {msg && <div className="toast" role="status">{msg}</div>}
    </div>
  );
}
