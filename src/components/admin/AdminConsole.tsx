"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, Film, KeyRound, Package, Palette, Plus, Phone, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
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
import type { OpeningAnimationType, ScrollAnimationType, ThemeConfig } from "@/types/database.types";

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

type ThemeModelForm = {
  name: string;
  category: string;
  bgPrimary: string;
  cardBg: string;
  accentGold: string;
  textColor: string;
  scrollAnimation: ScrollAnimationType;
  titleFont: string;
  animationType: OpeningAnimationType;
  backdropUrl: string;
  isActive: boolean;
};

type ThemeColorField = "bgPrimary" | "cardBg" | "accentGold" | "textColor";

const COLOR_FIELDS: { key: ThemeColorField; label: string; input: "color" | "text" }[] = [
  { key: "bgPrimary", label: "Arriere-plan", input: "color" },
  { key: "cardBg", label: "Cartes / feuillets", input: "text" },
  { key: "accentGold", label: "Accent & or", input: "color" },
  { key: "textColor", label: "Textes", input: "color" },
] as const;

const SCROLL_ANIMATION_OPTIONS: { value: ScrollAnimationType; label: string }[] = [
  { value: "fade-up", label: "Fade-up" },
  { value: "scale-in", label: "Scale-in" },
  { value: "slide-stagger", label: "Slide stagger" },
] as const;

const OPENING_ANIMATION_OPTIONS: { value: OpeningAnimationType; label: string }[] = [
  { value: "golden_palace_doors", label: "Portes royales" },
  { value: "wax_seal_burst", label: "Sceau de cire" },
  { value: "botanical_envelope", label: "Enveloppe botanique" },
  { value: "velvet_curtains", label: "Rideaux de velours" },
  { value: "silk_ribbon_untie", label: "Ruban de soie" },
  { value: "ceremonial_walk", label: "Defile scenique" },
] as const;

const THEME_VIDEO_BUCKET = "theme-videos";
const NEW_THEME_UPLOAD_KEY = "__new_theme__";
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

function defaultThemeForm(): ThemeModelForm {
  return {
    name: "",
    category: "Privilege",
    bgPrimary: "#1B0F12",
    cardBg: "rgba(255,255,255,0.85)",
    accentGold: "#D4AF37",
    textColor: "#1B0F12",
    scrollAnimation: "fade-up",
    titleFont: "Cormorant Garamond",
    animationType: "golden_palace_doors",
    backdropUrl: "",
    isActive: true,
  };
}

function themeColorValue(theme: ThemeConfig, key: ThemeColorField) {
  if (key === "bgPrimary") return theme.bgPrimary ?? theme.primaryColor;
  if (key === "cardBg") return theme.cardBg ?? theme.secondaryColor;
  if (key === "accentGold") return theme.accentGold ?? theme.goldColor;
  return theme.textColor ?? theme.primaryColor;
}

