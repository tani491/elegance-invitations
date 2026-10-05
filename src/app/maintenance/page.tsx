import type { Metadata } from "next";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Maintenance — Élégance Invitations",
  description: "La plateforme Élégance Invitations est momentanément en maintenance.",
};

export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070605] px-6 py-16 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_34%),linear-gradient(135deg,#070605_0%,#19110d_58%,#2d1f16_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent" />
      <section className="relative z-10 mx-auto max-w-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-[#D4AF37]/35 bg-white/10 shadow-2xl backdrop-blur">
          <Wrench className="size-7 text-[#F3D88D]" />
        </div>
        <p className="mt-8 font-serif text-xs font-semibold uppercase tracking-[0.34em] text-[#D4AF37]">
          Élégance Invitations
        </p>
        <h1 className="mt-5 font-serif text-4xl italic leading-tight text-white sm:text-5xl">
          Maintenance en cours
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/72">
          Notre plateforme est actuellement en maintenance pour amélioration. Nous revenons très vite.
        </p>
      </section>
    </main>
  );
}
