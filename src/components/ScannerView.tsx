import React, { useState, useEffect } from 'react';
import { SCANNER_SAMPLE_PRESETS } from '../data/seedData.ts';
import { TrackedPattern } from '../types.ts';
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Plus,
  Layers,
  FileText,
  Building,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface ScannerViewProps {
  onApplyDetectedSignal?: (analysis: any) => void;
  onDraftOutreachForAnalysis?: (analysis: any) => void;
  trackedPatterns?: TrackedPattern[];
  initialPattern?: TrackedPattern | null;
  onClearInitialPattern?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onApplyDetectedSignal,
  onDraftOutreachForAnalysis,
  trackedPatterns,
  initialPattern,
  onClearInitialPattern,
}) => {
  const [inputMode, setInputMode] = useState<'automated' | 'manual' | 'bulk'>('automated');
  const [inputText, setInputText] = useState(SCANNER_SAMPLE_PRESETS[0].text);
  const [companyName, setCompanyName] = useState('');
  const [sourceType, setSourceType] = useState('Auto-Detect from Text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountAddedToast, setAccountAddedToast] = useState(false);

  // Synchronize test snippet when a rule is sent via "Test in Scanner" (QAS-006)
  useEffect(() => {
    if (initialPattern) {
      setInputMode('automated');
      const testKeywords = initialPattern.regexPatterns?.length ? initialPattern.regexPatterns.join(', ') : initialPattern.name;
      const testSnippet = `Corporate Engineering Disclosure: Raytheon Systems announced a major new engineering facility and R&D expansion. Engineering headcount is expanding by 40 engineers to support CAD software, Synopsys Design Compiler, and Cadence Virtuoso implementations under FlexNet floating license servers. Focus: ${testKeywords}.`;
      setInputText(testSnippet);
      setAnalysisResult(null);
    }
  }, [initialPattern]);

  // Bulk input text state
  const [bulkText, setBulkText] = useState(
    `${SCANNER_SAMPLE_PRESETS[0].text}\n---\n${SCANNER_SAMPLE_PRESETS[1].text}\n---\n${SCANNER_SAMPLE_PRESETS[2].text}`
  );

  const handleSelectPreset = (preset: typeof SCANNER_SAMPLE_PRESETS[0]) => {
    setInputText(preset.text);
    setAnalysisResult(null);
  };

  const handleRunAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setAccountAddedToast(false);

    try {
      const payload: any = { text: inputText };
      if (inputMode === 'manual') {
        if (companyName.trim()) payload.accountName = companyName;
        if (sourceType !== 'Auto-Detect from Text') payload.source = sourceType;
      }

      // QAS-006: Supply active custom rules to engine
      if (trackedPatterns && trackedPatterns.length > 0) {
        payload.customRules = trackedPatterns.map((p) => ({
          name: p.name,
          keywords: p.regexPatterns,
          priority: p.priority,
          formula: p.interpretation,
          scoreImpact: p.weight,
        }));
      }

      const response = await fetch('/api/analyze-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(err.message || 'Failed to analyze signal');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunBulkAnalysis = async () => {
    if (!bulkText.trim()) return;
    setIsAnalyzing(true);
    setErrorMessage(null);
    setBulkResults(null);

    const chunks = bulkText
      .split(/---|\n{3,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 20)
      .slice(0, 5); // analyze up to 5 documents

    const results: any[] = [];
    try {
      for (const chunk of chunks) {
        const payload: any = { text: chunk };
        if (trackedPatterns && trackedPatterns.length > 0) {
          payload.customRules = trackedPatterns.map((p) => ({
            name: p.name,
            keywords: p.regexPatterns,
            priority: p.priority,
            formula: p.interpretation,
            scoreImpact: p.weight,
          }));
        }

        const response = await fetch('/api/analyze-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const data = await response.json();
          results.push(data.analysis);
        }
      }
      setBulkResults(results);
    } catch (err: any) {
      console.error('Bulk scan error:', err);
      setErrorMessage(err.message || 'Failed to analyze bulk signals');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddAccountToHub = (analysis: any) => {
    if (onApplyDetectedSignal) {
      onApplyDetectedSignal(analysis);
      setAccountAddedToast(true);
      setTimeout(() => setAccountAddedToast(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Explainer */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>Live AI Signal Scanner & Evaluation Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zero-friction buying signal detection: paste any raw document and let the AI automatically identify the company, source, and license intent.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setInputMode('automated')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'automated'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto-Detect (Zero Manual Input)
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'manual'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manual Override (Single)
          </button>
          <button
            onClick={() => setInputMode('bulk')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              inputMode === 'bulk'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk Documents
          </button>
        </div>
      </div>

      {/* Preset Selector (in Single modes) */}
      {inputMode !== 'bulk' && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Try a Calibrated Evaluation Preset:</span>
            <span className="text-[11px] font-normal text-slate-500">
              Notice: Account name & source are automatically extracted!
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SCANNER_SAMPLE_PRESETS.map((preset) => {
              const isSelected = inputText === preset.text;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white font-medium shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SINGLE SCANNER MODE (AUTOMATED OR MANUAL OVERRIDE) */}
      {inputMode !== 'bulk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Input Box */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            {/* If Manual Mode is selected, show manual override fields */}
            {inputMode === 'manual' ? (
              <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Override Account Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="Leave blank to auto-detect"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Override Source Medium
                  </label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Auto-Detect from Text">Auto-Detect from Text</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Job Board Requisition">Job Board Requisition</option>
                    <option value="SEC 10-K / 10-Q">SEC 10-K / 10-Q</option>
                    <option value="Procurement RFP / Tender">Procurement RFP / Tender</option>
                    <option value="Call Transcript">Call Transcript</option>
                    <option value="News Article">News Article</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 flex items-center justify-between">
                <span className="font-semibold">
                  Zero Manual Input Mode:
                </span>
                <span className="text-[11px] text-blue-700">
                  Target account, source medium, and tech stack will be extracted automatically.
                </span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Raw Unstructured Text Content
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {inputText.length} characters
                </span>
              </div>
              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed text-slate-800"
                placeholder="Paste raw text, job posting, or article snippet here..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Evaluates against 6 tracked formulas + Gemini 3.8 Flash
              </span>
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing || !inputText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Signal...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run AI Detection</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column: AI Extraction & Priority Output */}
          <div className="space-y-4">
            {analysisResult ? (
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs animate-in fade-in duration-200">
                {/* Header result line with Auto-Extracted badges */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                  <div>
                    <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Identified Account & Source</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {analysisResult.companyName}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span>Source: {analysisResult.sourceMedium}</span>
                      <span aria-hidden="true">·</span>
                      <span>{analysisResult.industry}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold font-mono ${
                        analysisResult.priority === 'Very High'
                          ? 'text-rose-600'
                          : analysisResult.priority === 'High'
                          ? 'text-amber-600'
                          : analysisResult.isNoise
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {analysisResult.priority} Priority
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Confidence: {analysisResult.confidence}% · +{analysisResult.scoreImpact} pts
                    </div>
                  </div>
                </div>

                {/* Noise Warning if applicable */}
                {analysisResult.isNoise && (
                  <div className="bg-slate-100 border border-slate-200 rounded p-3 text-xs text-slate-700 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-900">Noise Rejection Active:</span>{' '}
                      This signal represents an isolated hire or minor notice without CAD/EDA purchasing
                      context. Filtered to prevent SDR alert fatigue.
                    </div>
                  </div>
                )}

                {/* Buying Intent Interpretation */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Buying-Intent Interpretation
                  </div>
                  <p className="text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded p-3 leading-relaxed font-medium">
                    {analysisResult.buyingIntentInterpretation}
                  </p>
                </div>

                {/* Matched Boolean Formulas */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Matched Tracked Formulas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysisResult.matchedPatterns.map((pat: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded border border-blue-200/60"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Detected Engineering Software & Daemons */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-500 mb-1">Detected Software</div>
                    <div className="text-slate-800 font-mono">
                      {analysisResult.detectedTools?.length > 0
                        ? analysisResult.detectedTools.join(', ')
                        : 'None specified'}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-500 mb-1">Detected Daemons</div>
                    <div className="text-slate-800 font-mono">
                      {analysisResult.detectedDaemons?.length > 0
                        ? analysisResult.detectedDaemons.join(', ')
                        : 'Standard FlexNet / RLM inferred'}
                    </div>
                  </div>
                </div>

                {/* Extracted Proof Quotes */}
                {analysisResult.keyQuotes?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Extracted Proof Evidence
                    </div>
                    <div className="space-y-1">
                      {analysisResult.keyQuotes.map((q: string, idx: number) => (
                        <div
                          key={idx}
                          className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2 font-mono italic"
                        >
                          "{q}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Sales Action & 1-Click Track Button */}
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-900 mb-1">
                    Recommended TeamEDA GTM Action:
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {analysisResult.recommendedGtmAction}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleAddAccountToHub(analysisResult)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {accountAddedToast ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Added to Tracked Accounts!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Tracked Accounts Hub</span>
                        </>
                      )}
                    </button>

                    {onDraftOutreachForAnalysis && (
                      <button
                        onClick={() => onDraftOutreachForAnalysis(analysisResult)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Generate Outbound Sequence</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[360px] bg-white border border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-sm font-semibold text-slate-700">No Signal Analyzed Yet</div>
                <div className="text-xs text-slate-500 max-w-sm mt-1">
                  Click any sample preset above or paste a custom document on the left, then click "Run AI Detection".
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BULK SCANNER MODE */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Bulk Document & Snippet Evaluation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste multiple press releases, job posts, or articles separated by <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">---</code>.
                </p>
              </div>
              <button
                onClick={handleRunBulkAnalysis}
                disabled={isAnalyzing || !bulkText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Batch Signals...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Run Bulk Detection</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed text-slate-800"
              placeholder="Document 1&#10;---&#10;Document 2&#10;---&#10;Document 3"
            />
          </div>

          {bulkResults && bulkResults.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  Bulk Evaluation Results ({bulkResults.length} Accounts Identified)
                </h3>
                <button
                  onClick={() => {
                    bulkResults.forEach((res) => {
                      if (onApplyDetectedSignal) onApplyDetectedSignal(res);
                    });
                    setAccountAddedToast(true);
                    setTimeout(() => setAccountAddedToast(false), 3000);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer shadow-xs"
                >
                  + Add All {bulkResults.length} Accounts to Hub
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bulkResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{item.companyName}</div>
                      <span
                        className={`font-mono font-semibold ${
                          item.priority === 'Very High'
                            ? 'text-rose-600'
                            : item.priority === 'High'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>

                    <p className="text-slate-600">{item.buyingIntentInterpretation}</p>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Tools: {item.detectedTools?.join(', ') || 'CAD/EDA tools'} · Daemons: {item.detectedDaemons?.join(', ') || 'FlexNet'}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAddAccountToHub(item)}
                        className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-800"
                      >
                        Add to Tracked
                      </button>
                      {onDraftOutreachForAnalysis && (
                        <button
                          onClick={() => onDraftOutreachForAnalysis(item)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 text-white hover:bg-slate-800 rounded"
                        >
                          Outreach
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
