'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, PRICING_PLANS, type PlanKey } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Check, MessageCircle, Sparkles, Crown, Gem } from 'lucide-react';
import { ELEGANCE_WHATSAPP_NUMBER } from '@/lib/whatsapp';

/* ============================================================
   WhatsApp Order Checkout — Plan selection + WhatsApp redirect
   ============================================================ */

const PLAN_ICONS = {
  essentielle: Sparkles,
  prestige: Crown,
  privilege: Gem,
};

export default function WhatsAppOrderCheckout() {
  const { event } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('prestige');

  const plan = PRICING_PLANS.find((p) => p.key === selectedPlan)!;

  const buildWhatsAppURL = () => {
    const recap = [
      `*Nouvelle Commande Élégance*`,
      ``,
      `*Forfait* : ${plan.name} (${plan.priceLabel})`,
      `*Événement* : ${event.name}`,
      `*Organisateur* : ${event.organizerName}`,
      `*Téléphone* : ${event.organizerPhone}`,
      ``,
      `*Inclus* :`,
      ...plan.features.map((f) => `  - ${f}`),
      ``,
      `*Paiement* : Wave / Orange Money`,
      `*Montant* : ${plan.priceLabel}`,
    ].join('\n');

    const encoded = encodeURIComponent(recap);
    return `https://wa.me/${ELEGANCE_WHATSAPP_NUMBER}?text=${encoded}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="font-script text-gold text-2xl sm:text-3xl mb-3">
          Choisissez votre expérience
        </p>
        <h2 className="font-display-bold text-3xl sm:text-4xl">
          Nos Forfaits
        </h2>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto font-body">
          Chaque forfait inclut une invitation numérique personnalisée, un QR Code RSVP,
          et un pass d'accès nominatif. Paiement sécurisé via Wave ou Orange Money.
        </p>
      </motion.div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((p, idx) => {
          const Icon = PLAN_ICONS[p.key];
          const isSelected = selectedPlan === p.key;
          return (
            <motion.div
              key={p.key}
              className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'card-luxury-elevated border-2 border-gold/50 scale-[1.02]'
                  : 'card-luxury hover:card-luxury-elevated border-2 border-transparent'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedPlan(p.key)}
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-charcoal text-xs font-display-bold px-4 py-1 rounded-full tracking-luxury">
                    Populaire
                  </span>
                </div>
              )}

              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    isSelected ? 'bg-gold/20' : 'bg-muted'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${isSelected ? 'text-gold' : 'text-muted-foreground'}`}
                  />
                </div>

                <h3 className="font-display-bold text-xl mb-1">{p.name}</h3>
                <p className="font-display text-2xl text-gold-gradient mb-4">
                  {p.priceLabel}
                </p>

                <ul className="space-y-2 text-left w-full">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          isSelected ? 'text-gold' : 'text-muted-foreground'
                        }`}
                      />
                      <span className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <motion.div
        className="text-center mt-10 space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="font-body text-muted-foreground">
          Forfait sélectionné : <span className="font-display-bold text-foreground">{plan.name}</span>{' '}
          — {plan.priceLabel}
        </p>

        <Button
          className="h-14 px-8 btn-luxury bg-green-600 hover:bg-green-700 text-white font-display text-lg tracking-elegant"
          asChild
        >
          <a href={buildWhatsAppURL()} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="w-5 h-5 mr-2" />
            Commander via WhatsApp
          </a>
        </Button>

        <p className="text-xs text-muted-foreground">
          Vous serez redirigé(e) vers WhatsApp pour finaliser la commande et le paiement
          (Wave / Orange Money).
        </p>
      </motion.div>
    </div>
  );
}
