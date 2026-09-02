import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getThemeOrDefault } from "@/lib/theme-store";
import {
  generateProvisionalPassword,
  hashPassword,
  normalizeEmail,
  randomToken,
} from "@/lib/server-auth";
import { uniqueSlug } from "@/lib/slug";
import { DEFAULT_DRESS_CODE_COLORS, DEFAULT_PROGRAM, getDefaultTheme } from "@/lib/theme-presets";
import { AUTH_ROLES } from "@/types/database.types";
import { requireApiRole } from "@/lib/server-auth";

const createClientSchema = z.object({
  coupleName: z.string().min(3),
  email: z.string().email(),
  whatsapp: z.string().min(6).optional().default(""),
  password: z.string().min(8).optional(),
  planType: z.enum(["essentielle", "prestige", "privilege"]),
  template: z.string().min(2).default("medina-orientale"),
});

function splitCoupleName(coupleName: string) {
  const parts = coupleName.split(/\s+(?:&|et)\s+/i).map((part) => part.trim()).filter(Boolean);
  return {
    brideName: parts[0] ?? coupleName.trim(),
    groomName: parts[1] ?? null,
  };
}

function planLabel(plan: string) {
  const labels: Record<string, string> = {
    essentielle: "Essentielle",
    prestige: "Prestige",
    privilege: "Privilege",
  };
  return labels[plan] ?? plan;
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const users = await db.authUser.findMany({
    where: { role: AUTH_ROLES.CLIENT },
    include: { event: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      isActive: user.isActive,
      temporaryPassword: user.temporaryPassword,
      event: user.event,
      createdAt: user.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const parsed = createClientSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Formulaire invalide." }, { status: 400 });
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await db.authUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ success: false, error: "Un compte existe deja pour cet email." }, { status: 409 });
  }

  const theme = await getThemeOrDefault(parsed.data.template);
  const fallbackTheme = getDefaultTheme(parsed.data.template);
  const selectedTheme = theme ?? fallbackTheme;
  const password = parsed.data.password ?? generateProvisionalPassword();
  const passwordHash = await hashPassword(password);
  const { brideName, groomName } = splitCoupleName(parsed.data.coupleName);
  const eventSlug = uniqueSlug(parsed.data.coupleName);
  const photographerToken = randomToken("photographer");

  const event = await db.event.create({
    data: {
      slug: eventSlug,
      name: `Mariage ${parsed.data.coupleName}`,
      organizerName: parsed.data.coupleName,
      organizerPhone: parsed.data.whatsapp,
      clientEmail: email,
      template: selectedTheme.slug,
      themeId: "id" in selectedTheme ? selectedTheme.id : undefined,
      primaryColor: selectedTheme.primaryColor,
      secondaryColor: selectedTheme.secondaryColor,
      accentColor: selectedTheme.accentColor,
      goldColor: selectedTheme.goldColor,
      titleFont: selectedTheme.titleFont,
      animationType: selectedTheme.animationType,
      brideName,
      groomName,
      planType: parsed.data.planType,
      photographerToken,
      isActive: true,
      isPaid: true,
      dressCodeColors: DEFAULT_DRESS_CODE_COLORS as unknown as Prisma.InputJsonValue,
      program: DEFAULT_PROGRAM as unknown as Prisma.InputJsonValue,
    },
  });

  const user = await db.authUser.create({
    data: {
      email,
      passwordHash,
      role: AUTH_ROLES.CLIENT,
      displayName: parsed.data.coupleName,
      eventId: event.id,
      temporaryPassword: true,
      isActive: true,
    },
  });

  const origin = request.nextUrl.origin;
  const loginUrl = `${origin}/login`;
  const invitationUrl = `${origin}/invitation/${event.slug}`;
  const whatsAppMessage = [
    `Bonjour ${parsed.data.coupleName}, voici vos acces pour personnaliser votre invitation de mariage :`,
    `Lien : ${loginUrl}`,
    `Email : ${email}`,
    `Mot de passe temporaire : ${password}`,
    `Formule : ${planLabel(parsed.data.planType)}`,
    `Invitation : ${invitationUrl}`,
  ].join("\n");

  return NextResponse.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      event,
      provisionalPassword: password,
      loginUrl,
      invitationUrl,
      whatsAppMessage,
    },
  }, { status: 201 });
}
