"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CreditCard, Loader2, MessageCircle, Play } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDER_BUNDLES,
  BUILDER_FORMULAS,
  BUILDER_SECTIONS,
  DEFAULT_BUILDER_CONFIG,
  calculateBuilderPricing,
  type BuilderBundleId,
  type BuilderConfig,
  type BuilderSectionId,
  type BuilderTemplate,
  type BuilderStep,
  type BuilderExtraId,
  type BuilderFormulaId,
  type TemplateId,
} from "@/types/builder.types";
import { PricingSummary, formatEuro } from "./PricingSummary";
import { StepExtras } from "./StepExtras";
import { StepGuests } from "./StepGuests";
import { StepSections } from "./StepSections";
import { StepTemplate } from "./StepTemplate";
import { ELEGANCE_WHATSAPP_NUMBER } from "@/lib/whatsapp";

const STORAGE_KEY = "elegance-order-builder";
const steps: { id: BuilderStep; label: string }[] = [
  { id: 1, label: "Modele" },
  { id: 2, label: "Sections" },
  { id: 3, label: "Options" },
  { id: 4, label: "Bundles" },
  { id: 5, label: "Invites" },
  { id: 6, label: "Coordonnees" },
];

const FCFA_PER_EUR = 656;

function parseStoredConfig(raw: string | null): BuilderConfig {
  if (!raw) return DEFAULT_BUILDER_CONFIG;
  try {
    return { ...DEFAULT_BUILDER_CONFIG, ...JSON.parse(raw) } as BuilderConfig;
  } catch {
    return DEFAULT_BUILDER_CONFIG;
  }
}

function toggle<T extends string>(items: T[], id: T) {
  return items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
}

function selectedLabels<TItem extends { id: string; label: string }>(items: TItem[], ids: string[]) {
  return items.filter((item) => ids.includes(item.id)).map((item) => item.label);
}

