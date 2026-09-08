"use client";

import { Shirt } from "lucide-react";
import type { PublicEventPayload } from "@/types/database.types";

function normalizeDressCodeLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "noir blancs" || normalized === "noir blanc" || normalized === "noir et blancs") {
    return "Noir et blanc";
  }
  return value;
}

function normalizeDressCodeCopy(value: string) {
  return value
    .replace(/\bnoir blancs\b/gi, "Noir et blanc")
    .replace(/\bnoir blanc\b/gi, "Noir et blanc")
    .replace(/\bnoir et blancs\b/gi, "Noir et blanc");
}

export function DressCodeSection({ event }: { event: PublicEventPayload }) {
  if (!event.dressCode && event.dressCodeColors.length === 0) return null;

  return (
    <section id="dress-code" className="text-center">
      <div className="flex flex-col items-center">
        <span className="grid size-11 place-items-center rounded-full bg-[color:var(--invitation-chip)] text-[var(--invitation-gold)] shadow-[0_12px_30px_rgba(0,0,0,.18)]">
          <Shirt className="size-5" />
        </span>
        <h2 className="mt-5 font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)]">Dress code</h2>
        <p
          className="mt-4 text-2xl italic tracking-wide text-[var(--invitation-sheet-text)]"
          style={{ fontFamily: "var(--invitation-title-font)" }}
        >
          Palette souhaitée
        </p>
      </div>
      {event.dressCode && <p className="mx-auto mt-6 max-w-xs font-serif text-lg leading-[1.8] text-[var(--invitation-sheet-muted)]">{normalizeDressCodeCopy(event.dressCode)}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {event.dressCodeColors.map((color) => (
          <span
            key={`${color.label}-${color.color}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[color:var(--invitation-sheet-border)] bg-white/60 px-4 py-2 font-serif text-xs uppercase tracking-[0.16em] text-[var(--invitation-sheet-muted)] shadow-[0_10px_26px_rgba(0,0,0,.1)]"
          >
            <span className="size-5 rounded-full border border-[#FFFDF9]/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,.55)]" style={{ backgroundColor: color.color }} />
            {normalizeDressCodeLabel(color.label)}
          </span>
        ))}
      </div>
    </section>
  );
}
