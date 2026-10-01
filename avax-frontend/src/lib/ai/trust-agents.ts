/**
 * Audit & Compliance Agent (Ecosystem PRD v1.1 §5.8) and Identity /
 * Credential Agent (§5.9) — Phase 2. Read-only tools plus pointers: a
 * credential is signed in the issuer's own wallet on the record's page,
 * never in the chat.
 */
import { tool, type StructuredToolInterface } from '@langchain/core/tools';
import { z } from 'zod';
import { getPrisma } from '@/lib/db/db';
import { cfaDidDocument, resolveDid, verifyCredential } from '@/lib/identity/credentials';
import { pkhDid } from '@/lib/identity/eip712';
import { chainOfCustody, detectAnomalies, generateComplianceReport } from '@/lib/nursery/compliance';
import { fail, ok, type ToolResult } from '@/lib/nursery/agent-logic';
import { actingMember, context, isFail } from '@/lib/nursery/tools';

export const COMPLIANCE_WORDS = /\b(complian\w*|anomal\w*|integrity|tamper\w*|chain of custody|custody|esg|auditors?|suspicious|irregular\w*|score)\b/i;
export const IDENTITY_WORDS = /\b(did|dids|decentrali[sz]ed id\w*|credentials?|claims?|identity|signed|signature|verifiable|issue a (credential|certificate)|certificate)\b/i;

type Opt = <T extends z.ZodTypeAny>(schema: T) => z.ZodTypeAny;
const render = (r: ToolResult<unknown> | unknown) => JSON.stringify(r);

export function complianceTools(privyUserId: string | null, o: Opt): StructuredToolInterface[] {
  return [
    tool(async () => render(await detectAnomalies(privyUserId)), {
      name: 'detect_anomalies',
      description: 'Read-only: stale unverified records, broken fingerprints, batch counts that went up, unreconciled inventory, unusual volume, stuck anchors, reused photos.',
      schema: z.object({}),
    }),
    tool(async (f) => render(await generateComplianceReport(privyUserId, Object.fromEntries(Object.entries(f).filter(([, v]) => v != null)))), {
      name: 'generate_compliance_report',
      description: 'Read-only compliance report: totals, % verified and anchored, anomalies, data-integrity score (0-100) with its breakdown.',
      schema: z.object({ from: o(z.string()).describe('YYYY-MM-DD'), to: o(z.string()).describe('YYYY-MM-DD') }),
    }),
    tool(async ({ recordId }) => render(await chainOfCustody(privyUserId, recordId)), {
      name: 'chain_of_custody',
      description: 'Every step behind one record in time order: recorded, versions, evidence, verification, credential, anchoring, with who did each.',
      schema: z.object({ recordId: z.string() }),
    }),
  ];
}

