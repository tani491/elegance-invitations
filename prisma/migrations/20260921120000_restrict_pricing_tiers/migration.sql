-- Collapse legacy tiers into the two official offers.
-- Guarded so the migration can be evaluated by an empty shadow database.
DO $$
BEGIN
  IF to_regclass('public."Event"') IS NOT NULL THEN
    UPDATE "public"."Event"
    SET "planType" = 'privilege'
    WHERE lower("planType") IN ('essentielle', 'essential', 'prestige');

    UPDATE "public"."Event"
    SET "planType" = 'imperiale'
    WHERE lower("planType") IN ('imperial', 'impériale', 'imperiale motion', 'impériale motion', 'imperial motion', 'imperiale_motion', 'imperial_motion', 'motion');

    ALTER TABLE "public"."Event"
    ALTER COLUMN "planType" SET DEFAULT 'privilege';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public."Theme"') IS NOT NULL THEN
    UPDATE "public"."Theme"
    SET "allowedPlans" = ARRAY_REMOVE(ARRAY[
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM unnest("allowedPlans") AS plan
          WHERE lower(plan) IN ('essentielle', 'essential', 'prestige', 'privilege', 'privilegee', 'privilegie', 'privilège')
        )
        THEN 'PRIVILEGE'
      END,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM unnest("allowedPlans") AS plan
          WHERE lower(plan) IN ('imperiale', 'imperial', 'impériale', 'imperiale motion', 'impériale motion', 'imperial motion', 'imperiale_motion', 'imperial_motion', 'motion')
        )
        THEN 'IMPERIALE'
      END
    ], NULL)
    WHERE "allowedPlans" IS NOT NULL;

    UPDATE "public"."Theme"
    SET "allowedPlans" = ARRAY['PRIVILEGE', 'IMPERIALE']::text[]
    WHERE "allowedPlans" IS NULL OR cardinality("allowedPlans") = 0;

    UPDATE "public"."Theme"
    SET "category" = 'Privilege'
    WHERE lower("category") IN ('essentielle', 'prestige');

    ALTER TABLE "public"."Theme"
    ALTER COLUMN "allowedPlans" SET DEFAULT ARRAY['PRIVILEGE', 'IMPERIALE']::text[];
  END IF;
END $$;
