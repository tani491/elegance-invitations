"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface VideoOpeningGateProps {
  videoSrc?: string | null;
  ambientAudioSrc?: string | null;
  monogram?: string;
  title?: string;
  fallbackGradient?: string;
  fallbackImage?: string;
  surfaceStyle?: CSSProperties;
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
  surfaceStyle,
  onOpened,
  children,
}: VideoOpeningGateProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);
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

  function scheduleReveal(delayMs: number) {
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    fallbackTimeoutRef.current = setTimeout(finishOpening, delayMs);
  }

  function scheduleVideoReveal(video: HTMLVideoElement) {
    const revealDelay = Number.isFinite(video.duration) && video.duration > 1
      ? Math.max((video.duration - 0.8) * 1_000, 1_000)
      : CINEMATIC_EMERGENCY_MS;
    scheduleReveal(revealDelay);
  }

  function finishOpening() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    setIsRevealed(true);
    onOpened?.();
    unmountTimeoutRef.current = setTimeout(() => setIsUnmounted(true), 1_250);
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
      scheduleReveal(1_650);
      return;
    }

    try {
      const video = videoRef.current;
      video.currentTime = 0;
      scheduleVideoReveal(video);
      await video.play();
    } catch {
      scheduleReveal(1_200);
    }
  }

  return (
    <div
      style={surfaceStyle}
      className="relative min-h-[100dvh] overflow-x-hidden bg-[var(--invitation-primary)] [-webkit-overflow-scrolling:touch] md:px-6"
    >
      <div aria-hidden="true" className="fixed inset-0 z-0 h-[100dvh] w-full overflow-hidden bg-[var(--invitation-primary)]">
        {videoSrc ? (
          <video
            src={videoSrc}
            poster={fallbackImage}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="h-full w-full select-none object-cover pointer-events-none"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                fallbackGradient ??
                "linear-gradient(145deg, var(--invitation-primary) 0%, var(--invitation-accent) 52%, var(--invitation-gold) 100%)",
            }}
          />
        )}
      </div>
      <div className="fixed inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      <main
        id="invitation-content"
        className={`relative z-10 mx-auto min-h-[100dvh] w-full max-w-[440px] transition-all duration-1000 ease-out ${
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
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`fixed inset-0 z-50 h-[100dvh] w-full overflow-hidden bg-[var(--invitation-primary)] ${
              isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  fallbackGradient ??
                  "linear-gradient(145deg, #fff8ed 0%, #ead8bf 48%, #b98945 100%)",
              }}
            />
            {!videoSrc && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,.9),rgba(250,237,215,.82)_36%,rgba(196,150,79,.36)_100%)]" />
                <div className="absolute inset-0 opacity-65 [background-image:linear-gradient(90deg,rgba(139,96,39,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(139,96,39,.06)_1px,transparent_1px),repeating-linear-gradient(115deg,rgba(255,255,255,.45)_0_1px,transparent_1px_12px)] [background-size:56px_56px,56px_56px,100%_100%]" />
                <motion.div
                  className="absolute inset-x-[-12%] top-0 h-[48dvh] origin-top bg-[linear-gradient(160deg,rgba(255,251,241,.92),rgba(221,194,154,.72)_58%,rgba(150,103,44,.16))] shadow-[0_26px_70px_rgba(116,76,26,.2)] [clip-path:polygon(0_0,100%_0,50%_100%)]"
                  animate={isPlaying ? { y: "-54%", rotateX: 62 } : { y: 0, rotateX: 0 }}
                  transition={{ duration: 1.05, ease: revealEase }}
                />
                <motion.div
                  className="absolute inset-x-[-10%] bottom-0 h-[57dvh] bg-[linear-gradient(20deg,rgba(235,213,179,.88),rgba(255,249,238,.78)_46%,rgba(190,143,75,.22))] [clip-path:polygon(0_100%,100%_100%,50%_0)]"
                  animate={isPlaying ? { y: "58%" } : { y: 0 }}
                  transition={{ duration: 1.05, ease: revealEase }}
                />
                <motion.div
                  className="absolute left-[-18%] top-[24dvh] h-[72dvh] w-[68%] bg-[linear-gradient(55deg,rgba(232,208,169,.85),rgba(255,249,238,.42))] [clip-path:polygon(0_0,100%_50%,0_100%)]"
                  animate={isPlaying ? { x: "-55%" } : { x: 0 }}
                  transition={{ duration: 1.05, ease: revealEase }}
                />
                <motion.div
                  className="absolute right-[-18%] top-[24dvh] h-[72dvh] w-[68%] bg-[linear-gradient(305deg,rgba(232,208,169,.85),rgba(255,249,238,.42))] [clip-path:polygon(100%_0,0_50%,100%_100%)]"
                  animate={isPlaying ? { x: "55%" } : { x: 0 }}
                  transition={{ duration: 1.05, ease: revealEase }}
                />
              </>
            )}

            {videoSrc && (
              <video
                ref={videoRef}
                src={videoSrc}
                poster={fallbackImage}
                playsInline
                muted
                preload="auto"
                onLoadedMetadata={() => {
                  if (startedRef.current && videoRef.current) scheduleVideoReveal(videoRef.current);
                }}
                onTimeUpdate={handleVideoProgress}
                onEnded={finishOpening}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,253,249,.9), var(--invitation-gold-line) 44%, transparent 70%)",
              }}
              initial={false}
              animate={isPlaying ? { opacity: [0, 0.95, 0], scale: [0.45, 2.4, 3.3] } : { opacity: 0, scale: 0.45 }}
              transition={{ duration: 1.45, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />

            <motion.button
              type="button"
              onClick={() => void handleStart()}
              className={`absolute inset-0 z-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--invitation-gold)] ${
                isPlaying ? "pointer-events-none" : ""
              }`}
              aria-label="Appuyez pour ouvrir"
            />
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8 text-center">
              <motion.div
                className="flex flex-col items-center"
                animate={isPlaying ? { opacity: 0, scale: 0.84, y: 10 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: revealEase }}
              >
                <span
                  className="relative grid size-20 place-items-center rounded-full text-[#FFFDF9] shadow-[0_18px_55px_rgba(0,0,0,.34),inset_0_0_0_1px_rgba(255,253,249,.42)] ring-4 ring-[var(--invitation-gold-line)]"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 28%, #FFFDF9, var(--invitation-gold) 36%, var(--invitation-accent) 72%, var(--invitation-primary) 100%)",
                  }}
                >
                  <span className="absolute inset-3 rounded-full border border-[#FFFDF9]/45" />
                  <span className="font-serif text-2xl italic tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,.26)]">{monogram}</span>
                </span>
              </motion.div>
            </div>
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-8 z-10 px-6 text-center"
              animate={isPlaying ? { opacity: 0, y: 12 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: revealEase }}
            >
              <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--invitation-gold)] drop-shadow-md">
                Appuyez pour ouvrir
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
