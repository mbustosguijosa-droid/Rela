import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getMusic } from "@/lib/music";
import { PlayRow, SourceIcon } from "./Music";

/** Fila del inicio: tus últimas escuchas de Spotify/Last.fm, listas para puntuar con un toque. */
export async function ListenSection() {
  const [{ sb, user }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!sb || !user) return null;
  const { link, snap } = await getMusic(sb, user.id, true);
  const connected = !!(link?.spotify_id || link?.lastfm_user);

  if (!connected) {
    return (
      <section className="section">
        <div className="sec-head"><div><h2>{t.music.recent}</h2><span>{t.music.recentSub}</span></div></div>
        <div className="listen-cta">
          <SourceIcon s="spotify" />
          <div><b>{t.music.connectTitle}</b><span className="muted">{t.music.connectText}</span></div>
          <Link className="btn primary sm" href="/perfil/musica">{t.music.connectCta}</Link>
        </div>
      </section>
    );
  }

  const plays = snap?.recent ?? [];
  const ids = plays.map((p) => p.deezer).filter((x): x is number => x != null);
  const { data: rated } = ids.length ? await sb.from("ratings").select("release_id, overall").eq("user_id", user.id).in("release_id", ids) : { data: [] };
  const scores = new Map((rated ?? []).map((r) => [Number(r.release_id), r.overall == null ? null : Number(r.overall)]));

  return (
    <section className="section">
      <div className="sec-head">
        <div><h2>{t.music.recent}</h2><span>{t.music.recentSub}</span></div>
        <Link href="/perfil/musica" className="src-link">{snap && <SourceIcon s={snap.source} />}{t.music.settings}</Link>
      </div>
      {plays.length ? <PlayRow plays={plays} t={t} scores={scores} /> : <p className="empty">{t.music.empty}</p>}
    </section>
  );
}

export function ListenSkeleton({ title }: { title: string }) {
  return <section className="section"><div className="sec-head"><div><h2>{title}</h2></div></div><div className="row">{Array.from({ length: 6 }, (_, i) => <div key={i} className="poster"><div className="cover sk" /></div>)}</div></section>;
}
