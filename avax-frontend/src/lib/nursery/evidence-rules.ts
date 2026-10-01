/**
 * Evidence upload rules (Kanuvari Tools & Agents PRD §4.8). Pure — no
 * imports — so they run under `node --test` and in the browser.
 */

export const EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;
export type EvidenceMime = (typeof EVIDENCE_TYPES)[number];

/** Same limit as the database CHECK (3 MB). Photos are shrunk in the browser first. */
export const MAX_EVIDENCE_BYTES = 3 * 1024 * 1024;

/** What evidence can be attached to (table names). */
export const EVIDENCE_ENTITIES = ['seedling_inventory', 'nursery_activities', 'survival_observations', 'conservation_records'] as const;
export type EvidenceEntity = (typeof EVIDENCE_ENTITIES)[number];

/**
 * The real file type from its first bytes. The browser-supplied type can't
 * be trusted: a renamed .exe must not be stored as a "photo".
 */
export function sniffMime(bytes: Uint8Array): EvidenceMime | null {
  const b = (i: number) => bytes[i];
  if (bytes.length >= 3 && b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b(i) === v)) return 'image/png';
  if (bytes.length >= 12 && String.fromCharCode(b(0), b(1), b(2), b(3)) === 'RIFF' && String.fromCharCode(b(8), b(9), b(10), b(11)) === 'WEBP') return 'image/webp';
  if (bytes.length >= 5 && String.fromCharCode(b(0), b(1), b(2), b(3), b(4)) === '%PDF-') return 'application/pdf';
  return null;
}

/** Problems with an upload, or [] when it is acceptable. */
export function evidenceProblems(input: { bytes: Uint8Array; declaredType: string; fileName: string }): string[] {
  const problems: string[] = [];
  if (!input.bytes.length) problems.push('The file is empty.');
  if (input.bytes.length > MAX_EVIDENCE_BYTES) problems.push('The file is larger than 3 MB.');
  const real = sniffMime(input.bytes);
  if (!real) problems.push('Only JPEG, PNG, WebP photos or PDF documents can be uploaded.');
  else if (input.declaredType && input.declaredType !== real && !(input.declaredType === 'image/jpg' && real === 'image/jpeg')) {
    problems.push('The file content does not match its type.');
  }
  if (!input.fileName.trim() || input.fileName.length > 255) problems.push('The file name must be 1-255 characters.');
  return problems;
}

/** A safe display name: no folders, no control characters. */
export function cleanFileName(name: string): string {
  return name.split(/[\\/]/).pop()!.replace(/[\u0000-\u001f\u007f"<>]/g, '').trim().slice(0, 255) || 'evidence';
}
