'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useBalance, useReadContracts } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import {
  Copy, RefreshCw, Send, QrCode, ArrowDownToLine,
  ChevronRight, CheckCircle2, Loader2, ImageIcon, ShieldCheck,
  ListChecks, Mountain,
} from 'lucide-react';
import { usePrivyAuth } from '@/lib/privy-auth';
import { useNFTs } from '@/hooks/useNFTs';
import { ECOSYSTEM_TOKENS, AVAX_CONFIG, formatTokenAmount } from '@/lib/tokens';
import { ERC20_ABI } from '@/lib/erc20abi';
import RealisticQR from '@/components/ui/RealisticQR';

/* Same editorial system as the home page and the connect-wallet modal —
   pine + gold + paper, flat sections separated by a hairline, no card
   shells. The wallet dashboard used to be its own dark-glass/emerald
   design that matched nothing else in the app; that mismatch was the
   actual source of "this is confusing", not any one screen on its own. */
const C = {
  bg:        '#0B1C14',
  gold:      '#C89B3C',
  goldLight: '#E4C878',
  paper:     '#F6F2E7',
  paperDim:  '#EFE9D9',
  ink:       '#1B1A14',
  inkLight:  '#9BA396',
  hairline:  'rgba(200,155,60,0.14)',
  red:       '#E88C7D',
};
const MONO: React.CSSProperties = { fontFamily: 'var(--font-plex-mono), monospace' };
const SERIF: React.CSSProperties = { fontFamily: "'Poppins', sans-serif" };
const label: React.CSSProperties = { ...MONO, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C.goldLight, fontWeight: 600, margin: 0 };
const W: React.CSSProperties = { width: '100%', maxWidth: 1200, margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' };

function shortAddr(a: string | { hash: string }) {
  const s = typeof a === 'string' ? a : a.hash;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

export default function WalletDashboard() {
  const {
    authenticated,
    address,
    name,
    signInWithGoogle,
    logout,
    syncState,
    error: authError,
    sendToken,
  } = usePrivyAuth();
  const { nfts, loading: nftsLoading, source: nftSource, reload: reloadNfts } = useNFTs();

  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [tab, setTab] = useState<'receive' | 'send'>('receive');
  const [token, setToken] = useState<Address | null>(ECOSYSTEM_TOKENS.find(t => t.symbol === 'NVR')?.address ?? ECOSYSTEM_TOKENS[0]?.address ?? null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [sendMsg, setSendMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: avaxBal, refetch: refetchAvax } = useBalance({ address: address as Address | undefined });
  const contractCalls = useMemo(
    () => (address ? ECOSYSTEM_TOKENS.filter(t => t.address).map(t => ({
      address: t.address as Address, abi: ERC20_ABI, functionName: 'balanceOf' as const, args: [address as Address],
    })) : []),
    [address],
  );
  const { data: tokenData, refetch: refetchTokens } = useReadContracts({ contracts: contractCalls });

  const tokenBals: Record<string, number> = useMemo(() => {
    const out: Record<string, number> = {};
    ECOSYSTEM_TOKENS.filter(t => t.address).forEach((t, i) => {
      const r = tokenData?.[i];
      out[t.symbol] = r?.status === 'success' && r.result !== undefined ? Number(formatUnits(r.result as bigint, t.decimals)) : 0;
    });
    ECOSYSTEM_TOKENS.filter(t => !t.address).forEach(t => { out[t.symbol] = 0; });
    return out;
  }, [tokenData]);

  const avaxAmt = avaxBal ? Number(formatUnits(avaxBal.value, avaxBal.decimals)) : 0;

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.allSettled([refetchAvax(), refetchTokens(), reloadNfts()]);
    setRefreshing(false);
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const selectedToken = ECOSYSTEM_TOKENS.find(t => t.address === token) ?? null;

  const doSend = async () => {
    if (!selectedToken || !token || !recipient || !amount) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setSendState('error'); setSendMsg('Invalid recipient address.');
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setSendState('error'); setSendMsg('Enter a valid amount.');
      return;
    }
    setSendState('sending'); setSendMsg('');
    try {
      const big = BigInt(Math.floor(value * 10 ** selectedToken.decimals));
      if (big > BigInt(Number(tokenBals[selectedToken.symbol] ?? 0) * 10 ** selectedToken.decimals)) {
        setSendState('error'); setSendMsg('Insufficient token balance.');
        return;
      }
      const tx = await sendToken({ tokenAddress: token, to: recipient as Address, amount: big });
      setSendState('success'); setSendMsg(`Transaction sent: ${shortAddr(tx)}`);
      setTimeout(() => { setSendState('idle'); setSendMsg(''); }, 6000);
    } catch (e: any) {
      // Translate raw blockchain errors into plain language (PRD 1 §13).
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('insufficient funds') || msg.includes('gas')) {
        setSendState('error'); setSendMsg('Insufficient AVAX for gas. Top up before sending.');
      } else if (msg.includes('user rejected') || msg.includes('denied')) {
        setSendState('error'); setSendMsg('Transaction was rejected.');
      } else if (msg.includes('balance')) {
        setSendState('error'); setSendMsg('Insufficient token balance.');
      } else {
        setSendState('error'); setSendMsg('Transaction failed. Please check your balance and try again.');
      }
    }
  };

  // Show sign-in screen immediately — no spinner. If Privy initialises later
  // and the user is authenticated, the dashboard will show instead.
  if (!authenticated || !address) {
    return (
      <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative', paddingBottom: 80 }}>
        <div style={{ ...W, paddingTop: 96, textAlign: 'center', maxWidth: 440 }}>
          <p style={label}>KAI Nuvari · Avalanche C-Chain</p>
          <h1 style={{ ...SERIF, fontSize: 32, fontWeight: 700, margin: '14px 0 0', letterSpacing: '-0.5px' }}>
            <span style={{ color: C.goldLight }}>Kainovari</span> Wallet
          </h1>
          <p style={{ fontSize: 14, color: C.inkLight, margin: '12px 0 28px', lineHeight: 1.6 }}>
            Sign in with Google to get your Avalanche wallet. No seed phrase, no extensions.
          </p>
          <motion.button whileTap={{ scale: 0.98 }} onClick={signInWithGoogle}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '15px 30px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: C.gold, fontSize: 14, fontWeight: 700, color: C.ink, fontFamily: 'inherit',
            }}>
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.7 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 10-2.2 13.4-5.7l-6.2-5.2C29.2 34.5 26.7 36 24 36c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
            Continue with Google
          </motion.button>
          <p style={{ fontSize: 11, color: C.inkLight, opacity: 0.7, marginTop: 18 }}>
            Powered by Privy Embedded Wallets · Non-custodial
          </p>
        </div>
      </main>
    );
  }

  const totalBalance = avaxAmt + Object.values(tokenBals).reduce((a, b) => a + b, 0);
  const assetRows = [
    { s: 'AVAX', name: 'Avalanche', amt: avaxAmt, d: true, c: AVAX_CONFIG.color },
    ...ECOSYSTEM_TOKENS.map(t => ({ s: t.symbol, name: t.name, amt: tokenBals[t.symbol] ?? 0, d: !!t.address, c: t.color })),
  ];

  const selectAssetForSend = (symbol: string) => {
    const match = ECOSYSTEM_TOKENS.find(t => t.symbol === symbol && t.address);
    if (match?.address) setToken(match.address);
    setTab('send');
  };

  return (
    <main style={{ minHeight: '100dvh', background: C.bg, color: C.paper, fontFamily: "'Poppins', 'IBM Plex Sans', var(--font-sans)", position: 'relative', paddingBottom: 80 }}>
      <style>{`
        .wallet-grid { display: flex; flex-direction: column; gap: 12px; }
        .wallet-row { transition: background-color 0.15s ease; cursor: pointer; border-radius: 8px; }
        .wallet-row:hover { background: rgba(200,155,60,0.06); }
        .wallet-link:hover .wallet-link-title { color: ${C.goldLight}; }
        .wallet-tab { background: none; border: none; cursor: pointer; font-family: inherit; padding: 10px 0; }
        @media (min-width: 1000px) {
          .wallet-grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr); align-items: start; gap: 48px; }
        }
      `}</style>
      <div style={{ ...W, paddingTop: 40 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <p style={label}>Kainovari Wallet</p>
            <h1 style={{ ...SERIF, fontSize: 28, fontWeight: 700, margin: '10px 0 0', letterSpacing: '-0.4px' }}>
              Hello, <span style={{ color: C.goldLight }}>{name?.split(' ')[0] || 'Member'}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Mountain size={13} color={C.inkLight} strokeWidth={1.8} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.paperDim }}>Fuji Testnet</span>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.goldLight }} />
              <span style={{ ...MONO, fontSize: 10, color: C.goldLight, fontWeight: 600 }}>LIVE</span>
            </div>
            <button onClick={handleRefresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, display: 'flex', alignItems: 'center' }} aria-label="Refresh">
              <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.inkLight, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              Logout
            </button>
          </div>
        </div>

        {syncState === 'linking' && <p style={{ fontSize: 12, color: C.goldLight, margin: '10px 0 0' }}>Linking your account…</p>}
        {authError && <p style={{ fontSize: 12, color: C.red, margin: '10px 0 0' }}>{authError}</p>}

        <div className="wallet-grid" style={{ marginTop: 32 }}>
          {/* ── MAIN COLUMN ── */}
          <div style={{ minWidth: 0 }}>

            {/* Balance + address + Receive/Send */}
            <section>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <p style={label}>Est. Balance</p>
                  <div style={{ ...SERIF, fontSize: 46, fontWeight: 600, letterSpacing: '-1.5px', margin: '10px 0 0' }}>{formatTokenAmount(totalBalance)}</div>
                  <p style={{ fontSize: 12, color: C.inkLight, margin: '6px 0 0' }}>Estimate is placeholder-based until a price oracle is wired up.</p>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setTab('receive')} style={{
                    padding: '11px 20px', borderRadius: 999, cursor: 'pointer',
                    border: `1px solid ${tab === 'receive' ? C.gold : C.hairline}`, background: 'none',
                    color: tab === 'receive' ? C.goldLight : C.paperDim,
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <ArrowDownToLine size={14} /> Receive
                  </button>
                  <button onClick={() => setTab('send')} style={{
                    padding: '11px 20px', borderRadius: 999, cursor: 'pointer', border: 'none',
                    background: tab === 'send' ? C.gold : 'transparent',
                    boxShadow: tab === 'send' ? 'none' : `inset 0 0 0 1px ${C.hairline}`,
                    color: tab === 'send' ? C.ink : C.paperDim,
                    fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <Send size={14} /> Send
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, paddingTop: 16, paddingBottom: 4, borderTop: `1px solid ${C.hairline}` }}>
                <code style={{ ...MONO, flex: 1, fontSize: 13, color: C.paperDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{address}</code>
                <button onClick={copyAddress} style={{
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                  color: copied ? C.goldLight : C.inkLight, fontSize: 12, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                }}>
                  {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => setShowQr(s => !s)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                  color: showQr ? C.goldLight : C.inkLight,
                }} aria-label="Show QR code">
                  <QrCode size={14} />
                </button>
              </div>

              <AnimatePresence>
                {showQr && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{
                      marginTop: 16, borderRadius: 14, padding: '14px 14px 10px', textAlign: 'center',
                      background: C.paper, width: 200,
                    }}>
                      <RealisticQR value={address} size={164} fg="#0f172a" bg="#ffffff" />
                      <p style={{ fontSize: 10, color: C.ink, margin: '8px 0 2px', fontWeight: 700, wordBreak: 'break-all' }}>{address.slice(0, 18)}…</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Assets list */}
            <section style={{ marginTop: 44, paddingTop: 32, borderTop: `1px solid ${C.hairline}` }}>
              <p style={{ ...label, marginBottom: 16 }}>Assets</p>
              {assetRows.map(b => (
                <div key={b.s} className="wallet-row" onClick={() => b.d && selectAssetForSend(b.s)} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px',
                  borderBottom: `1px solid ${C.hairline}`,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0, fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${b.c}1f`, color: b.c,
                  }}>{b.s.slice(0, 2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.paper }}>{b.s}</span>
                      {!b.d && <span style={{ ...MONO, fontSize: 9, color: C.inkLight, fontWeight: 600 }}>SOON</span>}
                    </div>
                    <p style={{ fontSize: 12, color: C.inkLight, margin: '2px 0 0' }}>{b.name}</p>
                  </div>
                  <p style={{ ...SERIF, fontSize: 16, fontWeight: 600, color: b.c, margin: 0, flexShrink: 0 }}>
                    {formatTokenAmount(b.amt)}
                  </p>
                  {b.d && <ChevronRight size={15} color={C.inkLight} style={{ flexShrink: 0 }} />}
                </div>
              ))}
            </section>

            {/* Send / Receive panel */}
            <section style={{ marginTop: 44, paddingTop: 32, borderTop: `1px solid ${C.hairline}` }}>
              <div style={{ display: 'flex', gap: 26, marginBottom: 20, borderBottom: `1px solid ${C.hairline}` }}>
                {(['receive', 'send'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className="wallet-tab" style={{
                    color: tab === t ? C.goldLight : C.inkLight,
                    borderBottom: tab === t ? `2px solid ${C.gold}` : '2px solid transparent',
                    marginBottom: -1,
                    fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    {t === 'receive' ? <ArrowDownToLine size={14} /> : <Send size={14} />}
                    {t === 'receive' ? 'Receive' : 'Send'}
                  </button>
                ))}
              </div>

              {tab === 'receive' ? (
                <div>
                  <p style={{ fontSize: 13, color: C.paperDim, margin: '0 0 18px', lineHeight: 1.6 }}>
                    Share your address to receive AVAX, ERC-20 tokens, or NFTs.
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <button onClick={copyAddress} style={{
                      padding: '13px 24px', borderRadius: 999, cursor: 'pointer', border: 'none',
                      background: C.gold, color: C.ink,
                      fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <Copy size={15} /> {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                    <button onClick={() => setShowQr(true)} style={{
                      padding: '13px 24px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${C.hairline}`,
                      background: 'none', color: C.paperDim,
                      fontSize: 13, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <QrCode size={15} /> Show QR
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 18 }}>
                    <div>
                      <label style={{ ...label, display: 'block', marginBottom: 8 }}>Asset</label>
                      <select value={token ?? ''} onChange={e => setToken(e.target.value as Address)} style={selectStyle}>
                        {ECOSYSTEM_TOKENS.filter((t): t is typeof t & { address: `0x${string}` } => !!t.address).map(t => (
                          <option key={t.symbol} value={t.address}>{t.symbol} ({formatTokenAmount(tokenBals[t.symbol] ?? 0)} bal.)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...label, display: 'block', marginBottom: 8 }}>Amount</label>
                      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.0" inputMode="decimal" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ ...label, display: 'block', marginBottom: 8 }}>Recipient</label>
                    <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x…" style={inputStyle} />
                  </div>

                  {sendMsg && (
                    <div style={{
                      paddingLeft: 14, marginBottom: 18, fontSize: 13, lineHeight: 1.5,
                      borderLeft: `2px solid ${sendState === 'success' ? C.gold : C.red}`,
                      color: sendState === 'success' ? C.goldLight : C.red,
                    }}>{sendMsg}</div>
                  )}

                  <button onClick={doSend}
                    disabled={sendState === 'sending'}
                    style={{
                      width: '100%', padding: '15px 0', borderRadius: 999, cursor: sendState === 'sending' ? 'not-allowed' : 'pointer',
                      border: 'none', color: C.ink, fontFamily: 'inherit',
                      background: sendState === 'sending' ? 'rgba(200,155,60,0.45)' : C.gold,
                      fontSize: 14, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    {sendState === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Send</>}
                  </button>
                  <p style={{ fontSize: 11, color: C.inkLight, margin: '12px 0 0', textAlign: 'center' }}>
                    Signing is handled securely by Privy. You may be asked to approve the transaction.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* NFTs */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={label}>Your NFTs</p>
                <span style={{ ...MONO, fontSize: 11, fontWeight: 600, color: C.goldLight }}>{nfts.length}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {nfts.map(n => (
                  <div key={`${n.contract}-${n.tokenId}`} style={{ borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                      background: n.image ? `center/cover no-repeat url("${n.image}")` : 'rgba(200,155,60,0.06)',
                    }}>
                      {!n.image && <ImageIcon size={24} color={C.inkLight} />}
                    </div>
                    <div style={{ padding: '8px 2px 0' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: C.paper, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</p>
                      <p style={{ fontSize: 10, color: C.inkLight, margin: '2px 0 0' }}>#{n.tokenId}</p>
                    </div>
                  </div>
                ))}
                {nfts.length === 0 && !nftsLoading && (
                  <div style={{ gridColumn: '1 / -1', padding: '10px 0', color: C.inkLight, fontSize: 12 }}>
                    {nftSource === 'none' || nftSource === 'error'
                      ? 'No NFTs detected yet on this address.'
                      : 'No NFTs in your wallet yet.'}
                  </div>
                )}
                {nftsLoading && (
                  <div style={{ gridColumn: '1 / -1', padding: '10px 0', color: C.inkLight, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Loader2 className="animate-spin" size={16} color={C.goldLight} />
                    Detecting NFTs…
                  </div>
                )}
              </div>
              {nfts.length > 0 && (
                <p style={{ fontSize: 11, color: C.inkLight, margin: '14px 0 0' }}>
                  Detected via {nftSource === 'fetchFromReservoir' ? 'Reservoir' : nftSource === 'fetchFromSimpleHash' ? 'SimpleHash' : nftSource === 'fetchFromLogs' ? 'event log scan' : 'on-chain lookup'}.
                </p>
              )}
            </section>

            {/* Quick links */}
            <section style={{ marginTop: 36, paddingTop: 28, borderTop: `1px solid ${C.hairline}` }}>
              <Link href="/kai-bar" className="wallet-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.hairline}` }}>
                <ShieldCheck size={18} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p className="wallet-link-title" style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: C.paper, transition: 'color 0.15s ease' }}>Kai Bar Rewards</p>
                  <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>Points, referrals, airdrop.</p>
                </div>
                <ChevronRight size={15} color={C.inkLight} style={{ flexShrink: 0 }} />
              </Link>
              <Link href="/waitlist" className="wallet-link" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
                <ListChecks size={18} color={C.goldLight} strokeWidth={1.7} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p className="wallet-link-title" style={{ fontSize: 14, fontWeight: 700, margin: '0 0 2px', color: C.paper, transition: 'color 0.15s ease' }}>KAI Nuvari Waitlist</p>
                  <p style={{ fontSize: 11.5, color: C.inkLight, margin: 0 }}>Account, wallet & points status.</p>
                </div>
                <ChevronRight size={15} color={C.inkLight} style={{ flexShrink: 0 }} />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

const selectStyle: React.CSSProperties = {
  background: 'none', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
  padding: '8px 2px', fontSize: 13, color: C.paper, outline: 'none', fontFamily: 'inherit',
  width: '100%', boxSizing: 'border-box', appearance: 'none',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239BA396\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center',
};
const inputStyle: React.CSSProperties = {
  background: 'none', border: 'none', borderBottom: `1px solid ${C.hairline}`, borderRadius: 0,
  padding: '8px 2px', fontSize: 13, color: C.paper,
  outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
};
