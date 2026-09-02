"use client";

import { Music2 } from "lucide-react";

export function AudioPlayer({ src }: { src?: string | null }) {
  return (
    <div className="rounded-lg border border-[var(--invitation-gold)]/25 bg-white/75 p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--invitation-primary)]">
          <Music2 className="size-4 text-[var(--invitation-gold)]" />
          Ambiance
        </div>
        <div className="flex h-8 items-end gap-1">
          {[18, 28, 14, 24, 32].map((height, index) => (
            <span
              key={height}
              className="w-1.5 animate-pulse rounded bg-[var(--invitation-gold)]"
              style={{ height, animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
      </div>
      {src ? (
        <audio src={src} controls className="w-full" />
      ) : (
        <p className="text-sm text-muted-foreground">Musique d'ambiance a ajouter depuis le dashboard.</p>
      )}
    </div>
  );
}
