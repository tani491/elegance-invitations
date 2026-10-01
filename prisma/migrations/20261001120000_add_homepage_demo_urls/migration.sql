ALTER TABLE "public"."SiteSettings"
  ADD COLUMN IF NOT EXISTS "privilegeDemoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "imperialDemoUrl" TEXT;
