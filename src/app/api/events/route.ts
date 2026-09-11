import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/server-auth'
import { AUTH_ROLES } from '@/types/database.types'
import { uniqueSlug } from '@/lib/slug'

// GET /api/events — Return all events
export async function GET(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN])
  if (!session) return response

  try {
    const events = await db.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { guests: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: events })
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les événements.' },
      { status: 500 },
    )
  }
}

// POST /api/events — Create a new event
export async function POST(request: NextRequest) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN])
  if (!session) return response

  try {
    const body = await request.json()

    // Required fields
    const { name, organizerName, organizerPhone } = body
    if (!name || !organizerName || !organizerPhone) {
      return NextResponse.json(
        { success: false, error: 'Le nom de l\'événement, le nom de l\'organisateur et le téléphone sont requis.' },
        { status: 400 },
      )
    }

    const event = await db.event.create({
      data: {
        slug: body.slug ?? uniqueSlug(name),
        name,
        organizerName,
        organizerPhone,
        template: body.template ?? 'medina',
        primaryColor: body.primaryColor ?? '#5C1D24',
        accentColor: body.accentColor ?? '#C5A880',
        animationType: body.animationType ?? 'envelope',
        coverPhotoUrl: body.coverPhotoUrl,
        coverPhotoCloudinaryId: body.coverPhotoCloudinaryId,
        musicUrl: body.musicUrl,
        brideName: body.brideName,
        groomName: body.groomName,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        eventTime: body.eventTime,
        venueName: body.venueName,
        venueAddress: body.venueAddress,
        venueMapUrl: body.venueMapUrl,
        mairieName: body.mairieName,
        mairieAddress: body.mairieAddress,
        mairieDate: body.mairieDate ? new Date(body.mairieDate) : null,
        mairieTime: body.mairieTime,
        receptionVenue: body.receptionVenue,
        receptionAddress: body.receptionAddress,
        receptionDate: body.receptionDate ? new Date(body.receptionDate) : null,
        receptionTime: body.receptionTime,
        dressCode: body.dressCode,
        coupleStory: body.coupleStory,
        planType: body.planType ?? 'essentielle',
        isActive: body.isActive ?? true,
        isPaid: body.isPaid ?? false,
      },
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de créer l\'événement.' },
      { status: 500 },
    )
  }
}
