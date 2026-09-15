import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { revalidateInvitation } from "@/lib/cached-invitation";
import { canUseMotionVideo, normalizePlan } from "@/lib/plan-gating";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

const planTypeSchema = z
  .preprocess(
    (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
    z.enum(["essentielle", "prestige", "privilege", "imperiale", "motion"]),
  )
  .transform((planType) => normalizePlan(planType));

const updateEventSchema = z.object({
  isActive: z.boolean().optional(),
  isPaid: z.boolean().optional(),
  planType: planTypeSchema.optional(),
  motionVideoUrl: z.string().url().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const { id } = await params;
  const parsed = updateEventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Mise a jour invalide." }, { status: 400 });
  }

  const currentEvent = await db.event.findUnique({ where: { id }, select: { planType: true } });
  if (!currentEvent) {
    return NextResponse.json({ success: false, error: "Evenement introuvable." }, { status: 404 });
  }

  const nextPlanType = parsed.data.planType ?? normalizePlan(currentEvent.planType);
  if (parsed.data.motionVideoUrl && !canUseMotionVideo(nextPlanType)) {
    return NextResponse.json(
      { success: false, error: "Video Cinematique Motion reservee a la formule Imperiale." },
      { status: 403 },
    );
  }

  const updateData = { ...parsed.data };
  if (parsed.data.planType && !canUseMotionVideo(parsed.data.planType) && parsed.data.motionVideoUrl === undefined) {
    updateData.motionVideoUrl = null;
  }

  const updated = await db.event.update({
    where: { id },
    data: updateData,
    include: {
      client: { select: { id: true, email: true, displayName: true, isActive: true } },
      _count: { select: { guests: true } },
    },
  });

  revalidateInvitation(updated.slug);

  return NextResponse.json({ success: true, data: updated });
}
