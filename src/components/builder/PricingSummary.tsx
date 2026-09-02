"use client";

import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { BuilderPricing } from "@/types/builder.types";

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);
}

export function PricingSummary({ pricing }: { pricing: BuilderPricing }) {
  return (
    <Card className="rounded-lg border-[#d7bd82]/50 bg-white/90 shadow-xl shadow-stone-200/60">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Recapitulatif</p>
            <h2 className="mt-1 font-serif text-2xl text-stone-950">{pricing.template.name}</h2>
          </div>
          <Badge className="bg-[#b8892b] text-white">
            <ShoppingBag className="size-3" />
            Live
          </Badge>
        </div>
        <div className="mt-5 space-y-3">
          {pricing.lineItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-stone-600">{item.label}</span>
              <span className="font-medium text-stone-950">{formatEuro(item.amount)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 border-t border-[#d7bd82]/40 pt-5">
          <div className="flex items-end justify-between">
            <span className="text-sm uppercase tracking-[0.16em] text-stone-500">Total</span>
            <strong className="font-serif text-4xl text-stone-950">{formatEuro(pricing.total)}</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
