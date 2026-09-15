"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  ExternalLink,
  FileText,
  LogOut,
  MessageCircle,
  Music2,
  Plus,
  Save,
  ScanLine,
  Send,
  Trash2,
  UploadCloud,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CameraScanner } from "@/components/dashboard/CameraScanner";
import { GuestTable } from "@/components/dashboard/GuestTable";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { LiveMobilePreview } from "@/components/dashboard/LiveMobilePreview";
import { MotionVideoUploader } from "@/components/dashboard/MotionVideoUploader";
import { ThemeSelector } from "@/components/dashboard/ThemeSelector";
import { canUseMotionVideo, photoLimitForPlan, planLabelForPlan } from "@/lib/plan-gating";
import { subscribeThemeCatalogChanges } from "@/lib/theme-sync";
import type { PublicEventPayload, ThemeConfig } from "@/types/database.types";

interface Guest {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  rsvpStatus: string;
  isVip: boolean;
  isCheckedIn: boolean;
  qrToken: string;
}

const MUSIC_PRESETS = [
  { label: "Piano Romantique", url: "/music/presets/piano-romantique.wav" },
  { label: "Harpe Royale", url: "/music/presets/harpe-royale.wav" },
  { label: "Violon & Violoncelle", url: "/music/presets/violon-violoncelle.wav" },
  { label: "Kora Traditionnelle Royale", url: "/music/presets/kora-royale.wav" },
  { label: "Acoustique Douce", url: "/music/presets/acoustique-douce.wav" },
] as const;

const NO_MUSIC_VALUE = "__none__";
const CUSTOM_MUSIC_VALUE = "__custom__";

function normalizePhotoList(photos: Array<string | null | undefined>, limit: number) {
  return Array.from(new Set(photos.filter(Boolean) as string[])).slice(0, limit);
}

function musicSelectValue(musicUrl: string | null | undefined) {
  if (!musicUrl) return NO_MUSIC_VALUE;
  return MUSIC_PRESETS.some((preset) => preset.url === musicUrl) ? musicUrl : CUSTOM_MUSIC_VALUE;
}

