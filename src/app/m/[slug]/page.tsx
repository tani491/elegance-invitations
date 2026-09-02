"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, useInView } from "framer-motion";
import { jsPDF } from "jspdf";
import { QRCodeSVG } from "qrcode.react";
import {
  ChevronDown,
  Church,
  Wine,
  Music,
  Sunrise,
  MapPin,
  CheckCircle,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/* ------------------------------------------------------------------
   Mock data
   ------------------------------------------------------------------ */

const COUPLE = {
  names: "Aminata & Cheikh",
  firstName: "Aminata",
  secondName: "Cheikh",
  date: "Samedi 14 Juin 2025",
  slug: "aminata-cheikh-2025",
};

const TIMELINE_ITEMS = [
  {
    time: "15h00",
    title: "Cérémonie Religieuse",
    location: "Église Notre-Dame, Dakar",
    Icon: Church,
  },
  {
    time: "17h00",
    title: "Réception",
    location: "Salle Le Saloum, Almadies",
    Icon: Wine,
  },
  {
    time: "19h00",
    title: "Dîner & Soirée",
    location: "Dîner servi, musique live",
    Icon: Music,
  },
  {
    time: "23h00",
    title: "Brunch du lendemain",
    location: "Hôtel Terrou-Bi, les pieds dans l'eau",
    Icon: Sunrise,
  },
];

const HISTOIRE_PARAGRAPHS = [
  "Notre histoire a commencé un soir d'août 2019, lors d'une exposition d'art contemporain à la Fondation Léopold Sédar Senghor. Aminata admirait une toile aux teintes ocre quand un regard croisé a tout changé. Cheikh, debout à quelques pas, a été frappé par sa grâce naturelle et son sourire lumineux.",
  "De cette rencontre fortuite est née une conversation qui ne devait jamais s'arrêter. Des cafés sur la Corniche Ouest aux promenades dans l'île de Gorée, chaque moment partagé tissait les fils d'une complicité rare. Deux ans plus tard, sous les étoiles de Ngor, Cheikh a posé la question avec une bague qui appartenait à sa grand-mère.",
  "Aujourd'hui, nous vous invitons à célébrer avec nous l'union de deux cœurs, de deux familles et de deux héritages. Votre présence est le plus beau des cadeaux.",
];

/* ------------------------------------------------------------------
   Reusable animated section wrapper
   ------------------------------------------------------------------ */

function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   Ornamental divider
   ------------------------------------------------------------------ */

function OrnamentalDivider() {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <span className="divider-ornament h-px w-16 bg-gradient-to-r from-transparent to-[#D4AF37]" />
      <Sparkles className="h-4 w-4 text-[#D4AF37]" />
      <span className="divider-ornament h-px w-16 bg-gradient-to-l from-transparent to-[#D4AF37]" />
    </div>
  );
}

/* ------------------------------------------------------------------
   Main Page Component
   ------------------------------------------------------------------ */

