import { z } from "zod";

type RelaxedUrlOptions = {
  allowRelative?: boolean;
  message?: string;
};

export function isRelaxedPublicUrl(value: string, { allowRelative = false }: RelaxedUrlOptions = {}) {
  if (allowRelative && value.startsWith("/")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function relaxedNullableUrlSchema(options: RelaxedUrlOptions = {}) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    },
    z.string()
      .refine((value) => isRelaxedPublicUrl(value, options), options.message ?? "URL invalide.")
      .nullable()
      .optional(),
  );
}
