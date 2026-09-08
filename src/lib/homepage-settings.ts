import { db } from "@/lib/db";
import { HOMEPAGE_SETTINGS_ID } from "@/lib/homepage-settings-shared";
import type { HomepageSettings } from "@/types/database.types";

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroPhone1: null,
  heroPhone2: null,
  updatedAt: null,
};

function serializeHomepageSettings(settings: {
  heroPhone1: string | null;
  heroPhone2: string | null;
  updatedAt?: Date | null;
} | null): HomepageSettings {
  if (!settings) return DEFAULT_HOMEPAGE_SETTINGS;

  return {
    heroPhone1: settings.heroPhone1,
    heroPhone2: settings.heroPhone2,
    updatedAt: settings.updatedAt?.toISOString() ?? null,
  };
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const settings = await db.siteSettings.findUnique({
      where: { id: HOMEPAGE_SETTINGS_ID },
    });

    return serializeHomepageSettings(settings);
  } catch (error) {
    console.error("Homepage settings lookup failed:", error);
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}

export async function updateHomepageSettings(data: {
  heroPhone1?: string | null;
  heroPhone2?: string | null;
}) {
  const settings = await db.siteSettings.upsert({
    where: { id: HOMEPAGE_SETTINGS_ID },
    update: data,
    create: {
      id: HOMEPAGE_SETTINGS_ID,
      heroPhone1: data.heroPhone1 ?? null,
      heroPhone2: data.heroPhone2 ?? null,
    },
  });

  return serializeHomepageSettings(settings);
}
