'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { X, LogOut, RefreshCw, Wallet, Shield, Leaf } from 'lucide-react';

interface WalletConnectModalProps {
  onClose: () => void;
}

// ── Wallet display config ─────────────────────────────────────────────────────
function getWalletMeta(connector: Connector) {
  const key = `${connector.id} ${connector.name}`.toLowerCase();
  if (key.includes('metamask')) return {
    icon: <MetaMaskIcon />,
    label: 'MetaMask',
    description: 'Browser extension - most popular EVM wallet',
    color: '#F6851B',
    border: 'rgba(246,133,27,0.3)',
    bg: 'rgba(246,133,27,0.06)',
  };
  if (key.includes('core')) return {
    icon: <CoreIcon />,
    label: 'Core Wallet',
    description: 'Built by Ava Labs - native Avalanche wallet',
    color: '#3B99FC',
    border: 'rgba(59,153,252,0.3)',
    bg: 'rgba(59,153,252,0.06)',
  };
  return {
    icon: <Wallet size={24} color="#22c55e" />,
    label: connector.name,
    description: 'EVM compatible wallet',
    color: '#22c55e',
    border: 'rgba(34,197,94,0.3)',
    bg: 'rgba(34,197,94,0.06)',
  };
}

// ── KAI Wallet — informational tile (not yet live, coming soon) ──────────────
function KaiWalletTile() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      borderRadius: 14, border: '1px solid rgba(34,197,94,0.25)',
      background: 'rgba(34,197,94,0.04)', position: 'relative', overflow: 'hidden',
      cursor: 'default', opacity: 0.75,
    }}>
      {/* Coming-soon badge */}
      <div style={{
        position: 'absolute', top: 8, right: 10,
        background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 6, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#22c55e',
        letterSpacing: 1,
      }}>COMING SOON</div>

      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg,#15803d,#166534)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 16px rgba(34,197,94,0.3)',
        flexShrink: 0,
      }}>
        <KaiIcon />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 800, color: '#f0fdf4', fontSize: 14, margin: '0 0 2px' }}>KAI Wallet</p>
        <p style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)', margin: 0 }}>
          Native KAI identity · DID · x402 payments
        </p>
      </div>
    </div>
  );
}

export default function WalletConnectModal({ onClose }: WalletConnectModalProps) {
  const { connectors, connect, status, error, reset } = useConnect();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { disconnect } = useDisconnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      const t = setTimeout(onClose, 900);
      return () => clearTimeout(t);
    }
  }, [isConnected, onClose]);

  useEffect(() => {
    if (status !== 'pending') setConnectingId(null);
  }, [status]);

  const handleConnect = (connector: Connector) => {
    setConnectingId(connector.id);
    connect({ connector }, { onError: () => setConnectingId(null) });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400, borderRadius: 24, padding: 24,
          background: '#18291f', border: '1px solid rgba(34,197,94,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)', position: 'relative',
        }}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.06)', border: 'none',
          borderRadius: '50%', width: 32, height: 32, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.5)',
        }}>
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, margin: '0 auto 12px',
            background: 'linear-gradient(135deg,#15803d,#166534)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(34,197,94,0.3)',
          }}>
            <Leaf size={26} color="#86efac" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f0fdf4', margin: '0 0 4px' }}>
            Connect Wallet
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(240,253,244,0.5)', margin: 0 }}>
            Access KAI Nuvari · Avalanche C-Chain
          </p>
        </div>

        {isConnected ? (
          /* ── Connected state ── */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px', gap: 12 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>✓</div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#f0fdf4', margin: '0 0 4px' }}>Connected</p>
              <p style={{
                fontSize: 12, fontFamily: 'monospace', color: '#22c55e',
                background: 'rgba(34,197,94,0.1)', padding: '4px 12px', borderRadius: 8,
                border: '1px solid rgba(34,197,94,0.2)', margin: '0 0 4px',
              }}>
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>via {activeConnector?.name}</p>
            </div>
            <button onClick={() => disconnect()} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
              border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12, fontWeight: 600,
            }}>
              <LogOut size={14} /> Disconnect
            </button>
          </div>
        ) : (
          /* ── Connector list ── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connectors.map(connector => {
              const meta = getWalletMeta(connector);
              const connecting = status === 'pending' && connectingId === connector.id;
              return (
                <button key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={status === 'pending'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 14, textAlign: 'left',
                    border: `1px solid ${meta.border}`, background: meta.bg,
                    cursor: status === 'pending' ? 'not-allowed' : 'pointer',
                    opacity: status === 'pending' && !connecting ? 0.5 : 1,
                    transition: 'all 0.2s', width: '100%',
                  }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, background: 'rgba(0,0,0,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#f0fdf4', margin: '0 0 2px' }}>{meta.label}</p>
                    <p style={{ fontSize: 11, color: 'rgba(240,253,244,0.5)', margin: 0 }}>{meta.description}</p>
                  </div>
                  {connecting
                    ? <RefreshCw size={16} color={meta.color} style={{ animation: 'spin 1s linear infinite' }} />
                    : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</span>
                  }
                </button>
              );
            })}

            {/* KAI Wallet — coming soon */}
            <KaiWalletTile />

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#f87171',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px' }}>Connection Error</p>
                <p style={{ margin: '0 0 6px' }}>{error.message}</p>
                <button onClick={reset} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#22c55e', fontSize: 11, fontWeight: 700 }}>
                  Reset & Retry →
                </button>
              </div>
            )}

            <p style={{ fontSize: 10, textAlign: 'center', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5, marginTop: 4 }}>
              Set wallet to <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Avalanche C-Chain</strong> or <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Fuji Testnet</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SVG Icon components ───────────────────────────────────────────────────── */

function MetaMaskIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 318 318" fill="none">
      <path d="M274.1 35.5l-99.7 73.9 18.4-43.6 81.3-30.3z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M44.4 35.5l98.9 74.5-17.6-44.2L44.4 35.5z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M238.3 206.8l-26.5 40.6 56.7 15.6 16.3-55.3-46.5-.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M33.9 207.7l16.2 55.3 56.7-15.6-26.5-40.6-46.4.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M103.6 138.2l-15.8 23.9 56.3 2.5-2-60.5-38.5 34.1z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M214.9 138.2l-39-34.7-1.3 61.1 56.2-2.5-15.9-23.9z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M100.3 247.4l33.8-16.5-29.2-22.8-4.6 39.3z" fill="#E4761B" stroke="#E4761B"/>
      <path d="M184.4 230.9l33.9 16.5-4.7-39.3-29.2 22.8z" fill="#E4761B" stroke="#E4761B"/>
    </svg>
  );
}

function CoreIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" fill="#1A1A2E" stroke="#3B99FC" strokeWidth="1.5"/>
      <path d="M20 8 L30 14 L30 26 L20 32 L10 26 L10 14 Z" stroke="#3B99FC" strokeWidth="1.8" fill="none"/>
      <path d="M20 13 L26 16.5 L26 23.5 L20 27 L14 23.5 L14 16.5 Z" fill="#3B99FC" opacity="0.6"/>
      <circle cx="20" cy="20" r="3" fill="#3B99FC"/>
    </svg>
  );
}

function KaiIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <path d="M20 4 L36 12 L36 28 L20 36 L4 28 L4 12 Z" fill="#15803d" stroke="#22c55e" strokeWidth="1.5"/>
      <path d="M14 14 L20 20 L14 26" stroke="#86efac" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 14 L26 20 L22 26" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
