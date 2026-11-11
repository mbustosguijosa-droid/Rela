import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArtist, getArtistReleases, tier } from "@/lib/deezer";
import { Poster } from "@/components/Poster";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ar = await getArtist(id);
  return { title: ar?.name ?? "Artista" };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [ar, releases] = await Promise.all([getArtist(id), getArtistReleases(id)]);
  if (!ar) notFound();
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
            <p className="facts">{(ar.nb_fan ?? 0).toLocaleString("es-ES")} fans en Deezer · {albums.length} álbumes · {singles.length} singles y EPs</p>
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
      </div>
    </>
  );
}
