"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ScanResultKind = "success" | "already" | "invalid";

export type ScanResult = {
  result: ScanResultKind;
  message: string;
  guest?: {
    fullName: string;
    maxGuests: number;
    plusOnes: number;
    table?: string | null;
    isVip?: boolean;
    checkedInAt?: string | null;
    checkedInBy?: string | null;
  } | null;
};

function playTone(result: ScanResultKind) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.frequency.value = result === "success" ? 880 : result === "already" ? 440 : 160;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (result === "success" ? 0.08 : 0.16));
  oscillator.start();
  oscillator.stop(context.currentTime + (result === "success" ? 0.09 : 0.18));
}

export function ScanResultModal({ result, onClose }: { result: ScanResult | null; onClose: () => void }) {
  useEffect(() => {
    if (!result) return;
    playTone(result.result);
    navigator.vibrate?.(result.result === "success" ? [45] : result.result === "already" ? [80, 40, 80] : [140]);
  }, [result]);

  if (!result) return null;

  const palette = {
    success: {
      bg: "bg-[#052e24]",
      ring: "ring-[#2DD4BF]",
      text: "text-[#99F6E4]",
      icon: CheckCircle2,
      title: result.guest?.fullName ? `Bienvenue ${result.guest.fullName}` : "Pass valide",
      status: "Entree validee",
    },
    already: {
      bg: "bg-[#3b2505]",
      ring: "ring-[#F59E0B]",
      text: "text-[#FCD34D]",
      icon: AlertTriangle,
      title: "Pass deja scanne",
      status: "Verification requise",
    },
    invalid: {
      bg: "bg-[#3b0707]",
      ring: "ring-[#EF4444]",
      text: "text-[#FCA5A5]",
      icon: XCircle,
      title: "Invitation non reconnue",
      status: "Acces refuse",
    },
  }[result.result];
  const Icon = palette.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className={`w-full max-w-md rounded-lg ${palette.bg} p-6 text-white shadow-2xl ring-2 ${palette.ring}`}>
        <div className="mb-5 flex items-start gap-4">
          <div className={`flex size-14 shrink-0 items-center justify-center rounded-lg bg-white/10 ${palette.text}`}>
            <Icon className="size-8" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-semibold uppercase tracking-wide ${palette.text}`}>{palette.status}</p>
            <h2 className="mt-1 text-2xl font-bold leading-tight">{palette.title}</h2>
          </div>
        </div>

        <p className="rounded-lg bg-black/20 p-4 text-base leading-relaxed text-white/90">{result.message}</p>

        {result.guest && (
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/10 p-3">
              <div className="text-2xl font-bold">{Math.max(result.guest.maxGuests, 1)}</div>
              <div className="text-xs text-white/65">personnes</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <div className="text-2xl font-bold">+{result.guest.plusOnes}</div>
              <div className="text-xs text-white/65">accomp.</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3">
              <div className="truncate text-2xl font-bold">{result.guest.table || "-"}</div>
              <div className="text-xs text-white/65">table</div>
            </div>
          </div>
        )}

        <Button type="button" className="mt-6 w-full bg-white text-[#111111] hover:bg-white/90" onClick={onClose}>
          Continuer le scan
        </Button>
      </div>
    </div>
  );
}
