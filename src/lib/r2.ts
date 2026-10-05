import { S3Client } from "@aws-sdk/client-s3";

const accountId = cleanEnv(process.env.CLOUDFLARE_R2_ACCOUNT_ID);
const endpoint = normalizeR2Endpoint(cleanEnv(process.env.CLOUDFLARE_R2_ENDPOINT), accountId);
const accessKeyId = cleanEnv(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID);
const secretAccessKey = cleanEnv(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY);

export const R2_BUCKET_NAME = cleanEnv(process.env.CLOUDFLARE_R2_BUCKET_NAME);
export const R2_PUBLIC_URL = firstCleanEnv([
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  process.env.CLOUDFLARE_R2_PUBLIC_URL,
  process.env.R2_PUBLIC_URL,
]).replace(/\/+$/, "");

export const r2 = new S3Client({
  region: "auto",
  ...(endpoint ? { endpoint } : {}),
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
});

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function firstCleanEnv(values: Array<string | undefined>) {
  return values.map(cleanEnv).find(Boolean) ?? "";
}

function normalizeR2Endpoint(explicitEndpoint: string, account: string) {
  if (explicitEndpoint) return explicitEndpoint.replace(/\/+$/, "");
  if (!account) return "";
  if (/^https?:\/\//i.test(account)) return account.replace(/\/+$/, "");
  return `https://${account}.r2.cloudflarestorage.com`;
}

export function getR2ConfigurationStatus() {
  const missing = [
    ["CLOUDFLARE_R2_ACCOUNT_ID", endpoint],
    ["CLOUDFLARE_R2_ACCESS_KEY_ID", accessKeyId],
    ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["CLOUDFLARE_R2_BUCKET_NAME", R2_BUCKET_NAME],
    ["R2_PUBLIC_URL (NEXT_PUBLIC_R2_PUBLIC_URL, CLOUDFLARE_R2_PUBLIC_URL ou R2_PUBLIC_URL)", R2_PUBLIC_URL],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export function isR2Configured() {
  return getR2ConfigurationStatus().configured;
}

export function r2PublicUrlForKey(key: string) {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${R2_PUBLIC_URL}/${encodedKey}`;
}
