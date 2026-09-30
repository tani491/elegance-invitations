"use client";

import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  Gift,
  Images,
  MapPin,
  MessageCircle,
  Send,
  Shirt,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { normalizeThemeConfig, themeToCssVars } from "@/lib/theme-presets";
import type { PublicEventPayload } from "@/types/database.types";

type GuestPassPayload = {
  id: string;
  fullName: string;
  table: string | null;
  maxGuests: number;
  rsvpStatus: string;
  plusOnes: number;
  isVip: boolean;
  qrToken: string;
  isCheckedIn: boolean;
};

type PublicGuestResponse = {
  success: boolean;
  error?: string;
  data?: {
    guest: GuestPassPayload;
  };
};

type VideoTheme = PublicEventPayload["theme"] & {
  videoUrl?: string | null;
  customVideoUrl?: string | null;
};

const FIELD_CLASS =
  "min-h-12 rounded-xl border border-white/20 bg-black/10 px-4 text-base text-white shadow-2xl placeholder:text-white/65 backdrop-blur-xl focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-0 disabled:opacity-70";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.18em] text-[#FFE7A3] drop-shadow-sm";
const ACTION_BUTTON_GROUP_CLASS = "w-full max-w-full flex flex-wrap sm:flex-nowrap gap-2 px-2 overflow-hidden";
const ACTION_BUTTON_CLASS =
  "w-full flex-1 min-w-0 min-h-[44px] rounded-xl px-4 text-xs font-medium sm:text-sm truncate flex items-center justify-center gap-2";
const CONTENT_REVEAL_TIME = 4.5;
const OPENING_END_TIME = 10;
const RSVP_STATUS_UNSET = "__unset__";

function coupleNames(event: PublicEventPayload) {
  return `${event.brideName?.trim() || "La Mariée"} & ${event.groomName?.trim() || "Le Marié"}`;
}

function formatEventDate(value: string | null) {
  if (!value) return "Date à confirmer";

  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function motionVideoSource(event: PublicEventPayload) {
  const theme = event.theme as VideoTheme;
  return event.motionVideoUrl ?? theme.videoUrl ?? theme.customVideoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

function buildWhatsAppHref(phone: string | null | undefined, text: string) {
  if (!phone) return null;
  const normalized = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : null;
}

function isValidExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function buildMapsHref(event: PublicEventPayload) {
  const mapsInput = event.venueMapUrl?.trim();
  if (mapsInput && isValidExternalUrl(mapsInput)) return mapsInput;

  const query = [event.venueName, event.venueAddress, mapsInput, "Sénégal"]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

function surfaceVars(theme: PublicEventPayload["theme"]) {
  return themeToCssVars(normalizeThemeConfig(theme)) as CSSProperties;
}

function InfoCard({
  icon,
  label,
  title,
  children,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/20 bg-black/10 p-6 text-white shadow-2xl backdrop-blur-2xl drop-shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFE7A3] shadow-2xl backdrop-blur-xl">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFE7A3] drop-shadow-sm">{label}</p>
          <h2 className="mt-1 font-serif text-2xl italic leading-tight text-white drop-shadow-md">{title}</h2>
          {children && <div className="mt-3 text-sm leading-6 text-white/90 drop-shadow-sm">{children}</div>}
        </div>
      </div>
    </section>
  );
}

function RSVPForm({ event, guestToken, guest }: { event: PublicEventPayload; guestToken?: string; guest?: GuestPassPayload | null }) {
  const [guestName, setGuestName] = useState(guest?.fullName ?? "");
  const [status, setStatus] = useState(guest?.rsvpStatus === "confirmed" || guest?.rsvpStatus === "declined" ? guest.rsvpStatus : RSVP_STATUS_UNSET);
  const [plusOnes, setPlusOnes] = useState(String(guest?.plusOnes ?? 0));
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const resolvedGuestToken = guest?.qrToken ?? guestToken;
  const maxAccompanying = Math.max((guest?.maxGuests ?? 1) - 1, 0);
  const isDeclined = status === "declined";
  const canAddAccompanying = status === "confirmed" && maxAccompanying > 0;

  useEffect(() => {
    if (!guest) return;
    setGuestName(guest.fullName);
    setStatus(guest.rsvpStatus === "confirmed" || guest.rsvpStatus === "declined" ? guest.rsvpStatus : RSVP_STATUS_UNSET);
    setPlusOnes(String(Math.min(guest.plusOnes ?? 0, Math.max(guest.maxGuests - 1, 0))));
  }, [guest]);

  useEffect(() => {
    if (isDeclined) setPlusOnes("0");
  }, [isDeclined]);

  async function submit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (submitting) return;

    if (!resolvedGuestToken || !guest) {
      toast.error("Ouvrez votre lien personnel pour confirmer votre RSVP.");
      return;
    }

    if (status !== "confirmed" && status !== "declined") {
      toast.error("Choisissez votre présence avant d'envoyer votre réponse.");
      return;
    }

    const requestedPlusOnes = status === "declined" ? 0 : Number(plusOnes);
    if (!Number.isFinite(requestedPlusOnes) || requestedPlusOnes < 0 || requestedPlusOnes > maxAccompanying) {
      toast.error("Le nombre d'accompagnants dépasse le quota de ce pass.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestToken: resolvedGuestToken,
          status,
          plusOnes: requestedPlusOnes,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        toast.error(json.error ?? "RSVP impossible.");
        return;
      }

      setDone(true);
      toast.success("RSVP enregistrée.");
    } catch (error) {
      console.error("RSVP submission failed:", error);
      toast.error("RSVP impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InfoCard icon={<Send className="size-5" />} label="RSVP" title={done ? "Réponse enregistrée" : "Confirmer votre présence"}>
      {done ? (
        <p>Merci, votre réponse a bien été enregistrée pour {event.name}.</p>
      ) : !guest ? (
        <p>Le formulaire RSVP est réservé aux liens nominatifs. Ouvrez le lien personnel reçu avec votre Pass invité.</p>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Nom / Prénom</Label>
            <Input value={guestName} onChange={(inputEvent) => setGuestName(inputEvent.target.value)} readOnly className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Présence</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={FIELD_CLASS}>
                <SelectValue placeholder="Choisir une réponse" />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-black/10 text-white shadow-2xl backdrop-blur-xl">
                <SelectItem value={RSVP_STATUS_UNSET}>À confirmer</SelectItem>
                <SelectItem value="confirmed">Présent(e)</SelectItem>
                <SelectItem value="declined">Absent(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status !== "declined" && (
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Nombre d&apos;accompagnants</Label>
            <Input
              type="number"
              min="0"
              max={maxAccompanying}
              value={plusOnes}
              onChange={(inputEvent) => setPlusOnes(inputEvent.target.value)}
              disabled={!canAddAccompanying}
              className={FIELD_CLASS}
            />
            <p className="text-xs text-white/68">
              {maxAccompanying > 0 ? `${maxAccompanying} accompagnant${maxAccompanying > 1 ? "s" : ""} maximum autorisé${maxAccompanying > 1 ? "s" : ""}.` : "Ce pass est nominatif, sans accompagnant."}
            </p>
          </div>
          )}
          <Button type="submit" disabled={submitting} className="h-11 rounded-full bg-[#D4AF37] px-5 text-sm text-black hover:bg-[#F3E5AB]">
            <Send className="size-4" />
            {submitting ? "Enregistrement..." : "Envoyer ma réponse"}
          </Button>
        </form>
      )}
    </InfoCard>
  );
}

function GuestPassCard({ guest, passUrl }: { guest: GuestPassPayload | null; passUrl: string | null }) {
  if (!guest || !passUrl) return null;

  return (
    <InfoCard icon={<Ticket className="size-5" />} label="Pass invité" title={guest.fullName}>
      <p className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-xs uppercase tracking-[0.18em] text-white/80 shadow-2xl backdrop-blur-xl">
        Accès nominatif • Table à confirmer
      </p>
      <Button asChild className="mt-4 h-11 w-full rounded-full bg-[#D4AF37] px-5 text-sm text-black hover:bg-[#F3E5AB]">
        <a href={passUrl} target="_blank" rel="noreferrer">
          <Download className="size-4" />
          Enregistrer mon Pass
        </a>
      </Button>
    </InfoCard>
  );
}

function GuestTokenErrorCard({ message }: { message: string }) {
  return (
    <InfoCard icon={<AlertTriangle className="size-5" />} label="Pass invité" title="Lien nominatif invalide">
      <p>{message}</p>
    </InfoCard>
  );
}

function PhotoGallery({ images }: { images: string[] }) {
  const galleryImages = Array.from(new Set(images.filter(Boolean))).slice(0, 4);

  if (galleryImages.length === 0) return null;

  return (
    <InfoCard icon={<Images className="size-5" />} label="Galerie" title="Nos plus beaux instants">
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {galleryImages.map((src, index) => (
          <div key={`${src}-${index}`} className="relative h-48 w-full overflow-hidden rounded-2xl border border-white/20 shadow-md">
            <Image
              src={src}
              alt={`Photo du couple ${index + 1}`}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </InfoCard>
  );
}

function EventDetails({ event }: { event: PublicEventPayload }) {
  const mapsHref = buildMapsHref(event);
  const contactHref = buildWhatsAppHref(event.organizerPhone, `Bonjour, j'ai une question au sujet de ${event.name}.`);

  return (
    <>
      <InfoCard icon={<CalendarDays className="size-5" />} label="Date" title={formatEventDate(event.eventDate)}>
        {event.eventTime && <p>{event.eventTime}</p>}
      </InfoCard>

      <InfoCard icon={<MapPin className="size-5" />} label="Itinéraire" title={event.venueName ?? "Lieu à confirmer"}>
        {event.venueAddress && <p>{event.venueAddress}</p>}
        {mapsHref ? (
          <div className={`mt-4 ${ACTION_BUTTON_GROUP_CLASS}`}>
            <Button
              asChild
              variant="outline"
              className={`${ACTION_BUTTON_CLASS} border-white/20 bg-white/10 text-[#F3E5AB] shadow-2xl backdrop-blur-xl hover:bg-white/15 hover:text-white`}
            >
              <a href={mapsHref} target="_blank" rel="noreferrer">
                <MapPin className="size-4 shrink-0" />
                <span className="min-w-0 truncate">Ouvrir dans Google Maps</span>
              </a>
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/72">Itinéraire à venir.</p>
        )}
      </InfoCard>

      {event.program.length > 0 && (
        <InfoCard icon={<Clock className="size-5" />} label="Programme" title="Le déroulé de la journée">
          <div className="mt-5 space-y-4">
            {event.program.map((step, index) => (
              <div key={`${step.time}-${step.title}-${index}`} className="grid grid-cols-[64px_1fr] gap-4">
                <time className="font-serif text-base italic text-[#F3E5AB]">{step.time}</time>
                <div className="border-l border-white/20 pl-4">
                  <p className="font-serif text-lg leading-6 text-white">{step.title}</p>
                  {step.location && <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/62">{step.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      )}

      {(event.dressCode || event.dressCodeColors.length > 0) && (
        <InfoCard icon={<Shirt className="size-5" />} label="Dress code" title="Palette souhaitée">
          {event.dressCode && <p>{event.dressCode}</p>}
          {event.dressCodeColors.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.dressCodeColors.map((color) => (
                <span key={`${color.label}-${color.color}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-xs uppercase tracking-[0.12em] text-white/80 shadow-2xl backdrop-blur-xl">
                  <span className="size-5 rounded-full border border-white shadow-inner" style={{ backgroundColor: color.color }} />
                  {color.label.toLocaleUpperCase("fr-FR")}
                </span>
              ))}
            </div>
          )}
        </InfoCard>
      )}

      {(contactHref || event.whatsappGroupUrl) && (
        <InfoCard icon={<MessageCircle className="size-5" />} label="Contact" title="Besoin d'aide ?">
          <div className={`mt-4 ${ACTION_BUTTON_GROUP_CLASS}`}>
            {contactHref && (
              <Button
                asChild
                variant="outline"
                className={`${ACTION_BUTTON_CLASS} border-white/20 bg-white/10 text-[#F3E5AB] shadow-2xl backdrop-blur-xl hover:bg-white/15 hover:text-white`}
              >
                <a href={contactHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">Contacter les mariés</span>
                </a>
              </Button>
            )}
            {event.whatsappGroupUrl && (
              <Button asChild className={`${ACTION_BUTTON_CLASS} bg-[#D4AF37] text-black hover:bg-[#F3E5AB]`}>
                <a href={event.whatsappGroupUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">Rejoindre le groupe WhatsApp</span>
                </a>
              </Button>
            )}
          </div>
        </InfoCard>
      )}

      {(event.giftIban || event.giftWave) && (
        <InfoCard icon={<Gift className="size-5" />} label="Cadeau" title="Liste & contribution">
          {event.giftIban && <p className="break-all">IBAN : {event.giftIban}</p>}
          {event.giftWave && <p className="break-all">Wave : {event.giftWave}</p>}
        </InfoCard>
      )}
    </>
  );
}

export function InvitationExperience({
  event,
  guestToken,
  autoOpen = false,
}: {
  event: PublicEventPayload;
  guestToken?: string;
  autoOpen?: boolean;
}) {
  const detailsRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [origin, setOrigin] = useState("");
  const [guest, setGuest] = useState<GuestPassPayload | null>(null);
  const [guestLookupError, setGuestLookupError] = useState<string | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const names = coupleNames(event);
  const theme = useMemo(() => normalizeThemeConfig(event.theme), [event.theme]);
  const vars = useMemo(() => surfaceVars(theme), [theme]);
  const videoSrc = motionVideoSource({ ...event, theme });
  const posterSrc = event.coverPhotoUrl ?? event.officialPhotoUrls[0] ?? null;
  const passUrl = origin && guest ? `${origin}/carte/${encodeURIComponent(guest.qrToken)}` : null;

  async function handleStart() {
    const video = videoRef.current;
    if (!video || !videoSrc) {
      setPlaybackFailed(true);
      setHasStarted(true);
      setShowContent(true);
      return;
    }

    try {
      video.muted = false;
      video.volume = 1;
      setIsMuted(false);
      await video.play();
      setHasStarted(true);
      setPlaybackFailed(false);
    } catch (error) {
      console.error("Cinematic video playback with sound failed:", error);
      try {
        video.muted = true;
        setIsMuted(true);
        await video.play();
        setHasStarted(true);
        setPlaybackFailed(false);
        toast("Lecture lancée en mode silencieux. Touchez le bouton son pour l'activer.");
      } catch (mutedError) {
        console.error("Cinematic video playback failed:", mutedError);
        setPlaybackFailed(true);
        setHasStarted(true);
        setShowContent(true);
        toast.error("Lecture vidéo impossible sur ce navigateur.");
      }
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!hasStarted || (video.paused && !video.ended)) {
      void video
        .play()
        .then(() => {
          setHasStarted(true);
          setPlaybackFailed(false);
        })
        .catch(() => undefined);
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    if (!showContent && video.currentTime >= CONTENT_REVEAL_TIME) {
      setShowContent(true);
    }

    if (!Number.isFinite(video.duration) || video.duration <= OPENING_END_TIME + 0.5) return;

    if (video.currentTime >= video.duration - 0.5) {
      video.currentTime = OPENING_END_TIME;
      void video.play().catch(() => undefined);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setHasStarted(true);
      setShowContent(true);
    }

    const handleReducedMotion = (eventMotion: MediaQueryListEvent) => {
      if (!eventMotion.matches) return;
      setHasStarted(true);
      setShowContent(true);
    };

    mediaQuery.addEventListener("change", handleReducedMotion);
    return () => mediaQuery.removeEventListener("change", handleReducedMotion);
  }, []);

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 8);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!hasStarted || showContent) return;

    const timeout = window.setTimeout(() => {
      setShowContent(true);
    }, CONTENT_REVEAL_TIME * 1000);

    return () => window.clearTimeout(timeout);
  }, [hasStarted, showContent]);

  useEffect(() => {
    if (!autoOpen || !videoSrc || hasStarted) return;

    const timeout = window.setTimeout(() => {
      const video = videoRef.current;
      if (!video || hasStarted) return;

      video.muted = true;
      setIsMuted(true);
      void video
        .play()
        .then(() => {
          setHasStarted(true);
          setPlaybackFailed(false);
        })
        .catch(() => undefined);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [autoOpen, hasStarted, videoSrc]);

  useEffect(() => {
    if (!guestToken) return;

    let ignore = false;
    setGuest(null);
    setGuestLookupError(null);
    fetch(`/api/public/guests/${encodeURIComponent(guestToken)}?eventId=${encodeURIComponent(event.id)}`, { cache: "no-store" })
      .then(async (response) => {
        const json = (await response.json()) as PublicGuestResponse;
        if (!response.ok || !json.success) {
          throw new Error(json.error ?? "Pass invité introuvable.");
        }
        return json;
      })
      .then((json) => {
        if (!ignore && json.success && json.data?.guest) setGuest(json.data.guest);
      })
      .catch((error) => {
        console.error("Guest pass lookup failed:", error);
        if (!ignore) setGuestLookupError(error instanceof Error ? error.message : "Pass invité introuvable.");
      });

    return () => {
      ignore = true;
    };
  }, [event.id, guestToken]);

  return (
    <div style={vars} className="relative w-full min-h-screen bg-[#0d0d0d] text-[#1a1a1a] overflow-x-hidden">
      <div className="fixed inset-0 w-full h-[100dvh] max-w-md mx-auto z-0 pointer-events-none overflow-hidden" style={{ background: event.theme.previewGradient }}>
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc ?? undefined}
            playsInline
            preload="auto"
            controls={false}
            loop={false}
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onError={() => {
              setPlaybackFailed(true);
              setHasStarted(true);
              setShowContent(true);
            }}
            onEnded={(e) => {
              const video = e.currentTarget;
              video.currentTime = Number.isFinite(video.duration) && video.duration > OPENING_END_TIME + 0.5 ? OPENING_END_TIME : 0;
              void video.play().catch(() => {
                setPlaybackFailed(true);
                setShowContent(true);
              });
            }}
            className="h-full w-full object-cover"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="h-full w-full" style={{ background: event.theme.previewGradient }} />
        )}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {hasStarted && videoSrc && (
        <button
          type="button"
          onClick={toggleSound}
          className="fixed top-4 right-4 z-50 min-h-12 min-w-12 rounded-full bg-white/10 border border-white/20 p-3 text-[#d4af37] shadow-2xl backdrop-blur-xl"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col">
        {!hasStarted ? (
          <div
            role="button"
            tabIndex={0}
            aria-label="Lancer l'invitation"
            onClick={() => void handleStart()}
            onKeyDown={(keyboardEvent) => {
              if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
                keyboardEvent.preventDefault();
                void handleStart();
              }
            }}
            className="h-[100dvh] w-full cursor-pointer"
          >
            <span className="sr-only">Lancer l&apos;invitation</span>
          </div>
        ) : !showContent ? (
          <div className="h-[100dvh] w-full" aria-hidden="true" />
        ) : (
          <>
            <div className="h-[58dvh] w-full flex flex-col justify-end items-center pb-8 pointer-events-none">
              {playbackFailed && (
                <p className="mb-4 rounded-full border border-white/20 bg-black/10 px-4 py-2 text-center text-xs text-white/90 shadow-2xl backdrop-blur-xl">
                  La vidéo ne peut pas être lancée ici, mais les détails restent accessibles.
                </p>
              )}

              <button
                type="button"
                onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`pointer-events-auto flex min-h-12 flex-col items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-white shadow-2xl backdrop-blur-xl transition-opacity duration-300 ${
                  hasScrolled ? "opacity-0" : "opacity-100 animate-bounce"
                }`}
                aria-label="Glisser vers le haut pour découvrir"
              >
                <span className="text-xs uppercase tracking-widest text-[#d4af37]">Glisser vers le haut pour découvrir</span>
                <ChevronDown className="size-4 text-[#d4af37]" />
              </button>
            </div>

            <main
              ref={detailsRef}
              className="w-full rounded-t-[36px] border border-white/20 bg-black/10 px-5 pt-8 pb-24 shadow-2xl backdrop-blur-2xl space-y-6 pointer-events-auto"
            >
              <div className="space-y-2 border-b border-white/20 pb-6 text-center text-white drop-shadow-md">
                <p className="text-xs uppercase tracking-widest text-[#FFE7A3]">Avec la bénédiction de nos familles</p>
                <h1 className="font-serif text-4xl leading-tight text-white">{names}</h1>
                <p className="text-sm italic text-white/85">{event.invitationQuote ?? "Fi dounya wal akhir"}</p>
                <div className="mx-auto grid max-w-sm gap-1 pt-3 text-sm font-medium text-[#FFE7A3]">
                  <p>{formatEventDate(event.eventDate)}</p>
                  {event.eventTime && <p>{event.eventTime}</p>}
                  {event.venueName && <p className="text-white/88">{event.venueName}</p>}
                </div>
              </div>

              {guestLookupError && <GuestTokenErrorCard message={guestLookupError} />}
              <GuestPassCard guest={guest} passUrl={passUrl} />
              <PhotoGallery images={event.galleryImages} />
              {!guestLookupError && <RSVPForm event={event} guestToken={guest?.qrToken ?? guestToken} guest={guest} />}
              <EventDetails event={event} />

              <footer className="pt-4 text-center text-xs uppercase tracking-widest text-white/60 drop-shadow-sm">
                Élégance Invitations — Maison de Prestige
              </footer>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
