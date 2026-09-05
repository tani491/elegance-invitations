import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Élégance — Invitations de Mariage et Événements sur Mesure",
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
  authors: [{ name: "Élégance" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Élégance — Invitations de Mariage sur Mesure",
    description:
      "Des invitations numériques d'exception pour les moments les plus importants de votre vie.",
    siteName: "Élégance",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Élégance — Invitations de Mariage sur Mesure",
    description:
      "Des invitations numériques d'exception pour les moments les plus importants de votre vie.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
        style={{
          "--font-cormorant": "Georgia, 'Times New Roman', serif",
          "--font-jakarta": "Arial, Helvetica, sans-serif",
          "--font-great-vibes": "'Segoe Script', 'Snell Roundhand', 'Brush Script MT', Georgia, serif",
        } as CSSProperties}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
