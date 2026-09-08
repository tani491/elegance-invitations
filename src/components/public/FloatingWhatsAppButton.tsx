"use client";

import { MessageCircle } from "lucide-react";
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
      className="fixed bottom-6 right-6 z-40 grid size-14 place-items-center rounded-full border border-[#D4AF37]/50 bg-[#075E54] text-white shadow-[0_18px_45px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 hover:bg-[#064E46] hover:shadow-[0_22px_55px_rgba(0,0,0,.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
