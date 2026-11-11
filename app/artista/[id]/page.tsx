import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtist, getArtistReleases, tier } from "@/lib/deezer";
import { Poster } from "@/components/Poster";
import { FollowArtistButton } from "@/components/FollowArtistButton";
import { getViewer } from "@/lib/auth";
import { getFollowedArtists } from "@/lib/reviews";
import { getRelated } from "@/lib/deezer";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ar = await getArtist(id);
  return { title: ar?.name ?? "Artista" };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [ar, releases, related, viewer] = await Promise.all([getArtist(id), getArtistReleases(id), getRelated(id, 12), getViewer()]);
  if (!ar) notFound();
  const followed = viewer.sb ? await getFollowedArtists(viewer.sb, viewer.user?.id) : [];
  let followers = 0;
  if (viewer.sb) { const { count } = await viewer.sb.from("artist_follows").select("*", { count: "exact", head: true }).eq("artist_id", ar.id); followers = count ?? 0; }
  const t = tier(ar.nb_fan);
  const byDate = [...releases].sort((x, y) => (y.release_date ?? "").localeCompare(x.release_date ?? ""));
  const albums = byDate.filter((a) => a.record_type === "album");
  const singles = byDate.filter((a) => a.record_type === "single" || a.record_type === "ep");
  const withArtist = (list: typeof releases) => list.map((a) => ({ ...a, artist: a.artist ?? ar }));
  return (
    <>
      <section className="album-hero">
        <div className="wash" style={{ backgroundImage: `url('${ar.picture_medium}')` }} aria-hidden="true" />
        <div className="wrap album-head" style={{ gridTemplateColumns: "200px minmax(0,1fr)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="artist-pic" src={ar.picture_big} alt={ar.name} />
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow"><span>Artista</span><span className={`tier ${t.k}`}>{t.l}</span></p>
            <h1>{ar.name}</h1>
            <p className="facts">{(ar.nb_fan ?? 0).toLocaleString("es-ES")} fans en Deezer · {followers.toLocaleString("es-ES")} {followers === 1 ? "seguidor" : "seguidores"} en Rela · {albums.length} álbumes · {singles.length} singles y EPs</p>
            <div style={{ marginTop: 16 }}>
              <FollowArtistButton artist={{ id: ar.id, name: ar.name, picture: ar.picture_medium ?? null, fans: ar.nb_fan ?? null }} initial={followed.some((f) => Number(f.artist_id) === ar.id)} loggedIn={!!viewer.user} />
            </div>
          </div>
        </div>
      </section>
      <div className="wrap">
        <section className="section">
          <div className="sec-head"><h2>Álbumes</h2><span>{albums.length}</span></div>
          {albums.length ? <div className="grid">{withArtist(albums).map((a) => <Poster key={a.id} a={a} />)}</div> : <p className="empty">Sin álbumes en el catálogo.</p>}
        </section>
        {singles.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>Singles y EPs</h2><span>{singles.length}</span></div>
            <div className="grid">{withArtist(singles).map((a) => <Poster key={a.id} a={a} />)}</div>
          </section>
        )}
        {related.length > 0 && (
          <section className="section">
            <div className="sec-head"><h2>Artistas de su nicho</h2><span>Si te gusta {ar.name}</span></div>
            <div className="grid">
              {related.map((r) => (
                <Link key={r.id} className="artist-card" href={`/artista/${r.id}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.picture_medium} alt="" loading="lazy" />
                  <b>{r.name}</b>
                  <span className={`tier ${tier(r.nb_fan).k}`}>{tier(r.nb_fan).l}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
