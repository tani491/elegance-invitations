"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Palette, PenTool, Send, ChevronDown, CheckCircle2, QrCode,
  Star, Quote, ChevronRight, X, Smartphone, Play,
} from "lucide-react";
import PublicNavbar from "@/components/public/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { subscribeThemeCatalogChanges } from "@/lib/theme-sync";
import { ELEGANCE_ORDER_WHATSAPP_URL } from "@/lib/whatsapp";
import type { ThemeConfig } from "@/types/database.types";

/* -------------------------------------------------------------------------- */
/*  Color constants                                                           */
/* -------------------------------------------------------------------------- */

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#E8D48B";
const BURGUNDY = "#5C1D24";
const EBONY = "#1A1818";
const IVORY = "#FAF7F2";

const WHATSAPP_URL = ELEGANCE_ORDER_WHATSAPP_URL;

/* -------------------------------------------------------------------------- */
/*  Sparkle data (deterministic — no Math.random)                              */
/* -------------------------------------------------------------------------- */

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

const SPARKLES: Sparkle[] = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: ((i * 37 + 13) % 97) / 97 * 100,
  y: ((i * 53 + 7) % 89) / 89 * 100,
  size: (i % 5) * 0.8 + 2.5,
  duration: (i % 4) * 0.8 + 3.5,
  delay: (i % 6) * 0.7 + 0.5,
}));

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

  const filteredTemplates =
    activeFilter === "all"
      ? templates
      : templates.filter((tpl) => tpl.category === activeFilter);

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
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 pt-16"
      >
        {/* Background sparkles */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {SPARKLES.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                background: GOLD,
              }}
              animate={{
                opacity: [0, 0.7, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Watermark script text */}
        <div
          className="pointer-events-none absolute select-none font-script text-[12rem] font-normal leading-none opacity-[0.04] sm:text-[18rem] lg:text-[24rem]"
          style={{ color: GOLD }}
          aria-hidden
        >
          Élégance
        </div>

        {/* Main hero content */}
        <motion.div
          className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-display-bold text-4xl leading-tight tracking-luxury text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {t.hero.title1}
            <br />
            <span className="text-gold-gradient">{t.hero.titleHighlight}</span>
          </motion.h1>

          {/* Ornamental divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="divider-ornament my-6 sm:my-8"
          />

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="font-body max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
          >
            {t.hero.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5"
          >
            <Button
              size="lg"
              className="btn-luxury rounded-full px-8 py-6 text-sm font-semibold tracking-elegant uppercase sm:px-10 sm:text-base"
              style={{ backgroundColor: GOLD, color: EBONY, border: "none" }}
              asChild
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                {t.hero.cta1}
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-sm font-semibold tracking-elegant uppercase sm:px-10 sm:text-base"
              style={{ borderColor: GOLD, color: BURGUNDY }}
              onClick={scrollToModeles}
            >
              {t.hero.cta2}
            </Button>
          </motion.div>
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
      <section id="temoignages" className="bg-champagne-shimmer py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-14 flex flex-col items-center text-center sm:mb-18">
            <SectionHeading>{t.testimonials.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.testimonials.subheading}</SectionSubheading>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {t.testimonials.items.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="card-luxury-elevated flex h-full flex-col p-6 sm:p-8">
                  {/* Quote icon */}
                  <Quote className="mb-4 size-8" style={{ color: `${GOLD}40` }} />
                  <p className="flex-1 font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.text}
                  </p>
                  {/* Stars */}
                  <div className="mt-5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="size-4" style={{ color: GOLD, fill: GOLD }} />
                    ))}
                  </div>
                  <div className="border-double-luxury my-4 w-full" />
                  <div>
                    <p className="font-display-bold text-base tracking-luxury text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.location}</p>
                    <p className="mt-1 text-xs font-medium" style={{ color: GOLD }}>{item.role}</p>
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
      <section className="relative overflow-hidden py-20 sm:py-28" style={{ backgroundColor: BURGUNDY }}>
        {/* Decorative sparkles */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                width: 3 + i,
                height: 3 + i,
                background: GOLD,
              }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.5, 1, 0.5] }}
              transition={{
                duration: 3 + i * 0.5,
                delay: i * 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-5 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display-bold text-3xl tracking-luxury sm:text-4xl lg:text-5xl"
            style={{ color: IVORY }}
          >
            {t.hero.cta1}
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="my-6 flex w-32 items-center gap-2"
          >
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${GOLD})` }} />
            <span className="font-script text-lg" style={{ color: GOLD }}>&</span>
            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-body text-base text-[#FAF7F2BB] sm:text-lg"
          >
            {t.hero.subtitle}
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
              className="btn-luxury rounded-full px-10 py-6 text-sm font-semibold tracking-elegant uppercase sm:text-base"
              style={{ backgroundColor: GOLD, color: EBONY, border: "none" }}
              asChild
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                {t.hero.cta1}
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FOOTER                                                            */}
      {/* ------------------------------------------------------------------ */}
      <footer className="mt-auto" style={{ backgroundColor: EBONY, color: IVORY }}>
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <div className="flex flex-col items-center gap-8 text-center">
            <Link href="/" className="group">
              <span
                className="font-script text-3xl transition-opacity duration-300 group-hover:opacity-80 sm:text-4xl"
                style={{ color: GOLD }}
              >
                Élégance
              </span>
            </Link>

            <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
              {[t.footer.terms, t.footer.privacy, t.footer.contact].map((label) => (
                <span
                  key={label}
                  className="font-body text-sm cursor-pointer transition-colors duration-200 hover:opacity-70"
                  style={{ color: `${IVORY}99` }}
                >
                  {label}
                </span>
              ))}
            </nav>

            <p className="font-body text-xs" style={{ color: `${IVORY}55` }}>
              {t.footer.copyright}
            </p>
          </div>
        </div>

      </footer>
    </div>
  );
}
