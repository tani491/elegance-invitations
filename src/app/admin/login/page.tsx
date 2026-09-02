"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, audience: "admin" }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Acces refuse.");
        return;
      }

      router.push(searchParams.get("next") || "/admin");
      router.refresh();
    } catch {
      toast.error("Erreur reseau. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="admin-email">Adresse email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#D4AF37]" />
          <Input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            autoComplete="email"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-password">Mot de passe</Label>
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#D4AF37]" />
          <Input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            autoComplete="current-password"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="btn-luxury h-11 w-full bg-[#5C1D24] text-white">
        {isLoading ? "Verification..." : "Entrer dans l'admin"}
        {!isLoading && <ArrowRight className="ml-2 size-4" />}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1A1818] px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <Card className="border-[#D4AF37]/40 bg-[#FAF7F2] shadow-2xl">
          <CardHeader className="px-8 pt-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#D4AF37]/15">
              <ShieldCheck className="size-6 text-[#5C1D24]" />
            </div>
            <h1 className="font-display-bold mt-4 text-2xl tracking-luxury text-[#1A1818]">
              Super Admin
            </h1>
            <p className="font-body mt-2 text-sm text-muted-foreground">
              Connexion reservee a l'administration Elegance.
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Suspense fallback={<div className="h-44" />}>
              <AdminLoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
