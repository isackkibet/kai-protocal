import { getAddress, verifyTypedData } from 'viem';
import type { Cfa, CfaMember, Prisma, PrismaClient } from '@prisma/client';
import { canonicalize, sha256Hex } from '@/lib/mrv/canonical';
import { RecordError } from '@/lib/mrv/records';
import { credentialTypedData, pkhDid, CREDENTIAL_DOMAIN, CREDENTIAL_TYPES, type CredentialMessage } from './eip712';

/**
 * Identity: DIDs and verifiable credentials (Ecosystem PRD v1.1 §4.17).
 *
 * - The CFA's DID is did:web:<site host>:cfa:<cfa id>; its document is served
 *   at /cfa/<cfa id>/did.json and lists the wallets of the CFA's active
 *   admins and verifiers as its keys.
 * - A member's DID is did:pkh:eip155:43113:<wallet> (derived, not stored).
 * - A credential is a claim (e.g. "this record was verified") signed with
 *   EIP-712 in the issuer's OWN wallet. The server never holds a signing
 *   key; it checks the signature, who signed, and that the claim still
 *   matches the record.
 */

export const VERIFIED_RECORD = 'VerifiedConservationRecord';
const ISSUE_WINDOW_MS = 15 * 60_000;

function siteHost(): string {
  const url = (process.env.NEXT_PUBLIC_SITE_URL || 'https://avax-frontend-seven.vercel.app').trim();
  // did:web encodes a port's ":" as %3A.
  return new URL(url).host.replace(':', '%3A');
}
export const cfaDid = (cfa: { id: string }) => `did:web:${siteHost()}:cfa:${cfa.id}`;

/** Wallets an issuing member is known to control. */
async function memberWallets(prisma: PrismaClient, member: Pick<CfaMember, 'id' | 'walletAddress' | 'authUserId'>): Promise<string[]> {
  const out = new Set<string>();
  if (member.walletAddress) out.add(member.walletAddress.toLowerCase());
  if (member.authUserId) {
    const user = await prisma.kaiUser.findUnique({ where: { privyUserId: member.authUserId }, select: { wallets: { select: { address: true } } } });
    for (const w of user?.wallets ?? []) if (/^0x[0-9a-fA-F]{40}$/.test(w.address)) out.add(w.address.toLowerCase());
  }
  // Wallets they already signed credentials with (proved by signature while signed in).
  for (const v of await prisma.verifiableCredential.findMany({ where: { issuedBy: member.id }, select: { signerAddress: true }, distinct: ['signerAddress'] })) {
    out.add(v.signerAddress.toLowerCase());
  }
  return [...out];
}

/** PRD §4.17 create_w3c_did for the CFA: (re)builds and stores its DID document. */
export async function cfaDidDocument(prisma: PrismaClient, cfa: Cfa) {
  const did = cfaDid(cfa);
  const signers = await prisma.cfaMember.findMany({ where: { cfaId: cfa.id, status: 'active', role: { in: ['admin', 'verifier'] } } });
  const methods: { id: string; type: string; controller: string; blockchainAccountId: string }[] = [];
  for (const m of signers) {
    for (const w of await memberWallets(prisma, m)) {
      methods.push({ id: `${did}#${w}`, type: 'EcdsaSecp256k1RecoveryMethod2020', controller: did, blockchainAccountId: `eip155:43113:${getAddress(w)}` });
    }
  }
  const document = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/suites/secp256k1recovery-2020/v2'],
    id: did,
    alsoKnownAs: [cfa.name],
    verificationMethod: methods,
    assertionMethod: methods.map((m) => m.id),
    service: [{ id: `${did}#records`, type: 'ConservationRecords', serviceEndpoint: `https://${siteHost().replace('%3A', ':')}/api/mrv/records` }],
  };
  await prisma.didDocument.upsert({
    where: { did },
    create: { did, subjectType: 'cfa', subjectId: cfa.id, document: document as Prisma.InputJsonValue },
    update: { document: document as Prisma.InputJsonValue, updatedAt: new Date() },
  });
  return { did, document };
}

/** PRD §4.17 resolve_did. */
export async function resolveDid(prisma: PrismaClient, did: string) {
  const pkh = did.match(/^did:pkh:eip155:43113:(0x[0-9a-fA-F]{40})$/);
  if (pkh) {
    const id = pkhDid(pkh[1]);
    const vm = { id: `${id}#blockchainAccountId`, type: 'EcdsaSecp256k1RecoveryMethod2020', controller: id, blockchainAccountId: `eip155:43113:${getAddress(pkh[1])}` };
    return { '@context': ['https://www.w3.org/ns/did/v1'], id, verificationMethod: [vm], assertionMethod: [vm.id] };
  }
  const web = did.match(/^did:web:[^:]+:cfa:([0-9a-f-]{36})$/i);
  if (web) {
    const cfa = await prisma.cfa.findUnique({ where: { id: web[1] } });
    if (!cfa || cfaDid(cfa) !== did) return null;
    return (await cfaDidDocument(prisma, cfa)).document;
  }
  return null;
}

