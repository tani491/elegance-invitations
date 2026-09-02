import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  attachAuthCookie,
  createSessionForUser,
  loginPathForRole,
  normalizeEmail,
  verifyPassword,
} from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  audience: z.enum(["client", "admin"]),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Email ou mot de passe invalide." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const expectedRole = parsed.data.audience === "admin" ? AUTH_ROLES.SUPER_ADMIN : AUTH_ROLES.CLIENT;
    const user = await db.authUser.findUnique({ where: { email } });

    if (!user || !user.isActive || user.role !== expectedRole) {
      return NextResponse.json(
        { success: false, error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSessionForUser({
      id: user.id,
      email: user.email,
      role: user.role,
      eventId: user.eventId,
    });

    await db.authUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      success: true,
      redirectTo: loginPathForRole(user.role),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        eventId: user.eventId,
      },
    });

    attachAuthCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de traiter la connexion." },
      { status: 500 },
    );
  }
}
