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

export type ScrollAnimationType = "fade-up" | "scale-in" | "slide-stagger";

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
  slug: string;
  name: string;
  category: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  goldColor: string;
  bgPrimary?: string;
  cardBg?: string;
  accentGold?: string;
  textColor?: string;
  scrollAnimation?: ScrollAnimationType;
  backdropUrl?: string | null;
  titleFont: string;
  animationType: OpeningAnimationType;
  openingVideoUrl?: string | null;
  previewGradient: string;
  demoVideoUrl?: string | null;
  isActive?: boolean;
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
