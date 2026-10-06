ALTER TABLE "public"."Event"
ADD COLUMN "programSteps" JSONB DEFAULT '[]'::jsonb;
