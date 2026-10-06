import { THEME_COMPAT_SELECT } from "@/lib/theme-store";

export const EVENT_SELECT_WITHOUT_PROGRAM_STEPS = {
  id: true,
  slug: true,
  name: true,
  organizerName: true,
  organizerPhone: true,
  clientEmail: true,
  template: true,
  themeId: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  goldColor: true,
  titleFont: true,
  animationType: true,
  coverPhotoUrl: true,
  coverPhotoCloudinaryId: true,
  officialPhotoUrls: true,
  musicUrl: true,
  motionVideoUrl: true,
  whatsappGroupUrl: true,
  invitationQuote: true,
  giftIban: true,
  giftWave: true,
  brideName: true,
  groomName: true,
  eventDate: true,
  eventTime: true,
  venueName: true,
  venueAddress: true,
  venueMapUrl: true,
  wazeUrl: true,
  mairieName: true,
  mairieAddress: true,
  mairieDate: true,
  mairieTime: true,
  receptionVenue: true,
  receptionAddress: true,
  receptionDate: true,
  receptionTime: true,
  dressCode: true,
  dressCodeColors: true,
  program: true,
  coupleStory: true,
  planType: true,
  isActive: true,
  isPaid: true,
  createdAt: true,
  updatedAt: true,
  theme: { select: THEME_COMPAT_SELECT },
} as const;

export const EVENT_WITH_GUESTS_SELECT_WITHOUT_PROGRAM_STEPS = {
  ...EVENT_SELECT_WITHOUT_PROGRAM_STEPS,
  guests: { orderBy: { createdAt: "asc" } },
} as const;

export const EVENT_WITH_GUESTS_NO_THEME_SELECT_WITHOUT_PROGRAM_STEPS = {
  ...EVENT_SELECT_WITHOUT_PROGRAM_STEPS,
  theme: false,
  guests: { orderBy: { createdAt: "asc" } },
} as const;

export function omitProgramSteps<T extends Record<string, unknown>>(data: T) {
  const nextData = { ...data };
  delete nextData.programSteps;
  return nextData;
}
