import type { CSSProperties } from "react";
import { allowedPlansForCategory, normalizeAllowedPlans } from "@/lib/plan-gating";
import type { DressCodeColor, ProgramStep, ThemeConfig } from "@/types/database.types";

export const DEFAULT_PROGRAM: ProgramStep[] = [
  { id: "mairie", time: "10h00", title: "Mairie", location: "Hotel de ville" },
  { id: "religieux", time: "16h00", title: "Ceremonie religieuse", location: "Lieu de culte" },
  { id: "cocktail", time: "18h00", title: "Cocktail", location: "Jardin de reception" },
  { id: "diner", time: "20h30", title: "Diner", location: "Salle principale" },
  { id: "soiree", time: "22h30", title: "Soiree", location: "Piste de danse" },
];

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function normalizeColorId(label: string, color: string) {
  const safeLabel = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeLabel || "couleur"}-${color.slice(1).toLowerCase()}`;
}

export function normalizeDressCodeColors(value: unknown, maxColors = 4): DressCodeColor[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;

      const colorInput = item as {
        id?: unknown;
        label?: unknown;
        color?: unknown;
        name?: unknown;
        hex?: unknown;
      };
      const label = (typeof colorInput.label === "string" ? colorInput.label : typeof colorInput.name === "string" ? colorInput.name : "").trim();
      const color = (typeof colorInput.color === "string" ? colorInput.color : typeof colorInput.hex === "string" ? colorInput.hex : "").trim();
      const normalizedColor = color.startsWith("#") ? color : `#${color}`;

      if (!label || !HEX_COLOR_PATTERN.test(normalizedColor)) return null;

      const id = typeof colorInput.id === "string" && colorInput.id.trim()
        ? colorInput.id.trim()
        : normalizeColorId(label, normalizedColor);

      return {
        id,
        label,
        color: normalizedColor.toUpperCase(),
      };
    })
    .filter((color): color is DressCodeColor => Boolean(color))
    .slice(0, maxColors);
}

export function getDefaultTheme(_slug?: string): ThemeConfig {
  return { ...SAFE_THEME_FALLBACK };
}

const SAFE_THEME_FALLBACK = {
  slug: "",
  name: "",
  category: "",
  allowedPlans: ["privilege", "imperiale"],
  primaryColor: "#FAF6F0",
  secondaryColor: "rgba(255, 255, 255, 0.85)",
  accentColor: "#D4AF37",
  goldColor: "#D4AF37",
  bgPrimary: "#FAF6F0",
  cardBg: "rgba(255, 255, 255, 0.85)",
  accentGold: "#D4AF37",
  textColor: "#1B0F12",
  scrollAnimation: "fade-up",
  titleFont: "Cormorant Garamond",
  animationType: "golden_palace_doors",
  previewGradient: "linear-gradient(135deg, #FAF6F0 0%, #D4AF37 52%, rgba(255, 255, 255, 0.85) 100%)",
  demoVideoUrl: null,
  openingVideoUrl: null,
  videoUrl: null,
  backdropUrl: null,
  isActive: true,
  isVisible: true,
} satisfies ThemeConfig;

const DEFAULT_TITLE_FONT_FAMILY = "var(--font-cormorant), Georgia, 'Times New Roman', serif";

const TITLE_FONT_FAMILIES: Record<string, string> = {
  "Cinzel": "var(--font-cinzel), Georgia, 'Times New Roman', serif",
  "Cormorant Garamond": DEFAULT_TITLE_FONT_FAMILY,
  "Playfair Display": "var(--font-playfair), Georgia, 'Times New Roman', serif",
  "Bodoni Moda": "var(--font-bodoni), 'Didot', Georgia, serif",
  "Great Vibes": "var(--font-great-vibes), 'Segoe Script', 'Snell Roundhand', cursive",
  "Alex Brush": "var(--font-alex-brush), 'Segoe Script', 'Snell Roundhand', cursive",
  "Montserrat": "var(--font-jakarta), Arial, Helvetica, sans-serif",
  "Prata": "var(--font-prata), Georgia, 'Times New Roman', serif",
  "Plus Jakarta Sans": "var(--font-jakarta), Arial, Helvetica, sans-serif",
};

function normalizeTitleFontName(value: string | null | undefined) {
  const font = value?.trim();
  if (!font) return SAFE_THEME_FALLBACK.titleFont;
  if (font === "Plus Jakarta Sans") return "Montserrat";
  return TITLE_FONT_FAMILIES[font] ? font : SAFE_THEME_FALLBACK.titleFont;
}

type ThemeConfigInput = {
  [Key in keyof ThemeConfig]?: ThemeConfig[Key] | null;
};

