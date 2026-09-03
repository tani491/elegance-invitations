"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const CINEMATIC_EMERGENCY_MS = 30_000;
const revealEase = [0.16, 1, 0.3, 1] as const;

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
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      if (unmountTimeoutRef.current) clearTimeout(unmountTimeoutRef.current);
    };
  }, []);

  function finishOpening() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    setIsRevealed(true);
    onOpened?.();
    unmountTimeoutRef.current = setTimeout(() => setIsUnmounted(true), 1_100);
  }

  function handleVideoProgress() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 1) return;
    if (video.currentTime >= video.duration - 0.8) {
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
      fallbackTimeoutRef.current = setTimeout(finishOpening, 1_000);
      return;
    }

    try {
      const video = videoRef.current;
      video.currentTime = 0;
      const revealDelay = Number.isFinite(video.duration) && video.duration > 1
        ? Math.max((video.duration - 0.8) * 1_000, 1_000)
        : CINEMATIC_EMERGENCY_MS;
      fallbackTimeoutRef.current = setTimeout(finishOpening, revealDelay);
      await video.play();
    } catch {
      finishOpening();
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#f5efe7] md:px-6">
      <main
        id="invitation-content"
        className={`mx-auto min-h-[100svh] w-full max-w-[440px] transition-all duration-1000 ease-out ${
          isRevealed ? "animate-in fade-in slide-in-from-bottom-6 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        {children}
      </main>
      {ambientAudioSrc && <audio ref={audioRef} src={ambientAudioSrc} preload="auto" loop />}

      <AnimatePresence>
        {!isUnmounted && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={isRevealed ? { opacity: 0 } : { opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`fixed inset-0 z-50 min-h-[100svh] overflow-hidden bg-[#2a2119] ${
              isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
            onClick={() => void handleStart()}
            onTouchStart={() => void handleStart()}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  fallbackGradient ??
                  "linear-gradient(145deg, #5c1d24 0%, #b8894d 52%, #fff8ed 100%)",
              }}
            />
            {fallbackImage && (
              <img
                src={fallbackImage}
                alt=""
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
                  hasVideoLoaded && videoSrc ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
            {videoSrc && (
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
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
                  hasVideoLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
              <motion.button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleStart();
                }}
                className="group flex flex-col items-center focus-visible:outline-none"
                animate={isPlaying ? { opacity: 0, scale: 0.96, y: 14 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.65, ease: revealEase }}
                aria-label="Appuyez pour ouvrir"
              >
                <span className="relative grid size-32 place-items-center rounded-full border border-[#fff0b8]/55 bg-[radial-gradient(circle_at_35%_28%,#fff3bc,#d8aa45_42%,#8e5c1b_100%)] text-amber-950 shadow-[0_24px_70px_rgba(0,0,0,.38),inset_0_0_0_1px_rgba(255,255,255,.32)] ring-8 ring-amber-200/15">
                  <span className="absolute inset-3 rounded-full border border-amber-50/45" />
                  <span className="absolute inset-5 rounded-full border border-amber-950/10" />
                  <span className="font-serif text-4xl italic tracking-wide">{monogram}</span>
                </span>
                <span className="mt-8 font-serif text-2xl italic tracking-wide text-[#fff6df] drop-shadow-[0_2px_12px_rgba(0,0,0,.65)]">
                  Appuyez pour ouvrir
                </span>
                <span className="mt-4 text-xs uppercase tracking-[0.28em] text-amber-100/80">
                  Élégance Invitations
                </span>
                <span className="mt-3 max-w-xs font-serif text-base italic leading-7 text-white/75">{title}</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
