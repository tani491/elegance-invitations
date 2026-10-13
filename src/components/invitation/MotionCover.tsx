"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ThemeConfig } from "@/types/database.types";

/** The video stays mounted behind these panels throughout the reveal. */
export function MotionCover({ started, theme, onOpened }: {
  started: boolean;
  theme: ThemeConfig;
  onOpened: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const envelope = /seal|envelope|ribbon/.test(theme.animationType);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden" style={{ perspective: 1200 }}>
      {[0, 1].map((side) => (
        <motion.div
          key={side}
          className={`absolute inset-y-0 w-1/2 border border-[var(--invitation-gold)] ${side ? "right-0" : "left-0"}`}
          style={{ background: theme.previewGradient, transformOrigin: side ? "right center" : "left center" }}
          initial={false}
          animate={started ? envelope
            ? { y: side ? "110%" : "-110%", opacity: 0 }
            : { rotateY: side ? 100 : -100, opacity: 0 }
            : { y: "0%", rotateY: 0, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 1.4, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => { if (started && side === 1) onOpened(); }}
        />
      ))}
    </div>
  );
}
