import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getMusic } from "@/lib/music";
import { ArtistRow, NowCard, PlayRow, PlaylistRow } from "./Music";

/** En el perfil: lo que suena, lo último escuchado, temas y artistas del mes y playlists. */
export async function ProfileMusic({ userId, name, own }: { userId: string; name: string; own: boolean }) {
  const [{ sb }, { t }] = await Promise.all([getViewer(), getT()]);
  if (!sb) return null;
  const { link, snap } = await getMusic(sb, userId, own);
  if (!snap) {
    if (!own) return null;
    return (
      <section className="section">
        <div className="listen-cta">
          <div><b>{t.music.connectTitle}</b><span className="muted">{t.music.connectText}</span></div>
          <Link className="btn primary sm" href="/perfil/musica">{t.music.connectCta}</Link>
        </div>
      </section>
    );
  }
  const { data: np } = await sb.from("now_playing").select("*").eq("user_id", userId).maybeSingle();
  const current = np && np.track ? { track: np.track, artist: np.artist ?? "", album: np.album ?? "", cover: np.cover, url: np.url, now: np.is_playing && Date.now() - new Date(np.updated_at).getTime() < 10 * 60_000, at: np.updated_at, deezer: null }
    : snap.recent[0] ?? null;

  return (
    <>
      {current && <section className="section"><NowCard p={current} t={t} source={snap.source} /></section>}
      {snap.recent.length > 0 && (
        <section className="section">
          <div className="sec-head"><div><h2>{own ? t.music.recent : t.music.recentOf(name)}</h2>{own && <span>{t.music.recentSub}</span>}</div>{own && link && <Link href="/perfil/musica">{t.music.settings}</Link>}</div>
          <PlayRow plays={snap.recent} t={t} />
        </section>
      )}
      {snap.top_tracks.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{own ? t.music.topTracks : t.music.topTracksOf(name)}</h2></div>
          <PlayRow plays={snap.top_tracks} t={t} showTime={false} />
        </section>
      )}
      {snap.top_artists.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{own ? t.music.topArtists : t.music.topArtistsOf(name)}</h2></div>
          <ArtistRow artists={snap.top_artists} />
        </section>
      )}
      {snap.playlists.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{own ? t.music.playlists : t.music.playlistsOf(name)}</h2></div>
          <PlaylistRow lists={snap.playlists} t={t} />
        </section>
      )}
    </>
  );
}
