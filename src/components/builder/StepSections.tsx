"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BUILDER_SECTIONS, type BuilderSectionId } from "@/types/builder.types";

export function StepSections({
  selectedIds,
  onToggle,
}: {
  selectedIds: BuilderSectionId[];
  onToggle: (id: BuilderSectionId) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {BUILDER_SECTIONS.map((section) => {
        const checked = selectedIds.includes(section.id);
        return (
          <label key={section.id} className="cursor-pointer">
            <Card className={cn("rounded-lg border p-4 transition", checked ? "border-[#b8892b] bg-[#fff9ed]" : "border-stone-200 bg-white")}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={section.included}
                  onChange={() => onToggle(section.id)}
                  className="mt-1 size-4 accent-[#b8892b]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-stone-950">{section.label}</span>
                    <Badge variant={section.included ? "secondary" : "outline"}>{section.included ? "Free" : "+15 EUR"}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-stone-500">{section.description}</p>
                </div>
              </div>
            </Card>
          </label>
        );
      })}
    </div>
  );
}
