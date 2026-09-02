"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim() || password.length < 8) {
      toast.error("Veuillez saisir un email valide et votre mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, audience: "client" }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error ?? "Connexion impossible.");
        return;
      }

      toast.success("Connexion reussie.");
      router.push(searchParams.get("next") || data.redirectTo || "/dashboard");
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
        <Label htmlFor="email">Adresse email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#D4AF37]" />
          <Input
            id="email"
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
        <Label htmlFor="password">Mot de passe</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#D4AF37]" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10"
            autoComplete="current-password"
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="btn-luxury h-11 w-full">
        {isLoading ? "Verification..." : "Se connecter"}
        {!isLoading && <ArrowRight className="ml-2 size-4" />}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FAF7F2] px-4">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <Card className="card-luxury-elevated border-gold-glow">
          <CardHeader className="px-8 pt-8 text-center">
            <p className="font-script text-5xl text-[#D4AF37]">Elegance</p>
            <h1 className="font-display-bold mt-2 text-2xl tracking-luxury text-[#1A1818]">
              Espace Client
            </h1>
            <p className="font-body mt-2 text-sm text-muted-foreground">
              Acces reserve aux couples disposant d'un compte active.
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Suspense fallback={<div className="h-44" />}>
              <ClientLoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
