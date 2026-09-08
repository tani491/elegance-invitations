"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Palette, PenTool, Send, ChevronDown, CheckCircle2, QrCode,
  Star, Quote, ChevronRight, X, Smartphone, Play, MessageCircle,
  CalendarCheck, Camera, Gem, ShieldCheck,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { subscribeThemeCatalogChanges } from "@/lib/theme-sync";
import { ELEGANCE_ORDER_WHATSAPP_URL } from "@/lib/whatsapp";
import type { HomepageSettings, ThemeConfig } from "@/types/database.types";

/* -------------------------------------------------------------------------- */
/*  Color constants                                                           */
/* -------------------------------------------------------------------------- */

const GOLD = "#D4AF37";
const BURGUNDY = "#5C1D24";
const EBONY = "#1A1818";
const IVORY = "#FAF7F2";

const WHATSAPP_URL = ELEGANCE_ORDER_WHATSAPP_URL;

/* -------------------------------------------------------------------------- */
/*  Template data with categories                                              */
/* -------------------------------------------------------------------------- */

interface Template {
  slug?: string;
  name: string;
  category: string;
  gradient: string;
  accent: string;
  animationHint: string;
  primaryColor?: string;
  secondaryColor?: string;
  goldColor?: string;
  titleFont?: string;
  openingVideoUrl?: string | null;
  demoVideoUrl?: string | null;
}

const TEMPLATES: Template[] = [
  {
    name: "Enveloppe de Cire",
    category: "cire",
    gradient: "linear-gradient(135deg, #D4AF37 0%, #F5E6B8 40%, #C9A227 100%)",
    accent: "#D4AF37",
    animationHint: "wax",
  },
  {
    name: "Velours Royal",
    category: "cire",
    gradient: "linear-gradient(135deg, #5C1D24 0%, #8B3A42 50%, #3D1218 100%)",
    accent: "#8B3A42",
    animationHint: "envelope",
  },
  {
    name: "Rideau de Théâtre",
    category: "ruban",
    gradient: "linear-gradient(135deg, #6B0F1A 0%, #A02030 30%, #4A0A12 100%)",
    accent: "#A02030",
    animationHint: "ribbon",
  },
  {
    name: "Médina Orientale",
    category: "orientale",
    gradient: "linear-gradient(135deg, #D4AF37 0%, #C87533 50%, #E8C872 100%)",
    accent: "#C87533",
    animationHint: "doors",
  },
  {
    name: "Roseraie Bohème",
    category: "boheme",
    gradient: "linear-gradient(135deg, #F2D1DC 0%, #E8A0B8 50%, #F5E0E8 100%)",
    accent: "#D4849A",
    animationHint: "envelope",
  },
  {
    name: "Classique Intemporel",
    category: "minimaliste",
    gradient: "linear-gradient(135deg, #1A1818 0%, #333333 50%, #1A1818 100%)",
    accent: "#D4AF37",
    animationHint: "envelope",
  },
  {
    name: "Porte Dorée",
    category: "orientale",
    gradient: "linear-gradient(135deg, #B8860B 0%, #D4AF37 30%, #8B6914 100%)",
    accent: "#D4AF37",
    animationHint: "doors",
  },
  {
    name: "Soie Émeraude",
    category: "ruban",
    gradient: "linear-gradient(135deg, #2D5016 0%, #4A7C2E 50%, #1E3B0E 100%)",
    accent: "#6B9E3A",
    animationHint: "ribbon",
  },
  {
    name: "Ivorie Pure",
    category: "minimaliste",
    gradient: "linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 50%, #E5DFD6 100%)",
    accent: "#C5A880",
    animationHint: "envelope",
  },
];

/* -------------------------------------------------------------------------- */
/*  Section heading component                                                  */
/* -------------------------------------------------------------------------- */

function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`font-display-bold text-3xl tracking-luxury text-foreground sm:text-4xl lg:text-5xl ${className}`}
    >
      {children}
    </motion.h2>
  );
}

function SectionSubheading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={`font-body text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg ${className}`}
    >
      {children}
    </motion.p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Icon map for How It Works                                                  */
/* -------------------------------------------------------------------------- */

const ICON_MAP: Record<string, React.ReactNode> = {
  palette: <Palette className="size-6" style={{ color: GOLD }} />,
  "pen-tool": <PenTool className="size-6" style={{ color: GOLD }} />,
  send: <Send className="size-6" style={{ color: GOLD }} />,
};

