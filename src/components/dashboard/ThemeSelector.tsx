"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ThemeConfig } from "@/types/database.types";
import { requiredPlanForTheme, withThemeAccess } from "@/lib/plan-gating";
import { LockedThemeCard } from "@/components/dashboard/LockedThemeCard";
import { cn } from "@/lib/utils";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    progress: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      const nextProgress = maxScroll > 0 ? container.scrollLeft / maxScroll : 1;
      setScrollState({
        canScrollLeft: container.scrollLeft > 4,
        canScrollRight: container.scrollLeft < maxScroll - 4,
        progress: Math.min(Math.max(nextProgress, 0), 1),
      });
    };

    updateScrollState();
    container.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollState) : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollState);
    };
  }, [themes.length]);

  function scrollThemes(direction: "left" | "right") {
    containerRef.current?.scrollBy({
      left: direction === "right" ? 250 : -250,
      behavior: "smooth",
    });
  }

  return (
    <div className="w-full max-w-full overflow-hidden px-1 sm:px-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => scrollThemes("left")}
          disabled={!scrollState.canScrollLeft}
          aria-label="Themes precedents"
          className={cn(
            "absolute left-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-400/40 bg-white/80 p-2 text-[#2A211A] shadow-lg backdrop-blur transition hover:bg-white dark:bg-black/60 dark:text-white",
            !scrollState.canScrollLeft && "pointer-events-none opacity-0",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollThemes("right")}
          disabled={!scrollState.canScrollRight}
          aria-label="Themes suivants"
          className={cn(
            "absolute right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-amber-400/40 bg-white/80 p-2 text-[#2A211A] shadow-lg backdrop-blur transition hover:bg-white dark:bg-black/60 dark:text-white",
            !scrollState.canScrollRight && "pointer-events-none opacity-0",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#FAF7F2] via-[#FAF7F2]/85 to-transparent transition-opacity",
            scrollState.canScrollRight ? "opacity-100" : "opacity-0",
          )}
        />
      <div
        ref={containerRef}
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
      <div className="mx-auto mt-1 h-1 w-28 overflow-hidden rounded-full bg-neutral-200">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-[#C5A059] to-[#9E7D3B] transition-[width] duration-300"
          style={{ width: `${Math.max(scrollState.progress * 100, themes.length > 0 ? 18 : 0)}%` }}
        />
      </div>
    </div>
  );
}
