/**
 * Structured content for the KAI Nuvari Conservation / CFA Information Hub
 * (PRD Part B). The hub is a discovery/orchestration layer — it organizes,
 * explains and verifies conservation work; it never replaces the CFAs,
 * dashboards or practitioners who create the value. These datasets are seeded
 * in code so the hub works offline; the matching Prisma models
 * (Methodology, KnowledgeArticle, Resource) are the migration target.
 */

export interface MethodologyData {
  slug: string;
  name: string;
  shortDescription: string;
  purpose: string;
  problemAddressed: string;
  howItWorks: string[];
  activities: string[];
  requiredData: string[];
  participants: string[];
  expectedOutcomes: string[];
  conservationBenefits: string[];
  economicValue: string;
  verificationRequirements: string;
  relatedResources: string[];
  relatedCfas: string[];
  featured: boolean;
  ownerType: 'KAI_CREATED' | 'EXTERNAL' | 'PARTNER';
}

export const METHODOLOGIES: MethodologyData[] = [
  {
    slug: 'jaza-miti',
    name: 'Jaza Miti',
    shortDescription: 'Community tree-planting with per-tree verification — every tree logged, checked and traceable.',
    purpose: 'Create verifiable conservation records for community tree planting so that restoration work can be trusted, financed and, ultimately, tokenized.',
    problemAddressed: 'Tree-planting campaigns claim millions of trees, but few can prove which trees survived, where they were planted, or who planted them. Jaza Miti turns planting from a reported activity into a verified record.',
    howItWorks: [
      'A CFA or guardian registers a planting batch: species, nursery source, zone, quantity and GPS/zone reference.',
      'Structured records are organized and consistency-checked — AI assists with annotation and classification, never verification authority.',
      'A human verifier reviews evidence against the record and approves or rejects it.',
      'Approved records become the basis for conservation reporting, finance inputs and eventual on-chain anchoring.',
    ],
    activities: [
      'Nursery stock intake and species registration',
      'Planting batch logging with species and zone data',
      'Survival follow-ups at fixed intervals',
      'Evidence capture (photos, GPS, patrol logs)',
      'Human verification and annotation',
      'Record export for finance or anchoring',
    ],
    requiredData: [
      'CFA identity and zone reference',
      'Species and quantity planted',
      'Planting date and submitter identity',
      'Survival observations and evidence',
    ],
    participants: ['CFA guardians', 'Community Forest Associations', 'Verifiers', 'Hub administrators'],
    expectedOutcomes: [
      'Verified planting and survival records',
      'Trustworthy conservation reporting',
      'Inputs for conservation finance and carbon accounting',
    ],
    conservationBenefits: ['Restored forest cover', 'Improved survival through follow-up', 'Traceable community stewardship'],
    economicValue: 'Verified records are the raw material for conservation finance, carbon accounting and — at a later phase — tokenized conservation assets on Avalanche.',
    verificationRequirements: 'Human verification of records and evidence; AI supports organization and consistency checks but never approves a record.',
    relatedResources: ['Jaza Miti methodology guide', 'CFA verification workbook', 'Tree species registry'],
    relatedCfas: ['Oloolua', 'Mau Forest Guardians Group A'],
    featured: true,
    ownerType: 'EXTERNAL',
  },
  {
    slug: 'green-tree-commodities-initiative',
    name: 'Green Tree Commodities Initiative (GTCI)',
    shortDescription: 'Treats the tree as a commodity with a life cycle — nursery, growth, harvest and market — aggregated through households and CFAs.',
    purpose: 'Link tree ownership to real commodity value so households earn from growing trees, not just from planting events.',
    problemAddressed: 'Trees are planted and abandoned because there is no path from ownership to income. GTCI builds that path as a structured, data-driven commodity lifecycle.',
    howItWorks: [
      'Households register individual trees as commodities through their CFA or co-op.',
      'Each tree carries data: species, age, survival, management, and planned harvest/use.',
      'Aggregation pools household volumes into marketable sizes.',
      'Verified lifecycle data connects growers to markets and, later, to traceable financial instruments.',
    ],
    activities: [
      'Household tree registration',
      'Growth and survival monitoring',
      'Commodity aggregation by CFA/co-op',
      'Market linkage and offtake planning',
    ],
    requiredData: [
      'Household and tree registration',
      'Species, age and survival history',
      'Harvest or commodity-use intent',
      'CFA/co-op aggregation unit',
    ],
    participants: ['Tree-owning households', 'CFAs and cooperatives', 'Market buyers', 'Hub administrators'],
    expectedOutcomes: [
      'Households with income from managed trees',
      'Aggregated commodity volumes',
      'Structured, verifiable tree-asset records',
    ],
    conservationBenefits: ['Trees kept standing through financial value', 'Managed rather than abandoned plantations', 'Landscape-level aggregation'],
    economicValue: 'Commodity sales today; conservation finance taps and tokenized tree-based commodities at later phases.',
    verificationRequirements: 'Evidence for registrations, survival checks and commodity flows; human verifiers confirm records before finance or tokenization use.',
    relatedResources: ['GTCI commodity lifecycle guide', 'Household tree registration template', 'CFA aggregation playbook'],
    relatedCfas: ['Oloolua'],
    featured: true,
    ownerType: 'EXTERNAL',
  },
];

