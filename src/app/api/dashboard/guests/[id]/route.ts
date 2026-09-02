import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const updateGuestSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  table: z.string().nullable().optional(),
  maxGuests: z.number().int().min(1).max(10).optional(),
  rsvpStatus: z.enum(["pending", "confirmed", "declined"]).optional(),
  dietaryNotes: z.string().nullable().optional(),
  menuChoice: z.string().nullable().optional(),
  isVip: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;
  if (!session.user.eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement rattache au compte." }, { status: 404 });
  }

  const { id } = await params;
  const parsed = updateGuestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invite invalide." }, { status: 400 });
  }

  const existing = await db.eventGuest.findFirst({ where: { id, eventId: session.user.eventId } });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Invite introuvable." }, { status: 404 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  const firstName = parsed.data.firstName ?? existing.firstName ?? "";
  const lastName = parsed.data.lastName ?? existing.lastName ?? "";
  if (parsed.data.firstName || parsed.data.lastName) {
    data.fullName = `${firstName} ${lastName}`.trim() || existing.fullName;
  }

  const guest = await db.eventGuest.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, data: guest });
}
