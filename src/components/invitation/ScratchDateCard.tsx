"use client";

import { useRef, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicEventPayload } from "@/types/database.types";

function calendarDates(eventDate: string | null) {
  const start = eventDate ? new Date(eventDate) : new Date();
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `${format(start)}/${format(end)}`;
}

export function ScratchDateCard({ event }: { event: PublicEventPayload }) {
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "Date a confirmer";
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${calendarDates(event.eventDate)}&location=${encodeURIComponent(event.venueAddress ?? event.venueName ?? "")}`;
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(`BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.name}\nDTSTART:${calendarDates(event.eventDate).split("/")[0]}\nDTEND:${calendarDates(event.eventDate).split("/")[1]}\nLOCATION:${event.venueAddress ?? event.venueName ?? ""}\nEND:VEVENT\nEND:VCALENDAR`)}`;

  return (
    <div ref={cardRef} className="relative overflow-hidden rounded-lg border border-[var(--invitation-gold)]/30 bg-white/80 p-6 text-center shadow-lg">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Save the date</p>
      <p className="mt-3 font-display-bold text-3xl text-[var(--invitation-primary)]">{dateLabel}</p>
      {!revealed && (
        <button
          type="button"
          className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#8B681C,#F7D985,#B8872A)] text-sm font-semibold uppercase tracking-[0.16em] text-[#24170A]"
          onPointerMove={() => setRevealed(true)}
          onClick={() => setRevealed(true)}
        >
          Grattez pour devoiler
        </button>
      )}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={googleUrl} target="_blank" rel="noreferrer">
            <CalendarPlus className="mr-2 size-4" />
            Google Agenda
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={icsHref} download={`${event.slug}.ics`}>
            Apple Calendar
          </a>
        </Button>
      </div>
    </div>
  );
}
