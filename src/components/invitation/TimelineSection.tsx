"use client";

import { Clock3, Flower2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PublicEventPayload } from "@/types/database.types";

export function TimelineSection({ event }: { event: PublicEventPayload }) {
  if (event.program.length === 0) return null;

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Flower2 className="mx-auto size-8 text-[var(--invitation-gold)]" />
          <h2 className="mt-3 font-serif text-4xl text-[var(--invitation-primary)]">Programme</h2>
        </div>
        <div className="mt-10 space-y-6">
          {event.program.map((step, index) => (
            <motion.div
              key={`${step.title}-${step.time}-${index}`}
              className="grid grid-cols-[70px_1fr] gap-4"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="text-right font-serif text-xl text-[var(--invitation-gold)]">{step.time}</div>
              <div className="relative rounded-lg border border-[var(--invitation-gold)]/25 bg-white/80 p-5 shadow-lg">
                <span className="absolute -left-[29px] top-5 grid size-9 place-items-center rounded-full border border-[var(--invitation-gold)] bg-white text-[var(--invitation-primary)]">
                  <Clock3 className="size-4" />
                </span>
                <h3 className="font-serif text-2xl text-stone-950">{step.title}</h3>
                {step.location && <p className="mt-1 text-sm text-stone-500">{step.location}</p>}
                <p className="mt-3 leading-7 text-stone-600">Un moment soigneusement orchestre pour celebrer avec vous.</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
