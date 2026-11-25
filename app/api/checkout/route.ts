import { NextResponse, type NextRequest } from "next/server";
import { getViewer } from "@/lib/auth";
import { isPeriod, isPlan, paymentsReady, priceId, stripe } from "@/lib/billing";

/** Lleva al pago de Stripe del plan elegido. Si los pagos aún no están activados, apunta a la persona en la lista de espera. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const plan = url.searchParams.get("plan"), period = url.searchParams.get("period") ?? "month";
  const back = (q: string) => NextResponse.redirect(new URL(`/pro?${q}`, url.origin), 303);
  if (!isPlan(plan) || !isPeriod(period)) return back("error=plan");
  const { sb, user } = await getViewer();
  if (!sb || !user) return NextResponse.redirect(new URL(`/entrar?next=${encodeURIComponent(`/pro?plan=${plan}`)}`, url.origin), 303);

  if (!paymentsReady(plan, period)) {
    await sb.from("pro_interest").upsert({ user_id: user.id, plan, period });
    return back(`lista=${plan}`);
  }
  try {
    const params: Record<string, string> = {
      mode: "subscription",
      "line_items[0][price]": priceId(plan, period)!,
      "line_items[0][quantity]": "1",
      client_reference_id: user.id,
      "metadata[plan]": plan,
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][plan]": plan,
      allow_promotion_codes: "true",
      locale: "auto",
      success_url: `${url.origin}/pro?gracias=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${url.origin}/pro?cancelado=${plan}`,
    };
    const { data: bill } = await sb.from("billing").select("stripe_customer").eq("user_id", user.id).maybeSingle();
    if (bill?.stripe_customer) params.customer = bill.stripe_customer;
    else if (user.email) params.customer_email = user.email;
    const session = await stripe<{ url: string }>("checkout/sessions", params);
    return NextResponse.redirect(session.url, 303);
  } catch {
    return back("error=pago");
  }
}
