"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, MapPin, MessageCircle, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { VideoOpeningGate } from "@/components/animations/VideoOpeningGate";
import { DressCodeSection } from "@/components/invitation/DressCodeSection";
import { FloatingAudioPlayer } from "@/components/invitation/FloatingAudioPlayer";
import { GiftListIBAN } from "@/components/invitation/GiftListIBAN";
import { TimelineSection } from "@/components/invitation/TimelineSection";
import { TripleScratchDate } from "@/components/invitation/TripleScratchDate";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

function RSVPForm({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [status, setStatus] = useState("confirmed");
  const [plusOnes, setPlusOnes] = useState("0");
  const [menuChoice, setMenuChoice] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
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
      body: JSON.stringify({ guestToken, status, plusOnes: Number(plusOnes), menuChoice, dietaryNotes }),
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
        <h3 className="mt-4 font-display-bold text-xl">Merci, votre reponse est enregistree.</h3>
        {whatsappHref && (
          <Button asChild variant="outline" className="mt-5">
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Presence</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">Je serai present(e)</SelectItem>
            <SelectItem value="declined">Je ne pourrai pas venir</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Accompagnants</Label>
        <Input type="number" min="0" max="10" value={plusOnes} onChange={(e) => setPlusOnes(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Menu</Label>
        <Input value={menuChoice} onChange={(e) => setMenuChoice(e.target.value)} placeholder="Poisson, poulet, vegetarien..." />
      </div>
      <div className="space-y-2">
        <Label>Regime ou allergies</Label>
        <Textarea value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)} />
      </div>
      <Button onClick={submit} className="w-full bg-[var(--invitation-primary)] text-white">Confirmer</Button>
    </div>
  );
}

function openingVideoSource(theme: PublicEventPayload["theme"]) {
  const videoTheme = theme as VideoTheme;
  return videoTheme.customVideoUrl ?? videoTheme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

export function InvitationExperience({ event, guestToken }: { event: PublicEventPayload; guestToken?: string }) {
  const [countdown, setCountdown] = useState(() => countdownParts(event.eventDate));
  const names = `${event.brideName ?? "Mariee"} & ${event.groomName ?? "Marie"}`;
  const photos = event.officialPhotoUrls.length > 0 ? event.officialPhotoUrls : event.coverPhotoUrl ? [event.coverPhotoUrl] : [];
  const monogram = `${event.brideName?.[0] ?? "E"}${event.groomName?.[0] ?? "G"}`.toUpperCase();
  const openingVideoUrl = openingVideoSource(event.theme);

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
    >
      <div style={themeToCssVars(event.theme)} className="min-h-screen bg-[var(--invitation-secondary)] text-[#201816]">
      <FloatingAudioPlayer src={event.musicUrl} />
      <section className="relative min-h-screen overflow-hidden px-4 py-16">
        {photos[0] ? (
          <img src={photos[0]} alt={names} className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: event.theme.previewGradient }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-[var(--invitation-secondary)]" />
        <motion.div
          className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl flex-col items-center justify-center text-center text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Sparkles className="mb-6 size-8 text-[var(--invitation-gold)]" />
          <h1 className="font-script text-6xl leading-tight text-[var(--invitation-gold)] md:text-8xl">{names}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            {event.invitationQuote ?? "L'amour ne se regarde pas, il regarde ensemble dans la meme direction."}
          </p>
          <div className="mt-8 grid grid-cols-4 gap-2 text-center">
            {Object.entries(countdown).map(([label, value]) => (
              <span key={label} className="rounded-lg border border-white/20 bg-white/10 px-3 py-3">
                <strong className="block font-display-bold text-2xl">{value}</strong>
                <span className="text-[10px] uppercase tracking-[0.12em]">{label}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <TripleScratchDate date={event.eventDate} title={event.name} />
            <DressCodeSection event={event} />
            <div className="rounded-lg border border-[var(--invitation-gold)]/25 bg-white/75 p-6 text-center shadow-lg">
              <h2 className="font-display-bold text-3xl uppercase tracking-[0.16em] text-[var(--invitation-primary)]">Notre Histoire</h2>
              <p className="mt-6 leading-8 text-[#1A1818]/75">{event.coupleStory ?? "Nous avons hate de celebrer cette journee avec vous."}</p>
            </div>
          </div>
          <div className="grid gap-3">
            {photos.slice(0, 3).map((photo, index) => (
              <div key={photo} className="aspect-[9/12] overflow-hidden rounded-lg border border-[var(--invitation-gold)]/25 bg-white shadow-lg">
                <img src={photo} alt={`${names} ${index + 1}`} className="size-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <TimelineSection event={event} />

      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          <Card className="rounded-lg border-[var(--invitation-gold)]/25 bg-white/85 shadow-lg">
            <CardContent className="p-6">
              <MapPin className="mb-4 size-6 text-[var(--invitation-gold)]" />
              <h2 className="font-display-bold text-2xl text-[var(--invitation-primary)]">{event.venueName ?? "Lieu a definir"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{event.venueAddress}</p>
              {event.organizerPhone && (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-4" />
                  {event.organizerPhone}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {event.venueMapUrl && <Button asChild variant="outline"><a href={event.venueMapUrl} target="_blank" rel="noreferrer">Ouvrir Maps</a></Button>}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-[var(--invitation-gold)]/25 bg-white/85 shadow-lg">
            <CardContent className="p-6">
              <h2 className="font-display-bold text-2xl text-[var(--invitation-primary)]">RSVP</h2>
              <div className="mt-5"><RSVPForm event={event} guestToken={guestToken} /></div>
            </CardContent>
          </Card>
        </div>
        <div className="mx-auto mt-6 max-w-4xl">
          <GiftListIBAN iban={event.giftIban} wave={event.giftWave} />
        </div>
      </section>
      </div>
    </VideoOpeningGate>
  );
}
