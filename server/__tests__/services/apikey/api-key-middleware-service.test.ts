import { apiKeyMiddleware, requireApiScopes } from "@/common/org-middleware";
import { sha256 } from "@/lib/crypto";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockTouch = jest.fn().mockResolvedValue(undefined);

jest.mock("@/repositories", () => ({
  apiKeyRepository: {
    findByHash: jest.fn(),
    touch: (...args: unknown[]) => mockTouch(...args),
  },
  userRepository: { findSessionUser: jest.fn() },
  organizationRepository: { findById: jest.fn() },
  membershipRepository: { findRole: jest.fn() },
}));

const { apiKeyRepository, userRepository, organizationRepository } = jest.requireMock("@/repositories") as {
  apiKeyRepository: { findByHash: jest.Mock };
  userRepository: { findSessionUser: jest.Mock };
  organizationRepository: { findById: jest.Mock };
};

function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as unknown as {
    status: jest.Mock;
    json: jest.Mock;
  };
  return res;
}

describe("apiKeyMiddleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should 401 without header", async () => {
    const req = { headers: {} } as never;
    const res = mockRes();
    await apiKeyMiddleware(req, res as never, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should set user/scopes and touch on valid key", async () => {
    const raw = "sk_test.secret-value";
    apiKeyRepository.findByHash.mockResolvedValue({
      id: "k1",
      userId: "u1",
      organizationId: "o1",
      scopes: ["members:read"],
      revokedAt: null,
      expiresAt: null,
    });
    userRepository.findSessionUser.mockResolvedValue({ id: "u1", active: true });
    organizationRepository.findById.mockResolvedValue({ id: "o1", active: true });
    const req = { headers: { "x-api-key": raw }, user: undefined } as never;
    const res = mockRes();
    const next = jest.fn();
    // findByHash receives sha256(raw) — assert wiring, not the hash value itself
    await apiKeyMiddleware(req, res as never, next);
    expect(apiKeyRepository.findByHash).toHaveBeenCalledWith(sha256(raw));
    expect(next).toHaveBeenCalled();
    expect(mockTouch).toHaveBeenCalledWith("k1");
    expect((req as { apiScopes?: string[] }).apiScopes).toEqual(["members:read"]);
  });

  it("should 401 on revoked key", async () => {
    apiKeyRepository.findByHash.mockResolvedValue({ id: "k1", revokedAt: new Date() });
    const req = { headers: { "x-api-key": "sk_x.y" } } as never;
    const res = mockRes();
    await apiKeyMiddleware(req, res as never, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe("requireApiScopes", () => {
  it("should 403 when scope missing", () => {
    const mw = requireApiScopes("audit:read");
    const req = { apiScopes: ["members:read"] } as never;
    const res = mockRes();
    mw(req, res as never, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should pass when all scopes granted", () => {
    const mw = requireApiScopes("members:read");
    const req = { apiScopes: ["members:read", "audit:read"] } as never;
    const res = mockRes();
    const next = jest.fn();
    mw(req, res as never, next);
    expect(next).toHaveBeenCalled();
  });
});
