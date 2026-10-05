import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse, type NextRequest } from "next/server";
import { getR2ConfigurationStatus, R2_BUCKET_NAME, r2, r2PublicUrlForKey } from "@/lib/r2";
import { extensionForUpload, keyForUpload, normalizeUploadKind, validateUploadFile } from "@/lib/r2-upload";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

type PresignedUploadRequest = {
  kind?: unknown;
  filename?: unknown;
  name?: unknown;
  contentType?: unknown;
  type?: unknown;
  size?: unknown;
  eventId?: unknown;
};

function fileDescriptorFromBody(body: PresignedUploadRequest) {
  const name = typeof body.filename === "string"
    ? body.filename
    : typeof body.name === "string"
      ? body.name
      : "media";
  const type = typeof body.contentType === "string"
    ? body.contentType
    : typeof body.type === "string"
      ? body.type
      : "";
  const size = typeof body.size === "number" ? body.size : Number(body.size);

  return {
    name,
    type,
    size,
  };
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT]);
  if (!session) return response;

  try {
    const r2Status = getR2ConfigurationStatus();
    if (!r2Status.configured) {
      return NextResponse.json(
        {
          success: false,
          error: `Configuration Cloudflare R2 incomplete. Variables manquantes: ${r2Status.missing.join(", ")}.`,
          missing: r2Status.missing,
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const body = await request.json().catch(() => null) as PresignedUploadRequest | null;
    if (!body) {
      return NextResponse.json({ success: false, error: "Requete upload invalide." }, { status: 400 });
    }

    const file = fileDescriptorFromBody(body);
    const kind = normalizeUploadKind(body.kind, file);
    if (!kind) {
      return NextResponse.json({ success: false, error: "Type de media non autorise." }, { status: 400 });
    }

    const extension = extensionForUpload(file);
    const validationError = validateUploadFile(kind, file, extension);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const eventId = typeof body.eventId === "string" ? body.eventId : null;
    const target = await keyForUpload({ kind, file, extension, eventId, session });
    if ("error" in target) {
      return NextResponse.json({ success: false, error: target.error }, { status: target.status });
    }

    const contentType = file.type || "application/octet-stream";
    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: target.key,
        ContentType: contentType,
      }),
      { expiresIn: 5 * 60 },
    );
    const url = r2PublicUrlForKey(target.key);

    return NextResponse.json(
      {
        success: true,
        data: {
          uploadUrl,
          url,
          headers: {
            "Content-Type": contentType,
          },
          key: target.key,
          storage: "r2",
          bucket: R2_BUCKET_NAME,
          expiresIn: 5 * 60,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erreur Presigned Upload R2:", {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    });
    return NextResponse.json({ success: false, error: "Signature de televersement R2 impossible." }, { status: 500 });
  }
}