/* -------------------------------------------------------------------------- */
/*  QR pattern (deterministic)                                                */
/* -------------------------------------------------------------------------- */
const QR_GRID = [1,1,0,1,1,0,1, 0,1,1,1,0,1,0, 1,0,1,0,1,1,1, 1,1,1,1,0,0,1, 0,1,0,1,1,1,0, 1,0,1,1,0,1,1, 1,1,0,0,1,0,1];

const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroPhone1: null,
  heroPhone2: null,
  updatedAt: null,
};

const DEFAULT_HERO_PHONE_MEDIA = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=760&q=82",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?auto=format&fit=crop&w=760&q=82",
] as const;

const PRESTIGE_PLACES = [
  "Terrou-Bi Dakar",
  "King Fahd Palace",
  "Radisson Blu",
  "Pullman Dakar Teranga",
  "Domaine de Nianing",
  "Salons Hoche Paris",
];

const LUXURY_TESTIMONIALS = [
  {
    couple: "Aminata & Cheikh",
    location: "Mariage aux Almadies",
    formula: "Formule Prestige — Thème Palais Royal",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=420&q=82",
    text: "Nos invités venant de Paris, New York et Dakar ont tous été émerveillés par l'ouverture des portes. La gestion des RSVP par WhatsApp nous a fait gagner des semaines d'organisation !",
  },
  {
    couple: "Sophie & Jean-Marc",
    location: "Réception à Saly",
    formula: "Formule Impériale",
    image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=420&q=82",
    text: "Un faire-part digne d'une grande maison de couture. Le Pass VIP au scan a impressionné tous nos convives dès l'entrée de la salle.",
  },
  {
    couple: "Mariama & Ibrahima",
    location: "Célébration Dakar Plateau",
    formula: "Formule Prestige — Thème Rose Bohème",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=420&q=82",
    text: "L'espace photographe intégré a permis à nos proches de télécharger les photos en haute définition dès le lendemain sans passer par un lien lourd. Service client exceptionnel sur WhatsApp.",
  },
];

const FOOTER_COLLECTIONS = [
  "Collection Palais Royal",
  "Collection Rose Bohème",
  "Collection Minimaliste Épurée",
  "Modèles Religieux & Traditionnels",
  "Galerie & Photographe",
];

const FOOTER_FEATURES = [
  "Vidéos d'ouverture 4K",
  "Gestion RSVP instantanée",
  "QR Code Pass VIP nominatif",
  "Intégration Google Agenda",
  "Accès Photographe Privé",
];

const HERO_TRUST_FEATURES = [
  { icon: Gem, label: "Direction artistique" },
  { icon: ShieldCheck, label: "Pass VIP nominatif" },
  { icon: Camera, label: "Galerie privée" },
];

function templateMediaSource(template?: Template | null) {
  return template?.openingVideoUrl ?? template?.demoVideoUrl ?? null;
}

function isVideoMedia(src?: string | null) {
  return Boolean(src && /\.(mp4|mov|webm)(\?|$)/i.test(src));
}

