"use client";

import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { MotionCover } from "./MotionCover";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock,
  Crown,
  Download,
  Gift,
  Heart,
  Images,
  MapPin,
  MessageCircle,
  Send,
  Shirt,
  Sparkles,
  Ticket,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeThemeConfig, themeToCssVars } from "@/lib/theme-presets";
import type { PublicEventPayload, ThemeConfig } from "@/types/database.types";

// ==========================================
// TYPES & CONSTANTS
// ==========================================

export type GuestPassPayload = {
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

const CONTENT_REVEAL_TIME = 1.4;
const OPENING_END_TIME = 10;
const RSVP_STATUS_UNSET = "__unset__";

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function coupleNames(event: PublicEventPayload) {
  return `${event.brideName?.trim() || "La Mariée"} & ${event.groomName?.trim() || "Le Marié"}`;
}

function coupleInitials(event: PublicEventPayload) {
  const b = event.brideName?.trim()?.charAt(0) || "M";
  const g = event.groomName?.trim()?.charAt(0) || "M";
  return `${b} & ${g}`;
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
  return (
    event.coverVideoUrl?.trim() ||
    theme.coverVideoUrl?.trim() ||
    event.motionVideoUrl ||
    theme.videoUrl ||
    theme.customVideoUrl ||
    theme.openingVideoUrl ||
    theme.demoVideoUrl ||
    null
  );
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

// ==========================================
// SHARED FORM & PASS COMPONENTS
// ==========================================

function RSVPSection({
  event,
  guestToken,
  guest,
  layout,
  goldColor,
}: {
  event: PublicEventPayload;
  guestToken?: string;
  guest?: GuestPassPayload | null;
  layout: "oriental" | "minimalist" | "royal";
  goldColor: string;
}) {
  const [guestName, setGuestName] = useState(guest?.fullName ?? "");
  const [status, setStatus] = useState(
    guest?.rsvpStatus === "confirmed" || guest?.rsvpStatus === "declined"
      ? guest.rsvpStatus
      : RSVP_STATUS_UNSET
  );
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
    setStatus(
      guest.rsvpStatus === "confirmed" || guest.rsvpStatus === "declined"
        ? guest.rsvpStatus
        : RSVP_STATUS_UNSET
    );
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
      toast.success("RSVP enregistrée avec succès.");
    } catch (error) {
      console.error("RSVP submission failed:", error);
      toast.error("RSVP impossible pour le moment.");
    } finally {
      setSubmitting(false);
    }
  }

  const containerStyle =
    layout === "oriental"
      ? "rounded-3xl border-2 border-[var(--invitation-gold)]/40 bg-black/35 p-6 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
      : layout === "minimalist"
      ? "rounded-2xl border border-white/10 bg-white/5 p-7 backdrop-blur-lg shadow-xl"
      : "rounded-3xl border border-[var(--invitation-gold)]/50 bg-black/45 p-7 backdrop-blur-xl shadow-2xl";

  const fieldStyle =
    "min-h-12 w-full rounded-xl border border-white/20 bg-black/20 px-4 text-base text-white placeholder:text-white/50 backdrop-blur-md focus:border-[var(--invitation-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--invitation-gold)]";

  return (
    <section className={containerStyle}>
      <div className="flex items-center gap-3 mb-4">
        <span
          className="grid size-10 place-items-center rounded-full border border-[var(--invitation-gold)]/40 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]"
        >
          <Send className="size-4" />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--invitation-gold)]">
            Réponse Souhaitée
          </p>
          <h3
            className="text-xl text-white font-serif italic"
            style={{ fontFamily: "var(--invitation-title-font)" }}
          >
            {done ? "Réponse enregistrée" : "Confirmer votre présence"}
          </h3>
        </div>
      </div>

      {done ? (
        <div className="rounded-xl border border-[var(--invitation-gold)]/30 bg-[var(--invitation-gold)]/10 p-5 text-center text-sm text-white">
          <Sparkles className="size-5 mx-auto mb-2 text-[var(--invitation-gold)]" />
          <p className="font-medium">Merci infiniment !</p>
          <p className="mt-1 text-white/80">Votre réponse a bien été enregistrée pour {event.name}.</p>
        </div>
      ) : !guest ? (
        <p className="text-sm leading-relaxed text-white/75">
          Le formulaire RSVP est réservé aux liens nominatifs. Ouvrez le lien personnel reçu avec votre Pass invité.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 grid gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[var(--invitation-gold)]">
              Nom / Prénom
            </Label>
            <Input value={guestName} readOnly className={fieldStyle} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-[var(--invitation-gold)]">
              Votre présence
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className={fieldStyle}>
                <SelectValue placeholder="Choisir une réponse" />
              </SelectTrigger>
              <SelectContent className="border-white/20 bg-neutral-900 text-white backdrop-blur-xl">
                <SelectItem value={RSVP_STATUS_UNSET}>À confirmer</SelectItem>
                <SelectItem value="confirmed">Présent(e) avec joie</SelectItem>
                <SelectItem value="declined">Ne pourra pas assister</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status !== "declined" && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-[var(--invitation-gold)]">
                Nombre d&apos;accompagnants
              </Label>
              <Input
                type="number"
                min="0"
                max={maxAccompanying}
                value={plusOnes}
                onChange={(e) => setPlusOnes(e.target.value)}
                disabled={!canAddAccompanying}
                className={fieldStyle}
              />
              <p className="text-xs text-white/60">
                {maxAccompanying > 0
                  ? `${maxAccompanying} accompagnant${maxAccompanying > 1 ? "s" : ""} maximum autorisé${maxAccompanying > 1 ? "s" : ""}.`
                  : "Ce pass est nominatif, sans accompagnant additionnel."}
              </p>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 w-full rounded-full font-medium transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] text-black shadow-lg"
            style={{
              backgroundColor: goldColor,
              backgroundImage: `linear-gradient(135deg, ${goldColor}, #FFF0C2, ${goldColor})`,
            }}
          >
            <Send className="size-4 mr-2" />
            {submitting ? "Enregistrement en cours..." : "Transmettre ma confirmation"}
          </Button>
        </form>
      )}
    </section>
  );
}

