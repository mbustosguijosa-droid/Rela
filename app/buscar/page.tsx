import Link from "next/link";
import type { Metadata } from "next";
import { GENRES, getChartAlbums, getChartArtists, getLatestFrom, searchAlbums, searchArtists, tier } from "@/lib/deezer";
import { SEED_ARTISTS } from "@/lib/seed";
import { fmtDate } from "@/components/Poster";
import { Poster } from "@/components/Poster";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.search.title }; }

type Props = { searchParams: Promise<{ q?: string; tipo?: string; genero?: string }> };

export default async function Buscar({ searchParams }: Props) {
  const { q = "", tipo = "todo", genero = "0" } = await searchParams;
  const query = q.trim();
  const { t, locale } = await getT();
  const genre = GENRES.find((g) => String(g.id) === genero) ?? GENRES[0];
  const [albums, artists] = query ? await Promise.all([searchAlbums(query, 40), searchArtists(query, 6)]) : [[], []];
  const filtered = albums.filter((a) => tipo === "todo" || (tipo === "album" ? a.record_type === "album" : a.record_type !== "album"));
  const chip = (k: string, l: string) => (
    <Link className="btn" style={tipo === k ? { background: "var(--fg)", color: "var(--bg)" } : undefined} href={`/buscar?q=${encodeURIComponent(query)}&tipo=${k}`}>{l}</Link>
  );
  return (
    <div className="wrap">
      <section className="hello">
        <h1>{query ? <>{t.search.resultsFor} <em>{query}</em></> : t.search.explore}</h1>
        {!query && <p>{t.search.exploreIntro}</p>}
        <form className="hero-search" action="/buscar" role="search" style={{ marginTop: 18 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></svg>
          <input name="q" type="search" defaultValue={query} placeholder={t.search.ph} aria-label={t.nav.searchLabel} autoComplete="off" />
          <button className="btn primary" type="submit">{t.nav.search}</button>
        </form>
      </section>
      {!query && <Catalog genre={genre} t={t} locale={locale} />}
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

/** Catálogo para explorar sin buscar: géneros, lo más escuchado, artistas del momento y lo recién salido. */
async function Catalog({ genre, t, locale }: { genre: (typeof GENRES)[number]; t: Awaited<ReturnType<typeof getT>>["t"]; locale: string }) {
  const [albums, artists, fresh] = await Promise.all([
    getChartAlbums(30, genre.id),
    getChartArtists(12, genre.id),
    genre.id === 0 ? getLatestFrom(SEED_ARTISTS.slice(0, 24), 1) : Promise.resolve([]),
  ]);
  return (
    <>
      <nav className="genre-chips" aria-label={t.search.explore}>
        {GENRES.map((g) => <Link key={g.id} href={g.id ? `/buscar?genero=${g.id}` : "/buscar"} className={`q ${g.id === genre.id ? "on" : ""}`} aria-current={g.id === genre.id ? "page" : undefined}>{t.search.genres[g.k]}</Link>)}
      </nav>
      {fresh.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{t.search.fresh}</h2></div>
          <div className="row">{fresh.slice(0, 16).map((a) => <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!, locale)}</div>} />)}</div>
        </section>
      )}
      {artists.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>{t.search.topArtists}</h2></div>
          <div className="artist-row artist-scroll">
            {artists.map((ar) => (
              <Link key={ar.id} className="artist-card" href={`/artista/${ar.id}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ar.picture_big ?? ar.picture_medium} alt="" loading="lazy" />
                <b>{ar.name}</b>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="section">
        <div className="sec-head"><h2>{t.search.topAlbums(t.search.genres[genre.k])}</h2><span>{albums.length}</span></div>
        {albums.length ? <div className="grid">{albums.map((a) => <Poster key={a.id} a={a} />)}</div>
          : <p className="empty">{t.home.freshError}</p>}
      </section>
    </>
  );
}
