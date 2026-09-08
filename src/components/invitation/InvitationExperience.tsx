"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDown, CheckCircle, Download, Flower2, MapPin, MessageCircle, Phone, Send, Sparkles } from "lucide-react";
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
import { normalizeThemeConfig, themeToCssVars } from "@/lib/theme-presets";
import type { PublicEventPayload, ScrollAnimationType } from "@/types/database.types";

type VideoTheme = PublicEventPayload["theme"] & {
  videoUrl?: string | null;
  customVideoUrl?: string | null;
};

const ACTION_BUTTON_CLASS =
  "border-[color:var(--theme-accent)] bg-[color:var(--theme-accent)] text-[#FFFDF9] shadow-[0_16px_40px_rgba(0,0,0,.24)] hover:brightness-110";
const OUTLINE_BUTTON_CLASS =
  "border-[color:var(--theme-accent)] bg-white/55 text-[var(--invitation-sheet-text)] shadow-[0_12px_30px_rgba(0,0,0,.12)] hover:bg-white/75";
const FIELD_CLASS =
  "h-12 rounded-2xl border-[color:var(--invitation-sheet-border)] bg-white/70 px-5 font-serif text-base text-[var(--invitation-sheet-text)] placeholder:text-[var(--invitation-sheet-muted)] focus-visible:ring-[var(--invitation-gold)]";
const FIELD_LABEL_CLASS = "font-serif text-[11px] uppercase tracking-[0.22em] text-[var(--invitation-sheet-muted)]";
const SCROLL_EASE = [0.16, 1, 0.3, 1] as const;

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

function openingVideoSource(theme: PublicEventPayload["theme"]) {
  const videoTheme = theme as VideoTheme;
  return videoTheme.videoUrl ?? videoTheme.customVideoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

function buildWhatsAppHref(phone: string | null | undefined, text: string) {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : null;
}

function RoyalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-20 bg-gradient-to-r from-transparent via-[var(--invitation-gold-line)] to-transparent" />
      <Flower2 className="size-4 text-[var(--invitation-gold)] drop-shadow-md" />
      <span className="h-px w-20 bg-gradient-to-r from-transparent via-[var(--invitation-gold-line)] to-transparent" />
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="text-center">
      <p className="font-serif text-xs font-semibold uppercase tracking-[0.3em] text-[var(--invitation-gold)]">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl font-light italic leading-tight text-[var(--invitation-sheet-text)]">{title}</h2>
    </div>
  );
}

function scrollMotion(animation: ScrollAnimationType, index: number) {
  const staggerDelay = Math.min(index * 0.035, 0.18);

  switch (animation) {
    case "scale-in":
      return {
        initial: { opacity: 0, y: 18, scale: 0.96 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.72, ease: SCROLL_EASE },
      };
    case "slide-stagger":
      return {
        initial: { opacity: 0, x: index % 2 === 0 ? -36 : 36, y: 16 },
        whileInView: { opacity: 1, x: 0, y: 0 },
        transition: { duration: 0.74, ease: SCROLL_EASE, delay: staggerDelay },
      };
    case "curtain-reveal":
      return {
        initial: { opacity: 0, y: 18, clipPath: "inset(0 0 100% 0)" },
        whileInView: { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" },
        transition: { duration: 0.82, ease: SCROLL_EASE },
      };
    case "blur-in":
      return {
        initial: { opacity: 0, y: 20, filter: "blur(10px)" },
        whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: { duration: 0.78, ease: SCROLL_EASE },
      };
    case "rotate-soft":
      return {
        initial: { opacity: 0, y: 24, rotateX: -2, transformPerspective: 1200 },
        whileInView: { opacity: 1, y: 0, rotateX: 0, transformPerspective: 1200 },
        transition: { duration: 0.78, ease: SCROLL_EASE },
      };
    case "pop-soft":
      return {
        initial: { opacity: 0, y: 22, scale: 0.92 },
        whileInView: { opacity: 1, y: 0, scale: 1 },
        transition: { type: "spring" as const, stiffness: 170, damping: 22, mass: 0.9 },
      };
    case "glow-spread":
      return {
        initial: { opacity: 0, y: 22, boxShadow: "0 0 0 rgba(212,175,55,0)" },
        whileInView: { opacity: 1, y: 0, boxShadow: "0 22px 70px rgba(212,175,55,0.2)" },
        transition: { duration: 0.8, ease: SCROLL_EASE },
      };
    case "flip-x":
      return {
        initial: { opacity: 0, y: 18, rotateX: -14, transformPerspective: 1200 },
        whileInView: { opacity: 1, y: 0, rotateX: 0, transformPerspective: 1200 },
        transition: { duration: 0.84, ease: SCROLL_EASE },
      };
    case "shimmer-rise":
      return {
        initial: { opacity: 0, y: 34, filter: "brightness(0.96)" },
        whileInView: { opacity: 1, y: 0, filter: "brightness(1)" },
        transition: { duration: 0.76, ease: SCROLL_EASE },
      };
    default:
      return {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: SCROLL_EASE },
      };
  }
}

