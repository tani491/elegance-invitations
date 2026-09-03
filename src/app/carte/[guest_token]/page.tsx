import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, Crown, MapPin, Sparkles, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PassQrCode } from "@/components/invitation/PassQrCode";
import { DEFAULT_PROGRAM, getDefaultTheme, parseJsonArray, themeToCssVars } from "@/lib/theme-presets";
import { serializeTheme } from "@/lib/theme-store";
import { db } from "@/lib/db";
import type { ProgramStep } from "@/types/database.types";

function formatEventDate(date: Date | null) {
  if (!date) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(date);
}

export default async function GuestPassPage({ params }: { params: Promise<{ guest_token: string }> }) {
  const { guest_token } = await params;
  const guest = await db.eventGuest.findUnique({
    where: { qrToken: guest_token },
    include: {
      event: {
        include: { theme: true },
      },
    },
  });

  if (!guest || !guest.event.isActive) notFound();

  const event = guest.event;
  const baseTheme = event.theme ? serializeTheme(event.theme) : getDefaultTheme(event.template);
  const theme = {
    ...baseTheme,
    primaryColor: event.primaryColor ?? baseTheme.primaryColor,
    secondaryColor: event.secondaryColor ?? baseTheme.secondaryColor,
    accentColor: event.accentColor ?? baseTheme.accentColor,
    goldColor: event.goldColor ?? baseTheme.goldColor,
    titleFont: event.titleFont ?? baseTheme.titleFont,
  };
  const officialPhotos = parseJsonArray<string>(event.officialPhotoUrls, []);
  const heroPhoto = event.coverPhotoUrl ?? officialPhotos[0] ?? null;
  const program = parseJsonArray<ProgramStep>(event.program, DEFAULT_PROGRAM).slice(0, 3);
  const names = `${event.brideName ?? "Mariée"} & ${event.groomName ?? "Marié"}`;
  const eventDate = formatEventDate(event.eventDate);
  const invitationHref = `/invitation/${event.slug}?guest=${encodeURIComponent(guest.qrToken)}`;
  const passStyle = {
    ...themeToCssVars(theme),
    backgroundImage:
      "linear-gradient(90deg, rgba(151,112,47,.04) 1px, transparent 1px), linear-gradient(0deg, rgba(151,112,47,.035) 1px, transparent 1px), linear-gradient(180deg, #fffaf3 0%, #f5efe7 100%)",
    backgroundSize: "44px 44px, 44px 44px, 100% 100%",
  };

  return (
    <div className="min-h-[100svh] bg-[#19110d] px-4 py-6 text-[#2f251f] md:py-10">
      <main className="mx-auto max-w-[430px]">
        <section
          style={passStyle}
          className="relative overflow-hidden rounded-[30px] border border-amber-200/70 bg-[#fffaf3] shadow-[0_28px_90px_rgba(0,0,0,.35)]"
        >
          <div className="relative h-72 overflow-hidden">
            {heroPhoto ? (
              <img src={heroPhoto} alt={names} className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: theme.previewGradient }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute left-5 top-5">
              <Badge className="rounded-full border border-amber-200/45 bg-black/25 px-3 py-1 font-serif text-[10px] uppercase tracking-[0.24em] text-amber-50 backdrop-blur">
                {guest.isVip ? "VIP" : "Invité"}
              </Badge>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-6 pb-8 text-center">
              <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-100/85">
                Pass Invité Privé
              </p>
              <h1 className="mt-4 font-serif text-5xl font-light italic leading-none text-[#fff7e4] drop-shadow-[0_2px_18px_rgba(0,0,0,.55)]">
                {names}
              </h1>
            </div>
          </div>

          <div className="px-5 pb-6">
            <div className="relative -mt-10 rounded-[24px] border border-amber-300/45 bg-[#fffaf3]/95 p-5 text-center shadow-[0_18px_45px_rgba(93,62,18,.16)] backdrop-blur">
              <p className="font-serif text-[11px] uppercase tracking-[0.24em] text-amber-900/65">Bienvenue</p>
              <h2 className="mt-2 font-serif text-3xl italic text-amber-950">{guest.fullName}</h2>
              <div className="mx-auto mt-5 inline-flex rounded-[22px] border border-amber-300/45 bg-white/65 p-3">
                <PassQrCode value={guest.qrToken} />
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">{guest.accessCode}</p>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-amber-200/60 bg-white/55 p-4">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 size-5 text-[var(--invitation-gold)]" />
                  <div>
                    <p className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/60">Date</p>
                    <p className="mt-1 font-serif text-base leading-6 text-amber-950">{eventDate}</p>
                    {event.eventTime && <p className="font-serif text-sm text-stone-600">{event.eventTime}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200/60 bg-white/55 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 text-[var(--invitation-gold)]" />
                  <div>
                    <p className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/60">Lieu</p>
                    <p className="mt-1 font-serif text-base leading-6 text-amber-950">{event.venueName ?? "Lieu à confirmer"}</p>
                    {event.venueAddress && <p className="font-serif text-sm leading-6 text-stone-600">{event.venueAddress}</p>}
                  </div>
                </div>
              </div>
            </div>

            {program.length > 0 && (
              <div className="mt-5 rounded-2xl border border-amber-200/60 bg-white/55 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Clock className="size-4 text-[var(--invitation-gold)]" />
                  <p className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/60">Aperçu du programme</p>
                </div>
                <div className="space-y-3">
                  {program.map((step, index) => (
                    <div key={`${step.time}-${step.title}-${index}`} className="grid grid-cols-[54px_1fr] gap-3">
                      <time className="font-serif text-sm italic text-[var(--invitation-gold)]">{step.time}</time>
                      <div>
                        <p className="font-serif text-sm font-semibold text-amber-950">{step.title}</p>
                        {step.location && <p className="text-xs text-stone-500">{step.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-amber-200/60 bg-white/55 p-4">
              <div className="flex items-center gap-3">
                <UsersRound className="size-5 text-[var(--invitation-gold)]" />
                <div>
                  <p className="font-serif text-sm text-amber-950">
                    {guest.table ? `Table ${guest.table}` : "Table à confirmer"}
                  </p>
                  <p className="text-xs text-stone-500">
                    {guest.maxGuests > 1 ? `${guest.maxGuests} personnes autorisées` : "Accès nominatif"}
                  </p>
                </div>
              </div>
            </div>

            <Button
              asChild
              className="mt-6 h-[52px] w-full rounded-full border border-[#fff0b8]/70 bg-[linear-gradient(135deg,#fff1b8,#d8aa45_48%,#9b661f)] font-serif text-xs uppercase tracking-[0.22em] text-amber-950 shadow-[0_18px_40px_rgba(103,70,21,.24)] hover:brightness-105"
            >
              <Link href={invitationHref}>
                <Crown className="size-4" />
                Ouvrir l&apos;invitation
              </Link>
            </Button>
          </div>
        </section>

        <p className="mt-6 flex items-center justify-center gap-2 text-center font-serif text-xs uppercase tracking-[0.22em] text-amber-100/60">
          <Sparkles className="size-3" />
          Élégance Invitations
        </p>
      </main>
    </div>
  );
}
