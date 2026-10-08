import { NextResponse } from 'next/server';
import { sql, initDbSchema } from '@/lib/db';

// Write-only by design: these rows hold names, emails and phone numbers, so
// there is deliberately no GET handler. Rate limiting and origin checks are
// applied to this route by src/proxy.ts.

const KINDS = new Set(['contact', 'commitment', 'pledge', 'newsletter']);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()-]{7,20}$/;

function str(value: unknown, maxLen: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLen) : '';
}

function bad(error: string) {
  return NextResponse.json({ success: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad('Request body must be valid JSON.');
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return bad('Request body must be a JSON object.');
  }
  const input = body as Record<string, unknown>;

  // Honeypot: a field real visitors never see. Bots that fill every input get
  // a normal-looking success so they don't learn to skip it.
  if (str(input.website, 200)) {
    return NextResponse.json({ success: true, message: 'Thank you.' });
  }

  const kind = str(input.kind, 16);
  if (!KINDS.has(kind)) return bad('Unknown form type.');

  const name = str(input.name, 120);
  const contact = str(input.contact, 160);
  const message = str(input.message, 2000);

  const emailOnly = kind === 'contact' || kind === 'newsletter';
  if (emailOnly && !EMAIL_RE.test(contact)) return bad('Please enter a valid email address.');
  if (!emailOnly && !EMAIL_RE.test(contact) && !PHONE_RE.test(contact)) {
    return bad('Please enter a valid email address or phone number.');
  }
  if (kind !== 'newsletter' && !name) return bad('Please enter your name.');
  if (kind === 'contact' && !message) return bad('Please enter a message.');

  try {
    await initDbSchema();

    if (kind === 'newsletter') {
      const existing = (await sql`
        SELECT 1 FROM kai_messages WHERE kind = 'newsletter' AND lower(contact) = lower(${contact}) LIMIT 1
      `) as Record<string, unknown>[];
      if (existing.length > 0) {
        return NextResponse.json({ success: true, message: 'You are already subscribed.' });
      }
    }

    await sql`
      INSERT INTO kai_messages (id, kind, name, contact, message)
      VALUES (${`MSG-${crypto.randomUUID()}`}, ${kind}, ${name || null}, ${contact}, ${message || null})
    `;

    const confirmations: Record<string, string> = {
      contact: 'Message received. Our team will get back to you soon.',
      commitment: 'Thank you for your commitment. We will be in touch.',
      pledge: 'Your pledge has been logged. Our CFA team will be in touch.',
      newsletter: 'Subscribed. You will receive our conservation updates.',
    };
    return NextResponse.json({ success: true, message: confirmations[kind] });
  } catch (error) {
    console.error('Error saving message to Neon DB:', error);
    return NextResponse.json(
      { success: false, error: 'We could not save your submission. Please try again shortly.' },
      { status: 500 },
    );
  }
}
