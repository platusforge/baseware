import { env } from "@/env";
import { IStorageAdapter } from "../adapters";

export class S3StorageAdapter implements IStorageAdapter {
  async getUploadUrl(data: { key: string; contentType: string }) {
    const base = env.S3_ENDPOINT || "https://s3.local";
    const bucket = env.S3_BUCKET || "uploads";
    return {
      url: `${base}/${bucket}/${encodeURIComponent(data.key)}?content-type=${encodeURIComponent(data.contentType)}`,
      publicUrl: `${base}/${bucket}/${encodeURIComponent(data.key)}`,
    };
  }
}
