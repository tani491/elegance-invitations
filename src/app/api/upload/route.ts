import { Buffer } from "node:buffer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse, type NextRequest } from "next/server";
import { getR2ConfigurationStatus, R2_BUCKET_NAME, r2, r2PublicUrlForKey } from "@/lib/r2";
import { extensionForUpload, keyForUpload, normalizeUploadKind, UPLOAD_CACHE_CONTROL, validateUploadFile } from "@/lib/r2-upload";
import { requireApiRole } from "@/lib/server-auth";
import { AUTH_ROLES } from "@/types/database.types";

export const runtime = "nodejs";

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

export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN, AUTH_ROLES.CLIENT]);
  if (!session) return response;

  try {
    const r2Status = getR2ConfigurationStatus();
    if (!r2Status.configured) {
      return missingR2ConfigurationResponse(r2Status.missing);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni." }, { status: 400 });
    }

    const kind = normalizeUploadKind(formData.get("kind"), file);
    if (!kind) {
      return NextResponse.json({ success: false, error: "Type de media non autorise." }, { status: 400 });
    }

    const extension = extensionForUpload(file);
    const validationError = validateUploadFile(kind, file, extension);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const eventIdValue = formData.get("eventId");
    const eventId = typeof eventIdValue === "string" ? eventIdValue : null;
    const target = await keyForUpload({ kind, file, extension, eventId, session });
    if ("error" in target) {
      return NextResponse.json({ success: false, error: target.error }, { status: target.status });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const contentType = file.type || "application/octet-stream";

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: target.key,
          Body: buffer,
          ContentType: contentType,
          CacheControl: UPLOAD_CACHE_CONTROL,
        }),
      );
    } catch (uploadError) {
      console.error("Erreur Upload R2 PutObjectCommand:", {
        ...describeR2Error(uploadError),
        bucket: R2_BUCKET_NAME,
        key: target.key,
        kind,
        contentType,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
        },
      });
      return NextResponse.json({ success: false, error: "Echec du televersement R2" }, { status: 500 });
    }

    const url = r2PublicUrlForKey(target.key);

    return NextResponse.json(
      {
        success: true,
        url,
        data: {
          url,
          type: file.type,
          size: file.size,
          name: file.name,
          storage: "r2",
          bucket: R2_BUCKET_NAME,
          path: target.key,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Erreur Upload R2:", describeR2Error(error));
    return NextResponse.json({ success: false, error: "Echec du televersement R2" }, { status: 500 });
  }
}
