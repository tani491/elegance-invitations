import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const checkinSchema = z.object({
  qrToken: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  if (!session.user.eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  const parsed = checkinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Jeton QR invalide." }, { status: 400 });
  }

  const guest = await db.eventGuest.findFirst({
    where: {
      qrToken: parsed.data.qrToken,
      eventId: session.user.eventId,
    },
  });

  if (!guest) {
    return NextResponse.json({ success: false, error: "Invite introuvable pour cet evenement." }, { status: 404 });
  }

  if (guest.isCheckedIn) {
    return NextResponse.json({
      success: true,
      data: guest,
      message: "Cet invite a deja ete enregistre.",
    });
  }

  const updated = await db.eventGuest.update({
    where: { id: guest.id },
    data: { isCheckedIn: true, checkedInAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: "Bienvenue, check-in valide.",
  });
}
