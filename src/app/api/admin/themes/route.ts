import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme, THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";
import { DEFAULT_THEMES } from "@/lib/theme-presets";
import { slugify, uniqueSlug } from "@/lib/slug";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const cssColorSchema = z.string().min(3).max(90).regex(/^(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|hsla?\([^)]+\))$/);
const scrollAnimationSchema = z.enum(["fade-up", "scale-in", "slide-stagger"]);
const nullableUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().min(1).nullable().optional(),
);
const openingAnimationSchema = z.enum([
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
]);

const themePayloadSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  primaryColor: hexColorSchema.optional(),
  secondaryColor: cssColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  goldColor: hexColorSchema.optional(),
  bgPrimary: hexColorSchema.optional(),
  cardBg: cssColorSchema.optional(),
  accentGold: hexColorSchema.optional(),
  textColor: hexColorSchema.optional(),
  scrollAnimation: scrollAnimationSchema.optional(),
  backdropUrl: nullableUrlSchema,
  titleFont: z.string().min(2).optional(),
  animationType: openingAnimationSchema.optional(),
  openingStyle: openingAnimationSchema.optional(),
  openingVideoUrl: nullableUrlSchema,
  videoUrl: nullableUrlSchema,
  previewGradient: z.string().min(8).optional(),
  demoVideoUrl: nullableUrlSchema,
  isActive: z.boolean().optional(),
  isVisible: z.boolean().optional(),
});

const themeCreateSchema = themePayloadSchema.extend({
  slug: z.string().min(2).optional(),
  name: z.string().min(2),
  category: z.string().min(2).default("Privilege"),
  bgPrimary: hexColorSchema.default("#5C1D24"),
  cardBg: cssColorSchema.default("#FAF7F2"),
  accentGold: hexColorSchema.default("#D4AF37"),
  textColor: hexColorSchema.default("#5C1D24"),
  scrollAnimation: scrollAnimationSchema.default("fade-up"),
  titleFont: z.string().min(2).default("Cormorant Garamond"),
  animationType: openingAnimationSchema.default("golden_palace_doors"),
});

const themeUpdateSchema = themePayloadSchema.extend({
  slug: z.string().min(2).optional(),
}).refine((value) => Boolean(value.id || value.slug), {
  message: "Identifiant de theme manquant.",
  path: ["slug"],
});

const themeDeleteSchema = z.object({
  slug: z.string().min(2),
});

const DEFAULT_THEME_SLUGS = new Set(DEFAULT_THEMES.map((theme) => theme.slug));

function previewGradientFrom(input: {
  bgPrimary?: string;
  cardBg?: string;
  accentGold?: string;
  primaryColor?: string;
  secondaryColor?: string;
  goldColor?: string;
}) {
  const bgPrimary = input.bgPrimary ?? input.primaryColor ?? "#5C1D24";
  const cardBg = input.cardBg ?? input.secondaryColor ?? "#FAF7F2";
  const accentGold = input.accentGold ?? input.goldColor ?? "#D4AF37";
  return `linear-gradient(135deg, ${bgPrimary} 0%, ${accentGold} 52%, ${cardBg} 100%)`;
}

