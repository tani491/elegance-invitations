import { NextRequest, NextResponse } from "next/server";
import { getCachedInvitation } from "@/lib/cached-invitation";
import { serializePublicEvent } from "@/lib/public-event";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getCachedInvitation(slug);

  if (!event) {
    return NextResponse.json({ success: false, error: "Invitation introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: serializePublicEvent(event) });
}
