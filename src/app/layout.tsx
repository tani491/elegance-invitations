import type { Metadata } from "next";
import {
  Alex_Brush,
  Bodoni_Moda,
  Cinzel,
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat,
  Playfair_Display,
  Prata,
} from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";
import { FloatingWhatsAppButton } from "@/components/public/FloatingWhatsAppButton";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-bodoni",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const prata = Prata({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-prata",
  display: "swap",
});

const alexBrush = Alex_Brush({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-alex-brush",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Élégance Invitations — Faire-part digitaux de prestige",
  description:
    "Créez des invitations numériques d'exception pour votre mariage ou événement. Design luxueux, personnalisation totale et expérience raffinée.",
  keywords: [
    "invitations mariage",
    "invitations numériques",
    "mariage luxe",
    "faire-part",
    "événement",
    "design invitation",
    "invitation élégante",
  ],
  authors: [{ name: "Élégance Invitations" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Élégance Invitations — Invitations de Mariage sur Mesure",
    description:
      "Des invitations numériques d'exception pour les moments les plus importants de votre vie.",
    siteName: "Élégance Invitations",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Élégance Invitations — Invitations de Mariage sur Mesure",
    description:
      "Des invitations numériques d'exception pour les moments les plus importants de votre vie.",
  },
};

const fontVariables = [
  cormorant.variable,
  montserrat.variable,
  greatVibes.variable,
  cinzel.variable,
  bodoni.variable,
  playfair.variable,
  prata.variable,
  alexBrush.variable,
].join(" ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={fontVariables} suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <FloatingWhatsAppButton />
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
