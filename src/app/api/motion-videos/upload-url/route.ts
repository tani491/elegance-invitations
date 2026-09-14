import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole } from "@/lib/server-auth";
import { SUPABASE_STORAGE_BUCKETS } from "@/lib/supabase-storage";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

const MOTION_VIDEO_BUCKET = SUPABASE_STORAGE_BUCKETS.motionVideos;

const signedMotionVideoUploadSchema = z.object({
  fileName: z.string().min(1).max(160),
  eventId: z.string().min(3).max(120).nullable().optional(),
});

function sanitizeStorageFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT]);
  if (!session) return response;

  const parsed = signedMotionVideoUploadSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Demande d'upload video invalide." }, { status: 400 });
  }

  const requestedEventId = parsed.data.eventId?.trim() || null;
  const eventId = session.user.role === AUTH_ROLES.SUPER_ADMIN ? requestedEventId : session.user.eventId;

  if (!eventId) {
    return NextResponse.json({ success: false, error: "Evenement introuvable pour cet upload." }, { status: 404 });
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ success: false, error: "Evenement introuvable." }, { status: 404 });
  }

  const extension = parsed.data.fileName.split(".").pop()?.toLowerCase();
  if (extension !== "mp4") {
    return NextResponse.json({ success: false, error: "Seuls les fichiers MP4 sont autorises." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ success: false, error: "Configuration Supabase Storage manquante." }, { status: 500 });
  }

  const safeName = sanitizeStorageFilename(parsed.data.fileName);
  const objectPath = `motion-videos/${event.id}/${Date.now()}-${randomUUID()}-${safeName}`;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase.storage
    .from(MOTION_VIDEO_BUCKET)
    .createSignedUploadUrl(objectPath, { upsert: true });

  if (error) {
    console.error("Erreur signature upload motion video Supabase:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, data: { ...data, bucket: MOTION_VIDEO_BUCKET } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