export function identityTools(privyUserId: string | null, connectedWallet: string | null, o: Opt): StructuredToolInterface[] {
  return [
    tool(async ({ subject }) => {
      const t = 'create_w3c_did';
      if (subject === 'me') {
        if (!connectedWallet || !/^0x[0-9a-fA-F]{40}$/.test(connectedWallet)) return render(fail(t, 'UNAUTHORIZED', 'Connect a wallet first: a personal DID is derived from it (did:pkh).'));
        const did = pkhDid(connectedWallet);
        const prisma = await getPrisma();
        return render(ok(t, { did, document: prisma ? await resolveDid(prisma, did) : null, note: 'Derived from the wallet; nothing is stored and no key leaves the wallet.' }));
      }
      const c = await context(t);
      if (isFail(c)) return render(c);
      const { did, document } = await cfaDidDocument(c.prisma, c.cfa);
      const keys = (document.verificationMethod as unknown[]).length;
      return render(ok(t, { did, documentUrl: `/cfa/${c.cfa.id}/did.json`, signingKeys: keys, note: keys ? 'Keys are the wallets of active admins/verifiers.' : 'No admin/verifier wallet is known yet; one is added the first time they sign a credential.' }));
    }, {
      name: 'create_w3c_did',
      description: "Create or show a W3C DID: the CFA's did:web (keys = its admins'/verifiers' wallets) or the user's own did:pkh.",
      schema: z.object({ subject: z.enum(['cfa', 'me']) }),
    }),
    tool(async ({ did }) => {
      const prisma = await getPrisma();
      if (!prisma) return render(fail('resolve_did', 'DATABASE_ERROR', 'Database unavailable.'));
      const doc = await resolveDid(prisma, did.trim());
      return render(doc ? ok('resolve_did', { did, document: doc }) : fail('resolve_did', 'NOT_FOUND', 'Only KAI CFA did:web and Fuji did:pkh DIDs resolve here.'));
    }, {
      name: 'resolve_did',
      description: 'Look up a DID document (keys, services).',
      schema: z.object({ did: z.string() }),
    }),
    tool(async ({ recordId }) => {
      const t = 'sign_claim';
      const c = await context(t);
      if (isFail(c)) return render(c);
      const member = await actingMember(t, c.prisma, c.cfa, privyUserId);
      if (isFail(member)) return render(member);
      if (!['admin', 'verifier'].includes(member.role)) return render(fail(t, 'FORBIDDEN', 'Only a CFA admin or verifier can issue credentials.'));
      const record = await c.prisma.conservationRecord.findFirst({ where: { id: recordId.trim(), forestId: c.cfa.id }, select: { id: true, verificationStatus: true } });
      if (!record) return render(fail(t, 'NOT_FOUND', 'No record with that id.'));
      if (record.verificationStatus !== 'VERIFIED') return render(fail(t, 'VERIFICATION_REQUIRED', 'The record must be VERIFIED before a credential is issued.'));
      return render(ok(t, { page: `/verify/${record.id}`, note: 'Signing happens in the issuer\'s own wallet: open the page and press "Issue credential". The chat cannot sign.' }));
    }, {
      name: 'sign_claim',
      description: 'Issue a signed "verified conservation record" credential: checks eligibility and points to the page where the wallet signs it.',
      schema: z.object({ recordId: z.string() }),
    }),
    tool(async ({ credentialId, recordId }) => {
      const t = 'verify_claim';
      const prisma = await getPrisma();
      if (!prisma) return render(fail(t, 'DATABASE_ERROR', 'Database unavailable.'));
      let id = credentialId?.trim();
      if (!id && recordId) id = (await prisma.verifiableCredential.findFirst({ where: { recordId: recordId.trim() }, orderBy: { issuedAt: 'desc' }, select: { id: true } }))?.id;
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return render(fail(t, 'NOT_FOUND', 'No credential found. Give a credential id or a record id.'));
      const result = await verifyCredential(prisma, id);
      return render(result ? ok(t, { credentialId: result.credentialId, valid: result.valid, steps: result.steps, issuer: result.credential.issuer }) : fail(t, 'NOT_FOUND', 'No credential with that id.'));
    }, {
      name: 'verify_claim',
      description: 'Verify a credential: claim unchanged, signature valid, signer is a CFA key, record still verified, not revoked.',
      schema: z.object({ credentialId: o(z.string()), recordId: o(z.string()) }),
    }),
  ];
}

export const COMPLIANCE_PROMPT = `

AUDIT & COMPLIANCE AGENT (read-only; admins, auditors, verifiers)
- Report what the tools show. Anomalies are flags for a person to review, never accusations; say why each was flagged.
- Give the data-integrity score with its breakdown, and how to improve it.
- You never change records. Exports: Manage the CFA → Audit log.`;

export const IDENTITY_PROMPT = `

IDENTITY / CREDENTIAL AGENT
- A CFA has a did:web DID whose keys are its admins'/verifiers' wallets; a person has a did:pkh from their wallet.
- Credentials are signed in the issuer's OWN wallet on the record's /verify page; the chat cannot sign. Never ask for keys or seed phrases.
- When verifying, report each check (claim unchanged, signature, signer authorised, record still verified, not revoked).`;