function normalizeThemeWriteData(data: z.infer<typeof themePayloadSchema>) {
  const {
    id: _id,
    videoUrl,
    openingStyle,
    isVisible,
    ...payload
  } = data;
  const bgPrimary = data.bgPrimary ?? data.primaryColor;
  const cardBg = data.cardBg ?? data.secondaryColor;
  const accentGold = data.accentGold ?? data.goldColor;
  const openingVideoUrl = payload.openingVideoUrl ?? videoUrl;
  const demoVideoUrl = payload.demoVideoUrl ?? videoUrl ?? openingVideoUrl;
  const animationType = payload.animationType ?? openingStyle;
  const isActive = payload.isActive ?? isVisible;

  return {
    ...(payload.name ? { name: payload.name.trim() } : {}),
    ...(payload.category ? { category: payload.category.trim() } : {}),
    ...(bgPrimary ? { bgPrimary, primaryColor: bgPrimary } : {}),
    ...(cardBg ? { cardBg, secondaryColor: cardBg } : {}),
    ...(accentGold ? { accentGold, accentColor: accentGold, goldColor: accentGold } : {}),
    ...(payload.textColor ? { textColor: payload.textColor } : {}),
    ...(payload.scrollAnimation ? { scrollAnimation: payload.scrollAnimation } : {}),
    ...(payload.backdropUrl !== undefined ? { backdropUrl: payload.backdropUrl } : {}),
    ...(payload.titleFont ? { titleFont: payload.titleFont.trim() } : {}),
    ...(animationType ? { animationType } : {}),
    ...(openingVideoUrl !== undefined ? { openingVideoUrl } : {}),
    ...(demoVideoUrl !== undefined ? { demoVideoUrl } : {}),
    ...(payload.previewGradient ? { previewGradient: payload.previewGradient } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...((bgPrimary || cardBg || accentGold) && !payload.previewGradient
      ? { previewGradient: previewGradientFrom({ ...payload, bgPrimary, cardBg, accentGold }) }
      : {}),
  };
}

function normalizeLegacyThemeWriteData(data: z.infer<typeof themePayloadSchema>) {
  const writeData = normalizeThemeWriteData(data);
  const legacyKeys = [
    "name",
    "category",
    "primaryColor",
    "secondaryColor",
    "accentColor",
    "goldColor",
    "titleFont",
    "animationType",
    "openingVideoUrl",
    "previewGradient",
    "demoVideoUrl",
    "isActive",
  ] as const;
  const legacyData: Record<string, unknown> = {};

  for (const key of legacyKeys) {
    if (key in writeData) {
      legacyData[key] = writeData[key as keyof typeof writeData];
    }
  }

  return legacyData as Prisma.ThemeUpdateInput;
}

function themeResponseOverlay(data: z.infer<typeof themePayloadSchema>) {
  const writeData = normalizeThemeWriteData(data);
  const openingVideoUrl = "openingVideoUrl" in writeData ? writeData.openingVideoUrl : undefined;
  const demoVideoUrl = "demoVideoUrl" in writeData ? writeData.demoVideoUrl : undefined;
  const animationType = "animationType" in writeData ? writeData.animationType : undefined;
  const isActive = "isActive" in writeData ? writeData.isActive : undefined;

  return {
    ...(writeData as Partial<ReturnType<typeof serializeTheme>>),
    ...(openingVideoUrl !== undefined ? { videoUrl: openingVideoUrl } : {}),
    ...(animationType !== undefined ? { openingStyle: animationType } : {}),
    ...(isActive !== undefined ? { isVisible: isActive } : {}),
    ...(demoVideoUrl !== undefined ? { demoVideoUrl } : {}),
  };
}

function prismaErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur base de donnees";
}

