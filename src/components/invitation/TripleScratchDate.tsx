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
    <section className="text-center">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">Save the date</p>
        <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-amber-950 md:text-3xl">Grattez la date</h2>
      </div>
      <div className="mx-auto mt-5 h-px max-w-xs bg-gradient-to-r from-transparent via-[var(--invitation-gold)]/45 to-transparent" />
      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-5">
        {[
          { label: "Jour", value: parts.day },
          { label: "Mois", value: parts.month },
          { label: "Annee", value: parts.year },
        ].map((item) => (
          <CanvasScratch
            key={item.label}
            className="aspect-square rounded-full border border-[var(--invitation-gold)]/45 bg-[#fffaf0]/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,.65),0_16px_38px_rgba(120,82,26,.08)]"
          >
            <div className="px-3 text-center">
              <span className="block text-[9px] uppercase tracking-[0.18em] text-amber-800/65">{item.label}</span>
              <strong className="mt-2 block break-words font-serif text-lg capitalize leading-tight text-amber-950 sm:text-2xl md:text-3xl">
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
          className="rounded-full border-[var(--invitation-gold)]/35 bg-[#FAF8F5]/60 text-xs uppercase tracking-[0.18em] text-amber-950 shadow-none hover:bg-[var(--invitation-gold)]/10"
        >
          <a href={googleCalendarUrl(date, title)} target="_blank" rel="noreferrer">
            <CalendarPlus className="size-4" />
            Google Agenda
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-[var(--invitation-gold)]/35 bg-[#FAF8F5]/60 text-xs uppercase tracking-[0.18em] text-amber-950 shadow-none hover:bg-[var(--invitation-gold)]/10"
        >
          <a download="elegance-invitation.ics" href={icsHref}>
            <CalendarPlus className="size-4" />
            Apple Calendar
          </a>
        </Button>
      </div>
    </section>
  );
}
