"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Copy, ExternalLink, FileText, LogOut, MessageCircle, Plus, Save, ScanLine, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CameraScanner } from "@/components/dashboard/CameraScanner";
import { GuestTable } from "@/components/dashboard/GuestTable";
import { ImageUploader } from "@/components/dashboard/ImageUploader";
import { LiveMobilePreview } from "@/components/dashboard/LiveMobilePreview";
import { ThemeSelector } from "@/components/dashboard/ThemeSelector";
import { PLAN_LABELS, photoLimitForPlan } from "@/lib/plan-gating";
import { subscribeThemeCatalogChanges } from "@/lib/theme-sync";
import type { PublicEventPayload, ThemeConfig } from "@/types/database.types";

interface Guest {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  rsvpStatus: string;
  dietaryNotes: string | null;
  isVip: boolean;
  isCheckedIn: boolean;
  qrToken: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEventPayload | null>(null);
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [photographerLink, setPhotographerLink] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [newGuest, setNewGuest] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dietaryNotes: "",
    isVip: false,
  });

  const stats = useMemo(() => ({
    total: guests.length,
    confirmed: guests.filter((guest) => guest.rsvpStatus === "confirmed").length,
    checkedIn: guests.filter((guest) => guest.isCheckedIn).length,
  }), [guests]);

  async function loadDashboard() {
    const [eventRes, themesRes] = await Promise.all([
      fetch("/api/dashboard/event"),
      fetch("/api/themes", { cache: "no-store" }),
    ]);
    const [eventJson, themesJson] = await Promise.all([eventRes.json(), themesRes.json()]);
    if (eventJson.success) {
      setEvent(eventJson.data.event);
      setGuests(eventJson.data.guests);
      setPhotographerLink(eventJson.data.photographerLink);
    }
    if (themesJson.success) setThemes(themesJson.data);
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
      setPhotographerLink(json.data.photographerLink);
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
    setNewGuest({ firstName: "", lastName: "", phone: "", dietaryNotes: "", isVip: false });
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

  async function uploadCoverImage(file: File) {
    if (!event) return;
    setUploadingCover(true);
    const previewUrl = URL.createObjectURL(file);
    const currentPhotos = event.officialPhotoUrls ?? [];
    setEvent({
      ...event,
      coverPhotoUrl: previewUrl,
      officialPhotoUrls: [previewUrl, ...currentPhotos].slice(0, photoLimitForPlan(event.planType)),
    });

    try {
      const formData = new FormData();
      formData.append("kind", "image");
      formData.append("file", file);
      const upload = await fetch("/api/uploads", { method: "POST", body: formData });
      const uploadJson = await upload.json();
      if (!upload.ok || !uploadJson.success) {
        toast.error(uploadJson.error ?? "Upload image impossible.");
        setEvent(event);
        return;
      }
      const nextPhotos = [
        uploadJson.data.url,
        ...currentPhotos.filter((url) => url !== uploadJson.data.url),
      ].slice(0, photoLimitForPlan(event.planType));
      await updateEvent({ coverPhotoUrl: uploadJson.data.url, officialPhotoUrls: nextPhotos });
      toast.success("Photo de couverture mise a jour.");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingCover(false);
    }
  }

  async function copyPublicInvitationLink() {
    const invitationUrl = `${origin}/invitation/${event?.slug ?? ""}`;
    await navigator.clipboard.writeText(invitationUrl);
    toast.success("Lien d'invitation copie.");
  }

  function sharePublicInvitation() {
    if (!event) return;
    const invitationUrl = `${origin}/invitation/${event.slug}`;
    const text = encodeURIComponent(
      `Chers proches, nous sommes heureux de vous inviter a notre mariage ! Decouvrez notre invitation ici : ${invitationUrl}`,
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank", "noopener,noreferrer");
  }

  if (!event) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2]">Chargement...</main>;
  }

  const photoLimit = photoLimitForPlan(event.planType);
  const officialPhotos = event.officialPhotoUrls ?? [];
  const publicInvitationUrl = `${origin}/invitation/${event.slug}`;

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-script text-3xl text-[#D4AF37]">{event.brideName ?? "Votre"} & {event.groomName ?? "Mariage"}</p>
            <h1 className="font-display-bold text-3xl tracking-luxury">Espace Maries</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline"><a href={`/invitation/${event.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 size-4" />Invitation</a></Button>
            <Button variant="outline" onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
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
            <TabsTrigger value="photo"><Camera className="mr-2 size-4" />Photographe</TabsTrigger>
          </TabsList>

          <TabsContent value="design">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card className="card-luxury">
                <CardHeader><CardTitle>Editeur de Design & Theme</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D4AF37]/20 bg-white/70 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Votre formule</p>
                      <p className="font-display-bold text-xl">{PLAN_LABELS[event.planType]}</p>
                    </div>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Les cadenas indiquent les modeles reserves aux formules superieures. Les photos sont limitees a {photoLimit} pour votre offre.
                    </p>
                  </div>
                  <ThemeSelector themes={themes} selectedSlug={event.theme.slug} planType={event.planType} onSelect={(themeSlug) => updateEvent({ themeSlug })} />
                  <div className="space-y-2">
                    <Label>Photos officielles ({officialPhotos.length}/{photoLimit})</Label>
                    <ImageUploader
                      disabled={uploadingCover || officialPhotos.length >= photoLimit}
                      label={uploadingCover ? "Upload en cours..." : officialPhotos.length >= photoLimit ? "Limite de formule atteinte" : "Uploader une image HD"}
                      helper={`Portrait 9:16 recommande. ${PLAN_LABELS[event.planType]} autorise ${photoLimit} photo${photoLimit > 1 ? "s" : ""}.`}
                      onUpload={(file) => void uploadCoverImage(file)}
                    />
                    {officialPhotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {officialPhotos.map((photo, index) => (
                          <div key={photo} className="aspect-[9/16] overflow-hidden rounded-lg border bg-muted">
                            <img src={photo} alt={`Photo officielle ${index + 1}`} className="size-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                <div className="space-y-2">
                  <Label>Audio d'ambiance MP3 (URL)</Label>
                  <Input value={event.musicUrl ?? ""} onChange={(e) => setEvent({ ...event, musicUrl: e.target.value })} />
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
                  <Input placeholder="Regime" value={newGuest.dietaryNotes} onChange={(e) => setNewGuest({ ...newGuest, dietaryNotes: e.target.value })} />
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

          <TabsContent value="photo">
            <Card className="card-luxury">
              <CardHeader><CardTitle>Lien magique photographe</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  Page securisee pour livrer les cliches haute resolution, sans acces a la liste des invites ni aux donnees privees.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                <Input readOnly value={photographerLink ? `${window.location.origin}${photographerLink}` : "Non configure"} />
                <Button variant="outline" onClick={() => photographerLink && navigator.clipboard.writeText(`${window.location.origin}${photographerLink}`)}>
                  Copier
                </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
