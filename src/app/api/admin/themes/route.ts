import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme } from "@/lib/theme-store";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";
import { DEFAULT_THEMES } from "@/lib/theme-presets";
import { slugify, uniqueSlug } from "@/lib/slug";

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const cssColorSchema = z.string().min(3).max(90).regex(/^(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|hsla?\([^)]+\))$/);
const scrollAnimationSchema = z.enum(["fade-up", "scale-in", "slide-stagger"]);
const openingAnimationSchema = z.enum([
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
]);

const themePayloadSchema = z.object({
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
  backdropUrl: z.string().min(1).nullable().optional(),
  titleFont: z.string().min(2).optional(),
  animationType: openingAnimationSchema.optional(),
  openingVideoUrl: z.string().min(1).nullable().optional(),
  previewGradient: z.string().min(8).optional(),
  demoVideoUrl: z.string().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
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
  slug: z.string().min(2),
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
  const bgPrimary = data.bgPrimary ?? data.primaryColor;
  const cardBg = data.cardBg ?? data.secondaryColor;
  const accentGold = data.accentGold ?? data.goldColor;

  return {
    ...data,
    ...(bgPrimary ? { bgPrimary, primaryColor: bgPrimary } : {}),
    ...(cardBg ? { cardBg, secondaryColor: cardBg } : {}),
    ...(accentGold ? { accentGold, accentColor: accentGold, goldColor: accentGold } : {}),
    ...(data.textColor ? { textColor: data.textColor } : {}),
    ...((bgPrimary || cardBg || accentGold) && !data.previewGradient
      ? { previewGradient: previewGradientFrom({ ...data, bgPrimary, cardBg, accentGold }) }
      : {}),
  };
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
    const themes = await db.theme.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(
      { success: true, data: themes.map(serializeTheme) },
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

  const parsed = themeCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Configuration de theme invalide." }, { status: 400 });
  }

  try {
    const { slug, ...payload } = parsed.data;
    const data = normalizeThemeWriteData({
      ...payload,
      primaryColor: payload.bgPrimary,
      secondaryColor: payload.cardBg,
      accentColor: payload.accentGold,
      goldColor: payload.accentGold,
      previewGradient: payload.previewGradient ?? previewGradientFrom(payload),
    });

    const created = await db.theme.create({
      data: {
        slug: await nextAvailableSlug(payload.name, slug),
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
    });

    return NextResponse.json(
      { success: true, data: serializeTheme(created) },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin theme create failed:", error);
    return NextResponse.json({ success: false, error: "Creation du modele impossible." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Configuration de theme invalide." }, { status: 400 });
  }

  try {
    const { slug, ...data } = parsed.data;
    const updated = await db.theme.update({
      where: { slug },
      data: normalizeThemeWriteData(data),
    });

    return NextResponse.json(
      { success: true, data: serializeTheme(updated) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin theme update failed:", error);
    return NextResponse.json({ success: false, error: "Theme non sauvegarde." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = themeDeleteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Modele invalide." }, { status: 400 });
  }

  try {
    if (DEFAULT_THEME_SLUGS.has(parsed.data.slug)) {
      const disabled = await db.theme.update({
        where: { slug: parsed.data.slug },
        data: { isActive: false },
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