function HeroPhoneMedia({
  src,
  gradient,
  variant,
}: {
  src?: string | null;
  gradient?: string;
  variant: "opening" | "program";
}) {
  if (src && isVideoMedia(src)) {
    return (
      <video
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  if (src) {
    return <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />;
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
      style={{ background: gradient ?? "linear-gradient(145deg,#19110f,#5C1D24 52%,#D4AF37)" }}
    >
      <span className="font-script text-5xl text-white/75">A & B</span>
      <span className="mt-4 h-px w-16 bg-white/35" />
      <span className="mt-4 text-[10px] uppercase tracking-[0.24em] text-white/70">
        {variant === "opening" ? "Invitation privée" : "Programme royal"}
      </span>
    </div>
  );
}

function HeroPhoneMockup({
  src,
  gradient,
  className,
  label,
  variant,
}: {
  src?: string | null;
  gradient?: string;
  className?: string;
  label: string;
  variant: "opening" | "program";
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`group absolute transform-gpu transition-transform duration-700 ease-out ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative rounded-[2.35rem] border border-white/[0.12] bg-[#080807] p-2 shadow-[0_36px_100px_rgba(0,0,0,.58)]">
        <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-white/10" />
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-[#0D0B0A]">
          <HeroPhoneMedia src={src} gradient={gradient} variant={variant} />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          {variant === "opening" ? (
            <div className="absolute inset-x-0 bottom-8 flex flex-col items-center">
              <div className="grid size-16 place-items-center rounded-full border border-[#F6D778]/65 bg-[#5C1D24]/80 shadow-[0_0_32px_rgba(212,175,55,.35)] backdrop-blur">
                <span className="font-script text-2xl text-[#F8D779]">EI</span>
              </div>
              <span className="mt-3 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-[9px] uppercase tracking-[0.24em] text-white/[0.88] backdrop-blur">
                Appuyez pour ouvrir
              </span>
            </div>
          ) : (
            <div className="absolute inset-x-4 bottom-5 rounded-2xl border border-[#F6D778]/35 bg-black/35 p-3 text-white shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#F8D779]">
                <CalendarCheck className="size-3.5" />
                Programme
              </div>
              <div className="mt-3 space-y-2 text-[11px] text-white/[0.86]">
                {["Cérémonie", "Dîner", "Soirée"].map((item, index) => (
                  <div key={item} className="flex items-center justify-between">
                    <span>{item}</span>
                    <span className="font-semibold text-[#F8D779]">0{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-white/20" />
      </div>
      <div className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-black/35 blur-xl" />
      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-white/[0.52]">{label}</p>
    </motion.div>
  );
}

/* ========================================================================== */
/*  Page                                                                       */
/* ========================================================================== */

export default function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  /* Template filter state */
  const [activeFilter, setActiveFilter] = useState("all");
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>(DEFAULT_HOMEPAGE_SETTINGS);
  /* Phone mockup preview state */
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    async function loadThemes() {
      try {
        const response = await fetch("/api/themes", { cache: "no-store" });
        const json = await response.json();
        if (!json.success || !Array.isArray(json.data)) return;
        const nextTemplates: Template[] = (json.data as ThemeConfig[]).map((theme) => ({
            slug: theme.slug,
            name: theme.name,
            category: theme.category,
            gradient: theme.previewGradient,
            accent: theme.accentColor,
            animationHint: theme.animationType,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            goldColor: theme.goldColor,
            titleFont: theme.titleFont,
            openingVideoUrl: theme.openingVideoUrl,
            demoVideoUrl: theme.demoVideoUrl,
          }));
        setTemplates(nextTemplates);
        setPreviewTemplate((current) => (
          current?.slug ? nextTemplates.find((theme: Template) => theme.slug === current.slug) ?? current : current
        ));
      } catch {
        setTemplates(TEMPLATES);
      }
    }

    loadThemes();
    return subscribeThemeCatalogChanges(() => {
      void loadThemes();
    });
  }, []);

  useEffect(() => {
    async function loadHomepageSettings() {
      try {
        const response = await fetch("/api/settings", { cache: "no-store" });
        const json = await response.json();
        if (response.ok && json.success) {
          setHomepageSettings({ ...DEFAULT_HOMEPAGE_SETTINGS, ...json.data });
        }
      } catch (error) {
        console.error("Homepage settings fetch failed:", error);
      }
    }

    void loadHomepageSettings();
  }, []);

  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((tpl) => tpl.category === activeFilter);

  const featuredTemplate = templates.find((tpl) => templateMediaSource(tpl)) ?? templates[0] ?? null;
  const secondaryTemplate =
    templates.find((tpl) => tpl.slug !== featuredTemplate?.slug && templateMediaSource(tpl)) ??
    templates.find((tpl) => tpl.name !== featuredTemplate?.name) ??
    featuredTemplate;
  const heroPhone1Src = homepageSettings.heroPhone1 || templateMediaSource(featuredTemplate) || DEFAULT_HERO_PHONE_MEDIA[0];
  const heroPhone2Src = homepageSettings.heroPhone2 || templateMediaSource(secondaryTemplate) || DEFAULT_HERO_PHONE_MEDIA[1];

  /* FAQ accordion state */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToModeles = () => {
    document.getElementById("modeles")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ------------------------------------------------------------------ */}
      {/*  NAVBAR                                                             */}
      {/* ------------------------------------------------------------------ */}
      <PublicNavbar />

      {/* ------------------------------------------------------------------ */}
      {/*  HERO SECTION                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-[100svh] overflow-hidden bg-[#0D0B0A] px-5 pb-16 pt-24 text-[#FFFDF9] sm:px-8 sm:pt-28 lg:px-12"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0D0B0A_0%,#1A1210_48%,#332014_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:64px_64px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 select-none font-script text-[8rem] font-normal leading-none opacity-[0.07] sm:text-[14rem] lg:text-[20rem]"
          style={{ color: GOLD }}
          aria-hidden
        >
          Invitations
        </div>

        <motion.div
          className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] lg:gap-16"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="max-w-2xl text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center rounded-full border border-[#D4AF37]/30 bg-white/[0.08] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F3D88D] shadow-[0_14px_34px_rgba(0,0,0,.24)] backdrop-blur-md"
            >
              ✨ La Référence des Faire-Part Digitaux de Prestige
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 font-[var(--font-cormorant)] text-4xl font-semibold leading-[0.98] tracking-[0.02em] text-[#FFFDF9] drop-shadow-2xl sm:text-6xl lg:text-7xl"
            >
              Sublimez votre union avec une invitation d'exception.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-6 max-w-xl font-body text-base leading-8 text-[#FFFDF9]/[0.78] sm:text-lg lg:mx-0"
            >
              Offrez à vos convives une expérience interactive immersive digne de la haute couture.
              Musique, vidéo cinématographique, RSVP fluide et galerie privée.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
            >
              <Button
                size="lg"
                className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-8 py-6 text-sm font-semibold text-black shadow-2xl shadow-black/40 transition hover:brightness-110 sm:text-base"
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 size-4" />
                  Commander mon invitation sur WhatsApp
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="rounded-full border-white/25 bg-white/10 px-8 py-6 text-sm font-semibold text-[#FFFDF9] shadow-xl backdrop-blur-md transition hover:bg-white/[0.16] hover:text-white sm:text-base"
                onClick={scrollToModeles}
              >
                Voir une démonstration live
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.58, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 grid gap-3 text-left sm:grid-cols-3"
            >
              {HERO_TRUST_FEATURES.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                  <item.icon className="size-4 text-[#F3D88D]" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.72]">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative mx-auto h-[450px] w-full max-w-[350px] overflow-visible sm:h-[540px] sm:max-w-[500px] lg:h-[620px] lg:max-w-[560px]" style={{ perspective: "1200px" }}>
            <div className="pointer-events-none absolute inset-x-8 bottom-6 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/45 to-transparent" />
            <HeroPhoneMockup
              src={heroPhone1Src}
              gradient={featuredTemplate?.gradient}
              label="Ouverture cinématographique"
              variant="opening"
              className="left-[3%] top-8 z-20 w-[178px] -rotate-6 hover:rotate-0 sm:left-[13%] sm:w-[226px] lg:left-[12%] lg:w-[254px]"
            />
            <HeroPhoneMockup
              src={heroPhone2Src}
              gradient={secondaryTemplate?.gradient}
              label="Expérience convive"
              variant="program"
              className="right-[1%] top-24 z-10 w-[154px] rotate-[8deg] scale-95 opacity-90 hover:rotate-3 sm:right-[8%] sm:w-[208px] lg:right-[7%] lg:w-[232px]"
            />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="size-7" style={{ color: GOLD, opacity: 0.6 }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  PRESTIGE PLACES                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden border-y border-[#D4AF37]/20 bg-[#0D0B0A] py-8 text-[#FFFDF9] sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
            CHOISI POUR DES RÉCEPTIONS D'EXCEPTION DANS LES PLUS BEAUX LIEUX
          </p>
          <div className="mt-7 overflow-hidden">
            <motion.div
              className="flex min-w-max items-center gap-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
            >
              {[...PRESTIGE_PLACES, ...PRESTIGE_PLACES].map((place, index) => (
                <div
                  key={`${place}-${index}`}
                  className="flex h-20 w-48 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-white/[0.04] px-4 text-center opacity-60 shadow-[0_16px_40px_rgba(0,0,0,.18)] backdrop-blur-sm transition-opacity duration-300 hover:opacity-100 sm:w-56"
                >
                  <span className="font-[var(--font-cormorant)] text-base leading-tight tracking-[0.12em] text-[#FFFDF9]">
                    {place}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  HOW IT WORKS                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section id="comment" className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-16 flex flex-col items-center text-center sm:mb-20">
            <SectionHeading>{t.howItWorks.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.howItWorks.subheading}</SectionSubheading>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            {/* Connecting line */}
            <div
              className="pointer-events-none absolute top-16 right-[16.67%] left-[16.67%] hidden h-px md:block"
              style={{ background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }}
              aria-hidden
            />

            {t.howItWorks.steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="card-luxury flex flex-col items-center p-6 text-center sm:p-8"
              >
                <span
                  className="mb-4 font-display-bold text-5xl tracking-luxury-wide"
                  style={{ color: GOLD }}
                >
                  {step.num}
                </span>
                <div
                  className="mb-5 flex size-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${GOLD}15` }}
                >
                  {ICON_MAP[step.icon]}
                </div>
                <h3 className="font-display text-xl tracking-luxury text-foreground sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  TEMPLATE SHOWCASE WITH FILTERS + PHONE MOCKUP                      */}
      {/* ------------------------------------------------------------------ */}
      <section id="modeles" className="bg-champagne-shimmer py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
            <SectionHeading>{t.templates.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.templates.subheading}</SectionSubheading>
          </div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-wrap items-center justify-center gap-2 sm:mb-14 sm:gap-3"
          >
            {t.templates.filters.map((filter) => (
              <button
                key={filter.slug}
                type="button"
                onClick={() => setActiveFilter(filter.slug)}
                className="rounded-full px-4 py-2 text-xs font-semibold tracking-elegant uppercase transition-all duration-300 sm:text-sm"
                style={{
                  backgroundColor: activeFilter === filter.slug ? GOLD : "transparent",
                  color: activeFilter === filter.slug ? EBONY : BURGUNDY,
                  border: `1px solid ${activeFilter === filter.slug ? GOLD : `${GOLD}40`}`,
                }}
              >
                {filter.label}
              </button>
            ))}
          </motion.div>

          {/* Template grid + Phone mockup */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl, i) => (
                <motion.div
                  key={tpl.name}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="card-luxury-elevated group cursor-pointer overflow-hidden transition-transform duration-300 hover:-translate-y-1">
                    <div
                      className="relative h-40 w-full overflow-hidden sm:h-48"
                      style={{ background: tpl.gradient }}
                    >
                      {/* Inner decoration */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="h-px w-16 opacity-30" style={{ backgroundColor: tpl.accent }} />
                        <span className="mt-3 font-script text-lg opacity-40 sm:text-xl" style={{ color: IVORY }}>
                          A & B
                        </span>
                        <div className="mt-3 h-px w-16 opacity-30" style={{ backgroundColor: tpl.accent }} />
                      </div>
                      {/* Hover overlay with preview button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                        <div className="flex scale-75 items-center gap-2 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
                          <div className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                            <Play className="size-4 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardContent className="flex flex-col items-center p-4 sm:p-5">
                      <h3 className="font-display text-base tracking-luxury text-foreground sm:text-lg">
                        {tpl.name}
                      </h3>
                      <button
                        type="button"
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold tracking-elegant uppercase transition-colors duration-200"
                        style={{ color: GOLD }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(tpl);
                        }}
                      >
                        <Smartphone className="size-3.5" />
                        {t.templates.seeDemo}
                        <ChevronRight className="size-3" />
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*  PHONE MOCKUP MODAL                                             */}
        {/* -------------------------------------------------------------- */}
        <AnimatePresence>
          {previewTemplate && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setPreviewTemplate(null)}
              />
              {/* Phone frame */}
              <motion.div
                className="relative z-10"
                initial={{ scale: 0.85, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.85, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="absolute -top-12 right-0 flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:text-white"
                  aria-label="Fermer"
                >
                  <X className="size-5" />
                </button>

                {/* Device shell */}
                <div
                  className="flex w-[280px] flex-col items-center rounded-[2.5rem] border-2 p-3 sm:w-[320px]"
                  style={{ backgroundColor: EBONY, borderColor: `${GOLD}60` }}
                >
                  {/* Notch */}
                  <div className="mb-2 h-6 w-24 rounded-full" style={{ backgroundColor: `${IVORY}10` }} />
                  {/* Screen */}
                  <div
                    className="relative w-full overflow-hidden rounded-2xl"
                    style={{ background: previewTemplate.gradient, aspectRatio: "9/16" }}
                  >
                    {(previewTemplate.openingVideoUrl ?? previewTemplate.demoVideoUrl) ? (
                      <video
                        src={previewTemplate.openingVideoUrl ?? previewTemplate.demoVideoUrl ?? undefined}
                        className="absolute inset-0 size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
                        <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur">
                          <Play className="size-7 fill-current text-white" />
                        </div>
                        <p className="max-w-48 text-sm font-medium uppercase tracking-[0.18em] text-white/85">
                          Video d'ouverture bientot disponible
                        </p>
                        <p className="mt-3 text-xs leading-5 text-white/60">
                          Le theme utilise sa palette en attendant l'upload admin.
                        </p>
                      </div>
                    )}
                    <div className={`flex h-full flex-col items-center justify-center p-6 ${(previewTemplate.openingVideoUrl ?? previewTemplate.demoVideoUrl) ? "bg-black/20" : "hidden"}`}>
                      {/* Wax seal animation hint */}
                      {previewTemplate.animationHint === "wax" && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.3, type: "spring", damping: 15 }}
                          className="mb-4 flex size-16 items-center justify-center rounded-full border-2"
                          style={{ borderColor: `${IVORY}40`, backgroundColor: `${BURGUNDY}CC` }}
                        >
                          <span className="font-script text-lg" style={{ color: GOLD }}>E</span>
                        </motion.div>
                      )}
                      {/* Doors animation hint */}
                      {previewTemplate.animationHint === "doors" && (
                        <div className="relative mb-4 flex h-20 w-32 items-center justify-center">
                          <motion.div
                            initial={{ x: 0 }}
                            animate={{ x: -12 }}
                            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute left-0 top-0 h-full w-1/2 rounded-l-xl"
                            style={{ background: `${IVORY}15`, borderRight: `1px solid ${IVORY}20` }}
                          />
                          <motion.div
                            initial={{ x: 0 }}
                            animate={{ x: 12 }}
                            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute right-0 top-0 h-full w-1/2 rounded-r-xl"
                            style={{ background: `${IVORY}15`, borderLeft: `1px solid ${IVORY}20` }}
                          />
                        </div>
                      )}
                      {/* Ribbon animation hint */}
                      {previewTemplate.animationHint === "ribbon" && (
                        <motion.div
                          initial={{ scaleX: 1 }}
                          animate={{ scaleX: [1, 1.3, 0] }}
                          transition={{ delay: 0.3, duration: 1, ease: "easeInOut" }}
                          className="mb-4 h-1 w-24 origin-center"
                          style={{ backgroundColor: GOLD }}
                        />
                      )}
                      {/* Envelope default animation */}
                      {previewTemplate.animationHint === "envelope" && (
                        <motion.div
                          initial={{ y: 0, rotateX: 0 }}
                          animate={{ y: -8, rotateX: 30 }}
                          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className="mb-4 flex h-16 w-24 items-center justify-center rounded-lg"
                          style={{
                            background: `linear-gradient(180deg, ${IVORY}30, ${IVORY}10)`,
                            borderTop: `2px solid ${IVORY}40`,
                          }}
                        />
                      )}
                      <span className="font-script text-2xl opacity-60" style={{ color: IVORY }}>
                        A & B
                      </span>
                      <div className="mt-2 h-px w-12 opacity-30" style={{ backgroundColor: IVORY }} />
                      <p className="mt-3 text-center text-xs opacity-50" style={{ color: IVORY }}>
                        {previewTemplate.name}
                      </p>
                    </div>
                  </div>
                  {/* Home bar */}
                  <div className="mt-2 h-1 w-20 rounded-full" style={{ backgroundColor: `${IVORY}20` }} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  COMPARISON TABLE: Papier vs Numérique                              */}
      {/* ------------------------------------------------------------------ */}
      <section id="comparaison" className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 lg:px-12">
          <div className="mb-14 flex flex-col items-center text-center sm:mb-18">
            <SectionHeading>{t.comparison.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.comparison.subheading}</SectionSubheading>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-x-auto rounded-2xl border"
            style={{ borderColor: `${GOLD}30`, backgroundColor: `${IVORY}80` }}
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-elegant" style={{ color: BURGUNDY, borderBottom: `2px solid ${GOLD}40` }}>
                    {t.comparison.criteria}
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-elegant" style={{ color: BURGUNDY, borderBottom: `2px solid ${GOLD}40` }}>
                    {t.comparison.paper}
                  </th>
                  <th
                    className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-elegant"
                    style={{
                      color: EBONY,
                      borderBottom: `2px solid ${GOLD}`,
                      backgroundColor: `${GOLD}10`,
                    }}
                  >
                    {t.comparison.digital}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.comparison.rows.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{
                      borderBottom: `1px solid ${GOLD}15`,
                      backgroundColor: i % 2 === 1 ? `${GOLD}05` : "transparent",
                    }}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-sm text-muted-foreground">{row.paper}</td>
                    <td
                      className="px-5 py-3.5 text-center text-sm font-medium"
                      style={{ color: BURGUNDY, backgroundColor: `${GOLD}06` }}
                    >
                      {row.digital}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  QR CODE SECTION                                                    */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32" style={{ backgroundColor: BURGUNDY }}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display-bold text-3xl tracking-luxury sm:text-4xl lg:text-5xl" style={{ color: IVORY }}>
                {t.qr.heading1}
                <br />
                {t.qr.heading2}
              </h2>
              <p className="mt-5 max-w-lg font-body text-base leading-relaxed sm:text-lg" style={{ color: `${IVORY}CC` }}>
                {t.qr.desc}
              </p>

              <ul className="mt-8 flex flex-col gap-4">
                {t.qr.benefits.map((benefit, i) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0" style={{ color: GOLD }} />
                    <span className="font-body text-sm sm:text-base" style={{ color: `${IVORY}DD` }}>
                      {benefit}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Right — Decorative phone with QR */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <div
                className="card-luxury relative flex flex-col items-center overflow-hidden rounded-3xl"
                style={{ backgroundColor: `${EBONY}15`, borderColor: `${GOLD}40` }}
              >
                <div className="flex w-56 flex-col items-center rounded-2xl p-5 sm:w-64" style={{ backgroundColor: EBONY }}>
                  <div className="mb-4 h-5 w-20 rounded-full" style={{ backgroundColor: `${IVORY}15` }} />
                  <div className="flex w-full flex-col items-center rounded-xl p-4" style={{ backgroundColor: IVORY }}>
                    <QrCode className="mb-2 size-5" style={{ color: BURGUNDY }} />
                    <span className="font-display text-xs tracking-luxury" style={{ color: BURGUNDY }}>
                      Scannez-moi
                    </span>
                    <div className="mt-3 grid grid-cols-7 gap-px">
                      {QR_GRID.map((v, idx) => (
                        <div
                          key={idx}
                          className="size-3 rounded-[1px] sm:size-[14px]"
                          style={{ backgroundColor: v ? EBONY : "transparent" }}
                        />
                      ))}
                    </div>
                    <span className="mt-3 font-body text-[10px]" style={{ color: `${EBONY}80` }}>
                      ID: ELEG-2026-0847
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  PRICING SECTION (currency-aware)                                    */}
      {/* ------------------------------------------------------------------ */}
      <section id="tarifs" className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-16 flex flex-col items-center text-center sm:mb-20">
            <SectionHeading>{t.pricing.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.pricing.subheading}</SectionSubheading>
          </div>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3 md:gap-5 lg:gap-8">
            {t.pricing.tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Card
                  className={
                    tier.recommended
                      ? "card-luxury-elevated border-gold-glow relative"
                      : "card-luxury-elevated relative"
                  }
                  style={
                    tier.recommended
                      ? { borderColor: GOLD, boxShadow: `0 0 30px ${GOLD}25` }
                      : undefined
                  }
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge
                        className="rounded-full px-4 py-1 text-xs font-semibold tracking-elegant uppercase"
                        style={{ backgroundColor: GOLD, color: EBONY, borderColor: GOLD }}
                      >
                        {t.pricing.popular}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="flex flex-col items-center p-6 pt-8 sm:p-8 sm:pt-10">
                    <h3 className="font-display-bold text-2xl tracking-luxury text-foreground sm:text-3xl">
                      {tier.name}
                    </h3>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span
                        className="font-display-bold text-3xl tracking-luxury-wide sm:text-4xl"
                        style={{ color: GOLD }}
                      >
                        {formatPrice(tier.priceFcfa)}
                      </span>
                    </div>

                    <div className="border-double-luxury my-6 w-full" />

                    <ul className="flex w-full flex-col gap-3">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className="mt-0.5 size-4 shrink-0"
                            style={{ color: tier.recommended ? GOLD : BURGUNDY }}
                          />
                          <span className="font-body text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        tier.recommended
                          ? "btn-luxury mt-8 inline-flex h-11 w-full items-center justify-center rounded-full px-6 text-sm font-semibold tracking-elegant uppercase sm:h-12"
                          : "mt-8 inline-flex h-11 w-full items-center justify-center rounded-full border px-6 text-sm font-semibold tracking-elegant uppercase transition-colors duration-200 hover:bg-foreground/5 sm:h-12"
                      }
                      style={
                        tier.recommended
                          ? { backgroundColor: GOLD, color: EBONY, border: "none" }
                          : { borderColor: `${GOLD}60`, color: BURGUNDY }
                      }
                    >
                      {t.pricing.order}
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  TESTIMONIALS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="temoignages" className="relative overflow-hidden bg-[#0D0B0A] py-20 text-[#FFFDF9] sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,rgba(212,175,55,.35)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-14 flex flex-col items-center text-center sm:mb-18">
            <Badge className="mb-4 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#F3D88D]">
              PAROLES DE MARIÉS
            </Badge>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-[var(--font-cormorant)] text-4xl font-semibold leading-tight tracking-[0.02em] text-[#FFFDF9] sm:text-5xl lg:text-6xl"
            >
              L'émotion partagée par nos couples d'exception
            </motion.h2>
            <p className="mt-5 max-w-2xl font-body text-base leading-8 text-white/[0.62] sm:text-lg">
              Des expériences conçues pour rester dans les mémoires, avant même l'arrivée des invités.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {LUXURY_TESTIMONIALS.map((item, i) => (
              <motion.div
                key={item.couple}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-[#161210]/60 p-5 shadow-xl shadow-black/25 backdrop-blur-md sm:p-6">
                  <div className="relative mb-5 h-40 overflow-hidden rounded-t-[3rem] rounded-b-2xl border border-[#D4AF37]/20">
                    <img src={item.image} alt={`Portrait de ${item.couple}`} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161210]/70 via-transparent to-transparent" />
                  </div>
                  <Quote className="mb-4 size-8 text-[#D4AF37]/45" />
                  <p className="flex-1 font-body text-sm leading-7 text-white/[0.76] sm:text-base">
                    {item.text}
                  </p>
                  <div className="mt-5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-4" style={{ color: GOLD, fill: GOLD }} />
                    ))}
                  </div>
                  <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />
                  <div>
                    <p className="font-[var(--font-cormorant)] text-xl font-semibold tracking-[0.04em] text-[#FFFDF9]">
                      {item.couple}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/[0.52]">{item.location}</p>
                    <p className="mt-2 text-xs font-semibold text-[#D4AF37]">{item.formula}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ SECTION                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 lg:px-12">
          <div className="mb-14 flex flex-col items-center text-center sm:mb-18">
            <SectionHeading>{t.faq.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.faq.subheading}</SectionSubheading>
          </div>

          <div className="flex flex-col gap-3">
            {t.faq.items.map((item, i) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div
                  className="card-luxury overflow-hidden rounded-xl transition-shadow duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2"
                  >
                    <span className="pr-4 font-display text-sm sm:text-base tracking-luxury text-foreground">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="size-4" style={{ color: GOLD }} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-0">
                          <div className="h-px mb-4" style={{ backgroundColor: `${GOLD}20` }} />
                          <p className="font-body text-sm leading-relaxed text-muted-foreground">
                            {item.a}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FINAL CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-[#130F0D] py-20 text-[#FFFDF9] sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(212,175,55,.12),transparent_38%,rgba(92,29,36,.28))]" />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-[var(--font-cormorant)] text-4xl font-semibold leading-tight tracking-[0.02em] sm:text-5xl lg:text-6xl"
          >
            Prêts à créer une invitation inoubliable ?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-2xl font-body text-base leading-8 text-white/[0.72] sm:text-lg"
          >
            Échangez directement avec notre direction artistique sur WhatsApp pour concevoir votre univers sur-mesure.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8"
          >
            <Button
              size="lg"
              className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-10 py-6 text-sm font-semibold uppercase tracking-[0.14em] text-black shadow-2xl shadow-black/35 transition hover:brightness-110 sm:text-base"
              asChild
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 size-4" />
                Démarrer mon projet sur WhatsApp
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FOOTER                                                            */}
      {/* ------------------------------------------------------------------ */}
      <footer className="mt-auto border-t border-[#D4AF37]/20 bg-[#0D0B0A] text-[#FFFDF9]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.15fr] lg:px-12">
          <div>
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="font-[var(--font-cormorant)] text-2xl font-light uppercase tracking-[0.3em] text-[#FFFDF9]">
                ÉLÉGANCE
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#D4AF37]">
                INVITATIONS
              </span>
            </Link>
            <p className="mt-5 max-w-sm font-body text-sm leading-7 text-white/[0.62]">
              Créateur d'invitations de mariage numériques sur-mesure pour réceptions d'exception au Sénégal et à l'international.
            </p>
            <Badge className="mt-5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#F3D88D]">
              Service Concierge disponible 7j/7
            </Badge>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Les Collections</h3>
            <ul className="mt-5 space-y-3">
              {FOOTER_COLLECTIONS.map((item) => (
                <li key={item}>
                  <button type="button" onClick={scrollToModeles} className="text-left text-sm text-white/[0.62] transition hover:text-white">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Fonctionnalités Clés</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/[0.62]">
              {FOOTER_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">Conciergerie & Contact Direct</h3>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#20bd5a]"
            >
              <MessageCircle className="mr-2 size-4" />
              +221 77 361 59 44
            </a>
            <a href="mailto:contact@elegance-invitations.com" className="mt-5 block text-sm text-white/70 transition hover:text-white">
              contact@elegance-invitations.com
            </a>
            <p className="mt-3 text-sm leading-7 text-white/[0.52]">
              Dakar, Sénégal — Accompagnement diaspora monde entier
            </p>
          </div>
        </div>

        <div className="border-t border-[#D4AF37]/[0.14]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-white/48 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <p>© 2026 Élégance Invitations. Tous droits réservés. L'art de célébrer.</p>
            <nav className="flex flex-wrap gap-4">
              <a href="#confidentialite" className="transition hover:text-white">Confidentialité</a>
              <a href="#conditions" className="transition hover:text-white">Conditions Générales</a>
              <Link href="/admin" className="transition hover:text-white">Espace Admin</Link>
            </nav>
          </div>
        </div>

      </footer>
    </div>
  );
}
