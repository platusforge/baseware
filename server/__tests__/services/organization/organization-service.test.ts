import { CreateOrganizationService, InviteMemberService, AcceptInvitationService } from "@/services/organization-service/organization-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/env", () => ({
  env: {
    FRONTEND_URL: "http://localhost:5173",
    STRIPE_PRICE_STARTER: "price_starter",
    STRIPE_PRICE_PRO: "price_pro",
    TRIAL_DAYS: 14,
  },
}));

describe("CreateOrganizationService", () => {
  it("should create org and assign owner", async () => {
    const mockOrgs = {
      create: jest.fn().mockResolvedValue({ id: "o1", slug: "acme-x" }),
      update: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockMembers = { add: jest.fn().mockResolvedValue(undefined) } as never;
    const mockAudit = { append: jest.fn().mockResolvedValue(undefined) } as never;
    const service = new CreateOrganizationService(mockOrgs, mockMembers, mockAudit);
    const result = await service.execute("u1", { name: "Acme" });
    expect((mockMembers as unknown as { add: jest.Mock }).add).toHaveBeenCalledWith({ userId: "u1", organizationId: "o1", role: "owner" });
    expect(result).toMatchObject({ id: "o1", slug: "acme-x" });
  });
});

describe("InviteMemberService", () => {
  const makeService = (memberCount: number, plan = "starter") => {
    const mockInvites = { create: jest.fn().mockResolvedValue(undefined) } as never;
    const mockMembers = {
      findRole: jest.fn().mockResolvedValue("owner"),
      listMembers: jest.fn().mockResolvedValue(Array.from({ length: memberCount }, (_, i) => ({ userId: `u${i}` }))),
    } as never;
    const mockMail = { sendMail: jest.fn().mockResolvedValue(undefined) } as never;
    const mockOrgs = { findById: jest.fn().mockResolvedValue({ id: "o1", plan }) } as never;
    return new InviteMemberService(mockInvites, mockMembers, mockMail, mockOrgs);
  };

  it("should enforce plan seat limits", async () => {
    const service = makeService(5, "starter");
    await expect(service.execute("u0", "o1", { email: "n@n.com" })).rejects.toThrow(/seat limit/i);
  });

  it("should invite below the seat limit", async () => {
    const service = makeService(2, "starter");
    const result = await service.execute("u0", "o1", { email: "n@n.com" });
    expect(result).toEqual({ message: "Invitation sent." });
  });
});

describe("AcceptInvitationService", () => {
  it("should reject claimants whose email differs from the invite", async () => {
    const mockInvites = {
      findByTokenHash: jest.fn().mockResolvedValue({ id: "i1", organizationId: "o1", email: "invited@mail.com", role: "member", expiresAt: new Date(Date.now() + 3600_000), acceptedAt: null }),
    } as never;
    const mockMembers = { findRole: jest.fn() } as never;
    const mockUsers = { findById: jest.fn().mockResolvedValue({ email: "attacker@mail.com" }) } as never;
    const service = new AcceptInvitationService(mockInvites, mockMembers, mockUsers);
    await expect(service.execute({ token: "t".repeat(64), userId: "u-evil" })).rejects.toThrow(/different email/);
  });
});
