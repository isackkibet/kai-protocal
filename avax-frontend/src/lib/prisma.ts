import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient reads DATABASE_URL/DIRECT_URL via `env()` in schema.prisma and
 * throws PrismaClientInitializationError synchronously at construction if
 * they're missing. Since this module is imported at the top of every API
 * route (via lib/db.ts), an unguarded `new PrismaClient()` here crashes the
 * whole serverless function on import whenever those env vars aren't set on
 * the deployment — before any route code (or its own error handling) ever
 * runs. Guard it so a missing/misconfigured DB degrades to `null` instead.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (e) {
    console.error('[prisma] failed to initialize client', e);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
