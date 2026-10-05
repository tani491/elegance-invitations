export type PresignedUploadKind = "image" | "audio" | "video" | "theme-video" | "demo-media";

type PresignedUploadResponse = {
  success?: boolean;
  error?: string;
  data?: {
    uploadUrl?: string;
    url?: string;
    headers?: Record<string, string>;
  };
};

export async function uploadFileToR2({
  file,
  kind,
  eventId,
}: {
  file: File;
  kind: PresignedUploadKind;
  eventId?: string | null;
}) {
  const signatureResponse = await fetch("/api/upload/presigned", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      eventId,
    }),
  });
  const signatureJson = await signatureResponse.json().catch(() => null) as PresignedUploadResponse | null;

  if (!signatureResponse.ok || !signatureJson?.success) {
    throw new Error(signatureJson?.error ?? "Signature R2 impossible.");
  }

  const uploadUrl = signatureJson.data?.uploadUrl;
  const publicUrl = signatureJson.data?.url;
  if (!uploadUrl || !publicUrl) {
    throw new Error("Réponse R2 incomplète.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: signatureJson.data?.headers ?? { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text().catch(() => "");
    throw new Error(errorBody || `Upload R2 impossible (${uploadResponse.status}).`);
  }

  return publicUrl;
}
