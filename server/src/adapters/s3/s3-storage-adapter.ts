import crypto from "crypto";
import { env } from "@/env";
import { IStorageAdapter } from "../adapters";

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Minimal SigV4 presigned PUT URL (no extra deps, no SMTP-style CVEs).
 * Fail-closed: without bucket + credentials + endpoint/region it throws
 * instead of returning a fake URL. Local dev must set S3_* or use the
 * documented MinIO override.
 */
export class S3StorageAdapter implements IStorageAdapter {
  isConfigured(): boolean {
    return Boolean(env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY);
  }

  async getUploadUrl(data: { key: string; contentType: string; contentLength?: number }) {
    if (!this.isConfigured()) {
      throw new Error("Storage not configured.");
    }
    const maxBytes = env.UPLOAD_MAX_MB * 1024 * 1024;
    if (data.contentLength !== undefined && data.contentLength > maxBytes) {
      throw new Error(`File too large. Max ${env.UPLOAD_MAX_MB}MB.`);
    }
    const bucket = env.S3_BUCKET;
    const region = env.S3_REGION || "us-east-1";
    // Path-style for S3-compatible (MinIO) endpoints, virtual-hosted otherwise.
    const endpoint = (env.S3_ENDPOINT || `https://s3.${region}.amazonaws.com`).replace(/\/$/, "");
    const isCustomEndpoint = Boolean(env.S3_ENDPOINT);
    const encodedKey = data.key.split("/").map(encodeURIComponent).join("/");
    const host = new URL(endpoint).host;
    const canonicalUri = isCustomEndpoint ? `/${bucket}/${encodedKey}` : `/${encodedKey}`;
    const urlHost = isCustomEndpoint ? `${endpoint}/${bucket}/${encodedKey}` : `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const expires = 900;

    const params: Record<string, string> = {
      "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
      "X-Amz-Credential": `${env.S3_ACCESS_KEY}/${credentialScope}`,
      "X-Amz-Date": amzDate,
      "X-Amz-Expires": String(expires),
      "X-Amz-SignedHeaders": "host",
    };
    const canonicalQuery = Object.keys(params)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join("&");
    const canonicalRequest = ["PUT", canonicalUri, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
    const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
    const kDate = hmac(`AWS4${env.S3_SECRET_KEY}`, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");
    const signature = hmac(kSigning, stringToSign).toString("hex");

    const publicBase = (env.S3_PUBLIC_BASE_URL || endpoint).replace(/\/$/, "");
    return {
      url: `${urlHost}?${canonicalQuery}&X-Amz-Signature=${signature}`,
      publicUrl: `${publicBase}/${bucket}/${encodedKey}`,
    };
  }
}
