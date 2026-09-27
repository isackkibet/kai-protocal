"use client";

import React, { useState, useEffect } from 'react';

import NewsHeader from '../../components/portal/NewsHeader';
import VerificationHUD from '../../components/portal/verify/VerificationHUD';
import TaskGallery from '../../components/portal/verify/TaskGallery';
import AnnotationTool from '../../components/portal/verify/AnnotationTool';
import { VerifyTask } from '../../constants/verifyData';

// Simulated Gamification State
const INITIAL_STATE = {
  xp: 340,
  level: 3,
  streak: 5,
  combo: 1,
  creditsToday: 0,
  verifiedToday: 0,
};

const XP_LEVELS = [0, 100, 250, 500, 800, 1200, 1800, 2600, 3600, 5000];

export default function VerifyAndEarnPage() {
  const [gamState, setGamState] = useState(INITIAL_STATE);
  const [selectedTask, setSelectedTask] = useState<VerifyTask | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [lastVerifyTime, setLastVerifyTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleTaskComplete = (task: VerifyTask, aiScore: number) => {
    const multi = gamState.combo;
    const baseCredits = parseFloat(task.reward);
    const baseXp = task.xp || 50;
    
    let aiBonusXp = 0;
    if (aiScore >= 95) aiBonusXp = 25;
    else if (aiScore >= 85) aiBonusXp = 15;
    else if (aiScore >= 70) aiBonusXp = 5;

    const earnCredits = parseFloat((baseCredits * multi).toFixed(2));
    const earnXp = Math.round((baseXp + aiBonusXp) * multi);

    setGamState(prev => {
      const newXp = prev.xp + earnXp;
      let newLevel = prev.level;
      
      const nextLevelXp = XP_LEVELS[newLevel] || XP_LEVELS[XP_LEVELS.length - 1];
      if (newXp >= nextLevelXp && newLevel < XP_LEVELS.length - 1) {
        newLevel++;
      }

      // Combo Logic
      const now = Date.now();
      let newCombo = prev.combo;
      if (lastVerifyTime > 0 && now - lastVerifyTime < 30000) { // 30s for demo
        newCombo = Math.min(newCombo + 1, 5);
      } else {
        newCombo = 1;
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        creditsToday: prev.creditsToday + earnCredits,
        verifiedToday: prev.verifiedToday + 1,
        combo: newCombo
      };
    });

    setCompletedTaskIds(prev => [...prev, task.id]);
    setLastVerifyTime(Date.now());
    setSelectedTask(null); // Reset selection
    
    setToastMessage(`🎉 Great work! Earned ${earnCredits} Credits and ${earnXp} XP.`);
  };

  const currentLevelFloor = XP_LEVELS[gamState.level - 1] || 0;
  const nextLevelCeil = XP_LEVELS[gamState.level] || XP_LEVELS[XP_LEVELS.length - 1];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <NewsHeader />

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6 max-w-7xl">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Impact Network</div>
            <h1 className="text-3xl font-black text-slate-800">Verify & Earn</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Help SIHU maintain truth in environmental reporting. Verify field images to earn SIHU Credits and build your reputation.
            </p>
          </div>
        </div>

        {/* HUD */}
        <VerificationHUD 
          level={gamState.level}
          xp={gamState.xp}
          xpNeeded={nextLevelCeil}
          combo={gamState.combo}
          streak={gamState.streak}
          creditsToday={gamState.creditsToday}
          verifiedToday={gamState.verifiedToday}
        />

        {/* Main Content splits into Gallery (Left) and Tool (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[600px]">
          <div className="lg:w-7/12">
            <TaskGallery 
              onSelect={setSelectedTask} 
              selectedTaskId={selectedTask?.id}
              completedTaskIds={completedTaskIds}
            />
          </div>
          <div className="lg:w-5/12">
            <AnnotationTool 
              task={selectedTask}
              onComplete={handleTaskComplete}
            />
          </div>
        </div>

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 bg-slate-900 border border-white/10 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center justify-between gap-4 animate-fade-in-up z-50">
          <div className="font-semibold">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

    </div>
  );
}
