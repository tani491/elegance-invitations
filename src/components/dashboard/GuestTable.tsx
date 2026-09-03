"use client";

import { QRCodeSVG } from "qrcode.react";
import { ExternalLink, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Guest {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  phone: string | null;
  rsvpStatus: string;
  isVip: boolean;
  isCheckedIn: boolean;
  qrToken: string;
}

function statusLabel(status: string) {
  if (status === "confirmed") return "Confirme";
  if (status === "declined") return "Decline";
  return "En attente";
}

function normalizePhone(phone: string | null) {
  return phone?.replace(/[^\d]/g, "") ?? "";
}

function passUrl(origin: string, token: string) {
  return `${origin}/carte/${encodeURIComponent(token)}`;
}

export function GuestTable({ guests, origin }: { guests: Guest[]; origin: string }) {
  function sendPassOnWhatsApp(guest: Guest) {
    const phone = normalizePhone(guest.phone);
    if (!phone) return;
    const url = passUrl(origin, guest.qrToken);
    const text = encodeURIComponent(
      `Bonjour ${guest.fullName}, voici votre Pass VIP pour notre mariage. Ouvrez-le ici : ${url}`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invite</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead>VIP</TableHead>
            <TableHead>QR</TableHead>
            <TableHead>Pass</TableHead>
            <TableHead>WhatsApp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => {
            const url = passUrl(origin, guest.qrToken);
            const hasPhone = normalizePhone(guest.phone).length > 0;
            return (
              <TableRow key={guest.id}>
                <TableCell>{guest.fullName}</TableCell>
                <TableCell>{guest.phone ?? "-"}</TableCell>
                <TableCell><Badge variant="outline">{statusLabel(guest.rsvpStatus)}</Badge></TableCell>
                <TableCell>{guest.isVip ? <Badge>VIP</Badge> : "-"}</TableCell>
                <TableCell>
                  <QRCodeSVG value={url} size={46} />
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <a href={url} target="_blank" rel="noreferrer" aria-label={`Ouvrir le Pass de ${guest.fullName}`}>
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!hasPhone}
                    onClick={() => sendPassOnWhatsApp(guest)}
                    className="border-[#1f7a4c]/30 text-[#1f7a4c] hover:bg-[#1f7a4c]/10"
                  >
                    <MessageCircle className="size-4" />
                    Envoyer
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
