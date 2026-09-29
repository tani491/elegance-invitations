import Link from "next/link";

export function InvitationNotFoundScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0D0B0A] px-6 py-12 text-center text-white">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Élégance Invitations</p>
      <h1 className="mt-4 font-serif text-4xl italic text-white">Invitation introuvable</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
        Le lien d&apos;invitation est invalide, expiré ou l&apos;événement n&apos;est plus disponible.
      </p>
      <Link href="/" className="mt-8 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#F3E5AB]">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}

export function GuestPassNotFoundScreen() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#19110d] px-6 py-12 text-center text-white">
      <p className="font-serif text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Pass invité</p>
      <h1 className="mt-4 font-serif text-4xl italic text-white">Pass introuvable</h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-white/68">
        Ce QR Code ou jeton invité est invalide, expiré ou ne correspond plus à un événement actif.
      </p>
      <Link href="/" className="mt-8 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#F3E5AB]">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
