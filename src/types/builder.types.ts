export type BuilderStep = 1 | 2 | 3 | 4 | 5 | 6;

export type TemplateId =
  | "dolce-vita"
  | "blossom-oud"
  | "vibrant-vows"
  | "destination-love"
  | "royal-gold"
  | "sacred-garden"
  | "minimalist";

export type BuilderSectionId =
  | "date-location"
  | "welcome-message"
  | "rsvp"
  | "timeline"
  | "dress-code"
  | "countdown"
  | "google-maps"
  | "gift-iban"
  | "love-story"
  | "menu"
  | "photo-gallery"
  | "faq"
  | "childhood-photos";

export type BuilderExtraId =
  | "music"
  | "custom-wax-seal"
  | "custom-envelope"
  | "ai-video"
  | "custom-domain";

export type BuilderBundleId = "signature-bundle" | "story-bundle";
export type BuilderFormulaId = "essentielle" | "prestige" | "privilege";

export interface BuilderTemplate {
  id: TemplateId;
  name: string;
  mood: string;
  basePrice: number;
  accent: string;
  gradient: string;
  previewVideoUrl?: string;
}

export interface BuilderOption<TId extends string> {
  id: TId;
  label: string;
  description: string;
  price: number;
}

export interface BuilderSection extends BuilderOption<BuilderSectionId> {
  included: boolean;
}

export type BuilderExtra = BuilderOption<BuilderExtraId>;

export interface BuilderBundle extends BuilderOption<BuilderBundleId> {
  includedExtras: BuilderExtraId[];
  includedSections: BuilderSectionId[];
}

export type BuilderFormula = BuilderOption<BuilderFormulaId>;

export interface BuilderContact {
  name: string;
  email: string;
  weddingDate: string;
  notes: string;
}

export interface BuilderConfig {
  templateId: TemplateId;
  formulaId: BuilderFormulaId;
  sectionIds: BuilderSectionId[];
  extraIds: BuilderExtraId[];
  bundleIds: BuilderBundleId[];
  guestLinkCount: number;
  versionCount: number;
  contact: BuilderContact;
}

export interface PricingLineItem {
  id: string;
  label: string;
  amount: number;
}

export interface BuilderPricing {
  template: BuilderTemplate;
  lineItems: PricingLineItem[];
  total: number;
}

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    id: "dolce-vita",
    name: "Dolce Vita",
    mood: "Editorial italien, creme solaire et serif couture.",
    basePrice: 140,
    accent: "#C69A49",
    gradient: "linear-gradient(135deg, #fbf2dd, #d7a85d 48%, #5b2d24)",
  },
  {
    id: "blossom-oud",
    name: "Blossom & Oud",
    mood: "Floral oriental, oud doux, touches rose antique.",
    basePrice: 160,
    accent: "#A96C5B",
    gradient: "linear-gradient(135deg, #fff6f1, #c58f7f 48%, #533326)",
  },
  {
    id: "vibrant-vows",
    name: "Vibrant Vows",
    mood: "Couleurs franches, rythme moderne, invitation festive.",
    basePrice: 145,
    accent: "#D64550",
    gradient: "linear-gradient(135deg, #fff0c7, #d64550 48%, #194f45)",
  },
  {
    id: "destination-love",
    name: "Destination Love",
    mood: "Voyage, bord de mer, experience immersive.",
    basePrice: 180,
    accent: "#2D8292",
    gradient: "linear-gradient(135deg, #e9fbff, #6db7c6 45%, #163c52)",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    mood: "Portes dorees, palais, ceremonial haut de gamme.",
    basePrice: 210,
    accent: "#B8892B",
    gradient: "linear-gradient(135deg, #fff8df, #c49a42 46%, #2a1712)",
  },
  {
    id: "sacred-garden",
    name: "The Sacred Garden",
    mood: "Jardin sacre, arabesques, vert profond et or.",
    basePrice: 195,
    accent: "#1F6B55",
    gradient: "linear-gradient(135deg, #f3f8ea, #1f6b55 48%, #ad8a3b)",
  },
  {
    id: "minimalist",
    name: "Minimalist",
    mood: "Net, silencieux, typographie pure et details fins.",
    basePrice: 90,
    accent: "#343434",
    gradient: "linear-gradient(135deg, #ffffff, #e7e2da 50%, #343434)",
  },
];

export const BUILDER_SECTIONS: BuilderSection[] = [
  { id: "date-location", label: "Date & lieu", description: "Bloc essentiel avec adresse.", price: 0, included: true },
  { id: "welcome-message", label: "Message d'accueil", description: "Texte introductif personnalise.", price: 0, included: true },
  { id: "rsvp", label: "RSVP", description: "Confirmation invite et WhatsApp.", price: 0, included: true },
  { id: "timeline", label: "Timeline", description: "Programme etapes par etapes.", price: 15, included: false },
  { id: "dress-code", label: "Dress code", description: "Pastilles couleurs et consignes.", price: 15, included: false },
  { id: "countdown", label: "Compte a rebours", description: "Jours, heures, minutes, secondes.", price: 15, included: false },
  { id: "google-maps", label: "Google Maps", description: "Bouton itineraire direct.", price: 15, included: false },
  { id: "gift-iban", label: "Liste cadeaux / IBAN", description: "Bloc bancaire avec copie.", price: 15, included: false },
  { id: "love-story", label: "Histoire d'amour", description: "Section narrative elegante.", price: 15, included: false },
  { id: "menu", label: "Menu", description: "Repas et choix invite.", price: 15, included: false },
  { id: "photo-gallery", label: "Galerie photos", description: "Galerie responsive haute definition.", price: 15, included: false },
  { id: "faq", label: "FAQ", description: "Questions pratiques.", price: 15, included: false },
  { id: "childhood-photos", label: "Photos d'enfance", description: "Section souvenir avant/apres.", price: 15, included: false },
];

