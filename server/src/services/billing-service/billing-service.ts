import { z } from "zod";
import { logger } from "@/logger";
import { ISubscriptionRepository, IOrganizationRepository, IAuditRepository, IMembershipRepository, INotificationRepository, IWebhookEventRepository } from "@/types/repositories/saas-repositories";
import { IBillingAdapter, NormalizedWebhookEvent } from "@/adapters/adapters";
import { priceToPlan } from "@/adapters/stripe/stripe-billing-adapter";
import { IMailAdapter } from "@/adapters/adapters";
import { env } from "@/env";

const checkoutSchema = z.object({
  organizationId: z.string().uuid(),
  plan: z.enum(["starter", "pro"]),
  successUrl: z.string().url().refine((u) => u.startsWith(env.FRONTEND_URL), { message: "URL not allowed." }).optional(),
  cancelUrl: z.string().url().refine((u) => u.startsWith(env.FRONTEND_URL), { message: "URL not allowed." }).optional(),
});

export class CreateCheckoutService {
  constructor(
    private readonly billingAdapter: IBillingAdapter,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(user: { userId: string; email: string; name: string }, input: unknown) {
    try {
      logger.info("CreateCheckoutService: starting...");
      const data = checkoutSchema.parse(input);
      if (!env.STRIPE_SECRET_KEY && env.NODE_ENV === "production") throw new Error("Billing not configured.");
      const priceId = data.plan === "starter" ? env.STRIPE_PRICE_STARTER : env.STRIPE_PRICE_PRO;
      if (!priceId) throw new Error("Plan price not configured.");
      const org = (await this.organizationRepository.findById(data.organizationId)) as { stripeCustomerId: string | null } | null;
      if (!org) throw new Error("Organization not found.");
      const customerId = org.stripeCustomerId ?? await this.billingAdapter.ensureCustomer({ organizationId: data.organizationId, email: user.email, name: user.name });
      if (!org.stripeCustomerId) {
        await this.organizationRepository.update(data.organizationId, { stripeCustomerId: customerId } as never);
      }
      const session = await this.billingAdapter.createCheckoutSession({
        organizationId: data.organizationId,
        customerId,
        email: user.email,
        priceId,
        successUrl: data.successUrl ?? `${env.FRONTEND_URL}/dashboard/billing?success=1`,
        cancelUrl: data.cancelUrl ?? `${env.FRONTEND_URL}/dashboard/billing?canceled=1`,
      });
      logger.info("CreateCheckoutService: completed");
      return session;
    } catch (err) {
      logger.error(`CreateCheckoutService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

export class CreatePortalService {
  constructor(
    private readonly billingAdapter: IBillingAdapter,
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(organizationId: string) {
    try {
      logger.info("CreatePortalService: starting...");
      if (!env.STRIPE_SECRET_KEY && env.NODE_ENV === "production") throw new Error("Billing not configured.");
      const org = (await this.organizationRepository.findById(organizationId)) as { stripeCustomerId: string | null } | null;
      if (!org?.stripeCustomerId) throw new Error("No billing customer yet.");
      const session = await this.billingAdapter.createPortalSession({
        stripeCustomerId: org.stripeCustomerId,
        returnUrl: `${env.FRONTEND_URL}/dashboard/billing`,
      });
      logger.info("CreatePortalService: completed");
      return session;
    } catch (err) {
      logger.error(`CreatePortalService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }
}

/** Stripe statuses this boilerplate understands. Anything else is audited and
 *  skipped (never throws) so a new Stripe status can't wedge the webhook
 *  into an infinite retry loop. */
const KNOWN_STATUSES = new Set(["trialing", "active", "past_due", "canceled", "incomplete"]);

export class HandleBillingWebhookService {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly organizationRepository: IOrganizationRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly notificationRepository: INotificationRepository,
    private readonly auditRepository: IAuditRepository,
    private readonly webhookEventRepository: IWebhookEventRepository,
    private readonly billingAdapter: IBillingAdapter,
    private readonly mailAdapter: IMailAdapter,
  ) {}

  async execute(event: NormalizedWebhookEvent) {
    try {
      logger.info(`HandleBillingWebhookService: starting event=${event.type} id=${event.id}`);
      const claimed = await this.webhookEventRepository.claim(event.id, event.type);
      if (!claimed) {
        logger.warn(`HandleBillingWebhookService: duplicate event id=${event.id}`);
        return { received: true, duplicate: true };
      }

      switch (event.type) {
        case "checkout.session.completed":
          await this.applySubscription(event, await this.enrichFromSubscription(event));
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
          await this.applySubscription(event, null);
          break;
        case "customer.subscription.deleted":
          await this.applyCancellation(event);
          break;
        case "invoice.payment_failed":
          await this.applyPaymentFailed(event);
          break;
        case "invoice.payment_succeeded":
          // Recovery path: a successful payment after past_due re-syncs status/plan.
          await this.applySubscription(event, await this.enrichFromSubscription(event));
          break;
        default:
          await this.auditRepository.append({ action: `billing.${event.type}`, metadata: { eventId: event.id } });
          break;
      }
      logger.info("HandleBillingWebhookService: completed");
      return { received: true };
    } catch (err) {
      logger.error(`HandleBillingWebhookService error: ${err instanceof Error ? err.message : err}`);
      throw err;
    }
  }

  private async enrichFromSubscription(event: NormalizedWebhookEvent) {
    if (!event.data.subscriptionId) return null;
    try {
      return await this.billingAdapter.getSubscriptionDetails(event.data.subscriptionId);
    } catch (err) {
      logger.warn(`HandleBillingWebhookService: subscription retrieve failed id=${event.data.subscriptionId}`);
      return null;
    }
  }

  private async resolveOrganizationId(event: NormalizedWebhookEvent): Promise<string | null> {
    if (event.data.organizationId) return event.data.organizationId;
    if (event.data.customerId) {
      const org = await this.organizationRepository.findByStripeCustomerId(event.data.customerId);
      if (org) return org.id;
    }
    if (event.data.subscriptionId) {
      return this.subscriptionRepository.findOrganizationId(event.data.subscriptionId);
    }
    return null;
  }

  private async applySubscription(event: NormalizedWebhookEvent, details: Awaited<ReturnType<IBillingAdapter["getSubscriptionDetails"]>>) {
    const organizationId = await this.resolveOrganizationId(event);
    const subscriptionId = event.data.subscriptionId;
    if (!organizationId || !subscriptionId) {
      logger.warn(`HandleBillingWebhookService: unresolvable subscription event id=${event.id}`);
      await this.auditRepository.append({ action: `billing.${event.type}.unresolved`, metadata: { eventId: event.id } });
      return;
    }
    const status = details?.status ?? event.data.status ?? "active";
    if (!KNOWN_STATUSES.has(status)) {
      logger.warn(`HandleBillingWebhookService: unknown status=${status} id=${event.id}`);
      await this.auditRepository.append({ organizationId, action: `billing.${event.type}.unknown-status`, metadata: { eventId: event.id, status } });
      return;
    }
    const priceId = details?.priceId ?? event.data.priceId;
    let plan = priceToPlan(priceId);
    if (plan === "free" && priceId) {
      // Unknown price id: never silently downgrade — keep the current plan.
      const current = await this.subscriptionRepository.findByOrganization(organizationId);
      plan = current?.plan ?? "free";
      logger.warn(`HandleBillingWebhookService: unknown price, keeping plan=${plan} id=${event.id}`);
    }
    await this.subscriptionRepository.upsertByStripeId({
      stripeSubscriptionId: subscriptionId,
      organizationId,
      status,
      plan,
      seats: details?.seats ?? event.data.seats ?? 1,
      currentPeriodEnd: toDate(details?.periodEnd ?? event.data.periodEnd),
    });
    await this.organizationRepository.update(organizationId, { plan } as never);
    await this.auditRepository.append({ organizationId, action: `billing.${event.type}`, entity: "subscription", entityId: subscriptionId });
  }

  private async applyCancellation(event: NormalizedWebhookEvent) {
    const subscriptionId = event.data.subscriptionId;
    if (subscriptionId) {
      try {
        await this.subscriptionRepository.updateStatus(subscriptionId, "canceled");
      } catch {
        logger.warn(`HandleBillingWebhookService: unknown subscription id=${subscriptionId}`);
      }
    }
    const organizationId = await this.resolveOrganizationId(event);
    if (organizationId) {
      await this.organizationRepository.update(organizationId, { plan: "free" } as never);
      await this.auditRepository.append({ organizationId, action: `billing.${event.type}`, entity: "subscription", entityId: subscriptionId });
    }
  }

  private async applyPaymentFailed(event: NormalizedWebhookEvent) {
    const subscriptionId = event.data.subscriptionId;
    if (subscriptionId) {
      try {
        await this.subscriptionRepository.updateStatus(subscriptionId, "past_due");
      } catch {
        logger.warn(`HandleBillingWebhookService: unknown subscription id=${subscriptionId}`);
      }
    }
    const organizationId = await this.resolveOrganizationId(event);
    if (!organizationId) {
      await this.auditRepository.append({ action: `billing.${event.type}.unresolved`, metadata: { eventId: event.id } });
      return;
    }
    const members = await this.membershipRepository.listMembers(organizationId);
    const owners = members.filter((m) => m.role === "owner" || m.role === "admin");
    for (const owner of owners) {
      await this.notificationRepository.create({
        userId: owner.userId,
        title: "Payment failed",
        body: "Your subscription payment failed. Update your payment method to avoid interruption.",
      });
    }
    for (const owner of owners) {
      await this.mailAdapter.sendMail({
        to: owner.email,
        subject: "Payment failed — action required",
        html: `<p>Your subscription payment failed. <a href="${env.FRONTEND_URL}/dashboard/billing">Update your payment method</a>.</p>`,
      });
    }
    await this.auditRepository.append({ organizationId, action: `billing.${event.type}`, entity: "subscription", entityId: subscriptionId });
  }
}

function toDate(unixSeconds?: number | null): Date | null {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}
