import { DEFAULT_DRESS_CODE_COLORS, DEFAULT_PROGRAM, getDefaultTheme, parseJsonArray } from "@/lib/theme-presets";
import { normalizePlan, photoLimitForPlan } from "@/lib/plan-gating";
import { serializeTheme, type SerializableThemeInput } from "@/lib/theme-store";
import type { Event, EventPhoto } from "@prisma/client";
import type { DressCodeColor, OpeningAnimationType, ProgramStep, PublicEventPayload } from "@/types/database.types";

type PublicEventRecord = Event & { theme?: SerializableThemeInput; photos?: EventPhoto[] };

const OPENING_ANIMATION_TYPES: OpeningAnimationType[] = [
  "wax_seal_burst",
  "botanical_envelope",
  "velvet_curtains",
  "silk_ribbon_untie",
  "golden_palace_doors",
  "ceremonial_walk",
];

function normalizeAnimationType(value: string): OpeningAnimationType {
  return OPENING_ANIMATION_TYPES.includes(value as OpeningAnimationType)
    ? (value as OpeningAnimationType)
    : "wax_seal_burst";
}

export function serializePublicEvent(event: PublicEventRecord): PublicEventPayload {
  const theme = event.theme ? serializeTheme(event.theme) : getDefaultTheme(event.template);
  const usesLiveTheme = Boolean(event.theme);
  const planType = normalizePlan(event.planType);
  const officialPhotoUrls = parseJsonArray<string>(event.officialPhotoUrls, []);
  const photos = [event.coverPhotoUrl, ...officialPhotoUrls].filter(Boolean).slice(0, photoLimitForPlan(planType)) as string[];

  return {
    id: event.id,
    slug: event.slug,
    name: event.name,
    organizerName: event.organizerName,
    organizerPhone: event.organizerPhone,
    planType,
    brideName: event.brideName,
    groomName: event.groomName,
    eventDate: event.eventDate ? event.eventDate.toISOString() : null,
    eventTime: event.eventTime,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    venueMapUrl: event.venueMapUrl,
    wazeUrl: event.wazeUrl,
    dressCode: event.dressCode,
    dressCodeColors: parseJsonArray<DressCodeColor>(event.dressCodeColors, DEFAULT_DRESS_CODE_COLORS),
    program: parseJsonArray<ProgramStep>(event.program, DEFAULT_PROGRAM),
    coupleStory: event.coupleStory,
    coverPhotoUrl: event.coverPhotoUrl,
    officialPhotoUrls: photos,
    musicUrl: event.musicUrl,
    whatsappGroupUrl: event.whatsappGroupUrl,
    invitationQuote: event.invitationQuote,
    giftIban: event.giftIban,
    giftWave: event.giftWave,
    galleryPhotos: (event.photos ?? [])
      .filter((photo) => Boolean(photo.originalUrl))
      .map((photo) => ({
        id: photo.id,
        category: photo.category,
        title: photo.title,
        originalUrl: photo.originalUrl,
        thumbnailUrl: photo.thumbnailUrl,
        uploadedAt: photo.uploadedAt.toISOString(),
      })),
    theme: {
      ...theme,
      primaryColor: usesLiveTheme ? theme.primaryColor : event.primaryColor ?? theme.primaryColor,
      secondaryColor: usesLiveTheme ? theme.secondaryColor : event.secondaryColor ?? theme.secondaryColor,
      accentColor: usesLiveTheme ? theme.accentColor : event.accentColor ?? theme.accentColor,
      goldColor: usesLiveTheme ? theme.goldColor : event.goldColor ?? theme.goldColor,
      titleFont: event.titleFont ?? theme.titleFont,
      animationType: usesLiveTheme ? theme.animationType : normalizeAnimationType(event.animationType ?? theme.animationType),
    },
  };
}