function StorySection({
  id,
  children,
  className = "",
  animation = "fade-up",
  index = 0,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  animation?: ScrollAnimationType | null;
  index?: number;
}) {
  const safeAnimation = animation || "fade-up";
  const motionConfig = scrollMotion(safeAnimation, index);

  return (
    <motion.section
      id={id}
      data-scroll-animation={safeAnimation}
      className={`scroll-animation-${safeAnimation} relative flex min-h-[82dvh] snap-start items-center px-3 py-5`}
      initial={motionConfig.initial}
      whileInView={motionConfig.whileInView}
      viewport={{ once: true, amount: 0.22, margin: "-70px" }}
      transition={motionConfig.transition}
    >
      <div
        className={`relative w-full overflow-hidden rounded-[30px] border border-[color:var(--invitation-sheet-border)] bg-[color:var(--invitation-sheet-soft)] p-6 text-[var(--invitation-sheet-text)] shadow-[0_24px_70px_rgba(0,0,0,.24)] backdrop-blur-sm ${className}`}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--invitation-gold-line)] to-transparent" />
        <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full border border-[color:var(--invitation-sheet-border)] opacity-45" />
        {safeAnimation === "shimmer-rise" && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent mix-blend-screen"
            initial={{ opacity: 0, x: "-120%", skewX: -12 }}
            whileInView={{ opacity: [0, 1, 0], x: "320%", skewX: -12 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 1.05, ease: SCROLL_EASE, delay: 0.22 }}
          />
        )}
        {children}
      </div>
    </motion.section>
  );
}

