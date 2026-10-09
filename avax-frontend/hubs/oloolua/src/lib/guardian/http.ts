import { NextResponse, type NextRequest } from 'next/server';
import { getViewer, type Viewer } from './session';

/** Resolves the signed-in member, or the response to send instead (B2). */
export async function requireMember(request: NextRequest): Promise<{ viewer: Viewer } | { response: NextResponse }> {
  let viewer: Viewer | null;
  try {
    viewer = await getViewer(request);
  } catch (err) {
    console.error('[guardian] could not resolve session:', err);
    return { response: NextResponse.json({ error: 'Guardian is temporarily unavailable.' }, { status: 503 }) };
  }
  if (!viewer) return { response: NextResponse.json({ error: 'Please sign in.' }, { status: 401 }) };
  if (!viewer.role) {
    return {
      response: NextResponse.json(
        { error: viewer.membershipStatus === 'pending' ? 'Your account is waiting for a Guardian Admin to approve it.' : 'You do not have access to this Hub.' },
        { status: 403 },
      ),
    };
  }
  return { viewer };
}

export function toolStatus(error: string): number {
  return { forbidden: 403, not_found: 404, invalid: 400, conflict: 409, unavailable: 503 }[error] ?? 400;
}
