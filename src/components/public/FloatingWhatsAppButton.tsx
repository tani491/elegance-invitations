"use client";

import { usePathname } from "next/navigation";
import { ELEGANCE_ASSISTANCE_WHATSAPP_URL, ELEGANCE_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

const HIDDEN_PREFIXES = ["/admin", "/dashboard", "/login", "/photographer", "/scanner"];

export function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const isHidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isHidden) return null;

  return (
    <a
      href={ELEGANCE_ASSISTANCE_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Assistance WhatsApp Elegance Invitations ${ELEGANCE_WHATSAPP_DISPLAY}`}
      className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] p-3.5 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-[#20bd5a] hover:shadow-[0_22px_55px_rgba(0,0,0,.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="size-8"
        fill="currentColor"
      >
        <path d="M16.02 3C8.86 3 3.04 8.8 3.04 15.94c0 2.28.6 4.52 1.74 6.48L3 29l6.75-1.77a12.95 12.95 0 0 0 6.27 1.6h.01C23.19 28.83 29 23.03 29 15.9 29 8.79 23.18 3 16.02 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.4-.24-4.01 1.05 1.07-3.9-.26-.4a10.7 10.7 0 0 1-1.64-5.73c0-5.94 4.85-10.77 10.82-10.77 2.89 0 5.6 1.12 7.64 3.16a10.68 10.68 0 0 1 3.17 7.58c0 5.93-4.86 10.75-10.82 10.75Zm5.93-8.05c-.32-.16-1.92-.95-2.22-1.06-.3-.1-.52-.16-.74.16-.21.32-.84 1.06-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.5-2.62-1.62a9.81 9.81 0 0 1-1.81-2.25c-.2-.32-.02-.5.14-.66.15-.14.33-.37.49-.56.16-.19.22-.32.33-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.27-.63-.54-.54-.74-.55h-.63c-.22 0-.57.08-.87.4-.3.32-1.14 1.11-1.14 2.7 0 1.6 1.17 3.14 1.33 3.36.16.21 2.3 3.5 5.58 4.91.78.34 1.39.54 1.86.69.78.25 1.5.21 2.06.13.63-.1 1.92-.78 2.2-1.54.27-.76.27-1.41.19-1.54-.08-.13-.3-.21-.63-.37Z" />
      </svg>
    </a>
  );
}
