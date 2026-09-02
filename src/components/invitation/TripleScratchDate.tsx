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
    <div className="rounded-lg border border-[var(--invitation-gold)]/30 bg-white/80 p-5 shadow-lg">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Save the date</p>
        <h2 className="mt-2 font-serif text-3xl text-[var(--invitation-primary)]">Grattez la date</h2>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Jour", value: parts.day },
          { label: "Mois", value: parts.month },
          { label: "Annee", value: parts.year },
        ].map((item) => (
          <CanvasScratch key={item.label} className="aspect-[4/5] border border-[#d7bd82]/50 bg-[#fffaf0]">
            <div className="px-2 text-center">
              <span className="block text-[10px] uppercase tracking-[0.16em] text-stone-500">{item.label}</span>
              <strong className="mt-2 block font-serif text-2xl capitalize text-stone-950 md:text-3xl">{item.value}</strong>
            </div>
          </CanvasScratch>
        ))}
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline">
          <a href={googleCalendarUrl(date, title)} target="_blank" rel="noreferrer">
            <CalendarPlus className="size-4" />
            Google Agenda
          </a>
        </Button>
        <Button asChild variant="outline">
          <a download="elegance-invitation.ics" href={icsHref}>
            <CalendarPlus className="size-4" />
            Apple Calendar
          </a>
        </Button>
      </div>
    </div>
  );
}
