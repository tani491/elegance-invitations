"use client";

import { type CSSProperties, type FormEvent, type ReactNode, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  QrCode,
  RotateCcw,
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
  "min-h-12 rounded-xl border-[#E9DDC9] bg-white px-4 text-base text-[#211916] placeholder:text-stone-400 focus-visible:ring-[#D4AF37]";
const LABEL_CLASS = "text-xs font-semibold uppercase tracking-[0.18em] text-stone-500";

function firstName(value: string | null | undefined, fallback: string) {
  return value?.trim().split(/\s+/)[0] || fallback;
}

function coupleNames(event: PublicEventPayload) {
  return `${firstName(event.brideName, "La Mariée")} & ${firstName(event.groomName, "Le Marié")}`;
}

function coupleMonogram(event: PublicEventPayload) {
  return `${firstName(event.brideName, "E").charAt(0)}${firstName(event.groomName, "I").charAt(0)}`.toUpperCase();
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
    <section className="rounded-2xl border border-[#E9DDC9] bg-white p-5 shadow-[0_14px_40px_rgba(31,25,18,.06)]">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F7F0E4] text-[#A47A29]">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">{label}</p>
          <h2 className="mt-1 font-serif text-2xl italic leading-tight text-[#211916]">{title}</h2>
          {children && <div className="mt-3 text-sm leading-6 text-stone-600">{children}</div>}
        </div>
      </div>
    </section>
  );
}

