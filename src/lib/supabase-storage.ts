import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_STORAGE_BUCKETS = {
  weddingPhotos: "wedding-photos",
  music: "gallery-photos",
  themeVideos: "theme-videos",
  motionVideos: "theme-videos",
} as const;

export function isSupabaseStorageConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export async function uploadToSupabaseStorage({
  bucket,
  objectPath,
  file,
  cacheControl = "31536000",
  upsert = true,
}: {
  bucket: string;
  objectPath: string;
  file: File;
  cacheControl?: string;
  upsert?: boolean;
}) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase Storage is not configured.");
  }

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`;
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": file.type || "application/octet-stream",
      "Cache-Control": cacheControl,
      "x-upsert": String(upsert),
    },
    body: Buffer.from(await file.arrayBuffer()),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `Supabase upload failed with ${response.status}.`);
  }

  return {
    url: `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`,
    storage: "supabase" as const,
    bucket,
    path: objectPath,
  };
}

export async function uploadToFirstAvailableSupabaseStorage({
  buckets,
  objectPath,
  file,
  cacheControl,
  upsert,
}: {
  buckets: string[];
  objectPath: string;
  file: File;
  cacheControl?: string;
  upsert?: boolean;
}) {
  let lastError: unknown = null;

  for (const bucket of buckets) {
    try {
      return await uploadToSupabaseStorage({
        bucket,
        objectPath,
        file,
        cacheControl,
        upsert,
      });
    } catch (error) {
      lastError = error;
      console.error(`Supabase Storage upload failed for bucket ${bucket}:`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Supabase upload failed.");
}
