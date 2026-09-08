import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const uploadedPhotoSchema = z.object({
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(180).nullable().optional(),
  fileName: z.string().min(1).max(240).nullable().optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

const uploadSyncSchema = z.object({
  token: z.string().min(12),
  category: z.string().min(2).default("ceremonie"),
  photos: z.array(uploadedPhotoSchema).min(1).max(100),
});

function titleFromPhoto(photo: z.infer<typeof uploadedPhotoSchema>) {
  const rawTitle = photo.title ?? photo.fileName ?? "Photo";
  return rawTitle.replace(/\.[^.]+$/, "").trim().slice(0, 180) || "Photo";
}

export async function POST(request: NextRequest) {
  try {
    const parsed = uploadSyncSchema.safeParse(await request.json().catch(() => ({})));

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Donnees d'upload invalides.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const event = await db.event.findUnique({
      where: { photographerToken: parsed.data.token },
      select: { id: true, isActive: true },
    });

    if (!event || !event.isActive) {
      return NextResponse.json({ success: false, error: "Token invalide." }, { status: 403 });
    }

    const photos = await db.$transaction(
      parsed.data.photos.map((photo) =>
        db.eventPhoto.create({
          data: {
            eventId: event.id,
            category: parsed.data.category,
            title: titleFromPhoto(photo),
            originalUrl: photo.url,
            thumbnailUrl: photo.thumbnailUrl ?? photo.url,
            width: photo.width ?? null,
            height: photo.height ?? null,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true, count: photos.length, data: photos });
  } catch (error) {
    console.error("Photographer upload sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Synchronisation galerie impossible.",
      },
      { status: 500 },
    );
  }
}
