"use client";

import { motion } from "framer-motion";

export function CeremonialWalk({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#271F38,#F4E7D1)]">
      <div className="absolute inset-x-12 top-14 h-56 rounded-t-full border border-[var(--invitation-gold)]/60 bg-white/15" />
      <div className="absolute bottom-0 left-1/2 h-2/3 w-44 -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,.15),rgba(216,178,91,.55))]" />
      <motion.div
        className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-4"
        animate={opened ? { y: -130, scale: 1.2, opacity: 0.15 } : { y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      >
        <div className="h-24 w-12 rounded-t-full bg-white shadow-xl" />
        <div className="h-24 w-12 rounded-t-full bg-[var(--invitation-primary)] shadow-xl" />
      </motion.div>
    </div>
  );
}
