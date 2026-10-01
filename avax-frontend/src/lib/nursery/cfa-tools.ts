import { canManageCatalogue, canReadAudit } from './db';
import { fail, matchByName, ok, type NurseryPlan, type ToolResult } from './agent-logic';
import { actingMember, context, isFail } from './tools';
import { MEMBER_ROLES } from './validate';

/**
 * CFA, member, nursery and species tools (Kanuvari Tools & Agents PRD §4.1-
 * §4.3). Reads go straight to the database; writes return a NurseryPlan the
 * user confirms (see lib/nursery/tools.ts for the pattern). Admin-only
 * actions are refused here AND again by the API route.
 */

/** PRD §4.1 get_cfa */
export async function getCfa() {
  const tool = 'get_cfa';
  const c = await context(tool);
  if (isFail(c)) return c;
  const [members, nurseries, species] = await Promise.all([
    c.prisma.cfaMember.groupBy({ by: ['role'], where: { cfaId: c.cfa.id, status: 'active' }, _count: { _all: true } }),
    c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, select: { name: true }, orderBy: { name: 'asc' } }),
    c.prisma.species.count(),
  ]);
  return ok(tool, {
    name: c.cfa.name, location: c.cfa.location, description: c.cfa.description,
    activeMembersByRole: Object.fromEntries(members.map((m) => [m.role, m._count._all])),
    nurseries: nurseries.map((n) => n.name), speciesInCatalogue: species,
    hasAdmin: members.some((m) => m.role === 'admin'),
  });
}

/** PRD §4.1 list_cfa_members (admins, verifiers, auditors: the list has emails). */
export async function listCfaMembers(privyUserId: string | null) {
  const tool = 'list_cfa_members';
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (!canReadAudit(member)) return fail(tool, 'FORBIDDEN', 'Only CFA admins, verifiers and auditors can see the member list.');
  const members = await c.prisma.cfaMember.findMany({
    where: { cfaId: c.cfa.id }, orderBy: { name: 'asc' },
    select: { name: true, email: true, role: true, status: true, authUserId: true },
  });
  return ok(tool, { members: members.map(({ authUserId, ...m }) => ({ ...m, hasSignedIn: !!authUserId })) });
}

async function adminOnly(tool: string, privyUserId: string | null) {
  const c = await context(tool);
  if (isFail(c)) return c;
  const member = await actingMember(tool, c.prisma, c.cfa, privyUserId);
  if (isFail(member)) return member;
  if (!canManageCatalogue(member)) return fail(tool, 'FORBIDDEN', 'Only a CFA admin can do this.');
  return { ...c, member };
}

/** PRD §4.1 update_cfa */
export async function prepareUpdateCfa(privyUserId: string | null, input: { location?: string; description?: string }): Promise<ToolResult<NurseryPlan>> {
  const tool = 'update_cfa';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  const body: Record<string, unknown> = {};
  if (input.location?.trim()) body.location = input.location.trim().slice(0, 255);
  if (input.description?.trim()) body.description = input.description.trim().slice(0, 4000);
  if (!Object.keys(body).length) return fail(tool, 'MISSING_INFORMATION', 'What should change: the location or the description?');
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'PATCH', endpoint: '/api/cfa/profile', body,
    summary: `Update ${c.cfa.name}: ${Object.entries(body).map(([k, v]) => `${k} → "${String(v).slice(0, 80)}"`).join(', ')}.`,
    assumptions: [],
  });
}

/** PRD §4.1 add_cfa_member (by email; they link their login when they sign in). */
export async function prepareAddCfaMember(privyUserId: string | null, input: { name: string; email: string; role?: string }): Promise<ToolResult<NurseryPlan>> {
  const tool = 'add_cfa_member';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  const email = input.email?.trim().toLowerCase() ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(tool, 'INVALID_INPUT', 'That is not an email address. Ask for the member\'s email.');
  if (!input.name?.trim()) return fail(tool, 'MISSING_INFORMATION', "What is the member's name?");
  const role = input.role ?? 'member';
  if (!(MEMBER_ROLES as readonly string[]).includes(role)) return fail(tool, 'INVALID_INPUT', 'Unknown role.', [...MEMBER_ROLES]);
  const existing = await c.prisma.cfaMember.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
  if (existing) return fail(tool, 'DUPLICATE_RECORD', 'Someone with that email is already a member.');
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'POST', endpoint: '/api/cfa/members',
    body: { name: input.name.trim().slice(0, 255), email, role },
    summary: `Add ${input.name.trim()} (${email}) to ${c.cfa.name} as ${role}. They link this when they sign in with that email.`,
    assumptions: input.role ? [] : ['Role: member (not specified)'],
  });
}

