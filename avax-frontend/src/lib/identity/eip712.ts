/**
 * The EIP-712 message a wallet signs to issue a KAI verifiable credential
 * (Ecosystem PRD v1.1 §4.17 sign_claim). Shared by the browser (to sign) and
 * the server (to verify), so both always use the same structure. The claim
 * itself is not in the message: its SHA-256 (canonical JSON) is, so any
 * change to the claim breaks the signature.
 */

export const CREDENTIAL_DOMAIN = { name: 'KAI Conservation Credential', version: '1', chainId: 43113 } as const;

export const CREDENTIAL_TYPES = {
  Credential: [
    { name: 'issuer', type: 'string' },
    { name: 'subject', type: 'string' },
    { name: 'credentialType', type: 'string' },
    { name: 'claimHash', type: 'bytes32' },
    { name: 'issuedAt', type: 'string' },
  ],
} as const;

export interface CredentialMessage {
  issuer: string;
  subject: string;
  credentialType: string;
  claimHash: `0x${string}`;
  issuedAt: string;
}

export function credentialTypedData(message: CredentialMessage) {
  return { domain: CREDENTIAL_DOMAIN, types: CREDENTIAL_TYPES, primaryType: 'Credential' as const, message };
}

/** did:pkh for a wallet on Avalanche Fuji (CAIP-10). */
export const pkhDid = (address: string) => `did:pkh:eip155:43113:${address.toLowerCase()}`;
