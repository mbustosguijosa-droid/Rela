import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { timeAgoT } from "@/lib/i18n";
import type { Play, Playlist, Snapshot, TopArtist } from "@/lib/music";
import { cls, f1 } from "@/lib/format";

/** A dónde lleva tocar una escucha: al disco en Rela, con la canción marcada para puntuarla. */
export const playHref = (p: Pick<Play, "deezer" | "artist" | "album" | "track">) =>
  p.deezer ? `/album/${p.deezer}?pista=${encodeURIComponent(p.track)}`
    : `/ir?${new URLSearchParams({ artist: p.artist, album: p.album ?? "", track: p.track })}`;

export const SourceIcon = ({ s }: { s: "spotify" | "lastfm" }) => s === "spotify" ? (
  <svg className="src-ic" viewBox="0 0 24 24" aria-label="Spotify"><circle cx="12" cy="12" r="11" fill="#1ed760" /><path d="M6.5 9.3c3.8-1.1 8-.8 11.2 1M7.2 12.4c3.1-.9 6.4-.6 9.2.9M7.9 15.3c2.5-.6 5-.4 7.2.8" stroke="#0b0b0b" strokeWidth="1.6" strokeLinecap="round" fill="none" /></svg>
) : (
  <svg className="src-ic" viewBox="0 0 24 24" aria-label="Last.fm"><circle cx="12" cy="12" r="11" fill="#d51007" /><text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Arial">fm</text></svg>
);

export function PlayRow({ plays, t, scores, showTime = true }: { plays: Play[]; t: Dict; scores?: Map<number, number | null>; showTime?: boolean }) {
  return (
    <div className="row">
      {plays.map((p, i) => {
        const sc = p.deezer != null ? scores?.get(p.deezer) : undefined;
        return (
          <Link key={i + p.track + (p.at ?? "")} className="poster play" href={playHref(p)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.cover ? <img className="cover" src={p.cover} alt={t.common.coverOf(p.album || p.track)} loading="lazy" /> : <div className="cover ph">♪</div>}
            <div><div className="t">{p.track}</div><div className="a">{p.artist}</div></div>
            <div className="m play-m">
              {showTime && p.at && <span>{timeAgoT(t, p.at)}</span>}
              {sc !== undefined
                ? <span className={`score s-${cls(sc)}`} title={t.music.rated}>{f1(sc)}</span>
                : <span className="rate-chip">★ {t.music.rate}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function ArtistRow({ artists }: { artists: TopArtist[] }) {
  return (
    <div className="artist-row">
      {artists.map((a, i) => {
        const inner = <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {a.image ? <img src={a.image} alt="" loading="lazy" /> : <span className="ph">♪</span>}
          <b>{a.name}</b><small className="muted">#{i + 1}</small>
        </>;
        return a.deezer ? <Link key={a.name} className="artist-card" href={`/artista/${a.deezer}`}>{inner}</Link>
          : <a key={a.name} className="artist-card" href={a.url ?? "#"} target="_blank" rel="noopener">{inner}</a>;
      })}
    </div>
  );
}

export function PlaylistRow({ lists, t }: { lists: Playlist[]; t: Dict }) {
  return (
    <div className="row">
      {lists.map((p, i) => (
        <a key={i} className="poster" href={p.url ?? "#"} target="_blank" rel="noopener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.image ? <img className="cover" src={p.image} alt="" loading="lazy" /> : <div className="cover ph">♪</div>}
          <div className="t">{p.name}</div>
          <div className="m">{p.tracks != null ? t.music.songs(p.tracks) : t.music.open} ↗</div>
        </a>
      ))}
    </div>
  );
}

/** "Sonando ahora" / "Lo último que sonó" en el perfil. */
export function NowCard({ p, t, source }: { p: Play; t: Dict; source: Snapshot["source"] }) {
  return (
    <Link className={`now-card ${p.now ? "live" : ""}`} href={playHref(p)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.cover ? <img src={p.cover} alt="" /> : <span className="ph">♪</span>}
      <span className="nc-txt">
        <small>{p.now ? <><i className="eq"><b /><b /><b /></i>{t.music.nowPlaying}</> : <>{t.music.lastPlayed}{p.at ? ` · ${timeAgoT(t, p.at)}` : ""}</>}</small>
        <b>{p.track}</b><span className="muted">{p.artist}</span>
      </span>
      <SourceIcon s={source} />
      <span className="rate-chip">★ {t.music.rate}</span>
    </Link>
  );
}