export interface KnowledgeArticleData {
  slug: string;
  category: string;
  title: string;
  summary: string;
  body: string;
  sourceAttribution?: string;
}

const CAT = {
  BASICS: 'Conservation basics',
  SPECIES: 'Tree species',
  NURSERY: 'Nursery practice',
  PLANTING: 'Tree planting',
  RESTORATION: 'Restoration',
  BIODIVERSITY: 'Biodiversity',
  COMMUNITY: 'Community conservation',
  FINANCE: 'Conservation finance',
} as const;

export const KNOWLEDGE_CATEGORIES = Object.values(CAT);

export const KNOWLEDGE: KnowledgeArticleData[] = [
  {
    slug: 'why-trees-matter',
    category: CAT.BASICS,
    title: 'Why Trees Matter: The Core of Restoration',
    summary: 'The ecosystem services trees provide — water, soil, climate, and community livelihoods — in plain language.',
    body: 'Trees regulate water cycles, anchor soils, shade undergrowth, capture carbon, and provide fuel, food and fibre. Restoration is not only about planting more trees; it is about re-establishing a functioning landscape that supports people and biodiversity together.\n\nThe most useful frame for a CFA is a simple one: a healthy forest keeps water in the landscape, keeps soil on the slopes, and keeps income in the community. Every methodology on this hub is built around that frame.',
    sourceAttribution: 'KAI Nuvari knowledge series',
  },
  {
    slug: 'how-to-choose-species',
    category: CAT.SPECIES,
    title: 'Matching Species to Site, Soil and Rainfall',
    summary: 'A plain-language guide to picking the right tree for the right place.',
    body: 'Species selection is the highest-leverage decision a nursery makes. Ask three questions: what is the rainfall range of the site, what is the soil like, and what is the planting for — timber, water, bee pasture, or products?\n\nRiverine species tolerate wet feet. Dryland workhorses handle long dry seasons but demand careful nursery hardening. Timber species need space and time. A species registry, kept current by the CFA, is the group memory for these choices.',
    sourceAttribution: 'KEFRI species guides (summarized)',
  },
  {
    slug: 'nursery-practice-basics',
    category: CAT.NURSERY,
    title: 'Nursery Practice: Seed Banking, Stock and Hardening',
    summary: 'How to raise seedlings that survive transplanting — the fundamentals of a working CFA nursery.',
    body: 'A good nursery starts before seeds go in: clean trays, treated media, and labelled provenance. Watering regimes matter most in the first weeks. Hardening — gradually exposing seedlings to sun and reduced water — is what separates transplant survivors from casualties.\n\nKeep inventory honest. Stock that is ordered, planted, and sold should move through a simple ledger the whole CFA can read. Survival depends on this record-keeping as much as on watering.',
    sourceAttribution: 'KEFRI nursery manual; CFA nursery logs',
  },
  {
    slug: 'planting-season-correctness',
    category: CAT.PLANTING,
    title: 'Planting in the Right Season — and the Right Way',
    summary: 'Timing, hole preparation, and planting depth: the details that decide whether a tree lives.',
    body: 'Plant into wet soil, ahead of the long rains, not after them. A hole twice the width of the root ball and mixed backfill gives roots an easy start. Planting depth matters: too deep drowns the collar, too shallow dries the roots.\n\nPost-planting care — mulch, a little shade, and protection from browsing — is part of planting, not an afterthought. Survival records that note these practices are the evidence base that improves the whole CFA over time.',
    sourceAttribution: 'KEFRI planting guides; CFA field notes',
  },
  {
    slug: 'restoring-not-just-planting',
    category: CAT.RESTORATION,
    title: 'Restoration Is More Than Planting',
    summary: 'Natural regeneration, enrichment, and protection are the quiet engines of forest recovery.',
    body: 'Planting gets the headlines, but assisted natural regeneration — protecting and nurturing the seedlings the land offers — often restores more for less. Enrichment planting fills gaps where regeneration is blocked.\n\nThe practical rule: protect first, plant where needed, and let forest succession do its work. Monitoring survival, not planting counts, is the honest measure of restoration.',
    sourceAttribution: 'Restoration literature (summarized)',
  },
  {
    slug: 'forest-biodiversity-matters',
    category: CAT.BIODIVERSITY,
    title: 'Biodiversity: What a Forest Needs Beyond Trees',
    summary: 'Bees, birds, soil life and understorey—the living web that keeps planted trees alive.',
    body: 'A forest is a web, not a collection of poles. Pollinators raise fruit set, birds and bats disperse seed, and soil organisms cycle nutrients the trees depend on. Monoculture stands are fragile; diverse plantings are resilient.\n\nPractical steps: keep a mix of native species, protect flowering plants for bee pasture, and leave some dead wood standing. Beekeeping inside or beside the forest, a common CFA activity, is biodiversity working for the budget.',
    sourceAttribution: 'KAI Nuvari knowledge series',
  },
  {
    slug: 'community-conservation-agreements',
    category: CAT.COMMUNITY,
    title: 'Community Conservation: Agreements, Roles, and Accountability',
    summary: 'What makes community forest governance work — and what breaks it.',
    body: 'Community conservation works when roles are clear: who plants, who monitors, who manages funds, who verifies. Written agreements — bylaws, membership roles, benefit-sharing rules — turn goodwill into governance.\n\nTransparency is the glue. When planting records and treasury figures are visible to members, accountability follows. This is why the Information Hub links to CFA dashboards instead of replacing them: the people closest to the forest own the data.',
    sourceAttribution: 'KAI Nuvari knowledge series',
  },
  {
    slug: 'conservation-finance-primer',
    category: CAT.FINANCE,
    title: 'Conservation Finance: How Verified Work Becomes Value',
    summary: 'Carbon, credits, finance and tokens — a primer for CFA members on how conservation work can be paid for.',
    body: 'Conservation finance pays for verified conservation outcomes: restored hectares, surviving trees, protected water catchments. The currency can be grants, results-based payments, carbon credits, or — as Kai Nuvari develops it — tokenized representations on Avalanche.\n\nNone of it works without verification. A record that cannot be checked is not financeable. The path is: activity → structured record → evidence → human verification → verified record → digital representation. Everything on this hub is oriented to that path.',
    sourceAttribution: 'KAI Nuvari knowledge series',
  },
];

