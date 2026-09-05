import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const alt = "Enveloppe d'invitation Élégance avec sceau doré";

export default function Image() {
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
          background: "linear-gradient(135deg, #fffaf0 0%, #efe0c7 48%, #d7b16b 100%)",
          color: "#4d141f",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            background:
              "linear-gradient(90deg, rgba(128,88,34,.18) 1px, transparent 1px), linear-gradient(0deg, rgba(128,88,34,.12) 1px, transparent 1px)",
            backgroundSize: "54px 54px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -18,
            left: -90,
            width: 1380,
            height: 365,
            background: "linear-gradient(160deg, rgba(255,253,246,.92), rgba(223,196,154,.7))",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            boxShadow: "0 30px 80px rgba(116,76,26,.24)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -20,
            left: -120,
            width: 1440,
            height: 430,
            background: "linear-gradient(20deg, rgba(230,204,162,.88), rgba(255,250,240,.72))",
            clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 248,
            height: 248,
            borderRadius: 999,
            background: "radial-gradient(circle at 34% 28%, #fff3bd 0%, #e0b24d 32%, #981a31 70%, #570716 100%)",
            boxShadow: "0 28px 70px rgba(91,13,31,.38), inset 0 0 0 3px rgba(255,244,195,.42)",
            border: "2px solid rgba(255,239,184,.65)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 172,
            height: 172,
            borderRadius: 999,
            border: "2px solid rgba(255,244,195,.52)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 112,
            height: 112,
            borderRadius: 999,
            border: "1px solid rgba(255,250,225,.5)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 312,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#7c531c",
            }}
          >
            Élégance Invitations
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 54,
              fontStyle: "italic",
              color: "#4d141f",
            }}
          >
            Votre invitation vous attend
          </div>
        </div>
      </div>
    ),
    size,
  );
}
