import Link from "next/link";
import { getChartAlbums, getLatestFrom } from "@/lib/deezer";
import { SEED_ARTISTS } from "@/lib/seed";
import { Poster, fmtDate } from "@/components/Poster";
import { getViewer } from "@/lib/auth";
import { getFollowing, getReviews } from "@/lib/reviews";
import { releasesByIds } from "@/lib/releases";
import { ReviewCard } from "@/components/ReviewCard";
import { Avatar } from "@/components/Avatar";
import { cls, f1 } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { sb, user, profile } = await getViewer();
  const following = sb ? await getFollowing(sb, user?.id) : [];
  const [fresh, chart, trending, activity] = await Promise.all([
    getLatestFrom(SEED_ARTISTS, 1),
    getChartAlbums(12),
    sb ? getReviews(sb, { sort: "hot", limit: 6, viewerId: user?.id, following }) : Promise.resolve([]),
    sb && following.length
      ? sb.from("ratings").select("user_id, release_id, overall, liked, updated_at").in("user_id", following).order("updated_at", { ascending: false }).limit(12).then((r) => r.data ?? [])
      : Promise.resolve([]),
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
        <h1>Puntúa tus discos. <em>Canción a canción.</em></h1>
        <p>Lleva un diario de lo que escuchas, descubre qué opina la gente y comparte tus notas en stories.</p>
        {!user && <p style={{ marginTop: 16 }}><Link className="btn primary" href="/entrar">Crear mi perfil gratis</Link></p>}
      </section>

      <section className="section">
        <div className="sec-head"><h2>Novedades · música recién salida</h2><Link href="/buscar">Explorar</Link></div>
        {fresh.length ? (
          <div className="row">{fresh.slice(0, 6).map((a) => <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!)}</div>} />)}</div>
        ) : <p className="empty">No se han podido cargar las novedades. Prueba en un rato.</p>}
      </section>

      <section className="section">
        <div className="sec-head"><h2>Reseñas en tendencia</h2><span>Ordenadas por interacción</span></div>
        {trending.length ? trending.map((rv) => <ReviewCard key={rv.id} rv={rv} viewer={viewer} showRelease />)
          : <p className="empty">Todavía no hay reseñas. Abre un disco, puntúalo y escribe la primera.</p>}
      </section>

      {user && (
        <section className="section">
          <div className="sec-head"><h2>Novedades de tus amigos</h2><Link href="/amigos">Gestionar amigos</Link></div>
          {feed.length ? (
            <div className="row">{feed.slice(0, 6).map((f) => (
              <Link key={f.key} className="poster" href={`/album/${f.rel.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cover" src={f.rel.cover_url ?? ""} alt={`Portada de ${f.rel.title}`} loading="lazy" />
                <div className="t">{f.rel.title}</div>
                <div className="m" style={{ display: "flex", alignItems: "center", gap: 6 }}><Avatar p={f.who} size={20} /><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{f.who.handle}</span>{f.liked && <span style={{ color: "var(--like)" }}>♥</span>}<span className={`score s-${cls(f.overall)}`} style={{ marginLeft: "auto" }}>{f1(f.overall)}</span></div>
              </Link>
            ))}</div>
          ) : <p className="empty">{following.length ? "Tus amigos aún no han puntuado nada." : <>Todavía no sigues a nadie. <Link className="linkbtn" href="/amigos">Busca amigos</Link>.</>}</p>}
        </section>
      )}

      <section className="section">
        <div className="sec-head"><h2>Lo más escuchado ahora</h2><span>Top de Deezer</span></div>
        <div className="row">{chart.slice(0, 6).map((a) => <Poster key={a.id} a={a} />)}</div>
      </section>
    </div>
  );
}
