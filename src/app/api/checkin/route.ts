import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/server-auth'
import { AUTH_ROLES } from '@/types/database.types'

// POST /api/checkin — Check in a guest by QR token
// Body: { qrToken }
export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT])
  if (!session) return response

  try {
    const body = await request.json()
    const { qrToken } = body

    if (!qrToken) {
      return NextResponse.json(
        { success: false, error: 'Le jeton QR est requis.' },
        { status: 400 },
      )
    }

    // Find guest by qrToken
    const guest = await db.eventGuest.findUnique({
      where: { qrToken },
      include: { event: { select: { name: true } } },
    })

    if (!guest || guest.eventId !== session.user.eventId) {
      return NextResponse.json(
        { success: false, error: 'Invité introuvable. Veuillez vérifier votre code QR.' },
        { status: 404 },
      )
    }

    // Already checked in — return current state with a notice
    if (guest.isCheckedIn) {
      return NextResponse.json({
        success: true,
        data: guest,
        message: 'Cet invité a déjà été enregistré.',
      })
    }

    // Mark as checked in
    const updatedGuest = await db.eventGuest.update({
      where: { id: guest.id },
      data: {
        isCheckedIn: true,
        checkedInAt: new Date(),
      },
      include: { event: { select: { name: true } } },
    })

    return NextResponse.json({
      success: true,
      data: updatedGuest,
      message: 'Bienvenue ! Enregistrement effectué avec succès.',
    })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement :', error)
    return NextResponse.json(
      { success: false, error: 'Impossible d\'effectuer l\'enregistrement.' },
      { status: 500 },
    )
  }
}
