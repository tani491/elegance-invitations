"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Testimonial = {
  id: string;
  coupleNames: string;
  location: string;
  review: string;
  rating: number;
  formula: string | null;
  photoUrl: string | null;
  isVisible: boolean;
  createdAt: string;
};

const EMPTY_FORM = {
  coupleNames: "",
  location: "",
  review: "",
  formula: "",
  rating: 5,
};

function starFill(current: number, rating: number) {
  return current <= rating ? "#B89248" : "transparent";
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const visibleCount = useMemo(() => testimonials.filter((testimonial) => testimonial.isVisible).length, [testimonials]);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/testimonials", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Temoignages indisponibles.");
        return;
      }
      setTestimonials(json.data ?? []);
    } catch (error) {
      console.error("Testimonials admin load failed:", error);
      toast.error("Impossible de charger les temoignages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTestimonials();
  }, []);

  async function createTestimonial(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          formula: form.formula.trim() || null,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Creation impossible.");
        return;
      }
      setTestimonials((prev) => [json.data, ...prev]);
      setForm(EMPTY_FORM);
      toast.success("Temoignage ajoute.");
    } catch (error) {
      console.error("Testimonial create failed:", error);
      toast.error("Creation impossible.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(testimonial: Testimonial, isVisible: boolean) {
    setPendingId(testimonial.id);
    setTestimonials((prev) => prev.map((item) => (item.id === testimonial.id ? { ...item, isVisible } : item)));
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testimonial.id, isVisible }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error ?? "Mise a jour impossible.");
      }
      setTestimonials((prev) => prev.map((item) => (item.id === testimonial.id ? json.data : item)));
    } catch (error) {
      console.error("Testimonial visibility update failed:", error);
      setTestimonials((prev) => prev.map((item) => (item.id === testimonial.id ? testimonial : item)));
      toast.error("Visibilite non sauvegardee.");
    } finally {
      setPendingId(null);
    }
  }

  async function deleteTestimonial(testimonial: Testimonial) {
    const confirmed = window.confirm(`Supprimer le temoignage de ${testimonial.coupleNames} ?`);
    if (!confirmed) return;

    setPendingId(testimonial.id);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: testimonial.id }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        toast.error(json.error ?? "Suppression impossible.");
        return;
      }
      setTestimonials((prev) => prev.filter((item) => item.id !== testimonial.id));
      toast.success("Temoignage supprime.");
    } catch (error) {
      console.error("Testimonial delete failed:", error);
      toast.error("Suppression impossible.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F2EA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-script text-3xl text-[#B89248]">Elegance</p>
            <h1 className="font-display-bold text-3xl tracking-luxury text-[#171312]">Temoignages de maries</h1>
            <p className="mt-2 text-sm text-muted-foreground">{visibleCount} visible{visibleCount > 1 ? "s" : ""} sur la landing page.</p>
          </div>
          <Button asChild variant="outline" className="border-[#D6C5A8]">
            <Link href="/admin">
              <ArrowLeft className="mr-2 size-4" />
              Retour admin
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[390px_minmax(0,1fr)]">
          <Card className="rounded-lg border-[#E5D9C7] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5 text-[#B89248]" />
                Ajout rapide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createTestimonial} className="space-y-4">
                <div className="space-y-2">
                  <Label>Noms du couple</Label>
                  <Input value={form.coupleNames} onChange={(event) => setForm({ ...form, coupleNames: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Lieu / Ville</Label>
                  <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Avis du couple</Label>
                  <Textarea rows={5} value={form.review} onChange={(event) => setForm({ ...form, review: event.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Formule choisie</Label>
                  <Input value={form.formula} onChange={(event) => setForm({ ...form, formula: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Note</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setForm({ ...form, rating })}
                        className="grid size-10 place-items-center rounded-full border border-[#E5D9C7] bg-[#FDFBF7] transition hover:border-[#B89248]"
                        aria-label={`${rating} etoile${rating > 1 ? "s" : ""}`}
                      >
                        <Star className="size-5 text-[#B89248]" style={{ fill: starFill(rating, form.rating) }} />
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-[#171312] text-white hover:bg-[#2A2320]">
                  {saving ? "Creation..." : "Ajouter le temoignage"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-[#E5D9C7] bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Liste des temoignages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <p className="rounded-lg bg-[#F7F2EA] p-5 text-sm text-muted-foreground">Chargement...</p>}

              {!loading && testimonials.length === 0 && (
                <p className="rounded-lg border border-dashed border-[#D6C5A8] bg-[#FDFBF7] p-8 text-center text-sm text-muted-foreground">
                  Aucun temoignage admin pour le moment. La landing conserve ses avis initiaux en secours.
                </p>
              )}

              {!loading && testimonials.map((testimonial) => (
                <article key={testimonial.id} className="rounded-lg border border-[#E5D9C7] bg-[#FDFBF7] p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display-bold text-xl text-[#171312]">{testimonial.coupleNames}</h2>
                        <Badge className={testimonial.isVisible ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-100 text-stone-500"}>
                          {testimonial.isVisible ? <Eye className="mr-1 size-3" /> : <EyeOff className="mr-1 size-3" />}
                          {testimonial.isVisible ? "Actif" : "Masque"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{testimonial.location}</p>
                      {testimonial.formula && <p className="mt-2 text-sm font-medium text-[#B89248]">{testimonial.formula}</p>}
                      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4A403A]">{testimonial.review}</p>
                      <div className="mt-4 flex gap-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star key={rating} className="size-4 text-[#B89248]" style={{ fill: starFill(rating, testimonial.rating) }} />
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 md:justify-end">
                      <div className="flex items-center gap-2 rounded-full border border-[#E5D9C7] bg-white px-3 py-2">
                        <Switch
                          checked={testimonial.isVisible}
                          disabled={pendingId === testimonial.id}
                          onCheckedChange={(isVisible) => void toggleVisibility(testimonial, isVisible)}
                          aria-label={`Basculer ${testimonial.coupleNames}`}
                        />
                        <span className="text-xs font-medium text-muted-foreground">{testimonial.isVisible ? "Actif" : "Masque"}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-700 hover:bg-red-50 hover:text-red-800"
                        disabled={pendingId === testimonial.id}
                        onClick={() => void deleteTestimonial(testimonial)}
                        aria-label={`Supprimer ${testimonial.coupleNames}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
