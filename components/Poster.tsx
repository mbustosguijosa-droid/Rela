import Link from "next/link";
import type { AlbumSummary } from "@/lib/deezer";
import { getT } from "@/lib/i18n-server";

export async function Poster({ a, meta }: { a: AlbumSummary; meta?: React.ReactNode }) {
  const { t, locale } = await getT();
  const kind = a.record_type !== "album" ? `${t.kind[a.record_type] ?? ""} · ` : "";
  return (
    <Link className="poster" href={`/album/${a.id}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cover" src={a.cover_medium} alt={t.common.coverOf(a.title)} loading="lazy" />
      <div>
        <div className="t">{a.title}</div>
        <div className="a">{kind}{a.artist?.name}</div>
      </div>
      {meta ?? (a.release_date ? <div className="m">{fmtDate(a.release_date, locale)}</div> : null)}
    </Link>
  );
}

export function fmtDate(d: string, locale = "es-ES") {
  return new Date(d + "T12:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}
