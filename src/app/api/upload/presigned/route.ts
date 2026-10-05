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

function missingR2ConfigurationResponse(missing: string[]) {
  return NextResponse.json(
    {
      success: false,
      error: "Configuration R2 manquante",
      missingVar: missing[0] ?? "UNKNOWN_R2_ENV",
      missing,
    },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function describeR2Error(error: unknown) {
  const maybeAwsError = error as {
    $metadata?: unknown;
    Code?: string;
    code?: string;
    name?: string;
    message?: string;
    stack?: string;
    cause?: unknown;
  };

  return {
    message: error instanceof Error ? error.message : maybeAwsError?.message ?? String(error),
    name: error instanceof Error ? error.name : maybeAwsError?.name,
    code: maybeAwsError?.Code ?? maybeAwsError?.code,
    metadata: maybeAwsError?.$metadata,
    stack: error instanceof Error ? error.stack : maybeAwsError?.stack,
    cause: error instanceof Error ? error.cause : maybeAwsError?.cause,
  };
}

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
      return missingR2ConfigurationResponse(r2Status.missing);
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
    let uploadUrl: string;

    try {
      uploadUrl = await getSignedUrl(
        r2,
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: target.key,
          ContentType: contentType,
        }),
        { expiresIn: 5 * 60 },
      );
    } catch (signatureError) {
      console.error("Erreur Presigned Upload R2 PutObjectCommand:", {
        ...describeR2Error(signatureError),
        bucket: R2_BUCKET_NAME,
        key: target.key,
        kind,
        contentType,
        file,
      });
      return NextResponse.json({ success: false, error: "Signature de televersement R2 impossible." }, { status: 500 });
    }

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
    console.error("Erreur Presigned Upload R2:", describeR2Error(error));
    return NextResponse.json({ success: false, error: "Signature de televersement R2 impossible." }, { status: 500 });
  }
}
