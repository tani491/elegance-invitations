import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/rsvp — Update a guest's RSVP status from the public guest token.
// Body: { guestToken, status, plusOnes? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guestToken, status, plusOnes } = body

    if (!guestToken || !status) {
      return NextResponse.json(
        { success: false, error: 'Le jeton invite et le statut de reponse sont requis.' },
        { status: 400 },
      )
    }

    // Validate status value
    const validStatuses = ['confirmed', 'declined', 'pending']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Le statut doit être l\'un des suivants : confirmed, declined, pending.' },
        { status: 400 },
      )
    }

    // Build the update payload with only provided optional fields
    const updateData: Record<string, unknown> = { rsvpStatus: status }

    if (plusOnes !== undefined) {
      if (typeof plusOnes !== 'number' || plusOnes < 0) {
        return NextResponse.json(
          { success: false, error: 'Le nombre d\'accompagnateurs doit être un entier positif.' },
          { status: 400 },
        )
      }
      updateData.plusOnes = plusOnes
    }

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
