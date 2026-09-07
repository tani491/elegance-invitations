"use client";

import type { PublicEventPayload } from "@/types/database.types";
import { normalizeThemeConfig, themeToCssVars } from "@/lib/theme-presets";

export function LiveMobilePreview({ event }: { event: PublicEventPayload }) {
  const names = `${event.brideName ?? "Mariee"} & ${event.groomName ?? "Marie"}`;
  const coverPhoto = event.officialPhotoUrls[0] ?? event.coverPhotoUrl;
  const theme = normalizeThemeConfig(event.theme);

  return (
    <div className="mx-auto w-full max-w-[320px] rounded-[2rem] bg-[#1A1818] p-3 shadow-2xl">
      <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-white/10" />
      <div
        className="overflow-hidden rounded-[1.25rem] border bg-white"
        style={{
          ...themeToCssVars(theme),
          borderColor: theme.accentGold ?? theme.goldColor,
          aspectRatio: "9/16",
        }}
      >
        <div className="flex h-full flex-col" style={{ background: theme.previewGradient }}>
          {coverPhoto ? (
            <img
              src={coverPhoto}
              alt="Photo de couverture"
              className="h-1/2 w-full object-cover"
            />
          ) : theme.demoVideoUrl ? (
            <video
              src={theme.demoVideoUrl}
              className="h-1/2 w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="h-1/2 bg-black/10" />
          )}
          <div className="flex flex-1 flex-col items-center justify-center bg-[var(--invitation-secondary)] p-5 text-center">
            <p className="text-3xl" style={{ color: "var(--invitation-gold)", fontFamily: "var(--font-great-vibes)" }}>
              {names}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em]" style={{ color: "var(--invitation-primary)" }}>
              {event.eventDate ? new Date(event.eventDate).toLocaleDateString("fr-FR") : "Date a definir"}
            </p>
            <p className="mt-3 text-sm" style={{ color: "var(--invitation-primary)" }}>
              {event.venueName ?? "Lieu a definir"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
