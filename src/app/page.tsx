"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ChevronDown, CheckCircle2, QrCode,
  Star, Quote, ChevronRight, X, Smartphone, Play, MessageCircle,
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

const GOLD = "#C5A059";
const EBONY = "#0D0B0A";
const SILK = "#FAF7F2";
const IVORY = "#D8D2C7";
const GOLD_GRADIENT = "linear-gradient(135deg, #D4AF37 0%, #E6CA65 48%, #AA7C11 100%)";
const DEEP_SURFACE = "bg-white/[0.03] border border-[#C5A059]/20 backdrop-blur-md";
const PRIMARY_CTA_CLASS =
  "h-12 rounded-full bg-gradient-to-r from-[#C5A059] to-[#9E7D3B] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0D0B0A] shadow-[0_4px_20px_rgba(197,160,89,0.25)] transition-all hover:brightness-110 active:scale-95 sm:px-8 sm:text-sm";
const SECONDARY_CTA_CLASS =
  "h-12 rounded-full border border-[#C5A059]/40 bg-transparent px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-[#FAF7F2] shadow-none transition-all hover:bg-white/5 hover:text-[#FAF7F2] active:scale-95 sm:px-8 sm:text-sm";

const WHATSAPP_URL = ELEGANCE_ORDER_WHATSAPP_URL;

/* -------------------------------------------------------------------------- */
/*  Template data with categories                                              */
/* -------------------------------------------------------------------------- */

interface Template {
  slug?: string;
  name: string;
  category: string;
  style?: string | null;
  tags?: string[] | string | null;
  gradient: string;
  accent: string;
  animationHint: string;
  primaryColor?: string;
  secondaryColor?: string;
  goldColor?: string;
  titleFont?: string;
  openingVideoUrl?: string | null;
  demoVideoUrl?: string | null;
  isActive?: boolean;
  isVisible?: boolean;
  isPublished?: boolean;
}

type TemplateFilter = {
  label: string;
  slug: string;
};

type LandingTestimonial = {
  id?: string;
  coupleNames: string;
  location: string;
  review: string;
  rating: number;
  formula: string | null;
  photoUrl: string | null;
};

const TEMPLATES: Template[] = [
  {
    name: "Enveloppe de Cire",
    category: "cire",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #1A1712 52%, #C5A059 100%)",
    accent: "#C5A059",
    animationHint: "wax",
  },
  {
    name: "Velours Royal",
    category: "cire",
    gradient: "linear-gradient(135deg, #0F0E0C 0%, #211D16 56%, #D4AF37 100%)",
    accent: "#C5A059",
    animationHint: "envelope",
  },
  {
    name: "Rideau de Théâtre",
    category: "ruban",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #181512 46%, #AA7C11 100%)",
    accent: "#C5A059",
    animationHint: "ribbon",
  },
  {
    name: "Médina Orientale",
    category: "orientale",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #242017 50%, #E6CA65 100%)",
    accent: "#C5A059",
    animationHint: "doors",
  },
  {
    name: "Roseraie Bohème",
    category: "boheme",
    gradient: "linear-gradient(135deg, #0F0E0C 0%, #1C1913 54%, #D8D2C7 100%)",
    accent: "#C5A059",
    animationHint: "envelope",
  },
  {
    name: "Classique Intemporel",
    category: "minimaliste",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #181614 52%, #0D0B0A 100%)",
    accent: "#C5A059",
    animationHint: "envelope",
  },
  {
    name: "Porte Dorée",
    category: "orientale",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #D4AF37 42%, #AA7C11 100%)",
    accent: "#C5A059",
    animationHint: "doors",
  },
  {
    name: "Soie Émeraude",
    category: "ruban",
    gradient: "linear-gradient(135deg, #0D0B0A 0%, #171512 48%, #C5A059 100%)",
    accent: "#C5A059",
    animationHint: "ribbon",
  },
  {
    name: "Ivorie Pure",
    category: "minimaliste",
    gradient: "linear-gradient(135deg, #D8D2C7 0%, #FAF7F2 48%, #C5A059 100%)",
    accent: "#C5A059",
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
      className={`font-display-bold text-3xl tracking-luxury text-[#FAF7F2] sm:text-4xl lg:text-5xl ${className}`}
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
      className={`font-body text-base text-[#D8D2C7] max-w-2xl mx-auto sm:text-lg ${className}`}
    >
      {children}
    </motion.p>
  );
}

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
  "Salle de réception",
  "Salle de mariage",
  "King Fahd Palace",
  "Terrou-Bi Dakar",
  "Radisson Blu",
  "Salons Hoche Paris",
  "Pullman Dakar Teranga",
  "Domaine de Nianing",
];

