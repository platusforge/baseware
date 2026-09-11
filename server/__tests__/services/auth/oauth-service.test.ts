import { StartOAuthService } from "@/services/auth-service/start-oauth-service";
import { HandleOAuthCallbackService } from "@/services/auth-service/handle-oauth-callback-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/env", () => ({
  env: {
    JWT_SECRET: "test-secret-min-32-chars-long-123456",
    JWT_ISSUER: "test",
    JWT_AUDIENCE: "test-web",
    ACCESS_TOKEN_TTL: "15m",
    REFRESH_TOKEN_TTL: "7d",
    FRONTEND_URL: "http://localhost:5173",
    API_PUBLIC_URL: "http://localhost:3000",
  },
}));

const makeAdapters = (overrides = {}) => ({
  google: {
    provider: "google",
    isConfigured: jest.fn().mockReturnValue(true),
    getAuthorizationUrl: jest.fn().mockReturnValue("https://accounts.google.com/o/oauth2/auth?x=1"),
    exchangeCode: jest.fn().mockResolvedValue({
      providerId: "google-123",
      email: "oauth@example.com",
      emailVerified: true,
      name: "OAuth User",
    }),
    ...overrides,
  },
});

const baseInput = {
  provider: "google",
  code: "auth-code",
  queryState: "same-state",
  storedState: "same-state",
  codeVerifier: "v".repeat(64),
};

describe("StartOAuthService", () => {
  it("should return authorization url with state and verifier", async () => {
    const service = new StartOAuthService(makeAdapters() as never);
    const result = await service.execute({ provider: "google" });
    expect(result.url).toContain("accounts.google.com");
    expect(result.state).toHaveLength(64);
    expect(result.codeVerifier).toBeTruthy();
    expect(result.redirectUri).toContain("/auth/oauth/google/callback");
  });

  it("should reject unknown providers", async () => {
    const service = new StartOAuthService(makeAdapters() as never);
    await expect(service.execute({ provider: "apple" })).rejects.toThrow();
  });

  it("should fail closed when provider is not configured", async () => {
    const service = new StartOAuthService(makeAdapters({ isConfigured: () => false }) as never);
    await expect(service.execute({ provider: "google" })).rejects.toThrow("OAuth provider not configured.");
  });
});

describe("HandleOAuthCallbackService", () => {
  const makeService = (repos: Record<string, unknown> = {}, adapters = makeAdapters()) => {
    const mockOAuth = { findByProvider: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue(undefined), ...(repos.oauth as object ?? {}) };
    const mockUsers = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: "u1", email: "oauth@example.com" }),
      update: jest.fn().mockResolvedValue(undefined),
      ...(repos.users as object ?? {}),
    };
    const mockOrgs = { create: jest.fn().mockResolvedValue({ id: "o1" }), ...(repos.orgs as object ?? {}) };
    const mockMembers = { add: jest.fn().mockResolvedValue(undefined) };
    const mockRefresh = { create: jest.fn().mockResolvedValue(undefined) };
    const mockAudit = { append: jest.fn().mockResolvedValue(undefined) };
    const service = new HandleOAuthCallbackService(
      adapters as never, mockOAuth as never, mockUsers as never, mockOrgs as never,
      mockMembers as never, mockRefresh as never, mockAudit as never,
    );
    return { service, mockOAuth, mockUsers, mockOrgs, mockMembers, mockRefresh, mockAudit };
  };

  it("should reject mismatched state (CSRF)", async () => {
    const { service } = makeService();
    await expect(service.execute({ ...baseInput, queryState: "attacker" })).rejects.toThrow("Invalid OAuth state.");
  });

  it("should create user + oauth account + workspace on first login", async () => {
    const { service, mockUsers, mockOAuth, mockOrgs, mockMembers, mockRefresh } = makeService();
    const result = await service.execute(baseInput);
    expect(mockUsers.create).toHaveBeenCalledWith(expect.objectContaining({ email: "oauth@example.com" }));
    expect(mockOAuth.create).toHaveBeenCalledWith(expect.objectContaining({ provider: "google", providerId: "google-123" }));
    expect(mockOrgs.create).toHaveBeenCalled();
    expect(mockMembers.add).toHaveBeenCalledWith({ userId: "u1", organizationId: "o1", role: "owner" });
    expect(mockRefresh.create).toHaveBeenCalled();
    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toBeTruthy();
  });

  it("should log in through an existing linked account", async () => {
    const { service, mockUsers, mockOrgs } = makeService({
      oauth: { findByProvider: jest.fn().mockResolvedValue({ id: "a1", userId: "u9" }) },
    });
    (mockUsers.findById as jest.Mock).mockResolvedValue({ id: "u9", active: true });
    const result = await service.execute(baseInput);
    expect(mockUsers.create).not.toHaveBeenCalled();
    expect(mockOrgs.create).not.toHaveBeenCalled();
    expect(result.isNewUser).toBe(false);
  });

  it("should link a verified email to an existing password account", async () => {
    const { service, mockOAuth, mockUsers } = makeService({
      users: { findByEmail: jest.fn().mockResolvedValue({ id: "u2", active: true, emailVerifiedAt: null }) },
    });
    await service.execute(baseInput);
    expect(mockOAuth.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "u2" }));
  });

  it("should refuse to link when the provider email is unverified (no takeover)", async () => {
    const adapters = makeAdapters({
      exchangeCode: jest.fn().mockResolvedValue({ providerId: "g-1", email: "victim@example.com", emailVerified: false }),
    });
    const { service, mockOAuth } = makeService({
      users: { findByEmail: jest.fn().mockResolvedValue({ id: "u3", active: true, emailVerifiedAt: new Date() }) },
    }, adapters);
    await expect(service.execute(baseInput)).rejects.toThrow("already exists");
    expect(mockOAuth.create).not.toHaveBeenCalled();
  });

  it("should block inactive users with a generic error", async () => {
    const { service } = makeService({
      oauth: { findByProvider: jest.fn().mockResolvedValue({ id: "a1", userId: "u4" }) },
      users: { findById: jest.fn().mockResolvedValue({ id: "u4", active: false }) },
    });
    await expect(service.execute(baseInput)).rejects.toThrow("Invalid credentials.");
  });
});
