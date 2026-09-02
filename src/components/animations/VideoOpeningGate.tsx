"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";

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

const OPENING_TIMEOUT_MS = 4_800;

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function finishOpening() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsFinished(true);
    onOpened?.();
    setTimeout(() => {
      document.getElementById("invitation-content")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 80);
  }

  async function handleStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.volume = 0.42;
      audioRef.current.play().catch(() => undefined);
    }

    if (!videoSrc || !videoRef.current) {
      timeoutRef.current = setTimeout(finishOpening, 900);
      return;
    }

    timeoutRef.current = setTimeout(finishOpening, OPENING_TIMEOUT_MS);

    try {
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
    } catch {
      finishOpening();
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#FAF8F5]">
      <AnimatePresence>
        {!isFinished && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
            onClick={handleStart}
            onTouchStart={handleStart}
          >
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                playsInline
                muted
                preload="auto"
                onEnded={finishOpening}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                {fallbackImage && <img src={fallbackImage} alt="" className="absolute inset-0 size-full object-cover opacity-70" />}
                <div
                  className="absolute inset-0"
                  style={{
                    background: fallbackGradient ?? "radial-gradient(circle at 50% 28%, rgba(255,255,255,.22), transparent 18rem), linear-gradient(160deg, #120d0b, #3a1d22 50%, #0f0c0b)",
                  }}
                />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}

            {ambientAudioSrc && <audio ref={audioRef} src={ambientAudioSrc} preload="auto" loop />}

            <div className="pointer-events-none absolute inset-x-6 top-16 text-center text-white">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-white/35 bg-white/10 font-script text-4xl text-[var(--invitation-gold,#D4AF37)] shadow-2xl backdrop-blur-md">
                {monogram}
              </div>
              <p className="mt-5 font-display-bold text-xs uppercase tracking-[0.24em] text-white/80">{title}</p>
            </div>

            {!isPlaying && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.45 }}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleStart();
                }}
                className="absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-white/15 px-6 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-2xl backdrop-blur-md transition hover:bg-white/25"
              >
                <span className="relative flex size-8 items-center justify-center rounded-full bg-white/20">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
                  <Play className="relative size-4 fill-current" />
                </span>
                Ouvrir l&apos;invitation
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main id="invitation-content" className={`transition-opacity duration-700 ${isFinished ? "opacity-100" : "opacity-0"}`}>
        {children}
      </main>
    </div>
  );
}
