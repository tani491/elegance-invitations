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
  const [isRevealed, setIsRevealed] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [hasVideoLoaded, setHasVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
    };
  }, []);

  function finishOpening() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsRevealed(true);
    onOpened?.();
    unmountTimeoutRef.current = setTimeout(() => setIsUnmounted(true), 1_050);
    setTimeout(() => {
      document.getElementById("invitation-content")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 80);
  }

  function handleVideoProgress() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    if (video.duration > 1 && video.currentTime >= video.duration - 0.8) {
      finishOpening();
    }
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
        {!isUnmounted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#110d0a] transition-all duration-1000 ease-out ${
              isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            onClick={handleStart}
            onTouchStart={handleStart}
          >
            {fallbackImage && <img src={fallbackImage} alt="" className="absolute inset-0 size-full object-cover opacity-45 blur-sm scale-105" />}
            <div
              className="absolute inset-0"
              style={{
                background: fallbackGradient ?? "radial-gradient(circle at 50% 28%, rgba(251, 191, 36, .20), transparent 18rem), linear-gradient(160deg, #140f0d, #392018 52%, #0d0b09)",
              }}
            />
            {videoSrc ? (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={fallbackImage}
                playsInline
                muted
                preload="auto"
                onLoadedData={() => setHasVideoLoaded(true)}
                onTimeUpdate={handleVideoProgress}
                onEnded={finishOpening}
                className={`relative z-0 h-full w-full object-cover transition-opacity duration-700 ${
                  hasVideoLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,.20),transparent_18rem)]" />
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/20" />

            {ambientAudioSrc && <audio ref={audioRef} src={ambientAudioSrc} preload="auto" loop />}

            <div className={`pointer-events-none absolute inset-x-6 top-16 text-center text-white transition-opacity duration-500 ${isPlaying ? "opacity-0" : "opacity-100"}`}>
              <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-amber-300/40 bg-white/10 font-script text-4xl text-amber-200 shadow-[0_0_45px_rgba(251,191,36,.25)] backdrop-blur-md">
                {monogram}
              </div>
              <p className="mt-5 font-serif text-xs uppercase tracking-[0.24em] text-amber-100/85">{title}</p>
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
                className="absolute bottom-16 left-1/2 flex -translate-x-1/2 animate-pulse items-center gap-3 rounded-full border border-amber-300/40 bg-white/10 px-6 py-3 font-serif text-xs uppercase tracking-[0.22em] text-amber-50 shadow-[0_0_45px_rgba(251,191,36,.18)] backdrop-blur-md transition-opacity duration-500 hover:bg-white/20"
              >
                <span className="relative flex size-8 items-center justify-center rounded-full bg-amber-200/15">
                  <span className="absolute inset-0 animate-ping rounded-full bg-amber-200/20" />
                  <Play className="relative size-4 fill-current" />
                </span>
                Ouvrir l&apos;invitation
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main
        id="invitation-content"
        className={`transition-all duration-1000 ease-out ${
          isRevealed ? "animate-in fade-in slide-in-from-bottom-6 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