export default function DashboardPage() {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEventPayload | null>(null);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [uploadingPhotoIndex, setUploadingPhotoIndex] = useState<number | null>(null);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    isVip: false,
  });

  const stats = useMemo(() => ({
    total: guests.length,
    confirmed: guests.filter((guest) => guest.rsvpStatus === "confirmed").length,
    checkedIn: guests.filter((guest) => guest.isCheckedIn).length,
  }), [guests]);

  async function loadDashboard() {
    const [eventResult, themesResult] = await Promise.allSettled([
      fetch("/api/dashboard/event").then((response) => response.json()),
      fetch("/api/themes", { cache: "no-store" }).then((response) => response.json()),
    ]);

    if (eventResult.status === "fulfilled" && eventResult.value.success) {
      setEvent(eventResult.value.data.event);
      setGuests(eventResult.value.data.guests ?? []);
    } else {
      console.error("Dashboard event load failed:", eventResult);
    }

    if (themesResult.status === "fulfilled" && themesResult.value.success) {
      setThemes(themesResult.value.data ?? []);
    } else {
      console.error("Theme catalog load failed:", themesResult);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      setOrigin(window.location.origin);
      loadDashboard().catch(() => toast.error("Impossible de charger votre espace."));
    });
    return subscribeThemeCatalogChanges(() => {
      loadDashboard().catch(() => undefined);
    });
  }, []);

  async function updateEvent(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Sauvegarde impossible.");
        return;
      }
      setEvent(json.data.event);
      setGuests(json.data.guests);
      toast.success("Modifications sauvegardees.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEssentialEvent() {
    if (!event) return;
    await updateEvent({
      brideName: event.brideName,
      groomName: event.groomName,
      eventDate: event.eventDate,
      eventTime: event.eventTime,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      venueMapUrl: event.venueMapUrl,
      dressCode: event.dressCode,
      coupleStory: event.coupleStory,
      invitationQuote: event.invitationQuote,
      musicUrl: event.musicUrl,
      motionVideoUrl: event.motionVideoUrl,
      whatsappGroupUrl: event.whatsappGroupUrl,
      program: event.program,
    });
  }

  async function addGuest(eventForm: React.FormEvent) {
    eventForm.preventDefault();
    const response = await fetch("/api/dashboard/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newGuest,
        isVip: Boolean(newGuest.isVip),
        maxGuests: newGuest.isVip ? 2 : 1,
      }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      toast.error(json.error ?? "Invite non ajoute.");
      return;
    }
    setGuests((prev) => [...prev, json.data]);
    setNewGuest({ firstName: "", lastName: "", phone: "", isVip: false });
    toast.success("Invite ajoute avec pass QR individuel.");
  }

  async function scanGuest(qrToken: string) {
    const response = await fetch("/api/dashboard/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken }),
    });
    const json = await response.json();
    if (!response.ok || !json.success) {
      toast.error(json.error ?? "Check-in refuse.");
      return;
    }
    setGuests((prev) => prev.map((guest) => guest.id === json.data.id ? json.data : guest));
    toast.success(json.message ?? "Check-in valide.");
  }

  async function uploadMediaFile(file: File, kind: "image" | "audio") {
    const formData = new FormData();
    formData.append("kind", kind);
    formData.append("file", file);

    const upload = await fetch("/api/uploads", { method: "POST", body: formData });
    const uploadJson = await upload.json();

    if (!upload.ok || !uploadJson.success) {
      throw new Error(uploadJson.error ?? "Upload impossible.");
    }

    return uploadJson.data.url as string;
  }

  async function persistPhotoList(displayPhotos: string[]) {
    if (!event) return;
    const nextPhotos = normalizePhotoList(displayPhotos, photoLimitForPlan(event.planType));
    await updateEvent({
      coverPhotoUrl: nextPhotos[0] ?? null,
      officialPhotoUrls: nextPhotos.slice(1),
    });
  }

  async function addOfficialPhoto(file: File) {
    if (!event) return;
    setUploadingCover(true);
    const previewUrl = URL.createObjectURL(file);
    const photoLimit = photoLimitForPlan(event.planType);
    const currentPhotos = normalizePhotoList(event.officialPhotoUrls ?? [], photoLimit);
    const previewPhotos = normalizePhotoList([...currentPhotos, previewUrl], photoLimit);
    setEvent({
      ...event,
      coverPhotoUrl: previewPhotos[0] ?? previewUrl,
      officialPhotoUrls: previewPhotos,
    });

    try {
      const uploadedUrl = await uploadMediaFile(file, "image");
      const nextPhotos = normalizePhotoList([...currentPhotos, uploadedUrl], photoLimit);
      await persistPhotoList(nextPhotos);
      toast.success("Photo officielle ajoutee.");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload image impossible.");
      setEvent(event);
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingCover(false);
    }
  }

  async function replaceOfficialPhoto(index: number, file: File) {
    if (!event) return;
    const photoLimit = photoLimitForPlan(event.planType);
    const currentPhotos = normalizePhotoList(event.officialPhotoUrls ?? [], photoLimit);
    const previewUrl = URL.createObjectURL(file);
    const previewPhotos = [...currentPhotos];
    previewPhotos[index] = previewUrl;

    setUploadingPhotoIndex(index);
    setEvent({
      ...event,
      coverPhotoUrl: previewPhotos[0] ?? null,
      officialPhotoUrls: previewPhotos,
    });

    try {
      const uploadedUrl = await uploadMediaFile(file, "image");
      const nextPhotos = [...currentPhotos];
      nextPhotos[index] = uploadedUrl;
      await persistPhotoList(nextPhotos);
      toast.success("Photo remplacee.");
    } catch (error) {
      console.error("Image replacement failed:", error);
      toast.error(error instanceof Error ? error.message : "Remplacement impossible.");
      setEvent(event);
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingPhotoIndex(null);
    }
  }

  async function deleteOfficialPhoto(index: number) {
    if (!event) return;
    const photoLimit = photoLimitForPlan(event.planType);
    const currentPhotos = normalizePhotoList(event.officialPhotoUrls ?? [], photoLimit);
    const photo = currentPhotos[index];
    if (!photo || !window.confirm("Supprimer cette photo officielle ?")) return;

    const nextPhotos = currentPhotos.filter((_, photoIndex) => photoIndex !== index);
    setEvent({
      ...event,
      coverPhotoUrl: nextPhotos[0] ?? null,
      officialPhotoUrls: nextPhotos,
    });

    try {
      await persistPhotoList(nextPhotos);
      toast.success("Photo supprimee.");
    } catch (error) {
      console.error("Image delete failed:", error);
      toast.error("Suppression impossible.");
      setEvent(event);
    }
  }

  async function uploadMusicFile(file: File) {
    if (!event) return;

    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|aac|wav)$/i.test(file.name)) {
      toast.error("Format audio non autorise.");
      return;
    }

    setUploadingMusic(true);
    try {
      const uploadedUrl = await uploadMediaFile(file, "audio");
      setEvent({ ...event, musicUrl: uploadedUrl });
      await updateEvent({ musicUrl: uploadedUrl });
      toast.success("Musique d'ambiance mise a jour.");
    } catch (error) {
      console.error("Audio upload failed:", error);
      toast.error(error instanceof Error ? error.message : "Upload audio impossible.");
    } finally {
      setUploadingMusic(false);
    }
  }

  async function copyPublicInvitationLink() {
    const invitationUrl = `${origin}/invitation/${event?.slug ? encodeURIComponent(event.slug) : ""}?open=1`;
    await navigator.clipboard.writeText(invitationUrl);
    toast.success("Lien d'invitation copie.");
  }

  function sharePublicInvitation() {
    if (!event) return;
    const invitationUrl = `${origin}/invitation/${encodeURIComponent(event.slug)}?open=1`;
    const names = `${event.brideName?.trim() || "La Mariée"} & ${event.groomName?.trim() || "Le Marié"}`;
    const text = encodeURIComponent(
      `✨ Mariage de ${names} ✨

Chère famille, chers amis,
Nous avons la joie de vous transmettre notre faire-part officiel.
Touchez le lien ci-dessous pour ouvrir votre enveloppe interactive :

👉 ${invitationUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  }

  if (!event) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">Chargement...</main>;
  }

  const photoLimit = photoLimitForPlan(event.planType);
  const officialPhotos = normalizePhotoList(event.officialPhotoUrls ?? [], photoLimit);
  const publicInvitationUrl = `${origin}/invitation/${encodeURIComponent(event.slug)}?open=1`;
  const selectedMusicValue = musicSelectValue(event.musicUrl);
  const canUploadMotionVideo = canUseMotionVideo(event.planType);
  const planLabel = planLabelForPlan(event.planType);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF7F2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-x-hidden">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-script text-3xl text-[#D4AF37]">{event.brideName ?? "Votre"} & {event.groomName ?? "Mariage"}</p>
            <h1 className="font-display-bold text-3xl tracking-luxury">Espace Maries</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><a href={`/invitation/${encodeURIComponent(event.slug)}?open=1`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 size-4" />Invitation</a></Button>
            <Button variant="outline" onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store" });
              router.push("/login");
            }}>
              <LogOut className="mr-2 size-4" />Sortir
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Invites</p><p className="font-display-bold text-3xl">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">RSVP confirmes</p><p className="font-display-bold text-3xl">{stats.confirmed}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-xs uppercase text-muted-foreground">Check-ins</p><p className="font-display-bold text-3xl">{stats.checkedIn}</p></CardContent></Card>
        </div>

        <Card className="card-luxury mb-6 border-[#D4AF37]/25 bg-white/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5 text-[#B89248]" />
              Diffusion Generale
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <Label>URL publique de l'evenement</Label>
              <div className="mt-2 rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] px-3 py-3 text-sm text-muted-foreground">
                <span className="break-all">{publicInvitationUrl}</span>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
              <Button type="button" variant="outline" onClick={() => void copyPublicInvitationLink()}>
                <Copy className="mr-2 size-4" />
                Copier le lien
              </Button>
              <Button type="button" onClick={sharePublicInvitation} className="bg-[#1f7a4c] text-white hover:bg-[#17643d]">
                <MessageCircle className="mr-2 size-4" />
                Partager sur WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="design" className="space-y-6">
          <TabsList className="flex h-auto flex-wrap">
            <TabsTrigger value="design"><FileText className="mr-2 size-4" />Design</TabsTrigger>
            <TabsTrigger value="infos"><Save className="mr-2 size-4" />Infos</TabsTrigger>
            <TabsTrigger value="guests"><Users className="mr-2 size-4" />Invites</TabsTrigger>
            <TabsTrigger value="scanner"><ScanLine className="mr-2 size-4" />Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="design">
            <div className="grid min-w-0 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="card-luxury min-w-0 overflow-hidden">
                <CardHeader><CardTitle>Editeur de Design & Theme</CardTitle></CardHeader>
                <CardContent className="min-w-0 space-y-5 overflow-hidden p-4 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D4AF37]/20 bg-white/70 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Votre formule</p>
                      <p className="font-display-bold text-xl">{planLabel}</p>
                    </div>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Les cadenas indiquent les modeles reserves aux formules superieures. Les photos sont limitees a {photoLimit} pour votre offre.
                    </p>
                  </div>
                  <ThemeSelector themes={themes} selectedSlug={event.theme?.slug ?? "medina-orientale"} planType={event.planType} onSelect={(themeSlug) => updateEvent({ themeSlug })} />
                  <div className="space-y-2">
                    <Label>Photos officielles ({officialPhotos.length}/{photoLimit})</Label>
                    <ImageUploader
                      disabled={uploadingCover || officialPhotos.length >= photoLimit}
                      label={uploadingCover ? "Upload en cours..." : officialPhotos.length >= photoLimit ? "Limite de formule atteinte" : "Ajouter une image HD"}
                      helper={`Portrait 9:16 recommande. ${planLabel} autorise ${photoLimit} photo${photoLimit > 1 ? "s" : ""}.`}
                      onUpload={(file) => void addOfficialPhoto(file)}
                    />
                    {officialPhotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {officialPhotos.map((photo, index) => (
                          <div key={`${photo}-${index}`} className="group relative aspect-[9/16] overflow-hidden rounded-lg border bg-muted shadow-sm">
                            <label className="block size-full cursor-pointer">
                              <img src={photo} alt={`Photo officielle ${index + 1}`} className="size-full object-cover transition group-hover:scale-[1.02]" />
                              <span className="absolute inset-x-2 bottom-2 rounded-full bg-black/55 px-3 py-1.5 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                                {uploadingPhotoIndex === index ? "Upload..." : "Remplacer"}
                              </span>
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/avif"
                                className="hidden"
                                disabled={uploadingPhotoIndex !== null || uploadingCover}
                                onChange={(changeEvent) => {
                                  const file = changeEvent.target.files?.[0];
                                  if (file) void replaceOfficialPhoto(index, file);
                                  changeEvent.currentTarget.value = "";
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              aria-label={`Supprimer la photo ${index + 1}`}
                              onClick={() => void deleteOfficialPhoto(index)}
                              disabled={uploadingPhotoIndex !== null || uploadingCover}
                              className="absolute right-2 top-2 rounded-full bg-red-600/80 p-1.5 text-white shadow-md transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <MotionVideoUploader
                    value={event.motionVideoUrl}
                    eventId={event.id}
                    disabled={saving}
                    locked={!canUploadMotionVideo}
                    onChange={(motionVideoUrl) => updateEvent({ motionVideoUrl })}
                  />
                </CardContent>
              </Card>
              <LiveMobilePreview event={event} />
            </div>
          </TabsContent>

          <TabsContent value="infos">
            <Card className="card-luxury">
              <CardHeader><CardTitle>Informations & Programme</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {([
                  ["brideName", "Prenom mariee"],
                  ["groomName", "Prenom marie"],
                  ["eventTime", "Heure"],
                  ["venueName", "Lieu"],
                  ["venueAddress", "Adresse"],
                  ["venueMapUrl", "Lien Maps"],
                  ["dressCode", "Dress Code"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <Input value={(event[key] as string | null) ?? ""} onChange={(e) => setEvent({ ...event, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={event.eventDate?.slice(0, 10) ?? ""} onChange={(e) => setEvent({ ...event, eventDate: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Histoire du couple</Label>
                  <Textarea value={event.coupleStory ?? ""} onChange={(e) => setEvent({ ...event, coupleStory: e.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Sous-titre / citation calligraphiee</Label>
                  <Textarea value={event.invitationQuote ?? ""} onChange={(e) => setEvent({ ...event, invitationQuote: e.target.value })} />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label>Musique d&apos;ambiance</Label>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <Select
                      value={selectedMusicValue}
                      onValueChange={(value) => {
                        if (value === CUSTOM_MUSIC_VALUE) return;
                        setEvent({ ...event, musicUrl: value === NO_MUSIC_VALUE ? null : value });
                      }}
                    >
                      <SelectTrigger className="min-h-12 rounded-xl border-[#D4AF37]/25 bg-white">
                        <SelectValue placeholder="Choisir une melodie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_MUSIC_VALUE}>Aucune musique</SelectItem>
                        {MUSIC_PRESETS.map((preset) => (
                          <SelectItem key={preset.url} value={preset.url}>
                            {preset.label}
                          </SelectItem>
                        ))}
                        {selectedMusicValue === CUSTOM_MUSIC_VALUE && (
                          <SelectItem value={CUSTOM_MUSIC_VALUE}>Musique personnalisee</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white px-5 text-sm font-medium text-[#2A211A] shadow-sm transition hover:bg-[#FFF8EA] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                      {uploadingMusic ? <Music2 className="size-4 animate-pulse text-[#B89248]" /> : <UploadCloud className="size-4 text-[#B89248]" />}
                      <span>{uploadingMusic ? "Upload audio..." : "Uploader MP3"}</span>
                      <Input
                        type="file"
                        accept="audio/mpeg,audio/mp3,audio/mp4,audio/aac,audio/x-m4a,audio/wav"
                        className="hidden"
                        disabled={uploadingMusic}
                        onChange={(changeEvent) => {
                          const file = changeEvent.target.files?.[0];
                          if (file) void uploadMusicFile(file);
                          changeEvent.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                  {event.musicUrl && (
                    <audio controls preload="metadata" src={event.musicUrl} className="w-full rounded-xl" />
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Lien d&apos;invitation du Groupe WhatsApp</Label>
                  <Input
                    placeholder="https://chat.whatsapp.com/..."
                    value={event.whatsappGroupUrl ?? ""}
                    onChange={(e) => setEvent({ ...event, whatsappGroupUrl: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Button disabled={saving} onClick={() => void saveEssentialEvent()}>
                    <Save className="mr-2 size-4" />
                    {saving ? "Sauvegarde..." : "Sauvegarder les informations"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests">
            <Card className="card-luxury mb-5">
              <CardHeader><CardTitle>Ajouter un invite</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={addGuest} className="grid gap-3 md:grid-cols-5">
                  <Input placeholder="Prenom" value={newGuest.firstName} onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })} required />
                  <Input placeholder="Nom" value={newGuest.lastName} onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })} required />
                  <Input placeholder="WhatsApp" value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} />
                  <Button type="submit"><Plus className="mr-2 size-4" />Ajouter</Button>
                </form>
              </CardContent>
            </Card>
            <Card className="card-luxury">
              <CardHeader><CardTitle>Pass VIP & QR codes</CardTitle></CardHeader>
              <CardContent><GuestTable guests={guests} origin={origin} /></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner">
            <Card className="card-luxury">
              <CardHeader><CardTitle>Scanner Jour J</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Module reserve au controle des entrees le jour du mariage. Il valide les QR codes des invites et bloque les doubles passages.
                </p>
                <CameraScanner onScan={scanGuest} />
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </main>
  );
}
