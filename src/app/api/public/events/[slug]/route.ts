import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await db.event.findFirst({
    where: { slug, isActive: true },
    include: { theme: true },
  });

  if (!event) {
    return NextResponse.json({ success: false, error: "Invitation introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializePublicEvent(event) });
}
