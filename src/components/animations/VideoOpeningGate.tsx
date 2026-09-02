"use client";

import { type ReactNode, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";

interface VideoOpeningGateProps {
  videoSrc?: string | null;
  ambientAudioSrc?: string | null;
  onOpened?: () => void;
  children: ReactNode;
}

export function VideoOpeningGate({
  videoSrc,
  ambientAudioSrc,
  onOpened,
  children,
}: VideoOpeningGateProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  function finishOpening() {
    setIsFinished(true);
    onOpened?.();
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  }

  async function handleStart() {
    if (isPlaying) return;
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.volume = 0.42;
      audioRef.current.play().catch(() => undefined);
    }

    if (!videoSrc || !videoRef.current) {
      window.setTimeout(finishOpening, 520);
      return;
    }

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
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,.22),transparent_18rem),linear-gradient(160deg,#120d0b,#3a1d22_50%,#0f0c0b)]" />
            )}

            {ambientAudioSrc && <audio ref={audioRef} src={ambientAudioSrc} preload="auto" loop />}

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
                Touchez pour ouvrir
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`transition-opacity duration-700 ${isFinished ? "opacity-100" : "opacity-0"}`}>
        {children}
      </main>
    </div>
  );
}
