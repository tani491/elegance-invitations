"use client";

import { Gift, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BUILDER_BUNDLES,
  BUILDER_EXTRAS,
  type BuilderBundleId,
  type BuilderExtraId,
} from "@/types/builder.types";
import { formatEuro } from "./PricingSummary";

export function StepExtras({
  mode,
  selectedExtraIds,
  selectedBundleIds,
  onToggleExtra,
  onToggleBundle,
}: {
  mode: "extras" | "bundles";
  selectedExtraIds: BuilderExtraId[];
  selectedBundleIds: BuilderBundleId[];
  onToggleExtra: (id: BuilderExtraId) => void;
  onToggleBundle: (id: BuilderBundleId) => void;
}) {
  return (
    <div className="space-y-3">
      {mode === "extras" ? (
        <>
        <h3 className="font-serif text-2xl text-stone-950">Options individuelles</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {BUILDER_EXTRAS.map((extra) => {
            const active = selectedExtraIds.includes(extra.id);
            return (
              <button key={extra.id} type="button" onClick={() => onToggleExtra(extra.id)} className="text-left">
                <Card className={cn("h-full rounded-lg border p-4 transition", active ? "border-[#b8892b] bg-[#fff9ed]" : "border-stone-200 bg-white hover:border-[#d7bd82]")}>
                  <div className="flex items-start justify-between gap-3">
                    <Sparkles className="mt-1 size-5 text-[#b8892b]" />
                    <Badge variant="outline">{formatEuro(extra.price)}</Badge>
                  </div>
                  <p className="mt-4 font-medium text-stone-950">{extra.label}</p>
                  <p className="mt-1 text-sm leading-5 text-stone-500">{extra.description}</p>
                </Card>
              </button>
            );
          })}
        </div>
        </>
      ) : (
        <>
        <h3 className="font-serif text-2xl text-stone-950">Bundles signature</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {BUILDER_BUNDLES.map((bundle) => {
            const active = selectedBundleIds.includes(bundle.id);
            return (
              <button key={bundle.id} type="button" onClick={() => onToggleBundle(bundle.id)} className="w-full text-left">
                <Card className={cn("rounded-lg border p-5 transition", active ? "border-[#b8892b] bg-stone-950 text-white" : "border-stone-200 bg-white hover:border-[#d7bd82]")}>
                  <div className="flex items-center justify-between gap-3">
                    <Gift className="size-5 text-[#b8892b]" />
                    <Badge className={active ? "bg-white text-stone-950" : "bg-[#b8892b] text-white"}>{formatEuro(bundle.price)}</Badge>
                  </div>
                  <p className="mt-4 font-serif text-2xl">{bundle.label}</p>
                  <p className={cn("mt-2 text-sm leading-6", active ? "text-white/70" : "text-stone-500")}>{bundle.description}</p>
                </Card>
              </button>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