/** Change a member's role or status (e.g. make someone a verifier). */
export async function prepareChangeMember(
  privyUserId: string | null, input: { member: string; role?: string; status?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'change_cfa_member';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  if (!input.role && !input.status) return fail(tool, 'MISSING_INFORMATION', 'Change the role or the status?');
  if (input.role && !(MEMBER_ROLES as readonly string[]).includes(input.role)) return fail(tool, 'INVALID_INPUT', 'Unknown role.', [...MEMBER_ROLES]);
  if (input.status && !['active', 'inactive', 'suspended'].includes(input.status)) return fail(tool, 'INVALID_INPUT', 'Unknown status.', ['active', 'inactive', 'suspended']);
  const members = await c.prisma.cfaMember.findMany({ where: { cfaId: c.cfa.id }, select: { id: true, name: true, email: true } });
  const q = input.member.trim().toLowerCase();
  const byEmail = members.find((m) => m.email.toLowerCase() === q);
  const match = byEmail ? { item: byEmail } : matchByName(input.member, members);
  if (!('item' in match)) return fail(tool, 'NOT_FOUND', `No single member matches "${input.member}". Ask which one.`, members.map((m) => `${m.name} <${m.email}>`));
  if (match.item.id === c.member.id) return fail(tool, 'FORBIDDEN', 'Admins cannot change their own role or status; another admin must.');
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'PATCH', endpoint: `/api/cfa/members/${match.item.id}`,
    body: { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}) },
    summary: `Change ${match.item.name}: ${[input.role && `role → ${input.role}`, input.status && `status → ${input.status}`].filter(Boolean).join(', ')}.`,
    assumptions: [],
  });
}

/** PRD §4.2 create_nursery */
export async function prepareCreateNursery(
  privyUserId: string | null, input: { name: string; description?: string; latitude?: number; longitude?: number },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'create_nursery';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  if (!input.name?.trim()) return fail(tool, 'MISSING_INFORMATION', 'What is the new nursery called?');
  const clash = await c.prisma.nurseryLocation.findFirst({ where: { cfaId: c.cfa.id, name: { equals: input.name.trim(), mode: 'insensitive' } } });
  if (clash) return fail(tool, 'DUPLICATE_RECORD', `A nursery called "${clash.name}" already exists.`);
  if (input.latitude != null && Math.abs(input.latitude) > 90) return fail(tool, 'INVALID_INPUT', 'Latitude must be between -90 and 90.');
  if (input.longitude != null && Math.abs(input.longitude) > 180) return fail(tool, 'INVALID_INPUT', 'Longitude must be between -180 and 180.');
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'POST', endpoint: '/api/cfa/locations',
    body: { name: input.name.trim().slice(0, 255), description: input.description?.trim() || null, latitude: input.latitude ?? null, longitude: input.longitude ?? null },
    summary: `Register a new nursery "${input.name.trim()}"${input.latitude != null ? ` at ${input.latitude}, ${input.longitude}` : ''}.`,
    assumptions: [],
  });
}

/** PRD §4.2 update_nursery */
export async function prepareUpdateNursery(
  privyUserId: string | null, input: { nursery: string; newName?: string; description?: string; latitude?: number; longitude?: number },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'update_nursery';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  const locations = await c.prisma.nurseryLocation.findMany({ where: { cfaId: c.cfa.id }, select: { id: true, name: true } });
  const m = matchByName(input.nursery, locations);
  if (!('item' in m)) return fail(tool, 'NOT_FOUND', `Which nursery? "${input.nursery}" is not one of them.`, locations.map((l) => l.name));
  const body: Record<string, unknown> = {};
  if (input.newName?.trim()) body.name = input.newName.trim().slice(0, 255);
  if (input.description?.trim()) body.description = input.description.trim().slice(0, 2000);
  if (input.latitude != null) body.latitude = input.latitude;
  if (input.longitude != null) body.longitude = input.longitude;
  if (!Object.keys(body).length) return fail(tool, 'MISSING_INFORMATION', 'What should change: the name, description or GPS?');
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'PATCH', endpoint: `/api/cfa/locations/${m.item.id}`, body,
    summary: `Update nursery "${m.item.name}": ${Object.entries(body).map(([k, v]) => `${k} → ${String(v)}`).join(', ')}.`,
    assumptions: [],
  });
}

/** PRD §4.3 create_species */
export async function prepareCreateSpecies(
  privyUserId: string | null, input: { commonName: string; scientificName: string; localName?: string },
): Promise<ToolResult<NurseryPlan>> {
  const tool = 'create_species';
  const c = await adminOnly(tool, privyUserId);
  if (isFail(c)) return c;
  if (!input.commonName?.trim() || !input.scientificName?.trim()) {
    return fail(tool, 'MISSING_INFORMATION', 'A species needs both a common name and a scientific name. Ask for the missing one; do not guess the scientific name.');
  }
  const clash = await c.prisma.species.findFirst({ where: { scientificName: { equals: input.scientificName.trim(), mode: 'insensitive' } } });
  if (clash) return fail(tool, 'DUPLICATE_RECORD', `${clash.scientificName} is already in the catalogue as ${clash.commonName}.`);
  return ok(tool, {
    kind: 'nursery', name: tool, method: 'POST', endpoint: '/api/cfa/species',
    body: { commonName: input.commonName.trim(), scientificName: input.scientificName.trim(), localName: input.localName?.trim() || null },
    summary: `Add species ${input.commonName.trim()} (${input.scientificName.trim()})${input.localName ? `, local name ${input.localName.trim()}` : ''} to the catalogue.`,
    assumptions: [],
  });
}
