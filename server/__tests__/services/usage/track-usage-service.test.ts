import { TrackUsageService } from "@/services/usage-service/track-usage-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("TrackUsageService", () => {
  it("should refuse non-members", async () => {
    const mockUsage = { track: jest.fn() } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue(null) } as never;
    const svc = new TrackUsageService(mockUsage, mockMembers);
    await expect(
      svc.execute("u1", { organizationId: "00000000-0000-4000-8000-000000000000", metric: "jobs", quantity: 2 }),
    ).rejects.toThrow("Forbidden");
  });

  it("should reject invalid metrics", async () => {
    const mockUsage = { track: jest.fn() } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue("owner") } as never;
    const svc = new TrackUsageService(mockUsage, mockMembers);
    await expect(
      svc.execute("u1", { organizationId: "00000000-0000-4000-8000-000000000000", metric: "bad metric!", quantity: 1 }),
    ).rejects.toThrow();
  });

  it("should track for members", async () => {
    const mockUsage = { track: jest.fn().mockResolvedValue(undefined) } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue("admin") } as never;
    const svc = new TrackUsageService(mockUsage, mockMembers);
    await expect(
      svc.execute("u1", { organizationId: "00000000-0000-4000-8000-000000000000", metric: "jobs", quantity: 3 }),
    ).resolves.toEqual({ tracked: true });
  });
});
