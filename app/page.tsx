import Link from "next/link";
import { getChartAlbums, getLatestFrom } from "@/lib/deezer";
import { SEED_ARTISTS } from "@/lib/seed";
import { Poster, fmtDate } from "@/components/Poster";

export const revalidate = 3600;

export default async function Home() {
  const [fresh, chart] = await Promise.all([getLatestFrom(SEED_ARTISTS, 1), getChartAlbums(12)]);
  return (
    <div className="wrap">
      <section className="hello">
        <h1>Puntúa tus discos. <em>Canción a canción.</em></h1>
        <p>Lleva un diario de lo que escuchas, descubre qué opina la gente y comparte tus notas en stories.</p>
      </section>

      <section className="section">
        <div className="sec-head"><h2>Novedades · música recién salida</h2><Link href="/buscar">Explorar</Link></div>
        {fresh.length ? (
          <div className="grid">
            {fresh.slice(0, 18).map((a) => (
              <Poster key={a.id} a={a} meta={<div className="m">{fmtDate(a.release_date!)}</div>} />
            ))}
          </div>
        ) : <p className="empty">No se han podido cargar las novedades. Prueba en un rato.</p>}
      </section>

      <section className="section">
        <div className="sec-head"><h2>Lo más escuchado ahora</h2><span>Top de Deezer</span></div>
        <div className="row">{chart.slice(0, 6).map((a) => <Poster key={a.id} a={a} />)}</div>
      </section>
    </div>
  );
}
