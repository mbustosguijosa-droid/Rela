import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAlbum, getArtist, geniusUrl, spotifyUrl, tier } from "@/lib/deezer";
import { TrackRater, type RatingState } from "@/components/TrackRater";
import { ReviewCard } from "@/components/ReviewCard";
import { ReviewComposer } from "@/components/ReviewComposer";
import { Avatar } from "@/components/Avatar";
import { getViewer } from "@/lib/auth";
import { getFollowedArtists, getFollowing, getReviews, SORTS, type Sort } from "@/lib/reviews";
import { FollowArtistButton } from "@/components/FollowArtistButton";
import { cls, f1, nf } from "@/lib/format";
import { getT } from "@/lib/i18n-server";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ orden?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [a, { t }] = await Promise.all([getAlbum(id), getT()]);
  if (!a) return { title: t.album.notFound };
  return {
    title: `${a.title} · ${a.artist.name}`,
    description: t.album.metaDesc(a.title, a.artist.name),
    openGraph: { images: [a.cover_big] },
  };
}

export default async function AlbumPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { orden } = await searchParams;
  const sort: Sort = (["hot", "new", "top", "debate"] as const).includes(orden as Sort) ? (orden as Sort) : "hot";
  if (!/^\d+$/.test(id)) notFound();
  const a = await getAlbum(id);
  if (!a) notFound();
  const releaseId = a.id;
  const [{ sb, user, profile }, { t, locale, lang }] = await Promise.all([getViewer(), getT()]);
  const [artist, following, followedArtists] = await Promise.all([getArtist(a.artist.id), sb ? getFollowing(sb, user?.id) : Promise.resolve([]), sb ? getFollowedArtists(sb, user?.id) : Promise.resolve([])]);

  // Datos de la comunidad (solo si Supabase está configurado)
  let initial: RatingState | null = null;
  let community: { overall: number | null; user_id: string }[] = [];
  let reviews: Awaited<ReturnType<typeof getReviews>> = [];
  let friends: { profile: { id: string; handle: string; name: string; avatar_url: string | null; accent: string }; overall: number | null; liked: boolean }[] = [];
  let myReview = "";
  if (sb) {
    const [{ data: ratings }, revs] = await Promise.all([
      sb.from("ratings").select("user_id, overall, liked").eq("release_id", releaseId).limit(5000),
      getReviews(sb, { releaseId, sort, viewerId: user?.id, following, limit: 40 }),
    ]);
    community = (ratings ?? []) as typeof community;
    reviews = revs;
    if (user) {
      const [{ data: mine }, { data: tr }, { data: rv }] = await Promise.all([
        sb.from("ratings").select("*").eq("user_id", user.id).eq("release_id", releaseId).maybeSingle(),
        sb.from("track_ratings").select("track_index, score").eq("user_id", user.id).eq("release_id", releaseId),
        sb.from("reviews").select("body").eq("user_id", user.id).eq("release_id", releaseId).maybeSingle(),
      ]);
      myReview = rv?.body ?? "";
      if (mine) initial = {
        tracks: Object.fromEntries((tr ?? []).map((t) => [t.track_index, Number(t.score)])),
        overall: mine.manual ? Number(mine.overall) : null, fav: mine.fav_track, listened: mine.listened, liked: mine.liked,
      };
      const friendRatings = (ratings ?? []).filter((r) => following.includes(r.user_id));
      if (friendRatings.length) {
        const { data: ps } = await sb.from("profiles").select("id, handle, name, avatar_url, accent").in("id", friendRatings.map((r) => r.user_id));
        friends = friendRatings.map((r) => ({ profile: ps!.find((p) => p.id === r.user_id)!, overall: r.overall, liked: r.liked })).filter((f) => f.profile);
      }
    }
  }

  const scores = community.map((c) => Number(c.overall)).filter((x) => x >= 1);
  const avg = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : null;
  const buckets = Array(10).fill(0) as number[];
  scores.forEach((s) => buckets[Math.min(9, Math.max(0, Math.round(s) - 1))]++);
  const peak = Math.max(1, ...buckets);
  const featured = sort === "hot" ? reviews[0] : null;
  const fans = artist?.nb_fan ?? 0;
  const ti = tier(fans);
  const date = new Date(a.release_date + "T12:00").toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const viewer = user && profile ? { id: user.id, name: profile.name, handle: profile.handle, avatar_url: profile.avatar_url, accent: profile.accent } : null;

  return (
    <>
      <section className="album-hero">
        <div className="wash" style={{ backgroundImage: `url('${a.cover_medium}')` }} aria-hidden="true" />
        <div className="wrap album-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cover" src={a.cover_big} alt={t.common.coverOf(a.title)} />
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow"><span>{t.kind[a.record_type] ?? t.kind.disc} · {date}{a.genres?.data?.[0] ? ` · ${a.genres.data[0].name}` : ""}</span><span className={`tier ${ti.k}`}>{t.tier[ti.k]}</span></p>
            <h1>{a.title}</h1>
            <p className="byline" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><Link href={`/artista/${a.artist.id}`}>{a.artist.name}</Link>
              <FollowArtistButton small artist={{ id: a.artist.id, name: a.artist.name, picture: artist?.picture_medium ?? null, fans: artist?.nb_fan ?? null }} initial={followedArtists.some((f) => Number(f.artist_id) === a.artist.id)} loggedIn={!!user} /></p>
            <div className="community">
              <div>
                <div className="avg"><span className={`num score s-${cls(avg)}`}>{f1(avg)}</span><span className="of">/10</span></div>
                <span className="muted" style={{ fontSize: 13 }}>{scores.length ? t.album.avgOf(scores.length.toLocaleString(locale), scores.length === 1) : t.album.nobody} · {t.common.songs(a.nb_tracks)}</span>
                <div style={{ marginTop: 6 }}><a className="linkbtn" href="#resenas">💬 {t.album.reviewsN(reviews.length)}</a></div>
              </div>
              {scores.length > 0 && (
                <div aria-label={t.album.distribution}>
                  <div className="bars">{buckets.map((b, i) => <i key={i} className={b === peak ? "peak" : ""} style={{ height: `${Math.max(4, (b / peak) * 100)}%` }} />)}</div>
                  <div className="axis"><span>1</span><span>10</span></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        {(ti.k === "under" || ti.k === "culto") && (
          <div className="size-note" style={{ marginTop: 24 }}>
            <span className={`tier ${ti.k}`} style={{ marginTop: 2 }}>{t.tier[ti.k]}</span>
            <div><b>{a.artist.name} · {t.common.fansDeezer(fans.toLocaleString(locale))}.</b><span className="muted">{t.common.yourVoteCounts}</span></div>
          </div>
        )}
        <TrackRater
          albumId={releaseId}
          tracks={a.tracks.data.map((x) => ({ id: x.id, title: x.title }))}
          links={{ spotify: spotifyUrl(a.artist.name, a.title), deezer: a.link, genius: geniusUrl(a.artist.name, a.title), trackGenius: a.tracks.data.map((x) => geniusUrl(a.artist.name, x.title)) }}
          initial={initial}
          loggedIn={!!user}
          inTop4={!!profile?.favorites?.map(Number).includes(releaseId)}
          inLoop={Number(profile?.loop_release_id) === releaseId}
        >
          {featured && (
            <div className="featured"><span className="lbl">{t.album.featured}</span><ReviewCard rv={featured} viewer={viewer} /></div>
          )}
          <section id="resenas">
            <header className="panel-head"><h2>{t.album.reviewsTitle}</h2><p>{t.album.reviewsIntro}</p></header>
            <ReviewComposer releaseId={releaseId} initial={myReview} viewer={viewer} />
            <div className="sorttabs">{SORTS.map(([k]) => <Link key={k} className={`chip ${k === sort ? "on" : ""}`} href={`/album/${releaseId}?orden=${k}#resenas`} scroll={false}>{t.reviews.sorts[k]}</Link>)}</div>
            <p className="sort-note">{t.reviews.notes[sort]}</p>
            {reviews.length ? reviews.map((rv) => <ReviewCard key={rv.id} rv={rv} viewer={viewer} />)
              : <p className="empty" style={{ marginTop: 14 }}>{t.album.noReviews}</p>}
          </section>
          {user && (
            <section>
              <div className="sec-head"><h2>{t.album.yourFriends}</h2><span>{t.album.friendsRated(friends.length, following.length)}</span></div>
              {friends.length ? friends.map((f) => (
                <Link key={f.profile.id} className="fs" href={`/u/${f.profile.handle}`}>
                  <Avatar p={f.profile} size={34} />
                  <span className="nm"><b>{f.profile.name || f.profile.handle}</b><small>@{f.profile.handle}</small>{f.liked && <span style={{ color: "var(--like)" }}> ♥</span>}</span>
                  <span className={`score s-${cls(f.overall)}`}>{f1(f.overall)}</span>
                </Link>
              )) : <p className="empty">{following.length ? t.album.noFriendRated : <>{t.home.noFollowing} <Link className="linkbtn" href="/amigos">{t.home.findFriends}</Link>.</>}</p>}
            </section>
          )}
        </TrackRater>
      </div>
    </>
  );
}
