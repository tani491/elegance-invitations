import { NextResponse } from "next/server";
import { calculateBuilderPricing, type BuilderConfig } from "@/types/builder.types";
import { ELEGANCE_WHATSAPP_NUMBER } from "@/lib/whatsapp";

interface CheckoutRequest {
  config?: BuilderConfig;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckoutRequest;

  if (!body.config) {
    return NextResponse.json({ error: "Configuration manquante." }, { status: 400 });
  }

  const pricing = calculateBuilderPricing(body.config);
  const paymentLink = process.env.STRIPE_PAYMENT_LINK ?? process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  if (paymentLink) {
    const url = new URL(paymentLink);
    url.searchParams.set("client_reference_id", body.config.contact.email);
    url.searchParams.set("prefilled_email", body.config.contact.email);
    return NextResponse.json({ redirectUrl: url.toString(), total: pricing.total });
  }

  const summary = pricing.lineItems.map((item) => `${item.label}: ${item.amount} EUR`).join(" | ");
  const text = encodeURIComponent(
    `Bonjour Elegance, je souhaite lancer ma commande.\nNom: ${body.config.contact.name}\nEmail: ${body.config.contact.email}\nDate: ${body.config.contact.weddingDate}\nTotal: ${pricing.total} EUR\n${summary}`,
  );

  return NextResponse.json({
    redirectUrl: `https://wa.me/${ELEGANCE_WHATSAPP_NUMBER}?text=${text}`,
    total: pricing.total,
    mode: "whatsapp-fallback",
  });
}
