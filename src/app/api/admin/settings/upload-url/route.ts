import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { HOMEPAGE_MEDIA_BUCKET, HOMEPAGE_MEDIA_FOLDER } from "@/lib/homepage-settings-shared";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const signedUploadSchema = z.object({
  filePath: z
    .string()
    .min(HOMEPAGE_MEDIA_FOLDER.length + 4)
    .max(220)
    .regex(/^[a-zA-Z0-9._/-]+$/)
    .refine((value) => value.startsWith(`${HOMEPAGE_MEDIA_FOLDER}/`), {
      message: "Dossier media d'accueil invalide.",
    }),
});

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = signedUploadSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Chemin de media invalide." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ success: false, error: "Configuration Supabase Storage manquante." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.storage
    .from(HOMEPAGE_MEDIA_BUCKET)
    .createSignedUploadUrl(parsed.data.filePath, { upsert: true });

  if (error) {
    console.error("Erreur signature upload homepage Supabase:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
