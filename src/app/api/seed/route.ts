import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureDefaultThemes } from '@/lib/theme-store'
import { hashPassword, normalizeEmail } from '@/lib/server-auth'
import { AUTH_ROLES } from '@/types/database.types'

function isSeedAuthorized(request: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true;

  const configuredSecret = process.env.SEED_SECRET;
  const providedSecret = request.nextUrl.searchParams.get('secret') ?? request.headers.get('x-seed-secret');
  return Boolean(configuredSecret && providedSecret && configuredSecret === providedSecret);
}

async function initializeProductionEssentials() {
  await ensureDefaultThemes();

  const email = normalizeEmail(process.env.DEFAULT_ADMIN_EMAIL ?? 'admin@elegance.sn');
  const password = process.env.DEFAULT_ADMIN_PASSWORD ?? 'EleganceAdmin2026!';
  const existingAdmin = await db.authUser.findUnique({ where: { email } });

  const admin = existingAdmin ?? await db.authUser.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      role: AUTH_ROLES.SUPER_ADMIN,
      displayName: 'Super Admin Elegance',
      temporaryPassword: false,
      isActive: true,
    },
  });

  const themeCount = await db.theme.count();

  return {
    themeCount,
    adminCreated: !existingAdmin,
    adminEmail: admin.email,
  };
}

export async function GET(request: NextRequest) {
  if (!isSeedAuthorized(request)) {
    return NextResponse.json({ success: false, error: 'Seed non autorise.' }, { status: 403 });
  }

  try {
    const result = await initializeProductionEssentials();
    return NextResponse.json({
      success: true,
      message: 'Initialisation Supabase terminee.',
      data: result,
    });
  } catch (error) {
    console.error('Erreur lors du seed essentiel:', error);
    return NextResponse.json(
      { success: false, error: 'Initialisation Supabase impossible. Verifiez que prisma db push a ete execute.' },
      { status: 500 },
    );
  }
}

// Seed data: 6 demo guests with French names
const demoGuests = [
  { firstName: 'Sophie', lastName: 'Dupont', phone: '+33 6 12 34 56 78', email: 'sophie.dupont@email.fr', table: 'Table 1' },
  { firstName: 'Jean-Luc', lastName: 'Martin', phone: '+33 6 23 45 67 89', email: 'jl.martin@email.fr', table: 'Table 1' },
  { firstName: 'Amélie', lastName: 'Bernard', phone: '+33 6 34 56 78 90', email: 'amelie.bernard@email.fr', table: 'Table 2' },
  { firstName: 'Pierre', lastName: 'Laurent', phone: '+33 6 45 67 89 01', email: 'pierre.laurent@email.fr', table: 'Table 2' },
  { firstName: 'Camille', lastName: 'Roux', phone: '+33 6 56 78 90 12', email: 'camille.roux@email.fr', table: 'Table 3' },
  { firstName: 'Nicolas', lastName: 'Moreau', phone: '+33 6 67 89 01 23', email: 'nicolas.moreau@email.fr', table: 'Table 3' },
]

// Generate a random access code in format AMIRA-2026-XX##
function generateAccessCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randLetters = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)]
  const randDigits = String(Math.floor(Math.random() * 100)).padStart(2, '0')
  return `AMIRA-2026-${randLetters}${randDigits}`
}

// Generate a random QR token in format qr_name_lastname_###
function generateQrToken(firstName: string, lastName: string): string {
  const randDigits = String(Math.floor(Math.random() * 1000)).padStart(3, '0')
  return `qr_${firstName.toLowerCase()}_${lastName.toLowerCase()}_${randDigits}`
}

