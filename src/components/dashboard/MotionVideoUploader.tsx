"use client";

import { useState } from "react";
import { Film, LockKeyhole, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const MAX_MOTION_VIDEO_SIZE = 50 * 1024 * 1024;
const MOTION_VIDEO_ACCEPT = "video/mp4";

type MotionVideoUploaderProps = {
  value?: string | null;
  eventId?: string | null;
  disabled?: boolean;
  locked?: boolean;
  compact?: boolean;
  onChange: (url: string | null) => Promise<void> | void;
};

function isMp4Video(file: File) {
  return file.type === "video/mp4" || /\.mp4$/i.test(file.name);
}

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} Mo`;
}

export function MotionVideoUploader({
  value,
  eventId,
  disabled,
  locked,
  compact,
  onChange,
}: MotionVideoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFile(file: File) {
    if (!isMp4Video(file)) {
      toast.error("Format non autorise. Ajoutez une video MP4 verticale.");
      return;
    }

    if (file.size > MAX_MOTION_VIDEO_SIZE) {
      toast.error(`Video trop volumineuse. Maximum ${formatMegabytes(MAX_MOTION_VIDEO_SIZE)}.`);
      return;
    }

    setUploading(true);
    setProgress(4);
    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : Math.min(current + 8, 90)));
    }, 550);

    try {
      const formData = new FormData();
      formData.append("kind", "video");
      formData.append("file", file);
      if (eventId) formData.append("eventId", eventId);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        body: formData,
      });
      const uploadJson = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadJson.success) {
        throw new Error(uploadJson.error ?? "Upload R2 impossible.");
      }

      const publicUrl = (uploadJson.data?.url ?? uploadJson.url) as string | undefined;
      if (!publicUrl) throw new Error("URL R2 manquante.");

      setProgress(100);
      await onChange(publicUrl);
      toast.success("Video cinematique synchronisee.");
    } catch (error) {
      console.error("Motion video upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload video impossible.");
    } finally {
      window.clearInterval(progressTimer);
      setUploading(false);
      setProgress(0);
    }
  }

  async function removeVideo() {
    if (!value) return;
    await onChange(null);
    toast.success("Video retiree de l'invitation.");
  }

  const uploadLabel = value ? "Remplacer" : "Uploader";
  const isDisabled = disabled || uploading || locked;

  if (locked) {
    if (compact) {
      return (
        <Badge variant="outline" className="whitespace-nowrap border-[#C5A059]/35 bg-[#C5A059]/10 text-[#8A6A2F]">
          <LockKeyhole className="mr-1.5 size-3" />
          Réservé Motion
        </Badge>
      );
    }

    return (
      <div className="rounded-lg border border-[#D4AF37]/25 bg-[#FDFBF7]/80 p-4 shadow-sm">
        <Badge variant="outline" className="w-fit border-[#C5A059]/35 bg-[#C5A059]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8A6A2F]">
          <LockKeyhole className="mr-1.5 size-3.5" />
          Réservé à la formule Cinématique Motion
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="min-w-[230px] space-y-2">
        <div className="flex items-center gap-3">
          <div className="grid h-24 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#D6C5A8] bg-[#171312]">
            {value ? (
              <video src={value} muted playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <Film className="size-5 text-[#B89248]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Badge variant="outline" className="border-[#C5A059]/45 text-[#8A6A2F]">Motion 9:16</Badge>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {value ? "Video active" : "Aucune video"}
            </p>
          </div>
        </div>
        {uploading && <Progress value={progress} className="h-1.5" />}
        <div className="grid grid-cols-2 gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#D6C5A8] bg-white px-3 text-xs font-medium text-[#2A211A] transition hover:bg-[#FFF8EA] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
            {value ? <RefreshCw className="size-3.5" /> : <UploadCloud className="size-3.5" />}
            <span>{uploading ? "Upload..." : uploadLabel}</span>
            <Input
              type="file"
              accept={MOTION_VIDEO_ACCEPT}
              className="hidden"
              disabled={isDisabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadFile(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
            disabled={isDisabled || !value}
            onClick={() => void removeVideo()}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Retirer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#D4AF37]/25 bg-white/75 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-[#2A211A]">
            Video Cinematique Personnalisee (MP4 vertical 9:16)
          </Label>
          <p className="text-sm text-muted-foreground">
            Film motion reel de 60 secondes, stocke dans Cloudflare R2 sous motion-videos/.
          </p>
        </div>
        <Badge className="w-fit rounded-full border border-[#C5A059]/45 bg-[#C5A059]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#8A6A2F]">
          Motion 9:16
        </Badge>
      </div>

      {value ? (
        <div className="grid gap-4 sm:grid-cols-[112px_1fr] sm:items-center">
          <video
            src={value}
            muted
            controls
            playsInline
            preload="metadata"
            className="aspect-[9/16] w-28 rounded-lg border border-[#D6C5A8] bg-black object-cover shadow-sm"
          />
          <div className="min-w-0 space-y-3">
            <div className="rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] px-3 py-2 text-xs text-muted-foreground">
              <span className="break-all">{value}</span>
            </div>
            {uploading && <Progress value={progress} className="h-2" />}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#D6C5A8] bg-white px-4 text-sm font-medium text-[#2A211A] transition hover:bg-[#FFF8EA] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                <RefreshCw className="size-4 text-[#B89248]" />
                <span>{uploading ? "Upload en cours..." : "Remplacer la video"}</span>
                <Input
                  type="file"
                  accept={MOTION_VIDEO_ACCEPT}
                  className="hidden"
                  disabled={isDisabled}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={isDisabled}
                onClick={() => void removeVideo()}
              >
                <Trash2 className="mr-2 size-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D4AF37]/40 bg-[#FDFBF7] p-5 text-center transition hover:border-[#B89248] hover:bg-[#FFF8EA] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          <UploadCloud className="mb-3 size-8 text-[#B89248]" />
          <span className="font-medium text-[#2A211A]">
            {uploading ? `Televersement... ${progress}%` : "Ajouter le film cinematique MP4"}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            Vertical 9:16, MP4, {formatMegabytes(MAX_MOTION_VIDEO_SIZE)} maximum.
          </span>
          {uploading && <Progress value={progress} className="mt-4 h-2 max-w-sm" />}
          <Input
            type="file"
            accept={MOTION_VIDEO_ACCEPT}
            className="hidden"
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadFile(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
