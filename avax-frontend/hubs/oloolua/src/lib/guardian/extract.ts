/**
 * Plain-language extraction for activity drafts (PRD B5). Pure functions,
 * no I/O, so they are easy to test. Used for the no-AI path, for answering
 * the draft's follow-up questions, and to cross-check AI-produced drafts.
 *
 * Rules: nothing is guessed. If the type, date or another required field is
 * not clearly stated, it is left empty and the draft asks for it.
 */

import { ACTIVITY_TYPES, type ActivityType, type DraftField } from './constants';
import { addDays, eatToday, isValidIsoDate } from './time';

export interface DraftFields {
  type?: ActivityType;
  /** Set when the wording was ambiguous, e.g. "planted" at a nursery. */
  typeAmbiguous?: boolean;
  quantity?: number;
  date?: string;
  species?: string;
  seedbed?: number;
  toSeedbed?: number;
  destination?: string;
  notes?: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000 };

/** "one hundred and twenty" -> 120. Returns null when the words are not a number. */
export function wordsToNumber(text: string): number | null {
  const tokens = text.toLowerCase().replace(/-/g, ' ').split(/\s+/).filter((t) => t && t !== 'and');
  if (tokens.length === 0) return null;
  let total = 0;
  let current = 0;
  for (const t of tokens) {
    if (t in NUMBER_WORDS) current += NUMBER_WORDS[t];
    else if (t in SCALES) {
      current = (current || 1) * SCALES[t];
      if (SCALES[t] >= 1000) { total += current; current = 0; }
    } else return null;
  }
  return total + current;
}

const NUMBER_WORD_RE = new RegExp(
  `\\b((?:${[...Object.keys(NUMBER_WORDS), ...Object.keys(SCALES)].join('|')})(?:[\\s-]+(?:and\\s+)?(?:${[...Object.keys(NUMBER_WORDS), ...Object.keys(SCALES)].join('|')}))*)\\b`,
  'i',
);

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

function monthIndex(m: string): number {
  return MONTHS.findIndex((full) => full.startsWith(m.toLowerCase().slice(0, 3)));
}

function iso(y: number, m: number, d: number): string | undefined {
  const s = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return isValidIsoDate(s) ? s : undefined;
}

/** Finds a date and returns it with the matched text, so the text can be removed before reading numbers. */
export function extractDate(text: string): { date?: string; match?: string } {
  const t = text.toLowerCase();
  const today = eatToday();
  let m = t.match(/\b(today|leo)\b/);
  if (m) return { date: today, match: m[0] };
  m = t.match(/\b(yesterday|jana)\b/);
  if (m) return { date: addDays(today, -1), match: m[0] };
  m = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return { date: iso(+m[1], +m[2] - 1, +m[3]), match: m[0] };
  const year = Number(today.slice(0, 4));
  m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\.?(?:,?\\s+(\\d{4}))?\\b`));
  if (m) return { date: iso(m[3] ? +m[3] : year, monthIndex(m[2]), +m[1]), match: m[0] };
  m = t.match(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`));
  if (m) return { date: iso(m[3] ? +m[3] : year, monthIndex(m[1]), +m[2]), match: m[0] };
  m = t.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (m) return { date: iso(+m[3], +m[2] - 1, +m[1]), match: m[0] }; // day/month/year, as used in Kenya
  return {};
}

const TYPE_PATTERNS: [ActivityType, RegExp][] = [
  ['out_planting', /\b(out[\s-]?plant(?:ed|ing)?|planted\s+out|planted\s+(?:in|at|into)\s+the\s+(?:forest|field|site))\b/],
  ['transfer', /\b(transferr?(?:ed|ing)?|moved?|moving)\b/],
  ['dispatch', /\b(dispatch(?:ed|ing)?|sold|sell|sale|donat(?:ed|e|ion)|deliver(?:ed|y)?|sent\s+out|gave\s+out)\b/],
  ['mortality', /\b(died|dead|death|mortality|lost|loss|perished|wilted)\b/],
  ['hardening', /\b(harden(?:ed|ing)?)\b/],
  ['potting', /\b(pott(?:ed|ing)|re-?potted)\b/],
  ['sowing', /\b(sow(?:n|ed|ing)?|seeded)\b/],
];

export function extractType(text: string): { type?: ActivityType; ambiguous?: boolean } {
  const t = text.toLowerCase();
  for (const [type, re] of TYPE_PATTERNS) if (re.test(t)) return { type };
  // Option labels and keys typed back as an answer.
  for (const [key, def] of Object.entries(ACTIVITY_TYPES)) {
    if (t.includes(def.label.toLowerCase()) || t.replace(/[\s-]/g, '_').includes(key)) return { type: key as ActivityType };
  }
  // B5: in a nursery "planted" could mean sowing, potting or out-planting. Ask.
  if (/\b(plant(?:ed|ing)?)\b/.test(t)) return { ambiguous: true };
  return {};
}

const BED_NUMBER = '(\\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)';

function bedNum(s: string): number | undefined {
  const n = /^\d+$/.test(s) ? Number(s) : wordsToNumber(s);
  return n && n > 0 ? n : undefined;
}

export function extractBeds(text: string): { seedbed?: number; toSeedbed?: number; matches: string[] } {
  const t = text.toLowerCase();
  const matches: string[] = [];
  const fromTo = t.match(new RegExp(`from\\s+(?:seed)?bed\\s+(?:number\\s+)?${BED_NUMBER}\\s+to\\s+(?:seed)?bed\\s+(?:number\\s+)?${BED_NUMBER}`));
  if (fromTo) {
    matches.push(fromTo[0]);
    return { seedbed: bedNum(fromTo[1]), toSeedbed: bedNum(fromTo[2]), matches };
  }
  const all = [...t.matchAll(new RegExp(`(?:seed)?bed\\s+(?:number\\s+|no\\.?\\s*)?${BED_NUMBER}\\b`, 'g'))];
  all.forEach((m) => matches.push(m[0]));
  return { seedbed: all[0] ? bedNum(all[0][1]) : undefined, toSeedbed: all[1] ? bedNum(all[1][1]) : undefined, matches };
}

