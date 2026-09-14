import { GetInvoicesService } from "@/services/billing-service/get-invoices-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const ORG = "00000000-0000-4000-8000-000000000000";

describe("GetInvoicesService", () => {
  it("should return [] when org has no customer", async () => {
    const mockOrgs = { findById: jest.fn().mockResolvedValue({ stripeCustomerId: null }) } as never;
    const mockBilling = { listInvoices: jest.fn() } as never;
    const svc = new GetInvoicesService(mockOrgs, mockBilling);
    await expect(svc.execute({ organizationId: ORG })).resolves.toEqual([]);
  });

  it("should list invoices via adapter", async () => {
    const mockOrgs = { findById: jest.fn().mockResolvedValue({ stripeCustomerId: "cus_1" }) } as never;
    const mockBilling = { listInvoices: jest.fn().mockResolvedValue([{ id: "in_1" }]) } as never;
    const svc = new GetInvoicesService(mockOrgs, mockBilling);
    await expect(svc.execute({ organizationId: ORG })).resolves.toEqual([{ id: "in_1" }]);
  });
});
