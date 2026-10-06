"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, MapPinned, MessageCircle, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ClientOnboardingModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
};

const ONBOARDING_STEPS = [
  {
    title: "Theme & Design",
    eyebrow: "Etape 1",
    icon: Palette,
    summary: "Choisissez le modele visuel qui donnera le ton de votre invitation.",
    details: "Explorez les themes disponibles, verifiez les modeles reserves a votre formule et gardez l'aperçu mobile ouvert pendant vos essais.",
  },
  {
    title: "Vos Photos",
    eyebrow: "Etape 2",
    icon: Camera,
    summary: "Ajoutez les images qui racontent le mieux votre histoire.",
    details: "Privilegiez des portraits verticaux nets. La galerie se met a jour directement dans l'aperçu et respecte la limite de votre formule.",
  },
  {
    title: "Details de la Ceremonie",
    eyebrow: "Etape 3",
    icon: MapPinned,
    summary: "Renseignez les informations essentielles pour guider vos invites.",
    details: "Date, heure, adresse, GPS, programme et dress code se modifient dans l'onglet Infos. Pensez a sauvegarder avant de partager.",
  },
  {
    title: "Partage & WhatsApp",
    eyebrow: "Etape 4",
    icon: MessageCircle,
    summary: "Diffusez votre invitation quand elle est prete.",
    details: "Copiez le lien public ou utilisez le partage WhatsApp. Vos invites pourront confirmer leur presence et presenter leur QR code le jour J.",
  },
] as const;

export function ClientOnboardingModal({ open, onOpenChange, onComplete }: ClientOnboardingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = ONBOARDING_STEPS[stepIndex];
  const CurrentIcon = currentStep.icon;
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;
  const progress = useMemo(() => ((stepIndex + 1) / ONBOARDING_STEPS.length) * 100, [stepIndex]);

  function goNext() {
    if (isLastStep) {
      onComplete();
      return;
    }
    setStepIndex((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (nextOpen) setStepIndex(0);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-2rem)] max-w-3xl overflow-hidden border-[#D4AF37]/30 bg-[#100B09] p-0 text-white shadow-2xl sm:rounded-2xl">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.22),transparent_34%),linear-gradient(135deg,#100B09_0%,#21130F_56%,#3A1D18_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F3D88D]/80 to-transparent" />

          <div className="relative z-10 grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#F3D88D]">
                <Sparkles className="size-3.5" />
                Bienvenue
              </div>
              <DialogHeader className="mt-6 text-left">
                <DialogTitle className="font-display-bold text-3xl leading-tight text-white">
                  Configurez votre invitation en quelques minutes
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-white/68">
                  Cette visite vous montre les quatre zones importantes de votre espace client.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-8 space-y-3">
                {ONBOARDING_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === stepIndex;
                  const isDone = index < stepIndex;

                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => setStepIndex(index)}
                      className={[
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                        isActive
                          ? "border-[#D4AF37]/55 bg-[#D4AF37]/15 text-white"
                          : "border-white/10 bg-white/[0.04] text-white/68 hover:border-white/25 hover:bg-white/[0.07]",
                      ].join(" ")}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-black/20">
                        {isDone ? <CheckCircle2 className="size-4 text-[#F3D88D]" /> : <StepIcon className="size-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">{step.eyebrow}</span>
                        <span className="block truncate text-sm font-semibold">{step.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex min-h-[430px] flex-col p-6 lg:p-8">
              <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F3D88D] transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>

              <div className="flex flex-1 flex-col justify-center">
                <div className="grid size-16 place-items-center rounded-2xl border border-[#D4AF37]/35 bg-white/10 shadow-xl">
                  <CurrentIcon className="size-8 text-[#F3D88D]" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-[#D4AF37]">{currentStep.eyebrow}</p>
                <h2 className="mt-3 font-display-bold text-3xl leading-tight text-white sm:text-4xl">{currentStep.title}</h2>
                <p className="mt-5 text-lg leading-8 text-white/84">{currentStep.summary}</p>
                <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-7 text-white/68">{currentStep.details}</p>
              </div>

              <DialogFooter className="mt-8 flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  disabled={isFirstStep}
                  onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                >
                  <ArrowLeft className="size-4" />
                  Precedent
                </Button>
                <Button
                  type="button"
                  className="min-h-11 rounded-full bg-[#D4AF37] px-6 text-[#171312] shadow-lg hover:bg-[#F3D88D]"
                  onClick={goNext}
                >
                  {isLastStep ? "Commencer a configurer" : "Suivant"}
                  {!isLastStep && <ArrowRight className="size-4" />}
                </Button>
              </DialogFooter>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
