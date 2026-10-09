/**
 * Server-side prompt allowance (PRD B2, B10). Server-only.
 *
 * Defaults follow the PRD text: 3 prompts per registered user, one-time
 * total, admins included. Open question 9 is settled by configuration:
 *   GUARDIAN_PROMPT_LIMIT=3            how many prompts
 *   GUARDIAN_PROMPT_PERIOD=total|daily daily resets at midnight East Africa Time
 *   GUARDIAN_PROMPT_ADMIN_EXEMPT=true  admins are not limited
 */

import { sql } from '@/lib/db';
import { eatToday } from './time';
import type { Role } from './constants';

export interface Quota {
  limit: number;
  used: number;
  remaining: number;
  period: 'total' | 'daily';
  exempt: boolean;
}

function config() {
  const parsed = Number.parseInt(process.env.GUARDIAN_PROMPT_LIMIT ?? '', 10);
  return {
    limit: Number.isInteger(parsed) && parsed >= 0 ? parsed : 3,
    period: process.env.GUARDIAN_PROMPT_PERIOD === 'daily' ? ('daily' as const) : ('total' as const),
    adminExempt: process.env.GUARDIAN_PROMPT_ADMIN_EXEMPT === 'true',
  };
}

function periodKey(period: 'total' | 'daily'): string {
  return period === 'daily' ? eatToday() : 'total';
}

export async function getQuota(userId: string, role: Role | null): Promise<Quota> {
  const cfg = config();
  const exempt = cfg.adminExempt && role === 'admin';
  const rows = (await sql`
    SELECT used FROM guardian_prompt_usage WHERE user_id = ${userId} AND period_key = ${periodKey(cfg.period)}
  `) as { used: number }[];
  const used = rows[0]?.used ?? 0;
  return { limit: cfg.limit, used, remaining: exempt ? cfg.limit : Math.max(0, cfg.limit - used), period: cfg.period, exempt };
}

/**
 * Claims one prompt atomically, before any model or tool runs. Returns false
 * when the allowance is used up. One conditional statement, so concurrent
 * requests can never push the count past the limit.
 */
export async function reservePrompt(userId: string, role: Role | null): Promise<boolean> {
  const cfg = config();
  if (cfg.adminExempt && role === 'admin') return true;
  if (cfg.limit <= 0) return false;
  const rows = (await sql`
    INSERT INTO guardian_prompt_usage (user_id, period_key, used) VALUES (${userId}, ${periodKey(cfg.period)}, 1)
    ON CONFLICT (user_id, period_key) DO UPDATE SET used = guardian_prompt_usage.used + 1
    WHERE guardian_prompt_usage.used < ${cfg.limit}
    RETURNING used
  `) as { used: number }[];
  return rows.length > 0;
}

/** Gives a prompt back: system errors and permission denials do not use one up. */
export async function refundPrompt(userId: string, role: Role | null): Promise<void> {
  const cfg = config();
  if (cfg.adminExempt && role === 'admin') return;
  await sql`
    UPDATE guardian_prompt_usage SET used = GREATEST(used - 1, 0)
    WHERE user_id = ${userId} AND period_key = ${periodKey(cfg.period)}
  `;
}
