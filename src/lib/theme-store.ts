import { db } from "@/lib/db";
import { DEFAULT_THEMES, getDefaultTheme, normalizeThemeConfig } from "@/lib/theme-presets";
import type { Prisma } from "@prisma/client";
import type { OpeningAnimationType, ScrollAnimationType, ThemeConfig } from "@/types/database.types";

const OPENING_ANIMATION_TYPES: OpeningAnimationType[] = [
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
];

const SCROLL_ANIMATION_TYPES: ScrollAnimationType[] = ["fade-up", "scale-in", "slide-stagger"];

export const THEME_COMPAT_SELECT = {
  id: true,
  slug: true,
  name: true,
  category: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  goldColor: true,
  titleFont: true,
  animationType: true,
  openingVideoUrl: true,
  previewGradient: true,
  demoVideoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ThemeSelect;

export type ThemeCompatRecord = Prisma.ThemeGetPayload<{ select: typeof THEME_COMPAT_SELECT }>;

export type SerializableThemeInput = {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  goldColor?: string | null;
  bgPrimary?: string | null;
  cardBg?: string | null;
  accentGold?: string | null;
  textColor?: string | null;
  scrollAnimation?: string | null;
  backdropUrl?: string | null;
  titleFont?: string | null;
  animationType?: string | null;
  openingStyle?: string | null;
  videoUrl?: string | null;
  openingVideoUrl?: string | null;
  previewGradient?: string | null;
  demoVideoUrl?: string | null;
  isActive?: boolean | null;
  isVisible?: boolean | null;
} | null | undefined;

function normalizeAnimationType(value: string | null | undefined): OpeningAnimationType {
  return OPENING_ANIMATION_TYPES.includes(value as OpeningAnimationType)
    ? (value as OpeningAnimationType)
    : "wax_seal_burst";
}

function normalizeScrollAnimation(value: string | null | undefined): ScrollAnimationType {
  return SCROLL_ANIMATION_TYPES.includes(value as ScrollAnimationType)
    ? (value as ScrollAnimationType)
    : "fade-up";
}

export async function ensureDefaultThemes() {
  try {
    await Promise.all(
      DEFAULT_THEMES.map((theme) =>
        db.theme.upsert({
          where: { slug: theme.slug },
          update: {
            name: theme.name,
            category: theme.category,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            accentColor: theme.accentColor,
            goldColor: theme.goldColor,
            bgPrimary: theme.bgPrimary ?? theme.primaryColor,
            cardBg: theme.cardBg ?? theme.secondaryColor,
            accentGold: theme.accentGold ?? theme.goldColor,
            textColor: theme.textColor ?? theme.primaryColor,
            scrollAnimation: normalizeScrollAnimation(theme.scrollAnimation),
            backdropUrl: theme.backdropUrl,
            titleFont: theme.titleFont,
            animationType: theme.animationType,
            openingVideoUrl: theme.openingVideoUrl,
            previewGradient: theme.previewGradient,
          },
          create: {
            slug: theme.slug,
            name: theme.name,
            category: theme.category,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            accentColor: theme.accentColor,
            goldColor: theme.goldColor,
            bgPrimary: theme.bgPrimary ?? theme.primaryColor,
            cardBg: theme.cardBg ?? theme.secondaryColor,
            accentGold: theme.accentGold ?? theme.goldColor,
            textColor: theme.textColor ?? theme.primaryColor,
            scrollAnimation: normalizeScrollAnimation(theme.scrollAnimation),
            backdropUrl: theme.backdropUrl,
            titleFont: theme.titleFont,
            animationType: theme.animationType,
            openingVideoUrl: theme.openingVideoUrl,
            previewGradient: theme.previewGradient,
            demoVideoUrl: theme.demoVideoUrl,
            isActive: theme.isActive ?? true,
          },
        }),
      ),
    );
  } catch (error) {
    console.error("Default theme sync skipped:", error);
  }
}

export function serializeTheme(theme: SerializableThemeInput): ThemeConfig {
  if (!theme) return normalizeThemeConfig(getDefaultTheme());
  const fallback = getDefaultTheme(theme.slug ?? undefined);
  const openingVideoUrl = theme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? fallback.openingVideoUrl ?? null;
  const isActive = theme.isActive ?? theme.isVisible ?? fallback.isActive ?? true;

  return normalizeThemeConfig({
    id: theme.id,
    slug: theme.slug ?? fallback.slug,
    name: theme.name ?? fallback.name,
    category: theme.category ?? fallback.category,
    primaryColor: theme.primaryColor ?? theme.bgPrimary ?? fallback.primaryColor,
    secondaryColor: theme.secondaryColor ?? theme.cardBg ?? fallback.secondaryColor,
    accentColor: theme.accentColor ?? theme.accentGold ?? fallback.accentColor,
    goldColor: theme.goldColor ?? theme.accentGold ?? fallback.goldColor,
    bgPrimary: theme.bgPrimary ?? theme.primaryColor ?? fallback.bgPrimary,
    cardBg: theme.cardBg ?? theme.secondaryColor ?? fallback.cardBg,
    accentGold: theme.accentGold ?? theme.goldColor ?? fallback.accentGold,
    textColor: theme.textColor ?? theme.primaryColor ?? fallback.textColor,
    scrollAnimation: normalizeScrollAnimation(theme.scrollAnimation ?? fallback.scrollAnimation),
    backdropUrl: theme.backdropUrl ?? fallback.backdropUrl,
    titleFont: theme.titleFont ?? fallback.titleFont,
    animationType: normalizeAnimationType(theme.animationType ?? theme.openingStyle ?? fallback.animationType),
    openingStyle: normalizeAnimationType(theme.openingStyle ?? theme.animationType ?? fallback.animationType),
    videoUrl: openingVideoUrl,
    openingVideoUrl,
    previewGradient: theme.previewGradient ?? fallback.previewGradient,
    demoVideoUrl: theme.demoVideoUrl ?? openingVideoUrl,
    isActive,
    isVisible: theme.isVisible ?? isActive,
  });
}

export async function getThemeOrDefault(slug?: string | null) {
  await ensureDefaultThemes();
  const fallback = getDefaultTheme(slug ?? undefined);
  try {
    const theme = await db.theme.findUnique({ where: { slug: slug ?? fallback.slug } });
    return theme ?? (await db.theme.findUnique({ where: { slug: fallback.slug } }));
  } catch (error) {
    console.error("Theme lookup failed, retrying with compatible columns:", error);
    try {
      const theme = await db.theme.findUnique({ where: { slug: slug ?? fallback.slug }, select: THEME_COMPAT_SELECT });
      return theme ?? (await db.theme.findUnique({ where: { slug: fallback.slug }, select: THEME_COMPAT_SELECT }));
    } catch (retryError) {
      console.error("Theme compatible lookup failed, using static fallback:", retryError);
      return null;
    }
  }
}