export const BUILDER_EXTRAS: BuilderExtra[] = [
  { id: "music", label: "Musique", description: "Audio d'ambiance avec lecteur flottant.", price: 15 },
  { id: "custom-wax-seal", label: "Sceau de cire sur mesure", description: "Monogramme ou symbole personnalise.", price: 20 },
  { id: "custom-envelope", label: "Enveloppe personnalisee", description: "Texture, gaufrage et couleurs dedies.", price: 20 },
  { id: "ai-video", label: "Video IA animee", description: "Sequence d'ouverture prerendue.", price: 40 },
  { id: "custom-domain", label: "Domaine personnalise", description: "Adresse premium dediee.", price: 60 },
];

export const BUILDER_BUNDLES: BuilderBundle[] = [
  {
    id: "signature-bundle",
    label: "Signature Bundle",
    description: "Musique, sceau et enveloppe a prix reduit.",
    price: 45,
    includedExtras: ["music", "custom-wax-seal", "custom-envelope"],
    includedSections: [],
  },
  {
    id: "story-bundle",
    label: "Story Bundle",
    description: "Histoire, galerie et photos d'enfance.",
    price: 35,
    includedExtras: [],
    includedSections: ["love-story", "photo-gallery", "childhood-photos"],
  },
];

export const BUILDER_FORMULAS: BuilderFormula[] = [
  {
    id: "essentielle",
    label: "Essentielle",
    description: "Invitation elegante avec sections de base et une photo officielle.",
    price: 0,
  },
  {
    id: "prestige",
    label: "Prestige",
    description: "Experience enrichie avec options premium et jusqu'a deux photos.",
    price: 80,
  },
  {
    id: "privilege",
    label: "Privilege",
    description: "Catalogue complet, animations signature et accompagnement prioritaire.",
    price: 180,
  },
];

export const DEFAULT_BUILDER_CONFIG: BuilderConfig = {
  templateId: "dolce-vita",
  formulaId: "prestige",
  sectionIds: ["date-location", "welcome-message", "rsvp"],
  extraIds: [],
  bundleIds: [],
  guestLinkCount: 0,
  versionCount: 1,
  contact: {
    name: "",
    email: "",
    weddingDate: "",
    notes: "",
  },
};

export function calculateBuilderPricing(config: BuilderConfig): BuilderPricing {
  const template = BUILDER_TEMPLATES.find((item) => item.id === config.templateId) ?? BUILDER_TEMPLATES[0];
  const formula = BUILDER_FORMULAS.find((item) => item.id === config.formulaId) ?? BUILDER_FORMULAS[1];
  const selectedBundles = BUILDER_BUNDLES.filter((bundle) => config.bundleIds.includes(bundle.id));
  const bundledExtras = new Set(selectedBundles.flatMap((bundle) => bundle.includedExtras));
  const bundledSections = new Set(selectedBundles.flatMap((bundle) => bundle.includedSections));

  const lineItems: PricingLineItem[] = [
    { id: template.id, label: `Modele ${template.name}`, amount: template.basePrice },
  ];

  if (formula.price > 0) {
    lineItems.push({ id: formula.id, label: `Formule ${formula.label}`, amount: formula.price });
  }

  BUILDER_SECTIONS.filter((section) => config.sectionIds.includes(section.id))
    .filter((section) => section.price > 0 && !bundledSections.has(section.id))
    .forEach((section) => lineItems.push({ id: section.id, label: section.label, amount: section.price }));

  BUILDER_EXTRAS.filter((extra) => config.extraIds.includes(extra.id))
    .filter((extra) => !bundledExtras.has(extra.id))
    .forEach((extra) => lineItems.push({ id: extra.id, label: extra.label, amount: extra.price }));

  selectedBundles.forEach((bundle) => lineItems.push({ id: bundle.id, label: bundle.label, amount: bundle.price }));

  if (config.guestLinkCount > 0) {
    lineItems.push({
      id: "guest-links",
      label: `${config.guestLinkCount} liens invites nominatifs`,
      amount: config.guestLinkCount * 3,
    });
  }

  const paidVersions = Math.max(config.versionCount - 1, 0);
  if (paidVersions > 0) {
    lineItems.push({
      id: "versions",
      label: `${paidVersions} version(s) supplementaire(s)`,
      amount: paidVersions * 15,
    });
  }

  return {
    template,
    lineItems,
    total: lineItems.reduce((sum, item) => sum + item.amount, 0),
  };
}
