"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Upload, X, EyeOff, Eye, Image as ImageIcon, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface EventInfo {
  id: string;
  name: string;
  brideName: string | null;
  groomName: string | null;
  eventDate: string | null;
  venueName: string | null;
}

interface AlbumPhoto {
  id: string;
  category: string;
  title: string | null;
  originalUrl: string | null;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const ALBUMS = [
  { key: "preparatifs", label: "Préparatifs" },
  { key: "ceremonie", label: "Cérémonie" },
  { key: "mairie", label: "Mairie" },
  { key: "cocktail", label: "Cocktail" },
  { key: "soiree", label: "Soirée" },
] as const;

type AlbumKey = (typeof ALBUMS)[number]["key"];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface SelectedFile {
  file: File;
  id: string;
  preview: string;
}

function generateId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function ErrorScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="card-luxury max-w-md w-full p-8 text-center"
      >
        <div
          className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "#dc262618" }}
        >
          <X className="size-7" style={{ color: "#dc2626" }} />
        </div>
        <h2 className="font-display-bold text-xl text-[#1A1818] mb-2">
          Lien invalide
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Le jeton d&apos;accès fourni n&apos;est pas reconnu. Veuillez vérifier
          le lien qui vous a été envoyé ou contacter l&apos;organisateur de
          l&apos;événement.
        </p>
        <Button
          variant="outline"
          className="mt-6 btn-luxury"
          onClick={() => router.push("/")}
        >
          Retour à l&apos;accueil
        </Button>
      </motion.div>
    </div>
  );
}

/* ========================================================================== */
/*  Page                                                                      */
/* ========================================================================== */

