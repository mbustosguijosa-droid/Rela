import Link from "next/link";
import { getChartAlbums, getLatestFrom } from "@/lib/deezer";
import { SEED_ARTISTS } from "@/lib/seed";
import { Poster, fmtDate } from "@/components/Poster";
import { getViewer } from "@/lib/auth";
import { getFollowedArtists, getFollowing, getReviews } from "@/lib/reviews";
import { getRecommendations } from "@/lib/deezer";
import { releasesByIds } from "@/lib/releases";
import { ReviewCard } from "@/components/ReviewCard";
import { Avatar } from "@/components/Avatar";
import { cls, f1 } from "@/lib/format";
import { getT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ sb, user, profile }, { t, locale }] = await Promise.all([getViewer(), getT()]);
  const [following, followedArtists] = sb ? await Promise.all([getFollowing(sb, user?.id), getFollowedArtists(sb, user?.id)]) : [[], []];
  const followedIds = followedArtists.map((f) => Number(f.artist_id));
  const [fresh, chart, trending, activity, recs] = await Promise.all([
    getLatestFrom([...new Set([...followedIds.slice(0, 20), ...SEED_ARTISTS])].slice(0, 45), 1),
    getChartAlbums(12),
    sb ? getReviews(sb, { sort: "hot", limit: 6, viewerId: user?.id, following }) : Promise.resolve([]),
    sb && following.length
      ? sb.from("ratings").select("user_id, release_id, overall, liked, updated_at").in("user_id", following).order("updated_at", { ascending: false }).limit(12).then((r) => r.data ?? [])
      : Promise.resolve([]),
    followedArtists.length ? getRecommendations(followedArtists, 12) : Promise.resolve([]),
  ]);
  let feed: { key: string; rel: { id: number; title: string; cover_url: string | null }; who: { handle: string; name: string; avatar_url: string | null; accent: string }; overall: number | null; liked: boolean }[] = [];
  if (sb && activity.length) {
    const [rels, { data: ps }] = await Promise.all([
      releasesByIds(sb, activity.map((a) => Number(a.release_id))),
      sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", [...new Set(activity.map((a) => a.user_id))]),
    ]);
    feed = activity.map((a) => ({ key: a.user_id + a.release_id, rel: rels.get(Number(a.release_id))!, who: ps!.find((p) => p.id === a.user_id)!, overall: a.overall, liked: a.liked })).filter((f) => f.rel && f.who);
  }
  const viewer = user && profile ? { id: user.id, name: profile.name, handle: profile.handle, avatar_url: profile.avatar_url, accent: profile.accent } : null;

  return (
    <div className="wrap">
      <section className="hello">
        <h1>{t.home.title1} <em>{t.home.title2}</em></h1>
        <p>{t.home.intro}</p>
        {!user && <p style={{ marginTop: 16 }}><Link className="btn primary" href="/entrar">{t.home.createProfile}</Link></p>}
      </section>

      <section className="section">
        <div className="sec-head"><h2>{t.home.fresh}</h2><Link href="/buscar">{t.nav.explore}</Link></div>
        {fresh.length ? (
          <div className="row">{fresh.slice(0, 6).map((a) => <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!, locale)}</div>} />)}</div>
        ) : <p className="empty">{t.home.freshError}</p>}
      </section>

      {user && (
        <section className="section">
          <div className="sec-head"><h2>{t.home.forYou}</h2><span>{followedArtists.length ? t.home.forYouCount(followedArtists.length) : t.home.forYouOff}</span></div>
          {recs.length ? (
            <div className="row">{recs.slice(0, 12).map((r) => (
              <Link key={r.track.id} className="poster" href={`/album/${r.track.album.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cover" src={r.track.album.cover_medium} alt={t.common.coverOf(r.track.album.title)} loading="lazy" />
                <div><div className="t">{r.track.title}</div><div className="a">{t.common.song} · {r.track.artist.name}</div></div>
                <div className="m">{t.home.because(r.because.name)}</div>
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

      <section className="section">
        <div className="sec-head"><h2>{t.home.trending}</h2><span>{t.home.byInteraction}</span></div>
        {trending.length ? trending.map((rv) => <ReviewCard key={rv.id} rv={rv} viewer={viewer} showRelease />)
          : <p className="empty">{t.home.noReviews}</p>}
      </section>

      {user && (
        <section className="section">
          <div className="sec-head"><h2>{t.home.friendsNews}</h2><Link href="/amigos">{t.home.manageFriends}</Link></div>
          {feed.length ? (
            <div className="row">{feed.slice(0, 6).map((f) => (
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
        <div className="row">{chart.slice(0, 6).map((a) => <Poster key={a.id} a={a} />)}</div>
      </section>
    </div>
  );
}
