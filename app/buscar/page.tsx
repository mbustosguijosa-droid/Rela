import Link from "next/link";
import type { Metadata } from "next";
import { searchAlbums, searchArtists, tier } from "@/lib/deezer";
import { Poster } from "@/components/Poster";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.search.title }; }

type Props = { searchParams: Promise<{ q?: string; tipo?: string }> };

export default async function Buscar({ searchParams }: Props) {
  const { q = "", tipo = "todo" } = await searchParams;
  const query = q.trim();
  const { t } = await getT();
  const [albums, artists] = query ? await Promise.all([searchAlbums(query, 40), searchArtists(query, 6)]) : [[], []];
  const filtered = albums.filter((a) => tipo === "todo" || (tipo === "album" ? a.record_type === "album" : a.record_type !== "album"));
  const chip = (k: string, l: string) => (
    <Link className="btn" style={tipo === k ? { background: "var(--fg)", color: "var(--bg)" } : undefined} href={`/buscar?q=${encodeURIComponent(query)}&tipo=${k}`}>{l}</Link>
  );
  return (
    <div className="wrap">
      <section className="hello">
        <h1>{query ? <>{t.search.resultsFor} <em>{query}</em></> : t.search.anyRecord}</h1>
        {!query && <p>{t.search.intro}</p>}
      </section>
      {query && (
        <>
          {artists.length > 0 && (
            <section className="section">
              <div className="sec-head"><h2>{t.search.artists}</h2></div>
              <div className="grid">
                {artists.map((ar) => (
                  <Link key={ar.id} className="artist-card" href={`/artista/${ar.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ar.picture_medium} alt="" loading="lazy" />
                    <b>{ar.name}</b>
                    <span className={`tier ${tier(ar.nb_fan).k}`}>{t.tier[tier(ar.nb_fan).k]}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section className="section">
            <div className="sec-head"><h2>{t.search.records}</h2><span>{filtered.length}</span></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {chip("todo", t.search.all)}{chip("album", t.search.albums)}{chip("single", t.search.singles)}
            </div>
            {filtered.length ? <div className="grid">{filtered.map((a) => <Poster key={a.id} a={a} meta={<div className="m">{t.kind[a.record_type] ?? t.kind.single}</div>} />)}</div>
              : <p className="empty">{t.search.none}</p>}
          </section>
        </>
      )}
    </div>
  );
}
