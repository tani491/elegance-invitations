import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isMissingPrismaColumnError, requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT]);
  if (!session) return response;

  try {
    const user = await db.authUser.update({
      where: { id: session.user.id },
      data: { hasSeenOnboarding: true },
      select: { hasSeenOnboarding: true },
    });

    return NextResponse.json(
      { success: true, data: user },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (isMissingPrismaColumnError(error, "hasSeenOnboarding")) {
      console.warn("AuthUser.hasSeenOnboarding is not available; onboarding state update skipped.");
      return NextResponse.json(
        { success: true, data: { hasSeenOnboarding: true, skipped: true } },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("Client onboarding update failed:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de sauvegarder l'etat du guide." },
      { status: 500 },
    );
  }
}
