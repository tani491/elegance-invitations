import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";
import { THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

type InvitationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
};

const getInvitationEvent = cache(async (slug: string) => {
  try {
    return await db.event.findFirst({
      where: { slug, isActive: true },
      include: {
        theme: true,
        photos: { orderBy: { uploadedAt: "desc" } },
      },
    });
  } catch (error) {
    console.error("Invitation theme relation failed, retrying with compatible theme columns:", error);
    try {
      return await db.event.findFirst({
        where: { slug, isActive: true },
        include: {
          theme: { select: THEME_COMPAT_SELECT },
          photos: { orderBy: { uploadedAt: "desc" } },
        },
      });
    } catch (compatError) {
      console.error("Invitation compatible theme relation failed, retrying without theme:", compatError);
      try {
        return await db.event.findFirst({
          where: { slug, isActive: true },
          include: {
            photos: { orderBy: { uploadedAt: "desc" } },
          },
        });
      } catch (retryError) {
        console.error("Invitation event fallback failed:", retryError);
        return null;
      }
    }
  }
});

function metadataBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://elegance-invitations.sn");

  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return new URL("https://elegance-invitations.sn");
  }
}

function weddingTitle(event: Awaited<ReturnType<typeof getInvitationEvent>>) {
  const bride = event?.brideName ?? "la Mariée";
  const groom = event?.groomName ?? "le Marié";
  return `Mariage de ${bride} & ${groom}`;
}

export async function generateMetadata({ params }: Pick<InvitationPageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getInvitationEvent(slug);
  const title = weddingTitle(event);
  const description = "Vous êtes cordialement invité(e) à célébrer notre union.";
  const imageUrl = `/invitation/${event?.slug ?? slug}/opengraph-image`;

  return {
    metadataBase: metadataBaseUrl(),
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function InvitationPage({
  params,
  searchParams,
}: InvitationPageProps) {
  const { slug } = await params;
  const { guest } = await searchParams;
  const event = await getInvitationEvent(slug);

  if (!event) notFound();

  return <InvitationExperience event={serializePublicEvent(event)} guestToken={guest} />;
}
