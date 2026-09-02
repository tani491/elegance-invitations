import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: [
      "public.guests",
      "public.profiles",
      "public.themes",
      "public.weddings",
    ],
  },
  enums: {
    external: [
      "public.plan_tier",
      "public.rsvp_status",
      "public.user_role",
    ],
  },
});