export interface ResourceData {
  id: string;
  title: string;
  kind: string;
  description: string;
  sourceName: string;
  sourceType: 'KAI_CREATED' | 'EXTERNAL';
  url: string;
  methodologySlug?: string;
}

export const RESOURCES: ResourceData[] = [
  {
    id: 'r1',
    title: 'Jaza Miti methodology guide',
    kind: 'Manual',
    description: 'Step-by-step description of the Jaza Miti verification workflow for CFAs.',
    sourceName: 'Jaza Miti',
    sourceType: 'EXTERNAL',
    url: '#',
    methodologySlug: 'jaza-miti',
  },
  {
    id: 'r2',
    title: 'CFA verification workbook',
    kind: 'Guide',
    description: 'Templates for structured planting and survival records ready for verification.',
    sourceName: 'KAI Nuvari',
    sourceType: 'KAI_CREATED',
    url: '#',
    methodologySlug: 'jaza-miti',
  },
  {
    id: 'r3',
    title: 'GTCI commodity lifecycle guide',
    kind: 'Guide',
    description: 'How individual tree commodities move from registration to market via aggregation.',
    sourceName: 'GTCI',
    sourceType: 'EXTERNAL',
    url: '#',
    methodologySlug: 'green-tree-commodities-initiative',
  },
  {
    id: 'r4',
    title: 'KEFRI nursery manual',
    kind: 'Manual',
    description: 'Nursery establishment, seed handling and hardening techniques.',
    sourceName: 'KEFRI',
    sourceType: 'EXTERNAL',
    url: 'https://www.kefi.org/',
  },
  {
    id: 'r5',
    title: 'Species selection quick sheet',
    kind: 'Document',
    description: 'Rainfall, soil and spacing notes for common conservation species in Kenya.',
    sourceName: 'KAI Nuvari',
    sourceType: 'KAI_CREATED',
    url: '#',
  },
  {
    id: 'r6',
    title: 'Survival monitoring field card',
    kind: 'Training',
    description: 'A printable card for recording survival follow-ups on patrol.',
    sourceName: 'KAI Nuvari',
    sourceType: 'KAI_CREATED',
    url: '#',
  },
  {
    id: 'r7',
    title: 'Conservation finance primer (video)',
    kind: 'Video',
    description: 'Short explainer on how verified records become financial value.',
    sourceName: 'KAI Nuvari',
    sourceType: 'KAI_CREATED',
    url: '#',
  },
  {
    id: 'r8',
    title: 'Restoration benefits research overview',
    kind: 'Research paper',
    description: 'Summarized evidence on the ecosystem services of restored community forests.',
    sourceName: 'Reviewed external literature',
    sourceType: 'EXTERNAL',
    url: '#',
  },
];

