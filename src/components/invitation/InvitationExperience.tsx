"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Download, Flower2, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VideoOpeningGate } from "@/components/animations/VideoOpeningGate";
import { DressCodeSection } from "@/components/invitation/DressCodeSection";
import { GiftListIBAN } from "@/components/invitation/GiftListIBAN";
import { TimelineSection } from "@/components/invitation/TimelineSection";
import { TripleScratchDate } from "@/components/invitation/TripleScratchDate";
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

function DelicateDivider({ className = "" }: { className?: string }) {
  return <div className={`h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent ${className}`} aria-hidden="true" />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center font-serif text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/80">
      {children}
    </h2>
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
      <div className="flex flex-col items-center py-5 text-center">
        <CheckCircle className="size-12 text-[var(--invitation-gold)]" />
        <p className="mt-5 font-serif text-2xl italic leading-8 text-amber-950">Merci, votre réponse est enregistrée.</p>
        {whatsappHref && (
          <Button
            asChild
            variant="outline"
            className="mt-7 h-11 rounded-full border-amber-400/35 bg-transparent px-5 font-serif text-xs uppercase tracking-[0.2em] text-amber-950 shadow-none hover:bg-amber-100/30"
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
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/70">Nom complet</Label>
        <Input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Votre nom complet"
          className="h-12 rounded-full border-amber-300/35 bg-[#F5EFEB]/70 px-5 font-serif text-base text-amber-950 shadow-none placeholder:text-stone-500/55 focus-visible:ring-amber-400/25"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-serif text-[11px] uppercase tracking-[0.22em] text-amber-900/70">Présence</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-12 rounded-full border-amber-300/35 bg-[#F5EFEB]/70 px-5 font-serif text-base text-amber-950 shadow-none focus:ring-amber-400/25">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-amber-200 bg-[#FAF6F0] font-serif text-amber-950">
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
          className="h-12 rounded-full border-amber-300/35 bg-[#F5EFEB]/70 px-5 font-serif text-base text-amber-950 shadow-none focus-visible:ring-amber-400/25"
        />
      </div>
      <Button
        onClick={submit}
        className="h-12 w-full rounded-full border border-[#f8e8aa]/55 bg-[linear-gradient(135deg,#fae9a6,#d6a848_48%,#9d6820)] font-serif text-xs uppercase tracking-[0.24em] text-amber-950 shadow-[0_16px_34px_rgba(103,70,21,.18)] hover:brightness-105"
      >
        Confirmer
      </Button>
    </div>
  );
}

function WhatsAppGroupCTA({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <section className="px-6 py-16 text-center">
      <SectionTitle>Groupe WhatsApp</SectionTitle>
      <p className="mx-auto mt-5 max-w-xs font-serif text-lg italic leading-8 text-stone-700/75">
        Souvenirs, vidéos et informations en direct avec les proches.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#f8e8aa]/55 bg-[linear-gradient(135deg,#fae9a6,#d6a848_48%,#9d6820)] px-5 py-3 text-center font-serif text-xs uppercase tracking-[0.17em] text-amber-950 shadow-[0_18px_38px_rgba(103,70,21,.18)] transition hover:brightness-105"
      >
        <MessageCircle className="size-4 shrink-0" />
        <span>Rejoindre le Groupe WhatsApp du Mariage</span>
      </a>
    </section>
  );
}

function MemoryGallery({ event }: { event: PublicEventPayload }) {
  const photos = event.galleryPhotos;
  if (photos.length === 0) return null;

  return (
    <section className="px-6 py-16">
      <SectionTitle>Galerie</SectionTitle>
      <p className="mx-auto mt-5 max-w-xs text-center font-serif text-lg italic leading-8 text-stone-700/75">
        Les instants partagés par l'équipe photo.
      </p>
      <div className="mt-10 grid grid-cols-2 gap-2.5">
        {photos.map((photo, index) => (
          <motion.figure
            key={photo.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: Math.min(index * 0.04, 0.2) }}
            className="group relative aspect-[4/5] overflow-hidden rounded-[3px] bg-[#eadbc8] p-[3px] shadow-[0_16px_36px_rgba(72,48,18,.12)]"
          >
            <img
              src={photo.thumbnailUrl ?? photo.originalUrl ?? ""}
              alt={photo.title ?? "Photo souvenir"}
              className="size-full rounded-[2px] object-cover transition duration-500 group-hover:scale-105"
            />
            <figcaption className="absolute inset-x-[3px] bottom-[3px] flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="truncate text-[11px]">{photo.title ?? "Photo HD"}</span>
              {photo.originalUrl && (
                <a
                  href={photo.originalUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Telecharger la photo HD"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md"
                >
                  <Download className="size-4" />
                </a>
              )}
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function openingVideoSource(theme: PublicEventPayload["theme"]) {
  const videoTheme = theme as VideoTheme;
  return videoTheme.videoUrl ?? videoTheme.customVideoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
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
      "linear-gradient(90deg, rgba(151,112,47,.035) 1px, transparent 1px), linear-gradient(0deg, rgba(151,112,47,.03) 1px, transparent 1px), repeating-linear-gradient(115deg, rgba(255,255,255,.45) 0 1px, transparent 1px 11px), linear-gradient(180deg, #FAF6F0 0%, #F5EFEB 55%, #FAF6F0 100%)",
    backgroundSize: "52px 52px, 52px 52px, 100% 100%, 100% 100%",
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
      <div style={invitationSurfaceStyle} className="min-h-[100svh] overflow-hidden bg-[#FAF6F0] text-[#2f251f] shadow-2xl">
        <section className="relative flex min-h-[100svh] items-end overflow-hidden px-6 pb-12 pt-20 text-center">
          {heroPhoto ? (
            <img src={heroPhoto} alt={names} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: event.theme.previewGradient }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6F0] via-black/20 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/25 to-transparent" />

          <motion.div
            className="relative z-10 mx-auto w-full"
            initial={{ opacity: 0, y: 24 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Sparkles className="mx-auto mb-6 size-7 text-[var(--invitation-gold)]" />
            <p className="font-serif text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/80">Save the date</p>
            <h1 className="mt-6 font-serif text-6xl font-light italic leading-[0.95] tracking-wide text-amber-950 drop-shadow-[0_1px_18px_rgba(255,248,235,.72)]">
              {names}
            </h1>
            <p className="mt-7 font-serif text-xs font-semibold uppercase tracking-[0.25em] text-amber-900/80">{eventDateLabel}</p>
            <p className="mx-auto mt-6 max-w-xs font-serif text-lg italic leading-8 text-stone-800/75">
            {event.invitationQuote ?? "L'amour ne se regarde pas, il regarde ensemble dans la même direction."}
            </p>

            <div className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-1.5">
              {Object.entries(countdown).map(([label, value]) => (
                <span key={label} className="border-y border-amber-500/25 py-3">
                  <strong className="block font-serif text-2xl font-light italic text-amber-950">{value}</strong>
                  <span className="text-[9px] uppercase tracking-[0.12em] text-amber-900/70">{label}</span>
                </span>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-6 py-16">
          <TripleScratchDate date={event.eventDate} title={event.name} />
        </section>

        <DelicateDivider className="mx-6 my-2" />

        {(event.dressCode || event.dressCodeColors.length > 0) && (
          <>
            <section className="px-6 py-16">
              <DressCodeSection event={event} />
            </section>
            <DelicateDivider className="mx-6 my-2" />
          </>
        )}

        <section className="px-6 py-16 text-center">
          <SectionTitle>Notre histoire</SectionTitle>
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
                  className={`aspect-[4/5] overflow-hidden rounded-[3px] bg-[#eadbc8] p-[3px] shadow-[0_18px_42px_rgba(72,48,18,.14)] ${
                    index % 2 === 0 ? "mr-8" : "ml-8"
                  }`}
                >
                  <img src={photo} alt={`${names} ${index + 2}`} className="size-full rounded-[2px] object-cover" />
                </motion.figure>
              ))}
            </div>
          )}
        </section>

        {event.program.length > 0 && (
          <>
            <DelicateDivider className="mx-6 my-2" />
            <TimelineSection event={event} />
          </>
        )}

        {event.galleryPhotos.length > 0 && (
          <>
            <DelicateDivider className="mx-6 my-2" />
            <MemoryGallery event={event} />
          </>
        )}

        <DelicateDivider className="mx-6 my-2" />

        <section id="lieu" className="px-6 py-16 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-full bg-amber-100/40 text-[var(--invitation-gold)]">
            <MapPin className="size-5" />
          </span>
          <SectionTitle>Lieu</SectionTitle>
          <h3 className="mt-6 font-serif text-3xl italic leading-tight text-amber-950">{event.venueName ?? "Lieu à définir"}</h3>
          {event.venueAddress && <p className="mx-auto mt-4 max-w-xs font-serif text-base leading-8 text-stone-700/75">{event.venueAddress}</p>}
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
              className="mt-8 h-11 rounded-full border-amber-400/35 bg-transparent px-5 font-serif text-xs uppercase tracking-[0.2em] text-amber-950 shadow-none hover:bg-amber-100/30"
            >
              <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                Ouvrir Maps
              </a>
            </Button>
          )}
        </section>

        <DelicateDivider className="mx-6 my-2" />

        <section id="rsvp" className="px-6 py-16">
          <SectionTitle>RSVP</SectionTitle>
          <p className="mx-auto mt-5 max-w-xs text-center font-serif text-lg italic leading-8 text-stone-700/75">
            Merci de confirmer votre présence.
          </p>
          <div className="mt-9">
            <RSVPForm event={event} guestToken={guestToken} />
          </div>
        </section>

        {event.whatsappGroupUrl && (
          <>
            <DelicateDivider className="mx-6 my-2" />
            <WhatsAppGroupCTA url={event.whatsappGroupUrl} />
          </>
        )}

        {(event.giftIban || event.giftWave) && (
          <>
            <DelicateDivider className="mx-6 my-2" />
            <div className="px-6 py-16">
              <GiftListIBAN iban={event.giftIban} wave={event.giftWave} />
            </div>
          </>
        )}

        <footer className="px-6 pb-10 pt-6 text-center">
          <Flower2 className="mx-auto size-5 text-[var(--invitation-gold)]" />
          <p className="mt-4 font-serif text-xs uppercase tracking-[0.25em] text-amber-900/60">Élégance Invitations</p>
        </footer>
      </div>
    </VideoOpeningGate>
  );
}
