import { createHash, pbkdf2 as pbkdf2Callback, randomBytes, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  AUTH_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-token";
import { AUTH_ROLES, type AuthRole } from "@/types/database.types";

const pbkdf2 = promisify(pbkdf2Callback);
const PASSWORD_ITERATIONS = 210_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";
const AUTH_USER_SESSION_SELECT = {
  id: true,
  email: true,
  role: true,
  displayName: true,
  eventId: true,
  isActive: true,
} as const;

type AuthenticatedSession = {
  revokedAt: Date | null;
  expiresAt: Date;
  tokenHash: string;
  user: {
    id: string;
    email: string;
    role: string;
    displayName: string;
    eventId: string | null;
    isActive: boolean;
  };
};

export function isMissingPrismaColumnError(error: unknown, column?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2022") return false;
  if (!column) return true;

  const missingColumn = typeof error.meta?.column === "string" ? error.meta.column : "";
  return missingColumn === column || missingColumn.endsWith(`.${column}`);
}

async function loadAuthenticatedSession(sessionId: string): Promise<AuthenticatedSession | null> {
  try {
    return await db.authSession.findUnique({
      where: { id: sessionId },
      include: { user: { select: AUTH_USER_SESSION_SELECT } },
    });
  } catch (error) {
    if (!isMissingPrismaColumnError(error, "role")) throw error;

    console.warn("AuthUser.role is not available during session lookup; using CLIENT-only fallback.");
    const rows = await db.$queryRaw<Array<{
      revokedAt: Date | null;
      expiresAt: Date;
      tokenHash: string;
      id: string;
      email: string;
      displayName: string;
      eventId: string | null;
      isActive: boolean;
    }>>(
      Prisma.sql`
        SELECT
          s."revokedAt",
          s."expiresAt",
          s."tokenHash",
          u.id,
          u.email,
          u."displayName",
          u."eventId",
          u."isActive"
        FROM "AuthSession" s
        INNER JOIN "AuthUser" u ON u.id = s."userId"
        WHERE s.id = ${sessionId}
        LIMIT 1
      `,
    );

    const row = rows[0];
    if (!row) return null;

    return {
      revokedAt: row.revokedAt,
      expiresAt: row.expiresAt,
      tokenHash: row.tokenHash,
      user: {
        id: row.id,
        email: row.email,
        role: AUTH_ROLES.CLIENT,
        displayName: row.displayName,
        eventId: row.eventId,
        isActive: row.isActive,
      },
    };
  }
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await pbkdf2(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
  return `pbkdf2_${PASSWORD_DIGEST}$${PASSWORD_ITERATIONS}$${salt}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationText, salt, expected] = storedHash.split("$");
  if (algorithm !== `pbkdf2_${PASSWORD_DIGEST}` || !iterationText || !salt || !expected) return false;

  const iterations = Number(iterationText);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;

  const derived = await pbkdf2(password, salt, iterations, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
  const actual = derived.toString("base64url");
  return createHash("sha256").update(actual).digest("hex") === createHash("sha256").update(expected).digest("hex");
}

export function generateProvisionalPassword() {
  return randomBytes(12).toString("base64url");
}

export function randomToken(prefix: string) {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSessionForUser(user: {
  id: string;
  email: string;
  role: string;
  eventId: string | null;
}) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role as AuthRole,
    eventId: user.eventId,
    sessionId,
  });

  await db.authSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export function attachAuthCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function authenticateRequest(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : null;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? bearerToken ?? request.headers.get("x-elegance-session");
  const payload = await verifySessionToken(token);
  if (!payload || !token) return null;

  const session = await loadAuthenticatedSession(payload.sessionId);

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    session.tokenHash !== hashToken(token) ||
    !session.user.isActive
  ) {
    return null;
  }

  return { payload, user: session.user };
}

export async function readClientOnboardingSeen(userId: string) {
  try {
    const user = await db.authUser.findUnique({
      where: { id: userId },
      select: { hasSeenOnboarding: true },
    });

    return user?.hasSeenOnboarding ?? true;
  } catch (error) {
    if (isMissingPrismaColumnError(error, "hasSeenOnboarding")) {
      console.warn("AuthUser.hasSeenOnboarding is not available yet; defaulting onboarding state to seen.");
      return true;
    }

    throw error;
  }
}

export async function requireApiRole(request: NextRequest, roles: AuthRole[]) {
  const session = await authenticateRequest(request);
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ success: false, error: "Authentification requise." }, { status: 401 }),
    };
  }

  if (!roles.includes(session.user.role as AuthRole)) {
    return {
      session: null,
      response: NextResponse.json({ success: false, error: "Acces refuse." }, { status: 403 }),
    };
  }

  return { session, response: null };
}

export function loginPathForRole(role: string) {
  return role === AUTH_ROLES.SUPER_ADMIN ? "/admin" : "/dashboard";
}
