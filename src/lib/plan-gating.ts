import type { PlanTier } from "@/types/wedding";
import type { ThemeConfig } from "@/types/database.types";

export const ASSIGNABLE_THEME_PLANS = ["privilege", "imperiale"] as const;
export type AssignableThemePlan = (typeof ASSIGNABLE_THEME_PLANS)[number];

export const THEME_PLAN_OPTIONS: { value: AssignableThemePlan; label: string; price: string }[] = [
  { value: "privilege", label: "Privilège", price: "15 000 FCFA" },
  { value: "imperiale", label: "Impérial Cinematic Motion", price: "25 000 FCFA" },
];

export const PLAN_LABELS: Record<PlanTier, string> = {
  privilege: "Formule Privilège",
  imperiale: "Formule Impérial Cinematic Motion",
};

export const PLAN_ORDER: Record<PlanTier, number> = {
  privilege: 1,
  imperiale: 2,
};

export const PLAN_PHOTO_LIMITS: Record<PlanTier, number> = {
  privilege: 3,
  imperiale: 5,
};

export const THEME_PLAN_REQUIREMENTS: Record<string, PlanTier> = {
  "enveloppe-de-cire": "privilege",
  "ivoire-minimal": "privilege",
  "roseraie-nude": "privilege",
  "roseraie-boheme": "privilege",
  "rideau-de-theatre": "privilege",
  "ruban-de-soie": "privilege",
  "fleur-ficelle-botanique": "privilege",
  "medina-orientale": "privilege",
  "portes-royales-dorees": "privilege",
  "defile-scenique": "privilege",
  "emeraude-or-imperial": "privilege",
};

function normalizePlanKey(plan?: string | null) {
  return plan?.trim().toLowerCase().replace(/\s+/g, "_");
}

const PLAN_ALIASES: Record<string, PlanTier> = {
  essentielle: "privilege",
  essential: "privilege",
  prestige: "privilege",
  privilege: "privilege",
  privilegee: "privilege",
  privilegie: "privilege",
  privilège: "privilege",
  impériale: "imperiale",
  imperiale: "imperiale",
  imperial: "imperiale",
  motion: "imperiale",
  imperiale_motion: "imperiale",
  imperial_motion: "imperiale",
};

function normalizeKnownPlan(plan?: string | null) {
  const normalized = normalizePlanKey(plan);
  return normalized ? PLAN_ALIASES[normalized] ?? null : null;
}

export function normalizePlan(plan?: string | null): PlanTier {
  return normalizeKnownPlan(plan) ?? "privilege";
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

export function allowedPlansForCategory(category?: string | null): PlanTier[] {
  const normalized = category?.trim().toLowerCase();

  if (
    normalized === "imperiale" ||
    normalized === "imperial cinematic motion" ||
    normalized === "imperiale motion" ||
    normalized === "impériale motion"
  ) return ["imperiale"];
  return ["privilege", "imperiale"];
}

export function normalizeAllowedPlans(
  plans: readonly (string | null | undefined)[] | null | undefined,
  fallback: readonly PlanTier[] = ["privilege", "imperiale"],
): PlanTier[] {
  const normalized = (plans ?? [])
    .map((plan) => normalizeKnownPlan(plan))
    .filter((plan): plan is PlanTier => Boolean(plan))
    .filter((plan, index, list): plan is PlanTier => list.indexOf(plan) === index);

  return normalized.length > 0 ? normalized : [...fallback];
}

export function assignablePlansFromAllowedPlans(
  plans: readonly (string | null | undefined)[] | null | undefined,
  fallback: readonly PlanTier[] = ["privilege", "imperiale"],
): AssignableThemePlan[] {
  const normalized = normalizeAllowedPlans(plans, fallback).filter((plan): plan is AssignableThemePlan =>
    ASSIGNABLE_THEME_PLANS.includes(plan as AssignableThemePlan),
  );

  return normalized.length > 0 ? normalized : ["privilege", "imperiale"];
}

export function storeAllowedPlans(plans: readonly (string | null | undefined)[] | null | undefined) {
  return normalizeAllowedPlans(plans).map((plan) => plan.toUpperCase());
}

export function categoryForAllowedPlans(plans: readonly (string | null | undefined)[] | null | undefined) {
  const normalized = assignablePlansFromAllowedPlans(plans);
  if (!normalized.includes("privilege") && normalized.includes("imperiale")) return "Imperiale Motion";
  return "Privilege";
}

export function requiredPlanForAllowedPlans(plans: readonly (string | null | undefined)[] | null | undefined) {
  return normalizeAllowedPlans(plans).sort((a, b) => PLAN_ORDER[a] - PLAN_ORDER[b])[0] ?? "privilege";
}

export function canUseTheme(
  plan: string | null | undefined,
  themeSlug: string,
  allowedPlans?: readonly (string | null | undefined)[] | null,
) {
  const current = normalizePlan(plan);
  if (allowedPlans && allowedPlans.length > 0) {
    return normalizeAllowedPlans(allowedPlans, []).includes(current);
  }

  const required = requiredPlanForTheme(themeSlug);
  return PLAN_ORDER[current] >= PLAN_ORDER[required];
}

export function nextPlanForTheme(themeSlug: string) {
  return PLAN_LABELS[requiredPlanForTheme(themeSlug)];
}

export function withThemeAccess<T extends ThemeConfig>(theme: T, plan: string | null | undefined) {
  const allowedPlans = normalizeAllowedPlans(theme.allowedPlans, allowedPlansForCategory(theme.category));
  const requiredPlan = requiredPlanForAllowedPlans(allowedPlans);

  return {
    ...theme,
    allowedPlans,
    requiredPlan,
    locked: !canUseTheme(plan, theme.slug, allowedPlans),
  };
}

export function photoLimitForPlan(plan: string | null | undefined) {
  return PLAN_PHOTO_LIMITS[normalizePlan(plan)];
}
