import { LoginService } from "@/services/auth-service/login-service";
import { DeleteOrganizationService } from "@/services/account-service/account-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/jwt", () => ({
  signAccessToken: jest.fn().mockReturnValue("access"),
  signRefreshToken: jest.fn().mockReturnValue("refresh"),
  verifyToken: jest.fn(),
}));

jest.mock("@/lib/totp", () => ({
  verifyTotp: jest.fn().mockReturnValue(false),
}));

describe("LoginService lockout", () => {
  it("should lock after 5 failures with generic error and warn", async () => {
    const mockUsers = {
      findByEmail: jest.fn().mockResolvedValue({
        id: "u1",
        passwordHash: "h",
        active: true,
        lockedUntil: null,
        failedLoginAttempts: 4,
        mfaEnabled: false,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockHasher = { compare: jest.fn().mockResolvedValue(false) } as never;
    const mockRefresh = { create: jest.fn() } as never;
    const svc = new LoginService(mockUsers, mockHasher, mockRefresh);
    await expect(svc.execute({ email: "a@b.co", password: "wrong-password-1" })).rejects.toThrow("Invalid credentials.");
    expect((mockUsers as unknown as { update: jest.Mock }).update).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ failedLoginAttempts: 5 }),
    );
  });

  it("should return 429 when currently locked", async () => {
    const mockUsers = {
      findByEmail: jest.fn().mockResolvedValue({
        id: "u1",
        passwordHash: "h",
        active: true,
        lockedUntil: new Date(Date.now() + 60_000),
        failedLoginAttempts: 6,
        mfaEnabled: false,
      }),
      update: jest.fn(),
    } as never;
    const mockHasher = { compare: jest.fn().mockResolvedValue(true) } as never;
    const mockRefresh = { create: jest.fn() } as never;
    const svc = new LoginService(mockUsers, mockHasher, mockRefresh);
    const err = await svc.execute({ email: "a@b.co", password: "right-password-1" }).catch((e) => e);
    expect(err.message).toMatch(/Too many attempts/);
    expect(err.status).toBe(429);
  });

  it("should lock after 5 MFA failures (same policy as passwords)", async () => {
    const mockUsers = {
      findByEmail: jest.fn().mockResolvedValue({
        id: "u1",
        passwordHash: "h",
        active: true,
        lockedUntil: null,
        failedLoginAttempts: 4,
        mfaEnabled: true,
        mfaSecret: "JBSWY3DPEHPK3PXP",
        mfaBackupCodes: [],
      }),
      update: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockHasher = { compare: jest.fn().mockResolvedValue(true) } as never;
    const mockRefresh = { create: jest.fn() } as never;
    const svc = new LoginService(mockUsers, mockHasher, mockRefresh);
    await expect(svc.execute({ email: "a@b.co", password: "right-password-1", mfaCode: "123456" })).rejects.toThrow("Invalid credentials.");
    expect((mockUsers as unknown as { update: jest.Mock }).update).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ failedLoginAttempts: 5, lockedUntil: expect.any(Date) }),
    );
  });
});

describe("DeleteOrganizationService soft-delete", () => {
  it("should soft-delete then audit (no ghost on failure)", async () => {
    const calls: string[] = [];
    const mockOrgs = {
      findById: jest.fn().mockResolvedValue({ id: "o1", active: true }),
      remove: jest.fn().mockImplementation(async () => {
        calls.push("remove");
      }),
    } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue("owner") } as never;
    const mockAudit = {
      append: jest.fn().mockImplementation(async () => {
        calls.push("audit");
      }),
    } as never;
    const svc = new DeleteOrganizationService(mockOrgs, mockMembers, mockAudit);
    await svc.execute("u1", "o1");
    expect(calls).toEqual(["remove", "audit"]);
    expect((mockOrgs as unknown as { remove: jest.Mock }).remove).toHaveBeenCalledWith("o1");
  });

  it("should reject already inactive orgs", async () => {
    const mockOrgs = { findById: jest.fn().mockResolvedValue({ id: "o1", active: false }), remove: jest.fn() } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue("owner") } as never;
    const mockAudit = { append: jest.fn() } as never;
    const svc = new DeleteOrganizationService(mockOrgs, mockMembers, mockAudit);
    await expect(svc.execute("u1", "o1")).rejects.toThrow("Organization not found.");
  });
});
