"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { CameraFeedScanner } from "@/components/scanner/CameraFeedScanner";
import { LiveAttendanceBar, type AttendanceStats } from "@/components/scanner/LiveAttendanceBar";
import { ManualCheckInInput, type ScannerGuest } from "@/components/scanner/ManualCheckInInput";
import { ScanResultModal, type ScanResult } from "@/components/scanner/ScanResultModal";
import { Input } from "@/components/ui/input";

type ScannerEvent = {
  id: string;
  name: string;
  slug: string;
};

type ScannerSnapshot = {
  event: ScannerEvent;
  guests: ScannerGuest[];
  stats: AttendanceStats;
};

const EMPTY_STATS: AttendanceStats = {
  expectedPeople: 0,
  checkedInPeople: 0,
  totalPasses: 0,
  checkedPasses: 0,
  attendanceRate: 0,
};

export default function AdminScannerPage() {
  const [snapshot, setSnapshot] = useState<ScannerSnapshot | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [staffLabel, setStaffLabel] = useState("Staff #1");
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = snapshot?.event.id ?? null;

  const refreshSnapshot = useCallback(async () => {
    try {
      const response = await fetch(eventId ? `/api/guests/check-in?eventId=${encodeURIComponent(eventId)}` : "/api/guests/check-in", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "Synchronisation impossible.");
      setSnapshot(payload.data);
      setOnline(true);
      setError(null);
    } catch (refreshError) {
      setOnline(false);
      setError(refreshError instanceof Error ? refreshError.message : "Synchronisation impossible.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    queueMicrotask(() => {
      void refreshSnapshot();
    });
  }, [refreshSnapshot]);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshSnapshot();
    }, 3_500);
    return () => clearInterval(timer);
  }, [refreshSnapshot]);

  const handleCheckIn = useCallback(
    async (token: string) => {
      if (checking) return;
      setChecking(true);

      try {
        const response = await fetch("/api/guests/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, eventId, staffLabel }),
        });
        const payload = await response.json();
        if (payload.data) setSnapshot(payload.data);
        setResult({
          result: payload.result || "invalid",
          message: payload.message || "Invitation non reconnue ou annulee.",
          guest: payload.guest ?? null,
        });
        setOnline(response.ok || Boolean(payload.result));
      } catch {
        setOnline(false);
        setResult({
          result: "invalid",
          message: "Connexion perdue. Verifiez le reseau avant de valider une entree.",
        });
      } finally {
        setChecking(false);
      }
    },
    [checking, eventId, staffLabel],
  );

  const lastEntries = useMemo(
    () =>
      (snapshot?.guests ?? [])
        .filter((guest) => guest.isCheckedIn && guest.checkedInAt)
        .sort((left, right) => new Date(right.checkedInAt || 0).getTime() - new Date(left.checkedInAt || 0).getTime())
        .slice(0, 5),
    [snapshot?.guests],
  );

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <LiveAttendanceBar stats={snapshot?.stats ?? EMPTY_STATS} />

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2DD4BF]">Scanner Jour J</p>
              <h1 className="truncate text-2xl font-bold">{snapshot?.event.name || "Controle d'acces"}</h1>
            </div>
            <div className={`flex items-center gap-2 rounded px-3 py-2 text-xs ${online ? "bg-emerald-400/15 text-emerald-200" : "bg-red-400/15 text-red-100"}`}>
              {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              {online ? "sync live" : "hors ligne"}
            </div>
          </div>

          <CameraFeedScanner disabled={loading || checking || !snapshot} onDetected={handleCheckIn} />

          <ManualCheckInInput guests={snapshot?.guests ?? []} disabled={loading || checking || !snapshot} onSubmit={handleCheckIn} />

          {error && <p className="rounded-lg border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-100">{error}</p>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/55" htmlFor="staff-label">
              Agent de controle
            </label>
            <Input
              id="staff-label"
              value={staffLabel}
              onChange={(event) => setStaffLabel(event.target.value)}
              className="mt-2 border-white/10 bg-black/25 text-white"
              placeholder="Staff #1"
            />
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#2DD4BF]" />
              <h2 className="font-semibold">Dernieres entrees</h2>
            </div>
            {lastEntries.length === 0 ? (
              <p className="text-sm text-white/55">Aucune entree validee pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {lastEntries.map((guest) => (
                  <div key={guest.id} className="rounded-lg bg-black/25 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-semibold">{guest.fullName}</p>
                      <span className="text-xs text-[#2DD4BF]">
                        {guest.checkedInAt
                          ? new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(guest.checkedInAt))
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/50">{guest.table ? `Table ${guest.table}` : "Table non renseignee"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="text-2xl font-bold">{snapshot?.stats.checkedPasses ?? 0}</div>
              <div className="text-xs text-white/55">Pass valides</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="text-2xl font-bold">{snapshot?.stats.totalPasses ?? 0}</div>
              <div className="text-xs text-white/55">Pass emis</div>
            </div>
          </div>
        </aside>
      </section>

      <ScanResultModal result={result} onClose={() => setResult(null)} />
    </main>
  );
}