async function nextAvailableSlug(name: string, requestedSlug?: string) {
  const base = slugify(requestedSlug ?? name);
  const existing = await db.theme.findUnique({ where: { slug: base }, select: { id: true } });
  return existing ? uniqueSlug(base) : base;
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  try {
    await ensureDefaultThemes();
    let themes;
    let source = "database";

    try {
      themes = await db.theme.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    } catch (error) {
      console.error("Admin themes full fetch failed, retrying with compatible columns:", error);
      themes = await db.theme.findMany({
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: THEME_COMPAT_SELECT,
      });
      source = "database-compat";
    }

    return NextResponse.json(
      { success: true, data: themes.map(serializeTheme), source },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin themes fetch failed:", error);
    return NextResponse.json(
      { success: true, data: DEFAULT_THEMES.map((theme) => serializeTheme(theme)), source: "static-fallback" },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeCreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Configuration de theme invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { slug, ...payload } = parsed.data;
    const nextSlug = await nextAvailableSlug(payload.name, slug);
    const data = normalizeThemeWriteData({
      ...payload,
      primaryColor: payload.bgPrimary,
      secondaryColor: payload.cardBg,
      accentColor: payload.accentGold,
      goldColor: payload.accentGold,
      previewGradient: payload.previewGradient ?? previewGradientFrom(payload),
    });

    let source = "database";
    let created;

    try {
      created = await db.theme.create({
        data: {
          slug: nextSlug,
          name: payload.name,
          category: payload.category,
          primaryColor: data.primaryColor ?? payload.bgPrimary,
          secondaryColor: data.secondaryColor ?? payload.cardBg,
          accentColor: data.accentColor ?? payload.accentGold,
          goldColor: data.goldColor ?? payload.accentGold,
          bgPrimary: data.bgPrimary ?? payload.bgPrimary,
          cardBg: data.cardBg ?? payload.cardBg,
          accentGold: data.accentGold ?? payload.accentGold,
          textColor: data.textColor ?? payload.textColor,
          scrollAnimation: data.scrollAnimation ?? payload.scrollAnimation,
          backdropUrl: data.backdropUrl ?? null,
          titleFont: payload.titleFont,
          animationType: payload.animationType,
          openingVideoUrl: data.openingVideoUrl ?? null,
          previewGradient: data.previewGradient ?? previewGradientFrom(payload),
          demoVideoUrl: data.demoVideoUrl ?? null,
          isActive: data.isActive ?? true,
        },
        select: THEME_COMPAT_SELECT,
      });
    } catch (error) {
      console.error("Erreur detaillee Prisma Theme Create:", error);
      source = "database-compat";
      created = await db.theme.create({
        data: {
          slug: nextSlug,
          name: payload.name,
          category: payload.category,
          primaryColor: data.primaryColor ?? payload.bgPrimary,
          secondaryColor: data.secondaryColor ?? payload.cardBg,
          accentColor: data.accentColor ?? payload.accentGold,
          goldColor: data.goldColor ?? payload.accentGold,
          titleFont: payload.titleFont,
          animationType: data.animationType ?? payload.animationType,
          openingVideoUrl: data.openingVideoUrl ?? null,
          previewGradient: data.previewGradient ?? previewGradientFrom(payload),
          demoVideoUrl: data.demoVideoUrl ?? null,
          isActive: data.isActive ?? true,
        },
        select: THEME_COMPAT_SELECT,
      });
    }

    const theme = serializeTheme({ ...created, ...themeResponseOverlay(payload) });
    return NextResponse.json(
      { success: true, data: theme, theme, source },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erreur detaillee Prisma Theme Create:", error);
    return NextResponse.json({ success: false, error: prismaErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeUpdateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Configuration de theme invalide.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, slug, ...payload } = parsed.data;
  const where = id ? { id } : { slug: slug as string };
  const data = normalizeThemeWriteData(payload);

  try {
    const updated = await db.theme.update({
      where,
      data,
      select: THEME_COMPAT_SELECT,
    });

    const theme = serializeTheme({ ...updated, ...themeResponseOverlay(payload) });
    return NextResponse.json(
      { success: true, data: theme, theme },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erreur detaillee Prisma Theme Update:", error);

    try {
      const legacyData = normalizeLegacyThemeWriteData(payload);
      const updated = await db.theme.update({
        where,
        data: legacyData,
        select: THEME_COMPAT_SELECT,
      });
      const theme = serializeTheme({ ...updated, ...themeResponseOverlay(payload) });

      return NextResponse.json(
        { success: true, data: theme, theme, source: "database-compat" },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (retryError) {
      console.error("Erreur detaillee Prisma Theme Update Legacy:", retryError);
      return NextResponse.json({ success: false, error: prismaErrorMessage(retryError) }, { status: 500 });
    }
  }
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeDeleteSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Modele invalide." }, { status: 400 });
  }

  try {
    if (DEFAULT_THEME_SLUGS.has(parsed.data.slug)) {
      const disabled = await db.theme.update({
        where: { slug: parsed.data.slug },
        data: { isActive: false },
        select: THEME_COMPAT_SELECT,
      });

      return NextResponse.json(
        { success: true, data: serializeTheme(disabled), mode: "disabled" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    await db.theme.delete({ where: { slug: parsed.data.slug } });

    return NextResponse.json(
      { success: true, data: { slug: parsed.data.slug }, mode: "deleted" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin theme delete failed:", error);
    return NextResponse.json({ success: false, error: "Suppression impossible." }, { status: 500 });
  }
}
