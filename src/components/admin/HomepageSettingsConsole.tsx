"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, MonitorSmartphone, Save, Trash2, Upload, Video } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { HOMEPAGE_MEDIA_BUCKET, HOMEPAGE_MEDIA_FOLDER } from "@/lib/homepage-settings-shared";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import type { HomepageSettings } from "@/types/database.types";

type HomepageMediaSlot = "heroPhone1" | "heroPhone2";

const DEFAULT_SETTINGS: HomepageSettings = {
  heroPhone1: null,
  heroPhone2: null,
  updatedAt: null,
};

const HOMEPAGE_MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm,video/mov";
const MAX_HOMEPAGE_MEDIA_SIZE = 50 * 1024 * 1024;
const HOMEPAGE_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/mov",
]);
const HOMEPAGE_MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif", "mp4", "mov", "webm"]);

const MEDIA_SLOTS: {
  key: HomepageMediaSlot;
  title: string;
  description: string;
}[] = [
  {
    key: "heroPhone1",
    title: "iPhone principal",
    description: "Vidéo d'ouverture, sceau doré ou capture immersive au premier plan.",
  },
  {
    key: "heroPhone2",
    title: "iPhone secondaire",
    description: "Programme, compte à rebours ou vue détaillée du faire-part.",
  },
];

function sanitizeStorageFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function isVideoMedia(src?: string | null) {
  return Boolean(src && /\.(mp4|mov|webm)(\?|$)/i.test(src));
}

function isSupportedHomepageMedia(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return HOMEPAGE_MEDIA_MIME_TYPES.has(file.type) || Boolean(extension && HOMEPAGE_MEDIA_EXTENSIONS.has(extension));
}

