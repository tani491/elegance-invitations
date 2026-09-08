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
    <div
      className="no-scrollbar flex snap-x gap-4 overflow-x-auto px-1 py-3 [-webkit-overflow-scrolling:touch]"
      aria-label="Catalogue de modeles"
    >
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
