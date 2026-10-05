import { createHash } from 'node:crypto';
import type { Cfa, CfaMember, PrismaClient } from '@prisma/client';
import { sniffMime } from '@/lib/nursery/evidence-rules';
import { FieldError } from '@/lib/nursery/validate';
import { describeRecord, MURAL_STATUSES, provenanceHash, slugify, type MuralStatus } from './provenance';

/**
 * Murals and their provenance (database side). A mural is linked to
 * VERIFIED conservation records of the same CFA; its provenance hash covers
 * the mural facts and those records' fingerprints (see provenance.ts).
 */

export const MAX_MURAL_IMAGE_BYTES = 3 * 1024 * 1024;

export async function listMurals(prisma: PrismaClient, opts: { includeDrafts?: boolean } = {}) {
  const rows = await prisma.mural.findMany({
    where: opts.includeDrafts ? {} : { status: { not: 'draft' } },
    orderBy: { createdAt: 'desc' },
    select: {
      slug: true, title: true, artist: true, priceKes: true, status: true, sizeLabel: true, imageSha256: true, createdAt: true,
      _count: { select: { records: true } },
    },
    take: 100,
  });
  return rows.map((m) => ({
    slug: m.slug, title: m.title, artist: m.artist, priceKes: m.priceKes, status: m.status, sizeLabel: m.sizeLabel,
    hasImage: !!m.imageSha256, recordCount: m._count.records, createdAt: m.createdAt.toISOString(),
  }));
}

/** Verified records of the CFA, in plain words, for linking to a new mural. */
export async function verifiedRecordOptions(prisma: PrismaClient, cfaId: string) {
  const records = await prisma.conservationRecord.findMany({
    where: { forestId: cfaId, verificationStatus: 'VERIFIED' },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: { id: true, recordType: true, anchorStatus: true, createdAt: true, currentVersion: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { data: true } } },
  });
  return records.map((r) => ({
    id: r.id, recordType: r.recordType, anchorStatus: r.anchorStatus, createdAt: r.createdAt.toISOString(),
    description: describeRecord(r.recordType, (r.versions[0]?.data ?? null) as Record<string, unknown> | null),
  }));
}

export async function getMuralDetail(prisma: PrismaClient, slug: string, opts: { includeDraft?: boolean } = {}) {
  const mural = await prisma.mural.findUnique({
    where: { slug },
    select: {
      id: true, cfaId: true, slug: true, title: true, artist: true, description: true, sizeLabel: true, priceKes: true, status: true,
      imageSha256: true, provenanceHash: true, createdAt: true, records: { select: { recordId: true } },
    },
  });
  if (!mural || (mural.status === 'draft' && !opts.includeDraft)) return null;

  const cfa = await prisma.cfa.findUnique({ where: { id: mural.cfaId }, select: { name: true } });
  const records = await prisma.conservationRecord.findMany({
    where: { id: { in: mural.records.map((r) => r.recordId) } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, recordType: true, dataHash: true, verificationStatus: true, anchorStatus: true, avalancheTxHash: true, anchoredAt: true, createdAt: true,
      versions: { orderBy: { version: 'desc' }, take: 1, select: { data: true } },
      reviews: { orderBy: { createdAt: 'desc' }, take: 1, select: { decision: true, reviewerId: true, createdAt: true } },
    },
  });
  const reviewerIds = records.flatMap((r) => r.reviews.map((v) => v.reviewerId));
  const reviewers = reviewerIds.length
    ? new Map((await prisma.cfaMember.findMany({ where: { id: { in: reviewerIds } }, select: { id: true, name: true } })).map((m) => [m.id, m.name]))
    : new Map<string, string>();

  const items = records.map((r) => {
    const data = (r.versions[0]?.data ?? null) as Record<string, unknown> | null;
    const review = r.reviews[0];
    return {
      id: r.id,
      recordType: r.recordType,
      description: describeRecord(r.recordType, data),
      submittedBy: ((data?.submittedBy as { name?: string } | undefined)?.name) ?? null,
      dataHash: r.dataHash,
      verificationStatus: r.verificationStatus,
      verifiedBy: review ? reviewers.get(review.reviewerId) ?? null : null,
      verifiedAt: review ? review.createdAt.toISOString() : null,
      anchorStatus: r.anchorStatus,
      avalancheTxHash: r.avalancheTxHash,
      anchoredAt: r.anchoredAt?.toISOString() ?? null,
      recordedAt: r.createdAt.toISOString(),
    };
  });

  // Recompute from today's records: if a record changed after the mural was
  // made, the stored hash no longer matches and the page says so.
  const current = provenanceHash(
    { slug: mural.slug, title: mural.title, artist: mural.artist, imageSha256: mural.imageSha256, cfaId: mural.cfaId },
    records.map((r) => ({ id: r.id, dataHash: r.dataHash })),
  );
  const planters = [...new Set(items.map((i) => i.submittedBy).filter(Boolean))] as string[];

  return {
    slug: mural.slug, title: mural.title, artist: mural.artist, description: mural.description, sizeLabel: mural.sizeLabel,
    priceKes: mural.priceKes, status: mural.status, hasImage: !!mural.imageSha256, imageSha256: mural.imageSha256,
    createdAt: mural.createdAt.toISOString(),
    cfa: { name: cfa?.name ?? 'Community Forest Association' },
    planters,
    records: items,
    provenance: { hash: mural.provenanceHash, current, matches: mural.provenanceHash === current },
  };
}

