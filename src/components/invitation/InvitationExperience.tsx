"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Download, Flower2, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VideoOpeningGate } from "@/components/animations/VideoOpeningGate";
import { DressCodeSection } from "@/components/invitation/DressCodeSection";
import { FloatingAudioPlayer } from "@/components/invitation/FloatingAudioPlayer";
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

function OrnamentDivider({ monogram, className = "" }: { monogram: string; className?: string }) {
  return (
    <div className={`mx-auto flex w-full max-w-md items-center gap-4 text-[var(--invitation-gold)] ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--invitation-gold)]/45 to-[var(--invitation-gold)]/20" />
      <span className="flex h-10 min-w-12 items-center justify-center gap-1 rounded-full border border-[var(--invitation-gold)]/35 bg-[#FAF8F5]/85 px-3 font-serif text-sm italic tracking-[0.18em] shadow-[0_0_0_6px_rgba(250,248,245,.72)]">
        <Flower2 className="size-3 opacity-75" />
        <span>{monogram}</span>
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[var(--invitation-gold)]/45 to-[var(--invitation-gold)]/20" />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-amber-950 md:text-3xl">{title}</h2>
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
    const text = encodeURIComponent(`Bonjour, je confirme ma reponse pour ${event.name}.`);
    return `https://wa.me/${phone}?text=${text}`;
  }, [event.name, event.organizerPhone]);

  async function submit() {
    if (!guestToken) {
      toast.error("Ouvrez votre pass personnel pour confirmer votre RSVP.");
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
    toast.success("RSVP enregistre.");
  }

  if (done) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <CheckCircle className="size-14 text-[var(--invitation-gold)]" />
        <h3 className="mt-4 font-serif text-2xl italic tracking-wide text-amber-950">Merci, votre reponse est enregistree.</h3>
        {whatsappHref && (
          <Button
            asChild
            variant="outline"
            className="mt-6 rounded-full border-[var(--invitation-gold)]/35 bg-[#FAF8F5]/70 text-xs uppercase tracking-[0.18em] text-amber-950 shadow-none hover:bg-[var(--invitation-gold)]/10"
          >
            <a href={whatsappHref} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 size-4" />
              Envoyer aussi sur WhatsApp
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-[0.2em] text-amber-800/70">Nom de l&apos;invite</Label>
        <Input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Votre nom complet"
          className="h-12 rounded-full border-[var(--invitation-gold)]/25 bg-[#fffaf0]/55 px-5 text-amber-950 shadow-none placeholder:text-stone-500/60 focus-visible:ring-[var(--invitation-gold)]/25"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-[0.2em] text-amber-800/70">Presence</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-12 rounded-full border-[var(--invitation-gold)]/25 bg-[#fffaf0]/55 px-5 text-amber-950 shadow-none focus:ring-[var(--invitation-gold)]/25">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Je serai present(e)</SelectItem>
            <SelectItem value="declined">Je ne pourrai pas venir</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-[11px] uppercase tracking-[0.2em] text-amber-800/70">Accompagnants</Label>
        <Input
          type="number"
          min="0"
          max="10"
          value={plusOnes}
          onChange={(e) => setPlusOnes(e.target.value)}
          className="h-12 rounded-full border-[var(--invitation-gold)]/25 bg-[#fffaf0]/55 px-5 text-amber-950 shadow-none focus-visible:ring-[var(--invitation-gold)]/25"
        />
      </div>
      <Button
        onClick={submit}
        className="h-12 w-full rounded-full border border-[#f7e6a8]/45 bg-[linear-gradient(135deg,#f5df95,#d1a544_48%,#9b6a1f)] text-xs uppercase tracking-[0.22em] text-amber-950 shadow-[0_16px_32px_rgba(113,78,24,.16)] hover:brightness-105"
      >
        Confirmer
      </Button>
    </div>
  );
}

function WhatsAppGroupCTA({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <div className="text-center">
      <p className="mb-5 text-xs uppercase tracking-[0.25em] text-amber-700/80">Salon prive</p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-12 max-w-full items-center justify-center gap-3 rounded-full border border-[#f7e6a8]/55 bg-[linear-gradient(135deg,#f8e8a8,#d6aa46_48%,#9f6c21)] px-6 py-3 text-center text-xs uppercase tracking-[0.18em] text-amber-950 shadow-[0_18px_36px_rgba(113,78,24,.16)] transition hover:brightness-105"
      >
        <MessageCircle className="size-4 shrink-0" />
        <span>Rejoindre le salon du mariage</span>
      </a>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-stone-700/65">Photos, coulisses et informations en direct avec les proches.</p>
    </div>
  );
}

function MemoryGallery({ event }: { event: PublicEventPayload }) {
  const photos = event.galleryPhotos;
  if (photos.length === 0) return null;

  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading eyebrow="Galerie souvenirs" title="Les plus beaux instants" />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {photos.map((photo, index) => (
            <motion.figure
              key={photo.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut", delay: Math.min(index * 0.04, 0.2) }}
              className="group relative aspect-[4/5] overflow-hidden rounded-[3px] border border-[var(--invitation-gold)]/30 bg-[#f3e7d4] p-1 shadow-[0_18px_45px_rgba(80,54,20,.10)]"
            >
              <img src={photo.thumbnailUrl ?? photo.originalUrl ?? ""} alt={photo.title ?? "Photo souvenir"} className="size-full rounded-[2px] object-cover transition duration-500 group-hover:scale-105" />
              <figcaption className="absolute inset-x-1 bottom-1 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="truncate text-xs">{photo.title ?? "Photo HD"}</span>
                {photo.originalUrl && (
                  <a href={photo.originalUrl} download target="_blank" rel="noreferrer" aria-label="Telecharger la photo HD" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-md">
                    <Download className="size-4" />
                  </a>
                )}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function openingVideoSource(theme: PublicEventPayload["theme"]) {
  const videoTheme = theme as VideoTheme;
  return videoTheme.customVideoUrl ?? videoTheme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

export function InvitationExperience({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [countdown, setCountdown] = useState(() => countdownParts(event.eventDate));
  const [isOpened, setIsOpened] = useState(false);
  const names = `${event.brideName ?? "Mariee"} & ${event.groomName ?? "Marie"}`;
  const photos = event.officialPhotoUrls.length > 0 ? event.officialPhotoUrls : event.coverPhotoUrl ? [event.coverPhotoUrl] : [];
  const monogram = `${event.brideName?.[0] ?? "E"}${event.groomName?.[0] ?? "G"}`.toUpperCase();
  const openingVideoUrl = openingVideoSource(event.theme);
  const eventDateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "Date a confirmer";
  const invitationSurfaceStyle = {
    ...themeToCssVars(event.theme),
    backgroundColor: "#FAF8F5",
    backgroundImage:
      "linear-gradient(90deg, rgba(151,112,47,.035) 1px, transparent 1px), linear-gradient(0deg, rgba(151,112,47,.03) 1px, transparent 1px), repeating-linear-gradient(115deg, rgba(255,255,255,.48) 0 1px, transparent 1px 11px), linear-gradient(180deg, #FAF8F5 0%, #F7EFE3 46%, #FAF8F5 100%)",
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
      fallbackImage={photos[0]}
      onOpened={() => setIsOpened(true)}
    >
      <div style={invitationSurfaceStyle} className="min-h-screen overflow-hidden text-[#2f251f]">
        <FloatingAudioPlayer src={event.musicUrl} />
        <section className="relative flex min-h-[92vh] items-end overflow-hidden px-5 pb-16 pt-20">
          {photos[0] ? (
            <img src={photos[0]} alt={names} className="absolute inset-0 size-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: event.theme.previewGradient }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c120d]/80 via-[#1c120d]/30 to-[#1c120d]/10" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
          <motion.div
            className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0.88, y: 8 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          >
            <Sparkles className="mb-6 size-7 text-[var(--invitation-gold)]" />
            <p className="mb-5 text-xs uppercase tracking-[0.25em] text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">Save the date</p>
            <h1 className="font-serif text-5xl font-light italic leading-tight tracking-wide text-[#fff8ed] drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] md:text-7xl">
              {names}
            </h1>
            <p className="mt-6 text-xs uppercase tracking-[0.28em] text-amber-100/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">{eventDateLabel}</p>
            <p className="mt-6 max-w-2xl font-serif text-xl italic leading-9 text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] md:text-2xl">
              {event.invitationQuote ?? "L'amour ne se regarde pas, il regarde ensemble dans la meme direction."}
            </p>
            <motion.div
              className="mx-auto mt-9 grid w-full max-w-md grid-cols-4 gap-2 text-center"
              initial={{ opacity: 0, y: 18 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
            >
              {Object.entries(countdown).map(([label, value]) => (
                <span key={label} className="border-y border-amber-100/35 px-2 py-3 backdrop-blur-[2px]">
                  <strong className="block font-serif text-2xl font-light italic text-[#fff8ed]">{value}</strong>
                  <span className="text-[10px] uppercase tracking-[0.13em] text-amber-100/85">{label}</span>
                </span>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <OrnamentDivider monogram={monogram} className="py-12" />

        <section className="px-5 pb-20 pt-4">
          <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)] lg:items-start">
            <div className="space-y-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
              >
                <TripleScratchDate date={event.eventDate} title={event.name} />
              </motion.div>
              {(event.dressCode || event.dressCodeColors.length > 0) && (
                <>
                  <OrnamentDivider monogram={monogram} />
                  <DressCodeSection event={event} />
                </>
              )}
              <OrnamentDivider monogram={monogram} />
              <section className="text-center">
                <SectionHeading eyebrow="Notre histoire" title="Une histoire a celebrer" />
                <p className="mx-auto mt-7 max-w-2xl text-lg leading-9 text-stone-700/75">
                  {event.coupleStory ?? "Nous avons hate de celebrer cette journee avec vous."}
                </p>
              </section>
            </div>

            {photos.length > 0 && (
              <aside className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {photos.slice(0, 3).map((photo, index) => (
                  <motion.figure
                    key={photo}
                    initial={{ opacity: 0, y: 18 }}
                    animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
                    transition={{ duration: 0.75, ease: "easeOut", delay: 0.2 + index * 0.08 }}
                    className={`aspect-[9/12] overflow-hidden rounded-[3px] border border-[var(--invitation-gold)]/30 bg-[#f3e7d4] p-1 shadow-[0_22px_55px_rgba(80,54,20,.12)] ${
                      index === 1 ? "lg:ml-10" : index === 2 ? "lg:mr-10" : ""
                    }`}
                  >
                    <img src={photo} alt={`${names} ${index + 1}`} className="size-full rounded-[2px] object-cover" />
                  </motion.figure>
                ))}
              </aside>
            )}
          </div>
        </section>

        {event.program.length > 0 && (
          <>
            <OrnamentDivider monogram={monogram} />
            <TimelineSection event={event} />
          </>
        )}
        {event.galleryPhotos.length > 0 && (
          <>
            <OrnamentDivider monogram={monogram} />
            <MemoryGallery event={event} />
          </>
        )}

        <section className="px-5 py-24">
          <div className="mx-auto max-w-5xl space-y-14">
            <WhatsAppGroupCTA url={event.whatsappGroupUrl} />
            {event.whatsappGroupUrl && <OrnamentDivider monogram={monogram} />}
            <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
              <section className="border-y border-[var(--invitation-gold)]/25 py-8 text-center md:text-left">
                <div className="mb-5 flex justify-center md:justify-start">
                  <span className="grid size-11 place-items-center rounded-full border border-[var(--invitation-gold)]/35 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
                    <MapPin className="size-5" />
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700/80">Lieu de reception</p>
                <h2 className="mt-3 font-serif text-2xl italic tracking-wider text-amber-950 md:text-3xl">{event.venueName ?? "Lieu a definir"}</h2>
                {event.venueAddress && <p className="mt-4 text-sm leading-7 text-stone-700/70">{event.venueAddress}</p>}
                {event.organizerPhone && (
                  <p className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-700/70 md:justify-start">
                    <Phone className="size-4 text-[var(--invitation-gold)]" />
                    {event.organizerPhone}
                  </p>
                )}
                {event.venueMapUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-7 rounded-full border-[var(--invitation-gold)]/35 bg-[#FAF8F5]/60 text-xs uppercase tracking-[0.18em] text-amber-950 shadow-none hover:bg-[var(--invitation-gold)]/10"
                  >
                    <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                      Ouvrir Maps
                    </a>
                  </Button>
                )}
              </section>

              <section id="rsvp" className="border-y border-[var(--invitation-gold)]/25 py-8">
                <SectionHeading eyebrow="RSVP" title="Votre reponse" />
                <div className="mx-auto mt-8 max-w-xl">
                  <RSVPForm event={event} guestToken={guestToken} />
                </div>
              </section>
            </div>
            <GiftListIBAN iban={event.giftIban} wave={event.giftWave} />
          </div>
        </section>
      </div>
    </VideoOpeningGate>
  );
}
