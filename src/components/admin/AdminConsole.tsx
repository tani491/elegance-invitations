"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, Film, KeyRound, Package, Palette, Phone, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { notifyThemeCatalogChanged } from "@/lib/theme-sync";
import type { ThemeConfig } from "@/types/database.types";

interface EventRow {
  id: string;
  name: string;
  organizerName: string;
  clientEmail: string | null;
  planType: string;
  isActive: boolean;
  isPaid: boolean;
  createdAt: string;
  _count?: { guests: number; photos: number };
}

interface ClientAccessPayload {
  loginUrl: string;
  invitationUrl: string;
  email: string;
  password: string;
  whatsAppMessage: string;
}

interface CreateClientResponse {
  success: boolean;
  error?: string;
  data?: {
    user: {
      email: string;
    };
    provisionalPassword: string;
    loginUrl: string;
    invitationUrl: string;
    whatsAppMessage: string;
  };
}

const COLOR_FIELDS = [
  ["primaryColor", "Primaire"],
  ["secondaryColor", "Fond"],
  ["accentColor", "Accent"],
  ["goldColor", "Dore"],
] as const;

const THEME_VIDEO_BUCKET = "theme-videos";
const MAX_THEME_VIDEO_SIZE = 50 * 1024 * 1024;
const THEME_VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,video/mov";
const THEME_VIDEO_MIME_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/mov"]);
const THEME_VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm"]);

function sanitizeStorageFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

function isSupportedThemeVideo(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return THEME_VIDEO_MIME_TYPES.has(file.type) || Boolean(extension && THEME_VIDEO_EXTENSIONS.has(extension));
}

