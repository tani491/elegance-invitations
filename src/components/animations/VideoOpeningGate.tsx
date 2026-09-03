"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

interface VideoOpeningGateProps {
  videoSrc?: string | null;
  ambientAudioSrc?: string | null;
  monogram?: string;
  title?: string;
  fallbackGradient?: string;
  fallbackImage?: string;
  onOpened?: () => void;
  children: ReactNode;
}

const ease = [0.16, 1, 0.3, 1] as const;

export function VideoOpeningGate({
  videoSrc,
  ambientAudioSrc,
  monogram = "E",
  title = "Invitation",
  fallbackGradient,
  fallbackImage,
  onOpened,
  children,
}: VideoOpeningGateProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
    };
  }, []);

  function handleStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsOpening(true);
    onOpened?.();

    if (audioRef.current) {
      audioRef.current.volume = 0.42;
      audioRef.current.play().catch(() => undefined);
    }

    unmountTimeoutRef.current = setTimeout(() => setIsUnmounted(true), 1_350);
  }

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5]">
      <main id="invitation-content" className="relative z-0 min-h-screen">
        {children}
      </main>

      <AnimatePresence>
        {!isUnmounted && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={isOpening ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 1, ease: "easeInOut", delay: isOpening ? 0.35 : 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#efe4d0] ${
              isOpening ? "pointer-events-none" : ""
            }`}
            onClick={handleStart}
            onTouchStart={handleStart}
          >
            <div className="absolute inset-0 bg-[#FAF8F5]" />
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(128, 92, 40, .055) 1px, transparent 1px), linear-gradient(0deg, rgba(128, 92, 40, .04) 1px, transparent 1px), repeating-linear-gradient(110deg, rgba(255,255,255,.42) 0 1px, transparent 1px 9px)",
                backgroundSize: "44px 44px, 44px 44px, 100% 100%",
              }}
            />
            {fallbackImage && (
              <img src={fallbackImage} alt="" className="absolute inset-0 size-full object-cover opacity-[0.13] mix-blend-multiply saturate-0" />
            )}
            {videoSrc && (
              <video src={videoSrc} muted playsInline preload="metadata" className="absolute inset-0 size-full object-cover opacity-[0.08] mix-blend-multiply" />
            )}
            <div
              className="absolute inset-0 opacity-55"
              style={{
                background:
                  fallbackGradient ??
                  "linear-gradient(135deg, rgba(255,255,255,.72), rgba(232,211,169,.52) 48%, rgba(166,114,50,.18))",
              }}
            />

            {ambientAudioSrc && <audio ref={audioRef} src={ambientAudioSrc} preload="auto" loop />}

            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
              <motion.div
                className="mb-8 space-y-3"
                animate={isOpening ? { opacity: 0, y: -12 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease }}
              >
                <p className="font-serif text-3xl italic tracking-wide text-amber-950 md:text-5xl">{title}</p>
                <p className="text-xs uppercase tracking-[0.28em] text-amber-800/75">Webgency Invitations</p>
              </motion.div>

              <div className="relative aspect-[1.42/1] w-full max-w-[760px] [perspective:1400px]">
                <div className="absolute inset-x-[5%] bottom-[10%] h-[58%] bg-[#ead8b8] shadow-[0_34px_80px_rgba(83,54,20,.18)]" />
                <div className="absolute inset-x-[5%] bottom-[10%] h-[58%] border border-amber-800/20 bg-[#f7ead2]" />
                <div
                  className="absolute inset-x-[5%] bottom-[10%] h-[58%] bg-[#ead7b4]"
                  style={{ clipPath: "polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)" }}
                />
                <motion.div
                  className="absolute inset-x-[5%] top-[10%] h-[48%] origin-bottom border border-amber-800/15 bg-[#f3e6ce] shadow-[0_24px_50px_rgba(83,54,20,.12)]"
                  style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)", transformStyle: "preserve-3d" }}
                  animate={isOpening ? { rotateX: -132, y: -22, opacity: 0.72 } : { rotateX: 0, y: 0, opacity: 1 }}
                  transition={{ duration: 1.05, ease }}
                />
                <motion.div
                  className="absolute bottom-[10%] left-[5%] h-[58%] w-[45%] origin-left border border-amber-800/10 bg-[#f0dfc1]"
                  style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)", transformStyle: "preserve-3d" }}
                  animate={isOpening ? { rotateY: 58, x: -28, opacity: 0.76 } : { rotateY: 0, x: 0, opacity: 1 }}
                  transition={{ duration: 1.05, ease, delay: 0.04 }}
                />
                <motion.div
                  className="absolute bottom-[10%] right-[5%] h-[58%] w-[45%] origin-right border border-amber-800/10 bg-[#e7d1aa]"
                  style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)", transformStyle: "preserve-3d" }}
                  animate={isOpening ? { rotateY: -58, x: 28, opacity: 0.76 } : { rotateY: 0, x: 0, opacity: 1 }}
                  transition={{ duration: 1.05, ease, delay: 0.04 }}
                />
                <div className="absolute inset-x-[10%] top-[30%] h-px bg-gradient-to-r from-transparent via-amber-800/25 to-transparent" />
                <div className="absolute inset-y-[20%] left-1/2 w-px bg-gradient-to-b from-transparent via-amber-800/20 to-transparent" />

                <motion.button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleStart();
                  }}
                  className="group absolute left-1/2 top-[53%] grid size-32 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#f9e7a7]/60 bg-[radial-gradient(circle_at_32%_28%,#fff4bd,#d5a846_42%,#9b6a1f_100%)] text-amber-950 shadow-[0_22px_55px_rgba(79,50,16,.26)] ring-8 ring-amber-200/25 transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-amber-600/25"
                  animate={isOpening ? { scale: 1.22, opacity: 0, filter: "blur(12px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.75, ease }}
                  whileTap={{ scale: 0.96 }}
                  aria-label="Ouvrir l'invitation"
                >
                  <span className="absolute inset-3 rounded-full border border-amber-50/45" />
                  <span className="absolute inset-5 rounded-full border border-amber-950/10" />
                  <span className="relative font-serif text-4xl italic tracking-wide">
                    {monogram || <Heart className="mx-auto size-9" />}
                  </span>
                  <span className="sr-only">Ouvrir le faire-part</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
