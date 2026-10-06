import type { ProgramStep } from "@/types/database.types";

export const MAX_PROGRAM_STEPS = 12;

type ProgramStepDraft = Partial<ProgramStep> | Record<string, unknown>;

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fallbackProgramStepId(step: { time: string; title: string; location: string }, index: number) {
  const safeLabel = `${step.time}-${step.title}-${step.location}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeLabel || "etape"}-${index + 1}`;
}

export function createProgramStep(): ProgramStep {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `program-step-${Date.now()}`;

  return { id, time: "", title: "", location: "" };
}

export function prepareProgramSteps(steps: ProgramStepDraft[]) {
  let hasInvalid = false;
  const prepared: ProgramStep[] = [];

  steps.forEach((step, index) => {
    const time = readText(step.time);
    const title = readText(step.title);
    const location = readText(step.location);
    const isEmptyDraft = !time && !title && !location;

    if (isEmptyDraft) return;

    if (!time || !title) {
      hasInvalid = true;
      return;
    }

    const normalizedStep = { time, title, location };
    prepared.push({
      ...normalizedStep,
      id: readText(step.id) || fallbackProgramStepId(normalizedStep, index),
    });
  });

  return { steps: prepared.slice(0, MAX_PROGRAM_STEPS), hasInvalid };
}
