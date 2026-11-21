import { Poster } from "./Poster";
import { getCultPicks, tier } from "@/lib/deezer";
import type { Dict } from "@/lib/i18n";

const compact = (n: number, locale: string) => new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);

/** Fila de discos de artistas pequeños (De culto o Underground), con su nivel y sus fans. Rota cada día. */
export async function CultRow({ seeds, t, locale, title, sub, maxFans = 100_000, minFans, limit = 12, grid = false }: {
  seeds: number[]; t: Dict; locale: string; title: string; sub?: string; maxFans?: number; minFans?: number; limit?: number; grid?: boolean;
}) {
  const picks = seeds.length ? await getCultPicks(seeds, limit, { maxFans, minFans }) : [];
  if (!picks.length) return grid ? <section className="section"><div className="sec-head"><h2>{title}</h2></div><p className="empty">{t.grow.noCult}</p></section> : null;
  return (
    <section className="section cult">
      <div className="sec-head"><div><h2>{title}</h2>{sub && <span>{sub}</span>}</div></div>
      <div className={grid ? "grid" : "row"}>
        {picks.map((a) => {
          const tr = tier(a.artist.nb_fan);
          return <Poster key={a.id} a={a} meta={<div className="m cult-m"><span className={`tier ${tr.k}`}>{t.tier[tr.k]}</span><span>{t.grow.fans(compact(a.artist.nb_fan, locale))}</span></div>} />;
        })}
      </div>
    </section>
  );
}
