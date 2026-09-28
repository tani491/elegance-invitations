-- Remove the legacy generated palette so invitations only show colors chosen by the couple.
DO $$
BEGIN
  IF to_regclass('public."Event"') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Event'
        AND column_name = 'dressCodeColors'
    )
  THEN
    UPDATE "public"."Event"
    SET "dressCodeColors" = '[]'::jsonb
    WHERE "dressCodeColors" IS NOT NULL
      AND jsonb_typeof("dressCodeColors") = 'array'
      AND jsonb_array_length("dressCodeColors") = 3
      AND "dressCodeColors" @> '[
        { "id": "ivoire", "label": "Ivoire", "color": "#FAF7F2" },
        { "id": "or", "label": "Or", "color": "#D4AF37" },
        { "id": "bordeaux", "label": "Bordeaux", "color": "#5C1D24" }
      ]'::jsonb;
  END IF;
END $$;
