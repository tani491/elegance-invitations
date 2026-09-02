"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { PublicEventPayload } from "@/types/database.types";
import { BotanicalEnvelope } from "@/components/animations/BotanicalEnvelope";
import { CeremonialWalk } from "@/components/animations/CeremonialWalk";
import { GoldenDoors } from "@/components/animations/GoldenDoors";
import { SilkRibbon } from "@/components/animations/SilkRibbon";
import { VelvetCurtains } from "@/components/animations/VelvetCurtains";
import { WaxSealBurst } from "@/components/animations/WaxSealBurst";

function animationLabel(type: PublicEventPayload["theme"]["animationType"]) {
  if (type === "golden_palace_doors") return "Appuyez pour ouvrir la porte";
  if (type === "ceremonial_walk") return "Appuyez pour lancer le defile";
  if (type === "velvet_curtains") return "Appuyez pour lever les rideaux";
  if (type === "silk_ribbon_untie") return "Appuyez pour delier le ruban";
  if (type === "botanical_envelope") return "Appuyez pour ouvrir l'enveloppe";
  return "Appuyez pour briser le sceau";
}

export function OpeningGateway({
  event,
  opened,
  onOpen,
}: {
  event: PublicEventPayload;
  opened: boolean;
  onOpen: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const names = `${event.brideName ?? "Mariee"} & ${event.groomName ?? "Marie"}`;
  const initials = `${event.brideName?.[0] ?? "E"}${event.groomName?.[0] ?? ""}`.toUpperCase();
  const type = event.theme.animationType;

  function open() {
    setPlaying(true);
    setTimeout(onOpen, 760);
  }

  return (
    <AnimatePresence>
      {!opened && (
        <motion.section
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden px-5 text-center"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8 }}
        >
          {type === "golden_palace_doors" && <GoldenDoors opened={playing} />}
          {type === "ceremonial_walk" && <CeremonialWalk opened={playing} />}
          {type === "velvet_curtains" && <VelvetCurtains opened={playing} />}
          {type === "silk_ribbon_untie" && <SilkRibbon opened={playing} />}
          {type === "botanical_envelope" && <BotanicalEnvelope opened={playing} />}
          {type === "wax_seal_burst" && <WaxSealBurst opened={playing} initials={initials} />}
          {event.theme.demoVideoUrl && (
            <video src={event.theme.demoVideoUrl} className="absolute inset-0 size-full object-cover opacity-35" autoPlay muted loop playsInline preload="metadata" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <motion.button type="button" onClick={open} className="relative z-10 flex flex-col items-center" whileTap={{ scale: 0.96 }}>
            <div className="mb-8 flex size-24 items-center justify-center rounded-full border border-white/35 bg-[var(--invitation-primary)] text-[var(--invitation-gold)] shadow-2xl">
              <Heart className="size-10 fill-current" />
            </div>
            <p className="font-script text-6xl leading-tight text-[var(--invitation-gold)] md:text-8xl">{names}</p>
            <p className="mt-6 text-sm uppercase tracking-[0.22em] text-white/85">{animationLabel(type)}</p>
          </motion.button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
