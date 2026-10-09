/** B5: "today" and "yesterday" use East Africa Time, wherever the server runs. */
export const GUARDIAN_TZ = 'Africa/Nairobi';

/** YYYY-MM-DD for a moment, in East Africa Time. */
export function eatDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: GUARDIAN_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function eatToday(): string {
  return eatDate();
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Readable date such as "9 October 2026". */
export function formatDate(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

export function isValidIsoDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
