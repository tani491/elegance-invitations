import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedInvitation, type CachedInvitationEvent } from "@/lib/cached-invitation";
import { serializePublicEvent } from "@/lib/public-event";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

type InvitationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
};

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

function weddingTitle(event: CachedInvitationEvent | null) {
  const bride = event?.brideName ?? "la Mariée";
  const groom = event?.groomName ?? "le Marié";
  return `Mariage de ${bride} & ${groom}`;
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

async function getInvitationSafely(slug: string, context: string) {
  try {
    return await getCachedInvitation(slug);
  } catch (error) {
    console.error(`Invitation fetch failed in ${context}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Pick<InvitationPageProps, "params">): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "metadata");
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
  const { slug: rawSlug } = await params;
  const { guest } = await searchParams;
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "page");

  if (!event) {
    console.error("Mariage introuvable pour le slug:", slug);
    notFound();
  }

  try {
    return <InvitationExperience event={serializePublicEvent(event)} guestToken={guest} />;
  } catch (error) {
    console.error("Invitation serialization failed:", error);
    notFound();
  }
}
