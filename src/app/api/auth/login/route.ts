import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  attachAuthCookie,
  createSessionForUser,
  isMissingPrismaColumnError,
  loginPathForRole,
  normalizeEmail,
  readClientOnboardingSeen,
  verifyPassword,
} from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  audience: z.enum(["client", "admin"]),
});

type LoginUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  displayName: string;
  eventId: string | null;
  isActive: boolean;
};

async function loadLoginUser(email: string): Promise<LoginUser | null> {
  try {
    return await db.authUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        displayName: true,
        eventId: true,
        isActive: true,
      },
    });
  } catch (error) {
    if (!isMissingPrismaColumnError(error, "role")) throw error;

    console.warn("AuthUser.role is not available; falling back to CLIENT-only login semantics.");
    const rows = await db.$queryRaw<Array<Omit<LoginUser, "role">>>(
      Prisma.sql`
        SELECT id, email, "passwordHash", "displayName", "eventId", "isActive"
        FROM "AuthUser"
        WHERE email = ${email}
        LIMIT 1
      `,
    );

    const user = rows[0];
    return user ? { ...user, role: AUTH_ROLES.CLIENT } : null;
  }
}

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
    const user = await loadLoginUser(email);

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
    const hasSeenOnboarding = await readClientOnboardingSeen(user.id).catch((error) => {
      console.warn("Login onboarding state lookup failed, defaulting to false:", error);
      return false;
    });

    db.authUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch((error) => {
      console.error("Login lastLoginAt update failed:", error);
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
        hasSeenOnboarding,
      },
    });

    attachAuthCookie(response, token, expiresAt);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de traiter la connexion." },
      { status: 503 },
    );
  }
}
