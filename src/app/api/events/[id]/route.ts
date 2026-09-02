import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiRole } from '@/lib/server-auth'
import { AUTH_ROLES } from '@/types/database.types'

// PATCH /api/events/[id] — Update an event (e.g. toggle isActive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requireApiRole(request, [AUTH_ROLES.SUPER_ADMIN])
  if (!session) return response

  try {
    const { id } = await params
    const body = await request.json()

    const event = await db.event.findUnique({ where: { id } })
    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Événement introuvable.' },
        { status: 404 },
      )
    }

    const updated = await db.event.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error)
    return NextResponse.json(
      { success: false, error: 'Impossible de mettre à jour l\'événement.' },
      { status: 500 },
    )
  }
}
