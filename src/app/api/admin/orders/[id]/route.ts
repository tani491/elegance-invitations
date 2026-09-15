import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidateInvitation } from "@/lib/cached-invitation";
import { requireApiRole } from "@/lib/server-auth";
import { SUPABASE_STORAGE_BUCKETS } from "@/lib/supabase-storage";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

type StorageObjectRef = {
  bucket: string;
  path: string;
};

const SUPABASE_STORAGE_PUBLIC_MARKER = "/storage/v1/object/public/";
const EVENT_STORAGE_BUCKETS = new Set<string>(Object.values(SUPABASE_STORAGE_BUCKETS));

function collectStringUrls(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStringUrls(item));
  }

  return [];
}

function storageRefFromPublicUrl(rawUrl: string): StorageObjectRef | null {
  try {
    const url = new URL(rawUrl);
    const markerIndex = url.pathname.indexOf(SUPABASE_STORAGE_PUBLIC_MARKER);
    if (markerIndex === -1) return null;

    const storageKey = url.pathname.slice(markerIndex + SUPABASE_STORAGE_PUBLIC_MARKER.length);
    const [encodedBucket, ...encodedPathParts] = storageKey.split("/");
    if (!encodedBucket || encodedPathParts.length === 0) return null;

    const bucket = decodeURIComponent(encodedBucket);
    const objectPath = encodedPathParts.map((part) => decodeURIComponent(part)).join("/");
    if (!EVENT_STORAGE_BUCKETS.has(bucket) || !objectPath) return null;

    return { bucket, path: objectPath };
  } catch {
    return null;
  }
}

function uniqueStorageRefs(refs: StorageObjectRef[]) {
  return Array.from(
    new Map(refs.map((ref) => [`${ref.bucket}/${ref.path}`, ref] as const)).values(),
  );
}

async function removeSupabaseStorageObjects(refs: StorageObjectRef[]) {
  const uniqueRefs = uniqueStorageRefs(refs);
  if (!uniqueRefs.length) {
    return { attempted: false, removedFiles: 0, warnings: [] as string[] };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      attempted: false,
      removedFiles: 0,
      warnings: ["Configuration Supabase Storage manquante."],
    };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const refsByBucket = new Map<string, string[]>();
  const warnings: string[] = [];
  let removedFiles = 0;

  for (const ref of uniqueRefs) {
    const paths = refsByBucket.get(ref.bucket) ?? [];
    paths.push(ref.path);
    refsByBucket.set(ref.bucket, paths);
  }

  for (const [bucket, paths] of refsByBucket) {
    for (let index = 0; index < paths.length; index += 1000) {
      const batch = paths.slice(index, index + 1000);
      const { data, error } = await supabase.storage.from(bucket).remove(batch);

      if (error) {
        warnings.push(`${bucket}: ${error.message}`);
        continue;
      }

      removedFiles += data?.length ?? batch.length;
    }
  }

  return { attempted: true, removedFiles, warnings };
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN]);
  if (!session) return response;

  const { id } = await params;
  const weddingId = id.trim();

  if (!weddingId) {
    return NextResponse.json({ success: false, error: "Identifiant de commande invalide." }, { status: 400 });
  }

  try {
    const event = await db.event.findUnique({
      where: { id: weddingId },
      select: {
        id: true,
        slug: true,
        name: true,
        coverPhotoUrl: true,
        officialPhotoUrls: true,
        musicUrl: true,
        motionVideoUrl: true,
        client: { select: { id: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Commande introuvable." }, { status: 404 });
    }

    const storageRefs = collectStringUrls([
      event.coverPhotoUrl,
      event.officialPhotoUrls,
      event.musicUrl,
      event.motionVideoUrl,
    ])
      .map((url) => storageRefFromPublicUrl(url))
      .filter((ref): ref is StorageObjectRef => ref !== null);

    const clientUserIds = event.client?.id ? [event.client.id] : [];

    const deleted = await db.$transaction(async (tx) => {
      const guests = await tx.eventGuest.deleteMany({ where: { eventId: event.id } });
      const sessions = clientUserIds.length
        ? await tx.authSession.deleteMany({ where: { userId: { in: clientUserIds } } })
        : { count: 0 };
      const users = await tx.authUser.deleteMany({ where: { eventId: event.id } });

      await tx.event.delete({ where: { id: event.id } });

      return {
        guests: guests.count,
        sessions: sessions.count,
        users: users.count,
      };
    });

    const storage = await removeSupabaseStorageObjects(storageRefs);
    if (storage.warnings.length) {
      console.warn(`Suppression Storage incomplete pour la commande ${event.id}:`, storage.warnings);
    }

    revalidateInvitation(event.slug);

    return NextResponse.json(
      {
        success: true,
        message: "Événement et données supprimés définitivement.",
        data: { deleted, storage },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin order hard delete failed:", error);
    return NextResponse.json(
      { success: false, error: "Suppression definitive impossible." },
      { status: 500 },
    );
  }
}
