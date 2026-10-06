import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidateInvitation } from "@/lib/cached-invitation";
import {
  EVENT_WITH_GUESTS_NO_THEME_SELECT_WITHOUT_PROGRAM_STEPS,
  EVENT_WITH_GUESTS_SELECT_WITHOUT_PROGRAM_STEPS,
  omitProgramSteps,
} from "@/lib/event-safe-select";
import { getThemeOrDefault, THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { serializePublicEvent } from "@/lib/public-event";
import { canUseMotionVideo, canUseTheme, photoLimitForPlan } from "@/lib/plan-gating";
import { MAX_PROGRAM_STEPS, prepareProgramSteps } from "@/lib/program-steps";
import { isMissingPrismaColumnError, readClientOnboardingSeen, requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const programStepSchema = z.object({
  id: z.string().optional(),
  time: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
});

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

const dressCodeColorSchema = z
  .object({
    id: z.string().optional(),
    label: z.string().optional(),
    color: z.string().optional(),
    name: z.string().optional(),
    hex: z.string().optional(),
  })
  .transform((value, context) => {
    const label = (value.label ?? value.name ?? "").trim();
    const color = (value.color ?? value.hex ?? "").trim();
    const normalizedColor = color.startsWith("#") ? color : `#${color}`;

    if (!label) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nom de couleur requis.",
        path: ["label"],
      });
    }

    if (!HEX_COLOR_PATTERN.test(normalizedColor)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Code couleur hexadecimal invalide.",
        path: ["color"],
      });
    }

    return {
      id: value.id?.trim() || normalizeColorId(label || "couleur", normalizedColor),
      label,
      color: normalizedColor.toUpperCase(),
    };
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
  dressCodeColors: z.array(dressCodeColorSchema).max(4).optional(),
  program: z.array(programStepSchema).max(MAX_PROGRAM_STEPS).optional(),
  programSteps: z.array(programStepSchema).max(MAX_PROGRAM_STEPS).optional(),
  coupleStory: z.string().nullable().optional(),
  coverPhotoUrl: z.string().nullable().optional(),
  officialPhotoUrls: z.array(z.string()).optional(),
  musicUrl: z.string().nullable().optional(),
  motionVideoUrl: z.string().nullable().optional(),
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
      },
    });
  } catch (error) {
    if (isMissingPrismaColumnError(error, "programSteps")) {
      console.warn("Event.programSteps is not available; loading dashboard event without that column.");
      return db.event.findUnique({
        where: { id: eventId },
        select: EVENT_WITH_GUESTS_SELECT_WITHOUT_PROGRAM_STEPS,
      });
    }

    console.error("Dashboard event theme relation failed, retrying with compatible theme columns:", error);
    try {
      return await db.event.findUnique({
        where: { id: eventId },
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          guests: { orderBy: { createdAt: "asc" } },
        },
      });
    } catch (compatError) {
      if (isMissingPrismaColumnError(compatError, "programSteps")) {
        console.warn("Event.programSteps is not available after theme retry; loading dashboard event without theme/programSteps.");
        return db.event.findUnique({
          where: { id: eventId },
          select: EVENT_WITH_GUESTS_NO_THEME_SELECT_WITHOUT_PROGRAM_STEPS,
        });
      }

      console.error("Dashboard event compatible theme relation failed, retrying without theme:", compatError);
      return db.event.findUnique({
        where: { id: eventId },
        include: {
          guests: { orderBy: { createdAt: "asc" } },
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
        client: {
          hasSeenOnboarding: await readClientOnboardingSeen(session.user.id),
        },
      },
    });
  } catch (error) {
    console.error("Dashboard event fetch failed:", error);
    return NextResponse.json({ success: false, error: "Impossible de charger votre espace." }, { status: 503 });
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
    currentEvent = await db.event.findUnique({ where: { id: eventId }, select: { planType: true, slug: true } });
  } catch (error) {
    console.error("Dashboard event lookup failed:", error);
    return NextResponse.json({ success: false, error: "Impossible de charger votre espace." }, { status: 503 });
  }
  if (!currentEvent) {
    return NextResponse.json({ success: false, error: "Evenement introuvable." }, { status: 404 });
  }

  const { themeSlug, eventDate, officialPhotoUrls, program, programSteps, ...safeData } = parsed.data;
  const updateData: Record<string, unknown> = { ...safeData };

  if (parsed.data.motionVideoUrl && !canUseMotionVideo(currentEvent.planType)) {
    return NextResponse.json(
      { success: false, error: "Video Cinematique Motion reservee a la formule Imperiale." },
      { status: 403 },
    );
  }

  if (eventDate !== undefined) {
    updateData.eventDate = eventDate ? new Date(eventDate) : null;
  }

  if (themeSlug) {
    const theme = await getThemeOrDefault(themeSlug);
    const allowedPlans = theme && "allowedPlans" in theme
      ? (theme as { allowedPlans?: string[] | null }).allowedPlans
      : undefined;

    if (theme && !canUseTheme(currentEvent.planType, themeSlug, allowedPlans)) {
      return NextResponse.json({ success: false, error: "Theme verrouille pour votre formule." }, { status: 403 });
    }

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

  const nextProgramSteps = programSteps ?? program;
  if (nextProgramSteps) {
    const preparedProgram = prepareProgramSteps(nextProgramSteps);
    if (preparedProgram.hasInvalid) {
      return NextResponse.json(
        { success: false, error: "Chaque etape du programme doit contenir une heure et un titre." },
        { status: 400 },
      );
    }

    updateData.program = preparedProgram.steps;
    updateData.programSteps = preparedProgram.steps;
  }

  let updated;
  try {
    updated = await db.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        theme: true,
        guests: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch (error) {
    if (isMissingPrismaColumnError(error, "programSteps")) {
      console.warn("Event.programSteps is not available; saving dashboard event through legacy program column only.");
      try {
        updated = await db.event.update({
          where: { id: eventId },
          data: omitProgramSteps(updateData),
          select: EVENT_WITH_GUESTS_SELECT_WITHOUT_PROGRAM_STEPS,
        });
      } catch (programStepsRetryError) {
        console.error("Dashboard event legacy program fallback failed:", programStepsRetryError);
        return NextResponse.json({ success: false, error: "Sauvegarde impossible." }, { status: 503 });
      }
    } else {
    console.error("Dashboard event update with theme failed, retrying with compatible theme columns:", error);
    try {
      updated = await db.event.update({
        where: { id: eventId },
        data: updateData,
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          guests: { orderBy: { createdAt: "asc" } },
        },
      });
    } catch (compatError) {
      if (isMissingPrismaColumnError(compatError, "programSteps")) {
        console.warn("Event.programSteps is not available after update retry; saving through legacy program column only.");
        try {
          updated = await db.event.update({
            where: { id: eventId },
            data: omitProgramSteps(updateData),
            select: EVENT_WITH_GUESTS_NO_THEME_SELECT_WITHOUT_PROGRAM_STEPS,
          });
        } catch (programStepsRetryError) {
          console.error("Dashboard event legacy program fallback failed:", programStepsRetryError);
          return NextResponse.json({ success: false, error: "Sauvegarde impossible." }, { status: 503 });
        }
      } else {
      console.error("Dashboard event update with compatible theme failed, retrying without theme:", compatError);
      try {
        updated = await db.event.update({
          where: { id: eventId },
          data: updateData,
          include: {
            guests: { orderBy: { createdAt: "asc" } },
          },
        });
      } catch (retryError) {
        console.error("Dashboard event update failed:", retryError);
        return NextResponse.json({ success: false, error: "Sauvegarde impossible." }, { status: 503 });
      }
      }
    }
    }
  }

  revalidateInvitation(updated.slug ?? currentEvent.slug);

  return NextResponse.json({
    success: true,
    data: {
      event: serializePublicEvent(updated),
      guests: updated.guests,
    },
  });
}
