"use client";

import { useMemo, useState } from "react";
import { Search, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ScannerGuest = {
  id: string;
  fullName: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  qrToken: string;
  table?: string | null;
  isCheckedIn: boolean;
  checkedInAt?: string | null;
};

export function ManualCheckInInput({
  guests,
  disabled,
  onSubmit,
}: {
  guests: ScannerGuest[];
  disabled?: boolean;
  onSubmit: (token: string) => void;
}) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const matches = useMemo(() => {
    if (trimmedQuery.length < 2) return [];
    const normalized = trimmedQuery.toLowerCase();
    return guests
      .filter((guest) => {
        const haystack = `${guest.fullName} ${guest.firstName ?? ""} ${guest.lastName ?? ""} ${guest.phone ?? ""} ${guest.qrToken}`.toLowerCase();
        return haystack.includes(normalized);
      })
      .slice(0, 6);
  }, [guests, trimmedQuery]);

  function submitToken(token = trimmedQuery) {
    if (!token || disabled) return;
    onSubmit(token);
    setQuery("");
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          submitToken();
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/45" />
          <Input
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom invite ou token QR"
            className="border-white/10 bg-black/25 pl-9 text-white placeholder:text-white/45"
          />
        </div>
        <Button type="submit" disabled={disabled || !trimmedQuery} className="bg-[#2DD4BF] text-[#052e24] hover:bg-[#5EEAD4]">
          <ScanLine className="size-4" />
        </Button>
      </form>

      {matches.length > 0 && (
        <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/25">
          {matches.map((guest) => (
            <button
              key={guest.id}
              type="button"
              disabled={disabled}
              onClick={() => submitToken(guest.qrToken)}
              className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-3 py-3 text-left text-sm text-white last:border-b-0 hover:bg-white/10 disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold">{guest.fullName}</span>
                <span className="block truncate text-xs text-white/55">{guest.phone || guest.qrToken}</span>
              </span>
              <span className={`shrink-0 rounded px-2 py-1 text-xs ${guest.isCheckedIn ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                {guest.isCheckedIn ? "deja entre" : "a valider"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
