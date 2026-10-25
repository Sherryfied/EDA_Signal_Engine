import React, { useState } from 'react';
import { Account, BuyingSignal, TrackedPattern, PriorityLevel, SignalSource } from '../types.ts';
import { X, Sparkles, Send, Check } from 'lucide-react';

interface SignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  patterns: TrackedPattern[];
  onAddSignal: (signal: BuyingSignal) => void;
}

export const SignalModal: React.FC<SignalModalProps> = ({
  isOpen,
  onClose,
  accounts,
  patterns,
  onAddSignal,
}) => {
  if (!isOpen) return null;

  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [patternId, setPatternId] = useState(patterns[0]?.id || '');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [rawSnippet, setRawSnippet] = useState('');
  const [source, setSource] = useState<SignalSource>('Job Board');
  const [priority, setPriority] = useState<PriorityLevel>('High');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !accountId) return;

    const account = accounts.find((a) => a.id === accountId);
    const pattern = patterns.find((p) => p.id === patternId);

    const newSignal: BuyingSignal = {
      id: 'sig-custom-' + Date.now(),
      accountId,
      accountName: account?.name || 'Target Account',
      patternId: patternId,
      patternName: pattern?.name || 'Custom Signal',
      title,
      summary: summary || title,
      source,
      timestamp: 'Just now',
      confidence: 90,
      priority,
      rawSnippet: rawSnippet || title,
      matchedKeywords: [pattern?.name || 'Manual Ingestion'],
      status: 'New',
      scoreImpact: priority === 'Very High' ? 35 : priority === 'High' ? 25 : 10,
    };

    onAddSignal(newSignal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900">Ingest New Buying Signal</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.industry})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Matched Tracked Pattern
              </label>
              <select
                value={patternId}
                onChange={(e) => setPatternId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                {patterns.map((pat) => (
                  <option key={pat.id} value={pat.id}>
                    {pat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority Tier</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Very High">Very High (Direct Intent)</option>
                <option value="High">High (Facility / Hiring Surge)</option>
                <option value="Low-Med">Low-Med (General Funding)</option>
                <option value="Low">Low (Noise / Single Hire)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Signal Headline / Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Austin Fab Design Expansion + 40 ASIC Engineers Hired"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as SignalSource)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Press Release">Press Release</option>
                <option value="Job Board">Job Board Requisition</option>
                <option value="SEC 10-K">SEC 10-K / 10-Q</option>
                <option value="Procurement RFP">Procurement RFP</option>
                <option value="Call Transcript">Call Transcript</option>
                <option value="G2 / Dark Funnel">G2 / Dark Funnel</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Raw Evidence Quote</label>
              <input
                type="text"
                value={rawSnippet}
                onChange={(e) => setRawSnippet(e.target.value)}
                placeholder="Exact quote from source..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Signal Context & Analysis</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Detailed description of why this triggers licensing urgency..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record & Score Signal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
