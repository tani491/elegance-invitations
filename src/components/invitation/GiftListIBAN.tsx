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
    <section className="border-y border-[var(--invitation-gold)]/25 py-8 text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full border border-[var(--invitation-gold)]/35 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
          <Gift className="size-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">Present</p>
          <h2 className="mt-2 font-serif text-2xl italic tracking-wider text-amber-950">Cadeau des maries</h2>
        </div>
      </div>
      <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
        {iban && (
          <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--invitation-gold)]/25 bg-[#fffaf0]/55 px-4 py-3 text-sm text-amber-950/80">
            <span className="min-w-0 truncate">{iban}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-[var(--invitation-gold)] hover:bg-[var(--invitation-gold)]/10"
              onClick={() => copy(iban, "IBAN")}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        )}
        {wave && (
          <div className="flex items-center justify-between gap-3 rounded-full border border-[var(--invitation-gold)]/25 bg-[#fffaf0]/55 px-4 py-3 text-sm text-amber-950/80">
            <span className="min-w-0 truncate">Wave: {wave}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-[var(--invitation-gold)] hover:bg-[var(--invitation-gold)]/10"
              onClick={() => copy(wave, "Wave")}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
