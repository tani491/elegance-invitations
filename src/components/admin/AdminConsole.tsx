"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Copy, ExternalLink, Eye, EyeOff, Film, KeyRound, MessageSquareQuote, Package, Palette, Phone, Plus, Settings2, ShieldCheck, Trash2, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MotionVideoUploader } from "@/components/dashboard/MotionVideoUploader";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";
import {
  allowedPlansForCategory,
  assignablePlansFromAllowedPlans,
  canUseMotionVideo,
  canUseTheme,
  categoryForAllowedPlans,
  planLabelForPlan,
  THEME_PLAN_OPTIONS,
  type AssignableThemePlan,
} from "@/lib/plan-gating";
import { notifyThemeCatalogChanged } from "@/lib/theme-sync";
import { SCROLL_ANIMATION_OPTIONS, TITLE_FONT_OPTIONS } from "@/types/database.types";
import type { ScrollAnimationType, ThemeConfig } from "@/types/database.types";

interface EventRow {
  id: string;
  name: string;
  organizerName: string;
  clientEmail: string | null;
  planType: string;
  motionVideoUrl: string | null;
  isActive: boolean;
  isPaid: boolean;
  createdAt: string;
  _count?: { guests: number };
}

interface ClientAccessPayload {
  loginUrl: string;
  invitationUrl: string;
  email: string;
  password: string;
  whatsAppMessage: string;
  whatsAppUrl: string | null;
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
  allowedPlans: AssignableThemePlan[];
  bgPrimary: string;
  cardBg: string;
  accentGold: string;
  textColor: string;
  scrollAnimation: ScrollAnimationType;
  titleFont: string;
  isActive: boolean;
};

type ThemeColorField = "bgPrimary" | "cardBg" | "accentGold" | "textColor";

const DEFAULT_THEME_ALLOWED_PLANS: AssignableThemePlan[] = ["privilege", "imperiale"];
const THEME_COLOR_SAVE_DELAY = 650;

