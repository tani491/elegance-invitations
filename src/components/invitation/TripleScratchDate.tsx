"use client";

import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CanvasScratch } from "@/components/ui/CanvasScratch";

function partsFromDate(date: string | null) {
  const current = date ? new Date(date) : new Date();
  return {
    day: String(current.getDate()).padStart(2, "0"),
    month: current.toLocaleDateString("fr-FR", { month: "long" }),
    year: String(current.getFullYear()),
  };
}

function googleCalendarUrl(date: string | null, title: string) {
  const current = date ? new Date(date) : new Date();
  const start = current.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${start}`;
}

export function TripleScratchDate({ date, title }: { date: string | null; title: string }) {
  const parts = partsFromDate(date);
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${date ? new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z" : ""}
END:VEVENT
END:VCALENDAR`)}`;

  return (
    <div className="text-center">
      <div className="text-center">
        <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)]">La date</p>
        <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-[var(--invitation-sheet-text)] md:text-3xl">Grattez pour révéler</h2>
      </div>
      <div className="mx-auto mt-5 h-px max-w-xs bg-gradient-to-r from-transparent via-[var(--invitation-gold)]/45 to-transparent" />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
        {[
          { label: "Jour", value: parts.day },
          { label: "Mois", value: parts.month },
          { label: "Année", value: parts.year },
        ].map((item) => (
          <CanvasScratch
            key={item.label}
            className="aspect-[3/4] rounded-t-full rounded-b-[28px] border border-[color:var(--invitation-sheet-border)] bg-white/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,.65),0_16px_38px_rgba(0,0,0,.1)]"
          >
            <div className="px-3 text-center">
              <span className="block font-serif text-[9px] uppercase tracking-[0.18em] text-[var(--invitation-sheet-muted)]">{item.label}</span>
              <strong className="mt-2 block break-words font-serif text-lg capitalize leading-tight text-[var(--invitation-sheet-text)] sm:text-2xl md:text-3xl">
                {item.value}
              </strong>
            </div>
          </CanvasScratch>
        ))}
      </div>
      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[color:var(--theme-accent)] bg-[color:var(--theme-accent)] font-serif text-xs uppercase tracking-[0.18em] text-white shadow-none hover:brightness-110"
        >
          <a href={googleCalendarUrl(date, title)} target="_blank" rel="noreferrer">
            <CalendarPlus className="size-4" />
            Google Agenda
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[color:var(--theme-accent)] bg-white/70 font-serif text-xs uppercase tracking-[0.18em] text-[var(--theme-accent)] shadow-none hover:bg-white/85"
        >
          <a download="elegance-invitation.ics" href={icsHref}>
            <CalendarPlus className="size-4" />
            Apple / iPhone
          </a>
        </Button>
      </div>
    </div>
  );
}
