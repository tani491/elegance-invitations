import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, clearAuthCookie } from "@/lib/server-auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await authenticateRequest(request);

  if (session) {
    await db.authSession.update({
      where: { id: session.payload.sessionId },
      data: { revokedAt: new Date() },
    });
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookie(response);
  return response;
}
