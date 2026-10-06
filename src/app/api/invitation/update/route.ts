import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidateInvitation } from "@/lib/cached-invitation";
import { serializePublicEvent } from "@/lib/public-event";
import { MAX_PROGRAM_STEPS, prepareProgramSteps } from "@/lib/program-steps";
import { requireApiRole } from "@/lib/server-auth";
import { THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { AUTH_ROLES } from "@/types/database.types";

const programStepSchema = z.object({
  id: z.string().optional(),
  time: z.string().optional(),
  title: z.string().optional(),
  location: z.string().optional(),
});

const updateInvitationSchema = z.object({
  program: z.array(programStepSchema).max(MAX_PROGRAM_STEPS).optional(),
  programSteps: z.array(programStepSchema).max(MAX_PROGRAM_STEPS).optional(),
});

async function updateProgram(eventId: string, programSteps: Prisma.InputJsonValue) {
  try {
    return await db.event.update({
      where: { id: eventId },
      data: {
        program: programSteps,
        programSteps,
      },
      include: {
        theme: true,
        guests: { orderBy: { createdAt: "asc" } },
      },
    });
  } catch (error) {
    console.error("Invitation program update with theme failed, retrying with compatible theme columns:", error);
    try {
      return await db.event.update({
        where: { id: eventId },
        data: {
          program: programSteps,
          programSteps,
        },
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          guests: { orderBy: { createdAt: "asc" } },
        },
      });
    } catch (compatError) {
      console.error("Invitation program update with compatible theme failed, retrying without theme:", compatError);
      return db.event.update({
        where: { id: eventId },
        data: {
          program: programSteps,
          programSteps,
        },
        include: {
          guests: { orderBy: { createdAt: "asc" } },
        },
      });
    }
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
    if (!session) return response;

    const eventId = session.user.eventId;
    if (!eventId) {
      return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
    }

    const parsed = updateInvitationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Programme invalide." }, { status: 400 });
    }

    const preparedProgram = prepareProgramSteps(parsed.data.programSteps ?? parsed.data.program ?? []);
    if (preparedProgram.hasInvalid) {
      return NextResponse.json(
        { success: false, error: "Chaque etape du programme doit contenir une heure et un titre." },
        { status: 400 },
      );
    }

    const updated = await updateProgram(
      eventId,
      preparedProgram.steps as unknown as Prisma.InputJsonValue,
    );

    revalidateInvitation(updated.slug);

    return NextResponse.json({
      success: true,
      data: {
        event: serializePublicEvent(updated),
        guests: updated.guests,
      },
    });
  } catch (error) {
    console.error("Invitation program update failed:", error);
    return NextResponse.json({ success: false, error: "Sauvegarde du programme impossible." }, { status: 500 });
  }
}
