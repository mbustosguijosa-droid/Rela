import Link from "next/link";
import { KIND, type AlbumSummary } from "@/lib/deezer";

export function Poster({ a, meta }: { a: AlbumSummary; meta?: React.ReactNode }) {
  const kind = a.record_type !== "album" ? `${KIND[a.record_type] ?? ""} · ` : "";
  return (
    <Link className="poster" href={`/album/${a.id}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cover" src={a.cover_medium} alt={`Portada de ${a.title}`} loading="lazy" />
      <div>
        <div className="t">{a.title}</div>
        <div className="a">{kind}{a.artist?.name}</div>
      </div>
      {meta ?? (a.release_date ? <div className="m">{fmtDate(a.release_date)}</div> : null)}
    </Link>
  );
}

export function fmtDate(d: string) {
  return new Date(d + "T12:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
