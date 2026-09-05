"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle, Download, Flower2, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VideoOpeningGate } from "@/components/animations/VideoOpeningGate";
import { DressCodeSection } from "@/components/invitation/DressCodeSection";
import { GiftListIBAN } from "@/components/invitation/GiftListIBAN";
import { TimelineSection } from "@/components/invitation/TimelineSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { themeToCssVars } from "@/lib/theme-presets";
import type { PublicEventPayload } from "@/types/database.types";

type VideoTheme = PublicEventPayload["theme"] & {
  videoUrl?: string | null;
  customVideoUrl?: string | null;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function countdownParts(date: string | null) {
  if (!date) return { jours: 0, heures: 0, minutes: 0, secondes: 0 };
  const diff = Math.max(new Date(date).getTime() - Date.now(), 0);
  return {
    jours: Math.floor(diff / 86_400_000),
    heures: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    secondes: Math.floor((diff / 1_000) % 60),
  };
}

function calendarCells(date: string | null) {
  const current = date ? new Date(date) : new Date();
  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayStartIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: Array<number | null> = Array.from({ length: mondayStartIndex }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);

  return {
    cells,
    monthLabel: current.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    weddingDay: date ? current.getDate() : null,
  };
}

function openingVideoSource(theme: PublicEventPayload["theme"]) {
  const videoTheme = theme as VideoTheme;
  return videoTheme.videoUrl ?? videoTheme.customVideoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

function RoyalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-20 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
      <Flower2 className="size-4 text-amber-500/75" />
      <span className="h-px w-20 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-xs font-semibold uppercase tracking-[0.3em] text-amber-800">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl font-light italic leading-tight text-amber-950">{title}</h2>
    </div>
  );
}

