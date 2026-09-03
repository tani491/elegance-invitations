'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore, type Guest } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, QrCode, Download, PartyPopper } from 'lucide-react';

/* ============================================================
   RSVP Modal — Shows QR code, allows guest to confirm/decline
   ============================================================ */

export default function GuestRSVPModal() {
  const {
    rsvpModalOpen,
    setRsvpModalOpen,
    selectedGuestId,
    event,
    updateGuestRSVP,
    setPassModalOpen,
  } = useAppStore();

  const guest = event.guests.find((g) => g.id === selectedGuestId);
  const [status, setStatus] = useState<string>('');
  const [plusOnes, setPlusOnes] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!guest) return null;

  const qrValue = `${window?.location?.origin || ''}/rsvp/${guest.qrToken}`;

  const handleSubmit = () => {
    if (!status) return;
    updateGuestRSVP(guest.id, {
      rsvpStatus: status as Guest['rsvpStatus'],
      plusOnes,
    });
    setSubmitted(true);
  };

  const handleOpenPass = () => {
    setRsvpModalOpen(false);
    setTimeout(() => setPassModalOpen(true), 300);
  };

  const handleClose = () => {
    setRsvpModalOpen(false);
    setSubmitted(false);
    setStatus('');
    setPlusOnes(0);
  };

  return (
    <Dialog open={rsvpModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md sm:max-w-lg border-gold-glow bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-gold-gradient">
            Confirmation de Présence
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {/* QR Code */}
              <div className="flex flex-col items-center gap-3 py-3">
                <div className="card-luxury p-4 rounded-2xl">
                  <QRCodeSVG
                    value={qrValue}
                    size={140}
                    level="H"
                    bgColor="transparent"
                    fgColor="oklch(0.18 0.012 280)"
                  />
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  Votre code d'accès : <span className="font-mono font-semibold text-foreground">{guest.accessCode}</span>
                </p>
              </div>

              {/* Guest info */}
              <div className="card-luxury rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gold" />
                  <span className="font-display text-base">{guest.fullName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Table :</span>{' '}
                    <span className="font-medium">{guest.table || 'Non assignée'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Accompagnants max :</span>{' '}
                    <span className="font-medium">{guest.maxGuests}</span>
                  </div>
                </div>
              </div>

              {/* RSVP Status */}
              <div className="space-y-2">
                <Label className="font-display text-sm">Votre réponse</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={status === 'confirmed' ? 'default' : 'outline'}
                    className={`h-12 ${status === 'confirmed' ? 'bg-gold text-charcoal hover:bg-gold-dark' : 'border-gold/30 hover:border-gold/60'}`}
                    onClick={() => setStatus('confirmed')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Présent(e)
                  </Button>
                  <Button
                    variant={status === 'declined' ? 'destructive' : 'outline'}
                    className={`h-12 ${status === 'declined' ? '' : 'border-gold/30 hover:border-gold/60'}`}
                    onClick={() => setStatus('declined')}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Absent(e)
                  </Button>
                </div>
              </div>

              {/* Plus ones */}
              {status === 'confirmed' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="font-display text-sm">
                      Nombre d'accompagnants
                    </Label>
                    <Select
                      value={String(plusOnes)}
                      onValueChange={(v) => setPlusOnes(Number(v))}
                    >
                      <SelectTrigger className="border-gold/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: guest.maxGuests + 1 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {i} {i === 0 ? '— Seul(e)' : i === 1 ? 'accompagnant' : 'accompagnants'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}

              {/* Submit */}
              <Button
                className="w-full h-12 btn-luxury bg-gold text-charcoal font-display tracking-elegant"
                onClick={handleSubmit}
                disabled={!status}
              >
                Confirmer ma réponse
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              >
                {status === 'confirmed' ? (
                  <PartyPopper className="w-16 h-16 mx-auto text-gold" />
                ) : (
                  <XCircle className="w-16 h-16 mx-auto text-muted-foreground" />
                )}
              </motion.div>

              <div>
                <h3 className="font-display text-xl">
                  {status === 'confirmed'
                    ? 'Merci pour votre confirmation !'
                    : 'Nous regrettons votre absence.'}
                </h3>
                <p className="text-muted-foreground mt-2 font-body">
                  {status === 'confirmed'
                    ? 'Votre présence a été enregistrée. Téléchargez votre pass d\'accès ci-dessous.'
                    : 'Nous espérons vous retrouver à une prochaine occasion.'}
                </p>
              </div>

              {status === 'confirmed' && (
                <Button
                  className="btn-luxury bg-gold text-charcoal font-display"
                  onClick={handleOpenPass}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger mon Pass
                </Button>
              )}

              <Button
                variant="outline"
                className="border-gold/30 font-display"
                onClick={handleClose}
              >
                Fermer
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