function GuestPassCard({
  guest,
  passUrl,
  layout,
  goldColor,
}: {
  guest: GuestPassPayload | null;
  passUrl: string | null;
  layout: "oriental" | "minimalist" | "royal";
  goldColor: string;
}) {
  if (!guest || !passUrl) return null;

  const cardStyle =
    layout === "oriental"
      ? "rounded-3xl border-2 border-[var(--invitation-gold)]/50 bg-black/40 p-6 backdrop-blur-xl text-center shadow-[0_10px_30px_rgba(212,175,55,0.2)]"
      : layout === "minimalist"
      ? "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md text-center shadow-lg"
      : "rounded-3xl border-2 border-[var(--invitation-gold)]/60 bg-gradient-to-b from-black/60 to-black/30 p-7 backdrop-blur-2xl text-center shadow-2xl";

  return (
    <section className={cardStyle}>
      <span
        className="mx-auto mb-3 grid size-12 place-items-center rounded-full border border-[var(--invitation-gold)]/50 bg-[var(--invitation-gold)]/15 text-[var(--invitation-gold)] shadow-md"
      >
        <Ticket className="size-5" />
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)]">
        Pass Invité Officiel
      </p>
      <h3
        className="mt-1 text-2xl font-serif italic text-white"
        style={{ fontFamily: "var(--invitation-title-font)" }}
      >
        {guest.fullName}
      </h3>
      <p className="mt-3 inline-block rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs uppercase tracking-widest text-white/85">
        {guest.table ? `Table : ${guest.table}` : "Accès nominatif • Table d'honneur"}
      </p>
      <div className="mt-5">
        <Button
          asChild
          className="h-11 w-full rounded-full font-medium text-black shadow-md hover:opacity-95"
          style={{
            backgroundColor: goldColor,
            backgroundImage: `linear-gradient(135deg, ${goldColor}, #FFF3D6)`,
          }}
        >
          <a href={passUrl} target="_blank" rel="noreferrer">
            <Download className="size-4 mr-2" />
            Télécharger mon Pass d&apos;accès
          </a>
        </Button>
      </div>
    </section>
  );
}

function GuestTokenErrorCard({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-rose-500/30 bg-rose-950/30 p-5 text-center text-white backdrop-blur-lg">
      <AlertTriangle className="size-6 text-rose-400 mx-auto mb-2" />
      <p className="text-xs uppercase tracking-widest text-rose-300">Lien nominatif invalide</p>
      <p className="mt-2 text-sm text-white/80">{message}</p>
    </section>
  );
}

// ==========================================
// PROGRAM / TIMELINE COMPONENT
// ==========================================

