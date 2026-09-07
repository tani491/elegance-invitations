import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getThemeOrDefault, THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { serializePublicEvent } from "@/lib/public-event";
import { canUseTheme, photoLimitForPlan } from "@/lib/plan-gating";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const programStepSchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  location: z.string(),
});

const dressCodeColorSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const updateEventSchema = z.object({
  themeSlug: z.string().optional(),
  brideName: z.string().nullable().optional(),
  groomName: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
  eventTime: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  venueAddress: z.string().nullable().optional(),
  venueMapUrl: z.string().nullable().optional(),
  wazeUrl: z.string().nullable().optional(),
  dressCode: z.string().nullable().optional(),
  dressCodeColors: z.array(dressCodeColorSchema).optional(),
  program: z.array(programStepSchema).optional(),
  coupleStory: z.string().nullable().optional(),
  coverPhotoUrl: z.string().nullable().optional(),
  officialPhotoUrls: z.array(z.string()).optional(),
  musicUrl: z.string().nullable().optional(),
  whatsappGroupUrl: z.string().nullable().optional(),
  invitationQuote: z.string().nullable().optional(),
  giftIban: z.string().nullable().optional(),
  giftWave: z.string().nullable().optional(),
});

async function loadClientEvent(eventId: string) {
  try {
    return await db.event.findUnique({
      where: { id: eventId },
      include: {
        theme: true,
        guests: { orderBy: { createdAt: "asc" } },
        photos: { orderBy: { uploadedAt: "desc" } },
      },
    });
  } catch (error) {
    console.error("Dashboard event theme relation failed, retrying with compatible theme columns:", error);
    try {
      return await db.event.findUnique({
        where: { id: eventId },
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          guests: { orderBy: { createdAt: "asc" } },
          photos: { orderBy: { uploadedAt: "desc" } },
        },
      });
    } catch (compatError) {
      console.error("Dashboard event compatible theme relation failed, retrying without theme:", compatError);
      return db.event.findUnique({
        where: { id: eventId },
        include: {
          guests: { orderBy: { createdAt: "asc" } },
          photos: { orderBy: { uploadedAt: "desc" } },
        },
      });
    }
  }
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  const eventId = session.user.eventId;
  if (!eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  try {
    const event = await loadClientEvent(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Evenement introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        event: serializePublicEvent(event),
        guests: event.guests,
        photos: event.photos,
        photographerLink: event.photographerToken ? `/photographer/${event.photographerToken}` : null,
      },
    });
  } catch (error) {
    console.error("Dashboard event fetch failed:", error);
    return NextResponse.json({ success: false, error: "Impossible de charger votre espace." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  const eventId = session.user.eventId;
  if (!eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  const parsed = updateEventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Donnees evenement invalides." }, { status: 400 });
  }

  let currentEvent;
  try {
    currentEvent = await db.event.findUnique({ where: { id: eventId }, select: { planType: true } });
  } catch (error) {
    console.error("Dashboard event lookup failed:", error);
    return NextResponse.json({ success: false, error: "Impossible de charger votre espace." }, { status: 500 });
  }
  if (!currentEvent) {
    return NextResponse.json({ success: false, error: "Evenement introuvable." }, { status: 404 });
  }

  const { themeSlug, eventDate, officialPhotoUrls, ...safeData } = parsed.data;
  const updateData: Record<string, unknown> = { ...safeData };

  if (eventDate !== undefined) {
    updateData.eventDate = eventDate ? new Date(eventDate) : null;
  }

  if (themeSlug) {
    if (!canUseTheme(currentEvent.planType, themeSlug)) {
      return NextResponse.json({ success: false, error: "Theme verrouille pour votre formule." }, { status: 403 });
    }

    const theme = await getThemeOrDefault(themeSlug);
    if (theme) {
      updateData.themeId = theme.id;
      updateData.template = theme.slug;
      updateData.primaryColor = theme.primaryColor;
      updateData.secondaryColor = theme.secondaryColor;
      updateData.accentColor = theme.accentColor;
      updateData.goldColor = theme.goldColor;
      updateData.titleFont = theme.titleFont;
      updateData.animationType = theme.animationType;
    }
  }

  if (officialPhotoUrls) {
    updateData.officialPhotoUrls = officialPhotoUrls.slice(0, photoLimitForPlan(currentEvent.planType));
  }

  let updated;
  try {
    updated = await db.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        theme: true,
        guests: { orderBy: { createdAt: "asc" } },
        photos: { orderBy: { uploadedAt: "desc" } },
      },
    });
  } catch (error) {
    console.error("Dashboard event update with theme failed, retrying with compatible theme columns:", error);
    try {
      updated = await db.event.update({
        where: { id: eventId },
        data: updateData,
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          guests: { orderBy: { createdAt: "asc" } },
          photos: { orderBy: { uploadedAt: "desc" } },
        },
      });
    } catch (compatError) {
      console.error("Dashboard event update with compatible theme failed, retrying without theme:", compatError);
      try {
        updated = await db.event.update({
          where: { id: eventId },
          data: updateData,
          include: {
            guests: { orderBy: { createdAt: "asc" } },
            photos: { orderBy: { uploadedAt: "desc" } },
          },
        });
      } catch (retryError) {
        console.error("Dashboard event update failed:", retryError);
        return NextResponse.json({ success: false, error: "Sauvegarde impossible." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      event: serializePublicEvent(updated),
      guests: updated.guests,
      photos: updated.photos,
      photographerLink: updated.photographerToken ? `/photographer/${updated.photographerToken}` : null,
    },
  });
}
