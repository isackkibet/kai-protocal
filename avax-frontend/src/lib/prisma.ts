/**
 * src/lib/prisma.ts
 * Prisma client singleton (Neon Postgres).
 *
 * Environment variables (set in .env.local — NEVER commit real values):
 *   DATABASE_URL  Pooled connection string (Prisma Client)
 *   DIRECT_URL    Direct connection string (migrations / db push)
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
