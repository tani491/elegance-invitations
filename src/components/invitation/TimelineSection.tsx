"use client";

import { Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicEventPayload } from "@/types/database.types";

export function TimelineSection({ event }: { event: PublicEventPayload }) {
  if (event.program.length === 0) return null;

  return (
    <section id="programme">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)]">Déroulé</p>
          <h2
            className="mt-4 text-2xl italic tracking-wide text-[var(--invitation-sheet-text)]"
            style={{ fontFamily: "var(--invitation-title-font)" }}
          >
            Le fil de la journée
          </h2>
        </div>
        <div className="relative mt-9 space-y-7 before:absolute before:left-[70px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-[linear-gradient(to_bottom,transparent,var(--invitation-gold-line),transparent)]">
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
              <span className="relative z-10 mt-1 grid size-7 place-items-center rounded-full bg-[var(--invitation-gold)] text-white shadow-[0_0_0_6px_rgba(255,255,255,.72)]">
                {index === Math.floor(event.program.length / 2) ? <Flower2 className="size-4" /> : <span className="font-serif text-[11px]">{index + 1}</span>}
              </span>
              <div className="pb-3">
                <h3
                  className="text-xl italic tracking-wide text-[var(--invitation-sheet-text)]"
                  style={{ fontFamily: "var(--invitation-title-font)" }}
                >
                  {step.title}
                </h3>
                {step.location && <p className="mt-1 font-serif text-xs uppercase tracking-[0.2em] text-[var(--invitation-sheet-muted)]">{step.location}</p>}
                {index < event.program.length - 1 && <div className="mt-6 h-px bg-gradient-to-r from-transparent via-[var(--invitation-sheet-border)] to-transparent" />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
