import { NextResponse, type NextRequest } from "next/server";
import { saveSubscription, stripe, verifyStripeSignature } from "@/lib/billing";

/** Avisos de Stripe: altas, renovaciones, impagos y bajas de suscripciones. */
export async function POST(req: NextRequest) {
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return NextResponse.json({ error: "webhook_off" }, { status: 503 });
  const body = await req.text();
  if (!verifyStripeSignature(body, req.headers.get("stripe-signature"), whsec)) return NextResponse.json({ error: "firma" }, { status: 400 });
  const event = JSON.parse(body) as { type: string; data: { object: Record<string, unknown> } };
  try {
    const o = event.data.object;
    if (event.type === "checkout.session.completed" && typeof o.subscription === "string") {
      const sub = await stripe<Parameters<typeof saveSubscription>[0]>(`subscriptions/${o.subscription}`);
      await saveSubscription(sub, { user_id: o.client_reference_id as string, plan: (o.metadata as Record<string, string> | undefined)?.plan });
    } else if (event.type.startsWith("customer.subscription.")) {
      await saveSubscription(o as Parameters<typeof saveSubscription>[0]);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "no_guardado" }, { status: 500 }); // Stripe lo reintenta
  }
}