/** The claim for a verified record. Only facts the database holds; nothing from the client. */
async function recordClaim(prisma: PrismaClient, cfa: Cfa, recordId: string, issuedAt: string) {
  const record = await prisma.conservationRecord.findFirst({
    where: { id: recordId, forestId: cfa.id },
    include: { reviews: { where: { decision: 'VERIFIED' }, orderBy: { createdAt: 'desc' }, take: 1 }, anchorLinks: { where: { batch: { status: 'ANCHORED' } }, include: { batch: true } } },
  });
  if (!record) throw new RecordError('Record not found', 404);
  if (record.verificationStatus !== 'VERIFIED') throw new RecordError('Only a VERIFIED record can get a credential.', 409);
  const anchor = record.anchorLinks[0]?.batch;
  const claim = {
    type: VERIFIED_RECORD,
    issuer: cfaDid(cfa),
    cfa: cfa.name,
    record: {
      id: record.id, recordType: record.recordType, schema: record.schemaVersion, version: record.currentVersion,
      sha256: record.dataHash, verifiedAt: record.reviews[0]?.createdAt.toISOString() ?? null,
    },
    anchor: anchor ? { chain: 'avalanche-fuji', txHash: anchor.txHash, merkleRoot: anchor.merkleRoot } : null,
    proofPage: `https://${siteHost().replace('%3A', ':')}/verify/${record.id}`,
    issuedAt,
  };
  const subject = `${cfaDid(cfa)}:record:${record.id}`;
  return { claim, subject, claimHash: `0x${sha256Hex(canonicalize(claim))}` as `0x${string}` };
}

/** Step 1: what the issuer's wallet must sign. */
export async function prepareRecordCredential(prisma: PrismaClient, cfa: Cfa, member: CfaMember, recordId: string) {
  if (member.status !== 'active' || !['admin', 'verifier'].includes(member.role)) throw new RecordError('Only a CFA admin or verifier can issue credentials.', 403);
  const issuedAt = new Date().toISOString();
  const { claim, subject, claimHash } = await recordClaim(prisma, cfa, recordId, issuedAt);
  const message: CredentialMessage = { issuer: claim.issuer, subject, credentialType: VERIFIED_RECORD, claimHash, issuedAt };
  return { claim, typedData: credentialTypedData(message) };
}

/** Step 2 (PRD sign_claim): check the wallet's signature and store the credential. */
export async function issueRecordCredential(
  prisma: PrismaClient, cfa: Cfa, member: CfaMember,
  input: { recordId: string; issuedAt: string; signer: string; signature: string },
) {
  if (member.status !== 'active' || !['admin', 'verifier'].includes(member.role)) throw new RecordError('Only a CFA admin or verifier can issue credentials.', 403);
  const at = Date.parse(input.issuedAt);
  if (!Number.isFinite(at) || Math.abs(Date.now() - at) > ISSUE_WINDOW_MS) throw new RecordError('This signing request expired. Start again.', 409);
  if (!/^0x[0-9a-fA-F]{40}$/.test(input.signer) || !/^0x[0-9a-fA-F]{130}$/.test(input.signature)) throw new RecordError('Invalid signer or signature.', 400);

  // Rebuilt from the database: the client cannot change what is claimed.
  const { claim, subject, claimHash } = await recordClaim(prisma, cfa, input.recordId, input.issuedAt);
  const message: CredentialMessage = { issuer: claim.issuer, subject, credentialType: VERIFIED_RECORD, claimHash, issuedAt: input.issuedAt };
  const valid = await verifyTypedData({ address: getAddress(input.signer), ...credentialTypedData(message), signature: input.signature as `0x${string}` });
  if (!valid) throw new RecordError('The signature does not match this credential and wallet.', 400);

  const existing = await prisma.verifiableCredential.findFirst({ where: { recordId: input.recordId, credentialType: VERIFIED_RECORD, status: 'active' } });
  if (existing) return existing;
  const vc = await prisma.verifiableCredential.create({
    data: {
      cfaId: cfa.id, credentialType: VERIFIED_RECORD, issuerDid: claim.issuer, subjectDid: subject, recordId: input.recordId,
      claim: claim as Prisma.InputJsonValue, claimHash, signerAddress: getAddress(input.signer), signature: input.signature, issuedBy: member.id,
    },
  });
  await cfaDidDocument(prisma, cfa); // the signer's wallet is now one of the CFA's keys
  return vc;
}

