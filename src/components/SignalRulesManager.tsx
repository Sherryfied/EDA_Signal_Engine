import React, { useState } from 'react';
import { TrackedPattern, PriorityLevel } from '../types.ts';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  X,
  Search,
} from 'lucide-react';

interface SignalRulesManagerProps {
  patterns: TrackedPattern[];
  onAddPattern: (pattern: TrackedPattern) => void;
  onUpdatePattern: (pattern: TrackedPattern) => void;
  onDeletePattern: (patternId: string) => void;
  onResetToDefaults: () => void;
  onTestInScanner: (pattern: TrackedPattern) => void;
}

export const SignalRulesManager: React.FC<SignalRulesManagerProps> = ({
  patterns,
  onAddPattern,
  onUpdatePattern,
  onDeletePattern,
  onResetToDefaults,
  onTestInScanner,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<TrackedPattern | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formQuery, setFormQuery] = useState('');
  const [formInterpretation, setFormInterpretation] = useState('');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('High');
  const [formWeight, setFormWeight] = useState(25);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingPattern(null);
    setFormName('');
    setFormQuery('("keyword 1" OR "keyword 2") ("EDA" OR "CAD")');
    setFormInterpretation('');
    setFormPriority('High');
    setFormWeight(25);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (pattern: TrackedPattern) => {
    setEditingPattern(pattern);
    setFormName(pattern.name);
    setFormQuery(pattern.rawQuery);
    setFormInterpretation(pattern.interpretation);
    setFormPriority(pattern.priority);
    setFormWeight(pattern.weight);
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formQuery.trim()) return;

    if (editingPattern) {
      // Update existing
      onUpdatePattern({
        ...editingPattern,
        name: formName.trim(),
        rawQuery: formQuery.trim(),
        interpretation: formInterpretation.trim(),
        priority: formPriority,
        weight: formWeight,
        regexPatterns: [formName.toLowerCase()],
      });
    } else {
      // Create new
      const newPattern: TrackedPattern = {
        id: 'pat-custom-' + Date.now(),
        name: formName.trim(),
        rawQuery: formQuery.trim(),
        interpretation: formInterpretation.trim(),
        priority: formPriority,
        weight: formWeight,
        regexPatterns: [formName.toLowerCase()],
      };
      onAddPattern(newPattern);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Tracked Buying Signals & Query Rules Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure the specific buying intent signals, Boolean search formulas, descriptions, and priority weights tracked by TeamEDA SignalPulse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetToDefaults}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Restore original 6 canonical tracked signal formulas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to 6 Defaults</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Add New Signal Rule</span>
          </button>
        </div>
      </div>

      {/* Explainer Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">
            Real-Time Engine Synchronization:
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Any rule you add, edit, or remove here immediately governs the Live AI Scanner, the Autonomous Discovery Radar, and account intent velocity scoring.
          </p>
        </div>
      </div>

      {/* Signal Rules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((rule) => {
          const isUrgent = rule.priority === 'Very High';
          const isHigh = rule.priority === 'High';

          return (
            <div
              key={rule.id}
              className={`bg-white border rounded-lg p-5 flex flex-col justify-between space-y-4 shadow-xs transition-all hover:border-slate-300 ${
                isUrgent ? 'border-rose-200/80' : isHigh ? 'border-amber-200/80' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Title & Priority Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{rule.name}</h3>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span
                        className={`font-semibold ${
                          isUrgent
                            ? 'text-rose-600'
                            : isHigh
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {rule.priority} Priority
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Weight: +{rule.weight} pts</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(rule)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                      title="Edit Signal Rule"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePattern(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Signal Rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Raw Boolean Query with Copy */}
                <div className="relative group bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs text-slate-800 break-words">
                  <code>{rule.rawQuery}</code>
                  <button
                    onClick={() => handleCopy(rule.id, rule.rawQuery)}
                    className="absolute right-2 top-2 p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Copy Boolean Formula"
                  >
                    {copiedId === rule.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Description & Buying Intent */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                    Buying-Intent Interpretation:
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {rule.interpretation}
                  </p>
                </div>
              </div>

              {/* Card Footer: Test in scanner */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Rule ID: {rule.id}
                </span>
                <button
                  onClick={() => onTestInScanner(rule)}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Test in AI Scanner</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Signal Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>{editingPattern ? 'Edit Signal Rule' : 'Create New Signal Rule'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Signal Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. EDA Tool Consolidation RFP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Boolean Query Formula (exact search query to match)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formQuery}
                  onChange={(e) => setFormQuery(e.target.value)}
                  placeholder='e.g. ("EDA consolidation" OR "license RFP") ("Synopsys" OR "Cadence")'
                  className="w-full p-2.5 font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => {
                      const pri = e.target.value as PriorityLevel;
                      setFormPriority(pri);
                      if (pri === 'Very High') setFormWeight(40);
                      else if (pri === 'High') setFormWeight(25);
                      else if (pri === 'Low-Med') setFormWeight(10);
                      else setFormWeight(2);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Very High">Very High (RFP / Direct Procurement)</option>
                    <option value="High">High (Facility / 40+ Hires)</option>
                    <option value="Low-Med">Low-Med (General Funding)</option>
                    <option value="Low">Low (Noise / Single Hire)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Intent Score Weight (+pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formWeight}
                    onChange={(e) => setFormWeight(parseInt(e.target.value, 10) || 25)}
                    className="w-full px-3 py-2 font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Buying-Intent Description & Meaning
                </label>
                <textarea
                  rows={3}
                  value={formInterpretation}
                  onChange={(e) => setFormInterpretation(e.target.value)}
                  placeholder="Explain why this indicates CAD/EDA license need, denial risk, or renewal timing..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{editingPattern ? 'Update Rule' : 'Save Signal Rule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
