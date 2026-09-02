"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Moon, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CameraFeedScanner({
  disabled,
  onDetected,
  sleepAfterIdleMs = 30_000,
  cooldownMs = 2_000,
}: {
  disabled?: boolean;
  onDetected: (payload: string) => Promise<void> | void;
  sleepAfterIdleMs?: number;
  cooldownMs?: number;
}) {
  const reactId = useId();
  const regionId = `elegance-scanner-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const runningRef = useRef(false);
  const cooldownRef = useRef(false);
  const startScannerRef = useRef<() => Promise<void>>(async () => {});
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [running, setRunning] = useState(false);
  const [sleeping, setSleeping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    idleTimerRef.current = null;
    restartTimerRef.current = null;
  }, []);

  const stopScanner = useCallback(async (sleep = false) => {
    clearTimers();
    const scanner = scannerRef.current;
    scannerRef.current = null;
    runningRef.current = false;
    setRunning(false);
    setSleeping(sleep);

    if (!scanner) return;
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      scanner.clear();
    }
  }, [clearTimers]);

  const armIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void stopScanner(true);
    }, sleepAfterIdleMs);
  }, [sleepAfterIdleMs, stopScanner]);

  const startScanner = useCallback(async () => {
    if (disabled || runningRef.current) return;
    setError(null);
    setSleeping(false);

    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        async (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          await stopScanner(false);
          await onDetected(decodedText);
          restartTimerRef.current = setTimeout(() => {
            cooldownRef.current = false;
            void startScannerRef.current();
          }, cooldownMs);
        },
        () => {},
      );
      runningRef.current = true;
      setRunning(true);
      armIdleTimer();
    } catch {
      scannerRef.current = null;
      runningRef.current = false;
      setRunning(false);
      setError("Camera indisponible. Utilisez la saisie manuelle.");
    }
  }, [armIdleTimer, cooldownMs, disabled, onDetected, regionId, stopScanner]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    return () => {
      void stopScanner(false);
    };
  }, [stopScanner]);

  return (
    <div className="space-y-4">
      <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-white/10 bg-black shadow-2xl">
        <div id={regionId} className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_128px,rgba(0,0,0,.62)_129px)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-[#2DD4BF] shadow-[0_0_30px_rgba(45,212,191,.35)]">
          <div className="absolute left-0 top-0 h-1 w-full animate-pulse bg-[#2DD4BF]" />
        </div>
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 p-6 text-center text-white">
            <Camera className="size-10 text-[#2DD4BF]" />
            <p className="text-lg font-semibold">{sleeping ? "Camera en veille" : "Scanner pret"}</p>
            <p className="max-w-xs text-sm text-white/65">
              {sleeping ? "Mise en veille automatique apres 30 secondes sans lecture." : "Activez la camera arriere pour lire les Pass VIP."}
            </p>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-500/15 p-3 text-sm text-red-100">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" onClick={startScanner} disabled={disabled || running} className="bg-[#2DD4BF] text-[#052e24] hover:bg-[#5EEAD4]">
          {sleeping ? <RotateCcw className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}
          {running ? "Scan actif" : sleeping ? "Reprendre" : "Activer camera"}
        </Button>
        <Button type="button" variant="outline" onClick={() => stopScanner(true)} disabled={!running} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
          <Moon className="mr-2 size-4" />
          Veille
        </Button>
      </div>
    </div>
  );
}
