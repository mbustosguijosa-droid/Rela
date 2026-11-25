"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useT } from "./I18n";
import type { Period, Plan } from "@/lib/billing";

type Props = {
  prices: Record<Plan, Record<Period, number>>; active: Plan[]; loggedIn: boolean;
  notice: { kind: string; text: string } | null; focus: Plan | null;
};

const Check = () => <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10.5 3.2 3L15 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;

/** Página de planes: interruptor mensual/anual, dos tarjetas con luz que sigue al ratón, garantías y preguntas. */
export function ProPlans({ prices, active, loggedIn, notice, focus }: Props) {
  const { t, locale } = useT();
  const [period, setPeriod] = useState<Period>("year");
  const money = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const saving = (p: Plan) => Math.round((1 - prices[p].year / (prices[p].month * 12)) * 100);
  const maxSave = Math.max(saving("pro"), saving("artist"));

  const card = (plan: Plan) => {
    const isPro = plan === "pro";
    const feats = isPro ? t.pro.proFeatures : t.pro.artistFeatures;
    const price = prices[plan][period];
    const own = active.includes(plan);
    const href = loggedIn ? `/api/checkout?plan=${plan}&period=${period}` : `/entrar?next=${encodeURIComponent(`/pro?plan=${plan}`)}`;
    return (
      <Tilt key={plan} className={`plan ${plan} ${focus === plan ? "focus" : ""} ${own ? "own" : ""}`}>
        <div className="plan-top">
          <span className="plan-for">{isPro ? t.pro.listener : t.pro.artist}</span>
          {isPro && <span className="plan-pop">{t.pro.popular}</span>}
        </div>
        <h2 className="plan-name">{isPro ? t.pro.proName : t.pro.artistName}</h2>
        <p className="plan-pitch">{isPro ? t.pro.proPitch : t.pro.artistPitch}</p>
        <div className="plan-price" aria-live="polite">
          <b key={period + plan}>{money(price)}</b><span>{period === "year" ? t.pro.perYear : t.pro.perMonth}</span>
        </div>
        <p className="plan-equiv">{period === "year" ? t.pro.equiv(money(Math.round((price / 12) * 100) / 100)) : " "}</p>
        {own ? (
          <>
            <span className="plan-cta own-tag">✓ {t.pro.active}</span>
            <a className="plan-manage" href="/api/billing">{t.pro.manage}</a>
          </>
        ) : (
          <a className="plan-cta" href={href}>{loggedIn ? (isPro ? t.pro.buyPro : t.pro.buyArtist) : t.pro.loginFirst}<span aria-hidden="true">→</span></a>
        )}
        <ul className="plan-feats">
          {feats.map(([f, soon]) => <li key={f}><Check /><span>{f}{soon && <em className="soon">{t.pro.soon}</em>}</span></li>)}
        </ul>
      </Tilt>
    );
  };

  return (
    <div className="wrap pro-page">
      <section className="pro-hero">
        <span className="pro-kicker"><i aria-hidden="true" />{t.pro.kicker}</span>
        <h1>{t.pro.title}</h1>
        <p>{t.pro.sub}</p>
        <div className="period" role="radiogroup" aria-label={t.pro.kicker} data-p={period}>
          <span className="period-thumb" aria-hidden="true" />
          {(["month", "year"] as Period[]).map((p) => (
            <button key={p} type="button" role="radio" aria-checked={period === p} className={period === p ? "on" : ""} onClick={() => setPeriod(p)}>
              {p === "month" ? t.pro.monthly : t.pro.yearly}{p === "year" && <small>{t.pro.save(maxSave)}</small>}
            </button>
          ))}
        </div>
      </section>

      {notice && <div className={`pro-notice ${notice.kind}`} role="status">{notice.text}</div>}

      <section className="plans">{card("pro")}{card("artist")}</section>
      <p className="pro-secure">{t.pro.secure}</p>

      <section className="pro-extra">
        <div className="pro-free">
          <h3>{t.pro.freeTitle}</h3>
          <ul>{t.pro.freeItems.map((f) => <li key={f}><Check />{f}</li>)}</ul>
        </div>
        <div className="pro-trust">
          <span className="trust-ic" aria-hidden="true">⚖</span>
          <h3>{t.pro.trustTitle}</h3>
          <p>{t.pro.trustText}</p>
        </div>
      </section>

      <section className="pro-faq">
        <h2>{t.pro.faqTitle}</h2>
        {t.pro.faq.map(([q, a]) => (
          <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>
        ))}
        <p className="muted pro-back"><Link href="/">← Rela Music</Link></p>
      </section>
    </div>
  );
}

/** Tarjeta que se inclina un poco y tiene un foco de luz que sigue al ratón. */
function Tilt({ className, children }: { className: string; children: React.ReactNode }) {
  const el = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent) => {
    const n = el.current; if (!n || e.pointerType !== "mouse") return;
    const r = n.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    n.style.setProperty("--mx", `${x * 100}%`); n.style.setProperty("--my", `${y * 100}%`);
    n.style.setProperty("--tx", `${(0.5 - y) * 5}deg`); n.style.setProperty("--ty", `${(x - 0.5) * 7}deg`);
  };
  const leave = () => { const n = el.current; if (!n) return; n.style.setProperty("--tx", "0deg"); n.style.setProperty("--ty", "0deg"); };
  return <article ref={el} className={className} onPointerMove={move} onPointerLeave={leave}>{children}</article>;
}
