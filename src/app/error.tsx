"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0B0A] px-6 py-16 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.15),transparent_34%),linear-gradient(145deg,#0D0B0A_0%,#21140f_58%,#341f16_100%)]" />
      <section className="relative z-10 mx-auto max-w-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-white/15 bg-white/10 text-[#F3D88D] shadow-2xl backdrop-blur">
          <AlertTriangle className="size-7" />
        </div>
        <p className="mt-8 font-serif text-xs font-semibold uppercase tracking-[0.34em] text-[#D4AF37]">
          Élégance Invitations
        </p>
        <h1 className="mt-5 font-serif text-4xl italic leading-tight text-white sm:text-5xl">
          Une erreur est survenue
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-white/68">
          La page n'a pas pu être chargée correctement. Vous pouvez réessayer sans perdre votre navigation.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset} className="min-h-12 rounded-full bg-[#D4AF37] px-7 text-sm font-semibold text-black hover:bg-[#F3E5AB]">
            <RotateCcw className="mr-2 size-4" />
            Réessayer
          </Button>
          <Button asChild type="button" variant="outline" className="min-h-12 rounded-full border-white/20 bg-white/10 px-7 text-sm font-semibold text-white hover:bg-white/15 hover:text-white">
            <Link href="/">Retour à l'accueil</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
