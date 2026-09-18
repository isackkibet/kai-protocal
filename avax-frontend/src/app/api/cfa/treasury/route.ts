import { NextResponse } from 'next/server';
import { VAULT_ADDRESSES } from '@/lib/addresses';

// Responsible-treasury snapshot for the CFA dashboard. Mirrors the
// governance model in the KAI Nuvari PRD: every movement is logged with an
// initiator and a *different* approver (four-eyes principle), budgets are
// capped per category, and the ledger is auditable end-to-end.
//
// Mock data shaped like the Prisma CFA schema — when a live DB is connected,
// replace the mock with prisma queries (see /api/cfa/nursery/summary).
export async function GET() {
  const walletAddress = VAULT_ADDRESSES.NVR ?? '0xCB6198228E27f2200C9093024fB31527E0a3B7c0';

  return NextResponse.json({
    treasury: {
      walletAddress,
      currency: 'KES',
      totalBalanceKes: 1_245_000,
      incoming30d: 186_400,
      outgoing30d: 92_400,
      pendingApprovals: 2,
      auditCount: 14,
      lastAuditAt: '2026-08-30',
      lastAuditBy: 'Agnes Chebet (AUDITOR)',
    },
    breakdown: [
      { id: 'b1', category: 'Carbon credit sales',   amountKes: 540_000, type: 'IN',  pct: 43 },
      { id: 'b2', category: 'Forest products',       amountKes: 318_000, type: 'IN',  pct: 26 },
      { id: 'b3', category: 'Grants & sponsorship',  amountKes: 245_000, type: 'IN',  pct: 20 },
      { id: 'b4', category: 'Membership dues',        amountKes: 142_000, type: 'IN',  pct: 11 },
      { id: 'b5', category: 'Patrol & stipends',      amountKes: 68_200,  type: 'OUT', pct: 0 },
      { id: 'b6', category: 'Seedlings & tools',      amountKes: 51_900,  type: 'OUT', pct: 0 },
    ],
    allocations: [
      { id: 'a1', category: 'Seedlings & nursery',  budgetKes: 60_000, spentKes: 51_900, guardrail: 'APPROVAL',  approverRole: 'TREASURER' },
      { id: 'a2', category: 'Patrol stipends',      budgetKes: 80_000, spentKes: 68_200, guardrail: 'CAP',       approverRole: 'AUDITOR' },
      { id: 'a3', category: 'Firebreak & tools',    budgetKes: 40_000, spentKes: 18_400, guardrail: 'APPROVAL',  approverRole: 'TREASURER' },
      { id: 'a4', category: 'Community water',      budgetKes: 90_000, spentKes: 22_100, guardrail: 'DUAL',      approverRole: 'CHAIRMAN' },
      { id: 'a5', category: 'Admin & audits',       budgetKes: 30_000, spentKes: 8_600,  guardrail: 'NONE',      approverRole: 'COMMITTEE' },
    ],
    ledger: [
      { id: 'l1', ref: 'TRX-2026-0881', type: 'OUT', purpose: 'Seedlings — Zone C restoration',  category: 'Seedlings & nursery', amountKes: 12_400, initiatorRole: 'SECRETARY', approverRole: 'Fatuma Hassan (TREASURER)', status: 'AUDITED', at: '2026-08-29' },
      { id: 'l2', ref: 'TRX-2026-0880', type: 'OUT', purpose: 'Patrol stipends — August cycle',    category: 'Patrol stipends',     amountKes: 18_600, initiatorRole: 'CHAIRMAN',  approverRole: 'Agnes Chebet (AUDITOR)',   status: 'APPROVED', at: '2026-08-28' },
      { id: 'l3', ref: 'TRX-2026-0879', type: 'IN',  purpose: 'Carbon credit sale — batch K25',    category: 'Carbon credit sales', amountKes: 210_000, initiatorRole: 'TREASURER', approverRole: 'Grace Wangari (ADMIN)',      status: 'AUDITED', at: '2026-08-26' },
      { id: 'l4', ref: 'TRX-2026-0878', type: 'OUT', purpose: 'Firebreak upkeep — Zone F',        category: 'Firebreak & tools',   amountKes: 9_300,  initiatorRole: 'GUARDIAN',  approverRole: 'Joseph Kimani (TREASURER)', status: 'APPROVED', at: '2026-08-24' },
      { id: 'l5', ref: 'TRX-2026-0877', type: 'OUT', purpose: 'Emergency community water tanker', category: 'Community water',    amountKes: 22_100, initiatorRole: 'SECRETARY', approverRole: 'Peter Mwangi (CHAIRMAN)',    status: 'PENDING',  at: '2026-08-22' },
      { id: 'l6', ref: 'TRX-2026-0876', type: 'OUT', purpose: 'Seedlings — honey belt agroforestry', category: 'Seedlings & nursery', amountKes: 14_800, initiatorRole: 'TREASURER', approverRole: 'Agnes Chebet (AUDITOR)',     status: 'REJECTED', at: '2026-08-20' },
    ],
    guardrails: [
      { rule: 'Four-eyes principle', description: 'No member can move funds they initiated — every withdrawal is approved by a different role holder.' },
      { rule: 'Approval by role',    description: 'Seedling & tool purchases require the Treasurer; stipend cycles require the Auditor; water & emergency spend requires the Chairman.' },
      { rule: 'Spending caps',       description: 'Each category has a monthly budget cap. Spend above 90% of a cap is automatically paused until committee review.' },
      { rule: 'Weekly reconciliation', description: 'The Treasurer reconciles the ledger weekly and flags any unapproved movement to the Auditor before payout.' },
      { rule: 'Quarterly audit',     description: 'An independent auditor reviews the full ledger every quarter. Audited entries are immutable and shared with members.' },
    ],
  });
}