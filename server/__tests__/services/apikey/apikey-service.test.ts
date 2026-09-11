import { CreateApiKeyService } from "@/services/apikey-service/apikey-service";
import { GetPermissionsService } from "@/services/permission-service/get-permissions-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("CreateApiKeyService", () => {
  const makeService = (role: string | null) => {
    const mockKeys = { create: jest.fn().mockResolvedValue({ id: "k1" }) } as never;
    const mockAudit = { append: jest.fn().mockResolvedValue(undefined) } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue(role) } as never;
    return new CreateApiKeyService(mockKeys, mockAudit, mockMembers);
  };

  it("should refuse org-scoped keys for non-members", async () => {
    const service = makeService(null);
    await expect(service.execute("u1", { name: "ci", organizationId: "00000000-0000-4000-8000-000000000000" })).rejects.toThrow("Forbidden");
  });

  it("should refuse org-scoped keys for plain members", async () => {
    const service = makeService("member");
    await expect(service.execute("u1", { name: "ci", organizationId: "00000000-0000-4000-8000-000000000000" })).rejects.toThrow("Forbidden");
  });

  it("should allow personal keys without an org", async () => {
    const service = makeService(null);
    const result = await service.execute("u1", { name: "personal" });
    expect(result.prefix.startsWith("sk_")).toBe(true);
  });
});

describe("GetPermissionsService", () => {
  it("should return resolved permissions", async () => {
    const mockPerms = { resolve: jest.fn().mockResolvedValue({ isAdmin: false, allowedPages: ["billing"], configured: true }) } as never;
    const service = new GetPermissionsService(mockPerms);
    await expect(service.execute("u1")).resolves.toEqual({ isAdmin: false, allowedPages: ["billing"], configured: true });
  });

  it("should require a user id", async () => {
    const service = new GetPermissionsService({ resolve: jest.fn() } as never);
    await expect(service.execute("")).rejects.toThrow("Missing credentials.");
  });
});
