"use client";

import { Shirt } from "lucide-react";
import type { PublicEventPayload } from "@/types/database.types";

export function DressCodeSection({ event }: { event: PublicEventPayload }) {
  if (!event.dressCode && event.dressCodeColors.length === 0) return null;

  return (
    <section id="dress-code" className="text-center">
      <div className="flex flex-col items-center">
        <span className="grid size-11 place-items-center rounded-full border border-[var(--invitation-gold)]/35 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
          <Shirt className="size-5" />
        </span>
        <p className="mt-5 text-xs uppercase tracking-[0.25em] text-amber-700/80">Dress code</p>
        <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-amber-950 md:text-3xl">Palette souhaitee</h2>
      </div>
      {event.dressCode && <p className="mx-auto mt-6 max-w-2xl leading-8 text-stone-700/75">{event.dressCode}</p>}
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {event.dressCodeColors.map((color) => (
          <span
            key={`${color.label}-${color.color}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--invitation-gold)]/35 bg-[#fffaf0]/55 px-4 py-2 text-xs uppercase tracking-[0.16em] text-amber-950/75"
          >
            <span className="size-5 rounded-full border border-amber-950/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,.55)]" style={{ backgroundColor: color.color }} />
            {color.label}
          </span>
        ))}
      </div>
    </section>
  );
}
