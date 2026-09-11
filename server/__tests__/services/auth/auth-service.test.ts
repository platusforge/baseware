import { RegisterService } from "@/services/auth-service/register-service";
import { LoginService } from "@/services/auth-service/login-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("RegisterService", () => {
  it("should create a user with valid input", async () => {
    const mockUsers = { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: "1", email: "a@a.com", name: "A" }) } as never;
    const mockHasher = { hash: jest.fn().mockResolvedValue("hashed"), compare: jest.fn() } as never;
    const service = new RegisterService(mockUsers, mockHasher);
    const result = await service.execute({ email: "a@a.com", password: "long-password-123", name: "A" });
    expect(result).toEqual({ id: "1", email: "a@a.com", name: "A" });
  });

  it("should reject duplicate email", async () => {
    const mockUsers = { findByEmail: jest.fn().mockResolvedValue({ id: "1" }), create: jest.fn() } as never;
    const mockHasher = { hash: jest.fn(), compare: jest.fn() } as never;
    const service = new RegisterService(mockUsers, mockHasher);
    await expect(service.execute({ email: "a@a.com", password: "long-password-123" })).rejects.toThrow("Email already in use.");
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
