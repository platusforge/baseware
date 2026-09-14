import { GetPlansService } from "@/services/billing-service/get-plans-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("GetPlansService", () => {
  it("should return public plans without price ids", async () => {
    const svc = new GetPlansService();
    const plans = await svc.execute();
    expect(plans.length).toBeGreaterThanOrEqual(3);
    expect(plans[0]).toEqual(
      expect.objectContaining({ id: expect.any(String), name: expect.any(String), priceMonthly: expect.any(Number) }),
    );
    for (const p of plans as { priceId?: string }[]) {
      expect(p.priceId).toBeUndefined();
    }
  });
});
