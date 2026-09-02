"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export function QuadEnvelopeOpener({
  names,
  monogram,
  backgroundImage,
  children,
}: {
  names: string;
  monogram?: string;
  backgroundImage?: string;
  children: React.ReactNode;
}) {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);

  function openInvitation() {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpened(true), 950);
  }

  return (
    <div className="relative min-h-screen bg-[#fbf7ef]">
      <AnimatePresence>
        {!opened && (
          <motion.div
            className="fixed inset-0 z-50 overflow-hidden bg-[#efe2ca]"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="absolute inset-0">
              {backgroundImage ? (
                <img src={backgroundImage} alt={names} className="size-full object-cover opacity-70" />
              ) : (
                <div className="size-full bg-[radial-gradient(circle_at_50%_20%,#fff8d8,transparent_34%),linear-gradient(135deg,#f7ecd5,#b98d37_55%,#241611)]" />
              )}
              <div className="absolute inset-0 bg-black/25" />
            </div>

            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 origin-top bg-[#f7efdf] shadow-2xl"
              style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
              animate={opening ? { rotateX: -78, y: "-16%" } : { rotateX: 0, y: 0 }}
              transition={{ duration: 1.1, ease }}
            />
            <motion.div
              className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-[#eadabd] shadow-2xl"
              style={{ clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
              animate={opening ? { rotateX: 78, y: "16%" } : { rotateX: 0, y: 0 }}
              transition={{ duration: 1.1, ease }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 origin-left bg-[#f3e7d2] shadow-2xl"
              style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
              animate={opening ? { rotateY: 72, x: "-16%" } : { rotateY: 0, x: 0 }}
              transition={{ duration: 1.1, ease }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 w-1/2 origin-right bg-[#e6d2ad] shadow-2xl"
              style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)" }}
              animate={opening ? { rotateY: -72, x: "16%" } : { rotateY: 0, x: 0 }}
              transition={{ duration: 1.1, ease }}
            />

            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,rgba(184,137,43,.18)_50%,transparent_52%)]" />
            <div className="absolute inset-0 grid place-items-center px-6 text-center">
              <motion.button
                type="button"
                onClick={openInvitation}
                className="group relative grid size-36 place-items-center rounded-full bg-[#7e1f1f] text-[#f9dfa3] shadow-2xl shadow-black/30 ring-8 ring-[#b8892b]/35"
                animate={opening ? { scale: 0, opacity: 0, filter: "blur(14px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease }}
                whileTap={{ scale: 0.96 }}
                aria-label="Ouvrir l'invitation"
              >
                <span className="absolute inset-3 rounded-full border border-[#f9dfa3]/45" />
                <span className="font-serif text-4xl">{monogram ?? <Heart className="mx-auto size-10" />}</span>
                <span className="absolute -bottom-16 w-56 text-xs uppercase tracking-[0.24em] text-white/85">Touchez pour ouvrir</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={opened ? "opacity-100 transition-opacity duration-700" : "pointer-events-none opacity-0"}>{children}</main>
    </div>
  );
}
