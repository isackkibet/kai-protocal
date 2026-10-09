/**
 * AI Guardian schema and baseline seed (PRD v1.2, B4 and B11). Server-only.
 *
 * Design rules from the PRD:
 *  - Stock is never a stored counter: ready stock is derived from
 *    guardian_inventory_txns, and species/seedbed counts from their tables.
 *  - The known baseline (600 ready, 3,000 capacity, 16 species, 2 beds) is
 *    seeded with an as-of date, a source and a status. Bed capacity and
 *    nursery stock are separate facts and are never validated against each
 *    other (open reconciliation, A3 issue 1).
 *  - The Keeper Diary and the audit log are append-only, enforced by a
 *    database trigger rather than by convention.
 */

import { sql } from '@/lib/db';
import { NURSERY_SPECIES_CATALOGUE } from '@/data/species';

export const HUB_ID = 'hub-oloolua';
export const NURSERY_ID = 'nur-turako';
const BASELINE_AS_OF = '2026-10-08';
const BASELINE_SOURCE = 'AI Guardian PRD v1.2 nursery baseline (prepared by Austin Namuye, 8 October 2026)';
const OPENING_TXN_ID = '00000000-0000-4000-8000-000000000600';

/** B4: the people available as managers or responsible persons. Seeded without logins. */
const TEAM = [
  { id: '00000000-0000-4000-8000-0000000000a1', name: 'Austin' },
  { id: '00000000-0000-4000-8000-0000000000a2', name: 'Lucas' },
  { id: '00000000-0000-4000-8000-0000000000a3', name: 'Patrick Muroki' },
  { id: '00000000-0000-4000-8000-0000000000a4', name: 'Joy' },
  { id: '00000000-0000-4000-8000-0000000000a5', name: 'Kidi' },
];

/** Approved Guardian Knowledge Base documents, taken from the site's own published pages. */
const ORG_KNOWLEDGE = [
  {
    id: 'kb-mission',
    title: 'Our mission',
    url: '/mission',
    body: 'Oloolua Youth Guardians conserve, protect and restore forest ecosystems. We plant indigenous and medicinal trees, run community nurseries that propagate native and medicinal seedlings, organise tree-planting drives that restore degraded forest patches, create green spaces for mental and physical wellness, and train local youth and community members in seed collection, nursery management, tree propagation, sustainability, ESG and green enterprise. Our work is aligned with the Sustainable Development Goals, especially Climate Action (SDG 13), Good Health (SDG 3), Decent Work (SDG 8) and Reduced Inequalities (SDG 10), and with the national initiative of 15 billion trees by 2032.',
  },
  {
    id: 'kb-vision',
    title: 'Our vision',
    url: '/vision',
    body: 'A future where forest preservation and human prosperity go together: thriving forest ecosystems, green spaces that heal minds and bodies, and communities that earn from their conservation work. Communities are the owners and stewards of their environment, green spaces are treated as public health infrastructure, and the Oloolua model becomes a replicable blueprint for Community Forest Associations in Kenya.',
  },
  {
    id: 'kb-about',
    title: 'About Oloolua Youth Guardians',
    url: '/about',
    body: 'Oloolua Youth Guardians is a Community Forest Association (CFA) seedling user group at Oloolua Forest, Kajiado North, Kenya. Forests like Oloolua are losing green space, biodiversity and community connection because of deforestation, low awareness, limited community involvement, poor tracking of environmental impact and few economic incentives. Our activities include seedling production and nursery management, tree planting and forest restoration, green space development, wellness and recreation, community training, conservation data tracking, art and storytelling, and green economy job creation.',
  },
  {
    id: 'kb-beekeeping',
    title: 'Beekeeping initiative',
    url: '/beekeeping',
    body: 'Our beekeeping initiative introduces sustainable honey production while improving the pollination of indigenous flora. It helps preserve the forest ecosystem and gives community members an alternative source of income.',
  },
  {
    id: 'kb-workshops',
    title: 'Community workshops',
    url: '/workshops',
    body: 'Community workshops train youth and community members in sustainable forestry, biodiversity tracking and green enterprise skills through interactive, hands-on sessions.',
  },
  {
    id: 'kb-support',
    title: 'How to support or donate',
    url: '/#donate',
    body: 'You can support Oloolua Youth Guardians through M-Pesa: Lipa na M-Pesa, Paybill 247247 (Equity Bank), account number 813367. You can also make a commitment or pledge through the forms on the website. Contributions buy potting soil and polybags, pay youth guardian stipends and fund indigenous tree planting.',
  },
  {
    id: 'kb-contact',
    title: 'Contact details',
    url: '/#contact',
    body: 'Oloolua Forest Station, Kajiado North, Kenya. Phone 0112583681, 0742004641 or 0725772240. Email austinnamuye@gmail.com. Instagram: oloolua_forest_youth_guardians.',
  },
];

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

