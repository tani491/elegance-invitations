import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function GuestPassPage({ params }: { params: Promise<{ guest_token: string }> }) {
  const { guest_token } = await params;
  const guest = await db.eventGuest.findUnique({
    where: { qrToken: guest_token },
    select: {
      qrToken: true,
      event: {
        select: {
          slug: true,
          isActive: true,
        },
      },
    },
  });

  if (!guest || !guest.event.isActive) notFound();

  redirect(`/invitation/${guest.event.slug}?guest=${encodeURIComponent(guest.qrToken)}`);
}
