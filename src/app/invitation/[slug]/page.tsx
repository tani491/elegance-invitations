import type { Metadata } from "next";
import { getCachedInvitation, type CachedInvitationEvent } from "@/lib/cached-invitation";
import { serializePublicEvent } from "@/lib/public-event";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

type InvitationPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function InvitationFallbackScreen({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B0A] p-6 text-center text-white">
      <h1 className="mb-4 font-serif text-2xl text-[#D4AF37]">Élégance Invitations</h1>
      <p className="mb-2 text-stone-400">Impossible de trouver l'événement demandé.</p>
      <code className="mb-6 rounded bg-black/50 p-2 text-xs text-stone-500">Slug recherché : {slug}</code>
      <a href="/" className="rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-semibold text-black">
        Retour à l'accueil
      </a>
    </div>
  );
}

export async function generateMetadata({ params }: Pick<InvitationPageProps, "params">): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "metadata");
  const title = weddingTitle(event);
  const description = "Vous êtes cordialement invité(e) à célébrer notre union.";
  const imageUrl = `/invitation/${encodeURIComponent(event?.slug ?? slug)}/opengraph-image`;

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
  const resolvedSearchParams = await searchParams;
  const guest = firstSearchParam(resolvedSearchParams.guest);
  const slug = decodeSlug(rawSlug);
  const event = await getInvitationSafely(slug, "page");

  if (!event) {
    console.error("Mariage introuvable pour le slug:", slug);
    return <InvitationFallbackScreen slug={slug} />;
  }

  try {
    return <InvitationExperience event={serializePublicEvent(event)} guestToken={guest} />;
  } catch (error) {
    console.error("Invitation serialization failed:", error);
    return <InvitationFallbackScreen slug={slug} />;
  }
}
