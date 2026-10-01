import { decodeAbiParameters, getAddress, type Address, type Hex } from 'viem';
import type { PrismaClient } from '@prisma/client';
import { DEPLOYER } from '@/lib/blockchain/addresses';
import artifact from '@/lib/blockchain/kaiVaultArtifact.json';
import { RecordError } from '@/lib/mrv/records';
import { client, TOKEN_LIST } from './chain';

/**
 * create_vault (Ecosystem PRD v1.1 §4.15, Phase 2): a DeFi admin deploys a
 * new KaiVault FROM THEIR OWN WALLET (the server holds no key), then sends
 * the deploy transaction hash here. The server reads that transaction on
 * Fuji and only registers it when:
 *   - its data is exactly the compiled KaiVault creation code + settings,
 *   - it succeeded and created a contract,
 *   - the sender (who becomes the vault owner) is a DeFi admin wallet,
 *   - the vault's token is a KAI token.
 * DeFi admins: DEFI_ADMIN_WALLETS (comma-separated), else the deployer.
 */

export const VAULT_ABI_FULL = artifact.abi;
export const VAULT_BYTECODE = artifact.bytecode as Hex;
const CONSTRUCTOR = (artifact.abi as { type: string; inputs?: { name: string; type: string }[] }[]).find((a) => a.type === 'constructor')!.inputs!;

export function defiAdminWallets(): string[] {
  const list = (process.env.DEFI_ADMIN_WALLETS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter((s) => /^0x[0-9a-f]{40}$/.test(s));
  return list.length ? list : DEPLOYER ? [DEPLOYER.toLowerCase()] : [];
}

/** Pure check of creation data: the KaiVault bytecode followed by ABI-encoded settings. */
export function decodeVaultCreation(input: Hex) {
  const code = VAULT_BYTECODE.toLowerCase();
  const data = input.toLowerCase();
  if (!data.startsWith(code)) return null;
  const args = `0x${data.slice(code.length)}` as Hex;
  try {
    const [asset, name, symbol, apyBps] = decodeAbiParameters(CONSTRUCTOR, args) as [Address, string, string, bigint];
    return { asset: getAddress(asset), name, symbol, apyBps: Number(apyBps) };
  } catch {
    return null;
  }
}

export async function registerVault(prisma: PrismaClient, txHash: string, strategy = 'single-asset') {
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new RecordError('That is not a transaction hash.', 400);
  const hash = txHash.toLowerCase() as Hex;
  const known = await prisma.defiVault.findUnique({ where: { deployTx: hash } });
  if (known) return known;

  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash }).catch(() => null),
    client.getTransactionReceipt({ hash }).catch(() => null),
  ]);
  if (!tx || !receipt) throw new RecordError('Transaction not found or not confirmed yet. Wait a few seconds and try again.', 202);
  if (receipt.status !== 'success' || !receipt.contractAddress) throw new RecordError('That transaction did not create a contract.', 400);
  if (tx.to) throw new RecordError('That is not a contract deployment.', 400);
  if (!defiAdminWallets().includes(tx.from.toLowerCase())) throw new RecordError('Only a DeFi admin wallet can create vaults.', 403);
  const settings = decodeVaultCreation(tx.input);
  if (!settings) throw new RecordError('The deployed contract is not the KAI vault contract.', 400);
  const token = TOKEN_LIST.find((t) => t.address === settings.asset);
  if (!token) throw new RecordError('The vault token must be a KAI token.', 400);
  if (settings.apyBps > 10_000) throw new RecordError('APY above 100% is not allowed.', 400);

  return prisma.defiVault.create({
    data: {
      address: getAddress(receipt.contractAddress), name: settings.name.slice(0, 100), shareSymbol: settings.symbol.slice(0, 20),
      asset: settings.asset, assetSymbol: token.symbol, strategy, feeBps: 0, owner: getAddress(tx.from), deployTx: hash,
    },
  });
}
