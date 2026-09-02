import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Token manquant" },
      { status: 400 }
    );
  }

  try {
    const event = await db.event.findUnique({
      where: { photographerToken: token },
      select: {
        id: true,
        name: true,
        brideName: true,
        groomName: true,
        eventDate: true,
        venueName: true,
        isActive: true,
      },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { valid: false, error: "Token non reconnu" },
        { status: 404 }
      );
    }

    const { isActive, ...safeEvent } = event;
    return NextResponse.json({ valid: true, event: safeEvent });
  } catch (error) {
    console.error("Photographer validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
