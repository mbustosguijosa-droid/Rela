import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getViewer, type Profile } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { releasesByIds, type ReleaseRow } from "@/lib/releases";
import { getFollowedArtists, getFollowing, getReviews } from "@/lib/reviews";
import { cls, f1, nf } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { FollowButton } from "@/components/FollowButton";
import { ReviewCard } from "@/components/ReviewCard";
import { getT } from "@/lib/i18n-server";

type Props = { params: Promise<{ handle: string }> };

async function loadProfile(handle: string) {
  const sb = await supabaseServer();
  if (!sb) return null;
  const { data } = await sb.from("profiles").select("*").eq("handle", handle.toLowerCase()).maybeSingle<Profile>();
  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const [p, { t }] = await Promise.all([loadProfile(handle), getT()]);
  return p ? { title: `${p.name || p.handle} (@${p.handle})`, description: p.bio || t.profile.metaDesc(p.handle) } : { title: t.profile.notFound };
}

type RatedRow = { release_id: number; overall: number | null; liked: boolean; updated_at: string; releases: ReleaseRow | null };

const BADGES = [
  { k: "under", ic: "⛏", test: (s: Stats) => s.n >= 3 && s.under / s.n >= 1 / 3 },
  { k: "culto", ic: "✦", test: (s: Stats) => s.culto >= 3 },
  { k: "strict", ic: "✎", test: (s: Stats) => s.scored >= 5 && (s.mean ?? 10) < 7 },
  { k: "heart", ic: "♥", test: (s: Stats) => s.n >= 5 && s.liked / s.n > 0.6 },
  { k: "first", ic: "☄", test: (s: Stats) => s.n >= 1 && s.n < 5 },
  { k: "meloman", ic: "◎", test: (s: Stats) => s.n >= 50 },
];
type Stats = { n: number; scored: number; mean: number | null; under: number; culto: number; conocido: number; main: number; liked: number };

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const p = await loadProfile(handle);
  if (!p) notFound();
  const [{ sb, user }, { t, locale }] = await Promise.all([getViewer(), getT()]);
  if (!sb) notFound();
  const own = user?.id === p.id;

  const [{ data: rated }, { count: followers }, { count: followingN }, myFollowing, reviews, { count: reviewsN }] = await Promise.all([
    sb.from("ratings").select("release_id, overall, liked, updated_at, releases(*)").eq("user_id", p.id).order("updated_at", { ascending: false }).limit(300),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", p.id),
    sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
    getFollowing(sb, user?.id),
    getReviews(sb, { userId: p.id, sort: "hot", limit: 6, viewerId: user?.id }),
    sb.from("reviews").select("*", { count: "exact", head: true }).eq("user_id", p.id),
  ]);
  const artistsFollowed = await getFollowedArtists(sb, p.id);
  const items = ((rated ?? []) as unknown as RatedRow[]).filter((r) => r.releases);
  const favIds = (p.favorites ?? []).map(Number);
  const extra = await releasesByIds(sb, [...favIds, ...(p.loop_release_id ? [Number(p.loop_release_id)] : [])]);
  const favs = favIds.map((id) => extra.get(id)).filter(Boolean) as ReleaseRow[];
  const loop = p.loop_release_id ? extra.get(Number(p.loop_release_id)) : null;

  // Estadísticas e insignias
  const fansOf = (r: RatedRow) => r.releases?.artist_fans ?? 1e9;
  const scores = items.map((r) => r.overall).filter((x): x is number => x != null).map(Number);
  const st: Stats = {
    n: items.length, scored: scores.length, mean: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    under: items.filter((r) => fansOf(r) < 1e4).length, culto: items.filter((r) => fansOf(r) >= 1e4 && fansOf(r) < 1e5).length,
    conocido: items.filter((r) => fansOf(r) >= 1e5 && fansOf(r) < 1e6).length, main: items.filter((r) => fansOf(r) >= 1e6).length,
    liked: items.filter((r) => r.liked).length,
  };
  const badges = BADGES.filter((b) => b.test(st)).slice(0, 4);
  const buckets = Array(10).fill(0) as number[];
  scores.forEach((s) => buckets[Math.min(9, Math.max(0, Math.round(s) - 1))]++);
  const mx = Math.max(1, ...buckets), tot = Math.max(1, st.n);

  // Compatibilidad con quien lo mira
  let compat: { v: number | null; shared: { rel: ReleaseRow; theirs: number; mine: number }[] } | null = null;
  if (user && !own) {
    const { data: mine } = await sb.from("ratings").select("release_id, overall").eq("user_id", user.id).not("overall", "is", null).limit(1000);
    const M = new Map((mine ?? []).map((r) => [Number(r.release_id), Number(r.overall)]));
    const shared = items.filter((r) => r.overall != null && M.has(Number(r.release_id))).map((r) => ({ rel: r.releases!, theirs: Number(r.overall), mine: M.get(Number(r.release_id))! }));
    const diff = shared.length ? shared.reduce((s, x) => s + Math.abs(x.theirs - x.mine), 0) / shared.length : 0;
    compat = { v: shared.length >= 2 ? Math.round(Math.max(5, Math.min(99, 100 - diff * 16))) : null, shared };
  }

  const bannerStyle = p.banner_url ? { backgroundImage: `url('${p.banner_url}')` } : favs[0] || loop ? { backgroundImage: `url('${(favs[0] ?? loop)!.cover_url}')` } : { background: `linear-gradient(120deg, ${p.accent}, var(--surface-2))` };
  const blur = !p.banner_url && (favs[0] || loop);
  const name = p.name || p.handle;

  return (
    <div style={{ ["--pa" as string]: p.accent }}>
      <div className="p-banner"><div className={`bimg ${blur ? "blur" : ""}`} style={bannerStyle} /></div>
      <div className="wrap">
        <section className="p-head">
          <Avatar p={p} size={132} ring />
          <div className="p-id">
            <h1>{name}</h1>
            <div className="handle">@{p.handle}{p.city ? ` · ${p.city}` : ""}</div>
            {p.bio && <p className="bio">{p.bio}</p>}
            {loop && (
              <Link className="loop" href={`/album/${loop.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={loop.cover_url ?? ""} alt="" />
                <span><span className="muted">{t.profile.inLoop}</span> <b>{loop.title}</b> · {loop.artist_name}</span>
              </Link>
            )}
          </div>
          <div className="p-actions">
            {own ? <Link className="btn" href="/perfil/editar">{t.profile.edit}</Link>
              : <FollowButton userId={p.id} initial={myFollowing.includes(p.id)} loggedIn={!!user} />}
          </div>
        </section>

        <div className="p-stats">
          <div><b>{nf(st.n)}</b><span>{t.profile.records}</span></div>
          <div><b>{f1(st.mean)}</b><span>{t.profile.avg}</span></div>
          <div><b>{nf(reviewsN ?? 0)}</b><span>{t.profile.reviews}</span></div>
          <div><b>{nf(followers ?? 0)}</b><span>{t.profile.followers}</span></div>
          <div><b>{nf(followingN ?? 0)}</b><span>{t.profile.following}</span></div>
        </div>

        {compat && (
          <div className="compat">
            <span className="ring" style={{ background: `conic-gradient(${p.accent} ${(compat.v ?? 0)}%, var(--surface-2) 0)` }}><b>{compat.v == null ? "?" : `${compat.v}%`}</b></span>
            <div><b>{t.profile.compat}</b><div className="muted" style={{ fontSize: 13 }}>
              {compat.v == null ? t.profile.compatNone : t.profile.compatText(compat.shared.length, compat.v)}
            </div></div>
          </div>
        )}

        {badges.length > 0 && (
          <section className="section"><div className="sec-head"><h2>{t.profile.badges}</h2></div>
            <div className="badges">{badges.map((b) => <div className="badge" key={b.k}><i>{b.ic}</i><div><b>{t.profile.badge[b.k][0]}</b><span>{t.profile.badge[b.k][1]}</span></div></div>)}</div>
          </section>
        )}

        <section className="section">
          <div className="sec-head"><h2>{own ? t.profile.myTop4 : t.profile.top4Of(name)}</h2>{own && <span>{t.profile.addFromAlbum}</span>}</div>
          <div className="favs">
            {[0, 1, 2, 3].map((i) => favs[i] ? (
              <Link key={i} href={`/album/${favs[i].id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cover" src={favs[i].cover_url ?? ""} alt={t.common.coverOf(favs[i].title)} /><span className="rk">{i + 1}</span>
              </Link>
            ) : own ? <Link key={i} className="slot" href="/buscar">{t.profile.pickRecord}</Link> : <span key={i} className="slot">—</span>)}
          </div>
        </section>

        {artistsFollowed.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>{own ? t.profile.myArtists : t.profile.theirArtists}</h2><span>{artistsFollowed.length}</span></div>
            <div className="artist-row">
              {artistsFollowed.slice(0, 16).map((a) => (
                <Link key={a.artist_id} className="artist-card" href={`/artista/${a.artist_id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.picture_url ?? ""} alt="" loading="lazy" />
                  <b>{a.artist_name}</b>
                </Link>
              ))}
            </div>
          </section>
        )}

        {reviews.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>{own ? t.profile.myReviews : t.profile.reviewsOf(name)}</h2><span>{t.profile.likesReceived(nf(reviews.reduce((s, r) => s + r.likes, 0)))}</span></div>
            {reviews.map((rv) => <ReviewCard key={rv.id} rv={rv} viewer={null} showRelease />)}
          </section>
        )}

        {compat && compat.shared.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>{t.profile.common}</h2><span>{t.profile.commonSub(name)}</span></div>
            {compat.shared.slice(0, 12).map((s) => (
              <Link key={s.rel.id} className="fs" href={`/album/${s.rel.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.rel.cover_url ?? ""} alt="" style={{ width: 40, height: 40, borderRadius: 3 }} />
                <span className="nm"><b>{s.rel.title}</b><small>{s.rel.artist_name}</small></span>
                <span className={`score s-${cls(s.theirs)}`}>{f1(s.theirs)}</span>
                <span className={`score s-${cls(s.mine)}`} style={{ width: 44, textAlign: "right" }}>{f1(s.mine)}</span>
              </Link>
            ))}
          </section>
        )}

        <section className="section">
          <div className="sec-head"><h2>{own ? t.profile.myRecords : t.profile.recordsOf(name)}</h2><span>{nf(st.n)}</span></div>
          {items.length ? (
            <div className="igrid">
              {items.map((r) => (
                <Link key={r.release_id} href={`/album/${r.release_id}`} title={r.releases!.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="cover" src={r.releases!.cover_url ?? ""} alt={t.common.coverOf(r.releases!.title)} loading="lazy" />
                  {r.overall != null && <span className="sc">{f1(r.overall)}</span>}
                  {r.liked && <span className="lk">♥</span>}
                </Link>
              ))}
            </div>
          ) : <p className="empty">{own ? <>{t.profile.emptyOwn} <Link className="linkbtn" href="/buscar">{t.profile.searchRecord}</Link> {t.profile.emptyOwn2}</> : t.profile.emptyOther}</p>}
        </section>

        {st.n > 0 && (
          <div className="prof-split">
            <section className="section">
              <div className="sec-head"><h2>{t.profile.howRates}</h2></div>
              <div className="dist">{buckets.map((b, i) => <div key={i}><i style={{ height: `${(b / mx) * 100}%` }} /><span>{i + 1}</span></div>)}</div>
            </section>
            <section className="section">
              <div className="sec-head"><h2>{t.profile.size}</h2></div>
              <div className="meter">
                <i style={{ width: `${(st.under / tot) * 100}%`, background: "var(--t-under)" }} /><i style={{ width: `${(st.culto / tot) * 100}%`, background: "var(--t-culto)" }} />
                <i style={{ width: `${(st.conocido / tot) * 100}%`, background: "var(--t-conocido)" }} /><i style={{ width: `${(st.main / tot) * 100}%`, background: "var(--t-main)" }} />
              </div>
              <div className="legend">
                <span style={{ ["--c" as string]: "var(--t-under)" }}>{t.tier.under} {Math.round((st.under / tot) * 100)}%</span>
                <span style={{ ["--c" as string]: "var(--t-culto)" }}>{t.tier.culto} {Math.round((st.culto / tot) * 100)}%</span>
                <span style={{ ["--c" as string]: "var(--t-conocido)" }}>{t.tier.conocido} {Math.round((st.conocido / tot) * 100)}%</span>
                <span style={{ ["--c" as string]: "var(--t-main)" }}>{t.tier.main} {Math.round((st.main / tot) * 100)}%</span>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
