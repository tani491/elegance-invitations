"use client";

import { Check, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BUILDER_TEMPLATES, type BuilderTemplate, type TemplateId } from "@/types/builder.types";
import { formatEuro } from "./PricingSummary";

export function StepTemplate({
  selectedId,
  onSelect,
  onPreview,
}: {
  selectedId: TemplateId;
  onSelect: (id: TemplateId) => void;
  onPreview: (template: BuilderTemplate) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {BUILDER_TEMPLATES.map((template, index) => {
        const selected = template.id === selectedId;
        return (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
          >
            <Card
              className={cn(
                "overflow-hidden rounded-lg border bg-white p-0 shadow-sm transition",
                selected ? "border-[#b8892b] ring-2 ring-[#b8892b]/20" : "border-stone-200 hover:border-[#d7bd82]",
              )}
            >
              <div className="aspect-[4/5] p-3">
                <div className="relative flex size-full items-end overflow-hidden rounded-md p-4 text-white" style={{ background: template.gradient }}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,.35),transparent_38%)]" />
                  <div className="relative">
                    <p className="font-serif text-3xl">{template.name}</p>
                    <p className="mt-2 max-w-52 text-xs leading-5 text-white/80">{template.mood}</p>
                  </div>
                  {selected && (
                    <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-[#9b6f1e]">
                      <Check className="size-4" />
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-4 p-4 pt-0">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{formatEuro(template.basePrice)}</Badge>
                  <span className="size-3 rounded-full" style={{ backgroundColor: template.accent }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={() => onPreview(template)}>
                    <Eye className="size-4" />
                    Preview
                  </Button>
                  <Button type="button" onClick={() => onSelect(template.id)} className="bg-stone-950 text-white hover:bg-stone-800">
                    Select
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
