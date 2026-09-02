"use client";

import { motion } from "framer-motion";
import { Clock3 } from "lucide-react";
import type { PublicEventPayload } from "@/types/database.types";

export function TimelineSchedule({ event }: { event: PublicEventPayload }) {
  return (
    <section className="bg-[var(--invitation-primary)] px-4 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-display-bold text-3xl uppercase tracking-[0.16em]">Programme</h2>
        <div className="mt-10 space-y-4">
          {event.program.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              className="grid gap-3 rounded-lg border border-white/15 bg-white/10 p-5 sm:grid-cols-[120px_1fr]"
            >
              <p className="flex items-center gap-2 font-display-bold text-[var(--invitation-gold)]">
                <Clock3 className="size-4" />
                {step.time}
              </p>
              <div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-white/70">{step.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
