"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { TASK_LIST, VERIFY_GROUPS, VerifyTask } from '../../../constants/verifyData';

interface TaskGalleryProps {
  onSelect: (task: VerifyTask) => void;
  selectedTaskId?: string;
  completedTaskIds: string[];
}

export default function TaskGallery({ onSelect, selectedTaskId, completedTaskIds }: TaskGalleryProps) {
  const [activeGroup, setActiveGroup] = useState<string>('forestry');

  const filteredTasks = TASK_LIST.filter(t => t.group === activeGroup);
  const groups = Object.values(VERIFY_GROUPS);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-100 p-2 gap-2 bg-slate-50">
        {groups.map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold tracking-wide transition-all ${
              activeGroup === g.id
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isSelected = selectedTaskId === task.id;

            return (
              <button
                key={task.id}
                onClick={() => !isCompleted && onSelect(task)}
                disabled={isCompleted}
                className={`relative flex flex-col text-left rounded-xl overflow-hidden transition-all duration-300 ${
                  isCompleted 
                    ? 'opacity-50 grayscale cursor-not-allowed' 
                    : isSelected
                      ? 'ring-2 ring-primary ring-offset-2 transform scale-[0.98]'
                      : 'hover:-translate-y-1 hover:shadow-lg bg-white border border-slate-200'
                }`}
              >
                <div className="relative h-32 w-full bg-slate-200 shrink-0">
                  <Image 
                    src={task.img} 
                    alt={task.label} 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    +{task.xp} XP
                  </div>
                  {isCompleted && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-emerald-500 text-white rounded-full p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 bg-white flex-1 flex flex-col">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">{task.categoryName}</div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight flex-1 mb-2">{task.label}</h3>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-slate-500 font-medium">📍 {task.dist} km</span>
                    <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">+{task.reward} Credits</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>No tasks available in this category right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
