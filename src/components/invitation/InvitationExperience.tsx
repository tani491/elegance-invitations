"use client";

import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  QrCode,
  Send,
  Shirt,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { PassQrCode } from "@/components/invitation/PassQrCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  "min-h-12 rounded-xl border border-white/25 bg-white/15 px-4 text-base text-white placeholder:text-white/60 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-0";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.18em] text-[#F3E5AB] drop-shadow-sm";

function firstName(value: string | null | undefined, fallback: string) {
  return value?.trim().split(/\s+/)[0] || fallback;
}

function coupleNames(event: PublicEventPayload) {
  return `${firstName(event.brideName, "La Mariée")} & ${firstName(event.groomName, "Le Marié")}`;
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

function buildMapsHref(event: PublicEventPayload) {
  const directMapsUrl = event.venueMapUrl?.trim();
  if (directMapsUrl) return directMapsUrl;

  const query = [event.venueName, event.venueAddress]
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
    <section className="rounded-2xl border border-white/15 bg-black/30 p-6 text-white shadow-lg backdrop-blur-lg drop-shadow-md">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[#D4AF37]/30 bg-white/10 text-[#F3E5AB]">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#F3E5AB] drop-shadow-sm">{label}</p>
          <h2 className="mt-1 font-serif text-2xl italic leading-tight text-white drop-shadow-md">{title}</h2>
          {children && <div className="mt-3 text-sm leading-6 text-white/82 drop-shadow-sm">{children}</div>}
        </div>
      </div>
    </section>
  );
}

function RSVPForm({ event, guestToken, guest }: { event: PublicEventPayload; guestToken?: string; guest?: GuestPassPayload | null }) {
  const [guestName, setGuestName] = useState(guest?.fullName ?? "");
  const [status, setStatus] = useState(guest?.rsvpStatus === "declined" ? "declined" : "confirmed");
  const [plusOnes, setPlusOnes] = useState(String(guest?.plusOnes ?? 0));
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const resolvedGuestToken = guest?.qrToken ?? guestToken;

  useEffect(() => {
    if (!guest) return;
    setGuestName(guest.fullName);
    setStatus(guest.rsvpStatus === "declined" ? "declined" : "confirmed");
    setPlusOnes(String(guest.plusOnes ?? 0));
  }, [guest]);

  async function submit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();

    if (!resolvedGuestToken) {
      toast.error("Ouvrez votre lien personnel pour confirmer votre RSVP.");
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
          plusOnes: Number(plusOnes),
          guestName,
          dietaryNotes,
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
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Nom</Label>
            <Input value={guestName} onChange={(inputEvent) => setGuestName(inputEvent.target.value)} placeholder="Votre nom complet" className={FIELD_CLASS} />
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Présence</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Présent(e)</SelectItem>
                <SelectItem value="declined">Absent(e)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Nombre d&apos;accompagnants</Label>
            <Input
              type="number"
              min="0"
              max={guest?.maxGuests ?? 10}
              value={plusOnes}
              onChange={(inputEvent) => setPlusOnes(inputEvent.target.value)}
              className={FIELD_CLASS}
            />
          </div>
          <div className="space-y-2">
            <Label className={LABEL_CLASS}>Régime ou note alimentaire</Label>
            <Textarea
              value={dietaryNotes}
              onChange={(inputEvent) => setDietaryNotes(inputEvent.target.value)}
              placeholder="Allergies, menu végétarien, contraintes..."
              className="min-h-24 rounded-xl border border-white/25 bg-white/15 text-base text-white placeholder:text-white/60 backdrop-blur-md focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-0"
            />
          </div>
          <Button type="submit" disabled={submitting} className="min-h-12 rounded-full bg-[#D4AF37] text-black hover:bg-[#F3E5AB]">
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
    <InfoCard icon={<Ticket className="size-5" />} label={guest.isVip ? "Pass VIP" : "Pass invité"} title={guest.fullName}>
      <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/15 p-4 text-center backdrop-blur-md">
        <div className="rounded-xl border border-white/50 bg-white/95 p-3 shadow-inner">
          <PassQrCode value={guest.qrToken} size={176} />
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-white/75">
          {guest.table ? `Table ${guest.table}` : "Table à confirmer"} · {guest.maxGuests > 1 ? `${guest.maxGuests} accès` : "Accès nominatif"}
        </p>
      </div>
      <Button asChild className="mt-4 min-h-12 w-full rounded-full bg-[#D4AF37] text-black hover:bg-[#F3E5AB]">
        <a href={passUrl} target="_blank" rel="noreferrer">
          <Download className="size-4" />
          Enregistrer mon Pass
        </a>
      </Button>
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
        {mapsHref && (
          <Button asChild variant="outline" className="mt-4 min-h-12 w-full rounded-full border-[#D4AF37]/40 bg-white/10 text-[#F3E5AB] backdrop-blur-md hover:bg-white/20 hover:text-white">
            <a href={mapsHref} target="_blank" rel="noreferrer">
              <MapPin className="size-4" />
              Ouvrir dans Google Maps
            </a>
          </Button>
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
                <span key={`${color.label}-${color.color}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 text-xs uppercase tracking-[0.12em] text-white/75 backdrop-blur-md">
                  <span className="size-5 rounded-full border border-white shadow-inner" style={{ backgroundColor: color.color }} />
                  {color.label}
                </span>
              ))}
            </div>
          )}
        </InfoCard>
      )}

      {(contactHref || event.whatsappGroupUrl) && (
        <InfoCard icon={<MessageCircle className="size-5" />} label="Contact" title="Besoin d'aide ?">
          <div className="mt-4 grid gap-3">
            {contactHref && (
              <Button asChild variant="outline" className="min-h-12 rounded-full border-[#D4AF37]/40 bg-white/10 text-[#F3E5AB] backdrop-blur-md hover:bg-white/20 hover:text-white">
                <a href={contactHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Contacter les mariés
                </a>
              </Button>
            )}
            {event.whatsappGroupUrl && (
              <Button asChild className="min-h-12 rounded-full bg-[#D4AF37] text-black hover:bg-[#F3E5AB]">
                <a href={event.whatsappGroupUrl} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Rejoindre le groupe WhatsApp
                </a>
              </Button>
            )}
          </div>
        </InfoCard>
      )}

      {(event.giftIban || event.giftWave) && (
        <InfoCard icon={<QrCode className="size-5" />} label="Cadeau" title="Liste & contribution">
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
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 8);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

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
    fetch(`/api/public/guests/${encodeURIComponent(guestToken)}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<PublicGuestResponse>)
      .then((json) => {
        if (!ignore && json.success && json.data?.guest) setGuest(json.data.guest);
      })
      .catch((error) => {
        console.error("Guest pass lookup failed:", error);
      });

    return () => {
      ignore = true;
    };
  }, [guestToken]);

  return (
    <div style={vars} className="relative w-full min-h-screen bg-[#0d0d0d] text-[#1a1a1a] overflow-x-hidden">
      <div className="fixed inset-0 w-full h-[100dvh] max-w-md mx-auto z-0 pointer-events-none overflow-hidden">
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
            onEnded={() => setHasStarted(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full" style={{ background: event.theme.previewGradient }} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
      </div>

      {hasStarted && videoSrc && (
        <button
          type="button"
          onClick={toggleSound}
          className="fixed top-4 right-4 z-50 min-h-12 min-w-12 rounded-full bg-black/60 border border-[#d4af37]/40 p-3 text-[#d4af37] backdrop-blur-md"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}

      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col">
        {!hasStarted ? (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center">
            <button
              type="button"
              onClick={() => void handleStart()}
              className="min-h-12 rounded-full bg-[#d4af37] px-8 py-4 font-serif text-lg tracking-wider text-black shadow-2xl transition-transform animate-pulse active:scale-95"
            >
              Ouvrir l&apos;Invitation
            </button>
          </div>
        ) : (
          <>
            <div className="h-[80dvh] w-full flex flex-col justify-end items-center pb-8 pointer-events-none">
              {playbackFailed && (
                <p className="mb-4 rounded-full border border-white/15 bg-black/55 px-4 py-2 text-center text-xs text-white/85 backdrop-blur">
                  La vidéo ne peut pas être lancée ici, mais les détails restent accessibles.
                </p>
              )}

              <button
                type="button"
                onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`pointer-events-auto flex min-h-12 flex-col items-center gap-2 rounded-full border border-[#d4af37]/30 bg-black/60 px-5 py-2.5 text-white backdrop-blur-md transition-opacity duration-300 ${
                  hasScrolled ? "opacity-0" : "opacity-100 animate-bounce"
                }`}
                aria-label="Faire défiler vers le haut"
              >
                <span className="text-xs uppercase tracking-widest text-[#d4af37]">Faire défiler vers le haut</span>
                <ChevronDown className="size-4 text-[#d4af37]" />
              </button>
            </div>

            <main
              ref={detailsRef}
              className="w-full bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-[36px] shadow-[0_-10px_30px_rgba(0,0,0,0.3)] px-5 pt-8 pb-24 space-y-6 pointer-events-auto"
            >
              <div className="space-y-2 border-b border-white/20 pb-6 text-center text-white drop-shadow-md">
                <p className="text-xs uppercase tracking-widest text-[#F3E5AB]">Avec la bénédiction de nos familles</p>
                <h1 className="font-serif text-3xl text-white">{names}</h1>
                <p className="text-sm italic text-white/75">{event.invitationQuote ?? "Fi dounya wal akhir"}</p>
                <p className="pt-2 text-sm font-medium text-[#F3E5AB]">{formatEventDate(event.eventDate)}</p>
              </div>

              <GuestPassCard guest={guest} passUrl={passUrl} />
              <RSVPForm event={event} guestToken={guest?.qrToken ?? guestToken} guest={guest} />
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