const FOOTER_COLLECTIONS = [
  "Collection Palais Royal",
  "Collection Rose Bohème",
  "Collection Minimaliste Épurée",
  "Modèles Religieux & Traditionnels",
  "Accompagnement Signature",
];

const FOOTER_FEATURES = [
  "Vidéos d'ouverture 4K",
  "Gestion RSVP instantanée",
  "QR Code Pass VIP nominatif",
  "Intégration Google Agenda",
  "Conciergerie privée",
];

function clampTestimonialRating(rating: number) {
  if (!Number.isFinite(rating)) return 5;
  return Math.min(5, Math.max(1, Math.round(rating)));
}

function testimonialInitials(coupleNames: string) {
  const initials = coupleNames
    .split(/\s*(?:&|et)\s*/i)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("");

  return (initials || "EI").toUpperCase();
}

function templateMediaSource(template?: Template | null) {
  return template?.openingVideoUrl ?? template?.demoVideoUrl ?? null;
}

const normalize = (str: string) =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const FILTER_STOP_WORDS = new Set(["and", "avec", "des", "de", "du", "et", "la", "le", "les", "the"]);

const ALL_FILTER_VALUES = new Set(["all", "tous", "tout", "todos", "الكل"]);

const STYLE_FILTER_ALIASES: Record<string, string[]> = {
  orientale: [
    "porte orientale",
    "orientale",
    "oriental",
    "medina",
    "porte doree",
    "portes royales dorees",
    "portes",
    "doors",
    "golden palace doors",
    "palais",
    "palace",
    "imperial",
  ],
  cire: [
    "cachet de cire",
    "cire",
    "enveloppe de cire",
    "sceau",
    "wax",
    "wax seal",
    "seal",
    "wax seal burst",
  ],
  ruban: [
    "ruban de soie",
    "ruban",
    "soie",
    "silk",
    "ribbon",
    "silk ribbon untie",
    "rideau",
    "rideaux",
    "curtain",
    "curtains",
    "velvet curtains",
    "theatre",
  ],
  boheme: [
    "boheme",
    "bohemian",
    "roseraie",
    "rose",
    "botanical",
    "botanique",
    "fleur",
    "ficelle",
    "floral",
  ],
  minimaliste: [
    "minimaliste",
    "minimalist",
    "minimal",
    "epure",
    "pure",
    "ivoire",
    "classique",
    "intemporel",
  ],
};

function toSearchableValue(value?: string | null) {
  return normalize(value ?? "").replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function compactSearchValue(value: string) {
  return toSearchableValue(value).replace(/[^a-z0-9]+/g, "");
}

function uniqueSearchTerms(values: Array<string | string[] | null | undefined>) {
  const terms = values.flatMap((value) => {
    const rawValues = Array.isArray(value) ? value : [value];
    return rawValues.flatMap((rawValue) => {
      const searchable = toSearchableValue(rawValue);
      const words = searchable
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length > 2 && !FILTER_STOP_WORDS.has(word));

      return [searchable, ...words];
    });
  });

  return Array.from(new Set(terms.filter(Boolean)));
}

function isAllFilter(filter: TemplateFilter) {
  const slug = normalize(filter.slug);
  const label = normalize(filter.label);

  return ALL_FILTER_VALUES.has(slug) || ALL_FILTER_VALUES.has(label);
}

function filterKeywords(filter: TemplateFilter) {
  const slug = normalize(filter.slug);
  const label = normalize(filter.label);
  const aliases = STYLE_FILTER_ALIASES[slug] ?? STYLE_FILTER_ALIASES[label] ?? [];

  return uniqueSearchTerms([filter.slug, filter.label, aliases]);
}

function templateSearchValues(template: Template) {
  return uniqueSearchTerms([
    template.category,
    template.name,
    template.slug,
    template.style,
    template.tags,
    template.animationHint,
    template.titleFont,
  ]);
}

