import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme } from "@/lib/theme-store";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const themeUpdateSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  goldColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  titleFont: z.string().min(2).optional(),
  animationType: z.string().min(2).optional(),
  openingVideoUrl: z.string().min(1).nullable().optional(),
  previewGradient: z.string().min(8).optional(),
  demoVideoUrl: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  await ensureDefaultThemes();
  const themes = await db.theme.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    { success: true, data: themes.map(serializeTheme) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Configuration de theme invalide." }, { status: 400 });
  }

  const { slug, ...data } = parsed.data;
  const updated = await db.theme.update({
    where: { slug },
    data,
  });

  return NextResponse.json(
    { success: true, data: serializeTheme(updated) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
