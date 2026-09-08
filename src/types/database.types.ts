export const AUTH_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  CLIENT: "CLIENT",
  PHOTOGRAPHER: "PHOTOGRAPHER",
} as const;

export type AuthRole = (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];

export type PlanType = "essentielle" | "prestige" | "privilege";
export type OpeningAnimationType =
  | "wax_seal_burst"
  | "botanical_envelope"
  | "velvet_curtains"
  | "silk_ribbon_untie"
  | "golden_palace_doors"
  | "ceremonial_walk";

export const SCROLL_ANIMATION_VALUES = [
  "fade-up",
  "scale-in",
  "slide-stagger",
  "curtain-reveal",
  "blur-in",
  "rotate-soft",
  "pop-soft",
  "glow-spread",
  "flip-x",
  "shimmer-rise",
] as const;

export type ScrollAnimationType = (typeof SCROLL_ANIMATION_VALUES)[number];

export const SCROLL_ANIMATION_OPTIONS: { value: ScrollAnimationType; label: string }[] = [
  { value: "fade-up", label: "fade-up : Fondu montant doux classique" },
  { value: "scale-in", label: "scale-in : Zoom progressif subtil" },
  { value: "slide-stagger", label: "slide-stagger : Glissement alterne gauche / droite" },
  { value: "curtain-reveal", label: "curtain-reveal : Devoilement rideau vertical" },
  { value: "blur-in", label: "blur-in : Revelation avec flou satine" },
  { value: "rotate-soft", label: "rotate-soft : Inclinaison 3D douce" },
  { value: "pop-soft", label: "pop-soft : Apparition aerienne amortie" },
  { value: "glow-spread", label: "glow-spread : Halo dore diffus" },
  { value: "flip-x", label: "flip-x : Feuillet pivotant" },
  { value: "shimmer-rise", label: "shimmer-rise : Montee avec reflet soyeux" },
];

export type RsvpStatus = "pending" | "confirmed" | "declined";

export interface SessionPayload {
  sub: string;
  email: string;
  role: AuthRole;
  eventId: string | null;
  sessionId: string;
  exp: number;
}

export interface ThemeConfig {
  id?: string | null;
  slug: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  goldColor: string;
  bgPrimary?: string | null;
  cardBg?: string | null;
  accentGold?: string | null;
  textColor?: string | null;
  scrollAnimation?: ScrollAnimationType | null;
  backdropUrl?: string | null;
  titleFont: string;
  animationType: OpeningAnimationType;
  openingStyle?: OpeningAnimationType | null;
  videoUrl?: string | null;
  openingVideoUrl?: string | null;
  previewGradient: string;
  demoVideoUrl?: string | null;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface ProgramStep {
  id: string;
  time: string;
  title: string;
  location: string;
}

export interface DressCodeColor {
  id: string;
  label: string;
  color: string;
}

export interface PublicGalleryPhoto {
  id: string;
  category: string;
  title: string | null;
  originalUrl: string | null;
  thumbnailUrl: string | null;
  uploadedAt: string;
}

export interface PublicEventPayload {
  id: string;
  slug: string;
  name: string;
  organizerName: string | null;
  organizerPhone: string | null;
  planType: PlanType;
  brideName: string | null;
  groomName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  venueName: string | null;
  venueAddress: string | null;
  venueMapUrl: string | null;
  wazeUrl: string | null;
  dressCode: string | null;
  dressCodeColors: DressCodeColor[];
  program: ProgramStep[];
  coupleStory: string | null;
  coverPhotoUrl: string | null;
  officialPhotoUrls: string[];
  musicUrl: string | null;
  whatsappGroupUrl: string | null;
  invitationQuote: string | null;
  giftIban: string | null;
  giftWave: string | null;
  galleryPhotos: PublicGalleryPhoto[];
  theme: ThemeConfig;
}
