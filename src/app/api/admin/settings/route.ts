import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getHomepageSettings, updateHomepageSettings } from "@/lib/homepage-settings";
import { requireApiRole } from "@/lib/server-auth";
import { relaxedNullableUrlSchema } from "@/lib/url-validation";
import { AUTH_ROLES } from "@/types/database.types";

const mediaUrlSchema = relaxedNullableUrlSchema({ message: "URL media invalide." });
const demoUrlSchema = relaxedNullableUrlSchema({ allowRelative: true, message: "URL de demo invalide." });

const homepageSettingsSchema = z.object({
  heroPhone1: mediaUrlSchema,
  heroPhone2: mediaUrlSchema,
  privilegeDemoUrl: demoUrlSchema,
  imperialDemoUrl: demoUrlSchema,
  isMaintenanceMode: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const settings = await getHomepageSettings();

  return NextResponse.json(
    { success: true, data: settings },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = homepageSettingsSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Reglages d'accueil invalides.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  ) as {
    heroPhone1?: string | null;
    heroPhone2?: string | null;
    privilegeDemoUrl?: string | null;
    imperialDemoUrl?: string | null;
    isMaintenanceMode?: boolean;
  };

  try {
    const settings = Object.keys(data).length > 0
      ? await updateHomepageSettings(data)
      : await getHomepageSettings();

    return NextResponse.json(
      { success: true, data: settings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Homepage settings update failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Sauvegarde impossible." },
      { status: 500 },
    );
  }
}
