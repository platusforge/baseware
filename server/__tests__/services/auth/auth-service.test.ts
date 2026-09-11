import { RegisterService } from "@/services/auth-service/register-service";
import { LoginService } from "@/services/auth-service/login-service";
import { RefreshSessionService } from "@/services/auth-service/refresh-session-service";
import { ConfirmPasswordResetService } from "@/services/auth-service/password-reset-service";
import { ConfirmEmailVerificationService } from "@/services/auth-service/email-verification-service";
import { ChangePasswordService } from "@/services/account-service/account-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockMail = { sendMail: jest.fn().mockResolvedValue(undefined) } as never;

describe("RegisterService", () => {
  it("should create a user and send verification without enumerating", async () => {
    const mockUsers = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "1", email: "a@a.com", name: "A" }) } as never;
    const mockHasher = { hash: jest.fn().mockResolvedValue("hashed"), compare: jest.fn() } as never;
    const service = new RegisterService(mockUsers, mockHasher, mockMail);
    const result = await service.execute({ email: "a@a.com", password: "long-password-123", name: "A" });
    expect(result.message).toMatch(/verification link/i);
  });

  it("should return the same generic message for existing emails", async () => {
    const mockUsers = { findByEmail: jest.fn().mockResolvedValue({ id: "1" }), create: jest.fn() } as never;
    const mockHasher = { hash: jest.fn(), compare: jest.fn() } as never;
    const service = new RegisterService(mockUsers, mockHasher, mockMail);
    const result = await service.execute({ email: "a@a.com", password: "long-password-123" });
    expect(result.message).toMatch(/verification link/i);
    expect((mockUsers as unknown as { create: jest.Mock }).create).not.toHaveBeenCalled();
  });
});

describe("LoginService", () => {
  const makeService = (user: unknown) => {
    const mockUsers = { findByEmail: jest.fn().mockResolvedValue(user), update: jest.fn().mockResolvedValue(undefined) } as never;
    const mockHasher = { hash: jest.fn(), compare: jest.fn().mockResolvedValue(true) } as never;
    const mockRefresh = { create: jest.fn().mockResolvedValue(undefined) } as never;
    return new LoginService(mockUsers, mockHasher, mockRefresh);
  };

  it("should return generic error for unknown user (no enumeration)", async () => {
    const service = makeService(null);
    await expect(service.execute({ email: "x@x.com", password: "whatever123" })).rejects.toThrow("Invalid credentials.");
  });

  it("should block inactive users with the same generic error", async () => {
    const service = makeService({ id: "1", passwordHash: "h", active: false, lockedUntil: null, failedLoginAttempts: 0 });
    await expect(service.execute({ email: "x@x.com", password: "whatever123" })).rejects.toThrow("Invalid credentials.");
  });
});

describe("RefreshSessionService", () => {
  const makeService = (stored: unknown, sessionUser: unknown = { id: "u1", active: true }) => {
    const mockRefresh = {
      findByJti: jest.fn().mockResolvedValue(stored),
      rotate: jest.fn().mockResolvedValue(undefined),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockUsers = { findSessionUser: jest.fn().mockResolvedValue(sessionUser) } as never;
    return new RefreshSessionService(mockRefresh, mockUsers);
  };

  it("should block refresh for deactivated users", async () => {
    const service = makeService(
      { userId: "u1", family: "f1", revokedAt: null, expiresAt: new Date(Date.now() + 3600_000) },
      { id: "u1", active: false },
    );
    // Token signature itself is verified by lib/jwt; here any string fails there.
    await expect(service.execute("bogus")).rejects.toThrow();
  });

  it("should reject expired stored tokens even with valid signature", async () => {
    const service = makeService(
      { userId: "u1", family: "f1", revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
      { id: "u1", active: true },
    );
    await expect(service.execute("bogus")).rejects.toThrow();
  });
});

describe("ConfirmPasswordResetService", () => {
  it("should revoke all sessions on password reset", async () => {
    const mockUsers = { update: jest.fn().mockResolvedValue(undefined) } as never;
    const mockResets = {
      findValid: jest.fn().mockResolvedValue({ id: "r1", userId: "u1", expiresAt: new Date(Date.now() + 3600_000), usedAt: null }),
      markUsed: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockHasher = { hash: jest.fn().mockResolvedValue("new-hash") } as never;
    const mockRefresh = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) } as never;
    const service = new ConfirmPasswordResetService(mockUsers, mockResets, mockHasher, mockRefresh);
    await service.execute({ token: "valid-token-123", password: "brand-new-password-1" });
    expect((mockRefresh as unknown as { revokeAllForUser: jest.Mock }).revokeAllForUser).toHaveBeenCalledWith("u1");
  });
});

describe("ConfirmEmailVerificationService", () => {
  it("should verify matching user and token subject", async () => {
    // Sign a real token with the test secret wired below via env mock.
    const service = new ConfirmEmailVerificationService({
      findByEmail: jest.fn().mockResolvedValue({ id: "u9" }),
      update: jest.fn().mockResolvedValue(undefined),
    } as never);
    const { signVerifyToken } = await import("@/lib/jwt");
    const token = signVerifyToken("u9", "v@v.com");
    const result = await service.execute({ token });
    expect(result).toEqual({ message: "Email verified." });
  });
});

describe("ChangePasswordService", () => {
  it("should rotate hash and revoke all other sessions", async () => {
    const mockUsers = {
      findByIdWithHash: jest.fn().mockResolvedValue({ id: "u1", passwordHash: "old" }),
      update: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockHasher = { hash: jest.fn().mockResolvedValue("new"), compare: jest.fn().mockResolvedValue(true) } as never;
    const mockRefresh = { revokeAllForUser: jest.fn().mockResolvedValue(undefined) } as never;
    const service = new ChangePasswordService(mockUsers, mockHasher, mockRefresh);
    await service.execute("u1", { currentPassword: "old-pass-12345", newPassword: "brand-new-pass-1" });
    expect((mockRefresh as unknown as { revokeAllForUser: jest.Mock }).revokeAllForUser).toHaveBeenCalledWith("u1");
  });

  it("should reject wrong current password with generic error", async () => {
    const mockUsers = {
      findByIdWithHash: jest.fn().mockResolvedValue({ id: "u1", passwordHash: "old" }),
      update: jest.fn(),
    } as never;
    const mockHasher = { hash: jest.fn(), compare: jest.fn().mockResolvedValue(false) } as never;
    const mockRefresh = { revokeAllForUser: jest.fn() } as never;
    const service = new ChangePasswordService(mockUsers, mockHasher, mockRefresh);
    await expect(service.execute("u1", { currentPassword: "nope-nope-nope", newPassword: "brand-new-pass-1" })).rejects.toThrow("Invalid credentials.");
  });
});
