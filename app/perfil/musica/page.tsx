import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { getLink, lastfmConfigured, spotifyConfigured } from "@/lib/music";
import { SourceIcon } from "@/components/Music";
import { Disconnect, LastfmForm, ShareToggle } from "@/components/MusicSettings";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.music.settings }; }

type Props = { searchParams: Promise<{ spotify?: string }> };

export default async function MusicaPage({ searchParams }: Props) {
  const [{ sb, user, profile }, { t }, { spotify }] = await Promise.all([getViewer(), getT(), searchParams]);
  if (!sb || !user) redirect("/entrar?next=/perfil/musica");
  const link = await getLink(sb, user.id).catch(() => null);
  const status = spotify ? t.music.status[spotify] : null;

  return (
    <div className="wrap narrow">
      <section className="hello"><h1>{t.music.title}</h1><p>{t.music.sub}</p></section>
      {status && <p className={`notice ${spotify === "ok" ? "ok" : "warn"}`} role="status">{status}</p>}

      <section className="section music-cards">
        <div className="mcard">
          <SourceIcon s="lastfm" />
          <div className="mc-body">
            <b>{t.music.lastfm}</b>
            <span className="muted">{link?.lastfm_user ? t.music.connectedAs(link.lastfm_user) : t.music.lastfmHelp}</span>
            {!lastfmConfigured() && !link?.lastfm_user && <small className="muted">{t.music.lfmNoKey}</small>}
          </div>
          <LastfmForm current={link?.lastfm_user ?? null} />
          {!link?.lastfm_user && (
            <div className="lfm-steps">
              <ol>{t.music.lfmSteps.map((x) => <li key={x}>{x}</li>)}</ol>
              <p>
                <a className="btn sm" href="https://www.last.fm/join" target="_blank" rel="noopener">{t.music.lfmSignup} ↗</a>{" "}
                <a className="btn sm" href="https://www.last.fm/settings/applications" target="_blank" rel="noopener">{t.music.lfmApps} ↗</a>
              </p>
              <small className="muted">{t.music.lfmNote}</small>
            </div>
          )}
        </div>

        {/* Conexión directa con Spotify: solo si se activa (Spotify limita a 5 cuentas en modo desarrollo) */}
        {(process.env.SPOTIFY_DIRECT === "1" || link?.spotify_id) && (
        <div className="mcard">
          <SourceIcon s="spotify" />
          <div className="mc-body">
            <b>{t.music.spotify}</b>
            <span className="muted">{link?.spotify_id ? t.music.connectedAs(link.spotify_name ?? link.spotify_id) : t.music.spotifyHelp}</span>
          </div>
          {link?.spotify_id ? <Disconnect source="spotify" />
            : <a className="btn primary sm spotify-btn" href="/api/spotify/login" aria-disabled={!spotifyConfigured()}>{t.music.connectSpotify}</a>}
        </div>
        )}

        {(link?.spotify_id || link?.lastfm_user) && <ShareToggle initial={link.share_listening} />}
        <p className="muted small-note">✦ {t.music.ai}</p>
      </section>

      <p style={{ marginTop: 24 }}>
        <Link className="btn" href="/">← {t.nav.home}</Link>{" "}
        {profile && <Link className="btn" href={`/u/${profile.handle}`}>{t.nav.myProfile}</Link>}
      </p>
    </div>
  );
}
