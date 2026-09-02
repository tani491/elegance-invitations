"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export function FloatingAudioPlayer({ src }: { src?: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  if (!src) return null;

  async function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    await audio.play();
    setPlaying(true);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <audio ref={audioRef} src={src ?? undefined} loop onEnded={() => setPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        className="flex size-14 items-center justify-center rounded-full border border-white/35 bg-stone-950/55 text-white shadow-2xl backdrop-blur-md"
        aria-label={playing ? "Mettre la musique en pause" : "Lancer la musique"}
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        <span className="absolute -left-14 flex items-end gap-0.5">
          {[0, 1, 2, 3].map((bar) => (
            <span
              key={bar}
              className={`w-1 rounded-full bg-[#d7bd82] ${playing ? "animate-pulse" : ""}`}
              style={{ height: `${10 + bar * 5}px`, animationDelay: `${bar * 120}ms` }}
            />
          ))}
        </span>
      </button>
    </div>
  );
}
