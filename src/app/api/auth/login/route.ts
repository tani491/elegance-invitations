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
};

type LoginSessionProfile = {
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
      },
    });
  } catch (error) {
    if (!isMissingPrismaColumnError(error, "role")) throw error;

    console.warn("AuthUser.role is not available; falling back to CLIENT-only login semantics.");
    const rows = await db.$queryRaw<Array<Omit<LoginUser, "role">>>(
      Prisma.sql`
        SELECT id, email, "passwordHash"
        FROM "AuthUser"
        WHERE email = ${email}
        LIMIT 1
      `,
    );

    const user = rows[0];
    return user ? { ...user, role: AUTH_ROLES.CLIENT } : null;
  }
}

async function loadLoginSessionProfile(userId: string): Promise<LoginSessionProfile | null> {
  try {
    return await db.authUser.findUnique({
      where: { id: userId },
      select: {
        displayName: true,
        eventId: true,
        isActive: true,
      },
    });
  } catch (error) {
    console.warn("Login session profile lookup failed, retrying with raw safe query:", error);
    try {
      const rows = await db.$queryRaw<LoginSessionProfile[]>(
        Prisma.sql`
          SELECT "displayName", "eventId", "isActive"
          FROM "AuthUser"
          WHERE id = ${userId}
          LIMIT 1
        `,
      );

      return rows[0] ?? null;
    } catch (profileRetryError) {
      console.error("Login session profile fallback failed:", profileRetryError);
      return null;
    }
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

    if (!user || user.role !== expectedRole) {
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

    const profile = await loadLoginSessionProfile(user.id);
    if (!profile?.isActive) {
      return NextResponse.json(
        { success: false, error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSessionForUser({
      id: user.id,
      email: user.email,
      role: user.role,
      eventId: profile.eventId,
    });
    const hasSeenOnboarding = await readClientOnboardingSeen(user.id).catch((error) => {
      console.warn("Login onboarding state lookup failed, defaulting to false:", error);
      return false;
    });

    try {
      await db.authUser.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      console.error("Login lastLoginAt update failed:", error);
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: loginPathForRole(user.role),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: profile.displayName,
        eventId: profile.eventId,
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
