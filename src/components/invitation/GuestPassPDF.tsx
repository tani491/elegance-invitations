'use client';

import { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { useAppStore } from '@/store/useAppStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

/* ============================================================
   Guest Pass PDF — Generates a vector-quality PDF pass with QR
   ============================================================ */

export default function GuestPassPDF() {
  const { passModalOpen, setPassModalOpen, selectedGuestId, event } = useAppStore();
  const guest = event.guests.find((g) => g.id === selectedGuestId);

  const generatePDF = useCallback(() => {
    if (!guest) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [120, 80],
    });

    const w = 120;
    const h = 80;

    /* Background — warm ivory */
    doc.setFillColor(250, 247, 242);
    doc.rect(0, 0, w, h, 'F');

    /* Gold outer border */
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.8);
    doc.rect(3, 3, w - 6, h - 6);

    /* Inner double border */
    doc.setLineWidth(0.3);
    doc.rect(5, 5, w - 10, h - 10);
    doc.rect(6, 6, w - 12, h - 12);

    /* Header band */
    doc.setFillColor(92, 29, 36);
    doc.rect(6, 6, w - 12, 14, 'F');

    /* Title */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(197, 168, 128);
    doc.text('PASS D\'ACCES OFFICIEL', w / 2, 13.5, { align: 'center' });

    /* Event name */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(92, 29, 36);
    doc.text(event.name.toUpperCase(), w / 2, 25, { align: 'center' });

    /* Guest name */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(26, 24, 24);
    doc.text(guest.fullName, w / 2, 34, { align: 'center' });

    /* Divider line */
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.3);
    doc.line(20, 38, w - 20, 38);

    /* Details — left column */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 100, 80);
    const leftCol = 15;
    doc.text('Table :', leftCol, 44);
    doc.text('Code :', leftCol, 50);
    doc.text('Statut :', leftCol, 56);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 24, 24);
    doc.text(guest.table || 'Non assignee', leftCol + 14, 44);
    doc.text(guest.accessCode, leftCol + 14, 50);
    doc.setTextColor(34, 120, 60);
    doc.text('CONFIRME(E)', leftCol + 14, 56);

    /* Date & venue — right column */
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 100, 80);
    const rightCol = 68;
    doc.text('Date :', rightCol, 44);
    doc.text('Lieu :', rightCol, 50);
    doc.text('Accomp. :', rightCol, 56);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 24, 24);
    const dateStr = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'TBD';
    doc.text(dateStr, rightCol + 14, 44);
    doc.text(event.venueName || 'TBD', rightCol + 14, 50);
    doc.text(`${guest.plusOnes} / ${guest.maxGuests}`, rightCol + 14, 56);

    /* QR code placeholder area (right side) */
    const qrX = w - 30;
    const qrY = 28;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 1, qrY - 1, 24, 24, 2, 2, 'F');
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.2);
    doc.roundedRect(qrX - 1, qrY - 1, 24, 24, 2, 2, 'S');

    /* QR code text label (actual QR drawn separately via SVG in UI) */
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(150, 130, 100);
    doc.text('Scanner a l\'entree', qrX + 11, qrY + 26, { align: 'center' });

    /* Footer */
    doc.setDrawColor(197, 168, 128);
    doc.setLineWidth(0.2);
    doc.line(20, h - 10, w - 20, h - 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5);
    doc.setTextColor(160, 140, 110);
    doc.text('Ce pass est nominatif et non transferrable. Presentation obligatoire a l\'entree.', w / 2, h - 5, { align: 'center' });

    doc.save(`Pass_${guest.fullName.replace(/\s+/g, '_')}.pdf`);
  }, [guest, event]);

  const handleClose = () => setPassModalOpen(false);

  if (!guest) return null;

  const qrValue = `PASS:${guest.qrToken}:${guest.accessCode}`;

  return (
    <Dialog open={passModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-gold-glow bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center text-gold-gradient">
            Votre Pass d'Accès
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* QR Code for pass */}
          <div className="flex flex-col items-center">
            <div className="card-luxury p-4 rounded-2xl">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                bgColor="transparent"
                fgColor="oklch(0.18 0.012 280)"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 font-body">
              QR Code de sécurité pour le contrôle d'entrée
            </p>
          </div>

          {/* Guest summary */}
          <div className="card-luxury rounded-xl p-4 space-y-2">
            <div className="text-center">
              <p className="font-display-bold text-lg">{guest.fullName}</p>
              <p className="text-sm text-muted-foreground">{guest.table}</p>
            </div>
            <div className="divider-ornament flex items-center gap-3 py-1">
              <span className="text-gold text-xs">&#9670;</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-center">
              <div>
                <p className="text-muted-foreground text-xs">Code</p>
                <p className="font-mono font-semibold">{guest.accessCode}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="font-semibold">
                  {event.eventDate
                    ? new Date(event.eventDate).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'TBD'}
                </p>
              </div>
            </div>
          </div>

          {/* Download button */}
          <Button
            className="w-full h-12 btn-luxury bg-gold text-charcoal font-display"
            onClick={generatePDF}
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le Pass PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
