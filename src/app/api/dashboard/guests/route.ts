import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { randomToken, requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const createGuestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  table: z.string().optional().nullable(),
  maxGuests: z.number().int().min(1).max(10).default(1),
  isVip: z.boolean().default(false),
});

function buildAccessCode(firstName: string, lastName: string) {
  const initials = `${firstName[0] ?? "G"}${lastName[0] ?? "U"}`.toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ELEG-${initials}-${suffix}`;
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  if (!session.user.eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  const guests = await db.eventGuest.findMany({
    where: { eventId: session.user.eventId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ success: true, data: guests });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  if (!session.user.eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  const parsed = createGuestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invite invalide." }, { status: 400 });
  }

  const guest = await db.eventGuest.create({
    data: {
      eventId: session.user.eventId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      fullName: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
      phone: parsed.data.phone,
      email: parsed.data.email,
      table: parsed.data.table,
      maxGuests: parsed.data.maxGuests,
      isVip: parsed.data.isVip,
      accessCode: buildAccessCode(parsed.data.firstName, parsed.data.lastName),
      qrToken: randomToken("guest"),
    },
  });

  return NextResponse.json({ success: true, data: guest }, { status: 201 });
}
