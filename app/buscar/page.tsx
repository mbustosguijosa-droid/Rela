import Link from "next/link";
import type { Metadata } from "next";
import { searchAlbums, searchArtists, tier } from "@/lib/deezer";
import { Poster } from "@/components/Poster";

export const metadata: Metadata = { title: "Buscar" };

type Props = { searchParams: Promise<{ q?: string; tipo?: string }> };

export default async function Buscar({ searchParams }: Props) {
  const { q = "", tipo = "todo" } = await searchParams;
  const query = q.trim();
  const [albums, artists] = query ? await Promise.all([searchAlbums(query, 40), searchArtists(query, 6)]) : [[], []];
  const filtered = albums.filter((a) => tipo === "todo" || (tipo === "album" ? a.record_type === "album" : a.record_type !== "album"));
  const chip = (k: string, l: string) => (
    <Link className="btn" style={tipo === k ? { background: "var(--fg)", color: "var(--bg)" } : undefined} href={`/buscar?q=${encodeURIComponent(query)}&tipo=${k}`}>{l}</Link>
  );
  return (
    <div className="wrap">
      <section className="hello">
        <h1>{query ? <>Resultados para <em>{query}</em></> : "Busca cualquier disco"}</h1>
        {!query && <p>Todo el catálogo de Deezer: álbumes, singles y EPs, desde lo más escuchado hasta artistas con un puñado de oyentes.</p>}
      </section>
      {query && (
        <>
          {artists.length > 0 && (
            <section className="section">
              <div className="sec-head"><h2>Artistas</h2></div>
              <div className="grid">
                {artists.map((ar) => (
                  <Link key={ar.id} className="artist-card" href={`/artista/${ar.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ar.picture_medium} alt="" loading="lazy" />
                    <b>{ar.name}</b>
                    <span className={`tier ${tier(ar.nb_fan).k}`}>{tier(ar.nb_fan).l}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="section">
            <div className="sec-head"><h2>Discos</h2><span>{filtered.length}</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {chip("todo", "Todo")}{chip("album", "Álbumes")}{chip("single", "Singles y EPs")}
            </div>
            {filtered.length ? <div className="grid">{filtered.map((a) => <Poster key={a.id} a={a} meta={<div className="m">{a.record_type === "album" ? "Álbum" : a.record_type === "ep" ? "EP" : "Single"}</div>} />)}</div>
              : <p className="empty">No hay resultados. Prueba con otro nombre.</p>}
          </section>
        </>
      )}
    </div>
  );
}
