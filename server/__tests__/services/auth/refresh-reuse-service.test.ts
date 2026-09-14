import { RefreshSessionService } from "@/services/auth-service/refresh-session-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { verifyToken } = jest.requireMock("@/lib/jwt") as { verifyToken: jest.Mock };

jest.mock("@/lib/jwt", () => ({
  signAccessToken: jest.fn().mockReturnValue("access-new"),
  signRefreshToken: jest.fn().mockReturnValue("refresh-new"),
  verifyToken: jest.fn(),
}));

describe("RefreshSessionService reuse", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should revoke family when a revoked jti is replayed", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "u1", jti: "old-jti" });
    const mockRefresh = {
      findByJti: jest.fn().mockResolvedValue({ userId: "u1", family: "f1", revokedAt: new Date(), expiresAt: new Date(Date.now() + 1000) }),
      revokeFamily: jest.fn().mockResolvedValue(undefined),
      rotate: jest.fn(),
    } as never;
    const mockUsers = { findSessionUser: jest.fn().mockResolvedValue({ id: "u1", active: true }) } as never;
    const svc = new RefreshSessionService(mockRefresh, mockUsers);
    await expect(svc.execute("replayed-token")).rejects.toThrow("Invalid refresh token.");
    expect((mockRefresh as unknown as { revokeFamily: jest.Mock }).revokeFamily).toHaveBeenCalledWith("f1");
  });

  it("should rotate on valid token", async () => {
    (verifyToken as jest.Mock).mockReturnValue({ sub: "u1", jti: "good-jti" });
    const mockRefresh = {
      findByJti: jest.fn().mockResolvedValue({ userId: "u1", family: "f1", revokedAt: null, expiresAt: new Date(Date.now() + 10000) }),
      revokeFamily: jest.fn(),
      rotate: jest.fn().mockResolvedValue(undefined),
    } as never;
    const mockUsers = { findSessionUser: jest.fn().mockResolvedValue({ id: "u1", active: true }) } as never;
    const svc = new RefreshSessionService(mockRefresh, mockUsers);
    const out = await svc.execute("good-token");
    expect(out.accessToken).toBe("access-new");
    expect((mockRefresh as unknown as { rotate: jest.Mock }).rotate).toHaveBeenCalled();
  });
});