function CinematicVideoSection({
  event,
  names,
  monogram,
  videoSrc,
  posterSrc,
  detailsRef,
  hasScrolled,
  autoOpen,
}: {
  event: PublicEventPayload;
  names: string;
  monogram: string;
  videoSrc: string | null;
  posterSrc: string | null;
  detailsRef: RefObject<HTMLElement | null>;
  hasScrolled: boolean;
  autoOpen?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "paused" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollHintVisible = !hasScrolled && (autoOpen || status !== "idle" || failed || !videoSrc);

  async function playWithSound(replay = false) {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    try {
      if (replay) {
        video.currentTime = 0;
      }
      video.muted = false;
      video.volume = 1;
      setMuted(false);
      await video.play();
      setStatus("playing");
      setFailed(false);
    } catch (error) {
      console.error("Cinematic video playback with sound failed:", error);
      try {
        video.muted = true;
        setMuted(true);
        await video.play();
        setStatus("playing");
        toast("Lecture lancée en mode silencieux. Touchez le bouton son pour l'activer.");
      } catch (mutedError) {
        console.error("Cinematic video playback failed:", mutedError);
        setFailed(true);
        toast.error("Lecture vidéo impossible sur ce navigateur.");
      }
    }
  }

  function togglePlayback() {
    const video = videoRef.current;
    if (!videoSrc || !video) return;

    if (status === "playing") {
      video.pause();
      setStatus("paused");
      return;
    }

    void playWithSound(status === "ended");
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused && status !== "ended") {
      void video.play().then(() => setStatus("playing")).catch(() => undefined);
    }
  }

  return (
    <section className="sticky top-0 z-0 mx-auto flex h-[100dvh] w-full max-w-md items-center justify-center overflow-hidden bg-black text-white">
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc ?? undefined}
          playsInline
          preload="auto"
          controls={false}
          loop={false}
          onClick={() => {
            if (status === "idle" || status === "paused" || status === "ended") void playWithSound(status === "ended");
          }}
          onPlay={() => setStatus("playing")}
          onPause={() => {
            if (!videoRef.current?.ended) setStatus("paused");
          }}
          onEnded={() => setStatus("ended")}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="aspect-[9/16] h-full max-h-[100dvh] w-full" style={{ background: event.theme.previewGradient }} />
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/16 to-black/48" />

      {(status === "idle" || failed || !videoSrc) && (
        <button
          type="button"
          onClick={() => void playWithSound(false)}
          disabled={!videoSrc}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 text-center disabled:cursor-default"
          aria-label="Lancer la vidéo cinématique"
        >
          <span className="mb-5 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#D4AF37]">Invitation cinématique</span>
          <span className="grid size-24 place-items-center rounded-full border border-[#FFF4C4]/50 bg-[#D4AF37]/95 text-[#211916] shadow-[0_24px_70px_rgba(0,0,0,.42)]">
            <Play className="ml-1 size-10 fill-current" />
          </span>
          <span className="mt-7 font-serif text-5xl italic leading-none text-white drop-shadow-[0_8px_36px_rgba(0,0,0,.75)]">
            {names}
          </span>
          <span className="mt-4 rounded-full border border-white/20 bg-black/35 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/82 backdrop-blur">
            {videoSrc ? "Touchez pour démarrer avec le son" : "Vidéo bientôt disponible"}
          </span>
        </button>
      )}

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-full border border-white/18 bg-black/30 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-white/80 backdrop-blur">
        {monogram}
      </div>

      {videoSrc && status !== "idle" && (
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            className="size-12 rounded-full border-white/20 bg-black/35 text-[#D4AF37] backdrop-blur hover:bg-black/55 hover:text-[#D4AF37]"
            aria-label={status === "playing" ? "Mettre en pause" : "Relancer la vidéo"}
          >
            {status === "ended" ? <RotateCcw className="size-5" /> : status === "playing" ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleMute}
            className="size-12 rounded-full border-white/20 bg-black/35 text-[#D4AF37] backdrop-blur hover:bg-black/55 hover:text-[#D4AF37]"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className={`absolute bottom-6 left-1/2 z-30 flex min-h-12 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 flex-col items-center justify-center rounded-full border border-[#D4AF37]/45 bg-black/48 px-5 py-3 text-center text-white shadow-[0_18px_60px_rgba(0,0,0,.36)] backdrop-blur-md transition duration-500 ${
          scrollHintVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
        aria-label="Faire défiler vers les détails de l'invitation"
      >
        <ChevronDown className="mb-1 size-6 animate-bounce text-[#D4AF37]" />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/86">Faites défiler pour voir les détails</span>
      </button>
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
              className="min-h-24 rounded-xl border-[#E9DDC9] bg-white text-base text-[#211916] placeholder:text-stone-400 focus-visible:ring-[#D4AF37]"
            />
          </div>
          <Button type="submit" disabled={submitting} className="min-h-12 rounded-full bg-[#211916] text-white hover:bg-[#332621]">
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
      <div className="mt-5 flex flex-col items-center gap-4 rounded-2xl border border-[#E9DDC9] bg-[#FDFBF7] p-4 text-center">
        <PassQrCode value={guest.qrToken} size={176} />
        <p className="text-xs uppercase tracking-[0.18em] text-stone-500">
          {guest.table ? `Table ${guest.table}` : "Table à confirmer"} · {guest.maxGuests > 1 ? `${guest.maxGuests} accès` : "Accès nominatif"}
        </p>
      </div>
      <Button asChild className="mt-4 min-h-12 w-full rounded-full bg-[#D4AF37] text-[#211916] hover:bg-[#C6A030]">
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
          <Button asChild variant="outline" className="mt-4 min-h-12 w-full rounded-full border-[#D4AF37] text-[#211916]">
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
                <time className="font-serif text-base italic text-[#A47A29]">{step.time}</time>
                <div className="border-l border-[#E9DDC9] pl-4">
                  <p className="font-serif text-lg leading-6 text-[#211916]">{step.title}</p>
                  {step.location && <p className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">{step.location}</p>}
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
                <span key={`${color.label}-${color.color}`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E9DDC9] bg-[#FDFBF7] px-3 text-xs uppercase tracking-[0.12em] text-stone-600">
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
              <Button asChild variant="outline" className="min-h-12 rounded-full border-[#D4AF37] text-[#211916]">
                <a href={contactHref} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" />
                  Contacter les mariés
                </a>
              </Button>
            )}
            {event.whatsappGroupUrl && (
              <Button asChild className="min-h-12 rounded-full bg-[#211916] text-white hover:bg-[#332621]">
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
  const [origin, setOrigin] = useState("");
  const [guest, setGuest] = useState<GuestPassPayload | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const names = coupleNames(event);
  const monogram = coupleMonogram(event);
  const theme = useMemo(() => normalizeThemeConfig(event.theme), [event.theme]);
  const vars = useMemo(() => surfaceVars(theme), [theme]);
  const videoSrc = motionVideoSource({ ...event, theme });
  const posterSrc = event.coverPhotoUrl ?? event.officialPhotoUrls[0] ?? null;
  const passUrl = origin && guest ? `${origin}/carte/${encodeURIComponent(guest.qrToken)}` : null;

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
    <main style={vars} className="relative min-h-screen w-full overflow-x-hidden bg-black text-[#211916]">
      <CinematicVideoSection
        event={event}
        names={names}
        monogram={monogram}
        videoSrc={videoSrc}
        posterSrc={posterSrc}
        detailsRef={detailsRef}
        hasScrolled={hasScrolled}
        autoOpen={autoOpen}
      />

      <section
        ref={detailsRef}
        className="relative z-10 mx-auto mt-[-15dvh] w-full max-w-md rounded-t-3xl border-t border-[#D4AF37]/30 bg-[#FDFBF7] px-4 pb-16 pt-6 text-[#211916] shadow-[0_-24px_80px_rgba(0,0,0,.34)]"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#D4AF37]/40" aria-hidden="true" />
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A47A29]">Élégance Invitations</p>
          <h1 className="mt-3 font-serif text-4xl italic leading-none">{names}</h1>
          <p className="mt-4 text-sm leading-6 text-stone-600">{event.invitationQuote ?? "Nous avons l'honneur de vous convier à célébrer notre union."}</p>
        </div>

        <div className="grid gap-4">
          <GuestPassCard guest={guest} passUrl={passUrl} />
          <RSVPForm event={event} guestToken={guest?.qrToken ?? guestToken} guest={guest} />
          <EventDetails event={event} />
        </div>
      </section>
    </main>
  );
}
