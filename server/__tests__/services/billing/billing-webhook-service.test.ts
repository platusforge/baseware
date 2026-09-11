import { HandleBillingWebhookService } from "@/services/billing-service/billing-service";
import { NormalizedWebhookEvent } from "@/adapters/adapters";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/env", () => ({
  env: {
    FRONTEND_URL: "http://localhost:5173",
    STRIPE_PRICE_STARTER: "price_starter",
    STRIPE_PRICE_PRO: "price_pro",
  },
}));

const event = (overrides: Partial<NormalizedWebhookEvent> = {}): NormalizedWebhookEvent => ({
  id: "evt_123",
  type: "customer.subscription.updated",
  data: { subscriptionId: "sub_123", customerId: "cus_123", status: "active", priceId: "price_pro", seats: 3, periodEnd: 1893456000 },
  ...overrides,
});

function makeService(repos: Record<string, Record<string, jest.Mock>> = {}) {
  const mockSubs = {
    upsertByStripeId: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    findOrganizationId: jest.fn().mockResolvedValue("o1"),
    ...repos.subs,
  };
  const mockOrgs = {
    findByStripeCustomerId: jest.fn().mockResolvedValue({ id: "o1" }),
    update: jest.fn().mockResolvedValue(undefined),
    ...repos.orgs,
  };
  const mockMembers = { listMembers: jest.fn().mockResolvedValue([]), ...repos.members };
  const mockNotifications = { create: jest.fn().mockResolvedValue(undefined) };
  const mockAudit = { append: jest.fn().mockResolvedValue(undefined) };
  const mockEvents = { claim: jest.fn().mockResolvedValue(true), ...repos.events };
  const mockBilling = { getSubscriptionDetails: jest.fn().mockResolvedValue(null) };
  const mockMail = { sendMail: jest.fn().mockResolvedValue(undefined) };
  const service = new HandleBillingWebhookService(
    mockSubs as never, mockOrgs as never, mockMembers as never, mockNotifications as never,
    mockAudit as never, mockEvents as never, mockBilling as never, mockMail as never,
  );
  return { service, mockSubs, mockOrgs, mockMembers, mockNotifications, mockAudit, mockEvents, mockBilling, mockMail };
}

describe("HandleBillingWebhookService", () => {
  it("should skip duplicate deliveries (Stripe retries)", async () => {
    const { service, mockSubs } = makeService({ events: { claim: jest.fn().mockResolvedValue(false) } });
    const result = await service.execute(event());
    expect(result).toEqual({ received: true, duplicate: true });
    expect(mockSubs.upsertByStripeId).not.toHaveBeenCalled();
  });

  it("should upsert subscription and plan on updated events", async () => {
    const { service, mockSubs, mockOrgs } = makeService();
    await service.execute(event());
    expect(mockSubs.upsertByStripeId).toHaveBeenCalledWith(expect.objectContaining({
      stripeSubscriptionId: "sub_123",
      organizationId: "o1",
      status: "active",
      plan: "pro",
      seats: 3,
    }));
    expect(mockOrgs.update).toHaveBeenCalledWith("o1", { plan: "pro" });
  });

  it("should resolve the org from checkout metadata and enrich via API", async () => {
    const { service, mockSubs, mockBilling } = makeService({
      orgs: { findByStripeCustomerId: jest.fn().mockResolvedValue(null) },
    });
    (mockBilling.getSubscriptionDetails as jest.Mock).mockResolvedValue({
      status: "trialing", priceId: "price_starter", seats: 1, periodEnd: 1893456000, customerId: "cus_123",
    });
    await service.execute(event({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: { subscriptionId: "sub_new", customerId: "cus_123", organizationId: "o9" },
    }));
    expect(mockSubs.upsertByStripeId).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: "o9",
      status: "trialing",
      plan: "starter",
    }));
  });

  it("should cancel and downgrade to free on deleted events", async () => {
    const { service, mockSubs, mockOrgs } = makeService();
    await service.execute(event({ id: "evt_del", type: "customer.subscription.deleted" }));
    expect(mockSubs.updateStatus).toHaveBeenCalledWith("sub_123", "canceled");
    expect(mockOrgs.update).toHaveBeenCalledWith("o1", { plan: "free" });
  });

  it("should mark past_due and notify owners on payment failure", async () => {
    const { service, mockSubs, mockNotifications, mockMail } = makeService({
      members: { listMembers: jest.fn().mockResolvedValue([{ userId: "u1", email: "owner@acme.com", role: "owner" }]) },
    });
    await service.execute(event({ id: "evt_fail", type: "invoice.payment_failed" }));
    expect(mockSubs.updateStatus).toHaveBeenCalledWith("sub_123", "past_due");
    expect(mockNotifications.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1" }));
    expect(mockMail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@acme.com" }));
  });

  it("should audit unknown events without mutating billing state", async () => {
    const { service, mockSubs, mockAudit } = makeService();
    const result = await service.execute(event({ id: "evt_x", type: "customer.created", data: {} }));
    expect(result).toEqual({ received: true });
    expect(mockSubs.upsertByStripeId).not.toHaveBeenCalled();
    expect(mockSubs.updateStatus).not.toHaveBeenCalled();
    expect(mockAudit.append).toHaveBeenCalledWith(expect.objectContaining({ action: "billing.customer.created" }));
  });
});
