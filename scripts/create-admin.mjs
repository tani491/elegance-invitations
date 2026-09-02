import { randomBytes, pbkdf2 as pbkdf2Callback } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const pbkdf2 = promisify(pbkdf2Callback);
const prisma = new PrismaClient();

const PASSWORD_ITERATIONS = 210_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

const ADMIN_EMAIL = "admin@elegance.com";
const ADMIN_PASSWORD = "Admin1234!";
const ADMIN_ROLE = "SUPER_ADMIN";

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const derived = await pbkdf2(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST);
  return `pbkdf2_${PASSWORD_DIGEST}$${PASSWORD_ITERATIONS}$${salt}$${derived.toString("base64url")}`;
}

async function main() {
  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  const admin = await prisma.authUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash,
      role: ADMIN_ROLE,
      displayName: "Super Admin Elegance",
      temporaryPassword: false,
      isActive: true,
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
      role: ADMIN_ROLE,
      displayName: "Super Admin Elegance",
      temporaryPassword: false,
      isActive: true,
    },
  });

  console.log(`Super Admin ready: ${admin.email} (${admin.role})`);
}

main()
  .catch((error) => {
    console.error("Unable to create Super Admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
