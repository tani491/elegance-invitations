"use client";

import { Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicEventPayload } from "@/types/database.types";

export function TimelineSection({ event }: { event: PublicEventPayload }) {
  if (event.program.length === 0) return null;

  return (
    <section id="programme" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">Programme</p>
          <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-amber-950 md:text-3xl">Le fil de la journee</h2>
        </div>
        <div className="relative mt-14 space-y-10 before:absolute before:left-[78px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-transparent before:via-[var(--invitation-gold)]/55 before:to-transparent sm:before:left-[98px]">
          {event.program.map((step, index) => (
            <motion.div
              key={`${step.title}-${step.time}-${index}`}
              className="grid grid-cols-[62px_32px_1fr] gap-3 sm:grid-cols-[80px_36px_1fr] sm:gap-5"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.05 }}
            >
              <time className="pt-1 text-right font-serif text-xl italic text-[var(--invitation-gold)] sm:text-2xl">{step.time}</time>
              <span className="relative z-10 mt-1 grid size-8 place-items-center rounded-full border border-[var(--invitation-gold)]/45 bg-[#FAF8F5] text-[var(--invitation-gold)] shadow-[0_0_0_6px_rgba(250,248,245,.92)] sm:size-9">
                {index === Math.floor(event.program.length / 2) ? <Flower2 className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
              </span>
              <div className={`pb-8 ${index === event.program.length - 1 ? "" : "border-b border-[var(--invitation-gold)]/20"}`}>
                <h3 className="font-serif text-2xl italic tracking-wide text-amber-950">{step.title}</h3>
                {step.location && <p className="mt-1 text-xs uppercase tracking-[0.2em] text-amber-800/65">{step.location}</p>}
                <p className="mt-4 leading-7 text-stone-700/75">Un moment soigneusement orchestre pour celebrer avec vous.</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
