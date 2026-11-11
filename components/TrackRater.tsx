"use client";

import { useEffect, useMemo, useState } from "react";

type Rating = { tracks: Record<number, number>; overall: number | null; fav: number | null; listened: boolean; liked: boolean };
const empty: Rating = { tracks: {}, overall: null, fav: null, listened: false, liked: false };
const cls = (s: number | null) => (s == null ? "none" : s >= 8 ? "hi" : s >= 6 ? "mid" : "lo");
const f1 = (s: number | null) => (s == null ? "–" : (Math.round(s * 10) / 10).toFixed(1));
const pct = (v: number) => `${((v - 1) / 9) * 100}%`;

type Props = {
  albumId: number;
  tracks: { id: number; title: string }[];
  links: { spotify: string; deezer: string; genius: string; trackGenius: string[] };
};

// De momento la nota se guarda en este navegador. En la siguiente fase se guardará en Supabase
// cuando la persona haya iniciado sesión.
export function TrackRater({ albumId, tracks, links }: Props) {
  const key = `rela:rating:${albumId}`;
  const [r, setR] = useState<Rating>(empty);
  useEffect(() => {
    try { const v = localStorage.getItem(key); if (v) setR({ ...empty, ...JSON.parse(v) }); } catch {}
  }, [key]);
  const update = (fn: (x: Rating) => Rating) => setR((prev) => {
    const next = fn(prev);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  });
  const vals = Object.values(r.tracks);
  const avg = useMemo(() => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null), [vals]);
  const score = r.overall ?? avg;

  return (
    <div className="album-body">
      <div style={{ minWidth: 0 }}>
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
                <output className={`score s-${cls(v ?? null)}`}>{f1(v ?? null)}</output>
              </li>
            );
          })}
        </ol>
      </div>
      <aside className="col-side">
        <div className="my">
          <span className="lbl">Tu nota</span>
          <div className="my-score"><span className={`score s-${cls(score)}`}>{f1(score)}</span><span className="of">/10</span></div>
          <p className="sub">{vals.length ? <>Media de {vals.length} de {tracks.length} canciones: <b>{f1(avg)}</b></> : "Puntúa las canciones y calculamos la media."}
            {r.overall != null && vals.length > 0 && <> · <button className="star" style={{ fontSize: 13, color: "var(--accent-text)", textDecoration: "underline" }} onClick={() => update((x) => ({ ...x, overall: null }))}>Usar la media</button></>}</p>
          <label className="lbl" htmlFor="overall">Nota final</label>
          <input id="overall" type="range" min={1} max={10} step={0.1} value={score ?? 5.5} className={score == null ? "unset" : ""}
            style={{ ["--p" as string]: score == null ? "0%" : pct(score) }}
            onChange={(e) => { const val = +e.target.value; update((x) => ({ ...x, listened: true, overall: val })); }} />
          <div className="actions">
            <button className="btn" style={r.listened ? { color: "var(--accent-text)", borderColor: "var(--accent-text)" } : undefined} onClick={() => update((x) => ({ ...x, listened: !x.listened }))}>{r.listened ? "✓ Escuchado" : "Escuchado"}</button>
            <button className="btn" style={r.liked ? { color: "var(--like)", borderColor: "var(--like)" } : undefined} onClick={() => update((x) => ({ ...x, liked: !x.liked }))}>{r.liked ? "♥ Me gusta" : "♡ Me gusta"}</button>
            <a className="btn" href={links.spotify} target="_blank" rel="noopener">Spotify ↗</a>
            <a className="btn" href={links.deezer} target="_blank" rel="noopener">Deezer ↗</a>
            <a className="btn wide" href={links.genius} target="_blank" rel="noopener">Letras en Genius ↗</a>
          </div>
          <p className="notice">Por ahora tu nota se guarda en este navegador. Con las cuentas de usuario se guardará en tu perfil.</p>
        </div>
      </aside>
    </div>
  );
}
