"use client";

import { motion } from "framer-motion";

export function BotanicalEnvelope({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--invitation-secondary),#FFFFFF)]">
      <motion.div
        className="absolute inset-x-8 top-1/2 h-56 -translate-y-1/2 rounded-lg border border-[var(--invitation-gold)]/35 bg-white/75 shadow-2xl"
        animate={opened ? { y: 70, opacity: 0.35 } : { y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className="absolute left-1/2 top-[45%] h-24 w-24 -translate-x-1/2 rounded-full border border-[var(--invitation-gold)]/50 bg-[radial-gradient(circle,#F7DCE2,#C16A7B)] shadow-lg"
        animate={opened ? { y: -95, scale: 0.7, opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.9 }}
      />
    </div>
  );
}
