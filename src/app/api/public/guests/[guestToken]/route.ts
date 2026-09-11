import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";
import { THEME_COMPAT_SELECT } from "@/lib/theme-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ guestToken: string }> },
) {
  const { guestToken } = await params;
  let guest;

  try {
    guest = await db.eventGuest.findUnique({
      where: { qrToken: guestToken },
      include: { event: { include: { theme: true } } },
    });
  } catch (error) {
    console.error("Public guest theme relation failed, retrying with compatible theme columns:", error);
    try {
      guest = await db.eventGuest.findUnique({
        where: { qrToken: guestToken },
        include: {
          event: {
            include: {
              theme: { select: THEME_COMPAT_SELECT },
            },
          },
        },
      });
    } catch (compatError) {
      console.error("Public guest compatible theme relation failed, retrying without theme:", compatError);
      try {
        guest = await db.eventGuest.findUnique({
          where: { qrToken: guestToken },
          include: { event: true },
        });
      } catch (retryError) {
        console.error("Public guest fallback failed:", retryError);
        return NextResponse.json({ success: false, error: "Pass indisponible." }, { status: 500 });
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
