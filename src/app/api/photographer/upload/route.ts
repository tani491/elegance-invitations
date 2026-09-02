import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, category, photos } = body as {
      token: string;
      category: string;
      photos: { title?: string; url: string; thumbnailUrl?: string; width?: number; height?: number }[];
    };

    if (!token || !photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      );
    }

    /* Verify the photographer token */
    const event = await db.event.findUnique({
      where: { photographerToken: token },
      select: { id: true, isActive: true },
    });

    if (!event || !event.isActive) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 403 }
      );
    }

    /* Insert photos in batch */
    const created = await db.eventPhoto.createMany({
      data: photos.map((p) => ({
        eventId: event.id,
        category: category || "ceremonie",
        title: p.title || null,
        originalUrl: p.url,
        thumbnailUrl: p.thumbnailUrl || null,
        width: p.width || null,
        height: p.height || null,
      })),
    });

    return NextResponse.json({
      success: true,
      count: created.count,
    });
  } catch (error) {
    console.error("Photographer upload error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
