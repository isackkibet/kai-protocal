"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { VerifyTask } from '../../../constants/verifyData';

interface AnnotationToolProps {
  task: VerifyTask | null;
  onComplete: (task: VerifyTask, aiScore: number) => void;
}

type Step = 'annotate' | 'analyze' | 'submit';

export default function AnnotationTool({ task, onComplete }: AnnotationToolProps) {
  const [step, setStep] = useState<Step>('annotate');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiScore, setAiScore] = useState(0);
  const [boxes, setBoxes] = useState<any[]>([]);

  // Reset when task changes
  useEffect(() => {
    setStep('annotate');
    setBoxes([]);
    setAiScore(0);
    setIsSubmitting(false);
  }, [task]);

  if (!task) {
    return (
      <div className="h-full bg-slate-900 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-12 text-center group">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
        </div>
        <p className="font-black text-white text-lg tracking-tight">STANDBY MODE</p>
        <p className="text-sm text-slate-500 mt-2 max-w-xs">Awaiting task selection from the Registry. Select a priority asset to begin verification.</p>
      </div>
    );
  }

  const handleAnalyze = () => {
    setBoxes([{ x: 10, y: 10, w: 50, h: 50 }]);
    setStep('analyze');
    
    setTimeout(() => {
      const score = Math.floor(Math.random() * 20) + 78;
      setAiScore(score);
    }, 3500); // Slightly longer for "premium" feeling delay
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onComplete(task, aiScore);
    }, 1500);
  };

  return (
    <div className="h-full bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />

      {/* Header Panel */}
      <div className="relative p-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
             <span className="text-primary text-xl">✨</span>
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{task.id}</div>
            <h2 className="font-black text-white text-sm uppercase tracking-tighter">{task.label}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-xs font-black text-emerald-400">+{task.reward} CREDITS</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">EST. COMMISSION</div>
          </div>
        </div>
      </div>

      {/* Main Analysis Stage */}
      <div className="flex-1 relative overflow-hidden z-10 flex flex-col p-6">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: ANNOTATE */}
          {step === 'annotate' && (
            <motion.div 
              key="annotate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Asset Inspection Hub
                </h3>
              </div>

              <div className="relative flex-1 bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-white/5 min-h-[300px]">
                <Image src={task.img} alt="Evidence" fill className="object-contain opacity-90" />
                
                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-[9px] font-bold text-slate-300">
                    <span className="text-primary font-black">X:</span> 1,242.04
                    <span className="text-primary font-black ml-2">Y:</span> 842.12
                  </div>
                </div>

                {/* Toolbar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl scale-110">
                  <button className="p-3 rounded-xl bg-primary text-white shadow-lg shadow-primary/20"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 5h16v14H4z"></path></svg></button>
                  <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg></button>
                  <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg></button>
                  <div className="w-[1px] h-6 bg-white/10 mx-1" />
                  <button className="p-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={handleAnalyze} 
                  className="w-full py-5 bg-primary text-white font-black rounded-2xl hover:bg-white hover:text-slate-950 transition-all shadow-xl shadow-primary/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                  <span className="relative z-10 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                    Initiate AI Asset Analysis
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: AI ANALYZE */}
          {step === 'analyze' && (
            <motion.div 
              key="analyze"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col"
            >
              <div className="relative flex-1 bg-slate-950 rounded-2xl border border-white/5 overflow-hidden flex flex-col items-center justify-center">
                {aiScore === 0 ? (
                  <>
                    <Image src={task.img} alt="Analyzing" fill className="object-contain opacity-30 grayscale blur-[2px]" />
                    
                    {/* DIGITAL SCANNING LINE */}
                    <motion.div 
                      key="scanning-line"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_rgba(88,179,242,1)] z-20"
                    />

                    {/* NEURAL GRID OVERLAY */}
                    <div className="absolute inset-0 z-10 opacity-10" style={{ 
                      backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)',
                      backgroundSize: '24px 24px'
                    }} />

                    <div className="relative z-30 text-center space-y-4">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent border-b-transparent" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                           <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        </div>
                      </div>
                      <div className="text-sm font-black text-white uppercase tracking-[0.4em] animate-pulse">Running Neural Grid</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/10 px-4 py-1 rounded-full inline-block">
                        Proprietary Model: SIHU-Vision-v4
                      </div>
                    </div>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center w-full max-w-sm p-8"
                  >
                    <div className="relative inline-block mb-6">
                       <svg className="w-32 h-32 text-slate-800" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
                          <motion.circle 
                            cx="50" cy="50" r="45" 
                            fill="none" stroke="#58B3F2" 
                            strokeWidth="4" 
                            initial={{ strokeDashoffset: 283 }}
                            animate={{ strokeDashoffset: 283 - (283 * aiScore / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeDasharray="283"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-white">{aiScore}%</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">Confidence</span>
                       </div>
                    </div>

                    <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Validation Complete</h4>
                    <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                      {aiScore >= 85 ? 'The visual evidence aligns perfectly with network telemetry. This asset is cleared for verification reward claiming.' : 'Analysis suggests minor discrepancy. Submission will be prioritized for manual auditing after payout.'}
                    </p>
                    
                    <button 
                      onClick={() => setStep('submit')} 
                      className="w-full py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs"
                    >
                      Verify & Next Step →
                    </button>
                    <button 
                      onClick={() => setStep('annotate')} 
                      className="w-full py-4 text-slate-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors"
                    >
                      ← Re-examine Imagery
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SUBMIT */}
          {step === 'submit' && (
            <motion.div 
              key="submit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 flex flex-col bg-slate-950/50 rounded-2xl border border-white/5 p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
                
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <span className="w-12 h-[1px] bg-slate-800" />
                  Proof of Impact Certificate
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                    <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Asset Status</div>
                    <div className="text-emerald-400 font-black text-xs uppercase tracking-wider">High Integrity</div>
                  </div>
                  <div className="bg-slate-900 border border-white/5 p-4 rounded-xl">
                    <div className="text-[9px] font-black text-slate-600 uppercase mb-1">Verification Score</div>
                    <div className="text-white font-black text-xs">{aiScore}.00</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-2xl border border-primary/20 mb-8 shadow-inner">
                  <div className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Network Remuneration</div>
                  <div className="flex justify-between items-baseline">
                    <div className="text-4xl font-black text-white">{task.reward}<span className="text-sm font-bold text-slate-500 ml-2">SIHU CREDITS</span></div>
                    <div className="text-emerald-400 font-black text-sm">+{task.xp} XP</div>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-3 ml-1">Observational Metadata</label>
                  <textarea 
                    className="w-full bg-slate-900 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all min-h-[120px] resize-none placeholder:text-slate-700"
                    placeholder="Enter technical observations for the Basin registry..."
                  />
                </div>

                <button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className={`w-full py-5 text-white font-black rounded-2xl transition-all shadow-2xl flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-xs ${
                    isSubmitting 
                      ? 'bg-slate-800 text-slate-600 grayscale' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-600 border-t-white rounded-full animate-spin"></div>
                      Minting Impact Proof
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                      Finalize Verification
                    </>
                  )}
                </button>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