export function OrderBuilder() {
  const [step, setStep] = useState<BuilderStep>(1);
  const [config, setConfig] = useState<BuilderConfig>(DEFAULT_BUILDER_CONFIG);
  const [previewTemplate, setPreviewTemplate] = useState<BuilderTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pricing = useMemo(() => calculateBuilderPricing(config), [config]);

  useEffect(() => {
    queueMicrotask(() => setConfig(parseStoredConfig(window.localStorage.getItem(STORAGE_KEY))));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  function setTemplate(templateId: TemplateId) {
    setConfig((current) => ({ ...current, templateId }));
  }

  function setFormula(formulaId: BuilderFormulaId) {
    setConfig((current) => ({ ...current, formulaId }));
  }

  function toggleSection(sectionId: BuilderSectionId) {
    const section = BUILDER_SECTIONS.find((item) => item.id === sectionId);
    if (section?.included) return;
    setConfig((current) => ({ ...current, sectionIds: toggle(current.sectionIds, sectionId) }));
  }

  function toggleExtra(extraId: BuilderExtraId) {
    setConfig((current) => ({ ...current, extraIds: toggle(current.extraIds, extraId) }));
  }

  function toggleBundle(bundleId: BuilderBundleId) {
    setConfig((current) => ({ ...current, bundleIds: toggle(current.bundleIds, bundleId) }));
  }

  function validateContact() {
    if (!config.contact.name || !config.contact.email || !config.contact.weddingDate) {
      toast.error("Completez le nom, l'email et la date du mariage.");
      return false;
    }
    return true;
  }

  function orderSummaryLines() {
    const formula = BUILDER_FORMULAS.find((item) => item.id === config.formulaId) ?? BUILDER_FORMULAS[1];
    const sections = selectedLabels(BUILDER_SECTIONS, config.sectionIds);
    const extras = [
      ...selectedLabels(BUILDER_BUNDLES, config.bundleIds),
      ...pricing.lineItems
        .filter((item) => ![pricing.template.id, config.formulaId, "guest-links", "versions"].includes(item.id))
        .map((item) => item.label),
    ];

    return {
      formula,
      sections,
      extras: extras.length > 0 ? extras : ["Aucune option supplementaire"],
    };
  }

  function orderViaWhatsApp() {
    if (!validateContact()) return;

    const summary = orderSummaryLines();
    const whatsappNumber = ELEGANCE_WHATSAPP_NUMBER;
    const totalFcfa = pricing.total * FCFA_PER_EUR;
    const text = encodeURIComponent(
      [
        "Bonjour Elegance ! 💍✨",
        "Je souhaite commander une invitation avec les options suivantes :",
        `- Modele : ${pricing.template.name}`,
        `- Formule : ${summary.formula.label}`,
        `- Sections : ${summary.sections.join(", ")}`,
        `- Options : ${summary.extras.join(", ")}`,
        `- Noms du couple : ${config.contact.name}`,
        `- Email : ${config.contact.email}`,
        `- Date : ${config.contact.weddingDate}`,
        `- Total estime : ${new Intl.NumberFormat("fr-FR").format(totalFcfa)} FCFA / ${formatEuro(pricing.total)}`,
        "",
        "Je souhaite regler par Wave / Orange Money / Virement.",
      ].join("\n"),
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  async function payOnline() {
    if (!validateContact()) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, pricing }),
      });
      const payload = (await response.json()) as { redirectUrl?: string; error?: string };
      if (!response.ok || !payload.redirectUrl) {
        throw new Error(payload.error ?? "Redirection de paiement indisponible.");
      }
      window.location.href = payload.redirectUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Paiement en ligne indisponible.");
      setIsSubmitting(false);
    }
  }

  const currentStep = steps.find((item) => item.id === step) ?? steps[0];

  return (
    <div className="min-h-screen bg-[#f8f3ea] px-4 py-6 text-stone-950 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Badge className="bg-stone-950 text-white">Configurateur haute couture</Badge>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">Composez votre invitation modulaire</h1>
            <p className="mt-4 max-w-2xl text-stone-600">
              Selectionnez le modele, les sections, les options et les liens invites. Le prix s'ajuste en temps reel.
            </p>
          </div>
          <div className="rounded-lg border border-[#d7bd82]/50 bg-white/80 p-3">
            <div className="grid grid-cols-6 gap-1">
              {steps.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStep(item.id)}
                  className={`h-10 rounded-md text-xs font-medium transition ${
                    item.id === step ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                  }`}
                  aria-label={item.label}
                >
                  {item.id}
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <main className="min-w-0">
            <Card className="rounded-lg border-[#d7bd82]/50 bg-white/80 shadow-xl shadow-stone-200/50">
              <CardContent className="p-5 md:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Etape {step} / 6</p>
                    <h2 className="mt-1 font-serif text-3xl text-stone-950">{currentStep.label}</h2>
                  </div>
                  <Badge variant="outline">{formatEuro(pricing.total)}</Badge>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.24 }}
                  >
                    {step === 1 && <StepTemplate selectedId={config.templateId} onSelect={setTemplate} onPreview={setPreviewTemplate} />}
                    {step === 2 && <StepSections selectedIds={config.sectionIds} onToggle={toggleSection} />}
                    {(step === 3 || step === 4) && (
                      <StepExtras
                        mode={step === 3 ? "extras" : "bundles"}
                        selectedExtraIds={config.extraIds}
                        selectedBundleIds={config.bundleIds}
                        onToggleExtra={toggleExtra}
                        onToggleBundle={toggleBundle}
                      />
                    )}
                    {step === 5 && (
                      <StepGuests
                        config={config}
                        onChange={(patch) => setConfig((current) => ({ ...current, ...patch }))}
                      />
                    )}
                    {step === 6 && (
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>Formule selectionnee</Label>
                          <div className="grid gap-3 md:grid-cols-3">
                            {BUILDER_FORMULAS.map((formula) => (
                              <button
                                key={formula.id}
                                type="button"
                                onClick={() => setFormula(formula.id)}
                                className={`rounded-lg border p-4 text-left transition ${
                                  config.formulaId === formula.id ? "border-[#b8892b] bg-[#fff9ed]" : "border-stone-200 bg-white hover:border-[#d7bd82]"
                                }`}
                              >
                                <span className="font-serif text-xl text-stone-950">{formula.label}</span>
                                <span className="mt-1 block text-sm text-stone-500">{formula.price === 0 ? "Incluse" : `+${formatEuro(formula.price)}`}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nom</Label>
                            <Input
                              id="name"
                              value={config.contact.name}
                              onChange={(event) => setConfig((current) => ({ ...current, contact: { ...current.contact, name: event.target.value } }))}
                              placeholder="Amy & Ibrahima"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={config.contact.email}
                              onChange={(event) => setConfig((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))}
                              placeholder="contact@email.com"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="weddingDate">Date du mariage</Label>
                          <Input
                            id="weddingDate"
                            type="date"
                            value={config.contact.weddingDate}
                            onChange={(event) => setConfig((current) => ({ ...current, contact: { ...current.contact, weddingDate: event.target.value } }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes pour le designer</Label>
                          <Textarea
                            id="notes"
                            value={config.contact.notes}
                            onChange={(event) => setConfig((current) => ({ ...current, contact: { ...current.contact, notes: event.target.value } }))}
                            placeholder="Ambiance souhaitee, traditions, couleurs, musique..."
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-200 pt-5">
                  <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((current) => Math.max(current - 1, 1) as BuilderStep)}>
                    <ArrowLeft className="size-4" />
                    Retour
                  </Button>
                  {step < 6 ? (
                    <Button type="button" onClick={() => setStep((current) => Math.min(current + 1, 6) as BuilderStep)} className="bg-stone-950 text-white hover:bg-stone-800">
                      Suivant
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
                      <Button type="button" onClick={orderViaWhatsApp} className="bg-[#1f7a4c] text-white hover:bg-[#17643d]">
                        <MessageCircle className="size-4" />
                        Commander via WhatsApp
                      </Button>
                      <Button type="button" onClick={payOnline} disabled={isSubmitting} variant="outline">
                        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                        Payer en ligne
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <PricingSummary pricing={pricing} />
            <div className="overflow-hidden rounded-lg border border-[#d7bd82]/50 bg-stone-950 p-4">
              <div className="mx-auto aspect-[9/16] max-h-[520px] overflow-hidden rounded-[28px] border-4 border-stone-800 bg-white p-2 shadow-2xl">
                <div className="flex size-full flex-col justify-end overflow-hidden rounded-[22px] p-5 text-white" style={{ background: pricing.template.gradient }}>
                  <Play className="mb-auto size-9 rounded-full bg-white/20 p-2 backdrop-blur" />
                  <p className="font-serif text-4xl leading-none">{pricing.template.name}</p>
                  <p className="mt-3 text-sm leading-6 text-white/80">{pricing.template.mood}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {previewTemplate && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewTemplate(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-[34px] border border-white/15 bg-stone-950 p-3 shadow-2xl"
              initial={{ scale: 0.96, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 20 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="aspect-[9/16] overflow-hidden rounded-[26px] bg-white">
                {previewTemplate.previewVideoUrl ? (
                  <video src={previewTemplate.previewVideoUrl} autoPlay muted playsInline loop preload="metadata" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col justify-end p-7 text-white" style={{ background: previewTemplate.gradient }}>
                    <Badge className="mb-auto w-fit bg-white/20 text-white backdrop-blur">Preview</Badge>
                    <p className="font-serif text-5xl leading-none">{previewTemplate.name}</p>
                    <p className="mt-4 text-sm leading-6 text-white/80">{previewTemplate.mood}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
