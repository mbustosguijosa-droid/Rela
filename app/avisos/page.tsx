import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { timeAgoT } from "@/lib/i18n";
import { getNotifications } from "@/lib/community";
import { getFollowedArtists } from "@/lib/reviews";
import { getLatestFrom } from "@/lib/deezer";
import { Avatar } from "@/components/Avatar";
import { Poster, fmtDate } from "@/components/Poster";
import { MarkRead } from "@/components/MarkRead";
import { cls } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.grow.notifs }; }

export default async function Avisos() {
  const [{ sb, user }, { t, locale }] = await Promise.all([getViewer(), getT()]);
  if (!sb || !user) redirect("/entrar?next=/avisos");
  const followed = await getFollowedArtists(sb, user.id);
  const [list, latest] = await Promise.all([
    getNotifications(sb, user.id),
    followed.length ? getLatestFrom(followed.slice(0, 24).map((f) => Number(f.artist_id)), 1) : Promise.resolve([]),
  ]);
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const drops = latest.filter((a) => (a.release_date ?? "") >= since);
  const unread = (list ?? []).some((n) => !n.read);

  const text = (n: NonNullable<typeof list>[number]) => {
    const rel = n.rel ? <Link href={`/album/${n.rel.id}`}><b>{n.rel.title}</b></Link> : null;
    switch (n.kind) {
      case "like": return <>{t.grow.nLike} {rel}</>;
      case "react": return <>{t.grow.nReact} {rel} <span aria-hidden="true">{n.detail === "fuego" ? "🔥" : n.detail === "acuerdo" ? "🤝" : n.detail === "discrepo" ? "⚡" : ""}</span></>;
      case "reply": return <>{t.grow.nReply} {rel}{n.detail && <q className="nt-quote">{n.detail}</q>}</>;
      case "follow": return <>{t.grow.nFollow}</>;
      case "fav_rated": return <>{t.grow.nFavRated(n.detail ?? "")} {rel}</>;
    }
  };

  return (
    <div className="wrap">
      {unread && <MarkRead />}
      <section className="hello"><h1>{t.grow.notifsTitle}</h1></section>

      <section className="section">
        {list === null ? <p className="empty">{t.grow.notifsSetup}</p>
          : list.length === 0 ? <p className="empty">{t.grow.notifsEmpty}</p>
          : (
            <ul className="notifs">
              {list.map((n) => (
                <li key={n.id} className={`notif ${n.read ? "" : "new"}`}>
                  <Link href={n.actor ? `/u/${n.actor.handle}` : "#"} className="nt-av"><Avatar p={n.actor} size={40} /></Link>
                  <p><Link href={n.actor ? `/u/${n.actor.handle}` : "#"}><b>{n.actor?.name || n.actor?.handle}</b></Link> {text(n)}<small>{timeAgoT(t, n.created_at)}</small></p>
                  {n.kind === "fav_rated" && n.detail && <span className={`score s-${cls(Number(n.detail))}`}>{Number(n.detail).toFixed(1)}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {n.rel?.cover_url && n.kind !== "fav_rated" && <Link href={`/album/${n.rel.id}`}><img className="nt-cover" src={n.rel.cover_url} alt="" loading="lazy" /></Link>}
                </li>
              ))}
            </ul>
          )}
      </section>

      {followed.length > 0 && (
        <section className="section">
          <div className="sec-head"><div><h2>{t.grow.drops}</h2><span>{t.grow.dropsSub}</span></div></div>
          {drops.length ? <div className="row">{drops.map((a) => <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!, locale)}</div>} />)}</div>
            : <p className="empty">{t.grow.dropsNone}</p>}
        </section>
      )}
    </div>
  );
}
