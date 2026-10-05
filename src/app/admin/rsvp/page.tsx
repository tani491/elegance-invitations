import Link from "next/link";
import { ArrowLeft, CheckCircle2, Inbox, MailCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RsvpRow = {
  id: string;
  fullName: string;
  phone: string | null;
  rsvpStatus: string;
  plusOnes: number;
  updatedAt: Date;
  event: {
    name: string;
    brideName: string | null;
    groomName: string | null;
    eventDate: Date | null;
  };
};

function statusLabel(status: string) {
  if (status === "confirmed") return "Confirmé";
  if (status === "declined") return "Décliné";
  return "En attente";
}

function eventLabel(event: RsvpRow["event"]) {
  const names = [event.brideName, event.groomName].map((name) => name?.trim()).filter(Boolean).join(" & ");
  return names || event.name;
}

function formatDate(value: Date | null) {
  if (!value) return "Date à confirmer";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(value);
}

async function getRsvpData() {
  try {
    const [responses, totalGuests, pendingGuests] = await Promise.all([
      db.eventGuest.findMany({
        where: { rsvpStatus: { in: ["confirmed", "declined"] } },
        select: {
          id: true,
          fullName: true,
          phone: true,
          rsvpStatus: true,
          plusOnes: true,
          updatedAt: true,
          event: {
            select: {
              name: true,
              brideName: true,
              groomName: true,
              eventDate: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      db.eventGuest.count(),
      db.eventGuest.count({ where: { rsvpStatus: "pending" } }),
    ]);

    return { responses, totalGuests, pendingGuests, warning: null };
  } catch (error) {
    console.error("Admin RSVP lookup failed:", error);
    return { responses: [] as RsvpRow[], totalGuests: 0, pendingGuests: 0, warning: "Réponses RSVP indisponibles temporairement." };
  }
}

export default async function AdminRsvpPage() {
  const { responses, totalGuests, pendingGuests, warning } = await getRsvpData();
  const confirmed = responses.filter((response) => response.rsvpStatus === "confirmed").length;
  const declined = responses.filter((response) => response.rsvpStatus === "declined").length;

  return (
    <main className="min-h-screen bg-[#F7F2EA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Button asChild variant="ghost" className="-ml-3 mb-3 text-[#5C1D24] hover:bg-[#E5D9C7]/45">
              <Link href="/admin">
                <ArrowLeft className="mr-2 size-4" />
                Retour admin
              </Link>
            </Button>
            <p className="text-xs uppercase tracking-[0.24em] text-[#B89248]">RSVP</p>
            <h1 className="font-display-bold text-3xl tracking-luxury text-[#171312]">Réponses invités</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Suivi consolidé des réponses confirmées et refusées pour les invitations actives.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-[#D6C5A8] bg-white/70 px-3 py-1 text-[#5C1D24]">
            {responses.length} réponse{responses.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="rounded-lg border-[#E5D9C7] bg-white/85 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle2 className="size-8 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Confirmés</p>
                <p className="font-display-bold text-2xl text-[#171312]">{confirmed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-[#E5D9C7] bg-white/85 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <XCircle className="size-8 text-red-500" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Refusés</p>
                <p className="font-display-bold text-2xl text-[#171312]">{declined}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-[#E5D9C7] bg-white/85 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <MailCheck className="size-8 text-[#B89248]" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">En attente</p>
                <p className="font-display-bold text-2xl text-[#171312]">{Math.max(pendingGuests, totalGuests - responses.length)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border-[#E5D9C7] bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#171312]">Historique RSVP</CardTitle>
            {warning && <p className="text-sm text-red-700">{warning}</p>}
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-[#D6C5A8] bg-[#FDFBF7] p-8 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-[#B89248]/12 text-[#B89248]">
                  <Inbox className="size-8" />
                </div>
                <p className="mt-5 font-display-bold text-xl text-[#171312]">Aucune réponse enregistrée pour le moment</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Les confirmations et refus apparaîtront ici dès que les invités répondront à leur invitation.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invité</TableHead>
                      <TableHead>Événement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Accompagnants</TableHead>
                      <TableHead>Date mariage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell>
                          <p className="font-medium text-[#171312]">{response.fullName}</p>
                          {response.phone && <p className="text-xs text-muted-foreground">{response.phone}</p>}
                        </TableCell>
                        <TableCell>{eventLabel(response.event)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={response.rsvpStatus === "confirmed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                            {statusLabel(response.rsvpStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>{response.plusOnes}</TableCell>
                        <TableCell>{formatDate(response.event.eventDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
