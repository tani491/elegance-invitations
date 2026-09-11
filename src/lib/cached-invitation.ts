import { revalidateTag, unstable_cache } from "next/cache";
import type { Event } from "@prisma/client";
import { db } from "@/lib/db";
import { THEME_COMPAT_SELECT, type SerializableThemeInput } from "@/lib/theme-store";

export const INVITATION_CACHE_TTL_SECONDS = 300;

export type CachedInvitationEvent = Event & {
  theme?: SerializableThemeInput | null;
};

export function invitationCacheTag(slug: string) {
  return `invitation-${slug}`;
}

async function fetchInvitationEvent(slug: string): Promise<CachedInvitationEvent | null> {
  try {
    const event = await db.event.findFirst({
      where: { slug, isActive: true },
      include: {
        theme: true,
      },
    });
    return event as CachedInvitationEvent | null;
  } catch (error) {
    console.error("Invitation theme relation failed, retrying with compatible theme columns:", error);
    try {
      const event = await db.event.findFirst({
        where: { slug, isActive: true },
        include: {
          theme: { select: THEME_COMPAT_SELECT },
        },
      });
      return event as CachedInvitationEvent | null;
    } catch (compatError) {
      console.error("Invitation compatible theme relation failed, retrying without theme:", compatError);
      try {
        const event = await db.event.findFirst({
          where: { slug, isActive: true },
        });
        return event as CachedInvitationEvent | null;
      } catch (retryError) {
        console.error("Invitation event fallback failed:", retryError);
        return null;
      }
    }
  }
}

export function getCachedInvitation(slug: string): Promise<CachedInvitationEvent | null> {
  const safeSlug = slug.trim();

  return unstable_cache(
    async (): Promise<CachedInvitationEvent | null> => fetchInvitationEvent(safeSlug),
    ["invitation", safeSlug],
    {
      revalidate: INVITATION_CACHE_TTL_SECONDS,
      tags: [invitationCacheTag(safeSlug)],
    },
  )();
}

export function revalidateInvitation(slug?: string | null) {
  const safeSlug = slug?.trim();
  if (!safeSlug) return;

  revalidateTag(invitationCacheTag(safeSlug), "max");
}
