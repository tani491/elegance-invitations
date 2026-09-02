import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";
import { InvitationExperience } from "@/components/invitation/InvitationExperience";

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  const { slug } = await params;
  const { guest } = await searchParams;
  const event = await db.event.findFirst({
    where: { slug, isActive: true },
    include: { theme: true },
  });

  if (!event) notFound();

  return <InvitationExperience event={serializePublicEvent(event)} guestToken={guest} />;
}
