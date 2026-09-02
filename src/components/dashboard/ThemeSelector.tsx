"use client";

import type { ThemeConfig } from "@/types/database.types";
import { requiredPlanForTheme, withThemeAccess } from "@/lib/plan-gating";
import { LockedThemeCard } from "@/components/dashboard/LockedThemeCard";

export function ThemeSelector({
  themes,
  selectedSlug,
  planType,
  onSelect,
}: {
  themes: ThemeConfig[];
  selectedSlug: string;
  planType: string;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {themes.map((theme) => {
        const access = withThemeAccess(theme, planType);
        return (
          <LockedThemeCard
            key={theme.slug}
            theme={theme}
            active={theme.slug === selectedSlug}
            locked={access.locked}
            requiredPlan={requiredPlanForTheme(theme.slug)}
            onSelect={() => onSelect(theme.slug)}
          />
        );
      })}
    </div>
  );
}
