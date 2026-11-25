import type { Metadata } from "next";
import { getViewer } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";
import { PRICES, activePlans, confirmCheckout, isPlan } from "@/lib/billing";
import { ProPlans } from "@/components/ProPlans";

export async function generateMetadata(): Promise<Metadata> { const { t } = await getT(); return { title: t.pro.metaTitle }; }

type Props = { searchParams: Promise<{ gracias?: string; session_id?: string; lista?: string; cancelado?: string; error?: string; plan?: string }> };

export default async function ProPage({ searchParams }: Props) {
  const q = await searchParams;
  const [{ sb, user }, { t }] = await Promise.all([getViewer(), getT()]);
  // Vuelta del pago: se confirma con Stripe y se activa ya, sin esperar al aviso de Stripe
  let confirmed = false;
  if (user && q.session_id) confirmed = await confirmCheckout(q.session_id, user.id);
  const plans = sb && user ? await activePlans(sb, user.id) : [];
  const name = (p?: string) => (p === "artist" ? t.pro.artistName : t.pro.proName);
  const notice = q.gracias && isPlan(q.gracias) ? { kind: "ok", text: confirmed || plans.includes(q.gracias) ? t.pro.thanks(name(q.gracias)) : t.pro.thanksPending }
    : q.lista && isPlan(q.lista) ? { kind: "info", text: t.pro.waitlist(name(q.lista)) }
    : q.cancelado ? { kind: "info", text: t.pro.cancelled }
    : q.error ? { kind: "err", text: t.pro.errorPay } : null;
  return <ProPlans prices={PRICES} active={plans} loggedIn={!!user} notice={notice} focus={isPlan(q.plan) ? q.plan : null} />;
}