function RSVPForm({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [plusOnes, setPlusOnes] = useState("0");
  const [done, setDone] = useState(false);

  const whatsappHref = useMemo(() => {
    return buildWhatsAppHref(event.organizerPhone, `Bonjour, je confirme ma réponse pour ${event.name}.`);
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
        <p className="mt-5 font-serif text-2xl italic leading-8 text-[var(--invitation-sheet-text)]">Merci, votre réponse est enregistrée.</p>
        {whatsappHref && (
          <Button
            asChild
            variant="outline"
            className={`mt-7 h-11 rounded-full px-5 font-serif text-xs uppercase tracking-[0.2em] ${OUTLINE_BUTTON_CLASS}`}
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
        <Label className={FIELD_LABEL_CLASS}>Nom de l&apos;invité</Label>
        <Input
          value={guestName}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Votre nom complet"
          className={FIELD_CLASS}
        />
      </div>
      <div className="space-y-2">
        <Label className={FIELD_LABEL_CLASS}>Statut</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className={FIELD_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[color:var(--invitation-sheet-border)] bg-[color:var(--invitation-sheet)] font-serif text-[var(--invitation-sheet-text)]">
            <SelectItem value="confirmed">Présent</SelectItem>
            <SelectItem value="declined">Absent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className={FIELD_LABEL_CLASS}>Accompagnants</Label>
        <Input
          type="number"
          min="0"
          max="10"
          value={plusOnes}
          onChange={(event) => setPlusOnes(event.target.value)}
          className={FIELD_CLASS}
        />
      </div>
      <Button
        onClick={submit}
        className={`h-12 w-full rounded-full border font-serif text-xs uppercase tracking-[0.24em] ${ACTION_BUTTON_CLASS}`}
      >
        <Send className="size-4" />
        Envoyer ma réponse
      </Button>
    </div>
  );
}

function VerseSection({
  event,
  index,
  animation,
}: {
  event: PublicEventPayload;
  index: number;
  animation?: ScrollAnimationType | null;
}) {
  const quote = event.invitationQuote ?? "Deux familles, deux cœurs, une promesse placée sous le signe de l'amour.";

  return (
    <StorySection id="benediction" animation={animation || "fade-up"} index={index} className="rounded-t-[120px] pt-12 text-center">
      <div className="mx-auto mb-6 flex max-w-[240px] items-center justify-center gap-3 text-[var(--invitation-gold)]">
        <span className="h-px flex-1 bg-[var(--invitation-gold-line)]" />
        <Flower2 className="size-4" />
        <span className="h-px flex-1 bg-[var(--invitation-gold-line)]" />
      </div>
      <SectionTitle eyebrow="Bénédiction" title="Avec nos familles" />
      <blockquote
        className="mx-auto mt-8 max-w-xs font-serif text-3xl italic leading-[1.25] text-[var(--invitation-sheet-text)]"
        style={{ fontFamily: "var(--font-great-vibes)" }}
      >
        {quote}
      </blockquote>
      <p className="mx-auto mt-6 max-w-xs font-serif text-base leading-7 text-[var(--invitation-sheet-muted)]">
        Que cette journée soit douce, lumineuse et entourée de ceux qui nous sont chers.
      </p>
    </StorySection>
  );
}

function WhatsAppContactsSection({
  event,
  index,
  animation,
}: {
  event: PublicEventPayload;
  index: number;
  animation?: ScrollAnimationType | null;
}) {
  const href = buildWhatsAppHref(event.organizerPhone, `Bonjour, j'ai une question au sujet de ${event.name}.`);
  if (!href) return null;

  return (
    <StorySection id="contacts" animation={animation || "fade-up"} index={index} className="text-center">
      <SectionTitle eyebrow="Une question ?" title="Contacts WhatsApp" />
      <div className="mt-8 rounded-[24px] border border-[color:var(--invitation-sheet-border)] bg-white/60 p-4 text-left shadow-[0_14px_34px_rgba(0,0,0,.1)]">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[color:var(--invitation-chip)] text-[var(--invitation-gold)]">
            <Phone className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-serif text-xl italic text-[var(--invitation-sheet-text)]">
              {event.organizerName ?? "Organisation"}
            </p>
            <p className="mt-1 font-serif text-[11px] uppercase tracking-[0.2em] text-[var(--invitation-sheet-muted)]">
              Organisation
            </p>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[color:var(--theme-accent)] bg-[linear-gradient(135deg,#1f8f5a,var(--theme-accent))] px-4 py-3 text-center font-serif text-xs uppercase tracking-[0.18em] text-white shadow-[0_14px_30px_rgba(31,143,90,.18)] transition hover:brightness-105"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
      </div>
    </StorySection>
  );
}

function WhatsAppCelebrationCTA({
  url,
  animation,
  index,
}: {
  url: string | null;
  animation?: ScrollAnimationType | null;
  index: number;
}) {
  if (!url) return null;

  return (
    <StorySection animation={animation} index={index} className="text-center">
      <SectionTitle eyebrow="Groupe WhatsApp" title="La célébration en direct" />
      <p className="mx-auto mt-6 max-w-xs font-serif text-lg italic leading-8 text-[var(--invitation-sheet-muted)]">
        Les souvenirs, vidéos et messages des proches réunis dans un même salon.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border px-5 py-3 text-center font-serif text-xs uppercase tracking-[0.15em] transition ${ACTION_BUTTON_CLASS}`}
      >
        <MessageCircle className="size-4 shrink-0" />
        <span>Rejoindre le Groupe WhatsApp de la Célébration</span>
      </a>
    </StorySection>
  );
}

function MemoryGallery({
  event,
  index,
  animation,
}: {
  event: PublicEventPayload;
  index: number;
  animation?: ScrollAnimationType | null;
}) {
  const photos = event.galleryPhotos;
  if (photos.length === 0) return null;

  return (
    <StorySection animation={animation || "fade-up"} index={index}>
      <SectionTitle eyebrow="Galerie" title="Éclats de mémoire" />
      <div className="mt-10 grid grid-cols-2 gap-2.5">
        {photos.map((photo, index) => (
          <motion.figure
            key={photo.id}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, ease: "easeOut", delay: Math.min(index * 0.04, 0.2) }}
            className="group relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[color:var(--invitation-chip)] p-[2px]"
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
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--invitation-panel)] backdrop-blur-md"
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
  const theme = useMemo(() => normalizeThemeConfig(event.theme), [event.theme]);
  const openingVideoUrl = openingVideoSource(theme);
  const eventDateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    : "Date à confirmer";
  const hasOrganizerContact = Boolean(buildWhatsAppHref(event.organizerPhone, ""));
  const invitationSurfaceStyle = useMemo(() => themeToCssVars(theme), [theme]);

  useEffect(() => {
    Object.entries(invitationSurfaceStyle).forEach(([key, value]) => {
      if (key.startsWith("--") && value !== undefined) {
        document.documentElement.style.setProperty(key, String(value));
      }
    });
  }, [invitationSurfaceStyle]);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(countdownParts(event.eventDate)), 1_000);
    return () => clearInterval(timer);
  }, [event.eventDate]);

  return (
    <VideoOpeningGate
      videoSrc={openingVideoUrl}
      backdropSrc={theme.backdropUrl}
      ambientAudioSrc={event.musicUrl}
      monogram={monogram}
      title={names}
      fallbackGradient={theme.previewGradient}
      fallbackImage={heroPhoto}
      surfaceStyle={invitationSurfaceStyle}
      onOpened={() => setIsOpened(true)}
    >
      <div
        style={invitationSurfaceStyle}
        className="relative isolate mx-auto h-[100dvh] max-w-[440px] snap-y snap-proximity overflow-x-hidden overflow-y-auto scroll-smooth bg-transparent text-[#FFFDF9] shadow-[0_0_80px_rgba(0,0,0,.35)] [-webkit-overflow-scrolling:touch]"
      >
        <div className="pointer-events-none fixed inset-y-0 left-1/2 z-0 w-full max-w-[440px] -translate-x-1/2 overflow-hidden">
          <div className="absolute left-1/2 top-20 h-[620px] w-[390px] -translate-x-1/2 rounded-t-full border border-[color:var(--invitation-border)]" />
          <div className="absolute left-1/2 top-28 h-[540px] w-[320px] -translate-x-1/2 rounded-t-full border border-[color:var(--invitation-gold-line)]" />
          <div className="absolute -left-14 top-32 h-64 w-32 rounded-full border-r border-[color:var(--invitation-border)]" />
          <div className="absolute -right-14 top-32 h-64 w-32 rounded-full border-l border-[color:var(--invitation-border)]" />
          <div className="absolute inset-x-0 bottom-0 h-80" style={{ background: "linear-gradient(to top, var(--invitation-primary-soft), transparent)" }} />
        </div>

        <div className="relative z-10">
          <section id="hero" className="relative flex min-h-[100dvh] snap-start items-end overflow-hidden px-5 pb-10 pt-20 text-center">
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/30" />

            <motion.div
              className="relative z-10 mx-auto w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={isOpened ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <Sparkles className="mx-auto mb-6 size-7 text-[var(--invitation-gold)] drop-shadow-md" />
              <p className="font-serif text-[10px] font-semibold uppercase tracking-[0.32em] text-[var(--invitation-gold)] drop-shadow-md">
                Avec la bénédiction de nos familles
              </p>
              <h1
                style={{ fontFamily: "var(--font-great-vibes)" }}
                className="mt-6 text-6xl font-light italic leading-[0.95] tracking-wide text-[#FFFDF9] drop-shadow-[0_3px_18px_rgba(0,0,0,0.58)]"
              >
                {names}
              </h1>
              <p className="mt-7 font-serif text-xs font-semibold uppercase tracking-[0.3em] text-[#FFFDF9]/90 drop-shadow-md">{eventDateLabel}</p>
              <RoyalDivider className="mt-8" />
              <div className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2">
                {Object.entries(countdown).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[color:var(--invitation-gold-line)] bg-black/30 px-2 py-3 text-center shadow-[0_10px_30px_rgba(0,0,0,.2)] backdrop-blur-md"
                  >
                    <strong className="block font-serif text-3xl font-light italic text-[#FFFDF9] drop-shadow-md">{value}</strong>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.16em] text-[#FFFDF9]/70">{label}</span>
                  </div>
                ))}
              </div>
              <a
                href="#date"
                className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 font-serif text-[10px] uppercase tracking-[0.22em] text-[#FFFDF9]/86 backdrop-blur-md transition hover:bg-black/35"
              >
                Passer
                <ArrowDown className="size-3 animate-bounce text-[var(--invitation-gold)]" />
              </a>
            </motion.div>
          </section>

          <VerseSection event={event} index={0} animation={theme.scrollAnimation} />

          <StorySection id="date" animation={theme.scrollAnimation} index={1} className="rounded-t-[120px] pt-12 text-center">
            <TripleScratchDate date={event.eventDate} title={event.name} />
          </StorySection>

          <RoyalDivider className="my-2" />

          {(event.dressCode || event.dressCodeColors.length > 0) && (
            <>
              <StorySection animation={theme.scrollAnimation} index={2}>
                <DressCodeSection event={event} />
              </StorySection>
              <RoyalDivider className="my-2" />
            </>
          )}

          <StorySection animation={theme.scrollAnimation} index={3} className="text-center">
            <SectionTitle eyebrow="Notre histoire" title="Une promesse, deux familles" />
            <p className="mx-auto mt-7 max-w-xs font-serif text-lg leading-[1.8] text-[var(--invitation-sheet-muted)]">
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
                    className={`aspect-[4/5] overflow-hidden rounded-[28px] bg-[color:var(--invitation-chip)] p-[2px] ${
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
              <StorySection animation={theme.scrollAnimation} index={4}>
                <TimelineSection event={event} />
              </StorySection>
            </>
          )}

          {event.galleryPhotos.length > 0 && (
            <>
              <RoyalDivider className="my-2" />
              <MemoryGallery event={event} index={5} animation={theme.scrollAnimation} />
            </>
          )}

          <RoyalDivider className="my-2" />

          <StorySection id="lieu" animation={theme.scrollAnimation} index={6} className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[color:var(--invitation-chip)] text-[var(--invitation-gold)] shadow-[0_12px_30px_rgba(0,0,0,.18)]">
              <MapPin className="size-5" />
            </span>
            <SectionTitle eyebrow="Lieu" title={event.venueName ?? "Lieu à définir"} />
            {event.venueAddress && <p className="mx-auto mt-6 max-w-xs font-serif text-base leading-8 text-[var(--invitation-sheet-muted)]">{event.venueAddress}</p>}
            {event.organizerPhone && (
              <p className="mt-5 flex items-center justify-center gap-2 font-serif text-sm text-[var(--invitation-sheet-muted)]">
                <Phone className="size-4 text-[var(--invitation-gold)]" />
                {event.organizerPhone}
              </p>
            )}
            {event.venueMapUrl && (
              <Button
                asChild
                variant="outline"
                className={`mt-8 h-11 rounded-full px-5 font-serif text-xs uppercase tracking-[0.2em] ${OUTLINE_BUTTON_CLASS}`}
              >
                <a href={event.venueMapUrl} target="_blank" rel="noreferrer">
                  Ouvrir Maps
                </a>
              </Button>
            )}
          </StorySection>

          {hasOrganizerContact && (
            <>
              <RoyalDivider className="my-2" />
              <WhatsAppContactsSection event={event} index={7} animation={theme.scrollAnimation} />
              <RoyalDivider className="my-2" />
            </>
          )}

          <StorySection id="rsvp" animation={theme.scrollAnimation} index={8}>
            <SectionTitle eyebrow="RSVP" title="Votre réponse" />
            <p className="mx-auto mt-5 max-w-xs text-center font-serif text-lg italic leading-8 text-[var(--invitation-sheet-muted)]">
              Merci de confirmer votre présence avec douceur.
            </p>
            <RSVPForm event={event} guestToken={guestToken} />
          </StorySection>

          {event.whatsappGroupUrl && (
            <>
              <RoyalDivider className="my-2" />
              <WhatsAppCelebrationCTA url={event.whatsappGroupUrl} animation={theme.scrollAnimation} index={9} />
            </>
          )}

          {(event.giftIban || event.giftWave) && (
            <>
              <RoyalDivider className="my-2" />
              <StorySection animation={theme.scrollAnimation} index={10}>
                <GiftListIBAN iban={event.giftIban} wave={event.giftWave} />
              </StorySection>
            </>
          )}

          <footer className="px-6 pb-10 pt-8 text-center">
            <Flower2 className="mx-auto size-5 text-[var(--invitation-gold)]" />
            <p className="mt-4 font-serif text-xs uppercase tracking-[0.25em] text-[#FFFDF9]/62">Élégance Invitations</p>
          </footer>
        </div>
      </div>
    </VideoOpeningGate>
  );
}
