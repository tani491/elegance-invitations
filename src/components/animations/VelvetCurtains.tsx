"use client";

import { motion } from "framer-motion";

export function VelvetCurtains({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#16070A]">
      <motion.div
        className="absolute left-0 top-0 h-full w-[58%] bg-[repeating-linear-gradient(90deg,#4A0712_0,#781827_24px,#3A0610_48px)] shadow-2xl"
        animate={opened ? { x: "-82%" } : { x: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-0 h-full w-[58%] bg-[repeating-linear-gradient(90deg,#3A0610_0,#781827_24px,#4A0712_48px)] shadow-2xl"
        animate={opened ? { x: "82%" } : { x: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 top-0 h-8 bg-[var(--invitation-gold)]" />
    </div>
  );
}
