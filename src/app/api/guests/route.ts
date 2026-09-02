import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/server-auth'
import { AUTH_ROLES } from '@/types/database.types'

// GET /api/guests?eventId=xxx — Return all guests for a given event
export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.CLIENT])
  if (!session) return response

  try {
    const { searchParams } = new URL(request.url)
    const eventId = session.user.eventId ?? searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Le paramètre eventId est requis.' },
        { status: 400 },
      )
    }

    const guests = await db.eventGuest.findMany({
      where: { eventId: session.user.eventId ?? eventId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ success: true, data: guests })
  } catch (error) {
    console.error('Erreur lors de la récupération des invités:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les invités.' },
      { status: 500 },
    )
  }
}
