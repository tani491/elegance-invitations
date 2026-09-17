"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const HEX_COLOR_PATTERN = /^#[0-9A-F]{6}$/;

const ELEGANCE_COLOR_SWATCHES = [
  { label: "Or Imperial", value: "#D4AF37" },
  { label: "Vert Emeraude", value: "#0B3B24" },
  { label: "Rose Poudre", value: "#E8C5C8" },
  { label: "Bleu Nuit", value: "#0F172A" },
  { label: "Ivoire", value: "#FDFBF7" },
];

function normalizeHexDraft(value: string) {
  const cleaned = value.replace(/[^0-9a-fA-F#]/g, "").replace(/(?!^)#/g, "");
  const withHash = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  return withHash.slice(0, 7).toUpperCase();
}

function isCompleteHex(value: string) {
  return HEX_COLOR_PATTERN.test(value.trim().toUpperCase());
}

function safeHex(value: string, fallback = "#D4AF37") {
  const normalized = normalizeHexDraft(value);
  return isCompleteHex(normalized) ? normalized : fallback;
}

export function ColorPicker({
  label,
  value,
  onChange,
  className,
  fallback = "#D4AF37",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  fallback?: string;
}) {
  const normalizedValue = useMemo(() => safeHex(value, fallback), [fallback, value]);
  const [draft, setDraft] = useState(normalizedValue);

  useEffect(() => {
    setDraft(normalizedValue);
  }, [normalizedValue]);

  function commit(nextValue: string) {
    const nextDraft = normalizeHexDraft(nextValue);
    setDraft(nextDraft);

    if (isCompleteHex(nextDraft)) {
      onChange(nextDraft);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={safeHex(draft, normalizedValue)}
          onChange={(event) => commit(event.target.value)}
          className="h-12 min-h-12 w-14 shrink-0 cursor-pointer rounded-xl border-[#D4AF37]/30 bg-transparent p-1"
          aria-label={`Choisir ${label}`}
        />
        <Input
          type="text"
          value={draft}
          maxLength={7}
          onChange={(event) => commit(event.target.value)}
          onBlur={() => {
            if (!isCompleteHex(draft)) setDraft(normalizedValue);
          }}
          placeholder="#D4AF37"
          className="h-12 min-h-12 flex-1 rounded-xl border-[#D4AF37]/20 bg-white px-3 text-sm uppercase text-[#171312]"
          inputMode="text"
          pattern="^#[0-9A-Fa-f]{6}$"
          aria-label={`${label} au format hexadecimal`}
        />
      </div>
      <div className="flex flex-wrap gap-2" aria-label={`Couleurs rapides pour ${label}`}>
        {ELEGANCE_COLOR_SWATCHES.map((swatch) => (
          <button
            key={swatch.value}
            type="button"
            className="min-h-12 min-w-12 rounded-xl border border-[#E5D9C7] shadow-sm ring-offset-2 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248]"
            style={{ backgroundColor: swatch.value }}
            onClick={() => commit(swatch.value)}
            aria-label={`Appliquer ${swatch.label} ${swatch.value}`}
            title={`${swatch.label} ${swatch.value}`}
          />
        ))}
      </div>
    </div>
  );
}