export interface NewMural {
  title: string; artist: string; description: string | null; sizeLabel: string | null; priceKes: number; status: MuralStatus;
  recordIds: string[]; image: { bytes: Uint8Array; declaredType: string } | null;
}

export async function createMural(prisma: PrismaClient, cfa: Cfa, member: CfaMember, input: NewMural) {
  if (input.title.length < 3 || input.title.length > 120) throw new FieldError('title', 'Give the mural a title of 3 to 120 letters.');
  if (input.artist.length < 2 || input.artist.length > 120) throw new FieldError('artist', 'Add the artist name.');
  if (!Number.isInteger(input.priceKes) || input.priceKes < 0 || input.priceKes > 10_000_000) throw new FieldError('priceKes', 'Price must be a whole number of shillings.');
  if (!MURAL_STATUSES.includes(input.status)) throw new FieldError('status', 'Unknown status.');
  const ids = [...new Set(input.recordIds)].slice(0, 100);
  if (ids.length === 0) throw new FieldError('recordIds', 'Link at least one verified conservation record. That is the mural’s story.');

  const records = await prisma.conservationRecord.findMany({
    where: { id: { in: ids }, forestId: cfa.id, verificationStatus: 'VERIFIED' },
    select: { id: true, dataHash: true },
  });
  if (records.length !== ids.length) throw new FieldError('recordIds', 'Only verified records of this CFA can be linked.');

  let image: { bytes: Uint8Array<ArrayBuffer>; mime: string; sha256: string } | null = null;
  if (input.image) {
    if (input.image.bytes.length > MAX_MURAL_IMAGE_BYTES) throw new FieldError('image', 'The picture is larger than 3 MB.');
    const mime = sniffMime(input.image.bytes);
    if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') throw new FieldError('image', 'Use a JPEG, PNG or WebP picture.');
    image = { bytes: new Uint8Array(input.image.bytes), mime, sha256: createHash('sha256').update(input.image.bytes).digest('hex') };
  }

  // A free slug: the title, then -2, -3, ...
  const base = slugify(input.title);
  let slug = base;
  for (let i = 2; await prisma.mural.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`.slice(0, 80);

  const hash = provenanceHash({ slug, title: input.title, artist: input.artist, imageSha256: image?.sha256 ?? null, cfaId: cfa.id }, records);
  return prisma.mural.create({
    data: {
      cfaId: cfa.id, slug, title: input.title, artist: input.artist, description: input.description, sizeLabel: input.sizeLabel,
      priceKes: input.priceKes, status: input.status, createdBy: member.id,
      image: image?.bytes, imageMime: image?.mime, imageSha256: image?.sha256, provenanceHash: hash,
      records: { create: records.map((r) => ({ recordId: r.id })) },
    },
    select: { slug: true },
  });
}
