"use client";

import { Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS } from "@/lib/plan-gating";
import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/types/database.types";
import type { PlanTier } from "@/types/wedding";

export function LockedThemeCard({
  theme,
  active,
  locked,
  requiredPlan,
  onSelect,
}: {
  theme: ThemeConfig;
  active: boolean;
  locked: boolean;
  requiredPlan: PlanTier;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      className={cn(
        "relative overflow-hidden rounded-lg border p-3 text-left transition",
        active ? "border-[#D4AF37] shadow-md" : "border-[#D4AF37]/20 hover:border-[#D4AF37]/60",
        locked && "cursor-not-allowed grayscale opacity-60",
      )}
    >
      <div className="mb-3 h-20 rounded-md" style={{ background: theme.previewGradient }} />
      <p className="font-display-bold text-sm text-[#1A1818]">{theme.name}</p>
      <p className="text-xs text-muted-foreground">{theme.category}</p>
      {active && !locked && (
        <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-[#D4AF37] text-[#1A1818]">
          <Check className="size-4" />
        </span>
      )}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 p-4 text-center">
          <Lock className="mb-2 size-6 text-[#5C1D24]" />
          <span className="rounded bg-[#5C1D24] px-2 py-1 text-xs font-semibold text-white">
            Verrouille - {PLAN_LABELS[requiredPlan]}
          </span>
          <Button type="button" size="sm" variant="outline" className="mt-3 h-8 text-xs">
            Passer a la formule superieure
          </Button>
        </div>
      )}
    </button>
  );
}
