import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EVENT_SELECT_WITHOUT_PROGRAM_STEPS } from "@/lib/event-safe-select";
import { serializePublicEvent } from "@/lib/public-event";
import { isMissingPrismaColumnError } from "@/lib/server-auth";
import { THEME_COMPAT_SELECT } from "@/lib/theme-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guestToken: string }> },
) {
  const { guestToken } = await params;
  const eventId = request.nextUrl.searchParams.get("eventId");
  const eventScope = eventId ? { eventId } : {};
  let guest;

  try {
    guest = await db.eventGuest.findFirst({
      where: {
        ...eventScope,
        OR: [
          { qrToken: guestToken },
          { id: guestToken },
          { accessCode: guestToken },
        ],
      },
      include: { event: { include: { theme: true } } },
    });
  } catch (error) {
    if (isMissingPrismaColumnError(error, "programSteps")) {
      console.warn("Event.programSteps is not available; loading public guest pass without that column.");
      try {
        guest = await db.eventGuest.findFirst({
          where: {
            ...eventScope,
            OR: [
              { qrToken: guestToken },
              { id: guestToken },
              { accessCode: guestToken },
            ],
          },
          include: { event: { select: EVENT_SELECT_WITHOUT_PROGRAM_STEPS } },
        });
      } catch (programStepsRetryError) {
        console.error("Public guest without programSteps failed:", programStepsRetryError);
        return NextResponse.json({ success: false, error: "Pass indisponible." }, { status: 503 });
      }
    } else {
    console.error("Public guest theme relation failed, retrying with compatible theme columns:", error);
    try {
      guest = await db.eventGuest.findFirst({
        where: {
          ...eventScope,
          OR: [
            { qrToken: guestToken },
            { id: guestToken },
            { accessCode: guestToken },
          ],
        },
        include: {
          event: {
            include: {
              theme: { select: THEME_COMPAT_SELECT },
            },
          },
        },
      });
    } catch (compatError) {
      if (isMissingPrismaColumnError(compatError, "programSteps")) {
        console.warn("Event.programSteps is not available after public guest retry; loading without that column.");
        try {
          guest = await db.eventGuest.findFirst({
            where: {
              ...eventScope,
              OR: [
                { qrToken: guestToken },
                { id: guestToken },
                { accessCode: guestToken },
              ],
            },
            include: { event: { select: EVENT_SELECT_WITHOUT_PROGRAM_STEPS } },
          });
        } catch (programStepsRetryError) {
          console.error("Public guest without programSteps failed:", programStepsRetryError);
          return NextResponse.json({ success: false, error: "Pass indisponible." }, { status: 503 });
        }
      } else {
      console.error("Public guest compatible theme relation failed, retrying without theme:", compatError);
      try {
        guest = await db.eventGuest.findFirst({
          where: {
            ...eventScope,
            OR: [
              { qrToken: guestToken },
              { id: guestToken },
              { accessCode: guestToken },
            ],
          },
          include: { event: true },
        });
      } catch (retryError) {
        console.error("Public guest fallback failed:", retryError);
        return NextResponse.json({ success: false, error: "Pass indisponible." }, { status: 503 });
      }
      }
    }
    }
  }

  if (!guest || !guest.event.isActive) {
    return NextResponse.json({ success: false, error: "Pass introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        fullName: guest.fullName,
        table: guest.table,
        maxGuests: guest.maxGuests,
        rsvpStatus: guest.rsvpStatus,
        plusOnes: guest.plusOnes,
        isVip: guest.isVip,
        qrToken: guest.qrToken,
        isCheckedIn: guest.isCheckedIn,
      },
      event: serializePublicEvent(guest.event),
    },
  });
}
