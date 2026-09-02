import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const session = await authenticateRequest(request);

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      displayName: session.user.displayName,
      eventId: session.user.eventId,
    },
  });
}
