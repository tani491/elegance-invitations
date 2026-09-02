const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_STORAGE_BUCKETS = {
  weddingPhotos: "wedding-photos",
  themeVideos: "theme-videos",
} as const;

export function isSupabaseStorageConfigured() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

export async function uploadToSupabaseStorage({
  bucket,
  objectPath,
  file,
}: {
  bucket: string;
  objectPath: string;
  file: File;
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
      "Cache-Control": "31536000",
      "x-upsert": "true",
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
  };
}
