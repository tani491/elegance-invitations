import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const updateEventSchema = z.object({
  isActive: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  planType: z.enum(["essentielle", "prestige", "privilege"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const { id } = await params;
  const parsed = updateEventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Mise a jour invalide." }, { status: 400 });
  }

  const updated = await db.event.update({
    where: { id },
    data: parsed.data,
    include: {
      client: { select: { id: true, email: true, displayName: true, isActive: true } },
      _count: { select: { guests: true } },
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
