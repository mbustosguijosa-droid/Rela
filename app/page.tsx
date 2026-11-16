import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Suspense } from "react";
import { ListenSection, ListenSkeleton } from "@/components/ListenSection";
import { FriendsNow } from "@/components/FriendsNow";
import type { TopArtist } from "@/lib/music";
import { getChartAlbums, getLatestFrom } from "@/lib/deezer";
import { SEED_ARTISTS } from "@/lib/seed";
import { Poster, fmtDate } from "@/components/Poster";
import { getViewer } from "@/lib/auth";
import { getFollowedArtists, getFollowing, getReviews } from "@/lib/reviews";
import { getNicheDrops, getRecommendations } from "@/lib/deezer";
import { Fan3D, type FanItem } from "@/components/Fan3D";
import { OnlineNow } from "@/components/OnlineNow";
import { releasesByIds } from "@/lib/releases";
import { ReviewCard } from "@/components/ReviewCard";
import { Avatar } from "@/components/Avatar";
import { cls, f1 } from "@/lib/format";
import { getT } from "@/lib/i18n-server";
import { Intro, ReplayIntro } from "@/components/Intro";
import { unreadCount } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ sb, user, profile }, { t, locale }] = await Promise.all([getViewer(), getT()]);
  const [following, followedArtists] = sb ? await Promise.all([getFollowing(sb, user?.id), getFollowedArtists(sb, user?.id)]) : [[], []];
  const followedIds = followedArtists.map((f) => Number(f.artist_id));
  // Tus gustos según lo que escuchas en Spotify/Last.fm (la última foto guardada, sin esperar a Spotify)
  const { data: snapRow } = sb && user ? await sb.from("music_snapshots").select("top_artists").eq("user_id", user.id).maybeSingle() : { data: null };
  const taste = ((snapRow?.top_artists ?? []) as TopArtist[]).filter((a) => a.deezer && !followedIds.includes(a.deezer)).slice(0, 5)
    .map((a) => ({ artist_id: a.deezer!, artist_name: a.name }));
  const tasteIds = new Set(taste.map((a) => a.artist_id));
  const recSources = [...taste, ...followedArtists.map((f) => ({ artist_id: Number(f.artist_id), artist_name: f.artist_name }))];
  const [fresh, chart, trending, activity, recs] = await Promise.all([
    getLatestFrom([...new Set([...followedIds.slice(0, 16), ...SEED_ARTISTS])].slice(0, 30), 1),
    getChartAlbums(12),
    sb ? getReviews(sb, { sort: "hot", limit: 6, viewerId: user?.id, following }) : Promise.resolve([]),
    sb && following.length
      ? sb.from("ratings").select("user_id, release_id, overall, liked, updated_at").in("user_id", following).order("updated_at", { ascending: false }).limit(12).then((r) => r.data ?? [])
      : Promise.resolve([]),
    recSources.length ? getRecommendations(recSources, 12) : Promise.resolve([]),
  ]);
  // Abanico del inicio: tus favoritos + lo nuevo de tu nicho (o lo recién salido si no has entrado)
  const [favRows, drops] = await Promise.all([
    sb && profile?.favorites?.length ? releasesByIds(sb, profile.favorites.map(Number)) : Promise.resolve(new Map()),
    recSources.length ? getNicheDrops(recSources, 4) : Promise.resolve([]),
  ]);
  let feed: { key: string; rel: { id: number; title: string; cover_url: string | null }; who: { handle: string; name: string; avatar_url: string | null; accent: string }; overall: number | null; liked: boolean }[] = [];
  if (sb && activity.length) {
    const [rels, { data: ps }] = await Promise.all([
      releasesByIds(sb, activity.map((a) => Number(a.release_id))),
      sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", [...new Set(activity.map((a) => a.user_id))]),
    ]);
    feed = activity.map((a) => ({ key: a.user_id + a.release_id, rel: rels.get(Number(a.release_id))!, who: ps!.find((p) => p.id === a.user_id)!, overall: a.overall, liked: a.liked })).filter((f) => f.rel && f.who);
  }
  const unread = sb && user ? await unreadCount(sb, user.id) : 0;
  const favItems: FanItem[] = (profile?.favorites ?? []).map((id) => favRows.get(Number(id))).filter(Boolean).slice(0, 4)
    .map((r) => ({ id: r.id, cover: r.cover_url ?? "", title: r.title, artist: r.artist_name, tag: t.home.fanFav, kind: "fav" as const }));
  const dropItems: FanItem[] = drops.map((a) => ({ id: a.id, cover: a.cover_big ?? a.cover_medium, title: a.title, artist: a.artist?.name ?? "", tag: t.home.fanDrop, kind: "drop" as const }));
  let fanItems: FanItem[] = [...favItems, ...dropItems];
  if (fanItems.length < 3) fanItems = [...fanItems, ...fresh.slice(0, 6 - fanItems.length).map((a) => ({ id: a.id, cover: a.cover_big ?? a.cover_medium, title: a.title, artist: a.artist?.name ?? "", tag: t.home.fanNew, kind: "new" as const }))];
  fanItems = fanItems.slice(0, 7);
  // Para la pantalla del móvil de la entrada: tus amigos y tu top 4
  const { data: friendRows } = sb && following.length ? await sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", following.slice(0, 8)) : { data: null };
  const introFriends = (friendRows ?? []).map((f: { id: string; handle: string; name: string; avatar_url: string | null; accent: string }) => ({ id: f.id, handle: f.handle, name: f.name || f.handle, avatar_url: f.avatar_url, accent: f.accent }));
  const introTop4 = favItems.map((f) => ({ id: f.id, cover: f.cover, title: f.title }));
  const meLite = user && profile ? { id: user.id, name: profile.name, handle: profile.handle, avatar_url: profile.avatar_url, accent: profile.accent } : null;
  const viewer = user && profile ? { id: user.id, name: profile.name, handle: profile.handle, avatar_url: profile.avatar_url, accent: profile.accent } : null;

  return (
    <div className="wrap">
      <Intro me={meLite} friends={introFriends} top4={introTop4} />
      <section className="hero">
        <div className="hero-copy">
          {user && profile ? (
            <>
              <p className="hero-kicker"><Avatar p={profile} size={26} /> {t.home.hi(profile.name || profile.handle)}</p>
              <h1>{t.home.whatToday}</h1>
            </>
          ) : (
            <>
              <h1>{t.home.title1} <em>{t.home.title2}</em></h1>
              <p className="hero-sub">{t.home.intro}</p>
            </>
          )}
          <form className="hero-search" action="/buscar" role="search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
            <input name="q" type="search" placeholder={t.home.searchBig} aria-label={t.nav.searchLabel} autoComplete="off" />
            <button className="btn primary" type="submit">{t.nav.search}</button>
          </form>
          <div style={{ marginTop: 18 }}><OnlineNow me={meLite} /></div>
          <div className="quick">
            <Link href="/buscar" className="q"><span className="qi"><Icon name="star" /></span>{t.home.qRate}</Link>
            <Link href="/amigos" className="q"><span className="qi"><Icon name="users" /></span>{t.home.qFriends}</Link>
            {user ? <>
              <Link href="/mensajes" className="q"><span className="qi"><Icon name="mail" /></span>{t.home.qMessages}{unread > 0 && <span className="badge-n">{unread}</span>}</Link>
              <Link href="/perfil" className="q"><span className="qi"><Icon name="user" /></span>{t.home.qProfile}</Link>
            </> : <Link href="/entrar" className="q q-accent"><span className="qi"><Icon name="plus" /></span>{t.home.qEnter}</Link>}
            <ReplayIntro label={t.home.replay} />
          </div>
        </div>
        {fanItems.length > 0 && <Fan3D items={fanItems} legend={{ fav: t.home.fanFav, drop: t.home.fanDrop, new: t.home.fanNew }} />}
      </section>

      <section className="section">
        <div className="sec-head"><div><h2>{t.home.fresh}</h2><span>{t.home.freshSub}</span></div><Link href="/buscar">{t.nav.explore} →</Link></div>
        {fresh.length ? (
          <div className="row">{fresh.slice(0, 16).map((a) => <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!, locale)}</div>} />)}</div>
        ) : <p className="empty">{t.home.freshError}</p>}
      </section>

      {user && (
        <section className="section">
          <div className="sec-head"><h2>{t.home.forYou}</h2><span>{followedArtists.length ? t.home.forYouCount(followedArtists.length) : taste.length ? t.music.becauseListen(taste.map((a) => a.artist_name).slice(0, 2).join(", ")) : t.home.forYouOff}</span></div>
          {recs.length ? (
            <div className="row">{recs.slice(0, 12).map((r) => (
              <Link key={r.track.id} className="poster" href={`/album/${r.track.album.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cover" src={r.track.album.cover_big ?? r.track.album.cover_medium} alt={t.common.coverOf(r.track.album.title)} loading="lazy" />
                <div><div className="t">{r.track.title}</div><div className="a">{t.common.song} · {r.track.artist.name}</div></div>
                <div className="m">{tasteIds.has(r.because.id) ? t.music.becauseListen(r.because.name) : t.home.because(r.because.name)}</div>
              </Link>
            ))}</div>
          ) : (
            <div className="size-note" style={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div><b>{t.home.followArtistsTitle}</b><span className="muted">{t.home.followArtistsText}</span></div>
              <Link className="btn primary sm" href="/buscar">{t.home.searchArtists}</Link>
            </div>
          )}
        </section>
      )}

      {user && (
        <>
          <Suspense fallback={<ListenSkeleton title={t.music.recent} />}><ListenSection /></Suspense>
          <FriendsNow title={t.music.friendsNow} sub={t.music.friendsNowSub} />
        </>
      )}

      <section className="section">
        <div className="sec-head"><div><h2>{t.home.trending}</h2><span>{t.home.trendingSub}</span></div></div>
        {trending.length ? trending.map((rv) => <ReviewCard key={rv.id} rv={rv} viewer={viewer} showRelease />)
          : <p className="empty">{t.home.noReviews}</p>}
      </section>

      {user && (
        <section className="section">
          <div className="sec-head"><h2>{t.home.friendsNews}</h2><Link href="/amigos">{t.home.manageFriends}</Link></div>
          {feed.length ? (
            <div className="row">{feed.slice(0, 12).map((f) => (
              <Link key={f.key} className="poster" href={`/album/${f.rel.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cover" src={f.rel.cover_url ?? ""} alt={t.common.coverOf(f.rel.title)} loading="lazy" />
                <div className="t">{f.rel.title}</div>
                <div className="m" style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar p={f.who} size={20} /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{f.who.handle}</span>{f.liked && <span style={{ color: "var(--like)" }}>♥</span>}<span className={`score s-${cls(f.overall)}`} style={{ marginLeft: "auto" }}>{f1(f.overall)}</span></div>
              </Link>
            ))}</div>
          ) : <p className="empty">{following.length ? t.home.friendsNothing : <>{t.home.noFollowing} <Link className="linkbtn" href="/amigos">{t.home.findFriends}</Link>.</>}</p>}
        </section>
      )}

      <section className="section">
        <div className="sec-head"><h2>{t.home.chart}</h2><span>{t.home.chartSub}</span></div>
        <div className="row">{chart.slice(0, 12).map((a) => <Poster key={a.id} a={a} />)}</div>
      </section>
    </div>
  );
}
