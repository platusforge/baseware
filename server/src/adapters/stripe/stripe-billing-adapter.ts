import Stripe from "stripe";
import { env } from "@/env";
import { IBillingAdapter, NormalizedWebhookEvent, SubscriptionDetails } from "../adapters";

function client(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export const PLANS = [
  { id: "free", name: "Free", priceMonthly: 0, seats: 1, features: ["1 project", "Community support"] },
  { id: "starter", name: "Starter", priceMonthly: 19, priceId: env.STRIPE_PRICE_STARTER || undefined, seats: 5, features: ["5 projects", "5 seats", "Email support"] },
  { id: "pro", name: "Pro", priceMonthly: 49, priceId: env.STRIPE_PRICE_PRO || undefined, seats: 25, features: ["Unlimited projects", "25 seats", "Priority support", "Audit logs", "API keys"] },
] as const;

export function priceToPlan(priceId?: string): string {
  if (priceId && priceId === env.STRIPE_PRICE_PRO) return "pro";
  if (priceId && priceId === env.STRIPE_PRICE_STARTER) return "starter";
  return "free";
}

export class StripeBillingAdapter implements IBillingAdapter {
  async ensureCustomer(data: { organizationId: string; email: string; name: string }): Promise<string> {
    const stripe = client();
    if (!stripe) return `cus_mock_${data.organizationId}`;
    const customer = await stripe.customers.create({ email: data.email, name: data.name, metadata: { organizationId: data.organizationId } });
    return customer.id;
  }

  async createCheckoutSession(data: { organizationId: string; customerId?: string; email: string; priceId: string; successUrl: string; cancelUrl: string }) {
    const stripe = client();
    if (!stripe) return { url: `${data.successUrl}?mock=checkout&org=${data.organizationId}` };
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(data.customerId && !data.customerId.startsWith("cus_mock_") ? { customer: data.customerId } : { customer_email: data.email }),
      line_items: [{ price: data.priceId, quantity: 1 }],
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      metadata: { organizationId: data.organizationId },
      subscription_data: { metadata: { organizationId: data.organizationId } },
    });
    return { url: session.url ?? data.cancelUrl };
  }

  async createPortalSession(data: { stripeCustomerId: string; returnUrl: string }) {
    const stripe = client();
    if (!stripe) return { url: `${data.returnUrl}?mock=portal` };
    const session = await stripe.billingPortal.sessions.create({ customer: data.stripeCustomerId, return_url: data.returnUrl });
    return { url: session.url };
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails | null> {
    const stripe = client();
    if (!stripe) return null;
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    const item = sub.items.data[0];
    return {
      status: sub.status,
      priceId: item?.price.id,
      seats: sub.items.data.reduce((sum, i) => sum + (i.quantity ?? 1), 0),
      periodEnd: sub.current_period_end || null,
      customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    };
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): NormalizedWebhookEvent {
    const stripe = client();
    if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
      // Local dev without Stripe keys: only explicitly flagged mock payloads
      // are accepted — anything else fails closed with 400.
      const parsed = JSON.parse(rawBody.toString() || "{}") as {
        mock?: boolean; id?: string; type?: string; data?: NormalizedWebhookEvent["data"];
      };
      if (parsed.mock !== true || !parsed.id || !parsed.type) throw new Error("Webhook verification failed.");
      return { id: parsed.id, type: parsed.type, data: parsed.data ?? {} };
    }
    const event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    const obj = (event.data.object ?? {}) as Record<string, unknown>;
    const metadata = (obj.metadata ?? {}) as Record<string, string>;
    const customerDetails = obj.customer_details as { email?: string } | undefined;
    if (event.type === "checkout.session.completed") {
      return {
        id: event.id,
        type: event.type,
        data: {
          subscriptionId: obj.subscription as string | undefined,
          customerId: obj.customer as string | undefined,
          customerEmail: (obj.customer_email as string | undefined) ?? customerDetails?.email,
          organizationId: metadata.organizationId,
        },
      };
    }
    return {
      id: event.id,
      type: event.type,
      data: {
        subscriptionId: (obj.id as string) ?? (obj.subscription as string),
        customerId: obj.customer as string,
        status: obj.status as string,
        priceId: ((obj.items as { data?: { price?: { id?: string }; quantity?: number }[] })?.data?.[0]?.price?.id) as string,
        seats: ((obj.items as { data?: { quantity?: number }[] })?.data?.reduce((sum, i) => sum + (i.quantity ?? 1), 0)) ?? 1,
        periodEnd: obj.current_period_end as number,
        organizationId: metadata.organizationId,
      },
    };
  }
}