const COLOR_FIELDS: { key: ThemeColorField; label: string; fallback: string }[] = [
  { key: "bgPrimary", label: "Arriere-plan", fallback: "#1B0F12" },
  { key: "cardBg", label: "Cartes / feuillets", fallback: "#FDFBF7" },
  { key: "accentGold", label: "Accent & or", fallback: "#D4AF37" },
  { key: "textColor", label: "Textes", fallback: "#1B0F12" },
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
    allowedPlans: DEFAULT_THEME_ALLOWED_PLANS,
    bgPrimary: "#1B0F12",
    cardBg: "#FDFBF7",
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

function previewGradientFromTheme(theme: Partial<ThemeConfig>) {
  const bgPrimary = theme.bgPrimary ?? theme.primaryColor ?? "#5C1D24";
  const cardBg = theme.cardBg ?? theme.secondaryColor ?? "#FDFBF7";
  const accentGold = theme.accentGold ?? theme.goldColor ?? "#D4AF37";
  return `linear-gradient(135deg, ${bgPrimary} 0%, ${accentGold} 52%, ${cardBg} 100%)`;
}

function assignablePlansForTheme(theme: ThemeConfig) {
  return assignablePlansFromAllowedPlans(theme.allowedPlans, allowedPlansForCategory(theme.category));
}

function nextThemePlans(plans: AssignableThemePlan[], plan: AssignableThemePlan, checked: boolean) {
  const selected = new Set(plans);
  if (checked) {
    selected.add(plan);
  } else if (selected.size > 1) {
    selected.delete(plan);
  }

  return THEME_PLAN_OPTIONS.map((option) => option.value).filter((value) => selected.has(value));
}

function ThemePlanCheckboxGroup({
  idPrefix,
  value,
  onChange,
}: {
  idPrefix: string;
  value: AssignableThemePlan[];
  onChange: (value: AssignableThemePlan[]) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2" role="group" aria-label="Formules compatibles">
      {THEME_PLAN_OPTIONS.map((option) => {
        const checked = value.includes(option.value);
        const onlySelected = checked && value.length === 1;
        const checkboxId = `${idPrefix}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={checkboxId}
            className={[
              "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition",
              checked ? "border-[#B89248] bg-[#FFF8E6] text-[#171312]" : "border-[#E5D9C7] bg-white text-[#4B403A]",
              onlySelected ? "cursor-default" : "hover:border-[#B89248]",
            ].join(" ")}
          >
            <Checkbox
              id={checkboxId}
              checked={checked}
              disabled={onlySelected}
              onCheckedChange={(nextChecked) => onChange(nextThemePlans(value, option.value, nextChecked === true))}
              className="size-5"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="block text-xs text-muted-foreground">{option.price}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

function themePlanLabel(plan: AssignableThemePlan) {
  return THEME_PLAN_OPTIONS.find((option) => option.value === plan)?.label ?? plan;
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

function normalizeWhatsAppPhone(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("221")) return digits;
  return `221${digits.replace(/^0+/, "")}`;
}

function buildWhatsAppUrl(phone: string, message: string) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return null;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
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
    planType: "privilege",
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
  const [deleteTarget, setDeleteTarget] = useState<EventRow | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const colorSaveTimers = useRef<Record<string, number>>({});

  const stats = useMemo(() => {
    const active = events.filter((event) => event.isActive).length;
    return [
      { label: "Commandes", value: events.length, icon: Package },
      { label: "Actifs", value: active, icon: ShieldCheck },
      { label: "Themes", value: themes.length, icon: Palette },
    ];
  }, [events, themes]);

  const visibleThemeCount = useMemo(() => themes.filter((theme) => theme.isActive !== false).length, [themes]);
  const availableClientThemes = useMemo(
    () => themes.filter((theme) => theme.isActive !== false && canUseTheme(form.planType, theme.slug, theme.allowedPlans)),
    [form.planType, themes],
  );

  async function loadAdminData() {
    const [themesResult, eventsResult] = await Promise.allSettled([
      fetch("/api/admin/themes", { cache: "no-store", credentials: "include" }).then((response) => response.json()),
      fetch("/api/admin/events", { cache: "no-store", credentials: "include" }).then((response) => response.json()),
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

  useEffect(() => {
    return () => {
      Object.values(colorSaveTimers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    if (availableClientThemes.length === 0) return;
    if (availableClientThemes.some((theme) => theme.slug === form.template)) return;
    setForm((prev) => ({ ...prev, template: availableClientThemes[0].slug }));
  }, [availableClientThemes, form.template]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Message WhatsApp copie.");
      return true;
    } catch {
      toast("Message WhatsApp prêt. Copie automatique indisponible sur ce navigateur.");
      return false;
    }
  }

  async function createClient(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);
    const pendingWhatsAppWindow = normalizeWhatsAppPhone(form.whatsapp) ? window.open("about:blank", "_blank") : null;

    try {
      const requestClientCreation = () => fetch("/api/admin/clients", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let response = await requestClientCreation();
      let json = (await response.json()) as CreateClientResponse;

      if ((response.status === 401 || response.status === 403) && !json.success) {
        const sessionResponse = await fetch("/api/auth/session", {
          credentials: "include",
          cache: "no-store",
        });
        const sessionJson = await sessionResponse.json().catch(() => null) as { authenticated?: boolean; user?: { role?: string } } | null;

        if (sessionJson?.authenticated && sessionJson.user?.role === "SUPER_ADMIN") {
          response = await requestClientCreation();
          json = (await response.json()) as CreateClientResponse;
        }
      }

      if (!response.ok || !json.success) {
        pendingWhatsAppWindow?.close();
        toast.error(json.error ?? "Creation impossible.");
        return;
      }

      if (!json.data) {
        pendingWhatsAppWindow?.close();
        toast.error("Reponse admin incomplete.");
        return;
      }

      const whatsAppUrl = buildWhatsAppUrl(form.whatsapp, json.data.whatsAppMessage);
      const access = {
        loginUrl: json.data.loginUrl,
        invitationUrl: json.data.invitationUrl,
        email: json.data.user.email,
        password: json.data.provisionalPassword,
        whatsAppMessage: json.data.whatsAppMessage,
        whatsAppUrl,
      };
      setAccessModal(access);
      setLastMessage(access.whatsAppMessage);
      await copyText(access.whatsAppMessage);
      if (whatsAppUrl) {
        if (pendingWhatsAppWindow) {
          pendingWhatsAppWindow.location.href = whatsAppUrl;
        } else {
          window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
        }
      } else {
        pendingWhatsAppWindow?.close();
      }
      toast.success("Compte client cree.");
      setForm({ coupleName: "", email: "", whatsapp: "", password: "", planType: "privilege", template: form.template });
      await loadAdminData();
    } catch {
      pendingWhatsAppWindow?.close();
      toast.error("Erreur reseau pendant la creation.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleEvent(eventId: string, isActive: boolean) {
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, isActive } : event)));
    await fetch(`/api/admin/events/${eventId}`, {
      method: "PATCH",
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  }

  async function updateEventMotionVideo(eventId: string, motionVideoUrl: string | null) {
    const previousEvents = events;
    setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, motionVideoUrl } : event)));

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motionVideoUrl }),
      });
      const json = await response.json();

      if (!response.ok || !json.success) {
        setEvents(previousEvents);
        toast.error(json.error ?? "Video motion non sauvegardee.");
        return;
      }

      setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, ...json.data } : event)));
      toast.success(motionVideoUrl ? "Video motion associee." : "Video motion retiree.");
    } catch (error) {
      console.error("Motion video event update failed:", error);
      setEvents(previousEvents);
      toast.error("Video motion non sauvegardee.");
    }
  }

  async function deleteOrderPermanently(order: EventRow) {
    setDeletingOrderId(order.id);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "DELETE",
        credentials: "include",
        cache: "no-store",
      });
      const json = await response.json().catch(() => null) as { success?: boolean; error?: string } | null;

      if (!response.ok || !json?.success) {
        toast.error(json?.error ?? "Suppression impossible.");
        return;
      }

      setEvents((prev) => prev.filter((event) => event.id !== order.id));
      setDeleteTarget(null);
      toast.success("Commande supprimée avec succès");
    } catch (error) {
      console.error("Order hard delete failed:", error);
      toast.error("Suppression impossible.");
    } finally {
      setDeletingOrderId(null);
    }
  }

  async function updateTheme(slug: string, data: Partial<ThemeConfig>, successMessage = "Theme sauvegarde.") {
    setSavingTheme(slug);
    try {
      const response = await fetch("/api/admin/themes", {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
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

  function updateThemeColor(slug: string, key: ThemeColorField, value: string) {
    const patch = themeColorUpdate(key, value);
    setThemes((prev) =>
      prev.map((theme) => {
        if (theme.slug !== slug) return theme;
        const nextTheme = { ...theme, ...patch };
        return { ...nextTheme, previewGradient: previewGradientFromTheme(nextTheme) };
      }),
    );

    const timerKey = `${slug}:${key}`;
    const previousTimer = colorSaveTimers.current[timerKey];
    if (previousTimer) window.clearTimeout(previousTimer);

    colorSaveTimers.current[timerKey] = window.setTimeout(() => {
      delete colorSaveTimers.current[timerKey];
      void updateTheme(slug, patch, "Couleur sauvegardee.");
    }, THEME_COLOR_SAVE_DELAY);
  }

  function updateThemeAllowedPlans(theme: ThemeConfig, allowedPlans: AssignableThemePlan[]) {
    const category = categoryForAllowedPlans(allowedPlans);
    setThemes((prev) =>
      prev.map((item) => (item.slug === theme.slug ? { ...item, allowedPlans, category } : item)),
    );
    void updateTheme(theme.slug, { allowedPlans, category }, "Formules compatibles sauvegardees.");
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
        credentials: "include",
        cache: "no-store",
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
        credentials: "include",
        cache: "no-store",
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
        credentials: "include",
        cache: "no-store",
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
    <main className="min-h-screen overflow-x-hidden bg-[#F7F2EA] px-4 py-6 sm:px-6 lg:px-8 [&_[data-slot=button]]:min-h-12 [&_[data-slot=button]]:min-w-12 [&_[data-slot=input]]:min-h-12 [&_[data-slot=select-trigger]]:min-h-12 [&_[data-slot=select-trigger]]:w-full [&_[data-slot=tabs-trigger]]:min-h-12">
      <div className="mx-auto w-full max-w-7xl">
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
            <Button asChild variant="outline" className="border-[#D6C5A8]">
              <Link href="/admin/testimonials">
                <MessageSquareQuote className="mr-2 size-4" />
                Temoignages
              </Link>
            </Button>
            <Button variant="outline" onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST", credentials: "include", cache: "no-store" });
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
                        <SelectItem value="privilege">Privilège</SelectItem>
                        <SelectItem value="imperiale">Impérial Cinematic Motion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modele par defaut</Label>
                    <Select value={form.template} onValueChange={(template) => setForm({ ...form, template })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {availableClientThemes.map((theme) => <SelectItem key={theme.slug} value={theme.slug}>{theme.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {availableClientThemes.length === 0 && (
                      <p className="text-xs text-red-700">Aucun modele actif n'est disponible pour cette formule.</p>
                    )}
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
                      <TableHead>Motion</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actif</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{event.clientEmail ?? event.organizerName}</TableCell>
                        <TableCell>{event.name}</TableCell>
                        <TableCell>{planLabelForPlan(event.planType)}</TableCell>
                        <TableCell>{event._count?.guests ?? 0}</TableCell>
                        <TableCell>
                          <MotionVideoUploader
                            compact
                            value={event.motionVideoUrl}
                            eventId={event.id}
                            locked={!canUseMotionVideo(event.planType)}
                            onChange={(motionVideoUrl) => updateEventMotionVideo(event.id, motionVideoUrl)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={event.isActive ? "default" : "outline"}>{event.isActive ? "Actif" : "Suspendu"}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch checked={event.isActive} onCheckedChange={(checked) => toggleEvent(event.id, checked)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Supprimer définitivement"
                            aria-label={`Supprimer définitivement ${event.name}`}
                            className="group text-red-500 hover:bg-red-50 hover:text-red-700"
                            disabled={deletingOrderId === event.id}
                            onClick={() => setDeleteTarget(event)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500 transition group-hover:text-red-700" />
                          </Button>
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
              <DialogContent className="mx-auto max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto border-[#D7C4A3] bg-[#FDFBF7] px-4 py-6 pb-20 sm:px-6">
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nom du modele</Label>
                      <Input
                        value={createThemeForm.name}
                        onChange={(event) => setCreateThemeForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Palais Royal"
                        required
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Formules compatibles</Label>
                      <ThemePlanCheckboxGroup
                        idPrefix="new-theme-plan"
                        value={createThemeForm.allowedPlans}
                        onChange={(allowedPlans) =>
                          setCreateThemeForm((prev) => ({
                            ...prev,
                            allowedPlans,
                            category: categoryForAllowedPlans(allowedPlans),
                          }))
                        }
                      />
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
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {COLOR_FIELDS.map(({ key, label, fallback }) => (
                        <ColorPicker
                          key={key}
                          label={label}
                          value={createThemeForm[key]}
                          fallback={fallback}
                          onChange={(color) => setCreateThemeForm((prev) => ({ ...prev, [key]: color }))}
                        />
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
                const themeAllowedPlans = assignablePlansForTheme(theme);

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
                              {themeAllowedPlans.map((plan) => (
                                <Badge key={plan} variant="outline" className="border-[#E5D9C7] bg-[#FDFBF7] text-[#5C1D24]">
                                  {themePlanLabel(plan)}
                                </Badge>
                              ))}
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
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Formules compatibles</Label>
                                  <ThemePlanCheckboxGroup
                                    idPrefix={`theme-plan-${theme.slug}`}
                                    value={themeAllowedPlans}
                                    onChange={(allowedPlans) => updateThemeAllowedPlans(theme, allowedPlans)}
                                  />
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
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {COLOR_FIELDS.map(({ key, label, fallback }) => (
                                      <ColorPicker
                                        key={key}
                                        label={label}
                                        value={themeColorValue(theme, key)}
                                        fallback={fallback}
                                        onChange={(color) => updateThemeColor(theme.slug, key, color)}
                                      />
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
              {accessModal.whatsAppUrl && (
                <Button type="button" variant="outline" className="w-full border-[#D6C5A8]" asChild>
                  <a href={accessModal.whatsAppUrl} target="_blank" rel="noreferrer">
                    <Phone className="mr-2 size-4" />
                    Ouvrir WhatsApp
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deletingOrderId) setDeleteTarget(null);
        }}
      >
        <DialogContent className="border-red-100 bg-[#FDFBF7] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#171312]">
              <Trash2 className="size-5 text-red-500" />
              Suppression définitive
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer définitivement {deleteTarget?.name ?? "cette commande"} ? Cette action supprimera tous les invités, le QR code et la page d'invitation sans retour possible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="border-[#D6C5A8]"
              disabled={Boolean(deletingOrderId)}
              onClick={() => setDeleteTarget(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={!deleteTarget || Boolean(deletingOrderId)}
              onClick={() => {
                if (deleteTarget) void deleteOrderPermanently(deleteTarget);
              }}
            >
              {deletingOrderId ? "Suppression..." : "Confirmer la suppression"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
