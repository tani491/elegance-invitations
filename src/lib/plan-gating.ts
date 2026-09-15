import type { PlanTier } from "@/types/wedding";
import type { ThemeConfig } from "@/types/database.types";

export const PLAN_LABELS: Record<PlanTier, string> = {
  essentielle: "Essentielle",
  prestige: "Formule Prestige",
  privilege: "Formule Privilège",
  imperiale: "Formule Impériale — Cinématique Motion",
};

export const PLAN_ORDER: Record<PlanTier, number> = {
  essentielle: 1,
  prestige: 2,
  privilege: 3,
  imperiale: 4,
};

export const PLAN_PHOTO_LIMITS: Record<PlanTier, number> = {
  essentielle: 1,
  prestige: 2,
  privilege: 3,
  imperiale: 5,
};

export const THEME_PLAN_REQUIREMENTS: Record<string, PlanTier> = {
  "enveloppe-de-cire": "essentielle",
  "ivoire-minimal": "essentielle",
  "roseraie-nude": "essentielle",
  "roseraie-boheme": "prestige",
  "rideau-de-theatre": "prestige",
  "ruban-de-soie": "prestige",
  "fleur-ficelle-botanique": "prestige",
  "medina-orientale": "privilege",
  "portes-royales-dorees": "privilege",
  "defile-scenique": "privilege",
  "emeraude-or-imperial": "privilege",
};

export function normalizePlan(plan?: string | null): PlanTier {
  const normalized = plan?.trim().toLowerCase();

  if (normalized === "motion") return "imperiale";

  return normalized === "imperiale" || normalized === "privilege" || normalized === "prestige" || normalized === "essentielle"
    ? normalized
    : "essentielle";
}

export function planLabelForPlan(plan: string | null | undefined) {
  return PLAN_LABELS[normalizePlan(plan)];
}

export function canUseMotionVideo(plan: string | null | undefined) {
  return normalizePlan(plan) === "imperiale";
}

export function requiredPlanForTheme(slug: string): PlanTier {
  return THEME_PLAN_REQUIREMENTS[slug] ?? "privilege";
}

export function canUseTheme(plan: string | null | undefined, themeSlug: string) {
  const current = normalizePlan(plan);
  const required = requiredPlanForTheme(themeSlug);
  return PLAN_ORDER[current] >= PLAN_ORDER[required];
}

export function nextPlanForTheme(themeSlug: string) {
  return PLAN_LABELS[requiredPlanForTheme(themeSlug)];
}

export function withThemeAccess<T extends ThemeConfig>(theme: T, plan: string | null | undefined) {
  const requiredPlan = requiredPlanForTheme(theme.slug);
  return {
    ...theme,
    requiredPlan,
    locked: !canUseTheme(plan, theme.slug),
  };
}

export function photoLimitForPlan(plan: string | null | undefined) {
  return PLAN_PHOTO_LIMITS[normalizePlan(plan)];
}
