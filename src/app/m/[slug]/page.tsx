import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_URL } from "@/lib/constants";
import { getCachedInvitation, type CachedInvitationEvent } from "@/lib/cached-invitation";
import { serializePublicEvent } from "@/lib/public-event";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

type MobileInvitationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function metadataBaseUrl() {
  return new URL(SITE_URL);
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function shouldOpenDirectly(searchParams: Awaited<MobileInvitationPageProps["searchParams"]>) {
  const open = firstSearchParam(searchParams.open);
  return open === "1" || open === "true" || Boolean(firstSearchParam(searchParams.guest));
}

function weddingTitle(event: CachedInvitationEvent | null) {
  const bride = event?.brideName?.trim() || "La Mariée";
  const groom = event?.groomName?.trim() || "Le Marié";
  return `${bride} & ${groom} — Invitation Officielle`;
}

function weddingDescription(event: CachedInvitationEvent | null) {
  const date = event?.eventDate
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Dakar",
      }).format(event.eventDate)
    : "";

  return date
    ? `Nous vous invitons à célébrer notre mariage le ${date}. Ouvrez l'invitation cinématique.`
    : "Nous avons l'honneur de vous convier à célébrer notre union. Ouvrez l'invitation cinématique.";
}

async function getInvitationSafely(slug: string, context: string) {
  try {
    return await getCachedInvitation(slug);
  } catch (error) {
    console.error(`Mobile invitation fetch failed in ${context}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Pick<MobileInvitationPageProps, "params">): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "metadata");
  const baseUrl = metadataBaseUrl();
  const canonicalSlug = encodeURIComponent(event?.slug ?? slug);
  const invitationUrl = new URL(`/m/${canonicalSlug}`, baseUrl).toString();
  const shareImageUrl = new URL(`/invitation/${canonicalSlug}/opengraph-image`, baseUrl).toString();
  const title = weddingTitle(event);
  const description = weddingDescription(event);

  return {
    metadataBase: baseUrl,
    title,
    description,
    alternates: {
      canonical: invitationUrl,
    },
    openGraph: {
      title,
      description,
      url: invitationUrl,
      siteName: "Élégance Invitations",
      type: "website",
      images: [
        {
          url: shareImageUrl,
          width: 1200,
          height: 630,
          alt: `Enveloppe d'invitation de mariage - ${title}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImageUrl],
    },
  };
}

export default async function MobileInvitationPage({ params, searchParams }: MobileInvitationPageProps) {
  const { slug: rawSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const guest = firstSearchParam(resolvedSearchParams.guest);
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "page");

  if (!event) {
    notFound();
  }

  try {
    return <InvitationExperience event={serializePublicEvent(event)} guestToken={guest} autoOpen={shouldOpenDirectly(resolvedSearchParams)} />;
  } catch (error) {
    console.error("Mobile invitation serialization failed:", error);
    notFound();
  }
}
