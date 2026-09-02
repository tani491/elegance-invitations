import { db } from "@/lib/db";
import { DEFAULT_THEMES, getDefaultTheme } from "@/lib/theme-presets";
import type { Theme } from "@prisma/client";
import type { OpeningAnimationType, ThemeConfig } from "@/types/database.types";

const OPENING_ANIMATION_TYPES: OpeningAnimationType[] = [
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
];

function normalizeAnimationType(value: string): OpeningAnimationType {
  return OPENING_ANIMATION_TYPES.includes(value as OpeningAnimationType)
    ? (value as OpeningAnimationType)
    : "wax_seal_burst";
}

export async function ensureDefaultThemes() {
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
}

export function serializeTheme(theme: Theme | ThemeConfig | null | undefined): ThemeConfig {
  if (!theme) return getDefaultTheme();

  return {
    slug: theme.slug,
    name: theme.name,
    category: theme.category,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    accentColor: theme.accentColor,
    goldColor: theme.goldColor,
    titleFont: theme.titleFont,
    animationType: normalizeAnimationType(theme.animationType),
    openingVideoUrl: theme.openingVideoUrl ?? theme.demoVideoUrl,
    previewGradient: theme.previewGradient,
    demoVideoUrl: theme.demoVideoUrl,
    isActive: theme.isActive,
  };
}

export async function getThemeOrDefault(slug?: string | null) {
  await ensureDefaultThemes();
  const fallback = getDefaultTheme(slug ?? undefined);
  const theme = await db.theme.findUnique({ where: { slug: slug ?? fallback.slug } });
  return theme ?? (await db.theme.findUnique({ where: { slug: fallback.slug } }));
}
