"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuilderConfig } from "@/types/builder.types";

export function StepGuests({
  config,
  onChange,
}: {
  config: BuilderConfig;
  onChange: (patch: Pick<BuilderConfig, "guestLinkCount" | "versionCount">) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <Label htmlFor="guestLinkCount">Liens personnalises nominatifs</Label>
        <Input
          id="guestLinkCount"
          type="number"
          min="0"
          value={config.guestLinkCount}
          onChange={(event) => onChange({ guestLinkCount: Math.max(Number(event.target.value), 0), versionCount: config.versionCount })}
          className="mt-3"
        />
        <p className="mt-2 text-sm text-stone-500">+3 EUR par invite, avec URL et pass individuel.</p>
      </div>
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <Label htmlFor="versionCount">Versions d'invitations distinctes</Label>
        <Input
          id="versionCount"
          type="number"
          min="1"
          value={config.versionCount}
          onChange={(event) => onChange({ guestLinkCount: config.guestLinkCount, versionCount: Math.max(Number(event.target.value), 1) })}
          className="mt-3"
        />
        <p className="mt-2 text-sm text-stone-500">La premiere version est incluse, puis +15 EUR par version.</p>
      </div>
    </div>
  );
}
