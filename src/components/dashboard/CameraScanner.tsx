"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CameraScanner({ onScan }: { onScan: (token: string) => Promise<void> }) {
  const [manualToken, setManualToken] = useState("");
  const [running, setRunning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "elegance-camera-scanner";

  useEffect(() => () => {
    scannerRef.current?.stop().catch(() => {});
  }, []);

  async function startScanner() {
    if (running) return;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;
    setRunning(true);
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      async (decodedText) => {
        await scanner.stop();
        setRunning(false);
        await onScan(decodedText);
      },
      () => {},
    );
  }

  return (
    <div className="space-y-4">
      <div id={regionId} className="min-h-[260px] overflow-hidden rounded-lg border border-[#D4AF37]/30 bg-black/5" />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={startScanner} disabled={running}>
          <Camera className="mr-2 size-4" />
          {running ? "Camera active" : "Ouvrir la camera"}
        </Button>
        <div className="flex flex-1 gap-2">
          <Input value={manualToken} onChange={(e) => setManualToken(e.target.value)} placeholder="Ou coller le token QR" />
          <Button type="button" variant="outline" onClick={() => manualToken && onScan(manualToken)}>
            <ScanLine className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
