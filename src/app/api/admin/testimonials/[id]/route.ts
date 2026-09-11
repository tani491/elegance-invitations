import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ success: false, error: "Suppression invalide." }, { status: 400 });
  }

  await db.testimonial.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
