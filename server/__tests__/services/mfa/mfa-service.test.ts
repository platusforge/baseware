import { SetupMfaService, ConfirmMfaService, DisableMfaService } from "@/services/mfa-service/mfa-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("MfaService", () => {
  it("should refuse setup when already enabled", async () => {
    const mockUsers = { findById: jest.fn().mockResolvedValue({ email: "a@b.co", mfaEnabled: true }) } as never;
    const svc = new SetupMfaService(mockUsers);
    await expect(svc.execute("u1")).rejects.toThrow("MFA already enabled.");
  });

  it("should require init before confirm", async () => {
    const mockUsers = { findByIdWithHash: jest.fn().mockResolvedValue({ mfaSecret: null, mfaEnabled: false }) } as never;
    const svc = new ConfirmMfaService(mockUsers);
    await expect(svc.execute("u1", { code: "123456" })).rejects.toThrow("MFA not initialized");
  });

  it("should reject invalid confirm codes", async () => {
    const mockUsers = {
      findByIdWithHash: jest.fn().mockResolvedValue({ mfaSecret: "JBSWY3DPEHPK3PXP", mfaEnabled: false }),
      update: jest.fn(),
    } as never;
    const svc = new ConfirmMfaService(mockUsers);
    await expect(svc.execute("u1", { code: "000000" })).rejects.toThrow("Invalid code.");
  });

  it("should refuse disable when not enabled", async () => {
    const mockUsers = { findByIdWithHash: jest.fn().mockResolvedValue({ mfaSecret: null, mfaEnabled: false }) } as never;
    const mockRefresh = { revokeAllForUser: jest.fn() } as never;
    const svc = new DisableMfaService(mockUsers, mockRefresh);
    await expect(svc.execute("u1", { code: "123456" })).rejects.toThrow("MFA not enabled.");
  });
});
