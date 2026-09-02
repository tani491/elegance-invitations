import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { requireApiRole } from "@/lib/server-auth";
import { isSupabaseStorageConfigured, SUPABASE_STORAGE_BUCKETS, uploadToSupabaseStorage } from "@/lib/supabase-storage";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
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

  const isImage = kind === "image" && IMAGE_TYPES.has(file.type);
  const isVideo = kind === "video" && VIDEO_TYPES.has(file.type);
  if (!isImage && !isVideo) {
    return NextResponse.json({ success: false, error: "Format non autorise." }, { status: 400 });
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ success: false, error: "Fichier trop volumineux." }, { status: 413 });
  }

  const folder = isVideo ? "videos" : "images";
  const filename = `${Date.now()}-${randomUUID()}.${extensionFor(file)}`;

  if (isSupabaseStorageConfigured()) {
    const bucket = isVideo ? SUPABASE_STORAGE_BUCKETS.themeVideos : SUPABASE_STORAGE_BUCKETS.weddingPhotos;
    const objectPath = `${session.user.id}/${filename}`;
    const uploaded = await uploadToSupabaseStorage({ bucket, objectPath, file });

    return NextResponse.json({
      success: true,
      data: {
        url: uploaded.url,
        type: file.type,
        size: file.size,
        name: file.name,
        storage: uploaded.storage,
        bucket,
        path: objectPath,
      },
    });
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
