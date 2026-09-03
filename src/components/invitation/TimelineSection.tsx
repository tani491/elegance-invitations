"use client";

import { Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicEventPayload } from "@/types/database.types";

export function TimelineSection({ event }: { event: PublicEventPayload }) {
  if (event.program.length === 0) return null;

  return (
    <section id="programme" className="px-6 py-16">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/80">Chronologie</p>
          <h2 className="mt-4 font-serif text-2xl italic tracking-wide text-amber-950">Le fil de la journée</h2>
        </div>
        <div className="relative mt-12 space-y-9 before:absolute before:left-[70px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-transparent before:via-amber-400/60 before:to-transparent">
          {event.program.map((step, index) => (
            <motion.div
              key={`${step.title}-${step.time}-${index}`}
              className="grid grid-cols-[56px_28px_1fr] gap-3"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.05 }}
            >
              <time className="pt-1 text-right font-serif text-lg italic text-[var(--invitation-gold)]">{step.time}</time>
              <span className="relative z-10 mt-1 grid size-7 place-items-center rounded-full bg-[#FAF6F0] text-[var(--invitation-gold)] shadow-[0_0_0_6px_rgba(250,246,240,.92)]">
                {index === Math.floor(event.program.length / 2) ? <Flower2 className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <div className="pb-3">
                <h3 className="font-serif text-2xl italic tracking-wide text-amber-950">{step.title}</h3>
                {step.location && <p className="mt-1 font-serif text-xs uppercase tracking-[0.2em] text-amber-800/65">{step.location}</p>}
                <p className="mt-4 font-serif text-base leading-[1.8] text-stone-700/75">Un moment soigneusement orchestré pour célébrer avec vous.</p>
                {index < event.program.length - 1 && <div className="mt-7 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
