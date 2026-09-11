import type { NextRequest } from "next/server";

type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __eleganceRateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.__eleganceRateLimitBuckets ?? new Map<string, Bucket>();
globalForRateLimit.__eleganceRateLimitBuckets = buckets;

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function cleanupExpiredBuckets(now: number) {
  if (buckets.size < 1_000) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(request: NextRequest, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const id = `${rule.key}:${clientIp(request)}`;
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + rule.windowMs });
    return {
      limited: false,
      limit: rule.limit,
      remaining: Math.max(rule.limit - 1, 0),
      resetAt: now + rule.windowMs,
      retryAfterSeconds: 0,
    };
  }

  bucket.count += 1;
  const remaining = Math.max(rule.limit - bucket.count, 0);
  const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt - now) / 1_000), 1);

  return {
    limited: bucket.count > rule.limit,
    limit: rule.limit,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds,
  };
}
