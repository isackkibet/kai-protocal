import { createHash } from 'node:crypto';

/**
 * Deterministic JSON for MRV records (Canuvari MRV PRD §4.1).
 *
 * The same data must always produce byte-identical output, or the SHA-256
 * fingerprint of a record would change without the record changing. Rules
 * follow RFC 8785 (JSON Canonicalization Scheme) for the values records use:
 *
 * - object keys sorted by UTF-16 code units, no whitespace
 * - strings and numbers serialized exactly as JSON.stringify does
 *   (ECMAScript shortest round-trip form, which is what RFC 8785 specifies)
 * - `undefined` object members are dropped, as in JSON
 *
 * Anything JSON can't represent unambiguously — NaN/Infinity, BigInt, Dates,
 * functions, class instances — throws instead of being silently coerced, so
 * callers convert dates to ISO strings explicitly before hashing.
 */
export function canonicalize(value: unknown): string {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'string':
      return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw new TypeError(`Cannot canonicalize non-finite number: ${value}`);
      return JSON.stringify(value);
    case 'object':
      break;
    default:
      throw new TypeError(`Cannot canonicalize a value of type ${typeof value}`);
  }

  if (Array.isArray(value)) {
    return `[${value.map((v) => (v === undefined ? 'null' : canonicalize(v))).join(',')}]`;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    throw new TypeError(`Cannot canonicalize a ${proto?.constructor?.name ?? 'non-plain'} object; convert it to plain JSON first`);
  }

  const obj = value as Record<string, unknown>;
  const members = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`);
  return `{${members.join(',')}}`;
}

/** Lowercase hex SHA-256 of a UTF-8 string. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** The record fingerprint: SHA-256 of the canonical JSON. */
export function hashRecord(data: unknown): string {
  return sha256Hex(canonicalize(data));
}
