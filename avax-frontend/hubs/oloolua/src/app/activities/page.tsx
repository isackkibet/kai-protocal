'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import RecordActivityModal from '@/components/RecordActivityModal';
import { PlusCircle, Calendar, MapPin, CheckCircle, Leaf } from 'lucide-react';
import { INITIAL_SPECIES, INITIAL_SEEDBEDS } from '@/services/kaiLedger';

export default function ActivitiesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activities = [
    { title: 'Tree Nursery Sowing & Potting', date: '2024-09-20', location: 'Oloolua Forest Station', category: 'Propagation', status: 'VERIFIED' },
    { title: 'Riverine Zone Croton Reforestation', date: '2024-08-15', location: 'Oloolua Stream Bank', category: 'Planting Out', status: 'VERIFIED' },
    { title: 'Apiculture & Hive Maintenance', date: '2024-07-28', location: 'Forest Buffer Apiary', category: 'Beekeeping', status: 'VERIFIED' },
    { title: 'Community Seedling Distribution', date: '2024-06-10', location: 'Oloolua Primary School', category: 'Donation', status: 'VERIFIED' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation onOpenRecordActivity={() => setIsModalOpen(true)} />

      <section className="bg-[#122b1f] border-b border-[#e4c878]/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Field Stewardship</span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">Conservation Activities</h1>
            <p className="text-xs sm:text-sm text-gray-300">
              Log of activities recorded by youth members and verified on Kai Hub.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl font-bold text-xs bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-colors shadow-lg flex items-center gap-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Record Activity</span>
          </button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 space-y-6 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activities.map((act, index) => (
            <div key={index} className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {act.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#e4c878]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{act.status}</span>
                </span>
              </div>

              <h3 className="text-lg font-bold text-white">{act.title}</h3>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{act.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{act.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <RecordActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        speciesList={INITIAL_SPECIES}
        seedbedList={INITIAL_SEEDBEDS}
        onAddActivity={() => {}}
      />
    </div>
  );
}
