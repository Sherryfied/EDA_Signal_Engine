import React, { useState } from 'react';
import { BuyingSignal, TrackedPattern, CalibrationItem, Account } from '../types.ts';
import { Copy, Check, Filter, ShieldCheck, Flame, Info, ExternalLink, Sparkles, Send } from 'lucide-react';

interface CalibrationViewProps {
  patterns: TrackedPattern[];
  calibrationMatrix: CalibrationItem[];
  signals: BuyingSignal[];
  accounts: Account[];
  onDraftOutreachForSignal: (signal: BuyingSignal) => void;
  onDispatchAlert: (signal: BuyingSignal, service: 'Slack' | 'Salesforce') => void;
}

export const CalibrationView: React.FC<CalibrationViewProps> = ({
  patterns,
  calibrationMatrix,
  signals,
  accounts,
  onDraftOutreachForSignal,
  onDispatchAlert,
}) => {
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'patterns' | 'calibration'>('stream');

  const handleCopyQuery = (id: string, query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQueryId(id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  const filteredSignals = signals.filter((s) => {
    if (selectedPriorityFilter === 'all') return true;
    return s.priority === selectedPriorityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Sub-navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Signal Intelligence Stream & Calibration Engine
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking 6 calibrated Boolean query formulas, intent interpretations, and noise-rejection thresholds.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('stream')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'stream'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Signal Feed ({signals.length})
          </button>
          <button
            onClick={() => setActiveSubTab('patterns')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'patterns'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tracked Boolean Formulas ({patterns.length})
          </button>
          <button
            onClick={() => setActiveSubTab('calibration')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeSubTab === 'calibration'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Calibration & Noise Filtering
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE SIGNAL STREAM */}
      {activeSubTab === 'stream' && (
        <div className="space-y-4">
          {/* Priority filter pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter by Priority:</span>
            {['all', 'Very High', 'High', 'Low-Med', 'Low'].map((pri) => (
              <button
                key={pri}
                onClick={() => setSelectedPriorityFilter(pri)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  selectedPriorityFilter === pri
                    ? 'bg-slate-900 text-white font-medium'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pri === 'all' ? 'All Signals' : pri}
              </button>
            ))}
          </div>

          {/* Stream Cards */}
          <div className="space-y-3">
            {filteredSignals.map((signal) => {
              const account = accounts.find((a) => a.id === signal.accountId);
              const isUrgent = signal.priority === 'Very High';
              const isHigh = signal.priority === 'High';
              const isNoise = signal.priority === 'Low';

              return (
                <div
                  key={signal.id}
                  className={`bg-white border rounded-lg p-4 transition-all hover:border-slate-300 ${
                    isUrgent
                      ? 'border-rose-200 bg-rose-50/20'
                      : isHigh
                      ? 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      {/* Top metadata line: NO PILLS, clean text with separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-900">
                          {signal.accountName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            isUrgent
                              ? 'text-rose-600'
                              : isHigh
                              ? 'text-amber-600'
                              : isNoise
                              ? 'text-slate-400'
                              : 'text-slate-600'
                          }`}
                        >
                          {signal.priority} Priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{signal.source}</span>
                        <span aria-hidden="true">·</span>
                        <span>{signal.timestamp}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Confidence: {signal.confidence}%</span>
                      </div>

                      {/* Signal Title */}
                      <h3 className="text-base font-semibold text-slate-900">
                        {signal.title}
                      </h3>

                      {/* Summary */}
                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                        {signal.summary}
                      </p>

                      {/* Evidence Quote / Snippet */}
                      <div className="mt-2 text-xs bg-slate-50 border border-slate-200/80 rounded p-2.5 font-mono text-slate-700">
                        <span className="text-slate-400 select-none mr-1.5">Evidence:</span>
                        "{signal.rawSnippet}"
                      </div>

                      {/* Matched Keywords */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">Formula Trigger:</span>
                        <span className="font-mono text-slate-800">{signal.patternName}</span>
                        <span aria-hidden="true">·</span>
                        <span>Matched tokens:</span>
                        {signal.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="bg-slate-100 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px]"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Right Column */}
                    <div className="flex md:flex-col items-center md:items-end justify-end gap-2 shrink-0">
                      <div className="text-right hidden md:block">
                        <div className="text-xs font-mono font-bold text-slate-900">
                          +{signal.scoreImpact} pts
                        </div>
                        <div className="text-[10px] text-slate-400">Score Impact</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onDraftOutreachForSignal(signal)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" />
                          <span>Generate Outreach</span>
                        </button>
                        <button
                          onClick={() => onDispatchAlert(signal, 'Slack')}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
                          title="Simulate Slack Alert"
                        >
                          <Send className="w-3 h-3 text-slate-500" />
                          <span>Slack</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 6 TRACKED BOOLEAN FORMULAS (FROM USER ATTACHMENT) */}
      {activeSubTab === 'patterns' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Tracked Boolean Query Formulas:</span> These 6
              syntaxes match your tracking specification. They run continuously across 10-K filings,
              news releases, and job feeds to detect EDA license starvation and impending software
              expansions.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patterns.map((pat) => {
              const matchedAccounts = accounts.filter((a) =>
                signals.some((s) => s.accountId === a.id && s.patternId === pat.id)
              );

              return (
                <div
                  key={pat.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm">{pat.name}</h3>
                      <span
                        className={`text-xs font-mono font-semibold ${
                          pat.priority === 'Very High'
                            ? 'text-rose-600'
                            : pat.priority === 'High'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {pat.priority} Priority (+{pat.weight} pts)
                      </span>
                    </div>

                    {/* Raw Query String Box with Copy Button */}
                    <div className="relative group bg-slate-50 border border-slate-200 rounded p-2.5 font-mono text-xs text-slate-800 break-words">
                      <code>{pat.rawQuery}</code>
                      <button
                        onClick={() => handleCopyQuery(pat.id, pat.rawQuery)}
                        className="absolute right-2 top-2 p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition-colors"
                        title="Copy Boolean Query"
                      >
                        {copiedQueryId === pat.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600">{pat.interpretation}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Active Matched Accounts:</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {matchedAccounts.length > 0
                        ? matchedAccounts.map((a) => a.name.split(' ')[0]).join(', ')
                        : '0 accounts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CALIBRATION & NOISE REJECTION MATRIX */}
      {activeSubTab === 'calibration' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Signal Priority & Buying-Intent Calibration Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-configured priority rules governing TeamEDA's scoring and SDR alert triggers.
                </p>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">Observed Signal</th>
                  <th scope="col" className="px-4 py-3">Buying-Intent Interpretation</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3 text-right">Score Weight</th>
                  <th scope="col" className="px-4 py-3 text-center">GTM Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calibrationMatrix.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      item.isNoiseFiltered ? 'bg-slate-50/40 text-slate-400' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.priority === 'Very High' ? (
                          <Flame className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : item.isNoiseFiltered ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                        )}
                        <span>{item.observedSignal}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {item.buyingIntentInterpretation}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          item.priority === 'Very High'
                            ? 'text-rose-600'
                            : item.priority === 'High'
                            ? 'text-amber-600'
                            : item.priority === 'Low-Med'
                            ? 'text-slate-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                      +{item.scoreWeight} pts
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {item.isNoiseFiltered ? (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Filtered (No alert sent)
                        </span>
                      ) : item.priority === 'Very High' ? (
                        <span className="text-[11px] text-rose-600 font-semibold font-mono">
                          Instant AE Slack Alert
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-600 font-mono">
                          Account Score Boost
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rationale Card on Noise Filtering */}
          <div className="bg-slate-900 text-slate-100 rounded-lg p-5 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>GTM Alert Quality & Noise Rejection Architecture</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard signal scrapers flood sales reps with dozens of trivial job listings (e.g. single junior engineer hires) or generic venture funding press releases, causing alert fatigue.
              TeamEDA SignalPulse actively suppresses isolated hiring noise and only escalates alerts to AEs when physical expansion overlaps with high-value CAD/CAE tools or impending license renegotiations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
