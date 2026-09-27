'use client';

import React, { useState } from 'react';
import { X, CheckCircle, Upload, Leaf, AlertCircle } from 'lucide-react';
import { ActivityType, ConservationActivity, Species, Seedbed } from '../types/kai';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  speciesList: Species[];
  seedbedList: Seedbed[];
  onAddActivity: (activity: ConservationActivity) => void;
}

export default function RecordActivityModal({ isOpen, onClose, speciesList, seedbedList, onAddActivity }: Props) {
  const [eventType, setEventType] = useState<ActivityType>('PROPAGATION');
  const [seedbedId, setSeedbedId] = useState<string>(seedbedList[0]?.id || 'SB-01');
  const [speciesId, setSpeciesId] = useState<string>(speciesList[0]?.id || 'SP-01');
  const [quantity, setQuantity] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recordedBy, setRecordedBy] = useState<string>('Austin Namuye (Guardian)');
  const [notes, setNotes] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const activityOptions: { type: ActivityType; label: string; icon: string }[] = [
    { type: 'PROPAGATION', label: 'Propagation / Potting', icon: '🌱' },
    { type: 'SOWING', label: 'Seed Sowing', icon: '🌾' },
    { type: 'PRICKING_OUT', label: 'Pricking Out', icon: '🌿' },
    { type: 'WATERING', label: 'Watering & Weeding', icon: '💧' },
    { type: 'PLANTING', label: 'Planting Out', icon: '🌳' },
    { type: 'SALE', label: 'Seedling Sale', icon: '💰' },
    { type: 'DONATION', label: 'Donation', icon: '🎁' },
    { type: 'TRANSFER', label: 'Transfer Bed/CFA', icon: '🔄' },
    { type: 'MORTALITY', label: 'Loss / Mortality', icon: '🍂' },
  ];

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    const newActivity: ConservationActivity = {
      id: `ACT-${Date.now().toString().slice(-5)}`,
      eventType,
      cfaId: 'CFA-OLO-001',
      nurseryId: 'NUR-OLO-01',
      seedbedId,
      speciesId,
      quantity: Number(quantity),
      date,
      recordedBy,
      notes: notes || `${eventType} of ${quantity} seedlings recorded in ${seedbedId}`,
      verificationStatus: status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save locally to state
    onAddActivity(newActivity);

    // Save persistently to Neon Postgres DB via API
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });
    } catch (err) {
      console.error('Neon DB API Sync Note:', err);
    }

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#122b1f] border border-[#e4c878]/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-gray-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-[#e4c878]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600/30 text-[#e4c878]">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Record Conservation Activity</h3>
              <p className="text-xs text-emerald-300">Kai Inventory & Verification Engine (PRD Step 9)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-xl font-bold text-white">Activity Recorded!</h4>
            <p className="text-xs text-gray-300">
              Transaction written to Kai Event Ledger and queued for Verifier Approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Step 1: What happened? */}
            <div>
              <label className="block text-gray-300 font-bold mb-2 uppercase text-[11px] tracking-wider">
                1. What happened? (Activity Type)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                {activityOptions.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setEventType(opt.type)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      eventType === opt.type
                        ? 'bg-emerald-600 text-white border-[#e4c878] font-bold shadow-md'
                        : 'bg-emerald-950/60 text-gray-300 border-white/10 hover:border-emerald-500/50'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    <span className="truncate leading-tight text-[11px]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 & 3: Where and Species */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">2. Target Seedbed</label>
                <select
                  value={seedbedId}
                  onChange={(e) => setSeedbedId(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                >
                  {seedbedList.map((bed) => (
                    <option key={bed.id} value={bed.id}>
                      {bed.nameNumber} (Cap: {bed.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">3. Tree Species</label>
                <select
                  value={speciesId}
                  onChange={(e) => setSpeciesId(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                >
                  {speciesList.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.commonName} ({sp.scientificName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 4 & 5: Quantity & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">4. Quantity (Seedlings/Pods)</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">5. Activity Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                />
              </div>
            </div>

            {/* Step 6: Recorded By & Notes */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">6. Recorded By (Member)</label>
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">7. Notes / Evidence Description</label>
                <textarea
                  rows={2}
                  value={notes}
                  placeholder="e.g. Sown in potting bags under shade cloth, watering complete."
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white focus:outline-none focus:border-[#e4c878]"
                />
              </div>
            </div>

            {/* Validation Notice */}
            <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/30 flex items-start gap-2 text-[11px] text-emerald-200">
              <AlertCircle className="w-4 h-4 text-[#e4c878] shrink-0 mt-0.5" />
              <span>
                Submitting creates an auditable Kai Ledger transaction. Stock will update automatically upon verification.
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-medium transition-colors"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('SUBMITTED')}
                className="px-5 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold transition-colors shadow-lg"
              >
                Submit Activity →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
