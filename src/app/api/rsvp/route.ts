import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { rsvpRequestSchema } from '@/lib/validations/rsvp'

// POST /api/rsvp — Update a guest's RSVP status from the public guest token.
// Body: { guestToken, status, plusOnes? }
export async function POST(request: NextRequest) {
  try {
    const parsed = rsvpRequestSchema.safeParse(await request.json().catch(() => null))

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Le jeton invite et le statut de reponse sont requis.' },
        { status: 400 },
      )
    }
    const { guestToken, status, plusOnes } = parsed.data

    // Build the update payload with only provided optional fields
    const updateData: Record<string, unknown> = { rsvpStatus: status }

    const existingGuest = await db.eventGuest.findUnique({
      where: { qrToken: guestToken },
      include: { event: { select: { isActive: true } } },
    })

    if (!existingGuest || !existingGuest.event.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invité introuvable.' },
        { status: 404 },
      )
    }

    if (plusOnes > existingGuest.maxGuests) {
      return NextResponse.json(
        { success: false, error: 'Le nombre d\'accompagnateurs depasse le maximum autorise.' },
        { status: 400 },
      )
    }

    updateData.plusOnes = plusOnes

    const updatedGuest = await db.eventGuest.update({
      where: { id: existingGuest.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: updatedGuest })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la réponse RSVP :', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de mettre à jour la réponse.' },
      { status: 500 },
    )
  }
}
