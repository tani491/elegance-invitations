import type { CSSProperties } from "react";
import type { DressCodeColor, ProgramStep, ThemeConfig } from "@/types/database.types";

export const DEFAULT_PROGRAM: ProgramStep[] = [
  { id: "mairie", time: "10h00", title: "Mairie", location: "Hotel de ville" },
  { id: "religieux", time: "16h00", title: "Ceremonie religieuse", location: "Lieu de culte" },
  { id: "cocktail", time: "18h00", title: "Cocktail", location: "Jardin de reception" },
  { id: "diner", time: "20h30", title: "Diner", location: "Salle principale" },
  { id: "soiree", time: "22h30", title: "Soiree", location: "Piste de danse" },
];

export const DEFAULT_DRESS_CODE_COLORS: DressCodeColor[] = [
  { id: "ivoire", label: "Ivoire", color: "#FAF7F2" },
  { id: "or", label: "Or", color: "#D4AF37" },
  { id: "bordeaux", label: "Bordeaux", color: "#5C1D24" },
];

export const DEFAULT_THEMES: ThemeConfig[] = [
  {
    slug: "enveloppe-de-cire",
    name: "Enveloppe de Cire Standard",
    category: "Essentielle",
    primaryColor: "#6B1F2A",
    secondaryColor: "#FFF8ED",
    accentColor: "#B8894D",
    goldColor: "#D4AF37",
    titleFont: "Cormorant Garamond",
    animationType: "wax_seal_burst",
    previewGradient: "linear-gradient(135deg, #6B1F2A 0%, #B8894D 46%, #FFF8ED 100%)",
  },
  {
    slug: "ivoire-minimal",
    name: "Minimaliste Epure",
    category: "Essentielle",
    primaryColor: "#2C2A28",
    secondaryColor: "#FAF7F2",
    accentColor: "#C7A45A",
    goldColor: "#C7A45A",
    titleFont: "Plus Jakarta Sans",
    animationType: "botanical_envelope",
    previewGradient: "linear-gradient(135deg, #FAF7F2 0%, #EFE6D6 52%, #C7A45A 100%)",
  },
  {
    slug: "roseraie-nude",
    name: "Roseraie Nude",
    category: "Essentielle",
    primaryColor: "#8A5968",
    secondaryColor: "#FFF7F4",
    accentColor: "#D8A4A9",
    goldColor: "#C8A56A",
    titleFont: "Cormorant Garamond",
    animationType: "botanical_envelope",
    previewGradient: "linear-gradient(135deg, #8A5968 0%, #D8A4A9 48%, #FFF7F4 100%)",
  },
  {
    slug: "rideau-de-theatre",
    name: "Rideaux de Theatre en Velours",
    category: "Prestige",
    primaryColor: "#54101A",
    secondaryColor: "#FFF6EA",
    accentColor: "#A01E30",
    goldColor: "#E0B85C",
    titleFont: "Cormorant Garamond",
    animationType: "velvet_curtains",
    previewGradient: "linear-gradient(135deg, #54101A 0%, #A01E30 48%, #E0B85C 100%)",
  },
  {
    slug: "ruban-de-soie",
    name: "Ruban de Soie Satine",
    category: "Prestige",
    primaryColor: "#442B3A",
    secondaryColor: "#FFF4EA",
    accentColor: "#B87C8A",
    goldColor: "#D8B66D",
    titleFont: "Cormorant Garamond",
    animationType: "silk_ribbon_untie",
    previewGradient: "linear-gradient(135deg, #442B3A 0%, #B87C8A 48%, #FFF4EA 100%)",
  },
  {
    slug: "fleur-ficelle-botanique",
    name: "Fleur & Ficelle Botanique",
    category: "Prestige",
    primaryColor: "#365143",
    secondaryColor: "#FAF6EC",
    accentColor: "#B89B72",
    goldColor: "#C8A65B",
    titleFont: "Cormorant Garamond",
    animationType: "botanical_envelope",
    previewGradient: "linear-gradient(135deg, #365143 0%, #B89B72 52%, #FAF6EC 100%)",
  },
  {
    slug: "roseraie-boheme",
    name: "Roseraie Boheme",
    category: "Prestige",
    primaryColor: "#7B4F5F",
    secondaryColor: "#FFF7F4",
    accentColor: "#C47B78",
    goldColor: "#E8A598",
    titleFont: "Cormorant Garamond",
    animationType: "silk_ribbon_untie",
    previewGradient: "linear-gradient(135deg, #7B4F5F 0%, #C47B78 48%, #E8A598 100%)",
  },
  {
    slug: "medina-orientale",
    name: "Medina Orientale",
    category: "Privilege",
    primaryColor: "#164B52",
    secondaryColor: "#FBF3E4",
    accentColor: "#C87533",
    goldColor: "#D8B25B",
    titleFont: "Cormorant Garamond",
    animationType: "golden_palace_doors",
    previewGradient: "linear-gradient(135deg, #164B52 0%, #C87533 54%, #FBF3E4 100%)",
  },
  {
    slug: "portes-royales-dorees",
    name: "Portes Royales Dorees & Vue Mer",
    category: "Privilege",
    primaryColor: "#123744",
    secondaryColor: "#F8EFE0",
    accentColor: "#D0904D",
    goldColor: "#E3BC5D",
    titleFont: "Cormorant Garamond",
    animationType: "golden_palace_doors",
    previewGradient: "linear-gradient(135deg, #123744 0%, #D0904D 48%, #F8EFE0 100%)",
  },
  {
    slug: "defile-scenique",
    name: "Defile Scenique Cathedrale / Mosquee",
    category: "Privilege",
    primaryColor: "#28213A",
    secondaryColor: "#F7F0E4",
    accentColor: "#7C6CA8",
    goldColor: "#D8B25B",
    titleFont: "Cormorant Garamond",
    animationType: "ceremonial_walk",
    previewGradient: "linear-gradient(135deg, #28213A 0%, #7C6CA8 48%, #D8B25B 100%)",
  },
  {
    slug: "emeraude-or-imperial",
    name: "Emeraude & Or Imperial",
    category: "Privilege",
    primaryColor: "#073E37",
    secondaryColor: "#F4EBD9",
    accentColor: "#12806F",
    goldColor: "#DFB85C",
    titleFont: "Cormorant Garamond",
    animationType: "golden_palace_doors",
    previewGradient: "linear-gradient(135deg, #073E37 0%, #12806F 52%, #DFB85C 100%)",
  },
];