export function extractQuantity(text: string, ignore: string[] = []): number | undefined {
  let t = text.toLowerCase();
  for (const m of ignore) if (m) t = t.replace(m.toLowerCase(), ' ');
  const digits = t.match(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/);
  if (digits) return Number(digits[1].replace(/,/g, ''));
  const words = t.match(NUMBER_WORD_RE);
  if (words) {
    const n = wordsToNumber(words[1]);
    if (n !== null) return n;
  }
  return undefined;
}

export function extractSpecies(text: string, speciesNames: string[]): string | undefined {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')} `;
  for (const name of speciesNames) {
    // Whole names only ("croton", "silky oak", "nile tulip tree"); a shared
    // first word like "african" must not pick a species.
    const keys = name.toLowerCase().split(/[·(),/]/).map((k) => k.trim()).filter((k) => k.length >= 4);
    if (keys.some((k) => t.includes(` ${k} `) || t.includes(` ${k}s `))) return name;
  }
  return undefined;
}

/** "to Oloolua Primary School", "at Riverine Section 4" for dispatch and out-planting. */
export function extractDestination(text: string): string | undefined {
  const m = text.match(/\b(?:to|at|for)\s+(?!bed\b|seedbed\b|the\s+nursery\b|turako\b)([A-Z][\w'-]*(?:\s+(?:[A-Z0-9][\w'-]*|of|the|and))*)/);
  return m ? m[1].trim().replace(/\s+(today|yesterday)$/i, '').slice(0, 120) : undefined;
}

export function extractActivity(text: string, speciesNames: string[]): DraftFields {
  const fields: DraftFields = {};
  const { type, ambiguous } = extractType(text);
  if (type) fields.type = type;
  if (ambiguous) fields.typeAmbiguous = true;
  const date = extractDate(text);
  if (date.date) fields.date = date.date;
  const beds = extractBeds(text);
  if (beds.seedbed) fields.seedbed = beds.seedbed;
  if (beds.toSeedbed) fields.toSeedbed = beds.toSeedbed;
  const qty = extractQuantity(text, [date.match ?? '', ...beds.matches]);
  if (qty !== undefined) fields.quantity = qty;
  const sp = extractSpecies(text, speciesNames);
  if (sp) fields.species = sp;
  if (fields.type === 'dispatch' || fields.type === 'out_planting') {
    const dest = extractDestination(text);
    if (dest) fields.destination = dest;
  }
  return fields;
}

/** Fields still needed before a draft can be read back for confirmation. */
export function missingFields(f: DraftFields): DraftField[] {
  if (!f.type) return ['type'];
  return (ACTIVITY_TYPES[f.type].required as readonly DraftField[]).filter((k) => {
    const v = f[k as keyof DraftFields];
    return v === undefined || v === null || v === '';
  });
}

/** Reads a reply to the draft's current question. Returns null if it is not an answer. */
export function answerField(field: DraftField, reply: string, speciesNames: string[]): Partial<DraftFields> | null {
  const r = reply.trim();
  if (!r) return null;
  switch (field) {
    case 'type': {
      const { type } = extractType(r);
      if (type) return { type, typeAmbiguous: false };
      const n = Number(r);
      const keys = Object.keys(ACTIVITY_TYPES) as ActivityType[];
      return Number.isInteger(n) && n >= 1 && n <= keys.length ? { type: keys[n - 1], typeAmbiguous: false } : null;
    }
    case 'quantity': {
      const q = extractQuantity(r);
      return q !== undefined && q > 0 ? { quantity: q } : null;
    }
    case 'date': {
      const d = extractDate(r);
      return d.date ? { date: d.date } : null;
    }
    case 'seedbed':
    case 'toSeedbed': {
      const beds = extractBeds(r);
      const n = beds.seedbed ?? (/^\s*\d{1,2}\s*$/.test(r) ? Number(r) : wordsToNumber(r) ?? undefined);
      return n ? { [field]: n } : null;
    }
    case 'destination':
      return r.length >= 2 && r.length <= 120 ? { destination: r } : null;
    case 'species': {
      const s = extractSpecies(r, speciesNames);
      return s ? { species: s } : null;
    }
    case 'notes':
      return { notes: r.slice(0, 500) };
  }
}

export const YES_RE = /^\s*(yes|yeah|yep|y|ok(?:ay)?|sure|save( it)?|confirm(ed)?|go ahead|ndio|ndiyo|sawa)\s*[.!]*\s*$/i;
export const NO_RE = /^\s*(no|nope|n|cancel|stop|don'?t( save)?|hapana|acha)\s*[.!]*\s*$/i;

export const FIELD_QUESTIONS: Record<DraftField, string> = {
  type: `Which kind of activity is this? ${Object.values(ACTIVITY_TYPES).map((t, i) => `${i + 1}. ${t.label}`).join(', ')}.`,
  quantity: 'How many seedlings?',
  date: 'Which date? You can say today, yesterday, or a date such as 9 October.',
  seedbed: 'Which seedbed? For example, bed 1.',
  toSeedbed: 'Which seedbed were they moved to?',
  destination: 'Where did they go? For example, the school, buyer or planting site.',
  species: 'Which species?',
  notes: 'Any notes to add?',
};