function themeColorUpdate(key: ThemeColorField, value: string): Partial<ThemeConfig> {
  if (key === "bgPrimary") return { bgPrimary: value, primaryColor: value };
  if (key === "cardBg") return { cardBg: value, secondaryColor: value };
  if (key === "accentGold") return { accentGold: value, accentColor: value, goldColor: value };
  return { textColor: value };
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
  const [createThemeForm, setCreateThemeForm] = useState<ThemeModelForm>(() => defaultThemeForm());
  const [createThemeVideo, setCreateThemeVideo] = useState<File | null>(null);
  const [creatingTheme, setCreatingTheme] = useState(false);

  const stats = useMemo(() => {
    const active = events.filter((event) => event.isActive).length;
    return [
      { label: "Commandes", value: events.length, icon: Package },
      { label: "Actifs", value: active, icon: ShieldCheck },
      { label: "Themes", value: themes.length, icon: Palette },
    ];
  }, [events, themes]);

  async function loadAdminData() {
    const [themesResult, eventsResult] = await Promise.allSettled([
      fetch("/api/admin/themes", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/admin/events", { cache: "no-store" }).then((response) => response.json()),
    ]);

    if (themesResult.status === "fulfilled" && themesResult.value.success) {
      setThemes(themesResult.value.data ?? []);
    } else {
      console.error("Admin themes load failed:", themesResult);
    }

    if (eventsResult.status === "fulfilled" && eventsResult.value.success) {
      setEvents(eventsResult.value.data ?? []);
    } else {
      console.error("Admin events load failed:", eventsResult);
    }
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

  async function uploadThemeVideoFile(progressKey: string, file: File) {
    setUploadingTheme(progressKey);
    setUploadProgress((prev) => ({ ...prev, [progressKey]: 1 }));

    const progressTimer = window.setInterval(() => {
      setUploadProgress((prev) => {
        const current = prev[progressKey] ?? 1;
        if (current >= 90) return prev;
        return { ...prev, [progressKey]: Math.min(current + 7, 90) };
      });
    }, 600);

    try {
      if (file.size > MAX_THEME_VIDEO_SIZE) {
        toast.error("Video trop volumineuse. Compressez-la avant l'upload (maximum 50 Mo).");
        return null;
      }

      if (!isSupportedThemeVideo(file)) {
        toast.error("Format video non autorise. Utilisez MP4, MOV/QuickTime ou WEBM.");
        return null;
      }

      const filePath = `${Date.now()}_${sanitizeStorageFilename(file.name)}`;
      const signatureResponse = await fetch("/api/admin/themes/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      });
      const signatureJson = await signatureResponse.json();

      if (!signatureResponse.ok || !signatureJson.success) {
        toast.error(signatureJson.error ?? "Signature Supabase impossible.");
        return null;
      }

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage.from(THEME_VIDEO_BUCKET).uploadToSignedUrl(
        signatureJson.data.path,
        signatureJson.data.token,
        file,
        {
          contentType: file.type || "video/mp4",
          cacheControl: "3600",
          upsert: true,
        },
      );

      if (error) {
        console.error("Erreur upload Supabase:", error);
        toast.error(error.message);
        return null;
      }

      setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }));
      const { data } = supabase.storage.from(THEME_VIDEO_BUCKET).getPublicUrl(signatureJson.data.path);
      return data.publicUrl;
    } catch (error) {
      console.error("Erreur upload Supabase:", error);
      toast.error(error instanceof Error ? error.message : "Upload video impossible.");
      return null;
    } finally {
      window.clearInterval(progressTimer);
      setUploadingTheme(null);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[progressKey];
        return next;
      });
    }
  }

  async function createTheme(event: React.FormEvent) {
    event.preventDefault();
    setCreatingTheme(true);

    try {
      const uploadedVideoUrl = createThemeVideo
        ? await uploadThemeVideoFile(NEW_THEME_UPLOAD_KEY, createThemeVideo)
        : null;

      if (createThemeVideo && !uploadedVideoUrl) return;

      const response = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createThemeForm,
          backdropUrl: createThemeForm.backdropUrl.trim() || null,
          openingVideoUrl: uploadedVideoUrl,
          demoVideoUrl: uploadedVideoUrl,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Creation du modele impossible.");
        return;
      }

      setThemes((prev) => [json.data, ...prev]);
      setCreateThemeForm(defaultThemeForm());
      setCreateThemeVideo(null);
      notifyThemeCatalogChanged();
      toast.success("Modele ajoute.");
    } catch (error) {
      console.error("Theme create error:", error);
      toast.error("Creation du modele impossible.");
    } finally {
      setCreatingTheme(false);
    }
  }

  async function uploadThemeVideo(theme: ThemeConfig, file: File) {
    const publicUrl = await uploadThemeVideoFile(theme.slug, file);
    if (!publicUrl) return;

    const saved = await updateTheme(theme.slug, {
      openingVideoUrl: publicUrl,
      demoVideoUrl: publicUrl,
    });
    if (saved) toast.success("Video televersee.");
  }

  async function deleteThemeVideo(theme: ThemeConfig) {
    await updateTheme(theme.slug, {
      openingVideoUrl: null,
      demoVideoUrl: null,
    });
    toast.success("Video supprimee.");
  }

  async function deleteTheme(theme: ThemeConfig) {
    const confirmed = window.confirm(`Supprimer le modele "${theme.name}" du catalogue ?`);
    if (!confirmed) return;

    setSavingTheme(theme.slug);
    try {
      const response = await fetch("/api/admin/themes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: theme.slug }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Suppression impossible.");
        return;
      }

      setThemes((prev) => {
        if (json.mode === "disabled") {
          return prev.map((item) => (item.slug === theme.slug ? json.data : item));
        }
        return prev.filter((item) => item.slug !== theme.slug);
      });
      notifyThemeCatalogChanged();
      toast.success(json.mode === "disabled" ? "Modele desactive." : "Modele supprime.");
    } catch (error) {
      console.error("Theme delete error:", error);
      toast.error("Suppression impossible.");
    } finally {
      setSavingTheme(null);
    }
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
            <Card className="mb-6 overflow-hidden rounded-lg border-[#D7C4A3] bg-white shadow-sm">
              <div
                className="h-2"
                style={{
                  background: `linear-gradient(135deg, ${createThemeForm.bgPrimary}, ${createThemeForm.accentGold} 52%, ${createThemeForm.cardBg})`,
                }}
              />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="size-5 text-[#B89248]" />
                  Ajouter un modele
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={createTheme} className="grid gap-4 xl:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Nom du modele</Label>
                    <Input
                      value={createThemeForm.name}
                      onChange={(event) => setCreateThemeForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Palais Royal"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categorie</Label>
                    <Select
                      value={createThemeForm.category}
                      onValueChange={(category) => setCreateThemeForm((prev) => ({ ...prev, category }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Essentielle">Essentielle</SelectItem>
                        <SelectItem value="Prestige">Prestige</SelectItem>
                        <SelectItem value="Privilege">Privilege</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Apparition au scroll</Label>
                    <Select
                      value={createThemeForm.scrollAnimation}
                      onValueChange={(scrollAnimation) =>
                        setCreateThemeForm((prev) => ({ ...prev, scrollAnimation: scrollAnimation as ScrollAnimationType }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SCROLL_ANIMATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Style d'ouverture</Label>
                    <Select
                      value={createThemeForm.animationType}
                      onValueChange={(animationType) =>
                        setCreateThemeForm((prev) => ({ ...prev, animationType: animationType as OpeningAnimationType }))
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OPENING_ANIMATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {COLOR_FIELDS.map(({ key, label, input }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type={input}
                          value={createThemeForm[key]}
                          onChange={(event) => setCreateThemeForm((prev) => ({ ...prev, [key]: event.target.value }))}
                          className={input === "color" ? "h-10 w-14 shrink-0 p-1" : ""}
                          placeholder={key === "cardBg" ? "rgba(255,255,255,0.85)" : undefined}
                          required
                        />
                        {input === "color" && (
                          <span className="truncate rounded bg-[#F7F2EA] px-2 py-2 text-xs text-muted-foreground">
                            {createThemeForm[key]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="space-y-2 xl:col-span-2">
                    <Label>Image fixe de decor ouvert</Label>
                    <Input
                      value={createThemeForm.backdropUrl}
                      onChange={(event) => setCreateThemeForm((prev) => ({ ...prev, backdropUrl: event.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Police titre</Label>
                    <Input
                      value={createThemeForm.titleFont}
                      onChange={(event) => setCreateThemeForm((prev) => ({ ...prev, titleFont: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Video d'ouverture</Label>
                    <Input
                      type="file"
                      accept={THEME_VIDEO_ACCEPT}
                      disabled={creatingTheme || uploadingTheme === NEW_THEME_UPLOAD_KEY}
                      onChange={(event) => setCreateThemeVideo(event.target.files?.[0] ?? null)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {uploadingTheme === NEW_THEME_UPLOAD_KEY
                        ? `Televersement en cours... ${uploadProgress[NEW_THEME_UPLOAD_KEY] ?? 1}%`
                        : createThemeVideo?.name ?? "MP4, MOV/QuickTime ou WEBM - 50 Mo max"}
                    </p>
                  </div>

                  <div className="xl:col-span-4">
                    <Button type="submit" disabled={creatingTheme || uploadingTheme === NEW_THEME_UPLOAD_KEY} className="bg-[#171312] text-white hover:bg-[#2A2320]">
                      <Plus className="mr-2 size-4" />
                      {creatingTheme ? "Creation..." : "Ajouter le modele"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

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
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant={theme.isActive === false ? "outline" : "default"}>
                            {theme.isActive === false ? "Inactif" : "Actif"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{theme.category}</span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {savingTheme === theme.slug && <Badge variant="outline">Sauvegarde</Badge>}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-700 hover:bg-red-50 hover:text-red-800"
                          onClick={() => void deleteTheme(theme)}
                          disabled={savingTheme === theme.slug}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Categorie</Label>
                        <Select value={theme.category} onValueChange={(category) => void updateTheme(theme.slug, { category })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Essentielle">Essentielle</SelectItem>
                            <SelectItem value="Prestige">Prestige</SelectItem>
                            <SelectItem value="Privilege">Privilege</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Apparition au scroll</Label>
                        <Select
                          value={theme.scrollAnimation ?? "fade-up"}
                          onValueChange={(scrollAnimation) => void updateTheme(theme.slug, { scrollAnimation: scrollAnimation as ScrollAnimationType })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SCROLL_ANIMATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Style d'ouverture</Label>
                        <Select
                          value={theme.animationType}
                          onValueChange={(animationType) => void updateTheme(theme.slug, { animationType: animationType as OpeningAnimationType })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {OPENING_ANIMATION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] px-3 py-2">
                        <Label htmlFor={`active-${theme.slug}`}>Visible catalogue</Label>
                        <Switch
                          id={`active-${theme.slug}`}
                          checked={theme.isActive !== false}
                          onCheckedChange={(isActive) => void updateTheme(theme.slug, { isActive })}
                        />
                      </div>
                    </div>

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
                          {COLOR_FIELDS.map(({ key, label, input }) => (
                            <div key={key} className="space-y-2">
                              <Label>{label}</Label>
                              <div className="flex items-center gap-2">
                                {input === "color" ? (
                                  <Input
                                    type="color"
                                    value={themeColorValue(theme, key)}
                                    onChange={(event) => void updateTheme(theme.slug, themeColorUpdate(key, event.target.value))}
                                    className="h-10 w-14 shrink-0 p-1"
                                  />
                                ) : (
                                  <Input
                                    type="text"
                                    defaultValue={themeColorValue(theme, key)}
                                    onBlur={(event) => void updateTheme(theme.slug, themeColorUpdate(key, event.target.value))}
                                    placeholder="rgba(255,255,255,0.85)"
                                  />
                                )}
                                {input === "color" && (
                                  <span className="truncate rounded bg-white px-2 py-2 text-xs text-muted-foreground">
                                    {themeColorValue(theme, key)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label>Image fixe de decor ouvert</Label>
                          <Input
                            defaultValue={theme.backdropUrl ?? ""}
                            placeholder="https://..."
                            onBlur={(event) => void updateTheme(theme.slug, { backdropUrl: event.target.value.trim() || null })}
                          />
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
