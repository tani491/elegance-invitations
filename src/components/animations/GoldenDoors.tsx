"use client";

import { motion } from "framer-motion";

export function GoldenDoors({ opened }: { opened: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#173B4A,#F2A65A_62%,#F7E3BD)]">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_center,#F7D48A,transparent_58%)] opacity-70" />
      <div className="absolute inset-x-10 bottom-16 top-16 rounded-t-full border border-white/35 bg-white/10" />
      <motion.div
        className="absolute left-0 top-0 h-full w-1/2 origin-left border-r border-[#F8D779] bg-[linear-gradient(135deg,#8B5E18,#F8D779,#9B681B)] shadow-2xl"
        animate={opened ? { rotateY: -72, x: "-10%" } : { rotateY: 0, x: 0 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        style={{ transformPerspective: 1000 }}
      />
      <motion.div
        className="absolute right-0 top-0 h-full w-1/2 origin-right border-l border-[#F8D779] bg-[linear-gradient(225deg,#8B5E18,#F8D779,#9B681B)] shadow-2xl"
        animate={opened ? { rotateY: 72, x: "10%" } : { rotateY: 0, x: 0 }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        style={{ transformPerspective: 1000 }}
      />
    </div>
  );
}
