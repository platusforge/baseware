import { ExportUserDataService } from "@/services/privacy-service/export-user-data-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("ExportUserDataService", () => {
  it("should require a user id", async () => {
    const svc = new ExportUserDataService({} as never, {} as never, {} as never, {} as never, {} as never, {} as never);
    await expect(svc.execute("")).rejects.toThrow();
  });

  it("should export without key hashes", async () => {
    const mockUsers = { findById: jest.fn().mockResolvedValue({ id: "u1", email: "a@b.co" }) } as never;
    const mockOrgs = { listForUser: jest.fn().mockResolvedValue([{ id: "o1" }]) } as never;
    const mockMembers = {} as never;
    const mockKeys = { list: jest.fn().mockResolvedValue([{ id: "k1", keyHash: "secret", name: "x" }]) } as never;
    const mockNotifs = { list: jest.fn().mockResolvedValue([]) } as never;
    const mockAudit = { list: jest.fn().mockResolvedValue([]) } as never;
    const svc = new ExportUserDataService(mockUsers, mockOrgs, mockMembers, mockKeys, mockNotifs, mockAudit);
    const out = (await svc.execute("u1")) as { apiKeys: { keyHash?: string }[] };
    expect(out.apiKeys[0].keyHash).toBeUndefined();
  });
});
