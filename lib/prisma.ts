// Singleton klienta Prisma do użycia w API routes.
// W dev Next.js przeładowuje moduły przy HMR — bez singletona powstawałoby
// wiele instancji PrismaClient, a każda otwiera własną pulę połączeń do Neon.
// Dlatego w trybie innym niż produkcyjny trzymamy instancję na globalThis.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
