import { NextResponse, type NextRequest } from 'next/server';
import { requireMember, toolStatus } from '@/lib/guardian/http';
import { TOOLS, runTool } from '@/lib/guardian/tools';

/**
 * The Hub's own access to Guardian tools (no AI involved, no prompt used).
 * Reads use GET with JSON args in ?args=; writes use POST. Each tool checks
 * the caller's role itself.
 */
async function handle(request: NextRequest, toolName: string, args: Record<string, unknown>, method: 'GET' | 'POST') {
  const auth = await requireMember(request);
  if ('response' in auth) return auth.response;
  const tool = TOOLS[toolName];
  if (!tool) return NextResponse.json({ error: 'Unknown tool.' }, { status: 404 });
  if ((tool.kind === 'read') !== (method === 'GET')) {
    return NextResponse.json({ error: `Use ${tool.kind === 'read' ? 'GET' : 'POST'} for this tool.` }, { status: 405 });
  }
  const result = await runTool(toolName, args, { viewer: auth.viewer, channel: 'hub' });
  return result.ok
    ? NextResponse.json(result)
    : NextResponse.json(result, { status: toolStatus(result.error) });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  let args: Record<string, unknown> = {};
  const raw = request.nextUrl.searchParams.get('args');
  if (raw) {
    try { args = JSON.parse(raw); } catch { return NextResponse.json({ error: 'Invalid args.' }, { status: 400 }); }
  }
  return handle(request, tool, args, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const body = await request.json().catch(() => ({}));
  return handle(request, tool, body && typeof body === 'object' ? body : {}, 'POST');
}
