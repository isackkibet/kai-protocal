'use client';

import React, { useState } from 'react';
import { X, Edit3, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Seedbed, Species, CFA, Nursery } from '../types/kai';

export type EditRecordType = 'SEEDBED' | 'SPECIES' | 'CFA' | 'NURSERY' | 'ADJUSTMENT';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recordType: EditRecordType;
  initialData?: any;
  onSave: (updatedRecord: any) => void;
}

export default function EditRecordModal({ isOpen, onClose, recordType, initialData, onSave }: Props) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // POST / PUT to Neon DB API endpoint
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'ADJUSTMENT',
          id: formData.id || `REC-${Date.now().toString().slice(-5)}`,
          recordedBy: 'CFA Manager (Admin Edit)',
          notes: `Updated ${recordType} record state: ${JSON.stringify(formData)}`,
          ...formData
        }),
      });

      onSave(formData);
      setSuccessMsg(`Stateful ${recordType} record updated successfully!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error saving stateful record:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#122b1f] border border-[#e4c878]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-gray-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center border-b border-[#e4c878]/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600/30 text-[#e4c878]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Update Stateful Record: {recordType}</h3>
              <p className="text-xs text-emerald-300">Kai State Management & Neon DB Persistence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <div className="font-bold text-white text-base">{successMsg}</div>
            <p className="text-xs text-gray-300">State updated and synced to Neon PostgreSQL.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            {/* SEEDBED FORM */}
            {recordType === 'SEEDBED' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Seedbed Name / Number</label>
                  <input
                    type="text"
                    required
                    value={formData.nameNumber || ''}
                    onChange={(e) => setFormData({ ...formData, nameNumber: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Seedling Capacity</label>
                    <input
                      type="number"
                      required
                      value={formData.capacity || 2500}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Assigned Manager</label>
                    <input
                      type="text"
                      required
                      value={formData.assignedManager || ''}
                      onChange={(e) => setFormData({ ...formData, assignedManager: e.target.value })}
                      className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Propagation Method</label>
                  <input
                    type="text"
                    value={formData.propagationMethod || ''}
                    onChange={(e) => setFormData({ ...formData, propagationMethod: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Operating Status</label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="FULL">FULL</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            )}

            {/* SPECIES FORM */}
            {recordType === 'SPECIES' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Common Tree Name</label>
                  <input
                    type="text"
                    required
                    value={formData.commonName || ''}
                    onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Scientific Name</label>
                    <input
                      type="text"
                      required
                      value={formData.scientificName || ''}
                      onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                      className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Local Name</label>
                    <input
                      type="text"
                      value={formData.localName || ''}
                      onChange={(e) => setFormData({ ...formData, localName: e.target.value })}
                      className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category || 'INDIGENOUS'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  >
                    <option value="INDIGENOUS">INDIGENOUS</option>
                    <option value="RESTORATION">RESTORATION</option>
                    <option value="FRUIT">FRUIT</option>
                    <option value="TIMBER">TIMBER</option>
                    <option value="AGROFORESTRY">AGROFORESTRY</option>
                    <option value="EXOTIC">EXOTIC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Growth Notes</label>
                  <textarea
                    rows={2}
                    value={formData.growthNotes || ''}
                    onChange={(e) => setFormData({ ...formData, growthNotes: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            )}

            {/* INVENTORY ADJUSTMENT FORM */}
            {recordType === 'ADJUSTMENT' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#e4c878]" />
                  <span>
                    Per Kai PRD Section 8.4: Direct stock overwrites are disabled. Stock adjustments require an explicit transaction with a stated reason.
                  </span>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Adjustment Quantity (+ or -)</label>
                  <input
                    type="number"
                    required
                    value={formData.quantity || 50}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Reason for Adjustment</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="e.g. Audit recount after rainstorm, seedbed density reconciliation."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-gray-200 font-medium"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold transition-colors shadow-lg flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? 'Saving...' : 'Save & Sync State'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
