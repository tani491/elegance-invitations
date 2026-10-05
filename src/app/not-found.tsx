import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0D0B0A] px-6 py-16 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.16),transparent_34%),linear-gradient(145deg,#0D0B0A_0%,#1c130f_58%,#2b1d14_100%)]" />
      <section className="relative z-10 mx-auto max-w-2xl">
        <div className="mx-auto grid size-16 place-items-center rounded-full border border-white/15 bg-white/10 text-[#F3D88D] shadow-2xl backdrop-blur">
          <SearchX className="size-7" />
        </div>
        <p className="mt-8 font-serif text-xs font-semibold uppercase tracking-[0.34em] text-[#D4AF37]">
          Élégance Invitations
        </p>
        <h1 className="mt-5 font-serif text-4xl italic leading-tight text-white sm:text-5xl">
          Oups, cette invitation n'existe pas ou a été déplacée
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-white/68">
          Vérifiez le lien reçu ou revenez à l'accueil pour retrouver l'expérience Élégance Invitations.
        </p>
        <Link
          href="/"
          className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-[#D4AF37] px-7 text-sm font-semibold text-black shadow-[0_18px_40px_rgba(212,175,55,.24)] transition hover:bg-[#F3E5AB]"
        >
          Retour à l'accueil
        </Link>
      </section>
    </main>
  );
}
