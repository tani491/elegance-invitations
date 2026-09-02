import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

type ScannerRole = typeof AUTH_ROLES.CLIENT | typeof AUTH_ROLES.SUPER_ADMIN;

function extractGuestToken(rawValue: unknown) {
  if (typeof rawValue !== "string") return "";
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const [scope, token] = url.pathname.split("/").filter(Boolean);
    if (scope === "carte" && token) return decodeURIComponent(token);
  } catch {
    const match = value.match(/\/carte\/([^/?#]+)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
  }

  return value;
}

function formatScanTime(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Dakar",
  }).format(date);
}

async function resolveEventId(role: ScannerRole, userEventId: string | null, requestedEventId: string | null) {
  if (role === AUTH_ROLES.CLIENT) return userEventId;
  if (requestedEventId) return requestedEventId;

  const event = await db.event.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  return event?.id ?? null;
}

async function getScannerSnapshot(eventId: string) {
  const [event, guests] = await Promise.all([
    db.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, slug: true, isActive: true },
    }),
    db.eventGuest.findMany({
      where: { eventId },
      orderBy: [{ isCheckedIn: "asc" }, { fullName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        phone: true,
        qrToken: true,
        table: true,
        maxGuests: true,
        plusOnes: true,
        rsvpStatus: true,
        dietaryNotes: true,
        isVip: true,
        isCheckedIn: true,
        checkedInAt: true,
        checkedInBy: true,
      },
    }),
  ]);

  const expectedPeople = guests.reduce((total, guest) => total + Math.max(guest.maxGuests, 1), 0);
  const checkedInPeople = guests.reduce(
    (total, guest) => total + (guest.isCheckedIn ? Math.max(guest.maxGuests, 1) : 0),
    0,
  );
  const checkedPasses = guests.filter((guest) => guest.isCheckedIn).length;

  return {
    event,
    guests,
    stats: {
      expectedPeople,
      checkedInPeople,
      totalPasses: guests.length,
      checkedPasses,
      attendanceRate: expectedPeople > 0 ? Math.round((checkedInPeople / expectedPeople) * 100) : 0,
    },
  };
}

function serializeGuest(guest: Awaited<ReturnType<typeof getScannerSnapshot>>["guests"][number]) {
  return {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    fullName: guest.fullName,
    phone: guest.phone,
    qrToken: guest.qrToken,
    table: guest.table,
    maxGuests: guest.maxGuests,
    plusOnes: guest.plusOnes,
    rsvpStatus: guest.rsvpStatus,
    dietaryNotes: guest.dietaryNotes,
    isVip: guest.isVip,
    isCheckedIn: guest.isCheckedIn,
    checkedInAt: guest.checkedInAt?.toISOString() ?? null,
    checkedInBy: guest.checkedInBy,
  };
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT, AUTH_ROLES.SUPER_ADMIN]);
  if (response) return response;

  const role = session.user.role as ScannerRole;
  const eventId = await resolveEventId(role, session.user.eventId, request.nextUrl.searchParams.get("eventId"));
  if (!eventId) {
    return NextResponse.json({ success: false, error: "Aucun evenement scanner disponible." }, { status: 404 });
  }

  const snapshot = await getScannerSnapshot(eventId);
  if (!snapshot.event || !snapshot.event.isActive) {
    return NextResponse.json({ success: false, error: "Evenement introuvable ou suspendu." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...snapshot,
      guests: snapshot.guests.map(serializeGuest),
    },
  });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT, AUTH_ROLES.SUPER_ADMIN]);
  if (response) return response;

  const body = await request.json().catch(() => ({}));
  const guestToken = extractGuestToken(body.token);
  if (!guestToken) {
    return NextResponse.json({ success: false, result: "invalid", message: "Invitation non reconnue ou annulee." }, { status: 400 });
  }

  const role = session.user.role as ScannerRole;
  const eventId = await resolveEventId(role, session.user.eventId, typeof body.eventId === "string" ? body.eventId : null);
  if (!eventId) {
    return NextResponse.json({ success: false, result: "invalid", message: "Evenement scanner introuvable." }, { status: 404 });
  }

  const staffLabel =
    typeof body.staffLabel === "string" && body.staffLabel.trim()
      ? body.staffLabel.trim().slice(0, 80)
      : session.user.displayName || "Staff";

  const result = await db.$transaction(async (tx) => {
    const guest = await tx.eventGuest.findFirst({
      where: { eventId, qrToken: guestToken, event: { isActive: true } },
    });

    if (!guest) return { result: "invalid" as const, guest: null };

    if (guest.isCheckedIn) {
      return { result: "already" as const, guest };
    }

    const checkedInAt = new Date();
    const update = await tx.eventGuest.updateMany({
      where: { id: guest.id, isCheckedIn: false },
      data: { isCheckedIn: true, checkedInAt, checkedInBy: staffLabel },
    });

    const freshGuest = await tx.eventGuest.findUnique({ where: { id: guest.id } });
    if (update.count === 0 || !freshGuest) return { result: "already" as const, guest: freshGuest ?? guest };

    return { result: "success" as const, guest: freshGuest };
  });

  const snapshot = await getScannerSnapshot(eventId);

  if (result.result === "invalid" || !result.guest) {
    return NextResponse.json({
      success: false,
      result: "invalid",
      message: "Invitation non reconnue ou annulee.",
      data: { ...snapshot, guests: snapshot.guests.map(serializeGuest) },
    });
  }

  const guest = serializeGuest(result.guest);
  const alreadyTime = formatScanTime(result.guest.checkedInAt);
  const alreadyBy = result.guest.checkedInBy || "un membre du staff";

  return NextResponse.json({
    success: result.result === "success",
    result: result.result,
    message:
      result.result === "success"
        ? `Bienvenue ${result.guest.fullName}. Entree validee.`
        : `Attention : Ce Pass a deja ete valide${alreadyTime ? ` a ${alreadyTime}` : ""} par ${alreadyBy}.`,
    guest,
    data: { ...snapshot, guests: snapshot.guests.map(serializeGuest) },
  });
}
