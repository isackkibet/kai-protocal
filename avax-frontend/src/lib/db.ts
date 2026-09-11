import { prisma } from '@/lib/prisma';

/**
 * Shared DB accessor for API routes.
 * Returns `null` when no DATABASE_URL is configured, or the client failed to
 * initialize (see lib/prisma.ts), so routes can degrade gracefully instead of
 * throwing on import.
 */
export async function getPrisma() {
  return prisma;
}