function StorySection({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      className={`relative px-6 py-16 ${className}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.85, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

function SaveDateCalendar({ eventDate, eventName }: { eventDate: string | null; eventName: string }) {
  if (!eventDate) {
    return (
      <div className="mx-auto mt-9 max-w-xs border-y border-amber-300/50 bg-[#fff7ea]/35 px-5 py-8 text-center font-serif text-lg italic text-amber-950 backdrop-blur-[1px]">
        Date à confirmer
      </div>
    );
  }

  const calendar = calendarCells(eventDate);
  const calendarInstant = new Date(eventDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const calendarHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventName)}&dates=${calendarInstant}/${calendarInstant}`;

  return (
    <div className="mx-auto mt-9 max-w-xs">
      <div className="border-y border-amber-300/50 bg-[#fff7ea]/35 px-5 py-6 backdrop-blur-[1px]">
        <div className="flex items-center justify-between gap-4">
          <CalendarDays className="size-5 text-[var(--invitation-gold)]" />
          <p className="text-right font-serif text-xs font-semibold uppercase tracking-[0.24em] text-amber-900/70">
            {calendar.monthLabel}
          </p>
        </div>
        <div className="mt-6 grid grid-cols-7 gap-y-3 text-center">
          {WEEKDAYS.map((day) => (
            <span key={day} className="font-serif text-[10px] uppercase tracking-[0.2em] text-amber-900/45">
              {day}
            </span>
          ))}
          {calendar.cells.map((day, index) => {
            const isWeddingDay = day !== null && day === calendar.weddingDay;
            return (
              <span key={`${day ?? "empty"}-${index}`} className="grid h-8 place-items-center font-serif text-sm text-stone-700/75">
                {day && (
                  <span
                    className={
                      isWeddingDay
                        ? "grid size-8 place-items-center rounded-full border border-amber-400/80 bg-amber-100/45 text-amber-950 drop-shadow-[0_2px_10px_rgba(217,119,6,0.3)]"
                        : ""
                    }
                  >
                    {day}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        className="mx-auto mt-6 flex h-11 w-fit rounded-full border-amber-400/35 bg-[#fff7ea]/35 px-5 font-serif text-xs uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-100/35"
      >
        <a
          href={calendarHref}
          target="_blank"
          rel="noreferrer"
        >
          Ajouter à l&apos;agenda
        </a>
      </Button>
    </div>
  );
}

function RSVPForm({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [plusOnes, setPlusOnes] = useState("0");
  const [done, setDone] = useState(false);

  const whatsappHref = useMemo(() => {
    if (!event.organizerPhone) return null;
    const phone = event.organizerPhone.replace(/[^\d+]/g, "").replace(/^\+/, "");
    const text = encodeURIComponent(`Bonjour, je confirme ma réponse pour ${event.name}.`);
    return `https://wa.me/${phone}?text=${text}`;
  }, [event.name, event.organizerPhone]);

  async function submit() {
    if (!guestToken) {
      toast.error("Ouvrez votre lien personnel pour confirmer votre RSVP.");
      return;
    }

    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestToken, status, plusOnes: Number(plusOnes), guestName }),
    });
    const json = await response.json();

    if (!response.ok || !json.success) {
      toast.error(json.error ?? "RSVP impossible.");
      return;
    }

    setDone(true);
    toast.success("RSVP enregistrée.");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CheckCircle className="size-12 text-[var(--invitation-gold)]" />
        <p className="mt-5 font-serif text-2xl italic leading-8 text-amber-950">Merci, votre réponse est enregistrée.</p>
        {whatsappHref && (
          <Button
            asChild
            variant="outline"
            className="mt-7 h-11 rounded-full border-amber-400/35 bg-transparent px-5 font-serif text-xs uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-100/30"
          >
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto mt-9 max-w-sm space-y-5">
      <div className="space-y-2">
        <Label className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/70">Nom de l&apos;invité</Label>
        <Input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Votre nom complet"
          className="h-12 rounded-full border-amber-300/45 bg-[#fff7ea]/45 px-5 font-serif text-base text-amber-950 placeholder:text-stone-500/55 focus-visible:ring-amber-400/25"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/70">Statut</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-12 rounded-full border-amber-300/45 bg-[#fff7ea]/45 px-5 font-serif text-base text-amber-950 focus:ring-amber-400/25">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-amber-200 bg-[#fff7ea] font-serif text-amber-950">
            <SelectItem value="confirmed">Présent</SelectItem>
            <SelectItem value="declined">Absent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/70">Accompagnants</Label>
        <Input
          type="number"
          min="0"
          max="10"
          value={plusOnes}
          onChange={(event) => setPlusOnes(event.target.value)}
          className="h-12 rounded-full border-amber-300/45 bg-[#fff7ea]/45 px-5 font-serif text-base text-amber-950 focus-visible:ring-amber-400/25"
        />
      </div>
      <Button
        onClick={submit}
        className="h-12 w-full rounded-full border border-[#f8e8aa]/65 bg-[linear-gradient(135deg,#fae9a6,#d6a848_48%,#9d6820)] font-serif text-xs uppercase tracking-[0.24em] text-amber-950 hover:brightness-105"
      >
        Confirmer
      </Button>
    </div>
  );
}

function WhatsAppCelebrationCTA({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <StorySection className="text-center">
      <SectionTitle eyebrow="Groupe WhatsApp" title="La célébration en direct" />
      <p className="mx-auto mt-6 max-w-xs font-serif text-lg italic leading-8 text-stone-700/75">
        Les souvenirs, vidéos et messages des proches réunis dans un même salon.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#f8e8aa]/65 bg-[linear-gradient(135deg,#fae9a6,#d6a848_48%,#9d6820)] px-5 py-3 text-center font-serif text-xs uppercase tracking-[0.15em] text-amber-950 transition hover:brightness-105"
      >
        <MessageCircle className="size-4 shrink-0" />
        <span>Rejoindre le Groupe WhatsApp de la Célébration</span>
      </a>
    </StorySection>
  );
}

function MemoryGallery({ event }: { event: PublicEventPayload }) {
  const photos = event.galleryPhotos;
  if (photos.length === 0) return null;

  return (
    <StorySection>
      <SectionTitle eyebrow="Galerie" title="Éclats de mémoire" />
      <div className="mt-10 grid grid-cols-2 gap-2.5">
        {photos.map((photo, index) => (
          <motion.figure
            key={photo.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: Math.min(index * 0.04, 0.2) }}
            className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#d9b56d]/25 p-[2px]"
          >
            <img
              src={photo.thumbnailUrl ?? photo.originalUrl ?? ""}
              alt={photo.title ?? "Photo souvenir"}
              className="size-full rounded-[20px] object-cover transition duration-500 group-hover:scale-105"
            />
            <figcaption className="absolute inset-x-[2px] bottom-[2px] flex items-center justify-between gap-2 rounded-b-[20px] bg-gradient-to-t from-black/70 to-transparent p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="truncate text-[11px]">{photo.title ?? "Photo HD"}</span>
              {photo.originalUrl && (
                <a
                  href={photo.originalUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Télécharger la photo HD"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#fff7ea]/20 backdrop-blur-md"
                >
                  <Download className="size-4" />
                </a>
              )}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </StorySection>
  );
}

export function InvitationExperience({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [countdown, setCountdown] = useState(() => countdownParts(event.eventDate));
  const [isOpened, setIsOpened] = useState(false);
  const names = `${event.brideName ?? "Mariée"} & ${event.groomName ?? "Marié"}`;
  const photos = event.officialPhotoUrls.length > 0 ? event.officialPhotoUrls : event.coverPhotoUrl ? [event.coverPhotoUrl] : [];
  const heroPhoto = photos[0];
  const editorialPhotos = photos.slice(1, 3);
  const monogram = `${event.brideName?.[0] ?? "E"}${event.groomName?.[0] ?? "G"}`.toUpperCase();
  const openingVideoUrl = openingVideoSource(event.theme);
  const eventDateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "Date à confirmer";
  const invitationSurfaceStyle = {
    ...themeToCssVars(event.theme),
    backgroundColor: "#FAF6F0",
    backgroundImage:
      "radial-gradient(circle_at_50%_0%,rgba(255,247,225,.95),transparent_34%),linear-gradient(115deg,rgba(255,255,255,.38)_0_1px,transparent_1px_12px),linear-gradient(90deg,rgba(151,112,47,.035)_1px,transparent_1px),linear-gradient(0deg,rgba(151,112,47,.03)_1px,transparent_1px),linear-gradient(180deg,#FAF6F0_0%,#F5EFEB_100%)",
    backgroundSize: "100% 100%, 100% 100%, 52px 52px, 52px 52px, 100% 100%",
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--invitation-primary", event.theme.primaryColor);
    document.documentElement.style.setProperty("--invitation-secondary", event.theme.secondaryColor);
    document.documentElement.style.setProperty("--invitation-accent", event.theme.accentColor);
    document.documentElement.style.setProperty("--invitation-gold", event.theme.goldColor);
  }, [event.theme]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(countdownParts(event.eventDate)), 1_000);
    return () => clearInterval(timer);
  }, [event.eventDate]);

  return (
    <VideoOpeningGate
      videoSrc={openingVideoUrl}
      ambientAudioSrc={event.musicUrl}
      monogram={monogram}
      title={names}
      fallbackGradient={event.theme.previewGradient}
      fallbackImage={heroPhoto}
      onOpened={() => setIsOpened(true)}
    >
      <div style={invitationSurfaceStyle} className="relative mx-auto min-h-[100dvh] max-w-[440px] overflow-hidden bg-[#FAF6F0] text-[#2f251f] shadow-2xl">
        <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-[440px] -translate-x-1/2 overflow-hidden">
          <div className="absolute left-1/2 top-20 h-[620px] w-[390px] -translate-x-1/2 rounded-t-full border border-amber-300/35" />
          <div className="absolute left-1/2 top-28 h-[540px] w-[320px] -translate-x-1/2 rounded-t-full border border-amber-200/25" />
          <div className="absolute -left-14 top-32 h-64 w-32 rounded-full border-r border-amber-300/25" />
          <div className="absolute -right-14 top-32 h-64 w-32 rounded-full border-l border-amber-300/25" />
          <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#eadcc8]/80 to-transparent" />
        </div>

        <div className="relative z-10">
          <section className="relative flex min-h-[100dvh] items-end overflow-hidden px-6 pb-14 pt-20 text-center">
            {heroPhoto ? (
              <img src={heroPhoto} alt={names} className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: event.theme.previewGradient }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0] via-black/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />

            <motion.div
              className="relative z-10 mx-auto w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Sparkles className="mx-auto mb-6 size-7 text-[var(--invitation-gold)]" />
              <p className="font-serif text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/90">Mariage</p>
              <h1
                style={{ fontFamily: "var(--font-great-vibes)" }}
                className="mt-6 text-6xl font-light italic leading-[0.95] tracking-wide text-[#fff7e4] drop-shadow-[0_2px_10px_rgba(217,119,6,0.3)]"
              >
                {names}
              </h1>
              <p className="mt-7 font-serif text-xs font-semibold uppercase tracking-[0.3em] text-amber-100/90">{eventDateLabel}</p>
              <RoyalDivider className="mt-8" />
              <div className="mx-auto mt-8 grid max-w-sm grid-cols-4">
                {Object.entries(countdown).map(([label, value], index) => (
                  <div key={label} className={index === 0 ? "px-2 text-center" : "border-l border-amber-200/35 px-2 text-center"}>
                    <strong className="block font-serif text-3xl font-light italic text-[#fff7e4]">{value}</strong>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-amber-100/70">{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>

          <StorySection className="text-center">
            <SectionTitle eyebrow="Save the date" title="Le jour précieux" />
            <p className="mx-auto mt-6 max-w-xs font-serif text-lg italic leading-8 text-stone-700/80">
              {event.invitationQuote ?? "L'amour ne se regarde pas, il regarde ensemble dans la même direction."}
            </p>
            <SaveDateCalendar eventDate={event.eventDate} eventName={event.name} />
          </StorySection>

          <RoyalDivider className="my-2" />

          {(event.dressCode || event.dressCodeColors.length > 0) && (
            <>
              <StorySection>
                <DressCodeSection event={event} />
              </StorySection>
              <RoyalDivider className="my-2" />
            </>
          )}

          <StorySection className="text-center">
            <SectionTitle eyebrow="Notre histoire" title="Une promesse, deux familles" />
            <p className="mx-auto mt-7 max-w-xs font-serif text-lg leading-[1.8] text-stone-700/80">
              {event.coupleStory ?? "Nous avons hâte de célébrer cette journée avec vous."}
            </p>
            {editorialPhotos.length > 0 && (
              <div className="mt-10 grid gap-4">
                {editorialPhotos.map((photo, index) => (
                  <motion.figure
                    key={photo}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.65, ease: "easeOut", delay: index * 0.08 }}
                    className={`aspect-[4/5] overflow-hidden rounded-[28px] bg-[#d9b56d]/25 p-[2px] ${
                      index % 2 === 0 ? "mr-8" : "ml-8"
                    }`}
                  >
                    <img src={photo} alt={`${names} ${index + 2}`} className="size-full rounded-[26px] object-cover" />
                  </motion.figure>
                ))}
              </div>
            )}
          </StorySection>

          {event.program.length > 0 && (
            <>
              <RoyalDivider className="my-2" />
              <StorySection>
                <TimelineSection event={event} />
              </StorySection>
            </>
          )}

          {event.galleryPhotos.length > 0 && (
            <>
              <RoyalDivider className="my-2" />
              <MemoryGallery event={event} />
            </>
          )}

          <RoyalDivider className="my-2" />

          <StorySection id="lieu" className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100/45 text-[var(--invitation-gold)]">
              <MapPin className="size-5" />
            </span>
            <SectionTitle eyebrow="Lieu" title={event.venueName ?? "Lieu à définir"} />
            {event.venueAddress && <p className="mx-auto mt-6 max-w-xs font-serif text-base leading-8 text-stone-700/75">{event.venueAddress}</p>}
            {event.organizerPhone && (
              <p className="mt-5 flex items-center justify-center gap-2 font-serif text-sm text-stone-700/70">
                <Phone className="size-4 text-[var(--invitation-gold)]" />
                {event.organizerPhone}
              </p>
            )}
            {event.venueMapUrl && (
              <Button
                asChild
                variant="outline"
                className="mt-8 h-11 rounded-full border-amber-400/35 bg-transparent px-5 font-serif text-xs uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-100/30"
              >
                <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                  Ouvrir Maps
                </a>
              </Button>
            )}
          </StorySection>

          <RoyalDivider className="my-2" />

          <StorySection id="rsvp">
            <SectionTitle eyebrow="RSVP" title="Votre réponse" />
            <p className="mx-auto mt-5 max-w-xs text-center font-serif text-lg italic leading-8 text-stone-700/75">
              Merci de confirmer votre présence avec douceur.
            </p>
            <RSVPForm event={event} guestToken={guestToken} />
          </StorySection>

          {event.whatsappGroupUrl && (
            <>
              <RoyalDivider className="my-2" />
              <WhatsAppCelebrationCTA url={event.whatsappGroupUrl} />
            </>
          )}

          {(event.giftIban || event.giftWave) && (
            <>
              <RoyalDivider className="my-2" />
              <StorySection>
                <GiftListIBAN iban={event.giftIban} wave={event.giftWave} />
              </StorySection>
            </>
          )}

          <footer className="px-6 pb-10 pt-8 text-center">
            <Flower2 className="mx-auto size-5 text-[var(--invitation-gold)]" />
            <p className="mt-4 font-serif text-xs uppercase tracking-[0.25em] text-amber-900/60">Élégance Invitations</p>
          </footer>
        </div>
      </div>
    </VideoOpeningGate>
  );
}