function matchesKeyword(value: string, keyword: string) {
  const compactValue = compactSearchValue(value);
  const compactKeyword = compactSearchValue(keyword);

  return (
    value === keyword ||
    value.includes(keyword) ||
    keyword.includes(value) ||
    compactValue.includes(compactKeyword) ||
    compactKeyword.includes(compactValue)
  );
}

function templateMatchesFilter(template: Template, filter: TemplateFilter) {
  if (isAllFilter(filter)) return true;

  const keywords = filterKeywords(filter);
  const values = templateSearchValues(template);

  return keywords.some((keyword) => values.some((value) => matchesKeyword(value, keyword)));
}

function isTemplateVisible(template: Template) {
  return template.isPublished !== false && template.isVisible !== false && template.isActive !== false;
}

function isVideoMedia(src?: string | null) {
  return Boolean(src && /\.(mp4|mov|webm)(\?|$)/i.test(src));
}

function HeroPhoneMedia({
  src,
  gradient,
}: {
  src?: string | null;
  gradient?: string;
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
      className="absolute inset-0 overflow-hidden"
      style={{ background: gradient ?? "linear-gradient(145deg,#0D0B0A,#17130E 52%,#C5A059)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_28%,rgba(230,202,101,.22),transparent_32%),linear-gradient(180deg,transparent,rgba(0,0,0,.34))]" />
      <div className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#C5A059]/35 bg-white/[0.04] shadow-[0_0_40px_rgba(197,160,89,.18)]" />
    </div>
  );
}

function HeroPhoneMockup({
  src,
  gradient,
  className,
}: {
  src?: string | null;
  gradient?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`group absolute transform-gpu transition-transform duration-700 ease-out ${className ?? ""}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative rounded-[2.35rem] border border-[#C5A059]/20 bg-[#070604] p-2 shadow-[0_38px_110px_rgba(0,0,0,.64)]">
        <div className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#E6CA65]/55 to-transparent" />
        <div className="mx-auto mb-2 h-5 w-24 rounded-full bg-white/10" />
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.8rem] bg-[#0D0B0A]">
          <HeroPhoneMedia src={src} gradient={gradient} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/18 via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-0 bg-black/[0.08]" />
        </div>
        <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-white/20" />
      </div>
      <div className="pointer-events-none absolute -bottom-4 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-full bg-black/35 blur-xl" />
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
  const [landingTestimonials, setLandingTestimonials] = useState<LandingTestimonial[]>([]);
  /* Phone mockup preview state */
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    async function loadThemes() {
      try {
        const response = await fetch("/api/themes", { cache: "no-store" });
        const json = await response.json();
        if (!json.success || !Array.isArray(json.data)) return;
        const nextTemplates: Template[] = (json.data as ThemeConfig[]).map((theme) => {
          const themeRecord = theme as ThemeConfig & {
            isPublished?: boolean;
            style?: string | null;
            tags?: string[] | string | null;
          };

          return ({
            slug: theme.slug,
            name: theme.name,
            category: theme.category,
            style: themeRecord.style ?? null,
            tags: themeRecord.tags ?? null,
            gradient: theme.previewGradient,
            accent: theme.accentColor,
            animationHint: theme.animationType,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.secondaryColor,
            goldColor: theme.goldColor,
            titleFont: theme.titleFont,
            openingVideoUrl: theme.openingVideoUrl,
            demoVideoUrl: theme.demoVideoUrl,
            isActive: theme.isActive,
            isVisible: theme.isVisible,
            isPublished: themeRecord.isPublished,
          });
        });
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

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const response = await fetch("/api/testimonials", { cache: "no-store" });
        const json = await response.json();
        const testimonials = Array.isArray(json.data) ? (json.data as LandingTestimonial[]) : [];

        setLandingTestimonials(response.ok && json.success ? testimonials : []);
      } catch (error) {
        console.error("Testimonials fetch failed:", error);
        setLandingTestimonials([]);
      }
    }

    void loadTestimonials();
  }, []);

  const visibleTemplates = templates.filter(isTemplateVisible);
  const filterOptions = t.templates.filters.filter((filter) =>
    isAllFilter(filter) || visibleTemplates.some((template) => templateMatchesFilter(template, filter)),
  );
  const safeFilterOptions =
    filterOptions.length > 0 ? filterOptions : [{ label: t.templates.filters[0]?.label ?? "Tous", slug: "all" }];
  const selectedFilter =
    safeFilterOptions.find((filter) => filter.slug === activeFilter) ??
    safeFilterOptions.find(isAllFilter) ??
    safeFilterOptions[0];
  const filteredTemplates = selectedFilter && !isAllFilter(selectedFilter)
    ? visibleTemplates.filter((template) => templateMatchesFilter(template, selectedFilter))
    : visibleTemplates;

  const featuredTemplate = visibleTemplates.find((tpl) => templateMediaSource(tpl)) ?? visibleTemplates[0] ?? null;
  const secondaryTemplate =
    visibleTemplates.find((tpl) => tpl.slug !== featuredTemplate?.slug && templateMediaSource(tpl)) ??
    visibleTemplates.find((tpl) => tpl.name !== featuredTemplate?.name) ??
    featuredTemplate;
  const heroPhone1Src = homepageSettings.heroPhone1 || templateMediaSource(featuredTemplate) || DEFAULT_HERO_PHONE_MEDIA[0];
  const heroPhone2Src = homepageSettings.heroPhone2 || templateMediaSource(secondaryTemplate) || DEFAULT_HERO_PHONE_MEDIA[1];

  /* FAQ accordion state */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToModeles = () => {
    document.getElementById("modeles")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0D0B0A] text-[#FAF7F2]">
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
        className="relative min-h-[100svh] overflow-hidden bg-[#0D0B0A] px-5 pb-14 pt-24 text-[#FAF7F2] sm:px-8 sm:pt-28 lg:px-12"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#0D0B0A_0%,#100E0C_50%,#0D0B0A_100%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,rgba(197,160,89,.18)_1px,transparent_1px),linear-gradient(0deg,rgba(250,247,242,.08)_1px,transparent_1px)] [background-size:72px_72px]"
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
          className="relative z-10 mx-auto grid max-w-7xl items-start gap-8 pt-2 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] lg:gap-14 lg:pt-8"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <div className="max-w-2xl text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="font-[var(--font-cormorant)] text-4xl font-semibold leading-[0.98] tracking-[0.02em] text-[#FAF7F2] drop-shadow-2xl sm:text-6xl lg:text-7xl"
            >
              Sublimez votre union avec une invitation d'exception.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mt-6 max-w-xl font-body text-base leading-8 text-[#D8D2C7] sm:text-lg lg:mx-0"
            >
              Offrez à vos convives une expérience interactive immersive digne de la haute couture.
              Musique, vidéo cinématographique, RSVP fluide et Pass VIP nominatif.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.44, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
            >
              <Button
                size="lg"
                className={`${PRIMARY_CTA_CLASS} w-full max-w-[18rem] sm:w-auto sm:max-w-none`}
                asChild
              >
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 size-4" />
                  Commander sur WhatsApp
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className={`${SECONDARY_CTA_CLASS} w-full max-w-[18rem] sm:w-auto sm:max-w-none`}
                onClick={scrollToModeles}
              >
                Voir la démo
              </Button>
            </motion.div>
          </div>

          <div className="relative mx-auto -mt-2 h-[390px] w-full max-w-[350px] overflow-visible sm:-mt-8 sm:h-[500px] sm:max-w-[500px] lg:-mt-10 lg:h-[580px] lg:max-w-[560px]" style={{ perspective: "1200px" }}>
            <div className="pointer-events-none absolute inset-x-10 bottom-10 h-px bg-gradient-to-r from-transparent via-[#C5A059]/35 to-transparent" />
            <HeroPhoneMockup
              src={heroPhone1Src}
              gradient={featuredTemplate?.gradient}
              className="left-[4%] top-0 z-20 w-[174px] -rotate-6 hover:rotate-0 sm:left-[13%] sm:w-[226px] lg:left-[12%] lg:w-[254px]"
            />
            <HeroPhoneMockup
              src={heroPhone2Src}
              gradient={secondaryTemplate?.gradient}
              className="right-[2%] top-14 z-10 w-[152px] rotate-[8deg] scale-95 opacity-95 hover:rotate-3 sm:right-[8%] sm:top-16 sm:w-[208px] lg:right-[7%] lg:top-20 lg:w-[232px]"
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
      <section className="relative overflow-hidden border-y border-[#C5A059]/15 bg-[#0D0B0A] py-8 text-[#FAF7F2] sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C5A059]">
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
                  className={`${DEEP_SURFACE} flex h-20 w-48 shrink-0 items-center justify-center rounded-lg px-4 text-center opacity-70 shadow-[0_16px_40px_rgba(0,0,0,.18)] transition-opacity duration-300 hover:opacity-100 sm:w-56`}
                >
                  <span className="font-[var(--font-cormorant)] text-base leading-tight tracking-[0.12em] text-[#FAF7F2]">
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
      <section id="comment" className="bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-16 flex flex-col items-center text-center sm:mb-20">
            <SectionHeading>{t.howItWorks.heading}</SectionHeading>
            <SectionSubheading className="mt-4">{t.howItWorks.subheading}</SectionSubheading>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            {t.howItWorks.steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                className={`${DEEP_SURFACE} flex flex-col items-center rounded-lg p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,.22)] sm:p-8`}
              >
                <span
                  className="mb-4 font-display-bold text-5xl tracking-luxury-wide"
                  style={{ color: GOLD }}
                >
                  {step.num}
                </span>
                <h3 className="font-[var(--font-cormorant)] text-xl font-semibold uppercase tracking-[0.18em] text-[#FAF7F2] sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-[#D8D2C7] sm:text-base">
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
      <section id="modeles" className="bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
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
            {safeFilterOptions.map((filter) => {
              const isActive = selectedFilter?.slug === filter.slug;

              return (
                <button
                  key={filter.slug}
                  type="button"
                  onClick={() => setActiveFilter(filter.slug)}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-elegant transition-all duration-300 sm:text-sm ${
                    isActive
                      ? "border border-transparent bg-[#C5A059] text-black font-semibold shadow-md"
                      : "border border-white/10 bg-white/5 text-white/80 hover:border-[#C5A059]/40"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </motion.div>

          {/* Template grid + Phone mockup */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl, i) => (
                  <motion.div
                    key={tpl.slug ?? tpl.name}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Card className={`${DEEP_SURFACE} group cursor-pointer gap-0 overflow-hidden rounded-lg py-0 shadow-[0_22px_70px_rgba(0,0,0,.28)] transition-transform duration-300 hover:-translate-y-1`}>
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
                        <h3 className="font-display text-base tracking-luxury text-[#FAF7F2] sm:text-lg">
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
                ))
              ) : (
                <motion.div
                  key="empty-template-collection"
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`${DEEP_SURFACE} col-span-full rounded-lg px-6 py-10 text-center text-sm leading-relaxed text-[#D8D2C7] sm:text-base`}
                >
                  Nouvelle création en cours dans cette collection...
                </motion.div>
              )}
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
                          style={{ borderColor: `${IVORY}40`, backgroundColor: `${EBONY}CC` }}
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
      <section id="comparaison" className="bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
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
            className={`${DEEP_SURFACE} overflow-x-auto rounded-lg shadow-[0_24px_80px_rgba(0,0,0,.28)]`}
          >
            <table className="w-full min-w-[600px] border-collapse">
              <thead>
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-elegant" style={{ color: SILK, borderBottom: `1px solid ${GOLD}40` }}>
                    {t.comparison.criteria}
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-elegant" style={{ color: SILK, borderBottom: `1px solid ${GOLD}40` }}>
                    {t.comparison.paper}
                  </th>
                  <th
                    className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-elegant"
                    style={{
                      color: EBONY,
                      borderBottom: `1px solid ${GOLD}`,
                      background: GOLD_GRADIENT,
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
                      backgroundColor: i % 2 === 1 ? `${GOLD}08` : "transparent",
                    }}
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-[#FAF7F2]">{row.label}</td>
                    <td className="px-5 py-3.5 text-center text-sm text-[#D8D2C7]">{row.paper}</td>
                    <td
                      className="px-5 py-3.5 text-center text-sm font-medium"
                      style={{ color: SILK, backgroundColor: `${GOLD}08` }}
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
      <section className="relative overflow-hidden bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(197,160,89,.12),transparent_30%)]" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Text */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display-bold text-3xl tracking-luxury sm:text-4xl lg:text-5xl" style={{ color: SILK }}>
                {t.qr.heading1}
                <br />
                {t.qr.heading2}
              </h2>
              <p className="mt-5 max-w-lg font-body text-base leading-relaxed sm:text-lg" style={{ color: IVORY }}>
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
                    <span className="font-body text-sm sm:text-base" style={{ color: IVORY }}>
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
                className={`${DEEP_SURFACE} relative flex flex-col items-center overflow-hidden rounded-lg p-4 shadow-[0_26px_90px_rgba(0,0,0,.3)]`}
              >
                <div className="flex w-56 flex-col items-center rounded-[1.75rem] border border-[#C5A059]/20 p-5 sm:w-64" style={{ backgroundColor: EBONY }}>
                  <div className="mb-4 h-5 w-20 rounded-full" style={{ backgroundColor: `${IVORY}15` }} />
                  <div className="flex w-full flex-col items-center rounded-lg p-4" style={{ backgroundColor: SILK }}>
                    <QrCode className="mb-2 size-5" style={{ color: EBONY }} />
                    <span className="font-display text-xs tracking-luxury" style={{ color: EBONY }}>
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
      <section id="tarifs" className="bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
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
                      ? `${DEEP_SURFACE} relative gap-0 rounded-lg py-0 shadow-[0_28px_90px_rgba(0,0,0,.34)]`
                      : `${DEEP_SURFACE} relative gap-0 rounded-lg py-0 shadow-[0_22px_70px_rgba(0,0,0,.25)]`
                  }
                  style={
                    tier.recommended
                      ? { borderColor: `${GOLD}66`, boxShadow: `0 0 30px ${GOLD}18, 0 28px 90px rgba(0,0,0,.34)` }
                      : undefined
                  }
                >
                  {tier.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge
                        className="rounded-full px-4 py-1 text-xs font-semibold tracking-elegant uppercase"
                        style={{ background: GOLD_GRADIENT, color: EBONY, borderColor: GOLD }}
                      >
                        {t.pricing.popular}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="flex flex-col items-center p-6 pt-8 sm:p-8 sm:pt-10">
                    <h3 className="font-display-bold text-2xl tracking-luxury text-[#FAF7F2] sm:text-3xl">
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
                            style={{ color: GOLD }}
                          />
                          <span className="font-body text-sm text-[#D8D2C7]">
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
                          ? `${PRIMARY_CTA_CLASS} mt-8 inline-flex w-full items-center justify-center`
                          : `${SECONDARY_CTA_CLASS} mt-8 inline-flex w-full items-center justify-center`
                      }
                      style={
                        tier.recommended
                          ? { background: GOLD_GRADIENT, color: EBONY, border: "none" }
                          : undefined
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
      {landingTestimonials.length > 0 && (
      <section id="temoignages" className="relative overflow-hidden bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-[0.1] [background-image:linear-gradient(90deg,rgba(197,160,89,.28)_1px,transparent_1px),linear-gradient(0deg,rgba(250,247,242,.12)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-14 flex flex-col items-center text-center sm:mb-18">
            <Badge className="mb-4 rounded-full border border-[#C5A059]/35 bg-[#C5A059]/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#E6CA65]">
              PAROLES DE MARIÉS
            </Badge>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-[var(--font-cormorant)] text-4xl font-semibold leading-tight tracking-[0.02em] text-[#FAF7F2] sm:text-5xl lg:text-6xl"
            >
              L'émotion partagée par nos couples d'exception
            </motion.h2>
            <p className="mt-5 max-w-2xl font-body text-base leading-8 text-[#D8D2C7] sm:text-lg">
              Des expériences conçues pour rester dans les mémoires, avant même l'arrivée des invités.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
            {landingTestimonials.map((item, i) => (
              <motion.div
                key={item.id ?? `${item.coupleNames}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={`${DEEP_SURFACE} flex h-full flex-col overflow-hidden rounded-lg p-5 shadow-[0_24px_80px_rgba(0,0,0,.28)] sm:p-6`}>
                  <div className="relative mb-5 h-40 overflow-hidden rounded-lg border border-[#C5A059]/20">
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt={`Portrait de ${item.coupleNames}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#0F0E0C] text-5xl font-semibold text-[#C5A059]/80">
                        {testimonialInitials(item.coupleNames)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B0A]/70 via-transparent to-transparent" />
                  </div>
                  <Quote className="mb-4 size-8 text-[#C5A059]/45" />
                  <p className="flex-1 font-body text-sm leading-7 text-[#D8D2C7] sm:text-base">
                    {item.review}
                  </p>
                  <div className="mt-5 flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className="size-4"
                        style={{ color: GOLD, fill: s <= clampTestimonialRating(item.rating) ? GOLD : "transparent" }}
                      />
                    ))}
                  </div>
                  <div className="my-5 h-px w-full bg-gradient-to-r from-transparent via-[#C5A059]/35 to-transparent" />
                  <div>
                    <p className="font-[var(--font-cormorant)] text-xl font-semibold tracking-[0.04em] text-[#FAF7F2]">
                      {item.coupleNames}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#D8D2C7]/70">{item.location}</p>
                    {item.formula && <p className="mt-2 text-xs font-semibold text-[#C5A059]">{item.formula}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ SECTION                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section id="faq" className="bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28 lg:py-32">
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
                  className={`${DEEP_SURFACE} overflow-hidden rounded-lg transition-shadow duration-300`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2"
                  >
                    <span className="pr-4 font-display text-sm tracking-luxury text-[#FAF7F2] sm:text-base">
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
                          <p className="font-body text-sm leading-relaxed text-[#D8D2C7]">
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
      <section className="relative overflow-hidden bg-[#0D0B0A] py-20 text-[#FAF7F2] sm:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,160,89,.14),transparent_34%)]" />
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
            className="mt-5 max-w-2xl font-body text-base leading-8 text-[#D8D2C7] sm:text-lg"
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
              className={`${PRIMARY_CTA_CLASS} w-full max-w-[18rem] sm:w-auto sm:max-w-none`}
              asChild
            >
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 size-4" />
                Démarrer sur WhatsApp
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  FOOTER                                                            */}
      {/* ------------------------------------------------------------------ */}
      <footer className="mt-auto border-t border-[#C5A059]/20 bg-[#0D0B0A] text-[#FAF7F2]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1.15fr] lg:px-12">
          <div>
            <Link href="/" className="inline-flex flex-col leading-none">
              <span className="font-[var(--font-cormorant)] text-2xl font-light uppercase tracking-[0.3em] text-[#FAF7F2]">
                ÉLÉGANCE
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#C5A059]">
                INVITATIONS
              </span>
            </Link>
            <p className="mt-5 max-w-sm font-body text-sm leading-7 text-[#D8D2C7]">
              Créateur d'invitations de mariage numériques sur-mesure pour réceptions d'exception au Sénégal et à l'international.
            </p>
            <Badge className="mt-5 rounded-full border border-[#C5A059]/30 bg-[#C5A059]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#E6CA65]">
              Service Concierge disponible 7j/7
            </Badge>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A059]">Les Collections</h3>
            <ul className="mt-5 space-y-3">
              {FOOTER_COLLECTIONS.map((item) => (
                <li key={item}>
                  <button type="button" onClick={scrollToModeles} className="text-left text-sm text-[#D8D2C7] transition hover:text-[#FAF7F2]">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A059]">Fonctionnalités Clés</h3>
            <ul className="mt-5 space-y-3 text-sm text-[#D8D2C7]">
              {FOOTER_FEATURES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A059]">Conciergerie & Contact Direct</h3>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${PRIMARY_CTA_CLASS} mt-5 inline-flex items-center justify-center`}
            >
              <MessageCircle className="mr-2 size-4" />
              +221 77 361 59 44
            </a>
            <a href="mailto:contact@elegance-invitations.com" className="mt-5 block text-sm text-[#D8D2C7] transition hover:text-[#FAF7F2]">
              contact@elegance-invitations.com
            </a>
            <p className="mt-3 text-sm leading-7 text-[#D8D2C7]/70">
              Dakar, Sénégal — Accompagnement diaspora monde entier
            </p>
          </div>
        </div>

        <div className="border-t border-[#C5A059]/[0.14]">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-xs text-[#D8D2C7]/60 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
            <p>© 2026 Élégance Invitations. Tous droits réservés. L'art de célébrer.</p>
            <nav className="flex flex-wrap gap-4">
              <a href="#confidentialite" className="transition hover:text-[#FAF7F2]">Confidentialité</a>
              <a href="#conditions" className="transition hover:text-[#FAF7F2]">Conditions Générales</a>
              <Link href="/admin" className="transition hover:text-[#FAF7F2]">Espace Admin</Link>
            </nav>
          </div>
        </div>

      </footer>
    </div>
  );
}
