import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import type { Challenge, WeekRecord } from "@/lib/community";
import { cls, f1 } from "@/lib/format";

/** Disco de la semana de la comunidad + tu reto semanal: dos motivos para volver cada semana. */
export function Weekly({ week, challenge, t }: { week: WeekRecord | null; challenge: Challenge | null; t: Dict }) {
  return (
    <section className="section weekly">
      <div className="week-card">
        <div className="wk-label">{t.grow.week}</div>
        {week ? (
          <Link href={`/album/${week.rel.id}`} className="wk-rec">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={week.rel.cover_url ?? ""} alt={t.common.coverOf(week.rel.title)} />
            <span className="wk-txt">
              <b>{week.rel.title}</b>
              <span className="muted">{week.rel.artist_name}</span>
              <small>{t.grow.weekStats(week.n, f1(week.avg))}</small>
            </span>
            <span className={`score big s-${cls(week.avg)}`}>{f1(week.avg)}</span>
          </Link>
        ) : <p className="muted wk-empty">{t.grow.weekEmpty}</p>}
        <small className="muted">{t.grow.weekSub}</small>
      </div>
      {challenge && (
        <div className={`week-card chal ${challenge.done >= challenge.goal ? "done" : ""}`}>
          <div className="wk-label">{t.grow.challenge}<span className="muted">{t.grow.ends(challenge.daysLeft)}</span></div>
          <b className="chal-t">{t.grow.challenges[challenge.k]}</b>
          <div className="chal-meter" role="progressbar" aria-valuemin={0} aria-valuemax={challenge.goal} aria-valuenow={challenge.done} aria-label={t.grow.challenge}>
            {Array.from({ length: challenge.goal }, (_, i) => <i key={i} className={i < challenge.done ? "on" : ""} />)}
          </div>
          <div className="chal-foot">
            <span>{challenge.done >= challenge.goal ? t.grow.challengeDone : t.grow.progress(challenge.done, challenge.goal)}</span>
            {challenge.done < challenge.goal && <Link className="btn sm" href={challenge.level ? `/buscar?nivel=${challenge.level}` : "/buscar"}>{t.grow.challengeCta}</Link>}
          </div>
        </div>
      )}
    </section>
  );
}