export interface AskKaiResult {
  kind: 'knowledge' | 'methodology' | 'resource';
  title: string;
  summary: string;
  source: string;
  slug?: string;
  score: number;
}

function tokens(text: string): Set<string> {
  return new Set(String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t.length > 2));
}

function scoreDocs(query: string): AskKaiResult[] {
  const q = tokens(query);
  if (q.size === 0) return [];
  const results: AskKaiResult[] = [];

  const overlap = (a: Set<string>, b: Set<string>) =>
    [...b].filter(t => a.has(t)).length / Math.max(1, q.size);

  for (const m of METHODOLOGIES) {
    const hay = [m.name, m.shortDescription, m.purpose, ...m.activities].join(' ');
    const s = overlap(tokens(hay), q);
    if (s > 0) results.push({ kind: 'methodology', title: m.name, summary: m.shortDescription, source: 'Methodology', slug: m.slug, score: s });
  }

  for (const k of KNOWLEDGE) {
    const s = overlap(tokens(`${k.title} ${k.summary} ${k.body}`), q);
    if (s > 0) results.push({ kind: 'knowledge', title: k.title, summary: k.summary, source: k.category, slug: k.slug, score: s });
  }

  for (const r of RESOURCES) {
    const s = overlap(tokens(`${r.title} ${r.description} ${r.sourceName}`), q);
    if (s > 0) results.push({ kind: 'resource', title: r.title, summary: r.description ?? '', source: `${r.sourceName} · ${r.kind}`, score: s });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 5);
}

export function askConservation(query: string): AskKaiResult[] {
  const q = query.trim();
  if (q.length < 3) return [];
  return scoreDocs(q);
}