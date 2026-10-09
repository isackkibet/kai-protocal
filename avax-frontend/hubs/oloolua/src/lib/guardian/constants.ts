/**
 * AI Guardian vocabulary from PRD v1.2: roles and their permissions (B2),
 * the controlled activity-type list (B5), and record statuses (B5).
 * Shared by server and client, so it must stay free of server-only imports.
 */

export const ROLES = ['viewer', 'keeper', 'manager', 'verifier', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  viewer: 'Viewer',
  keeper: 'Keeper',
  manager: 'Manager',
  verifier: 'Verifier',
  admin: 'Admin',
};

/** B2 role matrix. Verify is never allowed on your own record (separation of duties). */
export const CAN = {
  read: ['viewer', 'keeper', 'manager', 'verifier', 'admin'],
  record: ['keeper', 'manager', 'admin'],
  correctOwn: ['keeper', 'manager', 'admin'],
  correctAny: ['manager', 'admin'],
  verify: ['verifier', 'admin'],
  viewAudit: ['manager', 'verifier', 'admin'],
  manageUsers: ['admin'],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof CAN;

export function can(role: Role | null | undefined, capability: Capability): boolean {
  return !!role && (CAN[capability] as readonly Role[]).includes(role);
}

export type DraftField = 'type' | 'quantity' | 'date' | 'species' | 'seedbed' | 'toSeedbed' | 'destination' | 'notes';

export type StockEffect = 'none' | 'in' | 'out' | 'move';

/**
 * B5 controlled activity list [Proposed in the PRD, open question 3].
 * `stock` says how the activity moves READY stock in the ledger: sowing and
 * potting are earlier growth stages, so they are recorded but do not change
 * ready stock; hardening produces ready seedlings; dispatch, out-planting and
 * mortality remove them; a transfer moves them between beds (net zero).
 */
export const ACTIVITY_TYPES = {
  sowing: { label: 'Sowing', required: ['quantity', 'date'], stock: 'none' },
  potting: { label: 'Potting', required: ['quantity', 'date'], stock: 'none' },
  hardening: { label: 'Hardening', required: ['quantity', 'date', 'seedbed'], stock: 'in' },
  transfer: { label: 'Transfer between beds', required: ['quantity', 'date', 'seedbed', 'toSeedbed'], stock: 'move' },
  dispatch: { label: 'Dispatch', required: ['quantity', 'date', 'destination'], stock: 'out' },
  out_planting: { label: 'Out-planting', required: ['quantity', 'date', 'destination'], stock: 'out' },
  mortality: { label: 'Mortality or loss', required: ['quantity', 'date'], stock: 'out' },
} as const satisfies Record<string, { label: string; required: readonly DraftField[]; stock: StockEffect }>;

export type ActivityType = keyof typeof ACTIVITY_TYPES;
export const ACTIVITY_TYPE_KEYS = Object.keys(ACTIVITY_TYPES) as ActivityType[];

export function isActivityType(v: unknown): v is ActivityType {
  return typeof v === 'string' && v in ACTIVITY_TYPES;
}

/** B5 statuses of an official record. Draft and Pending Confirmation live only in drafts. */
export type RecordStatus = 'confirmed' | 'verified' | 'rejected' | 'corrected';

export const STATUS_LABELS: Record<RecordStatus | 'draft' | 'pending', string> = {
  draft: 'Draft',
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  verified: 'Verified',
  rejected: 'Rejected',
  corrected: 'Corrected',
};

/** B8 source labels shown on every answer. */
export type SourceLabel = 'Guardian Database' | 'Keeper Diary' | 'Guardian Knowledge Base' | 'External Source';

export const NO_RECORD_LINE = "I don't have a verified Guardian record for that.";
export const NO_DATA_LINE = 'No verified Guardian records were found for this request.';

/** Quantities above this need an extra confirmation (B5). */
export const LARGE_QUANTITY = 1000;
