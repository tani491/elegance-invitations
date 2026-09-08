"use client";

import { Check, Lock } from "lucide-react";
import { PLAN_LABELS } from "@/lib/plan-gating";
import { normalizeThemeConfig } from "@/lib/theme-presets";
import { cn } from "@/lib/utils";
import type { ThemeConfig } from "@/types/database.types";
import type { PlanTier } from "@/types/wedding";

function themeVideoSource(theme: ThemeConfig) {
  return theme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

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
  const safeTheme = normalizeThemeConfig(theme);
  const videoSrc = themeVideoSource(safeTheme);

  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      aria-pressed={active}
      className={cn(
        "relative w-[140px] flex-shrink-0 snap-center overflow-hidden rounded-2xl border p-2.5 text-left transition-all duration-200 sm:w-[160px]",
        active ? "border-amber-500 bg-amber-50/40 shadow-sm ring-2 ring-amber-400/40" : "border-neutral-200 bg-white hover:border-amber-200",
        locked && "cursor-not-allowed grayscale opacity-60",
      )}
    >
      <div className="relative h-24 w-full overflow-hidden rounded-xl bg-neutral-100 sm:h-28" style={{ background: safeTheme.previewGradient }}>
        {videoSrc ? (
          <video src={videoSrc} className="h-full w-full object-cover pointer-events-none" autoPlay muted playsInline loop preload="metadata" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="grid size-11 place-items-center rounded-full border border-white/35 bg-black/15 font-serif text-sm text-white backdrop-blur">
              {safeTheme.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <p className="mt-2 truncate text-center text-xs font-medium text-[#1A1818] sm:text-sm">{safeTheme.name}</p>
      <p className="truncate text-center text-[11px] text-muted-foreground">{safeTheme.category}</p>
      {active && !locked && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#D4AF37] px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#1A1818] shadow-sm">
          <Check className="size-3" />
          Selectionne
        </span>
      )}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 p-4 text-center">
          <Lock className="mb-2 size-6 text-[#5C1D24]" />
          <span className="rounded bg-[#5C1D24] px-2 py-1 text-xs font-semibold text-white">
            Verrouille - {PLAN_LABELS[requiredPlan]}
          </span>
          <span className="mt-3 rounded-md border border-[#D4AF37]/35 bg-white px-3 py-2 text-xs font-medium text-[#5C1D24]">
            Passer a la formule superieure
          </span>
        </div>
      )}
    </button>
  );
}
