import { revalidateTag } from "next/cache";
import type { Event } from "@prisma/client";
import { db } from "@/lib/db";
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
  const parts = decodedSlug.split("-").filter(Boolean);
  const baseSlug = withoutGeneratedSuffix(decodedSlug);
  const firstThreeParts = parts.length >= 3 ? parts.slice(0, 3).join("-") : null;

  return Array.from(
    new Set(
      [decodedSlug, baseSlug, firstThreeParts].filter((value): value is string =>
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

function prefixWhereForSlug(slug: string): EventWhereInput | null {
  const slugCandidates = invitationSlugCandidates(slug).filter((candidate) => candidate.length >= 3);
  if (!slugCandidates.length) return null;

  return {
    OR: slugCandidates.map((candidate) => ({ slug: { startsWith: candidate } })),
  };
}

async function findInvitationEvent(
  slug: string,
  themeLookup: "full" | "compat" | "none",
): Promise<CachedInvitationEvent | null> {
  const exactWhere = exactWhereForSlug(slug);
  const prefixWhere = prefixWhereForSlug(slug);

  if (themeLookup === "full") {
    const exactEvent = await eventReader.findFirst({
      where: exactWhere,
      include: {
        theme: true,
      },
    });
    if (exactEvent) return exactEvent as CachedInvitationEvent;

    const prefixedEvent = prefixWhere
      ? await eventReader.findFirst({
          where: prefixWhere,
          include: {
            theme: true,
          },
        })
      : null;
    if (prefixedEvent) return prefixedEvent as CachedInvitationEvent;

    const latestEvent = await eventReader.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        theme: true,
      },
    });
    return latestEvent as CachedInvitationEvent | null;
  }

  if (themeLookup === "compat") {
    const exactEvent = await eventReader.findFirst({
      where: exactWhere,
      include: {
        theme: { select: THEME_COMPAT_SELECT },
      },
    });
    if (exactEvent) return exactEvent as CachedInvitationEvent;

    const prefixedEvent = prefixWhere
      ? await eventReader.findFirst({
          where: prefixWhere,
          include: {
            theme: { select: THEME_COMPAT_SELECT },
          },
        })
      : null;
    if (prefixedEvent) return prefixedEvent as CachedInvitationEvent;

    const latestEvent = await eventReader.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        theme: { select: THEME_COMPAT_SELECT },
      },
    });
    return latestEvent as CachedInvitationEvent | null;
  }

  const exactEvent = await eventReader.findFirst({
    where: exactWhere,
  });
  if (exactEvent) return exactEvent as CachedInvitationEvent;

  const prefixedEvent = prefixWhere
    ? await eventReader.findFirst({
        where: prefixWhere,
      })
    : null;
  if (prefixedEvent) return prefixedEvent as CachedInvitationEvent;

  const latestEvent = await eventReader.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return latestEvent as CachedInvitationEvent | null;
}

async function fetchInvitationEvent(slug: string): Promise<CachedInvitationEvent | null> {
  try {
    return await findInvitationEvent(slug, "full");
  } catch (error) {
    console.error("Invitation theme relation failed, retrying with compatible theme columns:", error);
    try {
      return await findInvitationEvent(slug, "compat");
    } catch (compatError) {
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
