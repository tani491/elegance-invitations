import { db } from "@/lib/db";
import { getDefaultTheme, normalizeThemeConfig } from "@/lib/theme-presets";
import { allowedPlansForCategory, normalizeAllowedPlans } from "@/lib/plan-gating";
import type { Prisma } from "@prisma/client";
import { SCROLL_ANIMATION_VALUES } from "@/types/database.types";
import type { OpeningAnimationType, ScrollAnimationType, ThemeConfig } from "@/types/database.types";

const OPENING_ANIMATION_TYPES: OpeningAnimationType[] = [
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
];

const SCROLL_ANIMATION_TYPES: readonly ScrollAnimationType[] = SCROLL_ANIMATION_VALUES;

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
  layoutStyle?: ThemeConfig["layoutStyle"] | null;
  coverVideoUrl?: string | null;
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  allowedPlans?: string[] | null;
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


export function serializeTheme(theme: SerializableThemeInput): ThemeConfig {
  if (!theme) return normalizeThemeConfig(getDefaultTheme());
  const fallback = getDefaultTheme(theme.slug ?? undefined);
  const category = theme.category ?? fallback.category;
  const openingVideoUrl = theme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? fallback.openingVideoUrl ?? null;
  const isActive = theme.isActive ?? theme.isVisible ?? fallback.isActive ?? true;

  return normalizeThemeConfig({
    id: theme.id,
    slug: theme.slug ?? fallback.slug,
    name: theme.name ?? fallback.name,
    category,
    layoutStyle: theme.layoutStyle ?? undefined,
    coverVideoUrl: theme.coverVideoUrl,
    allowedPlans: normalizeAllowedPlans(theme.allowedPlans, fallback.allowedPlans ?? allowedPlansForCategory(category)),
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
  if (!slug) return null;
  try {
    const theme = await db.theme.findUnique({ where: { slug } });
    return theme;
  } catch (error) {
    console.error("Theme lookup failed, retrying with compatible columns:", error);
    try {
      const theme = await db.theme.findUnique({ where: { slug }, select: THEME_COMPAT_SELECT });
      return theme;
    } catch (retryError) {
      console.error("Theme compatible lookup failed, returning no theme:", retryError);
      return null;
    }
  }
}
