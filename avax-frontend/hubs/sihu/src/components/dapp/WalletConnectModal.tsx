"use client";
import { useState } from "react";
import { X, Shield, KeyRound, CheckCircle2, Copy } from "lucide-react";
import { useSihuStore } from "@/store/useSihuStore";
import { generateTestnetWallet } from "@/services/hederaService";

export default function WalletConnectModal({ onClose }: { onClose: () => void }) {
  const { connectWallet, accountId, privateKey } = useSihuStore();
  const [step, setStep] = useState<"select" | "generating" | "importing" | "done">("select");
  
  // Import state
  const [importAcc, setImportAcc] = useState("");
  const [importKey, setImportKey] = useState("");

  const handleGenerateNative = async () => {
    setStep("generating");
    
    // Slight artificial delay for UX and to let SDK process
    await new Promise((r) => setTimeout(r, 1000));
    
    try {
      const keys = generateTestnetWallet();
      // Since it's a completely new key, there's no Hedera Account ID yet until it's funded.
      // We will set dummy for AccountID for now and save the keys.
      connectWallet("native", "0.0.UNREGISTERED", keys.privateKeyStr, keys.publicKeyStr);
      setStep("done");
    } catch (e) {
      console.error(e);
      setStep("select");
    }
  };

  const handleImport = () => {
    if (!importAcc || !importKey) return;
    connectWallet("native", importAcc, importKey, "");
    setStep("done");
  };

  const copyToClipboard = (txt: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(txt);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
         style={{ background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(12px)" }}
         onClick={onClose}>
      <div className="w-full max-w-[500px] glass p-6 md:rounded-3xl rounded-t-3xl border border-blue-500/30 shadow-2xl transition-all"
           style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)" }}
           onClick={(e) => e.stopPropagation()}>

        <div className="md:hidden w-12 h-1.5 rounded-full bg-white/10 mx-auto mb-6" />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">SIHU Wallet</h2>
            <p className="text-sm text-blue-400/60 font-medium">Hedera Testnet Integration</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-all bg-white/5 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {step === "select" && (
          <div className="flex flex-col gap-4">
            {/* Generate Native */}
            <button onClick={handleGenerateNative}
              className="flex items-center gap-5 p-5 rounded-2xl transition-all group hover:bg-white/5 border border-white/5 hover:border-emerald-500/50"
              style={{ background: "rgba(16, 185, 129, 0.05)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                   style={{ background: "linear-gradient(135deg, #10B981, #34D399)" }}>🚀</div>
              <div className="text-left flex-1">
                <p className="font-bold text-white text-lg">Create Native Wallet</p>
                <p className="text-sm text-emerald-400/50">Generate a new ED25519 Keypair</p>
              </div>
              <Shield className="text-emerald-500/20 group-hover:text-emerald-500 transition-colors" size={20} />
            </button>

            {/* Import Key */}
            <button onClick={() => setStep("importing")}
              className="flex items-center gap-5 p-5 rounded-2xl transition-all group hover:bg-white/5 border border-white/5 hover:border-blue-500/50"
              style={{ background: "rgba(59, 130, 246, 0.05)" }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                   style={{ background: "linear-gradient(135deg, #3B82F6, #60A5FA)" }}>🔑</div>
              <div className="text-left flex-1">
                <p className="font-bold text-white text-lg">Import Testnet Account</p>
                <p className="text-sm text-blue-400/50">Use existing Account ID & Priv Key</p>
              </div>
              <KeyRound className="text-blue-500/20 group-hover:text-blue-500 transition-colors" size={20} />
            </button>

            <div className="mt-6 text-center">
              <p className="text-[11px] text-white/30 px-6 leading-relaxed">
                Keys generated here are stored in your local session. This is for Testnet use only. Do not use for Mainnet without proper security protocols.
              </p>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col gap-5 py-2">
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-widest px-2 mb-2 block">Hedera Account ID</label>
              <input 
                type="text" 
                placeholder="0.0.xxxxxx"
                value={importAcc}
                onChange={e => setImportAcc(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-black text-white/40 uppercase tracking-widest px-2 mb-2 block">ED25519 Private Key</label>
              <input 
                type="password" 
                placeholder="302e020100300506032b6570..."
                value={importKey}
                onChange={e => setImportKey(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-blue-500/40 font-mono"
              />
            </div>
            <div className="flex gap-3 mt-4">
               <button onClick={() => setStep("select")} className="flex-[0.5] py-4 rounded-2xl font-black text-xs uppercase text-white/40 bg-white/5 hover:bg-white/10 transition-colors">
                 Back
               </button>
               <button 
                 onClick={handleImport}
                 disabled={!importAcc || !importKey}
                 className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                   importAcc && importKey ? "btn-blue shadow-blue-500/20" : "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                 }`}>
                 Connect Account
               </button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center gap-6 py-12">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
                🔐
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white mb-2">Generating Keypair</p>
              <p className="text-sm text-emerald-400/60">Using @hashgraph/sdk ED25519 cryptography</p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            
            <div className="text-center w-full">
              <p className="font-black text-white text-2xl tracking-tight mb-4">Wallet Ready!</p>
              
              <div className="bg-black/20 border border-white/5 rounded-2xl p-4 w-full text-left mb-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Account ID</p>
                <p className="text-xs text-blue-400 font-mono tracking-wider">{accountId}</p>
              </div>

              {privateKey && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 w-full text-left">
                  <div className="flex justify-between items-center mb-1">
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Private Key</p>
                     <button onClick={() => copyToClipboard(privateKey)} className="text-emerald-500/50 hover:text-emerald-400">
                       <Copy size={14} />
                     </button>
                  </div>
                  <p className="text-[10px] text-white/60 font-mono break-all leading-relaxed">
                    {privateKey}
                  </p>
                  <p className="text-[9px] text-red-400/80 font-bold uppercase mt-2 text-center">
                    ⚠️ Copy this key! It will not be shown again.
                  </p>
                </div>
              )}
            </div>

            <button onClick={onClose}
              className="btn-blue w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-2 flex items-center justify-center gap-2">
              <Shield size={16} /> Enter SIHU HUB
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
