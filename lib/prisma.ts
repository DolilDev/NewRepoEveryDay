// Prisma client singleton for use in API routes.
// In dev, Next.js reloads modules on HMR — without a singleton, many PrismaClient
// instances would be created, and each opens its own connection pool to Neon.
// That's why in non-production mode we keep the instance on globalThis.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
