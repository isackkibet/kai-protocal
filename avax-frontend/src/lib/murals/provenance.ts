import { canonicalize, sha256Hex } from '../mrv/canonical.ts';

/**
 * Mural provenance (pure, no database). A mural's provenance hash is the
 * SHA-256 of a canonical JSON of the mural and the fingerprints of the
 * conservation records behind it. Anyone holding the same facts can
 * recompute it; changing a record, the image or the artist changes it.
 */

export interface MuralFacts { slug: string; title: string; artist: string; imageSha256: string | null; cfaId: string }
export interface LinkedRecord { id: string; dataHash: string }

export function provenanceHash(mural: MuralFacts, records: LinkedRecord[]): string {
  const doc = {
    schema: 'mural-provenance/v1',
    mural: { slug: mural.slug, title: mural.title, artist: mural.artist, imageSha256: mural.imageSha256, cfaId: mural.cfaId },
    // Sorted so the order the records were linked in doesn't matter.
    records: [...records].sort((a, b) => a.id.localeCompare(b.id)).map((r) => ({ id: r.id, dataHash: r.dataHash })),
  };
  return sha256Hex(canonicalize(doc));
}

export function slugify(title: string): string {
  const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base.length >= 3 ? base : `mural-${base}`.slice(0, 60);
}

/** One plain sentence for a record's data, e.g. "2 Jackfruit planted on 1 Oct 2026". */
export function describeRecord(recordType: string, data: Record<string, unknown> | null): string {
  const d = data ?? {};
  const species = (d.species as { name?: string } | undefined)?.name?.replace(/\s*\(.*\)$/, '');
  const qty = typeof d.quantity === 'number' ? d.quantity : null;
  const dateRaw = (d.plantedAt ?? d.observationDate ?? d.dateReceived ?? d.activityDate) as string | undefined;
  const date = dateRaw && !Number.isNaN(Date.parse(dateRaw))
    ? new Date(dateRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : null;
  const what = recordType === 'PLANTING' ? 'planted' : recordType === 'SURVIVAL' ? 'checked for survival'
    : recordType === 'NURSERY_INVENTORY' ? 'raised in the nursery' : recordType.toLowerCase().replace(/_/g, ' ');
  const alive = typeof d.aliveQuantity === 'number' ? ` (${d.aliveQuantity} alive)` : '';
  return [qty != null ? String(qty) : null, species ?? 'trees', what + alive, date ? `on ${date}` : null].filter(Boolean).join(' ');
}

export const MURAL_STATUSES = ['draft', 'available', 'reserved', 'sold'] as const;
export type MuralStatus = (typeof MURAL_STATUSES)[number];
