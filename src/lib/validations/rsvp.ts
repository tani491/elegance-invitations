import { z } from "zod";

const HTML_TAG_PATTERN = /<[^>]*>/g;
const SCRIPT_BLOCK_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001F\u007F]/g;
const E164_OR_DIGITS_PATTERN = /^(?:\+[1-9]\d{5,14}|\d{6,20})$/;

export function sanitizeText(value: string) {
  return value
    .normalize("NFC")
    .replace(SCRIPT_BLOCK_PATTERN, "")
    .replace(HTML_TAG_PATTERN, "")
    .replace(CONTROL_CHARACTER_PATTERN, "")
    .trim();
}

export function normalizePhoneNumber(value?: string | null) {
  const sanitized = sanitizeText(value ?? "");
  if (!sanitized) return null;

  const compact = sanitized.replace(/[^\d+]/g, "");
  if (compact.startsWith("+")) {
    return `+${compact.slice(1).replace(/\D/g, "")}`;
  }

  return compact.replace(/\D/g, "");
}

const optionalPhoneSchema = z
  .string()
  .max(40)
  .nullable()
  .optional()
  .transform((value) => normalizePhoneNumber(value))
  .refine((value) => value === null || E164_OR_DIGITS_PATTERN.test(value), {
    message: "Numero de telephone invalide.",
  });

export const rsvpRequestSchema = z
  .object({
    guestToken: z.string().min(10).max(220).transform(sanitizeText),
    status: z.enum(["confirmed", "declined", "pending"]),
    plusOnes: z.coerce.number().int().min(0).max(10).optional().default(0),
    guestName: z
      .string()
      .max(120)
      .nullable()
      .optional()
      .transform((value) => (value ? sanitizeText(value) : null)),
    guestPhone: optionalPhoneSchema,
  })
  .strict();
