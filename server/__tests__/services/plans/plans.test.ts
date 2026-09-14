import { planAllows, normalizePlan } from "@/lib/plans";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("plans", () => {
  it("should normalize unknown to free", () => {
    expect(normalizePlan("enterprise")).toBe("free");
    expect(normalizePlan(null)).toBe("free");
  });

  it("should gate audit to pro only", () => {
    expect(planAllows("free", "audit")).toBe(false);
    expect(planAllows("starter", "audit")).toBe(false);
    expect(planAllows("pro", "audit")).toBe(true);
  });

  it("should gate api-keys to starter+", () => {
    expect(planAllows("free", "api-keys")).toBe(false);
    expect(planAllows("starter", "api-keys")).toBe(true);
    expect(planAllows("pro", "api-keys")).toBe(true);
  });
});
