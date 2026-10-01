'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Rocket } from 'lucide-react';
import { useAccount, useDeployContract, useSwitchChain } from 'wagmi';
import { getAddress } from 'viem';
import artifact from '@/lib/blockchain/kaiVaultArtifact.json';
import { EXPLORER_BASE } from '@/lib/blockchain/addresses';

/**
 * Deploys a KaiVault from the connected wallet (create_vault, PRD §4.15),
 * then registers it with POST /api/defi/vaults, which checks on Fuji that it
 * really is the KAI vault contract, deployed by a DeFi admin wallet.
 */
interface Info { vaults: { address: string; name: string; shareSymbol: string; assetSymbol: string; createdAt: string; deployTx: string }[]; tokens: { symbol: string; address: string }[]; adminWallets: string[] }

const C = { gold: '#C89B3C', goldLight: '#E4C878', paper: '#F6F2E7', inkLight: '#9BA396', hairline: 'rgba(200,155,60,0.14)', red: '#E88C7D', green: '#7DC383', bg: '#0E2418' };
const input: React.CSSProperties = { padding: '8px 2px', border: 'none', borderBottom: `1px solid ${C.hairline}`, background: 'none', color: C.paper, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', width: '100%' };
const label: React.CSSProperties = { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: C.inkLight, fontWeight: 600 };

export default function CreateVaultForm() {
  const { address, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();
  const [info, setInfo] = useState<Info | null>(null);
  const [token, setToken] = useState('');
  const [apy, setApy] = useState('8');
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [step, setStep] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const load = () => fetch('/api/defi/vaults').then((r) => r.json()).then((d: Info) => { setInfo(d); setToken((t) => t || d.tokens[0]?.symbol || ''); }).catch(() => {});
  // Fetch-on-mount.
  useEffect(() => { load(); }, []);

  const isAdmin = !!address && !!info?.adminWallets.includes(address.toLowerCase());
  const tok = info?.tokens.find((t) => t.symbol === token);
  const shareSymbol = symbol || (token ? `kv${token}` : '');
  const vaultName = name || (token ? `KAI ${token} Vault` : '');
  const apyBps = Math.round(Number(apy) * 100);
  const invalid = !tok || !Number.isFinite(apyBps) || apyBps < 0 || apyBps > 10_000 || !vaultName.trim() || !/^[A-Za-z0-9]{2,12}$/.test(shareSymbol);

  const register = async (txHash: string) => {
    for (let i = 0; i < 20; i++) {
      setStep(`Checking the deployment on Fuji… (${i + 1})`);
      const res = await fetch('/api/defi/vaults', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ txHash }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) return d.vault;
      if (res.status !== 202) throw new Error(d.error ?? 'Could not register the vault.');
      await new Promise((r) => setTimeout(r, 3000));
    }
    throw new Error('Not confirmed yet. Refresh this page in a minute; the vault is deployed.');
  };

  const create = async () => {
    setMsg(null);
    try {
      setStep('Switching your wallet to Avalanche Fuji…');
      await switchChainAsync({ chainId: 43113 });
      setStep('Approve the deployment in your wallet…');
      const txHash = await deployContractAsync({
        abi: artifact.abi,
        bytecode: artifact.bytecode as `0x${string}`,
        args: [getAddress(tok!.address), vaultName.trim(), shareSymbol, BigInt(apyBps)],
        chainId: 43113,
      });
      const vault = await register(txHash);
      setMsg({ text: `Vault ${vault.shareSymbol} created at ${vault.address}.` });
      await load();
    } catch (e) {
      const m = e instanceof Error ? e.message : 'Failed';
      setMsg({ text: /reject|denied/i.test(m) ? 'You rejected the deployment.' : m, error: true });
    } finally {
      setStep(null);
    }
  };

  if (!info) return <p style={{ color: C.inkLight, fontSize: 13 }}>Loading…</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!isConnected && <p style={{ fontSize: 13, color: C.red, margin: 0 }}>Connect your wallet first (Wallet page).</p>}
      {isConnected && !isAdmin && (
        <p style={{ fontSize: 13, color: C.red, margin: 0 }}>
          This wallet is not a DeFi admin wallet, so the vault would be refused. Admin wallets are set in DEFI_ADMIN_WALLETS.
        </p>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>Token the vault holds</span>
        <select id="vault-token" value={token} onChange={(e) => setToken(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
          {info.tokens.map((t) => <option key={t.symbol} value={t.symbol} style={{ background: C.bg }}>{t.symbol}</option>)}
        </select>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>APY (%)</span>
        <input id="vault-apy" type="number" min={0} max={100} step="0.1" value={apy} onChange={(e) => setApy(e.target.value)} style={input} />
        <span style={{ fontSize: 11, color: C.inkLight }}>The rate shown to users. Yield is added by the owner (addYield); it is not automatic.</span>
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>Vault name</span>
        <input id="vault-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={vaultName} maxLength={60} style={input} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}><span style={label}>Share symbol</span>
        <input id="vault-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder={shareSymbol} maxLength={12} style={input} />
      </label>
      <button onClick={create} disabled={!!step || invalid || !isConnected || !isAdmin}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 999, border: 'none', background: C.gold, color: '#1B1A14', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', opacity: step || invalid || !isConnected || !isAdmin ? 0.5 : 1 }}>
        {step ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Deploy vault from my wallet
      </button>
      {step && <p style={{ fontSize: 12.5, color: C.goldLight, margin: 0 }}>{step}</p>}
      {msg && <p style={{ fontSize: 12.5, color: msg.error ? C.red : C.green, margin: 0, wordBreak: 'break-all' }}>{msg.text}</p>}

      <p style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: '16px 0 0' }}>Vaults created by admins</p>
      {info.vaults.length === 0 && <p style={{ fontSize: 12.5, color: C.inkLight, margin: 0 }}>None yet.</p>}
      {info.vaults.map((v) => (
        <div key={v.address} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12.5, padding: '6px 0', borderBottom: `1px solid ${C.hairline}` }}>
          <span style={{ flex: 1 }}>{v.name} ({v.shareSymbol}) · {v.assetSymbol}</span>
          <a href={`${EXPLORER_BASE}/address/${v.address}`} target="_blank" rel="noreferrer" style={{ color: C.goldLight }}>Contract</a>
        </div>
      ))}
      <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>The AI and portfolio tools include these vaults. <Link href="/vaults" style={{ color: C.goldLight }}>Back to vaults</Link></p>
    </div>
  );
}
