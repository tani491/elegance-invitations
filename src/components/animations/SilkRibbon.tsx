"use client";

import { motion } from "framer-motion";

export function SilkRibbon({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 bg-[var(--invitation-secondary)]">
      <div className="absolute inset-x-8 top-1/2 h-48 -translate-y-1/2 rounded-lg border border-[var(--invitation-gold)]/40 bg-white/65 shadow-2xl" />
      <motion.div
        className="absolute left-0 top-1/2 h-8 w-full -translate-y-1/2 bg-[var(--invitation-accent)] shadow-lg"
        animate={opened ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--invitation-accent)] shadow-xl"
        animate={opened ? { scale: 0.25, rotate: 80, opacity: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.9 }}
      />
    </div>
  );
}
