import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databaseUrlNeedsPoolingWarning() {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl || process.env.VERCEL !== "1") return false;

  const usesSupabasePooler = databaseUrl.includes(".pooler.supabase.com:6543");
  const disablesPreparedStatements = databaseUrl.includes("pgbouncer=true");
  return !(usesSupabasePooler || disablesPreparedStatements);
}

if (databaseUrlNeedsPoolingWarning()) {
  console.warn(
    "DATABASE_URL should use the Supabase transaction pooler (:6543) or pgbouncer=true on Vercel/serverless to avoid exhausting Postgres connections.",
  );
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = db;
