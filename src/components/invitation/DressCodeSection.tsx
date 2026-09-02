"use client";

import { Shirt } from "lucide-react";
import type { PublicEventPayload } from "@/types/database.types";

export function DressCodeSection({ event }: { event: PublicEventPayload }) {
  if (!event.dressCode && event.dressCodeColors.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--invitation-gold)]/25 bg-white/80 p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-[var(--invitation-primary)] text-white">
          <Shirt className="size-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Dress code</p>
          <h2 className="font-serif text-2xl text-[var(--invitation-primary)]">Palette souhaitee</h2>
        </div>
      </div>
      {event.dressCode && <p className="mt-5 leading-7 text-stone-600">{event.dressCode}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        {event.dressCodeColors.map((color) => (
          <span key={`${color.label}-${color.color}`} className="flex items-center gap-2 rounded-full border border-[#d7bd82]/50 bg-[#fffaf0] px-3 py-2 text-sm">
            <span className="size-5 rounded-full border border-black/10" style={{ backgroundColor: color.color }} />
            {color.label}
          </span>
        ))}
      </div>
    </div>
  );
}
