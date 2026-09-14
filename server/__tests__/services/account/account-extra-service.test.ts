import { GetProfileService } from "@/services/account-service/get-profile-service";
import { ListSessionsService, RevokeSessionService } from "@/services/account-service/list-sessions-service";
import { LogoutService } from "@/services/auth-service/logout-service";
import { ListUsersService } from "@/services/admin-service/list-users-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("GetProfileService", () => {
  it("should return user with permissions", async () => {
    const mockUsers = { findById: jest.fn().mockResolvedValue({ id: "u1", email: "a@b.co" }) } as never;
    const mockPerms = { resolve: jest.fn().mockResolvedValue({ isAdmin: false }) } as never;
    const svc = new GetProfileService(mockUsers, mockPerms);
    const out = (await svc.execute("u1")) as { email: string };
    expect(out.email).toBe("a@b.co");
  });

  it("should 404 when missing", async () => {
    const svc = new GetProfileService({ findById: jest.fn().mockResolvedValue(null) } as never, {
      resolve: jest.fn(),
    } as never);
    await expect(svc.execute("u1")).rejects.toThrow("Not found");
  });
});

describe("ListSessionsService", () => {
  it("should map sessions", async () => {
    const mockRefresh = {
      listForUser: jest.fn().mockResolvedValue([{ id: "s1", createdAt: 1, expiresAt: 2, revokedAt: null }]),
    } as never;
    const svc = new ListSessionsService(mockRefresh);
    await expect(svc.execute("u1")).resolves.toEqual([{ id: "s1", createdAt: 1, expiresAt: 2, revokedAt: null }]);
  });
});

describe("RevokeSessionService", () => {
  it("should revoke", async () => {
    const mockRefresh = { revokeOne: jest.fn().mockResolvedValue(undefined) } as never;
    const svc = new RevokeSessionService(mockRefresh);
    await expect(svc.execute("u1", { id: "s1" })).resolves.toEqual({ revoked: true });
  });
});

describe("LogoutService", () => {
  it("should succeed even without token", async () => {
    const svc = new LogoutService({ revokeJti: jest.fn() } as never);
    await expect(svc.execute(undefined)).resolves.toEqual({ message: "Logged out." });
  });
});

describe("ListUsersService", () => {
  it("should return items and total", async () => {
    const mockUsers = {
      list: jest.fn().mockResolvedValue([{ id: "u1" }]),
      count: jest.fn().mockResolvedValue(1),
    } as never;
    const svc = new ListUsersService(mockUsers);
    await expect(svc.execute({ take: 20, skip: 0 })).resolves.toEqual({ items: [{ id: "u1" }], total: 1 });
  });
});
