import type { ThemeConfig } from "@/types/database.types";

export type PlanTier = "essentielle" | "prestige" | "privilege";

export type OpeningAnimationType =
  | "wax_seal_burst"
  | "botanical_envelope"
  | "velvet_curtains"
  | "silk_ribbon_untie"
  | "golden_palace_doors"
  | "ceremonial_walk";

export type TieredThemeConfig = ThemeConfig & {
  requiredPlan: PlanTier;
  animationType: OpeningAnimationType;
  openingVideoUrl?: string | null;
};

export type GuestPass = {
  guestToken: string;
  guestName: string;
  invitationUrl: string;
  planType: PlanTier;
};
