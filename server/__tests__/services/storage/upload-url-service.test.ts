import { GetUploadUrlService } from "@/services/storage-service/get-upload-url-service";

jest.mock("@/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

describe("GetUploadUrlService", () => {
  const make = (role: unknown) => {
    const mockStorage = { getUploadUrl: jest.fn().mockResolvedValue({ url: "https://s3/put", publicUrl: "https://s3/pub" }) } as never;
    const mockMembers = { findRole: jest.fn().mockResolvedValue(role) } as never;
    return { svc: new GetUploadUrlService(mockStorage, mockMembers), mockStorage: mockStorage as unknown as { getUploadUrl: jest.Mock } };
  };

  it("should refuse non-members", async () => {
    const { svc } = make(null);
    await expect(
      svc.execute("u1", { organizationId: "00000000-0000-4000-8000-000000000000", fileName: "a.png", contentType: "image/png" }),
    ).rejects.toThrow("Forbidden");
  });

  it("should refuse disallowed content types", async () => {
    const { svc } = make("owner");
    await expect(
      svc.execute("u1", { organizationId: "00000000-0000-4000-8000-000000000000", fileName: "evil.exe", contentType: "application/x-msdownload" }),
    ).rejects.toThrow("Content type not allowed.");
  });

  it("should scope keys to the org and sanitize names", async () => {
    const { svc, mockStorage } = make("member");
    const out = (await svc.execute("u1", {
      organizationId: "00000000-0000-4000-8000-000000000000",
      fileName: "My Avatar.PNG",
      contentType: "image/png",
    })) as { key: string };
    expect(out.key.startsWith("orgs/00000000-0000-4000-8000-000000000000/")).toBe(true);
    expect(mockStorage.getUploadUrl).toHaveBeenCalled();
  });
});
