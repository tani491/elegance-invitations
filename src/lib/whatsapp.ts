export const ELEGANCE_WHATSAPP_NUMBER = "221773615944";
export const ELEGANCE_WHATSAPP_DISPLAY = "+221 77 361 59 44";

export const ELEGANCE_ASSISTANCE_MESSAGE =
  "Bonjour Élégance Invitations, je souhaite avoir des informations sur vos faire-part digitaux.";

export const ELEGANCE_ORDER_MESSAGE =
  "Bonjour Élégance Invitations, je souhaite commander une invitation digitale.";

export function buildEleganceWhatsAppUrl(message: string) {
  return `https://wa.me/${ELEGANCE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const ELEGANCE_ASSISTANCE_WHATSAPP_URL = buildEleganceWhatsAppUrl(ELEGANCE_ASSISTANCE_MESSAGE);
export const ELEGANCE_ORDER_WHATSAPP_URL = buildEleganceWhatsAppUrl(ELEGANCE_ORDER_MESSAGE);
