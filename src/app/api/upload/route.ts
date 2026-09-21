import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { canUseMotionVideo } from "@/lib/plan-gating";
import { isR2Configured, R2_BUCKET_NAME, r2, r2PublicUrlForKey } from "@/lib/r2";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

type UploadKind = "image" | "audio" | "video" | "theme-video";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/x-m4a", "audio/wav"]);
const EVENT_VIDEO_TYPES = new Set(["video/mp4"]);
const THEME_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/mov"]);

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav"]);
const EVENT_VIDEO_EXTENSIONS = new Set(["mp4"]);
const THEME_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

const IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const AUDIO_MAX_SIZE = 18 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return "mp3";
  if (file.type === "audio/mp4" || file.type === "audio/x-m4a") return "m4a";
  if (file.type === "audio/aac") return "aac";
  if (file.type === "audio/wav") return "wav";
  if (file.type === "video/quicktime" || file.type === "video/mov") return "mov";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/mp4") return "mp4";
  return "bin";
}

function sanitizeStorageFilename(filename: string) {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/^_+|_+$/g, "")
    || "media";
}

function inferUploadKind(file: File): UploadKind | null {
  const extension = extensionFor(file);
  if (IMAGE_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(extension)) return "image";
  if (AUDIO_TYPES.has(file.type) || AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (EVENT_VIDEO_TYPES.has(file.type) || EVENT_VIDEO_EXTENSIONS.has(extension)) return "video";
  return null;
}

function normalizeUploadKind(value: FormDataEntryValue | null, file: File): UploadKind | null {
  if (typeof value !== "string" || !value.trim()) return inferUploadKind(file);
  if (value === "image" || value === "audio" || value === "video" || value === "theme-video") return value;
  return null;
}

function validateFile(kind: UploadKind, file: File, extension: string) {
  if (kind === "image") {
    if (!(IMAGE_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(extension))) return "Format image non autorise.";
    if (file.size > IMAGE_MAX_SIZE) return "Image trop volumineuse.";
  }

  if (kind === "audio") {
    if (!(AUDIO_TYPES.has(file.type) || AUDIO_EXTENSIONS.has(extension))) return "Format audio non autorise.";
    if (file.size > AUDIO_MAX_SIZE) return "Audio trop volumineux.";
  }

  if (kind === "video") {
    if (!(EVENT_VIDEO_TYPES.has(file.type) || EVENT_VIDEO_EXTENSIONS.has(extension))) {
      return "Seuls les fichiers MP4 sont autorises pour la video cinematographique.";
    }
    if (file.size > VIDEO_MAX_SIZE) return "Video trop volumineuse.";
  }

  if (kind === "theme-video") {
    if (!(THEME_VIDEO_TYPES.has(file.type) || THEME_VIDEO_EXTENSIONS.has(extension))) {
      return "Format video non autorise. Utilisez MP4, MOV/QuickTime ou WEBM.";
    }
    if (file.size > VIDEO_MAX_SIZE) return "Video trop volumineuse.";
  }

  return null;
}

async function keyForUpload({
  kind,
  file,
  extension,
  formData,
  session,
}: {
  kind: UploadKind;
  file: File;
  extension: string;
  formData: FormData;
  session: Awaited<ReturnType<typeof requireApiRole>>["session"];
}) {
  if (!session) return { error: "Authentification requise.", status: 401 as const };

  const filename = `${Date.now()}-${randomUUID()}-${sanitizeStorageFilename(file.name || `media.${extension}`)}`;

  if (kind === "theme-video") {
    if (session.user.role !== AUTH_ROLES.SUPER_ADMIN) {
      return { error: "Acces admin requis pour cet upload.", status: 403 as const };
    }
    return { key: `theme-videos/${session.user.id}/${filename}` };
  }

  if (kind === "video") {
    const eventIdValue = formData.get("eventId");
    const requestedEventId = typeof eventIdValue === "string" ? eventIdValue.trim() : null;
    const eventId = session.user.role === AUTH_ROLES.SUPER_ADMIN ? requestedEventId : session.user.eventId;

    if (!eventId) return { error: "Evenement introuvable pour cet upload.", status: 404 as const };

    const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, planType: true } });
    if (!event) return { error: "Evenement introuvable.", status: 404 as const };

    if (!canUseMotionVideo(event.planType)) {
      return { error: "Video Cinematique Motion reservee a la formule Imperiale.", status: 403 as const };
    }

    return { key: `motion-videos/${event.id}/${filename}` };
  }

  if (kind === "audio") return { key: `music/${session.user.id}/${filename}` };

  return { key: `gallery-images/${session.user.id}/${filename}` };
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT]);
  if (!session) return response;

  try {
    if (!isR2Configured()) {
      return NextResponse.json({ success: false, error: "Configuration Cloudflare R2 manquante." }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni." }, { status: 400 });
    }

    const kind = normalizeUploadKind(formData.get("kind"), file);
    if (!kind) {
      return NextResponse.json({ success: false, error: "Type de media non autorise." }, { status: 400 });
    }

    const extension = extensionFor(file);
    const validationError = validateFile(kind, file, extension);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const target = await keyForUpload({ kind, file, extension, formData, session });
    if ("error" in target) {
      return NextResponse.json({ success: false, error: target.error }, { status: target.status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: target.key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const url = r2PublicUrlForKey(target.key);

    return NextResponse.json(
      {
        success: true,
        url,
        data: {
          url,
          type: file.type,
          size: file.size,
          name: file.name,
          storage: "r2",
          bucket: R2_BUCKET_NAME,
          path: target.key,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erreur Upload R2:", error);
    return NextResponse.json({ success: false, error: "Echec du televersement R2" }, { status: 500 });
  }
}
