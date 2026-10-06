export type PresignedUploadKind = "image" | "audio" | "video" | "theme-video" | "demo-media";

const SERVER_UPLOAD_FALLBACK_MAX_SIZE = 4 * 1024 * 1024;
const SIGNATURE_TIMEOUT_MS = 20_000;
const DIRECT_UPLOAD_TIMEOUT_MS = 180_000;
const SERVER_UPLOAD_TIMEOUT_MS = 45_000;

type PresignedUploadResponse = {
  success?: boolean;
  error?: string;
  data?: {
    uploadUrl?: string;
    url?: string;
    headers?: Record<string, string>;
  };
};

type ServerUploadResponse = {
  success?: boolean;
  error?: string;
  url?: string;
  data?: {
    url?: string;
  };
};

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadFileThroughServer({
  file,
  kind,
  eventId,
}: {
  file: File;
  kind: PresignedUploadKind;
  eventId?: string | null;
}) {
  if (file.size > SERVER_UPLOAD_FALLBACK_MAX_SIZE) {
    throw new Error(
      "Upload direct R2 bloque par le navigateur. Configurez la CORS Policy du bucket R2 pour autoriser PUT avec Content-Type; les fichiers de plus de 4 Mo doivent passer par l'upload direct.",
    );
  }

  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", file);
  if (eventId) formData.append("eventId", eventId);

  const uploadResponse = await fetchWithTimeout("/api/upload", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    body: formData,
  }, SERVER_UPLOAD_TIMEOUT_MS);
  const uploadJson = await uploadResponse.json().catch(() => null) as ServerUploadResponse | null;

  if (!uploadResponse.ok || !uploadJson?.success) {
    throw new Error(uploadJson?.error ?? `Upload serveur R2 impossible (${uploadResponse.status}).`);
  }

  const publicUrl = uploadJson.data?.url ?? uploadJson.url;
  if (!publicUrl) throw new Error("URL publique R2 manquante apres upload serveur.");

  return publicUrl;
}

export async function uploadFileToR2({
  file,
  kind,
  eventId,
}: {
  file: File;
  kind: PresignedUploadKind;
  eventId?: string | null;
}) {
  const contentType = file.type || "application/octet-stream";

  const signatureResponse = await fetchWithTimeout("/api/upload/presigned", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      filename: file.name,
      contentType,
      size: file.size,
      eventId,
    }),
  }, SIGNATURE_TIMEOUT_MS);
  const signatureJson = await signatureResponse.json().catch(() => null) as PresignedUploadResponse | null;

  if (!signatureResponse.ok || !signatureJson?.success) {
    throw new Error(signatureJson?.error ?? "Signature R2 impossible.");
  }

  const uploadUrl = signatureJson.data?.uploadUrl;
  const publicUrl = signatureJson.data?.url;
  if (!uploadUrl || !publicUrl) {
    throw new Error("Réponse R2 incomplète.");
  }

  const signedContentType = signatureJson.data?.headers?.["Content-Type"] ?? contentType;

  try {
    const uploadResponse = await fetchWithTimeout(uploadUrl, {
      method: "PUT",
      mode: "cors",
      headers: { "Content-Type": signedContentType },
      body: file,
    }, DIRECT_UPLOAD_TIMEOUT_MS);

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text().catch(() => "");
      throw new Error(errorBody || `Upload direct R2 impossible (${uploadResponse.status}).`);
    }

    return publicUrl;
  } catch (error) {
    console.warn("Upload direct R2 bloque, tentative de fallback serveur:", error);
    return uploadFileThroughServer({ file, kind, eventId });
  }
}