export default function GuestInvitationPage() {
  const params = useParams();
  const slug = params.slug as string;

  /* RSVP state */
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [menuChoice, setMenuChoice] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* QR ref for PDF */
  const qrRef = useRef<HTMLDivElement>(null);

  /* ---- Handlers ---- */

  const handleRsvpSubmit = useCallback(() => {
    if (!guestName.trim() || !menuChoice) return;
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  }, [guestName, menuChoice]);

  const handleDownloadPass = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a7" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 5;

    /* Gold border */
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2);

    /* Inner decorative line */
    doc.setLineWidth(0.3);
    doc.rect(margin + 2, margin + 2, pageW - (margin + 2) * 2, pageH - (margin + 2) * 2);

    /* Title */
    doc.setFontSize(14);
    doc.setTextColor(92, 29, 36); // burgundy
    doc.text("PASS D'INVITATION", pageW / 2, 18, { align: "center" });

    /* Divider line */
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.4);
    doc.line(margin + 10, 22, pageW - margin - 10, 22);

    /* Couple names */
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // gold
    doc.text(COUPLE.names, pageW / 2, 32, { align: "center" });

    /* Guest name */
    doc.setFontSize(10);
    doc.setTextColor(26, 24, 24);
    doc.text(`Invité : ${guestName || "Non renseigné"}`, pageW / 2, 40, { align: "center" });

    /* Event date */
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(COUPLE.date, pageW / 2, 47, { align: "center" });

    /* Venue */
    doc.text("Salle Le Saloum, Almadies — Dakar", pageW / 2, 53, { align: "center" });

    /* QR code placeholder */
    doc.setDrawColor(212, 175, 55);
    doc.setFillColor(250, 247, 242);
    doc.roundedRect(pageW / 2 - 12, 58, 24, 24, 2, 2, "FD");
    doc.setFontSize(6);
    doc.setTextColor(212, 175, 55);
    doc.text("QR CODE", pageW / 2, 70, { align: "center" });
    doc.text("INVITATION", pageW / 2, 74, { align: "center" });

    /* Table number */
    doc.setFontSize(10);
    doc.setTextColor(92, 29, 36);
    doc.text("Table A", pageW / 2, 90, { align: "center" });

    /* Footer */
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);
    doc.text("Élégance — Invitations sur mesure", pageW / 2, pageH - 8, { align: "center" });

    doc.save(`pass-invitation-${slug || "mariage"}.pdf`);
  }, [guestName, slug]);

  /* ---- Render ---- */

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-body">
      {/* ============================================================
          1. MINIMAL TOP BAR
          ============================================================ */}
      <div className="sticky top-0 z-40 bg-[#FAF7F2]/80 backdrop-blur-md">
        <div className="flex items-center justify-center px-4 py-3">
          <p className="font-script text-lg text-[#5C1D24]/80">
            L&apos;invitation de {COUPLE.names}
          </p>
        </div>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </div>

      {/* ============================================================
          2. HERO D'OUVERTURE
          ============================================================ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#5C1D24] to-[#3A1118] px-4 text-center">
        {/* Ornament top */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <OrnamentalDivider />
        </motion.div>

        {/* Couple names */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="font-script text-gold-gradient text-5xl leading-tight md:text-7xl"
        >
          {COUPLE.names}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
          className="font-display-light mt-6 text-lg text-white/80 md:text-xl"
        >
          Vous êtes cordialement invités
        </motion.p>

        {/* Date */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1, ease: "easeOut" }}
          className="font-display tracking-luxury mt-4 text-gold-gradient text-xl md:text-2xl"
        >
          {COUPLE.date}
        </motion.p>

        {/* Ornament bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-8"
        >
          <OrnamentalDivider />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { delay: 2, duration: 0.8 },
            y: { delay: 2, duration: 1.8, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute bottom-8"
        >
          <ChevronDown className="h-8 w-8 text-[#D4AF37]/60" />
        </motion.div>
      </section>

      {/* ============================================================
          3. NOTRE HISTOIRE
          ============================================================ */}
      <section id="histoire" className="bg-[#FAF7F2] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <AnimatedSection>
            <h2 className="font-display-bold tracking-luxury text-3xl text-[#1A1818] md:text-4xl">
              Notre Histoire
            </h2>
            <div className="mt-4">
              <OrnamentalDivider />
            </div>
          </AnimatedSection>

          <div className="mt-10 space-y-6">
            {HISTOIRE_PARAGRAPHS.map((para, i) => (
              <AnimatedSection key={i} delay={0.15 * (i + 1)}>
                <p className="font-body leading-relaxed text-[#1A1818]/80 text-base md:text-lg">
                  {para}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. LE PROGRAMME
          ============================================================ */}
      <section
        id="programme"
        className="bg-[#1A1818] px-4 py-20 md:py-28"
      >
        <div className="mx-auto max-w-xl">
          <AnimatedSection>
            <h2 className="font-display-bold tracking-luxury text-center text-3xl text-[#FAF7F2] md:text-4xl">
              Le Programme
            </h2>
            <div className="mt-4">
              <OrnamentalDivider />
            </div>
          </AnimatedSection>

          <div className="relative mt-12 space-y-0">
            {/* Vertical gold line */}
            <div className="absolute bottom-0 left-5 top-0 w-px bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/40 to-transparent md:left-7" />

            {TIMELINE_ITEMS.map((item, i) => (
              <AnimatedSection key={i} delay={0.2 * (i + 1)}>
                <div className="relative flex gap-5 pb-10 pl-0 md:gap-7">
                  {/* Dot on the line */}
                  <div className="relative z-10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-[#1A1818] md:h-14 md:w-14">
                    <item.Icon className="h-4 w-4 text-[#D4AF37] md:h-5 md:w-5" />
                  </div>

                  {/* Content card */}
                  <div className="flex-1 pt-0.5">
                    <span className="font-display tracking-luxury text-sm text-[#D4AF37]">
                      {item.time}
                    </span>
                    <h3 className="font-display-bold mt-1 text-lg text-[#FAF7F2]">
                      {item.title}
                    </h3>
                    <p className="font-body mt-1 text-sm text-[#FAF7F2]/60">
                      {item.location}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. LE LIEU
          ============================================================ */}
      <section id="lieu" className="bg-[#FAF7F2] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-lg">
          <AnimatedSection>
            <h2 className="font-display-bold tracking-luxury text-center text-3xl text-[#1A1818] md:text-4xl">
              Le Lieu
            </h2>
            <div className="mt-4">
              <OrnamentalDivider />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="mt-10">
            <Card className="card-luxury-elevated overflow-hidden border border-[#D4AF37]/20 bg-white">
              {/* Venue illustration */}
              <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-[#5C1D24]/10 via-[#D4AF37]/10 to-[#5C1D24]/5">
                <MapPin className="h-12 w-12 text-[#D4AF37]/40" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI0Q0QUYzNyIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3N2Zz4=')] opacity-50" />
              </div>
              <CardContent className="p-6">
                <h3 className="font-display text-2xl text-[#1A1818]">
                  Salle Le Saloum
                </h3>
                <p className="font-body mt-2 text-sm text-muted-foreground">
                  Route des Almadies, Dakar, Sénégal
                </p>
                <p className="font-body mt-1 text-sm text-muted-foreground">
                  À 15 minutes de l&apos;aéroport international
                </p>
                <Button
                  variant="outline"
                  className="btn-luxury mt-6 w-full border-[#D4AF37]/40 text-[#5C1D24] hover:bg-[#D4AF37]/10 hover:text-[#5C1D24]"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Voir sur la carte
                </Button>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================================
          6. RSVP & PASS
          ============================================================ */}
      <section
        id="rsvp"
        className="bg-gradient-to-b from-[#FAF7F2] to-[#F0EBE3] px-4 py-20 md:py-28"
      >
        <div className="mx-auto max-w-md">
          <AnimatedSection>
            <h2 className="font-display-bold tracking-luxury text-center text-3xl text-[#1A1818] md:text-4xl">
              Confirmez Votre Présence
            </h2>
            <div className="mt-4">
              <OrnamentalDivider />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="mt-10">
            <Card className="card-luxury border border-[#D4AF37]/20 bg-white p-6">
              {isSubmitted ? (
                /* ---- Success State ---- */
                <div className="flex flex-col items-center py-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <CheckCircle className="h-16 w-16 text-[#D4AF37]" />
                  </motion.div>
                  <h3 className="font-display-bold mt-6 text-xl text-[#1A1818]">
                    Merci ! Votre présence est confirmée.
                  </h3>
                  <p className="font-body mt-2 text-muted-foreground">
                    Votre table : <span className="font-display-bold text-[#5C1D24]">Table A</span>
                  </p>
                </div>
              ) : (
                /* ---- Form ---- */
                <div className="space-y-5">
                  {/* Full name */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="guest-name"
                      className="font-display text-sm text-[#1A1818]"
                    >
                      Votre nom complet
                    </Label>
                    <Input
                      id="guest-name"
                      placeholder="Ex : Marie Dupont"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="border-[#D4AF37]/20 bg-[#FAF7F2] font-body placeholder:text-muted-foreground/60 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
                    />
                  </div>

                  {/* Number of guests */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="guest-count"
                      className="font-display text-sm text-[#1A1818]"
                    >
                      Nombre de personnes
                    </Label>
                    <Select value={guestCount} onValueChange={setGuestCount}>
                      <SelectTrigger
                        id="guest-count"
                        className="w-full border-[#D4AF37]/20 bg-[#FAF7F2] font-body focus:ring-[#D4AF37]/20"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="1">1 personne</SelectItem>
                        <SelectItem value="2">2 personnes</SelectItem>
                        <SelectItem value="3">3 personnes</SelectItem>
                        <SelectItem value="4">4 personnes</SelectItem>
                        <SelectItem value="5">5 personnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Menu choice */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="menu-choice"
                      className="font-display text-sm text-[#1A1818]"
                    >
                      Choix de menu
                    </Label>
                    <Select value={menuChoice} onValueChange={setMenuChoice}>
                      <SelectTrigger
                        id="menu-choice"
                        className="w-full border-[#D4AF37]/20 bg-[#FAF7F2] font-body focus:ring-[#D4AF37]/20"
                      >
                        <SelectValue placeholder="Sélectionnez votre menu" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="poulet">Poulet</SelectItem>
                        <SelectItem value="poisson">Poisson</SelectItem>
                        <SelectItem value="vegetarien">Végétarien</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="font-display text-sm text-[#1A1818]"
                    >
                      Notes alimentaires{" "}
                      <span className="text-muted-foreground">(facultatif)</span>
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Allergies, régimes spéciaux..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-[80px] resize-none border-[#D4AF37]/20 bg-[#FAF7F2] font-body placeholder:text-muted-foreground/60 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/20"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleRsvpSubmit}
                    disabled={!guestName.trim() || !menuChoice || isSubmitting}
                    className="btn-luxury h-12 w-full bg-[#5C1D24] font-display text-base text-white hover:bg-[#5C1D24]/90"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Envoi en cours…
                      </span>
                    ) : (
                      "Confirmer ma présence"
                    )}
                  </Button>
                </div>
              )}
            </Card>
          </AnimatedSection>

          {/* Download pass */}
          <AnimatedSection delay={0.35} className="mt-6">
            <Button
              variant="outline"
              onClick={handleDownloadPass}
              className="btn-luxury w-full border-[#D4AF37]/40 text-[#5C1D24] hover:bg-[#D4AF37]/10 hover:text-[#5C1D24]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Télécharger mon Pass d&apos;invitation
            </Button>
          </AnimatedSection>

          {/* Hidden QR for potential future use */}
          <div className="invisible absolute" aria-hidden="true">
            <div ref={qrRef}>
              <QRCodeSVG
                value={`https://elegance.sn/m/${slug || COUPLE.slug}`}
                size={120}
                bgColor="#FAF7F2"
                fgColor="#5C1D24"
                level="M"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. GALERIE LINK
          ============================================================ */}
      <section className="bg-[#FAF7F2] px-4 py-16 md:py-20">
        <div className="mx-auto max-w-md">
          <AnimatedSection>
            <Card className="card-luxury border border-[#D4AF37]/20 bg-white p-6">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F0EBE3]">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-display-bold mt-4 text-xl text-[#1A1818]">
                  La galerie photo
                </h3>
                <p className="font-body mt-2 text-sm text-muted-foreground">
                  La galerie photo sera disponible après l&apos;événement.
                </p>
                <Button
                  disabled
                  className="mt-6 w-full bg-muted font-body text-muted-foreground"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Accéder à la galerie
                </Button>
                <p className="font-body mt-3 text-xs text-muted-foreground/70">
                  Protégée par un code secret des mariés
                </p>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================================
          8. FOOTER SPACER
          ============================================================ */}
      <div className="h-20" />

      {/* ============================================================
          8. BOTTOM ANCHOR NAV
          ============================================================ */}
      <nav className="glass-luxury fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-[#D4AF37]/20 bg-white/80 px-2 py-1.5 shadow-lg backdrop-blur-md md:gap-2 md:px-3">
        {[
          { label: "Histoire", href: "#histoire" },
          { label: "Programme", href: "#programme" },
          { label: "Lieu", href: "#lieu" },
          { label: "RSVP", href: "#rsvp" },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="rounded-full px-3 py-1.5 font-body text-xs text-[#1A1818]/70 transition-colors hover:bg-[#D4AF37]/10 hover:text-[#5C1D24] md:px-4 md:text-sm"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