function HomepageMediaPreview({ src }: { src?: string | null }) {
  if (!src) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(145deg,#19110f,#4a2c17_52%,#d4af37)] text-center text-white">
        <MonitorSmartphone className="mb-3 size-9 text-[#F3D88D]" />
        <p className="px-5 text-xs uppercase tracking-[0.2em] text-white/80">Fallback luxe actif</p>
      </div>
    );
  }

  if (isVideoMedia(src)) {
    return (
      <video
        src={src}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return <img src={src} alt="Aperçu média accueil" className="h-full w-full object-cover" />;
}

export default function HomepageSettingsConsole() {
  const router = useRouter();
  const [settings, setSettings] = useState<HomepageSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<HomepageSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<HomepageMediaSlot | "manual" | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<HomepageMediaSlot | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<HomepageMediaSlot, number>>({
    heroPhone1: 0,
    heroPhone2: 0,
  });

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Chargement des réglages impossible.");
        return;
      }

      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...json.data,
      };
      setSettings(nextSettings);
      setDraft(nextSettings);
    } catch (error) {
      console.error("Homepage settings load error:", error);
      toast.error("Chargement des réglages impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadSettings();
    });
  }, []);

  async function saveSettings(data: Partial<HomepageSettings>, successMessage: string, slot: HomepageMediaSlot | "manual" = "manual") {
    setSaving(slot);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Sauvegarde impossible.");
        return false;
      }

      const nextSettings = {
        ...DEFAULT_SETTINGS,
        ...json.data,
      };
      setSettings(nextSettings);
      setDraft(nextSettings);
      router.refresh();
      toast.success(successMessage);
      return true;
    } catch (error) {
      console.error("Homepage settings save error:", error);
      toast.error("Sauvegarde impossible.");
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function uploadMedia(slot: HomepageMediaSlot, file: File) {
    setUploadingSlot(slot);
    setUploadProgress((prev) => ({ ...prev, [slot]: 1 }));

    const progressTimer = window.setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[slot] ?? 1;
        if (current >= 90) return prev;
        return { ...prev, [slot]: Math.min(current + 8, 90) };
      });
    }, 550);

    try {
      if (file.size > MAX_HOMEPAGE_MEDIA_SIZE) {
        toast.error("Media trop volumineux. Compressez-le avant l'upload (maximum 50 Mo).");
        return;
      }

      if (!isSupportedHomepageMedia(file)) {
        toast.error("Format non autorise. Utilisez JPG, PNG, WEBP, HEIC, MP4, MOV ou WEBM.");
        return;
      }

      const filePath = `${HOMEPAGE_MEDIA_FOLDER}/${Date.now()}_${sanitizeStorageFilename(file.name)}`;
      const signatureResponse = await fetch("/api/admin/settings/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
      const signatureJson = await signatureResponse.json();

      if (!signatureResponse.ok || !signatureJson.success) {
        toast.error(signatureJson.error ?? "Signature Supabase impossible.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage.from(HOMEPAGE_MEDIA_BUCKET).uploadToSignedUrl(
        signatureJson.data.path,
        signatureJson.data.token,
        file,
        {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: true,
        },
      );

      if (error) {
        console.error("Erreur upload Supabase homepage:", error);
        toast.error(error.message);
        return;
      }

      setUploadProgress((prev) => ({ ...prev, [slot]: 100 }));
      const { data } = supabase.storage.from(HOMEPAGE_MEDIA_BUCKET).getPublicUrl(signatureJson.data.path);
      setDraft((prev) => ({ ...prev, [slot]: data.publicUrl }));
      await saveSettings({ [slot]: data.publicUrl }, "Média de la page d'accueil sauvegardé.", slot);
    } catch (error) {
      console.error("Erreur upload Supabase homepage:", error);
      toast.error(error instanceof Error ? error.message : "Upload impossible.");
    } finally {
      window.clearInterval(progressTimer);
      setUploadingSlot(null);
      setUploadProgress((prev) => ({ ...prev, [slot]: 0 }));
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F2EA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Button asChild variant="ghost" className="-ml-3 mb-3 text-[#5C1D24] hover:bg-[#E5D9C7]/45">
              <Link href="/admin">
                <ArrowLeft className="mr-2 size-4" />
                Retour admin
              </Link>
            </Button>
            <p className="text-xs uppercase tracking-[0.24em] text-[#B89248]">Accueil public</p>
            <h1 className="font-display-bold text-3xl tracking-luxury text-[#171312]">Réglages du hero</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Changez les deux médias affichés dans les mockups iPhone de la page d'accueil sans déployer de code.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-[#D6C5A8] bg-white/70 px-3 py-1 text-[#5C1D24]">
            {loading ? "Chargement" : "Synchronisé"}
          </Badge>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {MEDIA_SLOTS.map((slot) => {
            const src = draft[slot.key];
            const isUploading = uploadingSlot === slot.key;
            const progress = uploadProgress[slot.key] ?? 0;

            return (
              <Card key={slot.key} className="overflow-hidden rounded-2xl border-[#E5D9C7] bg-white/90 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-[#171312]">
                      {isVideoMedia(src) ? <Video className="size-5 text-[#B89248]" /> : <ImageIcon className="size-5 text-[#B89248]" />}
                      {slot.title}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{slot.description}</p>
                  </div>
                  {src && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Actif</Badge>}
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="mx-auto w-full max-w-[220px] rounded-[2rem] border-[10px] border-[#171312] bg-[#171312] p-2 shadow-2xl">
                    <div className="mx-auto mb-2 h-4 w-20 rounded-full bg-white/10" />
                    <div className="relative aspect-[9/16] overflow-hidden rounded-[1.35rem] bg-[#0D0B0A]">
                      <HomepageMediaPreview src={src} />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent" />
                    </div>
                    <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-white/[0.18]" />
                  </div>

                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#D6C5A8] bg-[#FDFBF7] p-4 text-center transition hover:border-[#B89248] hover:bg-[#FAF6EF]">
                    <Upload className="mb-2 size-6 text-[#B89248]" />
                    <span className="text-sm font-semibold text-[#171312]">
                      {isUploading ? `Téléversement en cours... ${progress || 1}%` : "Uploader un média"}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      JPG, PNG, WEBP, HEIC, MP4, MOV ou WEBM - 50 Mo max
                    </span>
                    {isUploading && <Progress value={progress || 1} className="mt-4 h-2" />}
                    <Input
                      type="file"
                      accept={HOMEPAGE_MEDIA_ACCEPT}
                      className="hidden"
                      disabled={isUploading || saving === slot.key}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.currentTarget.value = "";
                        if (file) void uploadMedia(slot.key, file);
                      }}
                    />
                  </label>

                  <div className="space-y-2">
                    <Label htmlFor={`${slot.key}-url`}>URL media</Label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        id={`${slot.key}-url`}
                        value={draft[slot.key] ?? ""}
                        onChange={(event) => setDraft((prev) => ({ ...prev, [slot.key]: event.target.value }))}
                        placeholder="https://..."
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 border-[#D6C5A8]"
                        disabled={saving !== null}
                        onClick={() => void saveSettings({ [slot.key]: draft[slot.key] || null }, "URL média sauvegardée.")}
                      >
                        <Save className="mr-2 size-4" />
                        Sauver
                      </Button>
                    </div>
                  </div>

                  {settings[slot.key] && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-red-700 hover:bg-red-50 hover:text-red-800"
                      disabled={saving !== null}
                      onClick={() => void saveSettings({ [slot.key]: null }, "Média retiré de la page d'accueil.", slot.key)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Retirer ce média
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
