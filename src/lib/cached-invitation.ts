import { revalidateTag } from "next/cache";
import type { Event } from "@prisma/client";
import { db } from "@/lib/db";
import { EVENT_SELECT_WITHOUT_PROGRAM_STEPS } from "@/lib/event-safe-select";
import { isMissingPrismaColumnError } from "@/lib/server-auth";
import { THEME_COMPAT_SELECT, type SerializableThemeInput } from "@/lib/theme-store";

export const INVITATION_CACHE_TTL_SECONDS = 300;
const GENERATED_SUFFIX_PATTERN = /^(?=.*\d)[a-z0-9]{6,12}$/i;

export type CachedInvitationEvent = Event & {
  theme?: SerializableThemeInput | null;
};

type EventFindArgs = Record<string, unknown>;
type EventWhereInput = Record<string, unknown>;

const eventReader = db.event as unknown as {
  findFirst(args: EventFindArgs): Promise<CachedInvitationEvent | null>;
};

export function invitationCacheTag(slug: string) {
  return `invitation-${slug}`;
}

function decodeSlug(slug: string) {
  const trimmed = slug.trim();
  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

function withoutGeneratedSuffix(slug: string) {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length <= 1) return null;

  const lastPart = parts[parts.length - 1];
  if (!GENERATED_SUFFIX_PATTERN.test(lastPart)) return null;

  return parts.slice(0, -1).join("-");
}

export function invitationSlugCandidates(slug: string) {
  const decodedSlug = decodeSlug(slug);
  const baseSlug = withoutGeneratedSuffix(decodedSlug);

  return Array.from(
    new Set(
      [decodedSlug, baseSlug].filter((value): value is string =>
        Boolean(value?.trim()),
      ),
    ),
  );
}

function exactWhereForSlug(slug: string): EventWhereInput {
  const decodedSlug = decodeSlug(slug);
  const slugCandidates = invitationSlugCandidates(decodedSlug);
  const exactMatches: EventWhereInput[] = [
    ...slugCandidates.map((candidate) => ({ slug: candidate })),
  ];

  if (decodedSlug) {
    exactMatches.push({ id: decodedSlug });
  }

  return {
    OR: exactMatches,
  };
}

async function findInvitationEvent(
  slug: string,
  themeLookup: "full" | "compat" | "none",
): Promise<CachedInvitationEvent | null> {
  const exactWhere = exactWhereForSlug(slug);

  if (themeLookup === "full") {
    const exactEvent = await eventReader.findFirst({
      where: exactWhere,
      include: {
        theme: true,
      },
    });
    return exactEvent as CachedInvitationEvent | null;
  }

  if (themeLookup === "compat") {
    const exactEvent = await eventReader.findFirst({
      where: exactWhere,
      include: {
        theme: { select: THEME_COMPAT_SELECT },
      },
    });
    return exactEvent as CachedInvitationEvent | null;
  }

  const exactEvent = await eventReader.findFirst({
    where: exactWhere,
  });
  return exactEvent as CachedInvitationEvent | null;
}

async function findInvitationEventWithoutProgramSteps(slug: string): Promise<CachedInvitationEvent | null> {
  const exactWhere = exactWhereForSlug(slug);
  const exactEvent = await eventReader.findFirst({
    where: exactWhere,
    select: EVENT_SELECT_WITHOUT_PROGRAM_STEPS,
  });

  return exactEvent as CachedInvitationEvent | null;
}

async function fetchInvitationEvent(slug: string): Promise<CachedInvitationEvent | null> {
  try {
    return await findInvitationEvent(slug, "full");
  } catch (error) {
    if (isMissingPrismaColumnError(error, "programSteps")) {
      console.warn("Event.programSteps is not available; loading invitation without that column.");
      return findInvitationEventWithoutProgramSteps(slug);
    }

    console.error("Invitation theme relation failed, retrying with compatible theme columns:", error);
    try {
      return await findInvitationEvent(slug, "compat");
    } catch (compatError) {
      if (isMissingPrismaColumnError(compatError, "programSteps")) {
        console.warn("Event.programSteps is not available after invitation retry; loading without that column.");
        return findInvitationEventWithoutProgramSteps(slug);
      }

      console.error("Invitation compatible theme relation failed, retrying without theme:", compatError);
      try {
        return await findInvitationEvent(slug, "none");
      } catch (retryError) {
        console.error("Invitation event fallback failed:", retryError);
        return null;
      }
    }
  }
}

export async function getCachedInvitation(slug: string): Promise<CachedInvitationEvent | null> {
  const safeSlug = decodeSlug(slug);
  if (!safeSlug) return null;

  return fetchInvitationEvent(safeSlug);
}

export function revalidateInvitation(slug?: string | null) {
  const safeSlug = slug?.trim();
  if (!safeSlug) return;

  revalidateTag(invitationCacheTag(safeSlug), "max");
}
