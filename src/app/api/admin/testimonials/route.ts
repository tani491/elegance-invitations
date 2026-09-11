import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const optionalText = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || null);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  z.string().trim().url().optional().nullable(),
);

const createTestimonialSchema = z.object({
  coupleNames: z.string().trim().min(2),
  location: z.string().trim().min(2),
  review: z.string().trim().min(5),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  formula: optionalText,
  photoUrl: optionalUrl,
  isVisible: z.boolean().optional().default(true),
});

const updateTestimonialSchema = z.object({
  id: z.string().min(1),
  coupleNames: z.string().trim().min(2).optional(),
  location: z.string().trim().min(2).optional(),
  review: z.string().trim().min(5).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  formula: optionalText.optional(),
  photoUrl: optionalUrl.optional(),
  isVisible: z.boolean().optional(),
});

const deleteTestimonialSchema = z.object({
  id: z.string().min(1),
});

async function requireAdmin(request: NextRequest) {
  return requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (!session) return response;

  const testimonials = await db.testimonial.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: testimonials });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (!session) return response;

  const parsed = createTestimonialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Temoignage invalide." }, { status: 400 });
  }

  const testimonial = await db.testimonial.create({
    data: {
      ...parsed.data,
      photoUrl: parsed.data.photoUrl ?? null,
    },
  });

  return NextResponse.json({ success: true, data: testimonial }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (!session) return response;

  const parsed = updateTestimonialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Mise a jour invalide." }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const testimonial = await db.testimonial.update({
    where: { id },
    data,
  });

  return NextResponse.json({ success: true, data: testimonial });
}

export async function DELETE(request: NextRequest) {
  const { session, response } = await requireAdmin(request);
  if (!session) return response;

  const parsed = deleteTestimonialSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Suppression invalide." }, { status: 400 });
  }

  await db.testimonial.delete({ where: { id: parsed.data.id } });

  return NextResponse.json({ success: true });
}
