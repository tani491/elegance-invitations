import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";
import { THEME_COMPAT_SELECT } from "@/lib/theme-store";

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
    console.error("Public event theme relation failed, retrying with compatible theme columns:", error);
    try {
      event = await db.event.findFirst({
        where: { slug, isActive: true },
        include: { theme: { select: THEME_COMPAT_SELECT } },
      });
    } catch (compatError) {
      console.error("Public event compatible theme relation failed, retrying without theme:", compatError);
      try {
        event = await db.event.findFirst({
          where: { slug, isActive: true },
        });
      } catch (retryError) {
        console.error("Public event fallback failed:", retryError);
        return NextResponse.json({ success: false, error: "Invitation indisponible." }, { status: 500 });
      }
    }
  }

  if (!event) {
    return NextResponse.json({ success: false, error: "Invitation introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializePublicEvent(event) });
}
