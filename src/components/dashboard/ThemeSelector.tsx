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
    <div className="w-full max-w-full overflow-hidden px-4">
      <div
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pt-1 scroll-smooth touch-pan-x [-webkit-overflow-scrolling:touch]"
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
    </div>
  );
}
