import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAlbum, getArtist, geniusUrl, spotifyUrl, KIND, tier } from "@/lib/deezer";
import { TrackRater } from "@/components/TrackRater";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const a = await getAlbum(id);
  if (!a) return { title: "Disco no encontrado" };
  return {
    title: `${a.title} · ${a.artist.name}`,
    description: `Puntúa ${a.title} de ${a.artist.name} canción a canción en Rela.`,
    openGraph: { images: [a.cover_big] },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const a = await getAlbum(id);
  if (!a) notFound();
  const artist = await getArtist(a.artist.id);
  const fans = artist?.nb_fan ?? 0;
  const t = tier(fans);
  const date = new Date(a.release_date + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const mins = Math.round(a.duration / 60);
  return (
    <>
      <section className="album-hero">
        <div className="wash" style={{ backgroundImage: `url('${a.cover_medium}')` }} aria-hidden="true" />
        <div className="wrap album-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cover" src={a.cover_big} alt={`Portada de ${a.title}`} />
          <div style={{ minWidth: 0 }}>
            <p className="eyebrow"><span>{KIND[a.record_type] ?? "Disco"} · {date}{a.genres?.data?.[0] ? ` · ${a.genres.data[0].name}` : ""}</span><span className={`tier ${t.k}`}>{t.l}</span></p>
            <h1>{a.title}</h1>
            <p className="byline"><Link href={`/artista/${a.artist.id}`}>{a.artist.name}</Link></p>
            <p className="facts">{a.nb_tracks} {a.nb_tracks === 1 ? "canción" : "canciones"} · {mins} min{a.label ? ` · ${a.label}` : ""}</p>
          </div>
        </div>
      </section>
      <div className="wrap">
        {(t.k === "under" || t.k === "culto") && (
          <div className="size-note" style={{ marginTop: 24 }}>
            <span className={`tier ${t.k}`} style={{ marginTop: 2 }}>{t.l}</span>
            <div><b>{a.artist.name} tiene {fans.toLocaleString("es-ES")} fans en Deezer.</b><span className="muted">Tu nota aquí cuenta mucho.</span></div>
          </div>
        )}
        <TrackRater
          albumId={a.id}
          tracks={a.tracks.data.map((x) => ({ id: x.id, title: x.title }))}
          links={{
            spotify: spotifyUrl(a.artist.name, a.title),
            deezer: a.link,
            genius: geniusUrl(a.artist.name, a.title),
            trackGenius: a.tracks.data.map((x) => geniusUrl(a.artist.name, x.title)),
          }}
        />
      </div>
    </>
  );
}
