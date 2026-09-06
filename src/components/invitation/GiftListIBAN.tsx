"use client";

import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GiftListIBAN({ iban, wave }: { iban?: string | null; wave?: string | null }) {
  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copié.`);
  }

  if (!iban && !wave) return null;

  return (
    <section className="text-center">
      <div className="mb-6 flex flex-col items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-[color:var(--invitation-chip)] text-[var(--invitation-gold)] shadow-[0_12px_30px_rgba(0,0,0,.18)]">
          <Gift className="size-5" />
        </span>
        <div>
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)] drop-shadow-md">Cadeau</p>
          <h2 className="mt-4 font-serif text-2xl italic tracking-wide text-[#FFFDF9] drop-shadow-md">Cadeau des mariés</h2>
        </div>
      </div>
      <div className="mx-auto grid max-w-xs gap-3">
        {iban && (
          <div className="flex items-center justify-between gap-3 rounded-full border border-[color:var(--invitation-border)] bg-[color:var(--invitation-panel)] px-4 py-3 font-serif text-sm text-[#FFFDF9]/80 shadow-[0_12px_30px_rgba(0,0,0,.16)] backdrop-blur-md">
            <span className="min-w-0 truncate">{iban}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-[var(--invitation-gold)] hover:bg-[color:var(--invitation-chip)]"
              onClick={() => copy(iban, "IBAN")}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        )}
        {wave && (
          <div className="flex items-center justify-between gap-3 rounded-full border border-[color:var(--invitation-border)] bg-[color:var(--invitation-panel)] px-4 py-3 font-serif text-sm text-[#FFFDF9]/80 shadow-[0_12px_30px_rgba(0,0,0,.16)] backdrop-blur-md">
            <span className="min-w-0 truncate">Wave: {wave}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full text-[var(--invitation-gold)] hover:bg-[color:var(--invitation-chip)]"
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