/** W3C VC data model view of a stored credential. */
export function toW3C(vc: { id: string; credentialType: string; issuerDid: string; subjectDid: string; claim: unknown; signerAddress: string; signature: string; issuedAt: Date; status: string }) {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${vc.id}`,
    type: ['VerifiableCredential', vc.credentialType],
    issuer: vc.issuerDid,
    issuanceDate: vc.issuedAt.toISOString(),
    credentialStatus: { type: 'KaiCredentialStatus', status: vc.status },
    credentialSubject: { id: vc.subjectDid, ...(vc.claim as object) },
    proof: {
      type: 'EthereumEip712Signature2021',
      created: vc.issuedAt.toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: `${vc.issuerDid}#${vc.signerAddress.toLowerCase()}`,
      proofValue: vc.signature,
      eip712: { domain: CREDENTIAL_DOMAIN, types: CREDENTIAL_TYPES, primaryType: 'Credential' },
    },
  };
}

/** PRD §4.17 verify_claim: every check, each with its result. */
export async function verifyCredential(prisma: PrismaClient, id: string) {
  const vc = await prisma.verifiableCredential.findUnique({ where: { id } });
  if (!vc) return null;
  const claim = vc.claim as Record<string, unknown>;
  const steps: { step: string; ok: boolean; detail: string }[] = [];

  const recomputed = `0x${sha256Hex(canonicalize(claim))}`;
  steps.push({ step: 'Claim unchanged', ok: recomputed === vc.claimHash, detail: `SHA-256 ${recomputed}` });

  const message: CredentialMessage = { issuer: vc.issuerDid, subject: vc.subjectDid, credentialType: vc.credentialType, claimHash: vc.claimHash as `0x${string}`, issuedAt: String(claim.issuedAt) };
  const sigOk = await verifyTypedData({ address: getAddress(vc.signerAddress), ...credentialTypedData(message), signature: vc.signature as `0x${string}` }).catch(() => false);
  steps.push({ step: 'Signature valid', ok: sigOk, detail: `signed by ${vc.signerAddress}` });

  const doc = await resolveDid(prisma, vc.issuerDid);
  const keys = ((doc as { verificationMethod?: { blockchainAccountId: string }[] } | null)?.verificationMethod ?? []).map((m) => m.blockchainAccountId.split(':').pop()!.toLowerCase());
  steps.push({ step: 'Signer is a key of the issuing CFA', ok: keys.includes(vc.signerAddress.toLowerCase()), detail: keys.includes(vc.signerAddress.toLowerCase()) ? 'listed in the CFA DID document' : 'not (or no longer) an active admin/verifier wallet of the CFA' });

  const rec = claim.record as { id?: string; sha256?: string } | undefined;
  const record = rec?.id ? await prisma.conservationRecord.findUnique({ where: { id: rec.id }, select: { dataHash: true, verificationStatus: true } }) : null;
  const recOk = !!record && record.dataHash === rec?.sha256 && record.verificationStatus === 'VERIFIED';
  steps.push({ step: 'Record still verified and unchanged', ok: recOk, detail: record ? `record is ${record.verificationStatus}${record.dataHash === rec?.sha256 ? '' : ', data changed since'}` : 'record not found' });

  steps.push({ step: 'Not revoked', ok: vc.status === 'active', detail: vc.status === 'active' ? 'active' : `revoked: ${vc.revokedReason ?? ''}` });
  return { credentialId: vc.id, valid: steps.every((s) => s.ok), steps, credential: toW3C(vc) };
}

export async function revokeCredential(prisma: PrismaClient, cfa: Cfa, member: CfaMember, id: string, reason: string) {
  if (member.status !== 'active' || member.role !== 'admin') throw new RecordError('Only a CFA admin can revoke a credential.', 403);
  if (!reason.trim()) throw new RecordError('Give a reason for revoking.', 400);
  const vc = await prisma.verifiableCredential.findFirst({ where: { id, cfaId: cfa.id } });
  if (!vc) throw new RecordError('Credential not found', 404);
  if (vc.status === 'revoked') return vc;
  return prisma.verifiableCredential.update({ where: { id }, data: { status: 'revoked', revokedReason: reason.trim().slice(0, 500), revokedAt: new Date() } });
}