export function normalizeThemeConfig(theme: ThemeConfigInput | null | undefined): ThemeConfig {
  const fallback = SAFE_THEME_FALLBACK;
  const category = theme?.category || fallback.category || SAFE_THEME_FALLBACK.category;
  const primaryColor = theme?.primaryColor || theme?.bgPrimary || fallback.primaryColor || SAFE_THEME_FALLBACK.primaryColor;
  const secondaryColor = theme?.secondaryColor || theme?.cardBg || fallback.secondaryColor || SAFE_THEME_FALLBACK.secondaryColor;
  const accentColor = theme?.accentColor || theme?.accentGold || fallback.accentColor || SAFE_THEME_FALLBACK.accentColor;
  const goldColor = theme?.goldColor || theme?.accentGold || fallback.goldColor || SAFE_THEME_FALLBACK.goldColor;
  const animationType = theme?.animationType || theme?.openingStyle || fallback.animationType || SAFE_THEME_FALLBACK.animationType;
  const videoUrl = theme?.videoUrl ?? theme?.openingVideoUrl ?? theme?.demoVideoUrl ?? fallback.openingVideoUrl ?? fallback.demoVideoUrl ?? null;
  const isActive = theme?.isActive ?? theme?.isVisible ?? fallback.isActive ?? true;

  const rawLayout = typeof theme?.layoutStyle === "string" ? theme.layoutStyle.trim().toLowerCase() : "";
  const layoutStyle =
    rawLayout === "oriental" || rawLayout === "oriental-royal" || rawLayout === "oriental_royal"
      ? "oriental"
      : rawLayout === "minimalist" || rawLayout === "minimalist-chic" || rawLayout === "minimalist_chic"
      ? "minimalist"
      : rawLayout === "royal" || rawLayout === "prestige" || rawLayout === "prestige-majestic" || rawLayout === "prestige_majestic"
      ? "royal"
      : /orient|medina|arab/i.test(`${category} ${theme?.slug}`)
      ? "oriental"
      : /minimal|modern|editorial|satin/i.test(`${category} ${theme?.slug}`)
      ? "minimalist"
      : "royal";

  const resolvedFont = normalizeTitleFontName(theme?.fontFamily ?? theme?.titleFont ?? fallback.titleFont ?? SAFE_THEME_FALLBACK.titleFont);

  return {
    id: theme?.id,
    slug: theme?.slug || fallback.slug || SAFE_THEME_FALLBACK.slug,
    name: theme?.name || fallback.name || SAFE_THEME_FALLBACK.name,
    category,
    layoutStyle,
    coverVideoUrl: theme?.coverVideoUrl ?? null,
    allowedPlans: normalizeAllowedPlans(theme?.allowedPlans, fallback.allowedPlans ?? allowedPlansForCategory(category)),
    primaryColor,
    secondaryColor,
    accentColor,
    goldColor,
    bgPrimary: theme?.bgPrimary || primaryColor || "#FAF6F0",
    cardBg: theme?.cardBg || secondaryColor || "rgba(255, 255, 255, 0.85)",
    accentGold: theme?.accentGold || goldColor || "#D4AF37",
    textColor: theme?.textColor || primaryColor || "#1B0F12",
    scrollAnimation: theme?.scrollAnimation || "fade-up",
    titleFont: resolvedFont,
    fontFamily: resolvedFont,
    animationType,
    openingStyle: theme?.openingStyle || animationType,
    videoUrl,
    openingVideoUrl: videoUrl,
    previewGradient: theme?.previewGradient || fallback.previewGradient || SAFE_THEME_FALLBACK.previewGradient,
    demoVideoUrl: theme?.demoVideoUrl ?? videoUrl,
    backdropUrl: theme?.backdropUrl ?? fallback.backdropUrl ?? null,
    isActive,
    isVisible: theme?.isVisible ?? isActive,
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

function titleFontFamily(value: string | null | undefined) {
  return TITLE_FONT_FAMILIES[normalizeTitleFontName(value)] ?? DEFAULT_TITLE_FONT_FAMILY;
}

export function themeToCssVars(theme: ThemeConfigInput | null | undefined) {
  const safeTheme = normalizeThemeConfig(theme);
  const bgPrimary = safeTheme.bgPrimary || "#FAF6F0";
  const cardBg = safeTheme.cardBg || "rgba(255, 255, 255, 0.85)";
  const accentGold = safeTheme.accentGold || "#D4AF37";
  const textColor = safeTheme.textColor || "#1B0F12";
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
    "--invitation-title-font": titleFontFamily(safeTheme.titleFont),
    "--invitation-font-family": titleFontFamily(safeTheme.fontFamily || safeTheme.titleFont),
    "--primary": bgPrimary,
    "--accent": safeTheme.accentColor,
    "--gold": accentGold,
    "--bg-color": cardBg,
  } as CSSProperties;
}

export function parseJsonArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}
