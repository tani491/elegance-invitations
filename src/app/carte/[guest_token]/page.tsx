import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, Crown, Download, MapPin, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { serializePublicEvent } from "@/lib/public-event";
import { themeToCssVars } from "@/lib/theme-presets";

function absoluteOrigin(headerList: Headers) {
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? "https://votredomaine.com";
}

export default async function GuestPassPage({ params }: { params: Promise<{ guest_token: string }> }) {
  const { guest_token } = await params;
  const guest = await db.eventGuest.findUnique({
    where: { qrToken: guest_token },
    include: { event: { include: { theme: true } } },
  });

  if (!guest || !guest.event.isActive) notFound();

  const event = serializePublicEvent(guest.event);
  const origin = absoluteOrigin(await headers());
  const invitationUrl = `${origin}/invitation/${event.slug}?guest=${encodeURIComponent(guest.qrToken)}`;
  const dateLabel = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : "Date a confirmer";
  const programPreview = event.program.slice(0, 3);

  return (
    <main
      className="min-h-screen bg-[#F7F0E4] px-4 py-8 text-[#211A17]"
      style={{
        ...themeToCssVars(event.theme),
        background:
          "radial-gradient(circle at top, rgba(255,255,255,.85), transparent 34rem), linear-gradient(135deg, var(--invitation-secondary), #F6E8D2)",
      }}
    >
      <section className="mx-auto flex max-w-md flex-col items-center">
        <div className="mb-5 text-center">
          <p className="font-script text-4xl text-[var(--invitation-gold)]">{event.brideName} & {event.groomName}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--invitation-primary)]">Pass invite prive</p>
        </div>

        <article className="relative w-full overflow-hidden rounded-lg border border-[var(--invitation-gold)]/45 bg-white/78 p-6 text-center shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(45deg,rgba(212,175,55,.12)_25%,transparent_25%,transparent_50%,rgba(212,175,55,.12)_50%,rgba(212,175,55,.12)_75%,transparent_75%,transparent)] [background-size:18px_18px]" />
          <div className="relative">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-[var(--invitation-gold)]/50 bg-[var(--invitation-secondary)] text-[var(--invitation-gold)]">
              {guest.isVip ? <Crown className="size-7" /> : <Sparkles className="size-7" />}
            </div>

            {event.coverPhotoUrl && (
              <div className="mx-auto mb-5 aspect-[9/12] w-36 overflow-hidden rounded-lg border border-[var(--invitation-gold)]/40 bg-[var(--invitation-secondary)] shadow-lg">
                <img src={event.coverPhotoUrl} alt="Couple" className="size-full object-cover" />
              </div>
            )}

            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Invite</p>
            <h1 className="mt-2 font-display-bold text-3xl leading-tight text-[var(--invitation-primary)]">{guest.fullName}</h1>
            {guest.isVip && <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--invitation-gold)]">VIP</p>}

            <div className="mx-auto my-6 w-fit rounded-lg border border-[var(--invitation-gold)]/30 bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={invitationUrl}
                size={174}
                level="H"
                bgColor="#FFFFFF"
                fgColor={event.theme.primaryColor}
              />
            </div>

            <div className="grid gap-3 text-left text-sm">
              <div className="flex items-center gap-3 rounded-lg bg-[var(--invitation-secondary)]/70 p-3">
                <CalendarDays className="size-4 text-[var(--invitation-gold)]" />
                <span>{dateLabel}{event.eventTime ? ` a ${event.eventTime}` : ""}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-[var(--invitation-secondary)]/70 p-3">
                <MapPin className="size-4 text-[var(--invitation-gold)]" />
                <span>{event.venueName ?? "Lieu a confirmer"}</span>
              </div>
              {event.dressCode && (
                <div className="rounded-lg bg-[var(--invitation-secondary)]/70 p-3">
                  <span className="font-semibold text-[var(--invitation-primary)]">Dress code: </span>
                  <span>{event.dressCode}</span>
                </div>
              )}
              {programPreview.length > 0 && (
                <div className="rounded-lg bg-[var(--invitation-secondary)]/70 p-3">
                  <p className="mb-2 font-semibold text-[var(--invitation-primary)]">Programme</p>
                  <div className="space-y-1 text-muted-foreground">
                    {programPreview.map((step) => (
                      <p key={step.id}>{step.time} - {step.title}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-5 text-xs leading-5 text-muted-foreground">
              Le QR code ouvre l'invitation interactive complete et rattache votre reponse RSVP a ce pass.
            </p>
          </div>
        </article>

        <a
          href={invitationUrl}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--invitation-primary)] px-5 text-sm font-medium text-white shadow-lg"
        >
          <Download className="mr-2 size-4" />
          Ouvrir l'invitation
        </a>
      </section>
    </main>
  );
}
