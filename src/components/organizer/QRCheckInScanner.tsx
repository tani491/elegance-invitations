'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  AlertCircle,
  ScanLine,
  UserCheck,
  Users,
  Clock,
  Camera,
  Keyboard,
} from 'lucide-react';

/* ============================================================
   QR Check-In Scanner — Day-of guest entry validation
   Supports both html5-qrcode camera scanning and manual input
   ============================================================ */

/* html5-qrcode is dynamically imported to avoid SSR issues */
type Html5QrcodeType = {
  start: (
    deviceId: string | undefined,
    config: Record<string, unknown>,
    onScanSuccess: (decodedText: string) => void,
    onScanFailure: () => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

export default function QRCheckInScanner() {
  const {
    checkinScannerOpen,
    setCheckinScannerOpen,
    event,
    checkInGuest,
  } = useAppStore();

  const [scanInput, setScanInput] = useState('');
  const [scannedGuest, setScannedGuest] = useState<
    (typeof event.guests)[0] | null
  >(null);
  const [scanResult, setScanResult] = useState<
    'success' | 'already' | 'notfound' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannerMode, setScannerMode] = useState<'manual' | 'camera'>('manual');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const confirmedCount = event.guests.filter(
    (g) => g.rsvpStatus === 'confirmed'
  ).length;
  const checkedInCount = event.guests.filter((g) => g.isCheckedIn).length;

  /* Process a scanned token (shared between camera and manual) */
  const processToken = useCallback((token: string) => {
    const normalized = token.trim().toLowerCase();
    const guest = event.guests.find(
      (g) =>
        g.qrToken.toLowerCase() === normalized ||
        g.accessCode.toLowerCase() === normalized
    );

    if (!guest) {
      setScannedGuest(null);
      setScanResult('notfound');
    } else if (guest.isCheckedIn) {
      setScannedGuest(guest);
      setScanResult('already');
    } else {
      checkInGuest(guest.id);
      setScannedGuest({ ...guest, isCheckedIn: true, checkedInAt: new Date().toISOString() });
      setScanResult('success');
    }
  }, [event.guests, checkInGuest]);

  /* Manual scan handler */
  const handleManualScan = useCallback(() => {
    if (!scanInput.trim() || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      processToken(scanInput);
      setIsProcessing(false);
      setScanInput('');
    }, 600);
  }, [scanInput, isProcessing, processToken]);

  /* Camera scan success handler */
  const handleCameraScan = useCallback((decodedText: string) => {
    processToken(decodedText);
  }, [processToken]);

  /* Start camera scanner */
  const startCamera = useCallback(async () => {
    if (!scannerDivRef.current) return;
    setIsCameraStarting(true);
    setCameraError(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-checkin-reader');
      scannerRef.current = scanner as unknown as Html5QrcodeType;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        handleCameraScan,
        () => { /* scan failure — ignore */ }
      );

      setScannerMode('camera');
      setIsCameraStarting(false);
    } catch (err) {
      setIsCameraStarting(false);
      setCameraError(
        'Caméra non disponible. Vérifiez les permissions ou utilisez la saisie manuelle.'
      );
      setScannerMode('manual');
    }
  }, [handleCameraScan]);

  /* Stop camera scanner */
  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (_e) {
        /* scanner may already be stopped */
      }
      scannerRef.current = null;
    }
    setScannerMode('manual');
    setCameraError(null);
  }, []);

  /* Cleanup camera on dialog close */
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch((_e) => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleManualScan();
  };

  const resetScan = () => {
    setScannedGuest(null);
    setScanResult(null);
    setScanInput('');
    if (scannerMode === 'manual') {
      inputRef.current?.focus();
    }
  };

  const handleClose = () => {
    stopCamera();
    setCheckinScannerOpen(false);
    resetScan();
  };

  /* Focus input when dialog opens (manual mode) */
  useEffect(() => {
    if (checkinScannerOpen && scannerMode === 'manual') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [checkinScannerOpen, scannerMode]);

  return (
    <Dialog open={checkinScannerOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md border-gold-glow bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-gold-gradient">
            Scanner d&apos;Entrée
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card-luxury rounded-xl p-3 text-center">
              <Users className="w-4 h-4 mx-auto text-gold mb-1" />
              <p className="font-display-bold text-lg">{confirmedCount}</p>
              <p className="text-xs text-muted-foreground">Confirmés</p>
            </div>
            <div className="card-luxury rounded-xl p-3 text-center">
              <UserCheck className="w-4 h-4 mx-auto text-gold mb-1" />
              <p className="font-display-bold text-lg">{checkedInCount}</p>
              <p className="text-xs text-muted-foreground">Présents</p>
            </div>
            <div className="card-luxury rounded-xl p-3 text-center">
              <Clock className="w-4 h-4 mx-auto text-gold mb-1" />
              <p className="font-display-bold text-lg">
                {confirmedCount - checkedInCount}
              </p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={scannerMode === 'manual' ? 'default' : 'outline'}
              className={`flex-1 ${scannerMode === 'manual' ? 'bg-gold text-charcoal' : 'border-gold/30'}`}
              size="sm"
              onClick={stopCamera}
            >
              <Keyboard className="w-4 h-4 mr-1.5" />
              Saisie manuelle
            </Button>
            <Button
              variant={scannerMode === 'camera' ? 'default' : 'outline'}
              className={`flex-1 ${scannerMode === 'camera' ? 'bg-gold text-charcoal' : 'border-gold/30'}`}
              size="sm"
              onClick={startCamera}
              disabled={isCameraStarting}
            >
              <Camera className="w-4 h-4 mr-1.5" />
              {isCameraStarting ? 'Démarrage...' : 'Caméra QR'}
            </Button>
          </div>

          {/* Camera scanner area */}
          {scannerMode === 'camera' && (
            <div className="relative rounded-xl overflow-hidden border border-gold/20">
              <div
                id="qr-checkin-reader"
                ref={scannerDivRef}
                className="w-full"
                style={{ minHeight: 250 }}
              />
              {cameraError && (
                <p className="text-xs text-destructive text-center p-3">
                  {cameraError}
                </p>
              )}
            </div>
          )}

          {/* Manual scanner input */}
          {scannerMode === 'manual' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                  <Input
                    ref={inputRef}
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="QR Token ou Code d&apos;accès..."
                    className="pl-10 border-gold/30 font-mono"
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  className="btn-luxury bg-gold text-charcoal font-display"
                  onClick={handleManualScan}
                  disabled={isProcessing || !scanInput.trim()}
                >
                  {isProcessing ? '...' : 'Valider'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scannez le QR Code du pass ou saisissez le code manuellement
              </p>
            </div>
          )}

          {/* Scan result */}
          <AnimatePresence mode="wait">
            {scanResult && (
              <motion.div
                key={scanResult}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-xl p-4 text-center ${
                  scanResult === 'success'
                    ? 'bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                    : scanResult === 'already'
                    ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/30'
                    : 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
                }`}
              >
                {scanResult === 'success' && (
                  <>
                    <CheckCircle2 className="w-10 h-10 mx-auto text-green-600 mb-2" />
                    <p className="font-display-bold text-green-800 dark:text-green-200">
                      Entrée validée !
                    </p>
                    {scannedGuest && (
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {scannedGuest.fullName} — {scannedGuest.table}
                      </p>
                    )}
                  </>
                )}
                {scanResult === 'already' && (
                  <>
                    <AlertCircle className="w-10 h-10 mx-auto text-amber-600 mb-2" />
                    <p className="font-display-bold text-amber-800 dark:text-amber-200">
                      Déjà enregistré(e)
                    </p>
                    {scannedGuest && (
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        {scannedGuest.fullName} est déjà entré(e) à{' '}
                        {scannedGuest.checkedInAt
                          ? new Date(scannedGuest.checkedInAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </p>
                    )}
                  </>
                )}
                {scanResult === 'notfound' && (
                  <>
                    <AlertCircle className="w-10 h-10 mx-auto text-red-600 mb-2" />
                    <p className="font-display-bold text-red-800 dark:text-red-200">
                      Invité non trouvé
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Vérifiez le code et réessayez
                    </p>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-gold/30 font-display"
                  onClick={resetScan}
                >
                  Nouveau scan
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick test tokens (manual mode only) */}
          {scannerMode === 'manual' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Test rapide :</p>
              <div className="flex flex-wrap gap-2">
                {event.guests.slice(0, 3).map((g) => (
                  <button
                    key={g.id}
                    className="text-xs px-2 py-1 rounded card-luxury hover:card-luxury-elevated transition-all font-mono"
                    onClick={() => {
                      setScanInput(g.qrToken);
                      inputRef.current?.focus();
                    }}
                  >
                    {g.accessCode}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
