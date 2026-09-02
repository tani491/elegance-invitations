"use client";

import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GiftListIBAN({ iban, wave }: { iban?: string | null; wave?: string | null }) {
  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copie.`);
  }

  if (!iban && !wave) return null;

  return (
    <div className="rounded-lg border border-[var(--invitation-gold)]/25 bg-white/75 p-5 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <Gift className="size-5 text-[var(--invitation-gold)]" />
        <h2 className="font-display-bold text-xl text-[var(--invitation-primary)]">Cadeau des maries</h2>
      </div>
      <div className="space-y-3">
        {iban && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--invitation-secondary)]/70 p-3 text-sm">
            <span className="min-w-0 truncate">{iban}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(iban, "IBAN")}>
              <Copy className="size-4" />
            </Button>
          </div>
        )}
        {wave && (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-[var(--invitation-secondary)]/70 p-3 text-sm">
            <span className="min-w-0 truncate">Wave: {wave}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => copy(wave, "Wave")}>
              <Copy className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