export default function PhotographerPortal() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  /* ---- State ---- */
  const [validationState, setValidationState] = useState<
    "loading" | "valid" | "invalid" | "error"
  >("loading");
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<AlbumKey>(ALBUMS[0].key);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [galleryVisible, setGalleryVisible] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<AlbumPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  /* ---- Token validation via API ---- */
  useEffect(() => {
    if (!token) {
      queueMicrotask(() => setValidationState("invalid"));
      return;
    }

    async function validate() {
      try {
        const res = await fetch(`/api/photographer/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.valid && data.event) {
          setEvent(data.event);
          setValidationState("valid");
        } else {
          setValidationState("invalid");
        }
      } catch {
        setValidationState("error");
      }
    }

    queueMicrotask(() => {
      void validate();
    });
  }, [token]);

  /* ---- Fetch existing photos for the active album ---- */
  useEffect(() => {
    if (validationState !== "valid" || !event) return;

    async function fetchPhotos() {
      setLoadingPhotos(true);
      try {
        const res = await fetch(
          `/api/photographer/photos?token=${encodeURIComponent(token)}&category=${encodeURIComponent(activeAlbum)}`,
        );
        if (res.ok) {
          const json = await res.json();
          setExistingPhotos(json.success && Array.isArray(json.data) ? json.data : []);
        }
      } catch {
        /* silently fail — gallery just stays empty */
      }
      setLoadingPhotos(false);
    }

    fetchPhotos();
  }, [validationState, event, activeAlbum]);

  /* ---- File handling ---- */
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles: SelectedFile[] = [];
    const filesArray = Array.from(incoming);

    for (const file of filesArray) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 15 * 1024 * 1024) continue;
      const preview = URL.createObjectURL(file);
      newFiles.push({ file, id: generateId(), preview });
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    setSelectedFiles((prev) => {
      prev.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
  }, []);

  /* ---- Drag & drop ---- */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  /* ---- Upload handler ---- */
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("category", activeAlbum);
      selectedFiles.forEach((selectedFile) => {
        formData.append("files", selectedFile.file);
      });

      const res = await fetch("/api/photographer/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const count = selectedFiles.length;
        const albumLabel =
          ALBUMS.find((a) => a.key === activeAlbum)?.label ?? activeAlbum;

        toast.success(
          `${count} photo${count > 1 ? "s" : ""} ajoutée${count > 1 ? "s" : ""} à l'album « ${albumLabel} »`,
          {
            description: "Les photos sont maintenant visibles dans la galerie.",
            duration: 5000,
          },
        );
        clearAllFiles();
        setExistingPhotos((prev) => [...data.data, ...prev]);
      } else {
        toast.error("Erreur lors de l'envoi", {
          description: data.error || "Veuillez réessayer.",
        });
      }
    } catch {
      toast.error("Erreur réseau", {
        description: "Vérifiez votre connexion et réessayez.",
      });
    }

    setUploading(false);
  };

  async function deletePhoto(photoId: string) {
    const res = await fetch("/api/photographer/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, photoId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      toast.error(data.error ?? "Suppression impossible.");
      return;
    }
    setExistingPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    toast.success("Photo supprimee.");
  }

  /* ==== Conditional renders ==== */

  /* Loading */
  if (validationState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div
            className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "#D4AF3740", borderTopColor: "#D4AF37" }}
          />
          <p className="text-sm text-muted-foreground font-body">
            Vérification de l&apos;accès…
          </p>
        </motion.div>
      </div>
    );
  }

  /* Invalid / error */
  if (validationState === "invalid" || validationState === "error") {
    return <ErrorScreen />;
  }

  /* Couple name display */
  const coupleName =
    event?.brideName && event?.groomName
      ? `${event.brideName} & ${event.groomName}`
      : event?.name ?? "";

  const formattedDate = event?.eventDate
    ? new Date(event.eventDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  /* ---- Main render ---- */
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* ---- Header ---- */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: "#FAF7F2", borderColor: "#D4AF3730" }}
      >
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <a
            href="/"
            className="font-display-bold text-xl tracking-wider text-[#5C1D24]"
          >
            Élégance
          </a>

          <h1 className="hidden sm:block font-display-bold tracking-luxury text-base text-[#1A1818]">
            Espace Photographe Officiel
          </h1>

          <div className="w-20" />
        </div>
      </header>

      {/* ---- Main content ---- */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        {/* Event info card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card-luxury-elevated mb-8 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Espace Photographe Officiel
              </p>
              <h2 className="font-display-bold text-xl tracking-luxury text-[#1A1818]">
                Mariage de {coupleName}
              </h2>
              {formattedDate && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {formattedDate}
                </p>
              )}
            </div>
            {event?.venueName && (
              <Badge
                className="self-start rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "#D4AF3718",
                  color: "#5C1D24",
                  borderColor: "#D4AF3740",
                }}
              >
                {event.venueName}
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Mobile title */}
        <h1 className="sm:hidden font-display-bold tracking-luxury text-lg text-[#1A1818] mb-6 text-center">
          Espace Photographe Officiel
        </h1>

        {/* ---- Album selector ---- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Albums
            </p>
            {existingPhotos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {existingPhotos.length} photo{existingPhotos.length > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ALBUMS.map((album, i) => {
              const count = 0; /* could add per-album counts */
              return (
                <motion.button
                  key={album.key}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.35,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onClick={() => setActiveAlbum(album.key)}
                  className={
                    "relative rounded-lg px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-200 " +
                    (activeAlbum === album.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-white text-[#1A1818] border hover:border-[#D4AF37] hover:bg-[#D4AF3708]")
                  }
                  style={
                    activeAlbum !== album.key
                      ? { borderColor: "#D4AF3730" }
                      : undefined
                  }
                >
                  {album.label}
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ---- Existing photos gallery ---- */}
        {existingPhotos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Galerie existante
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {existingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-lg overflow-hidden border aspect-square"
                  style={{
                    borderColor: "#D4AF3725",
                    backgroundColor: "#1A181808",
                  }}
                >
                  {photo.thumbnailUrl || photo.originalUrl ? (
                    <img
                      src={photo.thumbnailUrl || photo.originalUrl || ""}
                      alt={photo.title || ""}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center">
                      <ImageIcon className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {photo.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-[11px] text-white truncate">{photo.title}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => void deletePhoto(photo.id)}
                    className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-md transition hover:bg-[#dc2626] group-hover:opacity-100"
                    aria-label={`Supprimer ${photo.title ?? "la photo"}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ---- Dropzone ---- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.18,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <div
            ref={dropzoneRef}
            role="button"
            tabIndex={0}
            aria-label="Zone de dépôt de photos"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={
              "card-luxury flex flex-col items-center justify-center gap-4 rounded-xl p-10 sm:p-16 cursor-pointer transition-all duration-300 " +
              (isDragOver
                ? "border-2 border-dashed border-[#D4AF37] bg-[#D4AF3708]"
                : "border-2 border-dashed border-[#D4AF3740] hover:border-[#D4AF37] hover:bg-[#D4AF3704]")
            }
          >
            <motion.div
              animate={isDragOver ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex size-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: "#D4AF3712" }}
            >
              {isDragOver ? (
                <Upload className="size-7" style={{ color: "#D4AF37" }} />
              ) : (
                <Camera className="size-7" style={{ color: "#D4AF37" }} />
              )}
            </motion.div>

            <div className="text-center">
              <p className="font-display-bold text-lg text-[#1A1818]">
                {isDragOver
                  ? "Déposez vos photos ici"
                  : "Glissez vos photos ici ou cliquez pour sélectionner"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG, WebP, AVIF — jusqu&apos;à 15 Mo par fichier
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  addFiles(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </motion.section>

        {/* ---- Selected files preview ---- */}
        <AnimatePresence>
          {selectedFiles.length > 0 && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {selectedFiles.length} photo
                  {selectedFiles.length > 1 ? "s" : ""} sélectionnée
                  {selectedFiles.length > 1 ? "s" : ""}
                </p>
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="text-xs text-[#dc2626] hover:underline font-medium transition-colors"
                >
                  Tout supprimer
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {selectedFiles.map((sf, i) => (
                  <motion.div
                    key={sf.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="group relative rounded-lg overflow-hidden border"
                    style={{
                      borderColor: "#D4AF3725",
                      backgroundColor: "#1A181808",
                    }}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={sf.preview}
                        alt={sf.file.name}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(sf.id);
                        }}
                        className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#dc2626]"
                        aria-label={`Supprimer ${sf.file.name}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="px-2 py-1.5">
                      <p className="text-[11px] text-muted-foreground truncate">
                        {sf.file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {(sf.file.size / (1024 * 1024)).toFixed(1)} Mo
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ---- Gallery visibility toggle ---- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.25,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-8"
        >
          <Card className="card-luxury">
            <CardContent className="flex items-center justify-between p-4 sm:p-5">
              <div className="flex items-center gap-3">
                {galleryVisible ? (
                  <Eye className="size-5" style={{ color: "#D4AF37" }} />
                ) : (
                  <EyeOff className="size-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-[#1A1818]">
                    {galleryVisible
                      ? "Galerie visible"
                      : "Galerie masquée"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {galleryVisible
                      ? "Les invités peuvent voir cet album"
                      : "Cet album est invisible pour les invités"}
                  </p>
                </div>
              </div>
              <Switch
                checked={galleryVisible}
                onCheckedChange={setGalleryVisible}
                aria-label={
                  galleryVisible
                    ? "Masquer la galerie"
                    : "Publier la galerie"
                }
              />
            </CardContent>
          </Card>
        </motion.section>

        {/* ---- Upload button ---- */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Button
            disabled={selectedFiles.length === 0 || uploading}
            onClick={handleUpload}
            className={
              "btn-luxury w-full sm:w-auto min-w-[240px] h-12 text-sm font-semibold tracking-wider uppercase " +
              (selectedFiles.length === 0 || uploading
                ? "opacity-50 cursor-not-allowed"
                : "")
            }
          >
            {uploading ? (
              <>
                <div
                  className="mr-2 size-4 animate-spin rounded-full border-2 border-t-transparent"
                  style={{
                    borderColor: "#FAF7F240",
                    borderTopColor: "#FAF7F2",
                  }}
                />
                Envoi en cours…
              </>
            ) : (
              <>
                <Upload className="mr-2 size-4" />
                Uploader {selectedFiles.length} photo
                {selectedFiles.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </motion.section>
      </main>

      {/* ---- Footer ---- */}
      <footer
        className="mt-auto border-t py-6 text-center"
        style={{ borderColor: "#D4AF3720", backgroundColor: "#FAF7F2" }}
      >
        <p className="text-xs text-muted-foreground tracking-wide">
          © 2026 Élégance — Portail Photographe
        </p>
      </footer>
    </div>
  );
}
