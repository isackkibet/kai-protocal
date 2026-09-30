import type { CfaMember, Prisma, PrismaClient } from '@prisma/client';
import { verifyPrivyUserId } from '@/lib/privy-server';

/**
 * Oloolua CFA nursery data access (Kanuvari nursery DB design v1.0).
 *
 * The rules live in the database (prisma/sql/2026-09-30_oloolua_nursery.sql):
 * CHECK constraints, same-CFA foreign keys, the generated survival_rate and an
 * audit trigger that writes every change to audit_logs. That trigger needs to
 * know WHO is acting, so every write must go through withMember(), which sets
 * app.current_member_id for exactly that transaction. A write outside it is
 * refused by the database ("No acting member").
 */

export const NURSERY_CFA_NAME = 'Oloolua Community Forest Association';

type Tx = Prisma.TransactionClient;

/** The CFA this app's nursery belongs to (seeded by the migration). */
export function getNurseryCfa(prisma: PrismaClient | Tx) {
  return prisma.cfa.findUnique({ where: { name: NURSERY_CFA_NAME } });
}

/**
 * Run writes as `memberId`: sets app.current_member_id (transaction-local, so
 * it can't leak to another request on a pooled connection) before `fn` runs.
 */
export function withMember<T>(prisma: PrismaClient, memberId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_member_id', ${memberId}, true)`;
      return fn(tx);
    },
    // Neon can take a few seconds to wake; don't abort a valid write for it.
    { timeout: 20_000, maxWait: 10_000 },
  );
}

export type SessionMember =
  | { ok: true; member: CfaMember; privyUserId: string }
  | { ok: false; status: 401 | 403; error: string };

/**
 * The acting member, from the verified Privy session only — never from a
 * request body or header the client controls.
 */
export async function getSessionMember(prisma: PrismaClient, req: Request): Promise<SessionMember> {
  const privyUserId = await verifyPrivyUserId(req.headers.get('authorization'));
  if (!privyUserId) return { ok: false, status: 401, error: 'Please sign in first.' };

  const member = await prisma.cfaMember.findUnique({ where: { authUserId: privyUserId } });
  if (!member) return { ok: false, status: 403, error: 'Join the CFA before recording nursery work.' };
  if (member.status !== 'active') return { ok: false, status: 403, error: `Your CFA membership is ${member.status}.` };
  return { ok: true, member, privyUserId };
}

/** Admins manage the shared catalogue (species) and the nursery's locations. */
export function canManageCatalogue(member: CfaMember) {
  return member.role === 'admin';
}

/** Who may read the full change history. */
export function canReadAudit(member: CfaMember) {
  return member.role === 'admin' || member.role === 'auditor' || member.role === 'verifier';
}

/**
 * Emails that become CFA admins when they join (comma-separated
 * NURSERY_ADMIN_EMAILS). Without it nobody could ever add the first species
 * or location.
 */
export function isConfiguredAdmin(email: string) {
  const list = (process.env.NURSERY_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

/**
 * Turns a database rule violation into a message a member can act on. The
 * database is the last line of defence (the app validates first), so these
 * mostly catch races and bugs — but they must never surface as a raw 500.
 */
export function explainDbError(e: unknown): { status: number; error: string } | null {
  const msg = e instanceof Error ? e.message : String(e);
  const rules: [RegExp, number, string][] = [
    [/check_quantity_sum/, 400, 'Alive plus dead seedlings cannot be more than the initial count.'],
    [/planted_needs_date/, 400, 'A planted batch needs a planting date.'],
    [/quantity_check/, 400, 'Quantities cannot be negative.'],
    [/members_email_uq|lower\(email/, 409, 'A member with this email already exists.'],
    [/members_wallet_uq|lower\(wallet_address/, 409, 'This wallet is already linked to another member.'],
    [/scientific_name/, 409, 'That species (scientific name) is already in the catalogue.'],
    [/nursery_locations_cfa_id_name_key|\(cfa_id, name\)/, 409, 'A location with that name already exists.'],
    [/wallet_address_check/, 400, 'Wallet address must be 0x followed by 40 hex characters.'],
    [/latitude_check|longitude_check/, 400, 'GPS coordinates are out of range.'],
    [/location_id_cfa_id_fkey/, 400, 'That location belongs to a different CFA.'],
    [/No acting member/, 500, 'Could not record who made this change.'],
  ];
  for (const [re, status, error] of rules) if (re.test(msg)) return { status, error };
  return null;
}
