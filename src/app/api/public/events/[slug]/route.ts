import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let event;

  try {
    event = await db.event.findFirst({
      where: { slug, isActive: true },
      include: { theme: true },
    });
  } catch (error) {
    console.error("Public event theme relation failed, retrying without theme:", error);
    try {
      event = await db.event.findFirst({
        where: { slug, isActive: true },
      });
    } catch (retryError) {
      console.error("Public event fallback failed:", retryError);
      return NextResponse.json({ success: false, error: "Invitation indisponible." }, { status: 500 });
    }
  }

  if (!event) {
    return NextResponse.json({ success: false, error: "Invitation introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializePublicEvent(event) });
}