export function getDefaultTheme(slug = "medina-orientale") {
  return DEFAULT_THEMES.find((theme) => theme.slug === slug) ?? DEFAULT_THEMES[0];
}

const SAFE_THEME_FALLBACK = {
  slug: "medina-orientale",
  name: "Medina Orientale",
  category: "Privilege",
  primaryColor: "#FAF6F0",
  secondaryColor: "rgba(255, 255, 255, 0.85)",
  accentColor: "#D4AF37",
  goldColor: "#D4AF37",
  bgPrimary: "#FAF6F0",
  cardBg: "rgba(255, 255, 255, 0.85)",
  accentGold: "#D4AF37",
  textColor: "#2D2013",
  scrollAnimation: "fade-up",
  titleFont: "Cormorant Garamond",
  animationType: "golden_palace_doors",
  previewGradient: "linear-gradient(135deg, #FAF6F0 0%, #D4AF37 52%, rgba(255, 255, 255, 0.85) 100%)",
  demoVideoUrl: null,
  openingVideoUrl: null,
  backdropUrl: null,
  isActive: true,
} satisfies ThemeConfig;

type ThemeConfigInput = {
  [Key in keyof ThemeConfig]?: ThemeConfig[Key] | null;
};

export function normalizeThemeConfig(theme: ThemeConfigInput | null | undefined): ThemeConfig {
  const fallback = theme?.slug ? getDefaultTheme(theme.slug) : SAFE_THEME_FALLBACK;
  const primaryColor = theme?.primaryColor || theme?.bgPrimary || fallback.primaryColor || SAFE_THEME_FALLBACK.primaryColor;
  const secondaryColor = theme?.secondaryColor || theme?.cardBg || fallback.secondaryColor || SAFE_THEME_FALLBACK.secondaryColor;
  const accentColor = theme?.accentColor || theme?.accentGold || fallback.accentColor || SAFE_THEME_FALLBACK.accentColor;
  const goldColor = theme?.goldColor || theme?.accentGold || fallback.goldColor || SAFE_THEME_FALLBACK.goldColor;

  return {
    slug: theme?.slug || fallback.slug || SAFE_THEME_FALLBACK.slug,
    name: theme?.name || fallback.name || SAFE_THEME_FALLBACK.name,
    category: theme?.category || fallback.category || SAFE_THEME_FALLBACK.category,
    primaryColor,
    secondaryColor,
    accentColor,
    goldColor,
    bgPrimary: theme?.bgPrimary || primaryColor || "#FAF6F0",
    cardBg: theme?.cardBg || secondaryColor || "rgba(255, 255, 255, 0.85)",
    accentGold: theme?.accentGold || goldColor || "#D4AF37",
    textColor: theme?.textColor || primaryColor || "#2D2013",
    scrollAnimation: theme?.scrollAnimation || "fade-up",
    titleFont: theme?.titleFont || fallback.titleFont || SAFE_THEME_FALLBACK.titleFont,
    animationType: theme?.animationType || fallback.animationType || SAFE_THEME_FALLBACK.animationType,
    openingVideoUrl: theme?.openingVideoUrl ?? fallback.openingVideoUrl ?? null,
    previewGradient: theme?.previewGradient || fallback.previewGradient || SAFE_THEME_FALLBACK.previewGradient,
    demoVideoUrl: theme?.demoVideoUrl ?? fallback.demoVideoUrl ?? null,
    backdropUrl: theme?.backdropUrl ?? fallback.backdropUrl ?? null,
    isActive: theme?.isActive ?? fallback.isActive ?? true,
  };
}

