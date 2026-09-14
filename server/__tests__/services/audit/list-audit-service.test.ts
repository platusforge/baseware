import { ListAuditService } from "@/services/audit-service/list-audit-service";
import { MarkNotificationReadService } from "@/services/notification-service/mark-notification-read-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("ListAuditService", () => {
  it("should list audit rows", async () => {
    const mockAudit = { list: jest.fn().mockResolvedValue([{ action: "org.created" }]) } as never;
    const svc = new ListAuditService(mockAudit);
    await expect(svc.execute({ organizationId: "00000000-0000-4000-8000-000000000000" })).resolves.toEqual([
      { action: "org.created" },
    ]);
  });
});

describe("MarkNotificationReadService", () => {
  it("should mark read", async () => {
    const mockNotifs = { markRead: jest.fn().mockResolvedValue(undefined) } as never;
    const svc = new MarkNotificationReadService(mockNotifs);
    await expect(svc.execute("u1", { id: "n1" })).resolves.toEqual({ read: true });
  });

  it("should require user", async () => {
    const svc = new MarkNotificationReadService({ markRead: jest.fn() } as never);
    await expect(svc.execute("", { id: "n1" })).rejects.toThrow("Missing credentials.");
  });
});