let ready: Promise<void> | null = null;

export function ensureGuardianSchema(): Promise<void> {
  if (!ready) {
    ready = setup().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

async function setup() {
  await sql`CREATE TABLE IF NOT EXISTS guardian_hubs (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub TEXT UNIQUE,
    email TEXT,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS guardian_users_email_uq ON guardian_users (lower(email)) WHERE email IS NOT NULL`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_memberships (
    user_id UUID NOT NULL REFERENCES guardian_users(id) ON DELETE CASCADE,
    hub_id TEXT NOT NULL REFERENCES guardian_hubs(id),
    role TEXT NOT NULL CHECK (role IN ('viewer','keeper','manager','verifier','admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending','suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, hub_id))`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_nurseries (
    id TEXT PRIMARY KEY, hub_id TEXT NOT NULL REFERENCES guardian_hubs(id),
    name TEXT NOT NULL, location TEXT, capacity INT, status TEXT NOT NULL DEFAULT 'active')`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_baseline (
    nursery_id TEXT NOT NULL REFERENCES guardian_nurseries(id),
    metric TEXT NOT NULL, value NUMERIC NOT NULL, as_of DATE NOT NULL,
    source TEXT NOT NULL, status TEXT NOT NULL,
    PRIMARY KEY (nursery_id, metric))`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_seedbeds (
    id TEXT PRIMARY KEY, nursery_id TEXT NOT NULL REFERENCES guardian_nurseries(id),
    bed_number INT NOT NULL, method TEXT, manager_id UUID REFERENCES guardian_users(id) ON DELETE SET NULL,
    capacity_max INT, status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (nursery_id, bed_number))`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_species (
    id TEXT PRIMARY KEY, nursery_id TEXT NOT NULL REFERENCES guardian_nurseries(id),
    name TEXT NOT NULL, scientific_name TEXT, status TEXT NOT NULL DEFAULT 'active')`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES guardian_users(id) ON DELETE CASCADE,
    hub_id TEXT NOT NULL,
    fields JSONB NOT NULL DEFAULT '{}',
    awaiting TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft','pending','confirmed','cancelled')),
    request_text TEXT,
    channel TEXT NOT NULL DEFAULT 'text',
    correction_of UUID,
    correction_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL)`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nursery_id TEXT NOT NULL REFERENCES guardian_nurseries(id),
    type TEXT NOT NULL,
    activity_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    species_id TEXT REFERENCES guardian_species(id),
    seedbed_id TEXT REFERENCES guardian_seedbeds(id),
    to_seedbed_id TEXT REFERENCES guardian_seedbeds(id),
    destination TEXT,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES guardian_users(id),
    status TEXT NOT NULL CHECK (status IN ('confirmed','verified','rejected','corrected')),
    version INT NOT NULL DEFAULT 1,
    supersedes_id UUID REFERENCES guardian_activities(id),
    correction_reason TEXT,
    draft_id UUID UNIQUE,
    reviewed_by UUID REFERENCES guardian_users(id),
    reviewed_at TIMESTAMPTZ,
    review_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS guardian_activities_date_idx ON guardian_activities (nursery_id, activity_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS guardian_activities_status_idx ON guardian_activities (status)`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_inventory_txns (
    txn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nursery_id TEXT NOT NULL REFERENCES guardian_nurseries(id),
    seedbed_id TEXT REFERENCES guardian_seedbeds(id),
    species_id TEXT REFERENCES guardian_species(id),
    txn_date DATE NOT NULL,
    activity_id UUID REFERENCES guardian_activities(id),
    direction TEXT NOT NULL CHECK (direction IN ('in','out')),
    quantity INT NOT NULL CHECK (quantity > 0),
    quality TEXT,
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_diary (
    id BIGSERIAL PRIMARY KEY,
    activity_id UUID REFERENCES guardian_activities(id),
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    actor_id UUID REFERENCES guardian_users(id),
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL)`;
  await sql`CREATE INDEX IF NOT EXISTS guardian_diary_ts_idx ON guardian_diary (ts DESC)`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_audit (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    ts TIMESTAMPTZ NOT NULL DEFAULT now(),
    channel TEXT,
    request_text TEXT,
    interpretation JSONB,
    tool TEXT NOT NULL,
    confirmation TEXT,
    result TEXT NOT NULL,
    record_id UUID,
    verification_status TEXT)`;
  await sql`CREATE INDEX IF NOT EXISTS guardian_audit_ts_idx ON guardian_audit (ts DESC)`;

  // Append-only: no code path, bug or SQL client may rewrite the diary or audit trail.
  await sql`CREATE OR REPLACE FUNCTION guardian_append_only() RETURNS trigger AS $$
    BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END; $$ LANGUAGE plpgsql`;
  await sql`CREATE OR REPLACE TRIGGER guardian_diary_append_only BEFORE UPDATE OR DELETE ON guardian_diary
    FOR EACH ROW EXECUTE FUNCTION guardian_append_only()`;
  await sql`CREATE OR REPLACE TRIGGER guardian_audit_append_only BEFORE UPDATE OR DELETE ON guardian_audit
    FOR EACH ROW EXECUTE FUNCTION guardian_append_only()`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_prompt_usage (
    user_id UUID NOT NULL REFERENCES guardian_users(id) ON DELETE CASCADE,
    period_key TEXT NOT NULL,
    used INT NOT NULL DEFAULT 0 CHECK (used >= 0),
    PRIMARY KEY (user_id, period_key))`;

  await sql`CREATE TABLE IF NOT EXISTS guardian_knowledge (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT,
    tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED)`;
  await sql`CREATE INDEX IF NOT EXISTS guardian_knowledge_tsv_idx ON guardian_knowledge USING GIN (tsv)`;

  await seed();
}

async function seed() {
  await sql`INSERT INTO guardian_hubs (id, name) VALUES (${HUB_ID}, 'Oloolua Youth Guardians') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO guardian_nurseries (id, hub_id, name, location, capacity)
    VALUES (${NURSERY_ID}, ${HUB_ID}, 'Turako Nursery', 'Oloolua Forest, Kajiado North, Kenya', 3000)
    ON CONFLICT DO NOTHING`;

  for (const [metric, value] of [['ready_stock', 600], ['capacity', 3000], ['cataloged_species', 16], ['active_seedbeds', 2]] as const) {
    await sql`INSERT INTO guardian_baseline (nursery_id, metric, value, as_of, source, status)
      VALUES (${NURSERY_ID}, ${metric}, ${value}, ${BASELINE_AS_OF}, ${BASELINE_SOURCE}, 'baseline')
      ON CONFLICT DO NOTHING`;
  }

  // Two beds, both Hardening Under Shade, capacity "170 or below". No manager:
  // bed assignments must come from the database, and none are known yet.
  for (const bed of [1, 2]) {
    await sql`INSERT INTO guardian_seedbeds (id, nursery_id, bed_number, method, capacity_max)
      VALUES (${`sb-${bed}`}, ${NURSERY_ID}, ${bed}, 'Hardening Under Shade', 170)
      ON CONFLICT DO NOTHING`;
  }

  for (const s of NURSERY_SPECIES_CATALOGUE) {
    const name = s.name;
    const scientific = s.sci.split('·')[0].trim();
    await sql`INSERT INTO guardian_species (id, nursery_id, name, scientific_name)
      VALUES (${`sp-${slug(name)}`}, ${NURSERY_ID}, ${name}, ${scientific})
      ON CONFLICT DO NOTHING`;
    const body = [`${name} (${s.sci}). Tags: ${s.tags.join(', ')}.`, ...s.uses.map((u) => `${u.title}: ${u.text}`), s.eco].join(' ');
    await sql`INSERT INTO guardian_knowledge (id, title, body, url)
      VALUES (${`kb-sp-${slug(name)}`}, ${`Species profile: ${name}`}, ${body}, '/seedlings')
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, url = EXCLUDED.url`;
  }
  for (const k of ORG_KNOWLEDGE) {
    await sql`INSERT INTO guardian_knowledge (id, title, body, url) VALUES (${k.id}, ${k.title}, ${k.body}, ${k.url})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, url = EXCLUDED.url`;
  }

  // Opening balance: the baseline ready stock enters the ledger once, at
  // nursery level (no bed), so derived ready stock starts at 600.
  await sql`INSERT INTO guardian_inventory_txns (txn_id, nursery_id, txn_date, direction, quantity, source)
    VALUES (${OPENING_TXN_ID}, ${NURSERY_ID}, ${BASELINE_AS_OF}, 'in', 600, 'baseline_opening_balance')
    ON CONFLICT DO NOTHING`;

  for (const p of TEAM) {
    await sql`INSERT INTO guardian_users (id, name, status) VALUES (${p.id}, ${p.name}, 'unclaimed') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO guardian_memberships (user_id, hub_id, role, status) VALUES (${p.id}, ${HUB_ID}, 'manager', 'active')
      ON CONFLICT DO NOTHING`;
  }
}
