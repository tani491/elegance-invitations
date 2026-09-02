"use client";

import { motion } from "framer-motion";

export function WaxSealBurst({ opened, initials }: { opened: boolean; initials: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[var(--invitation-secondary)]">
      <motion.div
        className="absolute inset-x-6 top-1/2 h-56 -translate-y-1/2 rounded-lg border border-[var(--invitation-gold)]/35 bg-white/70 shadow-2xl"
        animate={opened ? { rotateX: 58, y: -70, opacity: 0.35 } : { rotateX: 0, y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--invitation-primary)] font-display-bold text-3xl text-[var(--invitation-gold)] shadow-2xl"
        animate={opened ? { scale: 1.8, opacity: 0, rotate: 28 } : { scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.75 }}
      >
        {initials}
      </motion.div>
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute left-1/2 top-1/2 size-1 rounded-full bg-[var(--invitation-gold)]"
          animate={opened ? { x: Math.cos(index) * 180, y: Math.sin(index) * 180, opacity: 0 } : { x: 0, y: 0, opacity: 0 }}
          transition={{ duration: 0.9, delay: 0.05 }}
        />
      ))}
    </div>
  );
}
