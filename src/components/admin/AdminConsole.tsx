"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, Eye, EyeOff, Film, KeyRound, Package, Palette, Phone, Plus, Settings2, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import { notifyThemeCatalogChanged } from "@/lib/theme-sync";
import { SCROLL_ANIMATION_OPTIONS, TITLE_FONT_OPTIONS } from "@/types/database.types";
import type { ScrollAnimationType, ThemeConfig } from "@/types/database.types";

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
  isActive: boolean;
};

type ThemeColorField = "bgPrimary" | "cardBg" | "accentGold" | "textColor";

const COLOR_FIELDS: { key: ThemeColorField; label: string; input: "color" | "text" }[] = [
  { key: "bgPrimary", label: "Arriere-plan", input: "color" },
  { key: "cardBg", label: "Cartes / feuillets", input: "text" },
  { key: "accentGold", label: "Accent & or", input: "color" },
  { key: "textColor", label: "Textes", input: "color" },
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

function themeVideoSource(theme: ThemeConfig) {
  return theme.videoUrl ?? theme.openingVideoUrl ?? theme.demoVideoUrl ?? null;
}

function themeInitials(name: string) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (letters || "EI").toUpperCase();
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
  const [createThemeOpen, setCreateThemeOpen] = useState(false);
  const [expandedThemeSlug, setExpandedThemeSlug] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = events.filter((event) => event.isActive).length;
    return [
      { label: "Commandes", value: events.length, icon: Package },
      { label: "Actifs", value: active, icon: ShieldCheck },
      { label: "Themes", value: themes.length, icon: Palette },
    ];
  }, [events, themes]);

  const visibleThemeCount = useMemo(() => themes.filter((theme) => theme.isActive !== false).length, [themes]);

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

  async function updateTheme(slug: string, data: Partial<ThemeConfig>, successMessage = "Theme sauvegarde.") {
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
      const updatedTheme = json.theme ?? json.data;
      setThemes((prev) => prev.map((theme) => (theme.slug === slug ? { ...theme, ...updatedTheme } : theme)));
      notifyThemeCatalogChanged();
      router.refresh();
      toast.success(successMessage);
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
          videoUrl: uploadedVideoUrl,
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
      setCreateThemeOpen(false);
      notifyThemeCatalogChanged();
      router.refresh();
      await loadAdminData();
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

    setThemes((prev) =>
      prev.map((item) =>
        item.slug === theme.slug
          ? { ...item, videoUrl: publicUrl, openingVideoUrl: publicUrl, demoVideoUrl: publicUrl }
          : item,
      ),
    );

    const saved = await updateTheme(theme.slug, {
      videoUrl: publicUrl,
      openingVideoUrl: publicUrl,
      demoVideoUrl: publicUrl,
    }, "Video sauvegardee et synchronisee avec succes !");
    if (saved) {
      await loadAdminData();
    }
  }

  async function deleteThemeVideo(theme: ThemeConfig) {
    const saved = await updateTheme(theme.slug, {
      videoUrl: null,
      openingVideoUrl: null,
      demoVideoUrl: null,
    }, "Video supprimee.");
    if (saved) {
      await loadAdminData();
    }
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
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-[#D6C5A8]">
              <Link href="/admin/settings">
                <Settings2 className="mr-2 size-4" />
                Accueil
              </Link>
            </Button>
            <Button variant="outline" onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/admin/login");
            }}>
              Deconnexion
            </Button>
          </div>
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

          <TabsContent value="themes" className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border border-[#E5D9C7] bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Catalogue des modeles</p>
                <h2 className="mt-1 font-display-bold text-2xl text-[#171312]">{themes.length} modeles configures</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visibleThemeCount} visibles, {themes.length - visibleThemeCount} masques.
                </p>
              </div>
              <Button type="button" className="bg-[#171312] text-white hover:bg-[#2A2320]" onClick={() => setCreateThemeOpen(true)}>
                <Plus className="mr-2 size-4" />
                Nouveau modele
              </Button>
            </div>

            <Dialog
              open={createThemeOpen}
              onOpenChange={(open) => {
                setCreateThemeOpen(open);
                if (!open && !creatingTheme) setCreateThemeVideo(null);
              }}
            >
              <DialogContent className="max-h-[92dvh] overflow-y-auto border-[#D7C4A3] bg-[#FDFBF7] sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="size-5 text-[#B89248]" />
                    Nouveau modele
                  </DialogTitle>
                  <DialogDescription>
                    Ajoutez la video, l'apparition au scroll et la palette sans encombrer le catalogue.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={createTheme} className="space-y-5">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${createThemeForm.bgPrimary}, ${createThemeForm.accentGold} 52%, ${createThemeForm.cardBg})`,
                    }}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
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
                      <Label>Police des titres</Label>
                      <Select
                        value={createThemeForm.titleFont}
                        onValueChange={(titleFont) => setCreateThemeForm((prev) => ({ ...prev, titleFont }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TITLE_FONT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-[#E5D9C7] bg-white px-3 py-2">
                      <Label htmlFor="new-theme-active">Visible catalogue</Label>
                      <Switch
                        id="new-theme-active"
                        checked={createThemeForm.isActive}
                        onCheckedChange={(isActive) => setCreateThemeForm((prev) => ({ ...prev, isActive }))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D6C5A8] bg-white p-4 text-center transition hover:border-[#B89248] hover:bg-[#FAF6EF]">
                      <Upload className="mb-3 size-7 text-[#B89248]" />
                      <span className="text-sm font-semibold">
                        {uploadingTheme === NEW_THEME_UPLOAD_KEY
                          ? `Televersement en cours... ${uploadProgress[NEW_THEME_UPLOAD_KEY] ?? 1}%`
                          : "Video d'ouverture"}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {createThemeVideo?.name ?? "MP4, MOV/QuickTime ou WEBM - 50 Mo max"}
                      </span>
                      {uploadingTheme === NEW_THEME_UPLOAD_KEY && (
                        <Progress value={uploadProgress[NEW_THEME_UPLOAD_KEY] ?? 1} className="mt-4 h-2" />
                      )}
                      <Input
                        type="file"
                        accept={THEME_VIDEO_ACCEPT}
                        className="hidden"
                        disabled={creatingTheme || uploadingTheme === NEW_THEME_UPLOAD_KEY}
                        onChange={(event) => setCreateThemeVideo(event.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border border-[#E5D9C7] bg-white p-4">
                    <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#171312]">
                      <Palette className="size-4 text-[#B89248]" />
                      Palette du modele
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
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
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateThemeOpen(false)} disabled={creatingTheme}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={creatingTheme || uploadingTheme === NEW_THEME_UPLOAD_KEY} className="bg-[#171312] text-white hover:bg-[#2A2320]">
                      <Plus className="mr-2 size-4" />
                      {creatingTheme ? "Creation..." : "Ajouter le modele"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <div className="space-y-3">
              {themes.map((theme) => {
                const isExpanded = expandedThemeSlug === theme.slug;
                const isVisible = theme.isActive !== false;
                const videoSrc = themeVideoSource(theme);
                const progress = uploadProgress[theme.slug] ?? 1;

                return (
                  <Collapsible
                    key={theme.slug}
                    open={isExpanded}
                    onOpenChange={(open) => setExpandedThemeSlug(open ? theme.slug : null)}
                  >
                    <Card className="overflow-hidden rounded-lg border-[#E5D9C7] bg-white shadow-sm transition-shadow hover:shadow-md">
                      <CardContent className="p-0">
                        <div className="grid gap-4 p-4 md:grid-cols-[88px_minmax(0,1fr)_auto] md:items-center">
                          <button
                            type="button"
                            className="relative aspect-video w-full overflow-hidden rounded-lg border border-[#E5D9C7] bg-[#F7F2EA] text-left md:size-[88px] md:aspect-square"
                            onClick={() => setExpandedThemeSlug(isExpanded ? null : theme.slug)}
                            aria-label={`Configurer ${theme.name}`}
                          >
                            {videoSrc ? (
                              <>
                                <video src={videoSrc} className="size-full object-cover" muted playsInline preload="metadata" />
                                <span className="absolute inset-0 grid place-items-center bg-black/10 text-white">
                                  <Film className="size-5 drop-shadow" />
                                </span>
                              </>
                            ) : (
                              <span className="grid size-full place-items-center" style={{ background: theme.previewGradient }}>
                                <span className="rounded-full border border-white/40 bg-black/20 px-3 py-2 font-serif text-sm text-white backdrop-blur">
                                  {themeInitials(theme.name)}
                                </span>
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            className="min-w-0 text-left"
                            onClick={() => setExpandedThemeSlug(isExpanded ? null : theme.slug)}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-display-bold text-lg text-[#171312]">{theme.name}</h3>
                              {savingTheme === theme.slug && <Badge variant="outline">Sauvegarde</Badge>}
                              {uploadingTheme === theme.slug && <Badge variant="outline">{progress}%</Badge>}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <Badge className={isVisible ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-100 text-stone-500"}>
                                {isVisible ? (
                                  <Eye className="mr-1 size-3" />
                                ) : (
                                  <EyeOff className="mr-1 size-3" />
                                )}
                                {isVisible ? "Visible" : "Masque"}
                              </Badge>
                              <Badge variant="outline" className="border-[#E5D9C7] bg-[#FDFBF7] text-[#5C1D24]">
                                {theme.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {theme.scrollAnimation ?? "fade-up"} · {videoSrc ? "video connectee" : "sans video"}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-2 md:justify-end">
                            <CollapsibleTrigger asChild>
                              <Button type="button" variant="outline" size="sm" className="border-[#D6C5A8]">
                                <Settings2 className="mr-2 size-4" />
                                {isExpanded ? "Replier" : "Configurer"}
                              </Button>
                            </CollapsibleTrigger>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-700 hover:bg-red-50 hover:text-red-800"
                              onClick={() => void deleteTheme(theme)}
                              disabled={savingTheme === theme.slug}
                              aria-label={`Supprimer ${theme.name}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>

                        <CollapsibleContent className="overflow-hidden border-t border-[#EFE4D2] bg-[#FDFBF7] transition-all duration-300 ease-in-out">
                          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                            <div className="space-y-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Nom du modele</Label>
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
                                  />
                                </div>
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
                                  <Label>Police des titres</Label>
                                  <Select
                                    value={theme.titleFont}
                                    onValueChange={(titleFont) => void updateTheme(theme.slug, { titleFont })}
                                  >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {TITLE_FONT_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-[#E5D9C7] bg-white px-3 py-2">
                                  <Label htmlFor={`active-${theme.slug}`}>Visible catalogue</Label>
                                  <Switch
                                    id={`active-${theme.slug}`}
                                    checked={isVisible}
                                    onCheckedChange={(isActive) => void updateTheme(theme.slug, { isActive, isVisible: isActive })}
                                  />
                                </div>
                              </div>

                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button type="button" variant="outline" className="w-full justify-between border-[#D6C5A8]">
                                    <span className="inline-flex items-center gap-2">
                                      <Palette className="size-4 text-[#B89248]" />
                                      Personnaliser les couleurs
                                    </span>
                                    <ChevronDown className="size-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-3 space-y-3 rounded-lg border border-[#E5D9C7] bg-white p-3 transition-all duration-300 ease-in-out">
                                  <div className="grid gap-3 sm:grid-cols-2">
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
                                            <span className="truncate rounded bg-[#F7F2EA] px-2 py-2 text-xs text-muted-foreground">
                                              {themeColorValue(theme, key)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>

                            <div className="space-y-4 rounded-lg border border-[#E5D9C7] bg-white p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[#171312]">Media du modele</p>
                                  <p className="text-xs text-muted-foreground">Video d'ouverture synchronisee avec Supabase.</p>
                                </div>
                                {videoSrc && <Badge variant="outline" className="border-emerald-200 text-emerald-700">Synchronisee</Badge>}
                              </div>

                              <label
                                className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#D6C5A8] bg-[#FDFBF7] p-4 text-center transition hover:border-[#B89248] hover:bg-[#FAF6EF]"
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
                                    ? `Televersement en cours... ${progress}%`
                                    : "Uploader la video d'ouverture"}
                                </span>
                                <span className="mt-1 text-xs text-muted-foreground">
                                  {uploadingTheme === theme.slug ? "Veuillez patienter" : "MP4, MOV/QuickTime ou WEBM - 50 Mo max"}
                                </span>
                                {uploadingTheme === theme.slug && <Progress value={progress} className="mt-4 h-2" />}
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

                              {videoSrc && (
                                <div className="space-y-3">
                                  <video src={videoSrc} className="aspect-video w-full rounded-lg bg-black object-cover" controls muted playsInline preload="metadata" />
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

                              <div className="flex items-center gap-2 rounded-lg bg-[#F7F2EA] px-3 py-2 text-sm text-muted-foreground">
                                <Check className="size-4 text-[#B89248]" />
                                Palette synchronisee avec invitation et pass.
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                );
              })}

              {themes.length === 0 && (
                <Card className="rounded-lg border-dashed border-[#D6C5A8] bg-white/70">
                  <CardContent className="flex min-h-40 flex-col items-center justify-center p-6 text-center">
                    <Film className="mb-3 size-8 text-[#B89248]" />
                    <p className="font-medium text-[#171312]">Aucun modele configure</p>
                    <Button type="button" variant="outline" className="mt-4" onClick={() => setCreateThemeOpen(true)}>
                      <Plus className="mr-2 size-4" />
                      Creer le premier modele
                    </Button>
                  </CardContent>
                </Card>
              )}
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
