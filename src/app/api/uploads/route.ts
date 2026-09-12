import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireApiRole } from "@/lib/server-auth";
import {
  isSupabaseStorageConfigured,
  SUPABASE_STORAGE_BUCKETS,
  uploadToFirstAvailableSupabaseStorage,
} from "@/lib/supabase-storage";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/x-m4a", "audio/wav"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav"]);
const IMAGE_MAX_SIZE = 8 * 1024 * 1024;
const AUDIO_MAX_SIZE = 18 * 1024 * 1024;

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
  return "bin";
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT]);
  if (!session) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Fichier manquant." }, { status: 400 });
  }

  if (kind === "video") {
    return NextResponse.json(
      { success: false, error: "Les videos doivent etre televersees directement vers Supabase Storage." },
      { status: 400 },
    );
  }

  const extension = extensionFor(file);
  const isAllowedImage = IMAGE_TYPES.has(file.type) || IMAGE_EXTENSIONS.has(extension);
  const isAllowedAudio = AUDIO_TYPES.has(file.type) || AUDIO_EXTENSIONS.has(extension);
  const uploadKind = kind === "image" && isAllowedImage
    ? "image"
    : kind === "audio" && isAllowedAudio
      ? "audio"
      : null;

  if (!uploadKind) {
    return NextResponse.json({ success: false, error: "Format non autorise." }, { status: 400 });
  }

  const maxSize = uploadKind === "audio" ? AUDIO_MAX_SIZE : IMAGE_MAX_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json({ success: false, error: "Fichier trop volumineux." }, { status: 413 });
  }

  const folder = uploadKind === "audio" ? "music" : "images";
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;

  if (isSupabaseStorageConfigured()) {
    const buckets = uploadKind === "audio"
      ? [SUPABASE_STORAGE_BUCKETS.music, SUPABASE_STORAGE_BUCKETS.weddingPhotos]
      : [SUPABASE_STORAGE_BUCKETS.weddingPhotos];
    const objectPath = uploadKind === "audio" ? `music/${session.user.id}/${filename}` : `${session.user.id}/${filename}`;

    try {
      const uploaded = await uploadToFirstAvailableSupabaseStorage({ buckets, objectPath, file });

      return NextResponse.json({
        success: true,
        data: {
          url: uploaded.url,
          type: file.type,
          size: file.size,
          name: file.name,
          storage: uploaded.storage,
          bucket: uploaded.bucket,
          path: uploaded.path,
        },
      });
    } catch (error) {
      console.error("Upload storage failed:", error);
      return NextResponse.json({ success: false, error: "Upload impossible pour le moment." }, { status: 500 });
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });

  const diskPath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, bytes);

  return NextResponse.json({
    success: true,
    data: {
      url: `/uploads/${folder}/${filename}`,
      type: file.type,
      size: file.size,
      name: file.name,
      storage: "local",
    },
  });
}
