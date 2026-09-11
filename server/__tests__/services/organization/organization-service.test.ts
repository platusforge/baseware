import { CreateOrganizationService } from "@/services/organization-service/organization-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("CreateOrganizationService", () => {
  it("should create org and assign owner", async () => {
    const mockOrgs = { create: jest.fn().mockResolvedValue({ id: "o1", slug: "acme-x" }) } as never;
    const mockMembers = { add: jest.fn().mockResolvedValue(undefined) } as never;
    const mockAudit = { append: jest.fn().mockResolvedValue(undefined) } as never;
    const service = new CreateOrganizationService(mockOrgs, mockMembers, mockAudit);
    const result = await service.execute("u1", { name: "Acme" });
    expect(mockMembers.add).toHaveBeenCalledWith({ userId: "u1", organizationId: "o1", role: "owner" });
    expect(result).toEqual({ id: "o1", slug: "acme-x" });
  });
});
