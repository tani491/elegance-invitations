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
        <span className="grid size-11 place-items-center rounded-full bg-amber-100/40 text-[var(--invitation-gold)]">
          <Shirt className="size-5" />
        </span>
        <h2 className="mt-5 font-serif text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/80">Dress code</h2>
        <p className="mt-4 font-serif text-2xl italic tracking-wide text-amber-950">Palette souhaitée</p>
      </div>
      {event.dressCode && <p className="mx-auto mt-6 max-w-xs font-serif text-lg leading-[1.8] text-stone-700/75">{normalizeDressCodeCopy(event.dressCode)}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {event.dressCodeColors.map((color) => (
          <span
            key={`${color.label}-${color.color}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F5EFEB]/70 px-4 py-2 font-serif text-xs uppercase tracking-[0.16em] text-amber-950/75"
          >
            <span className="size-5 rounded-full border border-amber-950/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,.55)]" style={{ backgroundColor: color.color }} />
            {normalizeDressCodeLabel(color.label)}
          </span>
        ))}
      </div>
    </section>
  );
}