function ProgramTimeline({
  program,
  layout,
  goldColor,
}: {
  program: PublicEventPayload["program"];
  layout: "oriental" | "minimalist" | "royal";
  goldColor: string;
}) {
  if (!program || program.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--invitation-gold)]">
          {layout === "oriental" ? "Déroulé des festivités" : layout === "minimalist" ? "Programme" : "Ordre Cérémonial"}
        </p>
        <h3
          className="mt-1 text-2xl font-serif italic text-white"
          style={{ fontFamily: "var(--invitation-title-font)" }}
        >
          Le fil de la célébration
        </h3>
      </div>

      <div className="relative mt-6 space-y-6 before:absolute before:left-5 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-transparent before:via-[var(--invitation-gold)]/40 before:to-transparent">
        {program.map((step, index) => (
          <div key={`${step.time}-${step.title}-${index}`} className="flex items-start gap-4 pl-2">
            <span
              className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-medium shadow-md"
              style={{
                borderColor: goldColor,
                backgroundColor: "rgba(0,0,0,0.6)",
                color: goldColor,
              }}
            >
              {index + 1}
            </span>
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <time
                className="text-sm font-semibold tracking-wider text-[var(--invitation-gold)]"
                style={{ fontFamily: "var(--invitation-title-font)" }}
              >
                {step.time}
              </time>
              <h4 className="mt-0.5 text-base font-serif text-white">{step.title}</h4>
              {step.location && (
                <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{step.location}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// DRESS CODE & GIFT DETAILS
// ==========================================

function EventDetailsBlocks({
  event,
  layout,
  goldColor,
}: {
  event: PublicEventPayload;
  layout: "oriental" | "minimalist" | "royal";
  goldColor: string;
}) {
  const mapsHref = buildMapsHref(event);
  const contactHref = buildWhatsAppHref(
    event.organizerPhone,
    `Bonjour, je vous contacte concernant l'invitation à ${event.name}.`
  );

  async function copyToClipboard(val: string, label: string) {
    try {
      await navigator.clipboard.writeText(val);
      toast.success(`${label} copié.`);
    } catch {
      toast.error("Copie impossible.");
    }
  }

  const blockClass =
    layout === "oriental"
      ? "rounded-3xl border border-[var(--invitation-gold)]/40 bg-black/35 p-6 backdrop-blur-xl shadow-lg"
      : layout === "minimalist"
      ? "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-md"
      : "rounded-3xl border border-[var(--invitation-gold)]/50 bg-black/40 p-6 backdrop-blur-xl shadow-xl";

  return (
    <div className="space-y-6">
      {/* VENUE & ITINERARY */}
      <div className={blockClass}>
        <div className="flex items-center gap-3 mb-3">
          <span className="grid size-10 place-items-center rounded-full border border-[var(--invitation-gold)]/40 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
            <MapPin className="size-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--invitation-gold)]">
              Lieu de réception
            </p>
            <h4
              className="text-xl font-serif italic text-white"
              style={{ fontFamily: "var(--invitation-title-font)" }}
            >
              {event.venueName ?? "Lieu à confirmer"}
            </h4>
          </div>
        </div>
        {event.venueAddress && (
          <p className="text-sm text-white/80 leading-relaxed pl-13">{event.venueAddress}</p>
        )}
        {mapsHref && (
          <div className="mt-4">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full border-white/20 bg-white/10 text-[var(--invitation-gold)] backdrop-blur-md hover:bg-white/20 hover:text-white"
            >
              <a href={mapsHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                <MapPin className="size-4" />
                <span>Ouvrir l&apos;itinéraire (Google Maps)</span>
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* DRESS CODE */}
      {(event.dressCode || event.dressCodeColors.length > 0) && (
        <div className={blockClass}>
          <div className="flex items-center gap-3 mb-3">
            <span className="grid size-10 place-items-center rounded-full border border-[var(--invitation-gold)]/40 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
              <Shirt className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--invitation-gold)]">
                Dress Code
              </p>
              <h4
                className="text-xl font-serif italic text-white"
                style={{ fontFamily: "var(--invitation-title-font)" }}
              >
                {event.dressCodeColors.length > 0 ? "Palette souhaitée" : "Tenue de cérémonie"}
              </h4>
            </div>
          </div>
          {event.dressCode && (
            <p className="text-sm text-white/80 leading-relaxed mb-4">{event.dressCode}</p>
          )}
          {event.dressCodeColors.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {event.dressCodeColors.map((color) => (
                <span
                  key={`${color.label}-${color.color}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3.5 py-1.5 text-xs uppercase tracking-wider text-white shadow-sm"
                >
                  <span
                    className="size-4 rounded-full border border-white/80 shadow-inner"
                    style={{ backgroundColor: color.color }}
                  />
                  <span>{color.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GIFTS / CONTRIBUTIONS */}
      {(event.giftIban || event.giftWave) && (
        <div className={blockClass}>
          <div className="flex items-center gap-3 mb-3">
            <span className="grid size-10 place-items-center rounded-full border border-[var(--invitation-gold)]/40 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
              <Gift className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--invitation-gold)]">
                Contributions & Cadeaux
              </p>
              <h4
                className="text-xl font-serif italic text-white"
                style={{ fontFamily: "var(--invitation-title-font)" }}
              >
                Cadeau des mariés
              </h4>
            </div>
          </div>
          <p className="text-xs text-white/70 mb-4">
            Pour témoigner votre affection aux mariés selon votre convenance :
          </p>
          <div className="space-y-3">
            {event.giftIban && (
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white">
                <span className="truncate pr-2 font-mono">IBAN : {event.giftIban}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(event.giftIban!, "IBAN")}
                  className="h-8 rounded-lg px-2 text-[var(--invitation-gold)] hover:bg-white/10"
                >
                  Copier
                </Button>
              </div>
            )}
            {event.giftWave && (
              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-white">
                <span className="truncate pr-2 font-mono">Wave : {event.giftWave}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(event.giftWave!, "Wave")}
                  className="h-8 rounded-lg px-2 text-[var(--invitation-gold)] hover:bg-white/10"
                >
                  Copier
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTACT & WHATSAPP */}
      {(contactHref || event.whatsappGroupUrl) && (
        <div className={blockClass}>
          <div className="flex items-center gap-3 mb-3">
            <span className="grid size-10 place-items-center rounded-full border border-[var(--invitation-gold)]/40 bg-[var(--invitation-gold)]/10 text-[var(--invitation-gold)]">
              <MessageCircle className="size-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--invitation-gold)]">
                Contact & Informations
              </p>
              <h4
                className="text-xl font-serif italic text-white"
                style={{ fontFamily: "var(--invitation-title-font)" }}
              >
                Une question ?
              </h4>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            {contactHref && (
              <Button
                asChild
                variant="outline"
                className="flex-1 rounded-full border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
              >
                <a href={contactHref} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  <MessageCircle className="size-4 text-[var(--invitation-gold)]" />
                  <span>Contacter les mariés</span>
                </a>
              </Button>
            )}
            {event.whatsappGroupUrl && (
              <Button
                asChild
                className="flex-1 rounded-full text-black shadow-md hover:opacity-95"
                style={{
                  backgroundColor: goldColor,
                  backgroundImage: `linear-gradient(135deg, ${goldColor}, #FFF3D6)`,
                }}
              >
                <a href={event.whatsappGroupUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  <MessageCircle className="size-4" />
                  <span>Groupe WhatsApp</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// 1. LAYOUT 1 : ORIENTAL ROYAL (Arch sculptée, Typographie ornée, Vitrail)
// =========================================================================

function OrientalRoyalLayout({
  event,
  theme,
  guestToken,
  guest,
  guestLookupError,
  passUrl,
  detailsRef,
}: {
  event: PublicEventPayload;
  theme: ThemeConfig;
  guestToken?: string;
  guest: GuestPassPayload | null;
  guestLookupError: string | null;
  passUrl: string | null;
  detailsRef: React.RefObject<HTMLElement | null>;
}) {
  const names = coupleNames(event);
  const goldColor = theme.goldColor || theme.accentGold || "#D4AF37";
  const galleryImages = Array.from(new Set(event.galleryImages.filter(Boolean))).slice(0, 4);

  return (
    <motion.main
      initial={{ opacity: 0, y: 35 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      ref={detailsRef as any}
      className="relative z-20 w-full overflow-hidden box-border px-4 pt-4 pb-24 space-y-8 pointer-events-auto sm:px-6"
    >
      {/* ARCH HEADER SECTION */}
      <div
        className="relative mx-auto w-full max-w-sm overflow-hidden rounded-t-[140px] rounded-b-3xl border-2 p-6 pt-16 text-center backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
        style={{
          borderColor: `${goldColor}90`,
          background: `radial-gradient(circle at top, ${goldColor}18 0%, rgba(15, 12, 10, 0.88) 75%)`,
          boxShadow: `0 0 35px ${goldColor}30, inset 0 0 20px ${goldColor}15`,
        }}
      >
        {/* Arch crest decorative crown */}
        <div className="absolute top-4 inset-x-0 flex justify-center items-center gap-2 text-[var(--invitation-gold)] opacity-90">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--invitation-gold)]" />
          <Crown className="size-5 text-[var(--invitation-gold)]" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--invitation-gold)]" />
        </div>

        {/* Traditional oriental calligraphy invocation */}
        <p className="text-sm font-serif italic tracking-widest text-[#FFE7A3]/90 drop-shadow-md">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FFE7A3]">
          Avec la bénédiction d&apos;Allah et de nos familles
        </p>

        {/* Sculpted Names */}
        <h1
          className="mt-6 text-5xl leading-tight text-white drop-shadow-[0_2px_15px_rgba(212,175,55,0.4)]"
          style={{ fontFamily: "var(--invitation-title-font), var(--font-great-vibes), cursive" }}
        >
          {names}
        </h1>

        {/* Oriental Medallion Quote */}
        <div className="mx-auto my-6 max-w-xs rounded-2xl border border-[var(--invitation-gold)]/40 bg-black/40 p-4 shadow-inner">
          <p className="font-serif text-lg italic text-[#FFE7A3] leading-relaxed">
            « {event.invitationQuote ?? "Fi dounya wal akhir — Unis dans la grâce et la fidélité"} »
          </p>
        </div>

        {/* Event details summary */}
        <div className="space-y-1.5 pt-2 text-sm font-medium text-white/90">
          <p className="text-[#FFE7A3] text-base font-serif italic">{formatEventDate(event.eventDate)}</p>
          {event.eventTime && <p className="text-white/80">{event.eventTime}</p>}
          {event.venueName && <p className="text-white/75">{event.venueName}</p>}
        </div>
      </div>

      {/* GUEST PASS CARD */}
      {guestLookupError && <GuestTokenErrorCard message={guestLookupError} />}
      <GuestPassCard guest={guest} passUrl={passUrl} layout="oriental" goldColor={goldColor} />

      {/* VITRAIL PHOTO GALLERY (STAINED-GLASS STYLE GRID) */}
      <section className="rounded-3xl border-2 border-[var(--invitation-gold)]/40 bg-black/35 p-6 backdrop-blur-xl shadow-2xl">
        <div className="text-center mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--invitation-gold)]">
            Vitrail des Mariés
          </p>
          <h3
            className="text-2xl font-serif italic text-white mt-1"
            style={{ fontFamily: "var(--invitation-title-font)" }}
          >
            Nos Instants Précieux
          </h3>
        </div>

        {galleryImages.length === 0 ? (
          <p className="text-center text-sm text-white/70 py-6">Galerie en cours de préparation par les mariés</p>
        ) : (
          <div className="grid grid-cols-2 gap-3.5">
            {galleryImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="group relative h-60 w-full overflow-hidden rounded-t-[48px] rounded-b-2xl border-2 shadow-lg transition-transform duration-300 hover:scale-[1.02]"
                style={{
                  borderColor: `${goldColor}80`,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 14px ${goldColor}30`,
                }}
              >
                <Image
                  src={src}
                  alt={`Instants du couple ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 30vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <span className="absolute bottom-2 inset-x-0 text-center text-[10px] uppercase tracking-widest text-[#FFE7A3]">
                  Vitrail {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RSVP SECTION */}
      {!guestLookupError && (
        <RSVPSection
          event={event}
          guestToken={guest?.qrToken ?? guestToken}
          guest={guest}
          layout="oriental"
          goldColor={goldColor}
        />
      )}

      {/* PROGRAM TIMELINE */}
      <ProgramTimeline program={event.program} layout="oriental" goldColor={goldColor} />

      {/* EVENT DETAILS */}
      <EventDetailsBlocks event={event} layout="oriental" goldColor={goldColor} />

      <footer className="pt-6 pb-2 text-center text-xs uppercase tracking-[0.25em] text-[#FFE7A3]/60 drop-shadow-sm">
        Maison d&apos;Élégance Orientale — Célébration Royale
      </footer>
    </motion.main>
  );
}

// =========================================================================
// 2. LAYOUT 2 : MINIMALISTE CHIC & SATIN (Vertical épuré, Carrousel doux)
// =========================================================================

function MinimalistChicLayout({
  event,
  theme,
  guestToken,
  guest,
  guestLookupError,
  passUrl,
  detailsRef,
}: {
  event: PublicEventPayload;
  theme: ThemeConfig;
  guestToken?: string;
  guest: GuestPassPayload | null;
  guestLookupError: string | null;
  passUrl: string | null;
  detailsRef: React.RefObject<HTMLElement | null>;
}) {
  const names = coupleNames(event);
  const initials = coupleInitials(event);
  const goldColor = theme.goldColor || theme.accentGold || "#D4AF37";
  const galleryImages = Array.from(new Set(event.galleryImages.filter(Boolean))).slice(0, 6);

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      ref={detailsRef as any}
      className="relative z-20 w-full overflow-hidden box-border px-5 pt-6 pb-24 space-y-12 pointer-events-auto sm:px-8"
    >
      {/* MINIMALIST AIRY HEADER */}
      <div className="mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-black/25 p-8 text-center backdrop-blur-2xl shadow-xl space-y-6">
        {/* Monogram */}
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-white/20 bg-white/5 font-serif text-lg tracking-widest text-[var(--invitation-gold)]">
          {initials}
        </div>

        <p className="text-[10px] font-extralight uppercase tracking-[0.35em] text-white/70">
          Invitation Officielle
        </p>

        <h1
          className="text-4xl font-light tracking-wide text-white leading-tight"
          style={{ fontFamily: "var(--invitation-title-font), var(--font-cormorant), Georgia, serif" }}
        >
          {names}
        </h1>

        {/* Satin hairline divider */}
        <div className="w-16 h-px mx-auto bg-gradient-to-r from-transparent via-[var(--invitation-gold)] to-transparent" />

        {/* Spaced Quote */}
        {event.invitationQuote && (
          <p className="font-serif italic text-sm text-white/80 leading-relaxed max-w-xs mx-auto">
            « {event.invitationQuote} »
          </p>
        )}

        <div className="pt-2 text-xs font-light uppercase tracking-[0.2em] text-white/75 space-y-1">
          <p className="text-[var(--invitation-gold)]">{formatEventDate(event.eventDate)}</p>
          {event.eventTime && <p>{event.eventTime}</p>}
          {event.venueName && <p className="text-white/60">{event.venueName}</p>}
        </div>
      </div>

      {/* GUEST PASS */}
      {guestLookupError && <GuestTokenErrorCard message={guestLookupError} />}
      <GuestPassCard guest={guest} passUrl={passUrl} layout="minimalist" goldColor={goldColor} />

      {/* HORIZONTAL SMOOTH-SCROLLING CAROUSEL */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-light uppercase tracking-[0.25em] text-[var(--invitation-gold)]">
            Galerie Photographique
          </p>
          <span className="text-[10px] text-white/50 tracking-wider">Défiler &rarr;</span>
        </div>

        {galleryImages.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
            Galerie en cours de préparation par les mariés
          </div>
        ) : (
          <div
            tabIndex={0}
            aria-label="Carrousel photos du couple"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-none"
          >
            {galleryImages.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative h-80 w-[78%] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 shadow-xl"
              >
                <Image
                  src={src}
                  alt={`Instant ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 80vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 text-[11px] font-mono tracking-widest text-white/80">
                  {String(index + 1).padStart(2, "0")} / {String(galleryImages.length).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RSVP */}
      {!guestLookupError && (
        <RSVPSection
          event={event}
          guestToken={guest?.qrToken ?? guestToken}
          guest={guest}
          layout="minimalist"
          goldColor={goldColor}
        />
      )}

      {/* PROGRAM TIMELINE */}
      <ProgramTimeline program={event.program} layout="minimalist" goldColor={goldColor} />

      {/* EVENT DETAILS */}
      <EventDetailsBlocks event={event} layout="minimalist" goldColor={goldColor} />

      <footer className="pt-6 pb-2 text-center text-[10px] font-light uppercase tracking-[0.3em] text-white/50">
        Élégance Satinée • Minimaliste Chic
      </footer>
    </motion.main>
  );
}

// =========================================================================
// 3. LAYOUT 3 : PRESTIGE MAJESTIC (Défilé, Glissement au scroll, Poème doré)
// =========================================================================

function PrestigeMajesticLayout({
  event,
  theme,
  guestToken,
  guest,
  guestLookupError,
  passUrl,
  detailsRef,
}: {
  event: PublicEventPayload;
  theme: ThemeConfig;
  guestToken?: string;
  guest: GuestPassPayload | null;
  guestLookupError: string | null;
  passUrl: string | null;
  detailsRef: React.RefObject<HTMLElement | null>;
}) {
  const names = coupleNames(event);
  const goldColor = theme.goldColor || theme.accentGold || "#D4AF37";
  const galleryImages = Array.from(new Set(event.galleryImages.filter(Boolean))).slice(0, 4);

  return (
    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      ref={detailsRef as any}
      className="relative z-20 w-full overflow-hidden box-border -mt-16 rounded-t-[44px] border-t-2 border-x border-[var(--invitation-gold)]/60 bg-gradient-to-b from-[#14100c]/98 via-[#0e0c0b]/98 to-[#050505]/98 px-5 pt-8 pb-24 backdrop-blur-2xl shadow-[0_-25px_60px_rgba(0,0,0,0.85)] space-y-10 pointer-events-auto sm:px-7"
    >
      {/* Sliding card drag/slide handle indicator */}
      <div className="w-16 h-1.5 rounded-full bg-[var(--invitation-gold)]/60 mx-auto -mt-2 mb-6" />

      {/* IMPERIAL HEADER */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--invitation-gold)]/50 bg-[var(--invitation-gold)]/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)] shadow-md">
          <Crown className="size-3.5" />
          <span>Défilé & Célébration Royale</span>
        </div>

        <h1
          className="text-5xl font-serif italic text-white drop-shadow-[0_4px_20px_rgba(212,175,55,0.4)]"
          style={{ fontFamily: "var(--invitation-title-font), var(--font-cinzel), Georgia, serif" }}
        >
          {names}
        </h1>

        <p className="text-sm uppercase tracking-widest text-[#FFE7A3]">
          {formatEventDate(event.eventDate)}
        </p>
      </div>

      {/* CENTRAL GILDED FRAME: CITATION & POÈME DES MARIÉS */}
      <div
        className="relative mx-auto max-w-sm rounded-3xl border-2 p-8 text-center backdrop-blur-xl shadow-2xl space-y-4"
        style={{
          borderColor: goldColor,
          background: `radial-gradient(circle at center, ${goldColor}18 0%, rgba(10, 8, 7, 0.9) 85%)`,
          boxShadow: `0 0 35px ${goldColor}35, inset 0 0 15px ${goldColor}20`,
        }}
      >
        {/* Four ornate corner accents */}
        <span className="absolute top-2.5 left-2.5 text-xs text-[var(--invitation-gold)]">✦</span>
        <span className="absolute top-2.5 right-2.5 text-xs text-[var(--invitation-gold)]">✦</span>
        <span className="absolute bottom-2.5 left-2.5 text-xs text-[var(--invitation-gold)]">✦</span>
        <span className="absolute bottom-2.5 right-2.5 text-xs text-[var(--invitation-gold)]">✦</span>

        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#FFE7A3]">
          Le Poème des Mariés
        </p>

        <p className="font-serif text-2xl italic leading-relaxed text-[#FFE7A3] drop-shadow-md">
          « {event.invitationQuote ?? "Deux destins entrelacés pour l'éternité, sous la bénédiction des cieux et la joie de nos familles."} »
        </p>

        <div className="flex items-center justify-center gap-2 pt-2 text-[#FFE7A3]/75 text-xs">
          <Heart className="size-3.5 fill-[#FFE7A3]/75" />
          <span className="italic font-serif">Union Sacrée & Prestige</span>
          <Heart className="size-3.5 fill-[#FFE7A3]/75" />
        </div>
      </div>

      {/* GUEST PASS */}
      {guestLookupError && <GuestTokenErrorCard message={guestLookupError} />}
      <GuestPassCard guest={guest} passUrl={passUrl} layout="royal" goldColor={goldColor} />

      {/* LOOKBOOK RUNWAY COLLECTION PHOTO GALLERY */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--invitation-gold)]">
            Défilé Haute Couture
          </p>
          <h3
            className="text-2xl font-serif italic text-white mt-1"
            style={{ fontFamily: "var(--invitation-title-font)" }}
          >
            Instants du Défilé
          </h3>
        </div>

        {galleryImages.length === 0 ? (
          <div className="rounded-2xl border border-[var(--invitation-gold)]/30 bg-black/40 p-8 text-center text-sm text-white/60">
            Galerie de défilé en cours de préparation
          </div>
        ) : (
          <div className="space-y-3">
            {/* Featured top runway photo */}
            {galleryImages[0] && (
              <div
                className="relative h-72 w-full overflow-hidden rounded-3xl border-2 shadow-2xl"
                style={{ borderColor: `${goldColor}80` }}
              >
                <Image
                  src={galleryImages[0]}
                  alt="Défilé des mariés"
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-4 text-xs font-serif italic text-[#FFE7A3]">
                  Portrait d&apos;Honneur
                </span>
              </div>
            )}

            {/* Additional gallery pair */}
            {galleryImages.slice(1, 3).length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.slice(1, 3).map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative h-48 w-full overflow-hidden rounded-2xl border border-[var(--invitation-gold)]/60 shadow-lg"
                  >
                    <Image
                      src={src}
                      alt={`Défilé ${index + 2}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* RSVP */}
      {!guestLookupError && (
        <RSVPSection
          event={event}
          guestToken={guest?.qrToken ?? guestToken}
          guest={guest}
          layout="royal"
          goldColor={goldColor}
        />
      )}

      {/* PROGRAM TIMELINE */}
      <ProgramTimeline program={event.program} layout="royal" goldColor={goldColor} />

      {/* EVENT DETAILS */}
      <EventDetailsBlocks event={event} layout="royal" goldColor={goldColor} />

      <footer className="pt-6 pb-2 text-center text-xs uppercase tracking-[0.25em] text-[var(--invitation-gold)]/70 drop-shadow-sm">
        Maison Impériale — Prestige Majestic
      </footer>
    </motion.main>
  );
}

// =========================================================================
// MAIN COMPONENT: INVITATIONCLIENT
// =========================================================================

export function InvitationClient({
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
  const [isMuted, setIsMuted] = useState(true);
  const reducedMotion = useReducedMotion();
  const [playbackFailed, setPlaybackFailed] = useState(false);

  const theme = useMemo(() => normalizeThemeConfig(event.theme), [event.theme]);
  const layout = (theme.layoutStyle ?? "royal") as "oriental" | "minimalist" | "royal";
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
      setHasStarted(true);
      video.muted = true;
      setIsMuted(true);
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

    if (event.coverVideoUrl || theme.coverVideoUrl) return;
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
    const updateScrollState = () => setHasScrolled(window.scrollY > 12);
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
    fetch(`/api/public/guests/${encodeURIComponent(guestToken)}?eventId=${encodeURIComponent(event.id)}`, {
      cache: "no-store",
    })
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
    <div
      style={vars}
      data-layout={layout}
      className="invitation-layout relative w-full min-h-screen bg-[#0d0d0d] text-[#1a1a1a] overflow-x-hidden selection:bg-[var(--invitation-gold)] selection:text-black"
    >
      {/* BACKGROUND VIDEO / IMAGE BACKDROP */}
      <div
        className="fixed inset-0 w-full h-[100dvh] max-w-md mx-auto z-0 pointer-events-none overflow-hidden"
        style={{ background: event.theme.previewGradient }}
      >
        {videoSrc && !playbackFailed ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={posterSrc ?? undefined}
            playsInline
            preload="auto"
            controls={false}
            autoPlay={hasStarted && !reducedMotion}
            loop={Boolean(event.coverVideoUrl || theme.coverVideoUrl)}
            muted={isMuted}
            onTimeUpdate={handleTimeUpdate}
            onError={() => {
              setPlaybackFailed(true);
              setHasStarted(true);
              setShowContent(true);
            }}
            onEnded={(e) => {
              setShowContent(true);
              const video = e.currentTarget;
              video.currentTime =
                Number.isFinite(video.duration) && video.duration > OPENING_END_TIME + 0.5
                  ? OPENING_END_TIME
                  : 0;
              void video.play().catch(() => {
                setPlaybackFailed(true);
                setShowContent(true);
              });
            }}
            className="h-full w-full object-cover"
            style={{ objectFit: "cover" }}
          />
        ) : posterSrc ? (
          <Image src={posterSrc} alt="" fill sizes="448px" className="object-cover" priority />
        ) : (
          <div className="h-full w-full" style={{ background: event.theme.previewGradient }} />
        )}

        {/* Ambient overlay depending on reveal state */}
        <motion.div
          className="absolute inset-0 bg-black/50"
          initial={false}
          animate={{ opacity: showContent ? 1 : 0.2 }}
          transition={{ duration: reducedMotion ? 0 : 1.2 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* AUDIO SOUND TOGGLE */}
      {hasStarted && videoSrc && (
        <button
          type="button"
          onClick={toggleSound}
          className="fixed top-4 right-4 z-50 min-h-12 min-w-12 rounded-full bg-white/10 border border-white/20 p-3 text-[var(--invitation-gold)] shadow-2xl backdrop-blur-xl transition-transform active:scale-95"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>
      )}

      {/* FOREGROUND EXPERIENCE CONTAINER */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col">
        {!showContent && <MotionCover started={hasStarted} theme={theme} onOpened={() => setShowContent(true)} />}

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
            className="h-[100dvh] w-full cursor-pointer flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="rounded-full border border-[var(--invitation-gold)]/40 bg-black/40 px-6 py-3 backdrop-blur-xl shadow-2xl animate-pulse">
              <span
                className="text-white font-serif text-2xl drop-shadow-md"
                style={{ fontFamily: "var(--invitation-title-font)" }}
              >
                Touchez pour ouvrir l&apos;invitation
              </span>
            </div>
          </div>
        ) : !showContent ? (
          <div className="h-[100dvh] w-full" aria-hidden="true" />
        ) : (
          <>
            {/* SCROLL TEASER SCREEN */}
            <div
              className={`w-full flex flex-col justify-end items-center pb-8 pointer-events-none transition-all duration-300 ${
                layout === "royal" ? "h-[85dvh]" : "h-[55dvh]"
              }`}
            >
              {playbackFailed && (
                <p className="mb-4 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-center text-xs text-white/90 shadow-2xl backdrop-blur-xl">
                  Lecture vidéo automatique non supportée, les détails de l&apos;invitation sont accessibles.
                </p>
              )}

              <button
                type="button"
                onClick={() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className={`pointer-events-auto flex min-h-12 flex-col items-center gap-1.5 rounded-full border border-[var(--invitation-gold)]/40 bg-black/40 px-6 py-2.5 text-white shadow-2xl backdrop-blur-xl transition-opacity duration-300 ${
                  hasScrolled ? "opacity-0" : "opacity-100 animate-bounce"
                }`}
                aria-label="Glisser vers le haut pour découvrir"
              >
                <span className="text-xs uppercase tracking-[0.2em] text-[var(--invitation-gold)] font-medium">
                  Glisser vers le haut pour découvrir
                </span>
                <ChevronDown className="size-4 text-[var(--invitation-gold)]" />
              </button>
            </div>

            {/* DYNAMIC LAYOUT RENDERING BASED ON THEME */}
            {layout === "oriental" ? (
              <OrientalRoyalLayout
                event={event}
                theme={theme}
                guestToken={guestToken}
                guest={guest}
                guestLookupError={guestLookupError}
                passUrl={passUrl}
                detailsRef={detailsRef}
              />
            ) : layout === "minimalist" ? (
              <MinimalistChicLayout
                event={event}
                theme={theme}
                guestToken={guestToken}
                guest={guest}
                guestLookupError={guestLookupError}
                passUrl={passUrl}
                detailsRef={detailsRef}
              />
            ) : (
              <PrestigeMajesticLayout
                event={event}
                theme={theme}
                guestToken={guestToken}
                guest={guest}
                guestLookupError={guestLookupError}
                passUrl={passUrl}
                detailsRef={detailsRef}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Export alias for seamless backwards compatibility
export { InvitationClient as InvitationExperience };
export default InvitationClient;
