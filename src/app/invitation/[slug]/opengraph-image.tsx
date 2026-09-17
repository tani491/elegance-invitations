import { ImageResponse } from "next/og";
import { getCachedInvitation, type CachedInvitationEvent } from "@/lib/cached-invitation";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Enveloppe d'invitation de mariage scellée";

type OpenGraphImageProps = {
  params: Promise<{ slug: string }>;
};

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function firstName(value?: string | null, fallback = "") {
  return value?.trim().split(/\s+/)[0] || fallback;
}

function coupleNames(event: CachedInvitationEvent | null) {
  const bride = firstName(event?.brideName, "La Mariée");
  const groom = firstName(event?.groomName, "Le Marié");
  return `${bride} & ${groom}`;
}

function monogram(event: CachedInvitationEvent | null) {
  const bride = firstName(event?.brideName, "E").charAt(0);
  const groom = firstName(event?.groomName, "I").charAt(0);
  return `${bride} & ${groom}`.toUpperCase();
}

function formatEventDate(date?: Date | null) {
  if (!date) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(date);
}

function stringField(source: unknown, key: string) {
  if (!source || typeof source !== "object") return null;
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function customEnvelopeUrl(event: CachedInvitationEvent | null) {
  return (
    stringField(event?.theme, "envelopeCoverUrl") ??
    stringField(event?.theme, "envelopeImageUrl") ??
    stringField(event, "envelopeImageUrl") ??
    stringField(event, "envelopeCoverUrl")
  );
}

function palette(event: CachedInvitationEvent | null) {
  const theme = event?.theme;
  return {
    ebony: theme?.primaryColor ?? event?.primaryColor ?? "#0D0B0A",
    paper: theme?.secondaryColor ?? event?.secondaryColor ?? "#FAF7F2",
    gold: theme?.goldColor ?? event?.goldColor ?? "#D4AF37",
    deepGold: "#9E7D3B",
    wax: "#8F1F32",
  };
}

export default async function Image({ params }: OpenGraphImageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeSlug(rawSlug);
  const event = await getCachedInvitation(slug);
  const envelopeUrl = customEnvelopeUrl(event);
  const colors = palette(event);
  const names = coupleNames(event);
  const date = formatEventDate(event?.eventDate);

  if (envelopeUrl) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: colors.ebony,
          }}
        >
          <img
            src={envelopeUrl}
            alt={names}
            width={1200}
            height={630}
            style={{
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: `radial-gradient(circle at 20% 12%, ${colors.gold}55 0%, transparent 30%), linear-gradient(135deg, ${colors.ebony} 0%, #140F0C 54%, #050403 100%)`,
          color: colors.paper,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.32,
            background:
              "linear-gradient(90deg, rgba(212,175,55,.14) 1px, transparent 1px), linear-gradient(0deg, rgba(212,175,55,.10) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 34,
            border: "1px solid rgba(212,175,55,.34)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            top: 68,
            left: 162,
            width: 876,
            height: 430,
            borderRadius: 18,
            background: `linear-gradient(145deg, ${colors.paper} 0%, #EFE2CD 58%, #CFAE72 100%)`,
            boxShadow: "0 46px 120px rgba(0,0,0,.42)",
            transform: "rotate(-1.3deg)",
            overflow: "hidden",
            border: "1px solid rgba(255,241,196,.82)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.5,
              background:
                "linear-gradient(90deg, rgba(88,63,24,.12) 1px, transparent 1px), linear-gradient(0deg, rgba(88,63,24,.09) 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -2,
              left: -10,
              width: 896,
              height: 250,
              background: "linear-gradient(180deg, rgba(255,252,244,.96), rgba(224,198,151,.82))",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              boxShadow: "0 28px 64px rgba(96,60,19,.22)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: -10,
              width: 896,
              height: 255,
              background: "linear-gradient(0deg, rgba(220,193,147,.95), rgba(255,249,239,.70))",
              clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: 438,
              height: 256,
              background: "linear-gradient(35deg, rgba(239,222,189,.94), rgba(255,251,244,.54))",
              clipPath: "polygon(0 0, 100% 100%, 0 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 438,
              height: 256,
              background: "linear-gradient(325deg, rgba(239,222,189,.94), rgba(255,251,244,.54))",
              clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 336,
              top: 164,
              display: "flex",
              width: 204,
              height: 204,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              background: `radial-gradient(circle at 34% 28%, #fff4be 0%, ${colors.gold} 24%, ${colors.deepGold} 54%, ${colors.wax} 100%)`,
              boxShadow: "0 30px 72px rgba(86,28,12,.35), inset 0 0 0 4px rgba(255,239,184,.36)",
              border: "2px solid rgba(255,238,180,.72)",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 154,
                height: 154,
                borderRadius: 999,
                border: "2px solid rgba(255,244,201,.52)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: 108,
                height: 108,
                borderRadius: 999,
                border: "1px solid rgba(255,250,226,.48)",
              }}
            />
            <div
              style={{
                fontSize: 39,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#fff7d4",
                textShadow: "0 2px 8px rgba(0,0,0,.24)",
              }}
            >
              {monogram(event)}
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 126,
            right: 126,
            bottom: 52,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: colors.gold,
              fontSize: 22,
              letterSpacing: "0.34em",
              textTransform: "uppercase",
            }}
          >
            Invitation officielle
          </div>
          <div
            style={{
              marginTop: 14,
              color: "#FFF6DD",
              fontSize: 68,
              fontStyle: "italic",
              lineHeight: 1,
              textShadow: "0 10px 38px rgba(0,0,0,.36)",
            }}
          >
            {names}
          </div>
          <div
            style={{
              marginTop: 14,
              color: "#D8D2C7",
              fontSize: 24,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {date}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
