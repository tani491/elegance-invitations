import { S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT
  ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "";
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "") ?? "";

export const r2 = new S3Client({
  region: "auto",
  ...(endpoint ? { endpoint } : {}),
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
  },
});

export function isR2Configured() {
  return Boolean(
    endpoint
    && R2_BUCKET_NAME
    && R2_PUBLIC_URL
    && process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
    && process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  );
}

export function r2PublicUrlForKey(key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${R2_PUBLIC_URL}/${encodedKey}`;
}
