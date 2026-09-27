'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import RecordActivityModal from '@/components/RecordActivityModal';
import LiveActivityTracker from '@/components/LiveActivityTracker';
import { 
  TreePine, 
  PlusCircle, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Download, 
  Filter, 
  ShieldCheck, 
  Sprout, 
  Layers, 
  TrendingUp, 
  Globe, 
  Lock, 
  Wallet, 
  Copy, 
  Check, 
  HeartHandshake, 
  DollarSign, 
  Gift, 
  Users, 
  Calendar, 
  Share2, 
  Sparkles,
  X 
} from 'lucide-react';
import EditRecordModal, { EditRecordType } from '@/components/EditRecordModal';
import { 
  INITIAL_CFA, 
  INITIAL_NURSERIES, 
  INITIAL_SEEDBEDS, 
  INITIAL_SPECIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_PLANTING_EVENTS, 
  INITIAL_SURVIVAL_OBSERVATIONS, 
  calculateNurseryMetrics 
} from '@/services/kaiLedger';
import { ConservationActivity, InventoryTransaction, VerificationStatus, Seedbed, Species } from '@/types/kai';

export default function KaiHubPage() {
  const [hubMode, setHubMode] = useState<'INTERNAL' | 'EXTERNAL'>('INTERNAL');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'nursery' | 'sales_donations' | 'planting' | 'verification' | 'reports'>('dashboard');
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(INITIAL_TRANSACTIONS);
  const [seedbeds, setSeedbeds] = useState<Seedbed[]>(INITIAL_SEEDBEDS);
  const [speciesList, setSpeciesList] = useState<Species[]>(INITIAL_SPECIES);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editRecordType, setEditRecordType] = useState<EditRecordType>('SEEDBED');
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const [filterType, setFilterType] = useState<string>('ALL');
  const [copiedPaybill, setCopiedPaybill] = useState(false);
  const [pledgeSubmitted, setPledgeSubmitted] = useState(false);

  // Sync with Neon DB on mount
  useEffect(() => {
    fetch('/api/activities')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dbTxns: InventoryTransaction[] = json.data.map((act: any) => ({
            id: act.id,
            transactionType: act.event_type,
            nurseryId: act.nursery_id,
            seedbedId: act.seedbed_id,
            speciesId: act.species_id,
            quantity: Number(act.quantity),
            direction: (act.event_type === 'SALE' || act.event_type === 'DONATION' || act.event_type === 'PLANTING' || act.event_type === 'MORTALITY') ? 'OUT' : 'IN',
            date: act.activity_date ? act.activity_date.split('T')[0] : act.created_at.split('T')[0],
            source: `NEON_DB_${act.event_type}`,
            recordedBy: act.recorded_by,
            notes: act.notes,
            verificationStatus: act.verification_status || 'SUBMITTED',
            createdAt: act.created_at
          }));
          setTransactions(dbTxns);
        }
      })
      .catch(err => console.log('Neon DB sync note:', err));
  }, []);

  const metrics = calculateNurseryMetrics(transactions);

  const handleAddActivity = (activity: ConservationActivity) => {
    const newTxn: InventoryTransaction = {
      id: `TXN-${Date.now().toString().slice(-5)}`,
      transactionType: activity.eventType as any,
      nurseryId: activity.nurseryId,
      seedbedId: activity.seedbedId,
      speciesId: activity.speciesId,
      quantity: activity.quantity,
      direction: (activity.eventType === 'SALE' || activity.eventType === 'DONATION' || activity.eventType === 'PLANTING' || activity.eventType === 'MORTALITY') ? 'OUT' : 'IN',
      date: activity.date,
      source: `ACTIVITY_${activity.eventType}`,
      recordedBy: activity.recordedBy,
      notes: activity.notes,
      verificationStatus: activity.verificationStatus,
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTxn, ...prev]);
  };

  const handleVerifyTransaction = (id: string, status: VerificationStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, verificationStatus: status } : t));
  };

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Species ID', 'Seedbed ID', 'Quantity', 'Direction', 'Date', 'Recorded By', 'Verification Status'];
    const rows = transactions.map(t => [t.id, t.transactionType, t.speciesId, t.seedbedId, t.quantity, t.direction, t.date, t.recordedBy, t.verificationStatus]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kai_Oloolua_Nursery_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyEquityDetails = () => {
    navigator.clipboard.writeText("Equity Bank M-Pesa Paybill: 247247, Account: 813367");
    setCopiedPaybill(true);
    setTimeout(() => setCopiedPaybill(false), 2000);
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'ALL') return true;
    return t.transactionType === filterType;
  });

  const salesTransactions = transactions.filter(t => t.transactionType === 'SALE');
  const donationTransactions = transactions.filter(t => t.transactionType === 'DONATION');

  return (
    <div className="min-h-screen bg-[#0b1c14] text-[#f6f2e7] flex flex-col">
      <Navigation onOpenRecordActivity={() => setIsActivityModalOpen(true)} />

      {/* Header Banner & Hub Mode Selector */}
      <div className="bg-[#122b1f] border-b border-[#e4c878]/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded bg-emerald-950 border border-emerald-800 text-xs font-semibold text-[#e4c878]">
                Kai CFA Information Hub — MVP v1
              </span>
              <span className="text-xs text-emerald-300/80 font-mono">Reg: {INITIAL_CFA.registrationNumber}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
              {INITIAL_CFA.name} Hub
            </h1>
            <p className="text-xs text-gray-300">
              Oloolua Forest Reserve · Nursery Station · Powered by Neon PostgreSQL
            </p>
          </div>

          {/* INTERNAL vs EXTERNAL HUB MODE SWITCHER */}
          <div className="flex items-center gap-2 bg-[#0b1c14] p-1.5 rounded-2xl border border-[#e4c878]/30 shadow-inner">
            <button
              onClick={() => setHubMode('INTERNAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hubMode === 'INTERNAL'
                  ? 'bg-emerald-600 text-white shadow-lg border border-[#e4c878]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock className="w-4 h-4 text-[#e4c878]" />
              <span>Internal CFA Hub</span>
            </button>

            <button
              onClick={() => setHubMode('EXTERNAL')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                hubMode === 'EXTERNAL'
                  ? 'bg-emerald-600 text-white shadow-lg border border-[#e4c878]/40'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 text-emerald-300" />
              <span>External Public Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: INTERNAL CFA INFORMATION HUB */}
      {hubMode === 'INTERNAL' && (
        <>
          {/* Sub Navigation Bar for Internal Hub */}
          <div className="bg-[#07130d] border-b border-white/10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex space-x-2 sm:space-x-4 overflow-x-auto py-3 text-xs">
              {[
                { id: 'dashboard', label: 'Overview Dashboard', icon: BarChart3 },
                { id: 'ledger', label: 'Inventory Engine Ledger', icon: Layers },
                { id: 'sales_donations', label: 'Sales & Donations', icon: DollarSign },
                { id: 'nursery', label: 'Seedbeds & Species', icon: Sprout },
                { id: 'planting', label: 'Planting & Survival', icon: TrendingUp },
                { id: 'verification', label: 'Verification Queue', icon: Clock },
                { id: 'reports', label: 'Impact & Reports', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-emerald-600 text-white border border-[#e4c878]/50 shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#e4c878]" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
            
            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                {/* Live Neon DB Activity Tracker */}
                <LiveActivityTracker />

                {/* Metrics Table */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="p-4 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-1">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Current Stock</div>
                    <div className="text-2xl font-black text-white">{metrics.currentStock.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-400">Event-based dynamic calculation</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-1">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Species Catalogue</div>
                    <div className="text-2xl font-black text-[#e4c878]">{metrics.speciesCount}</div>
                    <div className="text-[10px] text-gray-400">Indigenous & Agroforestry</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-1">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Active Seedbeds</div>
                    <div className="text-2xl font-black text-white">{metrics.activeSeedbeds}</div>
                    <div className="text-[10px] text-emerald-400">Oloolua Nursery Station</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-1">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Propagated Total</div>
                    <div className="text-2xl font-black text-emerald-400">{metrics.propagatedTotal.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-400">Cumulatively Sown</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#122b1f] border border-[#e4c878]/30 space-y-1">
                    <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Survival Rate</div>
                    <div className="text-2xl font-black text-[#e4c878]">{metrics.survivalRatePercent}%</div>
                    <div className="text-[10px] text-emerald-400">Verified Observations</div>
                  </div>
                </div>

                {/* Quick Action Panel (PRD Section 14) */}
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Operational Action Panel</h3>
                    <p className="text-xs text-gray-400">Quick shortcuts to CFA seedling ledgers, verification queues, and data export.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <button onClick={() => setActiveTab('ledger')} className="p-3.5 rounded-xl bg-[#0b1c14] border border-white/10 hover:border-emerald-500 text-left transition-all">
                      <div className="font-bold text-white text-xs">View Inventory Ledger</div>
                      <div className="text-[10px] text-gray-400 mt-1">Audit all IN/OUT seedling events</div>
                    </button>
                    <button onClick={() => setActiveTab('sales_donations')} className="p-3.5 rounded-xl bg-[#0b1c14] border border-white/10 hover:border-emerald-500 text-left transition-all">
                      <div className="font-bold text-white text-xs">Sales & Donations</div>
                      <div className="text-[10px] text-gray-400 mt-1">Track seedling movements & buyers</div>
                    </button>
                    <button onClick={() => setActiveTab('verification')} className="p-3.5 rounded-xl bg-[#0b1c14] border border-white/10 hover:border-emerald-500 text-left transition-all">
                      <div className="font-bold text-white text-xs">Verification Queue</div>
                      <div className="text-[10px] text-gray-400 mt-1">Review pending guardian logs</div>
                    </button>
                    <button onClick={exportCSV} className="p-3.5 rounded-xl bg-[#0b1c14] border border-white/10 hover:border-emerald-500 text-left transition-all">
                      <div className="font-bold text-[#e4c878] text-xs">Export CSV Ledger</div>
                      <div className="text-[10px] text-gray-400 mt-1">Download raw Neon DB dataset</div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity Table */}
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Recent Ledger Transactions</h3>
                    <button onClick={() => setActiveTab('ledger')} className="text-xs text-[#e4c878] hover:underline font-semibold">
                      Full Ledger →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Transaction ID</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Species</th>
                          <th className="py-2.5 px-3">Quantity</th>
                          <th className="py-2.5 px-3">Direction</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-200">
                        {transactions.slice(0, 5).map((t) => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3 px-3 font-mono text-emerald-300">{t.id}</td>
                            <td className="py-3 px-3 font-semibold">{t.transactionType}</td>
                            <td className="py-3 px-3">{INITIAL_SPECIES.find(s => s.id === t.speciesId)?.commonName || t.speciesId}</td>
                            <td className="py-3 px-3 font-bold text-white">{t.quantity.toLocaleString()}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'IN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                                {t.direction}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-[#e4c878]">
                                {t.verificationStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY LEDGER */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#122b1f] p-4 rounded-xl border border-[#e4c878]/20">
                  <div>
                    <h3 className="text-lg font-bold text-white">Event-Based Inventory Ledger</h3>
                    <p className="text-xs text-gray-300">
                      Current Stock is dynamically calculated from immutable events. Hand-typed overwrites are blocked per Kai PRD Section 8.1.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Filter className="w-4 h-4 text-[#e4c878]" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-[#0b1c14] border border-[#e4c878]/30 rounded-lg p-2 text-white text-xs focus:outline-none"
                    >
                      <option value="ALL">All Event Types</option>
                      <option value="PROPAGATION">Propagation</option>
                      <option value="OPENING_STOCK">Opening Stock</option>
                      <option value="PLANTING">Planting</option>
                      <option value="SALE">Sale</option>
                      <option value="DONATION">Donation</option>
                      <option value="MORTALITY">Mortality</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase text-[10px]">
                        <th className="py-3 px-3">Txn ID</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Seedbed</th>
                        <th className="py-3 px-3">Species</th>
                        <th className="py-3 px-3">Quantity</th>
                        <th className="py-3 px-3">Direction</th>
                        <th className="py-3 px-3">Recorded By</th>
                        <th className="py-3 px-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-3 font-mono text-emerald-300">{t.id}</td>
                          <td className="py-3.5 px-3 text-gray-300">{t.date}</td>
                          <td className="py-3.5 px-3 font-semibold">{t.transactionType}</td>
                          <td className="py-3.5 px-3">{t.seedbedId}</td>
                          <td className="py-3.5 px-3">{INITIAL_SPECIES.find(s => s.id === t.speciesId)?.commonName || t.speciesId}</td>
                          <td className="py-3.5 px-3 font-bold text-white">{t.quantity.toLocaleString()}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'IN' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                              {t.direction}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-gray-300">{t.recordedBy}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-900/60 text-[#e4c878]">
                              {t.verificationStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: SALES & DONATIONS (PRD Section 10) */}
            {activeTab === 'sales_donations' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Seedling Sales & Commercial Movements</h3>
                    <p className="text-xs text-gray-300">
                      Every seedling sale creates an auditable transaction recording buyer, species, quantity, and destination per PRD Section 10.1.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 font-semibold uppercase text-[10px]">
                          <th className="py-3 px-3">Txn ID</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Buyer / Recipient</th>
                          <th className="py-3 px-3">Species</th>
                          <th className="py-3 px-3">Quantity</th>
                          <th className="py-3 px-3">Recorded By</th>
                          <th className="py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-200">
                        {salesTransactions.length > 0 ? (
                          salesTransactions.map((t) => (
                            <tr key={t.id} className="hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-3 font-mono text-emerald-300">{t.id}</td>
                              <td className="py-3.5 px-3 text-gray-300">{t.date}</td>
                              <td className="py-3.5 px-3 font-semibold text-white">{t.destination || 'Commercial Buyer'}</td>
                              <td className="py-3.5 px-3">{INITIAL_SPECIES.find(s => s.id === t.speciesId)?.commonName || t.speciesId}</td>
                              <td className="py-3.5 px-3 font-bold text-[#e4c878]">{t.quantity.toLocaleString()}</td>
                              <td className="py-3.5 px-3 text-gray-300">{t.recordedBy}</td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                  {t.verificationStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-gray-400">
                              No sales transactions recorded yet. Use <strong className="text-[#e4c878]">+ Record Activity</strong> to log seedling sales.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SEEDBEDS & SPECIES */}
            {activeTab === 'nursery' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Active Nursery Seedbeds</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {seedbeds.map((bed) => (
                      <div key={bed.id} className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3 relative group">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-[#e4c878]">{bed.nameNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-emerald-300">
                            {bed.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-300">Method: <span className="text-white font-medium">{bed.propagationMethod}</span></div>
                        <div className="text-xs text-gray-300">Manager: <span className="text-white font-medium">{bed.assignedManager}</span></div>
                        <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                          <span className="text-gray-400">Capacity: <span className="font-bold text-white">{bed.capacity.toLocaleString()}</span></span>
                          <button
                            onClick={() => { setEditingRecord(bed); setEditRecordType('SEEDBED'); setIsEditModalOpen(true); }}
                            className="px-2 py-1 rounded bg-[#e4c878]/20 hover:bg-[#e4c878]/40 text-[#e4c878] font-bold text-[10px] transition-colors"
                          >
                            Edit ✏️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white">Curated Species Catalogue</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {speciesList.map((sp) => (
                      <div key={sp.id} className="p-4 rounded-xl bg-[#122b1f] border border-[#e4c878]/20 space-y-2 relative group">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-white">{sp.commonName}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-emerald-400">{sp.category}</span>
                            <button
                              onClick={() => { setEditingRecord(sp); setEditRecordType('SPECIES'); setIsEditModalOpen(true); }}
                              className="px-2 py-0.5 rounded bg-[#e4c878]/20 hover:bg-[#e4c878]/40 text-[#e4c878] font-bold text-[10px]"
                            >
                              Edit ✏️
                            </button>
                          </div>
                        </div>
                        <div className="text-xs italic text-gray-400">{sp.scientificName}</div>
                        <div className="text-xs text-emerald-300">Local Name: {sp.localName}</div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{sp.growthNotes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: PLANTING & SURVIVAL */}
            {activeTab === 'planting' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
                  <h3 className="text-xl font-bold text-white">Planting Events & Survival Observations</h3>
                  <p className="text-xs text-gray-300">
                    Planting is tracked as a distinct conservation event linked to nursery inventory. Multiple follow-up observations capture real survival rate trends.
                  </p>

                  {INITIAL_PLANTING_EVENTS.map((event) => (
                    <div key={event.id} className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <h4 className="text-base font-bold text-white">{event.plantingSite}</h4>
                          <p className="text-xs text-emerald-300">Date: {event.date} · Authority: {event.landownerAuthority}</p>
                        </div>
                        <span className="px-3 py-1 rounded text-xs font-bold bg-emerald-900 text-[#e4c878]">
                          {event.verificationStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#0b1c14] p-3 rounded-lg">
                        <div>
                          <span className="text-gray-400 block">Quantity Planted:</span>
                          <span className="font-bold text-white text-base">{event.quantityPlanted} seedlings</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Responsible Group:</span>
                          <span className="font-medium text-white">{event.responsibleGroup}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">GPS Coordinates:</span>
                          <span className="font-mono text-emerald-300">{event.gpsCoordinates?.lat}, {event.gpsCoordinates?.lng}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Last Monitoring:</span>
                          <span className="font-medium text-white">{event.lastMonitoringDate}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <h5 className="text-xs font-bold text-[#e4c878] mb-2 uppercase tracking-wider">Follow-up Survival Monitoring Record</h5>
                        {INITIAL_SURVIVAL_OBSERVATIONS.map((obs) => (
                          <div key={obs.id} className="p-3 rounded-lg bg-[#122b1f] border border-white/10 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-white">Observer: {obs.observer} ({obs.date})</span>
                              <span className="text-emerald-400 font-bold text-sm">Survival Rate: {obs.survivalRatePercent}%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-gray-300 text-[11px]">
                              <div>Assessed: <span className="text-white font-bold">{obs.numberAssessed}</span></div>
                              <div>Surviving: <span className="text-emerald-400 font-bold">{obs.numberSurviving}</span></div>
                              <div>Losses: <span className="text-rose-300 font-bold">{obs.numberDead + obs.numberMissing}</span></div>
                            </div>
                            <p className="text-[11px] text-gray-400 italic">Notes: {obs.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: VERIFICATION QUEUE */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-white">Verifier Queue & Evidence Audit</h3>
                      <p className="text-xs text-gray-300">
                        Verifiers review submitted activities before records are locked as verified. (PRD Rule: verifiers cannot approve their own submissions).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div key={t.id} className="p-4 rounded-xl bg-[#0b1c14] border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-emerald-300 font-bold">{t.id}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900 text-[#e4c878]">
                              {t.transactionType}
                            </span>
                            <span className="text-gray-400">({t.date})</span>
                          </div>
                          <div className="text-white font-medium">
                            {t.quantity} seedlings ({t.direction}) by <span className="text-emerald-300">{t.recordedBy}</span>
                          </div>
                          {t.notes && <div className="text-gray-400 text-[11px] italic">Notes: {t.notes}</div>}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {t.verificationStatus === 'VERIFIED' ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold px-3 py-1 bg-emerald-950 rounded-lg border border-emerald-800">
                              <CheckCircle className="w-4 h-4" />
                              <span>VERIFIED</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVerifyTransaction(t.id, 'VERIFIED')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => handleVerifyTransaction(t.id, 'NEEDS_CORRECTION')}
                                className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Nursery Production & Conservation Impact Reports</h3>
                    <p className="text-xs text-gray-300">
                      All reports read directly from the Kai Inventory Engine in Neon DB. Export options for donors, Kenya Forest Service (KFS), and community stakeholders.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl bg-[#0b1c14] border border-[#e4c878]/30 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base">Nursery Production Report</h4>
                        <span className="text-xs text-[#e4c878] font-bold">CSV / JSON</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Comprehensive breakdown by species: opening stock, propagation, acquisitions, sales, donations, mortality, and closing inventory.
                      </p>
                      <button
                        onClick={exportCSV}
                        className="w-full py-2 rounded-lg bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Production Report (CSV)</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0b1c14] border border-[#e4c878]/30 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-base">Conservation Impact Report</h4>
                        <span className="text-xs text-emerald-400 font-bold">Verified Summary</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Impact stats: total seedlings produced, trees planted in Oloolua Forest, 94.7% survival rate, and 30+ active youth guardians.
                      </p>
                      <button
                        onClick={() => alert("Conservation Impact Report generated! PDF export ready.")}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Generate Impact PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mode 2: EXTERNAL PUBLIC INFORMATION HUB */}
      {hubMode === 'EXTERNAL' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 w-full flex-1">
          
          {/* Public Hero & Impact Spotlight */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#122b1f] to-emerald-950 border border-[#e4c878]/30 space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/80 border border-emerald-700 text-xs font-semibold text-[#e4c878]">
              <Sparkles className="w-4 h-4" />
              <span>Public Conservation Impact Hub</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                  Protecting Oloolua Forest Reserve
                </h2>
                <p className="text-sm text-gray-200 leading-relaxed">
                  Explore verified environmental impact, public events, species catalogue, and community investment opportunities powered by Oloolua Youth Guardians CFA.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="#donate"
                    className="px-5 py-3 rounded-xl font-bold text-xs bg-[#e4c878] hover:bg-amber-300 text-neutral-950 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Invest via M-Pesa</span>
                  </a>
                  <Link
                    href="/seedlings"
                    className="px-5 py-3 rounded-xl font-bold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                  >
                    Explore Species Catalogue →
                  </Link>
                </div>
              </div>

              {/* Verified Public Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0b1c14] border border-[#e4c878]/20 text-center">
                  <div className="text-3xl font-black text-white">{metrics.currentStock.toLocaleString()}</div>
                  <div className="text-xs text-emerald-400 mt-1 font-semibold">Seedlings Ready</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1c14] border border-[#e4c878]/20 text-center">
                  <div className="text-3xl font-black text-[#e4c878]">600+</div>
                  <div className="text-xs text-gray-300 mt-1 font-semibold">Hectares Protected</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1c14] border border-[#e4c878]/20 text-center">
                  <div className="text-3xl font-black text-white">94.7%</div>
                  <div className="text-xs text-emerald-400 mt-1 font-semibold">Survival Rate</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b1c14] border border-[#e4c878]/20 text-center">
                  <div className="text-3xl font-black text-[#e4c878]">30+</div>
                  <div className="text-xs text-gray-300 mt-1 font-semibold">Youth Guardians</div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Events & Community Reforestation Days */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#e4c878]/20 pb-4">
              <div>
                <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Public Calendar</span>
                <h3 className="text-2xl font-bold text-white mt-1">Upcoming Events & Workshops</h3>
              </div>
              <Link href="/events" className="text-xs font-bold text-emerald-300 hover:underline">
                View Calendar →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  OCTOBER 15, 2026
                </span>
                <h4 className="font-bold text-white text-base">Jaza Miti Riparian Planting Day</h4>
                <p className="text-xs text-gray-400">
                  Join 100+ community volunteers planting 500 Croton & Markhamia seedlings along Oloolua stream.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                  NOVEMBER 02, 2026
                </span>
                <h4 className="font-bold text-white text-base">Art in Nature Rock Mural Festival</h4>
                <p className="text-xs text-gray-400">
                  Live environmental mural painting on granite rocks with local youth artists and wildlife experts.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#122b1f] border border-[#e4c878]/20 space-y-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DECEMBER 10, 2026
                </span>
                <h4 className="font-bold text-white text-base">Apiculture & Honey Harvest Workshop</h4>
                <p className="text-xs text-gray-400">
                  Practical training on Kenya Top Bar hives, organic honey processing, and buffer zone protection.
                </p>
              </div>
            </div>
          </div>

          {/* Equity Bank M-Pesa Invest & Pledge Section (from original HTML) */}
          <div className="p-8 rounded-3xl bg-[#122b1f] border border-[#e4c878]/40 space-y-8" id="donate">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-[#e4c878] font-bold text-xs uppercase tracking-widest">Support Our Mission</span>
              <h3 className="text-3xl font-extrabold text-white">💚 Invest in Oloolua Forest Reserve</h3>
              <p className="text-xs text-gray-300">
                Your contribution directly purchases potting soil, polybags, pays youth guardian stipends, and funds indigenous tree planting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Paybill Card */}
              <div className="p-6 rounded-2xl bg-[#0b1c14] border border-[#e4c878]/40 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#e4c878] text-xl font-bold">
                    🏦
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">Equity Bank Kenya</div>
                    <div className="text-xs text-emerald-300">M-Pesa Paybill Official Account</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/5">
                    <span className="text-gray-400">Paybill Number:</span>
                    <span className="font-mono text-xl font-bold text-[#e4c878]">247247</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-400">Account Number:</span>
                    <span className="font-mono text-xl font-bold text-white">813367</span>
                  </div>
                </div>

                <button
                  onClick={copyEquityDetails}
                  className="w-full py-2.5 rounded-xl bg-[#e4c878] hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {copiedPaybill ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPaybill ? 'Details Copied!' : 'Copy Paybill & Account'}</span>
                </button>

                <p className="text-[10px] text-gray-400 text-center">
                  M-Pesa → Lipa na M-Pesa → Paybill → Enter Paybill 247247 & Account 813367
                </p>
              </div>

              {/* Commitment Pledge Form */}
              <div className="p-6 rounded-2xl bg-[#0b1c14] border border-white/10 space-y-4">
                <h4 className="font-bold text-white text-base">Make a Conservation Commitment</h4>
                {pledgeSubmitted ? (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                    <h5 className="font-bold text-white text-base">Thank You for Your Support!</h5>
                    <p className="text-xs text-gray-300">Your pledge has been logged. Our CFA team will be in touch.</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); setPledgeSubmitted(true); }} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Full Name</label>
                      <input type="text" required placeholder="Your full name" className="w-full bg-[#122b1f] border border-[#e4c878]/30 rounded-lg p-2.5 text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Email or Phone Number</label>
                      <input type="text" required placeholder="contact@example.com / +254..." className="w-full bg-[#122b1f] border border-[#e4c878]/30 rounded-lg p-2.5 text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Pledge Amount or Message</label>
                      <input type="text" placeholder="e.g. KES 5,000 to sponsor 100 Croton seedlings" className="w-full bg-[#122b1f] border border-[#e4c878]/30 rounded-lg p-2.5 text-white focus:outline-none" />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg">
                      Send Commitment Pledge 🌳
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      <RecordActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        speciesList={speciesList}
        seedbedList={seedbeds}
        onAddActivity={handleAddActivity}
      />

      <EditRecordModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        recordType={editRecordType}
        initialData={editingRecord}
        onSave={(updated) => {
          if (editRecordType === 'SEEDBED') {
            setSeedbeds(prev => prev.map(s => s.id === updated.id ? { ...s, ...updated } : s));
          } else if (editRecordType === 'SPECIES') {
            setSpeciesList(prev => prev.map(sp => sp.id === updated.id ? { ...sp, ...updated } : sp));
          } else if (editRecordType === 'ADJUSTMENT') {
            const adjTxn: InventoryTransaction = {
              id: `TXN-ADJ-${Date.now().toString().slice(-4)}`,
              transactionType: 'ADJUSTMENT',
              nurseryId: 'NUR-OLO-01',
              seedbedId: 'SB-01',
              speciesId: 'SP-01',
              quantity: Math.abs(updated.quantity || 50),
              direction: (updated.quantity || 50) >= 0 ? 'IN' : 'OUT',
              date: new Date().toISOString().split('T')[0],
              source: 'REASONED_ADJUSTMENT',
              recordedBy: 'Admin Edit',
              notes: updated.notes || 'Reasoned stock audit adjustment',
              verificationStatus: 'VERIFIED',
              createdAt: new Date().toISOString()
            };
            setTransactions(prev => [adjTxn, ...prev]);
          }
        }}
      />
    </div>
  );
}
