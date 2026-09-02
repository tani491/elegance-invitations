import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const querySchema = z.object({
  token: z.string().min(12),
  category: z.string().min(2).optional(),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    token: searchParams.get("token"),
    category: searchParams.get("category") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Parametres invalides." }, { status: 400 });
  }

  const event = await db.event.findFirst({
    where: {
      photographerToken: parsed.data.token,
      isActive: true,
    },
    select: { id: true },
  });

  if (!event) {
    return NextResponse.json({ success: false, error: "Token invalide." }, { status: 403 });
  }

  const photos = await db.eventPhoto.findMany({
    where: {
      eventId: event.id,
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ success: true, data: photos });
}
