'use client';

import { useState, useEffect } from 'react';
import { useConnect, useAccount, useDisconnect, type Connector } from 'wagmi';
import { X, LogOut, RefreshCw } from 'lucide-react';

interface WalletConnectModalProps {
  onClose: () => void;
}

export default function WalletConnectModal({ onClose }: WalletConnectModalProps) {
  const { connectors, connect, status, error, reset } = useConnect();
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { disconnect } = useDisconnect();
  const [connectingId, setConnectingId] = useState<string | null>(null);

  // Close modal when successfully connected
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, onClose]);

  useEffect(() => {
    if (status !== 'pending') {
      setConnectingId(null);
    }
  }, [status]);

  const handleConnect = (connector: Connector) => {
    setConnectingId(connector.id);
    connect({ connector }, {
      onError: () => setConnectingId(null),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md" onClick={onClose}>
      <div 
        className="w-full max-w-md rounded-2xl p-6 glass-panel border border-gold-base/20 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white tracking-wide glow-text-gold shimmer-text">
            Connect AVAX Wallet
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Access KAI Nuvari Wealth Operating System
          </p>
        </div>

        {isConnected ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-3xl">
              ✓
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Wallet Connected</p>
              <p className="text-xs font-mono text-gold-base mt-1 bg-black/45 px-3 py-1.5 rounded-lg border border-white/10">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Via {activeConnector?.name}
              </p>
            </div>
            
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 text-xs font-semibold text-red-400/80 hover:text-red-400 transition-colors pt-2"
            >
              <LogOut size={14} /> Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {connectors.map((connector) => {
              const connectorKey = `${connector.id} ${connector.name}`.toLowerCase();
              const isMetaMask = connectorKey.includes('metamask');
              const isCore = connectorKey.includes('core');
              const emoji = isMetaMask ? '🦊' : isCore ? '🌀' : '🔌';
              const isConnecting = status === 'pending' && connectingId === connector.id;

              return (
                <button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  disabled={status === 'pending'}
                  className="flex items-center gap-4 p-4 rounded-xl text-left border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  style={{
                    background: isMetaMask 
                      ? 'rgba(249, 115, 22, 0.08)' 
                      : isCore 
                        ? 'rgba(59, 153, 252, 0.08)' 
                        : 'rgba(255, 255, 255, 0.04)',
                    borderColor: isMetaMask 
                      ? 'rgba(249, 115, 22, 0.25)' 
                      : isCore 
                        ? 'rgba(59, 153, 252, 0.25)' 
                        : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-black/20">
                    {emoji}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">{connector.name}</p>
                    <p className="text-[11px] text-white/50">
                      {isMetaMask ? 'EVM standard injected' : isCore ? 'Avalanche native Core' : 'Inject connection'}
                    </p>
                  </div>
                  {isConnecting ? (
                    <RefreshCw size={16} className="animate-spin text-gold-base" />
                  ) : (
                    <span className="text-white/30 text-sm">›</span>
                  )}
                </button>
              );
            })}

            {error && (
              <div className="mt-4 p-3 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/20">
                <p className="font-bold">⚠️ Connection Error</p>
                <p className="mt-1">{error.message}</p>
                <button 
                  onClick={() => reset()}
                  className="mt-2 text-gold-base underline block hover:text-white"
                >
                  Reset & Retry
                </button>
              </div>
            )}
            
            <div className="text-[10px] text-center text-white/40 mt-4 leading-relaxed">
              Ensure your wallet is set to <strong className="text-white/60">Avalanche C-Chain</strong> or <strong className="text-white/60">Fuji Testnet</strong>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