function hexToRgb(value: string) {
  const normalized = value.trim().replace(/^#/, "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((character) => character + character).join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return { r: 212, g: 175, b: 55 };
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

function rgbaFromHex(value: string, alpha: number) {
  const { r, g, b } = hexToRgb(value);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isHexColor(value: string | null | undefined) {
  return Boolean(value && /^#[0-9a-fA-F]{6}$/.test(value.trim()));
}

function colorWithAlpha(value: string, alpha: number, fallback: string) {
  return isHexColor(value) ? rgbaFromHex(value, alpha) : fallback;
}

export function themeToCssVars(theme: ThemeConfigInput | null | undefined) {
  const safeTheme = normalizeThemeConfig(theme);
  const bgPrimary = safeTheme.bgPrimary || "#FAF6F0";
  const cardBg = safeTheme.cardBg || "rgba(255, 255, 255, 0.85)";
  const accentGold = safeTheme.accentGold || "#D4AF37";
  const textColor = safeTheme.textColor || "#2D2013";
  const primaryRgb = hexToRgb(bgPrimary);
  const accentRgb = hexToRgb(safeTheme.accentColor);
  const goldRgb = hexToRgb(accentGold);
  const mutedText = colorWithAlpha(textColor, 0.68, "rgba(44, 42, 40, 0.68)");

  return {
    "--theme-bg": bgPrimary,
    "--theme-card-bg": cardBg,
    "--theme-accent": accentGold,
    "--theme-text": textColor,
    "--invitation-primary": bgPrimary,
    "--invitation-secondary": cardBg,
    "--invitation-accent": safeTheme.accentColor,
    "--invitation-gold": accentGold,
    "--invitation-primary-rgb": `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`,
    "--invitation-accent-rgb": `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`,
    "--invitation-gold-rgb": `${goldRgb.r} ${goldRgb.g} ${goldRgb.b}`,
    "--invitation-ivory": "#FFFDF9",
    "--invitation-copy": "rgba(255, 253, 249, 0.82)",
    "--invitation-muted": "rgba(255, 253, 249, 0.68)",
    "--invitation-border": rgbaFromHex(safeTheme.accentColor, 0.4),
    "--invitation-gold-line": rgbaFromHex(accentGold, 0.48),
    "--invitation-primary-soft": rgbaFromHex(bgPrimary, 0.42),
    "--invitation-panel": rgbaFromHex(bgPrimary, 0.34),
    "--invitation-panel-strong": rgbaFromHex(bgPrimary, 0.48),
    "--invitation-chip": rgbaFromHex(safeTheme.accentColor, 0.28),
    "--invitation-chip-strong": rgbaFromHex(safeTheme.accentColor, 0.46),
    "--invitation-sheet": cardBg,
    "--invitation-sheet-soft": cardBg,
    "--invitation-sheet-text": textColor,
    "--invitation-sheet-muted": mutedText,
    "--invitation-sheet-border": rgbaFromHex(accentGold, 0.34),
    "--invitation-button-bg": `linear-gradient(135deg, ${accentGold}, ${safeTheme.accentColor} 52%, ${bgPrimary})`,
    "--invitation-title-font": safeTheme.titleFont,
    "--primary": bgPrimary,
    "--accent": safeTheme.accentColor,
    "--gold": accentGold,
    "--bg-color": cardBg,
  } as CSSProperties;
}

export function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}
