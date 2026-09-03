import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSupabaseStorageConfigured, SUPABASE_STORAGE_BUCKETS, uploadToSupabaseStorage } from "@/lib/supabase-storage";

export const runtime = "nodejs";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/avif") return "avif";
  return "bin";
}

async function storeGalleryPhoto({
  eventId,
  file,
}: {
  eventId: string;
  file: File;
}) {
  const filename = `${Date.now()}-${randomUUID()}.${extensionFor(file)}`;

  if (isSupabaseStorageConfigured()) {
    const objectPath = `${eventId}/${filename}`;
    const uploaded = await uploadToSupabaseStorage({
      bucket: SUPABASE_STORAGE_BUCKETS.galleryPhotos,
      objectPath,
      file,
    });
    return uploaded.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "gallery");
  await mkdir(uploadDir, { recursive: true });
  const diskPath = path.join(uploadDir, filename);
  await writeFile(diskPath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/gallery/${filename}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = String(formData.get("token") ?? "");
    const category = String(formData.get("category") ?? "ceremonie");
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!token || files.length === 0) {
      return NextResponse.json({ success: false, error: "Token ou fichiers manquants." }, { status: 400 });
    }

    if (files.some((file) => !IMAGE_TYPES.has(file.type))) {
      return NextResponse.json({ success: false, error: "Seules les images JPG, PNG, WebP et AVIF sont autorisees." }, { status: 400 });
    }

    if (files.some((file) => file.size > 15 * 1024 * 1024)) {
      return NextResponse.json({ success: false, error: "Chaque photo doit peser moins de 15 Mo." }, { status: 413 });
    }

    const event = await db.event.findUnique({
      where: { photographerToken: token },
      select: { id: true, isActive: true },
    });

    if (!event || !event.isActive) {
      return NextResponse.json({ success: false, error: "Token invalide." }, { status: 403 });
    }

    const photos = await Promise.all(
      files.map(async (file) => {
        const url = await storeGalleryPhoto({ eventId: event.id, file });
        return db.eventPhoto.create({
          data: {
            eventId: event.id,
            category,
            title: file.name.replace(/\.[^.]+$/, ""),
            originalUrl: url,
            thumbnailUrl: url,
          },
        });
      }),
    );

    return NextResponse.json({ success: true, count: photos.length, data: photos });
  } catch (error) {
    console.error("Photographer upload error:", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