export default function AdminConsole() {
  const router = useRouter();
  const [themes, setThemes] = useState<ThemeConfig[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [form, setForm] = useState({
    coupleName: "",
    email: "",
    whatsapp: "",
    password: "",
    planType: "prestige",
    template: "medina-orientale",
  });
  const [lastMessage, setLastMessage] = useState("");
  const [accessModal, setAccessModal] = useState<ClientAccessPayload | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingTheme, setSavingTheme] = useState<string | null>(null);
  const [uploadingTheme, setUploadingTheme] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const active = events.filter((event) => event.isActive).length;
    return [
      { label: "Commandes", value: events.length, icon: Package },
      { label: "Actifs", value: active, icon: ShieldCheck },
      { label: "Themes", value: themes.length, icon: Palette },
    ];
  }, [events, themes]);

  async function loadAdminData() {
    const [themesRes, eventsRes] = await Promise.all([
      fetch("/api/admin/themes", { cache: "no-store" }),
      fetch("/api/admin/events"),
    ]);
    const [themesJson, eventsJson] = await Promise.all([themesRes.json(), eventsRes.json()]);
    if (themesJson.success) setThemes(themesJson.data);
    if (eventsJson.success) setEvents(eventsJson.data);
  }

  useEffect(() => {
    queueMicrotask(() => {
      loadAdminData().catch(() => toast.error("Impossible de charger l'administration."));
    });
  }, []);

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Message WhatsApp copie.");
  }

  async function createClient(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as CreateClientResponse;

      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Creation impossible.");
        return;
      }

      if (!json.data) {
        toast.error("Reponse admin incomplete.");
        return;
      }

      const access = {
        loginUrl: json.data.loginUrl,
        invitationUrl: json.data.invitationUrl,
        email: json.data.user.email,
        password: json.data.provisionalPassword,
        whatsAppMessage: json.data.whatsAppMessage,
      };
      setAccessModal(access);
      setLastMessage(access.whatsAppMessage);
      await copyText(access.whatsAppMessage);
      toast.success("Compte client cree.");
      setForm({ coupleName: "", email: "", whatsapp: "", password: "", planType: "prestige", template: form.template });
      await loadAdminData();
    } catch {
      toast.error("Erreur reseau pendant la creation.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleEvent(eventId: string, isActive: boolean) {
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, isActive } : event)));
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  }

  async function updateTheme(slug: string, data: Partial<ThemeConfig>) {
    setSavingTheme(slug);
    try {
      const response = await fetch("/api/admin/themes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...data }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Theme non sauvegarde.");
        return false;
      }
      setThemes((prev) => prev.map((theme) => (theme.slug === slug ? json.data : theme)));
      notifyThemeCatalogChanged();
      toast.success("Theme sauvegarde.");
      return true;
    } catch (error) {
      console.error("Theme save error:", error);
      toast.error("Theme non sauvegarde.");
      return false;
    } finally {
      setSavingTheme(null);
    }
  }

  async function saveThemeName(theme: ThemeConfig) {
    const nextName = (editingNames[theme.slug] ?? theme.name).trim();
    if (!nextName || nextName === theme.name) return;
    await updateTheme(theme.slug, { name: nextName });
  }

  async function uploadThemeVideo(theme: ThemeConfig, file: File) {
    setUploadingTheme(theme.slug);
    setUploadProgress((prev) => ({ ...prev, [theme.slug]: 1 }));

    const progressTimer = window.setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[theme.slug] ?? 1;
        if (current >= 90) return prev;
        return { ...prev, [theme.slug]: Math.min(current + 7, 90) };
      });
    }, 600);

    try {
      if (file.size > MAX_THEME_VIDEO_SIZE) {
        toast.error("Video trop volumineuse. Compressez-la avant l'upload (maximum 50 Mo).");
        return;
      }

      if (!isSupportedThemeVideo(file)) {
        toast.error("Format video non autorise. Utilisez MP4, MOV/QuickTime ou WEBM.");
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const filePath = `${Date.now()}_${sanitizeStorageFilename(file.name)}`;
      const { error } = await supabase.storage.from(THEME_VIDEO_BUCKET).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

      if (error) {
        console.error("Erreur upload Supabase:", error);
        toast.error(error.message);
        return;
      }

      setUploadProgress((prev) => ({ ...prev, [theme.slug]: 100 }));
      const { data } = supabase.storage.from(THEME_VIDEO_BUCKET).getPublicUrl(filePath);
      const saved = await updateTheme(theme.slug, {
        openingVideoUrl: data.publicUrl,
        demoVideoUrl: data.publicUrl,
      });
      if (saved) toast.success("Video televersee.");
    } catch (error) {
      console.error("Erreur upload Supabase:", error);
      toast.error(error instanceof Error ? error.message : "Upload video impossible.");
    } finally {
      window.clearInterval(progressTimer);
      setUploadingTheme(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[theme.slug];
        return next;
      });
    }
  }

  async function deleteThemeVideo(theme: ThemeConfig) {
    await updateTheme(theme.slug, {
      openingVideoUrl: null,
      demoVideoUrl: null,
    });
    toast.success("Video supprimee.");
  }

  return (
    <main className="min-h-screen bg-[#F7F2EA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-script text-3xl text-[#B89248]">Elegance</p>
            <h1 className="font-display-bold text-3xl tracking-luxury text-[#171312]">Super Admin</h1>
          </div>
          <Button variant="outline" onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/admin/login");
          }}>
            Deconnexion
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="rounded-lg border-[#E5D9C7] bg-white/80 shadow-sm">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-[#B89248]/12">
                  <stat.icon className="size-5 text-[#5C1D24]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="font-display-bold text-2xl">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="h-auto flex-wrap bg-white/70">
            <TabsTrigger value="create"><UserPlus className="mr-2 size-4" />Client express</TabsTrigger>
            <TabsTrigger value="orders"><Package className="mr-2 size-4" />Commandes</TabsTrigger>
            <TabsTrigger value="themes"><Film className="mr-2 size-4" />Themes & videos</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="rounded-lg border-[#E5D9C7] bg-white shadow-sm">
              <CardHeader><CardTitle>Creation Client Express</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={createClient} className="grid gap-4 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Nom du couple</Label>
                    <Input value={form.coupleName} onChange={(e) => setForm({ ...form, coupleName: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Email client</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Numero WhatsApp</Label>
                    <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+221..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Mot de passe</Label>
                    <Input type="text" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Formule</Label>
                    <Select value={form.planType} onValueChange={(planType) => setForm({ ...form, planType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="essentielle">Essentielle</SelectItem>
                        <SelectItem value="prestige">Prestige</SelectItem>
                        <SelectItem value="privilege">Privilege</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modele par defaut</Label>
                    <Select value={form.template} onValueChange={(template) => setForm({ ...form, template })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => <SelectItem key={theme.slug} value={theme.slug}>{theme.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-5">
                    <Button type="submit" disabled={creating} className="bg-[#171312] text-white hover:bg-[#2A2320]">
                      <Copy className="mr-2 size-4" />
                      {creating ? "Creation..." : "Generer et copier le message WhatsApp"}
                    </Button>
                  </div>
                </form>
                {lastMessage && (
                  <div className="mt-6 rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] p-4">
                    <pre className="whitespace-pre-wrap text-sm text-[#171312]">{lastMessage}</pre>
                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => copyText(lastMessage)}>
                      <Copy className="mr-2 size-4" />
                      Copier a nouveau
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="rounded-lg border-[#E5D9C7] bg-white shadow-sm">
              <CardHeader><CardTitle>Gestion des commandes</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Evenement</TableHead>
                      <TableHead>Formule</TableHead>
                      <TableHead>Invites</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.clientEmail ?? event.organizerName}</TableCell>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{event.planType}</TableCell>
                        <TableCell>{event._count?.guests ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant={event.isActive ? "default" : "outline"}>{event.isActive ? "Actif" : "Suspendu"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch checked={event.isActive} onCheckedChange={(checked) => toggleEvent(event.id, checked)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="themes">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {themes.map((theme) => (
                <Card key={theme.slug} className="overflow-hidden rounded-lg border-[#E5D9C7] bg-white shadow-sm">
                  <div className="h-2" style={{ background: theme.previewGradient }} />
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Input
                          aria-label={`Nom du modele ${theme.name}`}
                          value={editingNames[theme.slug] ?? theme.name}
                          onChange={(event) => setEditingNames((prev) => ({ ...prev, [theme.slug]: event.target.value }))}
                          onBlur={() => void saveThemeName(theme)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              event.currentTarget.blur();
                            }
                          }}
                          className="h-auto border-transparent bg-transparent px-0 py-0 font-display-bold text-lg shadow-none focus-visible:border-[#D6C5A8] focus-visible:px-2 focus-visible:py-1"
                        />
                        <p className="text-sm text-muted-foreground">{theme.category}</p>
                      </div>
                      {savingTheme === theme.slug && <Badge variant="outline">Sauvegarde</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label
                      className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D6C5A8] bg-[#FDFBF7] p-4 text-center transition hover:border-[#B89248] hover:bg-[#FAF6EF]"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const file = event.dataTransfer.files?.[0];
                        if (file) void uploadThemeVideo(theme, file);
                      }}
                    >
                      <Upload className="mb-3 size-7 text-[#B89248]" />
                      <span className="text-sm font-semibold">
                        {uploadingTheme === theme.slug
                          ? `Televersement en cours... ${uploadProgress[theme.slug] ?? 1}%`
                          : "Uploader la video d'ouverture"}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {uploadingTheme === theme.slug ? "Veuillez patienter" : "MP4, MOV/QuickTime ou WEBM - 50 Mo max"}
                      </span>
                      <Input
                        type="file"
                        accept={THEME_VIDEO_ACCEPT}
                        className="hidden"
                        disabled={uploadingTheme === theme.slug}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadThemeVideo(theme, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {(theme.openingVideoUrl ?? theme.demoVideoUrl) && (
                      <div className="space-y-3">
                        <video src={theme.openingVideoUrl ?? theme.demoVideoUrl ?? undefined} className="aspect-video w-full rounded-lg bg-black object-cover" controls muted playsInline preload="metadata" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                          onClick={() => void deleteThemeVideo(theme)}
                          disabled={savingTheme === theme.slug}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Supprimer la video
                        </Button>
                      </div>
                    )}

                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-between">
                          Personnaliser les couleurs
                          <ChevronDown className="size-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3 space-y-3 rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] p-3">
                        <div className="grid grid-cols-2 gap-3">
                          {COLOR_FIELDS.map(([key, label]) => (
                            <div key={key} className="space-y-2">
                              <Label>{label}</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={theme[key]}
                                  onChange={(e) => updateTheme(theme.slug, { [key]: e.target.value } as Partial<ThemeConfig>)}
                                  className="h-10 w-14 shrink-0 p-1"
                                />
                                <span className="truncate rounded bg-white px-2 py-2 text-xs text-muted-foreground">{theme[key]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="size-4 text-[#B89248]" />
                      Palette synchronisee avec invitation et pass.
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Dialog open={accessModal !== null} onOpenChange={(open) => {
        if (!open) setAccessModal(null);
      }}>
        <DialogContent className="border-[#E5D9C7] bg-[#FDFBF7]">
          <DialogHeader>
            <DialogTitle>Acces client generes</DialogTitle>
            <DialogDescription>
              Envoyez ces informations au client pour ouvrir son espace de personnalisation.
            </DialogDescription>
          </DialogHeader>
          {accessModal && (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-lg border border-[#E5D9C7] bg-white p-4 text-sm">
                <div className="flex items-start gap-3">
                  <ExternalLink className="mt-0.5 size-4 text-[#B89248]" />
                  <div>
                    <p className="font-medium">Lien espace client</p>
                    <a href={accessModal.loginUrl} target="_blank" rel="noreferrer" className="break-all text-muted-foreground underline">
                      {accessModal.loginUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ExternalLink className="mt-0.5 size-4 text-[#B89248]" />
                  <div>
                    <p className="font-medium">Lien direct invitation</p>
                    <a href={accessModal.invitationUrl} target="_blank" rel="noreferrer" className="break-all text-muted-foreground underline">
                      {accessModal.invitationUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 text-[#B89248]" />
                  <div>
                    <p className="font-medium">Identifiant</p>
                    <p className="break-all text-muted-foreground">{accessModal.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 size-4 text-[#B89248]" />
                  <div>
                    <p className="font-medium">Mot de passe</p>
                    <p className="break-all text-muted-foreground">{accessModal.password}</p>
                  </div>
                </div>
              </div>
              <Button type="button" className="w-full bg-[#171312] text-white hover:bg-[#2A2320]" onClick={() => copyText(accessModal.whatsAppMessage)}>
                <Copy className="mr-2 size-4" />
                Copier les acces WhatsApp
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
