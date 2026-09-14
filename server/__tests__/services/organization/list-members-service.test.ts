import { ListMembersService } from "@/services/organization-service/list-members-service";
import { ListOrganizationsService } from "@/services/organization-service/list-organizations-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("ListMembersService", () => {
  it("should list members for an org", async () => {
    const mockMembers = { listMembers: jest.fn().mockResolvedValue([{ userId: "u1" }]) } as never;
    const svc = new ListMembersService(mockMembers);
    await expect(
      svc.execute({ organizationId: "00000000-0000-4000-8000-000000000000" }),
    ).resolves.toEqual([{ userId: "u1" }]);
  });

  it("should reject missing org", async () => {
    const svc = new ListMembersService({ listMembers: jest.fn() } as never);
    await expect(svc.execute({})).rejects.toThrow();
  });
});

describe("ListOrganizationsService", () => {
  it("should list orgs for a user", async () => {
    const mockOrgs = { listForUser: jest.fn().mockResolvedValue([{ id: "o1" }]) } as never;
    const svc = new ListOrganizationsService(mockOrgs);
    await expect(svc.execute("u1")).resolves.toEqual([{ id: "o1" }]);
  });

  it("should require a user id", async () => {
    const svc = new ListOrganizationsService({ listForUser: jest.fn() } as never);
    await expect(svc.execute("")).rejects.toThrow("Missing credentials.");
  });
});
