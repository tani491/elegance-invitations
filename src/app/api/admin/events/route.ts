import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  try {
    const events = await db.event.findMany({
      include: {
        client: { select: { id: true, email: true, displayName: true, isActive: true } },
        _count: { select: { guests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    console.error("Admin events fetch failed:", error);
    return NextResponse.json(
      { success: true, data: [], warning: "Commandes indisponibles temporairement." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
