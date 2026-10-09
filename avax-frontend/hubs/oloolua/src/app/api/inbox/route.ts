import { NextResponse, type NextRequest } from 'next/server';
import { sql, initDbSchema } from '@/lib/db';
import { INBOX_COOKIE, verifySessionToken } from '@/lib/inboxAuth';

const KINDS = new Set(['all', 'contact', 'commitment', 'pledge', 'newsletter']);
const STATUSES = new Set(['open', 'handled', 'all']);
const MESSAGE_ID_RE = /^MSG-[0-9a-f-]{36}$/;

function unauthorized() {
  return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(INBOX_COOKIE)?.value)) return unauthorized();

  const params = request.nextUrl.searchParams;
  const kind = params.get('kind') ?? 'all';
  const status = params.get('status') ?? 'open';
  if (!KINDS.has(kind) || !STATUSES.has(status)) {
    return NextResponse.json({ success: false, error: 'Invalid filter.' }, { status: 400 });
  }

  try {
    await initDbSchema();
    const messages = (await sql`
      SELECT id, kind, name, contact, message, created_at, handled_at
      FROM kai_messages
      WHERE (${kind} = 'all' OR kind = ${kind})
        AND (${status} = 'all'
             OR (${status} = 'open' AND handled_at IS NULL)
             OR (${status} = 'handled' AND handled_at IS NOT NULL))
      ORDER BY created_at DESC
      LIMIT 500
    `) as Record<string, unknown>[];

    const counts = (await sql`
      SELECT kind,
             COUNT(*) FILTER (WHERE handled_at IS NULL)::int AS open,
             COUNT(*)::int AS total
      FROM kai_messages
      GROUP BY kind
    `) as { kind: string; open: number; total: number }[];

    return NextResponse.json({ success: true, messages, counts });
  } catch (error) {
    console.error('[inbox] failed to load messages:', error);
    return NextResponse.json({ success: false, error: 'Could not load messages. Please try again.' }, { status: 500 });
  }
}

/** Mark a message handled (or reopen it). Body: { id, handled: boolean } */
export async function PATCH(request: NextRequest) {
  if (!verifySessionToken(request.cookies.get(INBOX_COOKIE)?.value)) return unauthorized();

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!MESSAGE_ID_RE.test(id) || typeof body?.handled !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await initDbSchema();
    const rows = (await sql`
      UPDATE kai_messages
      SET handled_at = CASE WHEN ${body.handled} THEN now() ELSE NULL END
      WHERE id = ${id}
      RETURNING id, handled_at
    `) as Record<string, unknown>[];
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Message not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: rows[0] });
  } catch (error) {
    console.error('[inbox] failed to update message:', error);
    return NextResponse.json({ success: false, error: 'Could not update the message.' }, { status: 500 });
  }
}
