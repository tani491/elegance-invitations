import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { canUseMotionVideo } from "@/lib/plan-gating";
import { AUTH_ROLES } from "@/types/database.types";

export type UploadKind = "image" | "audio" | "video" | "theme-video" | "demo-media";

export type UploadFileDescriptor = {
  name: string;
  type: string;
  size: number;
};

type UploadSession = {
  user: {
    id: string;
    role: string;
    eventId?: string | null;
  };
} | null;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/x-m4a", "audio/wav"]);
const EVENT_VIDEO_TYPES = new Set(["video/mp4"]);
const THEME_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/mov"]);
const DEMO_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/mov",
]);

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav"]);
const EVENT_VIDEO_EXTENSIONS = new Set(["mp4"]);
const THEME_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);
const DEMO_MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "heic", "heif", "mp4", "mov", "webm"]);

const IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const AUDIO_MAX_SIZE = 18 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;

export const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";

export function extensionForUpload(file: UploadFileDescriptor) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "image/heic") return "heic";
  if (file.type === "image/heif") return "heif";
  if (file.type === "audio/mpeg" || file.type === "audio/mp3") return "mp3";
  if (file.type === "audio/mp4" || file.type === "audio/x-m4a") return "m4a";
  if (file.type === "audio/aac") return "aac";
  if (file.type === "audio/wav") return "wav";
  if (file.type === "video/quicktime" || file.type === "video/mov") return "mov";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/mp4") return "mp4";
  return "bin";
}

export function inferUploadKind(file: UploadFileDescriptor): UploadKind | null {
  const extension = extensionForUpload(file);
  if (IMAGE_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(extension)) return "image";
  if (AUDIO_TYPES.has(file.type) || AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (EVENT_VIDEO_TYPES.has(file.type) || EVENT_VIDEO_EXTENSIONS.has(extension)) return "video";
  return null;
}

export function normalizeUploadKind(value: unknown, file: UploadFileDescriptor): UploadKind | null {
  if (typeof value !== "string" || !value.trim()) return inferUploadKind(file);
  if (value === "image" || value === "audio" || value === "video" || value === "theme-video" || value === "demo-media") {
    return value;
  }
  return null;
}

export function validateUploadFile(kind: UploadKind, file: UploadFileDescriptor, extension: string) {
  if (!Number.isFinite(file.size) || file.size <= 0) return "Fichier vide ou invalide.";

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

  if (kind === "demo-media") {
    if (!(DEMO_MEDIA_TYPES.has(file.type) || DEMO_MEDIA_EXTENSIONS.has(extension))) {
      return "Format demo non autorise. Utilisez une image ou une video MP4, MOV/QuickTime ou WEBM.";
    }
    if (file.size > VIDEO_MAX_SIZE) return "Media de demo trop volumineux.";
  }

  return null;
}

export function sanitizeStorageFilename(filename: string) {
  return filename
    .trim()
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/^_+|_+$/g, "")
    || "media";
}

export async function keyForUpload({
  kind,
  file,
  extension,
  eventId,
  session,
}: {
  kind: UploadKind;
  file: UploadFileDescriptor;
  extension: string;
  eventId?: string | null;
  session: UploadSession;
}) {
  if (!session) return { error: "Authentification requise.", status: 401 as const };

  const filename = `${Date.now()}-${randomUUID()}-${sanitizeStorageFilename(file.name || `media.${extension}`)}`;

  if (kind === "theme-video") {
    if (session.user.role !== AUTH_ROLES.SUPER_ADMIN) {
      return { error: "Acces admin requis pour cet upload.", status: 403 as const };
    }
    return { key: `theme-videos/${session.user.id}/${filename}` };
  }

  if (kind === "demo-media") {
    if (session.user.role !== AUTH_ROLES.SUPER_ADMIN) {
      return { error: "Acces admin requis pour cet upload.", status: 403 as const };
    }
    return { key: `homepage-demos/${session.user.id}/${filename}` };
  }

  if (kind === "video") {
    const requestedEventId = typeof eventId === "string" ? eventId.trim() : null;
    const resolvedEventId = session.user.role === AUTH_ROLES.SUPER_ADMIN ? requestedEventId : session.user.eventId;

    if (!resolvedEventId) return { error: "Evenement introuvable pour cet upload.", status: 404 as const };

    const event = await db.event.findUnique({ where: { id: resolvedEventId }, select: { id: true, planType: true } });
    if (!event) return { error: "Evenement introuvable.", status: 404 as const };

    if (!canUseMotionVideo(event.planType)) {
      return { error: "Video Cinematique Motion reservee a la formule Imperiale.", status: 403 as const };
    }

    return { key: `motion-videos/${event.id}/${filename}` };
  }

  if (kind === "audio") return { key: `music/${session.user.id}/${filename}` };

  return { key: `gallery-images/${session.user.id}/${filename}` };
}