export async function POST(_request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Seed interdit en production.' }, { status: 403 })
  }

  try {
    await ensureDefaultThemes()
    const medina = await db.theme.findUnique({ where: { slug: 'medina-orientale' } })

    // Delete all existing data in reverse dependency order
    await db.authSession.deleteMany()
    await db.authUser.deleteMany()
    await db.eventPhoto.deleteMany()
    await db.eventGuest.deleteMany()
    await db.event.deleteMany()

    // Create the demo event
    const event = await db.event.create({
      data: {
        slug: 'yasmine-karim-2026',
        name: 'Mariage de Yasmine & Karim',
        organizerName: 'Famille Benali',
        organizerPhone: '+33 6 00 00 00 00',
        clientEmail: 'client@elegance.sn',
        template: medina?.slug ?? 'medina-orientale',
        themeId: medina?.id,
        primaryColor: medina?.primaryColor ?? '#164B52',
        secondaryColor: medina?.secondaryColor ?? '#FBF3E4',
        accentColor: medina?.accentColor ?? '#C87533',
        goldColor: medina?.goldColor ?? '#D8B25B',
        titleFont: medina?.titleFont ?? 'Cormorant Garamond',
        animationType: medina?.animationType ?? 'golden_palace_doors',
        brideName: 'Yasmine Benali',
        groomName: 'Karim Amrani',
        eventDate: new Date('2026-06-15T17:00:00.000Z'),
        eventTime: '17h00',
        venueName: 'Domaine des Oliviers',
        venueAddress: '15 Chemin des Oliviers, 84000 Avignon',
        venueMapUrl: 'https://maps.google.com/?q=Avignon',
        mairieName: 'Mairie d\'Avignon',
        mairieAddress: 'Place de l\'Hôtel de Ville, 84000 Avignon',
        mairieDate: new Date('2026-06-14T10:00:00.000Z'),
        mairieTime: '10h00',
        receptionVenue: 'Domaine des Oliviers',
        receptionAddress: '15 Chemin des Oliviers, 84000 Avignon',
        receptionDate: new Date('2026-06-15T19:00:00.000Z'),
        receptionTime: '19h00',
        dressCode: 'Tenue de soirée / Robe longue',
        coupleStory: 'Yasmine et Karim se sont rencontrés lors d\'un voyage au Maroc en 2022. Leur amour a fleuri sous le soleil de Marrakech, et ils sont ravis de vous inviter à célébrer leur union.',
        invitationQuote: 'Et parmi Ses signes, Il a cree de vous, pour vous, des epouses afin que vous viviez en tranquillite avec elles.',
        giftIban: 'FR76 3000 6000 0112 3456 7890 189',
        giftWave: '+221 77 000 00 00',
        officialPhotoUrls: [],
        musicUrl: null,
        planType: 'privilege',
        photographerToken: 'photog-mariage-2026',
        isActive: true,
        isPaid: true,
      },
    })

    // Create the 6 guests linked to this event
    const guestsData = demoGuests.map((g) => ({
      eventId: event.id,
      fullName: `${g.firstName} ${g.lastName}`,
      phone: g.phone,
      email: g.email,
      accessCode: generateAccessCode(),
      qrToken: generateQrToken(g.firstName, g.lastName),
      table: g.table,
      maxGuests: 2,
    }))

    await db.eventGuest.createMany({ data: guestsData })

    await db.authUser.createMany({
      data: [
        {
          email: 'admin@elegance.sn',
          passwordHash: await hashPassword('EleganceAdmin2026!'),
          role: AUTH_ROLES.SUPER_ADMIN,
          displayName: 'Super Admin Elegance',
          temporaryPassword: false,
          isActive: true,
        },
        {
          email: 'client@elegance.sn',
          passwordHash: await hashPassword('EleganceClient2026!'),
          role: AUTH_ROLES.CLIENT,
          displayName: 'Yasmine & Karim',
          eventId: event.id,
          temporaryPassword: true,
          isActive: true,
        },
      ],
    })

    // Return the created event with its guests
    const eventWithGuests = await db.event.findUnique({
      where: { id: event.id },
      include: { guests: true },
    })

    return NextResponse.json({
      success: true,
      data: eventWithGuests,
      credentials: {
        admin: { email: 'admin@elegance.sn', password: 'EleganceAdmin2026!' },
        client: { email: 'client@elegance.sn', password: 'EleganceClient2026!' },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Erreur lors du seeding:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de l\'initialisation des données de démonstration.' },
      { status: 500 },
    )
  }
}
