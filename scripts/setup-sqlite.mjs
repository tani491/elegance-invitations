import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `CREATE TABLE IF NOT EXISTS "Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#5C1D24',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FAF7F2',
    "accentColor" TEXT NOT NULL DEFAULT '#C5A880',
    "goldColor" TEXT NOT NULL DEFAULT '#D4AF37',
    "titleFont" TEXT NOT NULL DEFAULT 'Cormorant Garamond',
    "animationType" TEXT NOT NULL DEFAULT 'envelope',
    "openingVideoUrl" TEXT,
    "previewGradient" TEXT NOT NULL,
    "demoVideoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizerName" TEXT NOT NULL,
    "organizerPhone" TEXT NOT NULL,
    "clientEmail" TEXT,
    "template" TEXT NOT NULL DEFAULT 'medina-orientale',
    "themeId" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#5C1D24',
    "secondaryColor" TEXT NOT NULL DEFAULT '#FAF7F2',
    "accentColor" TEXT NOT NULL DEFAULT '#C5A880',
    "goldColor" TEXT NOT NULL DEFAULT '#D4AF37',
    "titleFont" TEXT NOT NULL DEFAULT 'Cormorant Garamond',
    "animationType" TEXT NOT NULL DEFAULT 'envelope',
    "coverPhotoUrl" TEXT,
    "coverPhotoCloudinaryId" TEXT,
    "officialPhotoUrls" JSONB,
    "musicUrl" TEXT,
    "invitationQuote" TEXT,
    "giftIban" TEXT,
    "giftWave" TEXT,
    "brideName" TEXT,
    "groomName" TEXT,
    "eventDate" DATETIME,
    "eventTime" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "venueMapUrl" TEXT,
    "wazeUrl" TEXT,
    "mairieName" TEXT,
    "mairieAddress" TEXT,
    "mairieDate" DATETIME,
    "mairieTime" TEXT,
    "receptionVenue" TEXT,
    "receptionAddress" TEXT,
    "receptionDate" DATETIME,
    "receptionTime" TEXT,
    "dressCode" TEXT,
    "dressCodeColors" JSONB,
    "program" JSONB,
    "coupleStory" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'essentielle',
    "photographerToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AuthUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "displayName" TEXT NOT NULL,
    "eventId" TEXT,
    "temporaryPassword" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthUser_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AuthUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "EventGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "accessCode" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "table" TEXT,
    "maxGuests" INTEGER NOT NULL DEFAULT 1,
    "rsvpStatus" TEXT NOT NULL DEFAULT 'pending',
    "plusOnes" INTEGER NOT NULL DEFAULT 0,
    "dietaryNotes" TEXT,
    "menuChoice" TEXT,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isCheckedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "checkedInBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EventGuest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "EventPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'ceremonie',
    "title" TEXT,
    "originalUrl" TEXT,
    "thumbnailUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Theme_slug_key" ON "Theme"("slug")`,
  `CREATE INDEX IF NOT EXISTS "Theme_category_idx" ON "Theme"("category")`,
  `CREATE INDEX IF NOT EXISTS "Theme_isActive_idx" ON "Theme"("isActive")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Event_slug_key" ON "Event"("slug")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Event_photographerToken_key" ON "Event"("photographerToken")`,
  `CREATE INDEX IF NOT EXISTS "Event_themeId_idx" ON "Event"("themeId")`,
  `CREATE INDEX IF NOT EXISTS "Event_clientEmail_idx" ON "Event"("clientEmail")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AuthUser_email_key" ON "AuthUser"("email")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AuthUser_eventId_key" ON "AuthUser"("eventId")`,
  `CREATE INDEX IF NOT EXISTS "AuthUser_role_idx" ON "AuthUser"("role")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId")`,
  `CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EventGuest_accessCode_key" ON "EventGuest"("accessCode")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "EventGuest_qrToken_key" ON "EventGuest"("qrToken")`,
  `CREATE INDEX IF NOT EXISTS "EventGuest_eventId_idx" ON "EventGuest"("eventId")`,
  `CREATE INDEX IF NOT EXISTS "EventPhoto_eventId_idx" ON "EventPhoto"("eventId")`,
  `CREATE INDEX IF NOT EXISTS "EventPhoto_category_idx" ON "EventPhoto"("category")`,
];

for (const statement of statements) {
  await prisma.$executeRawUnsafe(statement);
}

try {
  await prisma.$executeRawUnsafe(`ALTER TABLE "EventGuest" ADD COLUMN "checkedInBy" TEXT`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes("duplicate column")) {
    throw error;
  }
}

try {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Theme" ADD COLUMN "openingVideoUrl" TEXT`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.toLowerCase().includes("duplicate column")) {
    throw error;
  }
}

for (const statement of [
  `ALTER TABLE "Event" ADD COLUMN "officialPhotoUrls" JSONB`,
  `ALTER TABLE "Event" ADD COLUMN "invitationQuote" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN "giftIban" TEXT`,
  `ALTER TABLE "Event" ADD COLUMN "giftWave" TEXT`,
]) {
  try {
    await prisma.$executeRawUnsafe(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes("duplicate column")) {
      throw error;
    }
  }
}

await prisma.$disconnect();
console.log("SQLite schema is ready.");
