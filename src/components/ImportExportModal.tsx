import React, { useState } from 'react';
import { Account, BuyingSignal } from '../types.ts';
import { X, Upload, Download, FileText, Sparkles, Check, AlertCircle, Loader2, Copy, Building2 } from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onImportAccounts: (newAccounts: Account[], newSignals?: BuyingSignal[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onImportAccounts,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'paste' | 'csv-import' | 'csv-export'>('paste');

  // Paste / Batch Search State
  const [pastedText, setPastedText] = useState(
    'Marvell Technology\nappliedmaterials.com\nNorthrop Grumman\nmicrochip.com\nSynaptics'
  );
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentResults, setEnrichmentResults] = useState<any[] | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedCsvAccounts, setParsedCsvAccounts] = useState<Account[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Handle Pasted Company Search / Enrichment
  const handleRunPasteEnrichment = async () => {
    const lines = pastedText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setPasteError('Please enter at least one company name or website domain.');
      return;
    }

    setIsEnriching(true);
    setPasteError(null);

    try {
      const response = await fetch('/api/discover-company-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: lines }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setEnrichmentResults(data.accounts || []);
    } catch (err: any) {
      console.error(err);
      setPasteError(err.message || 'Failed to enrich companies.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleApplyEnrichment = () => {
    if (!enrichmentResults || enrichmentResults.length === 0) return;

    const newAccounts: Account[] = [];
    const newSignals: BuyingSignal[] = [];

    enrichmentResults.forEach((item) => {
      const seats = item.edaEngineersCount || 850;
      newAccounts.push({
        id: item.id,
        name: item.name,
        ticker: item.ticker,
        industry: item.industry,
        headcount: item.headcount,
        edaEngineersCount: seats,
        totalEngineersEstimate: seats * 3,
        qualificationStatus:
          seats >= 1500
            ? 'Tier-1 Qualified (1,500+ Seats)'
            : seats >= 500
            ? 'Tier-2 Qualified (500–1,499 Seats)'
            : 'Tier-3 Qualified (100–499 Seats)',
        qualificationReason: `Imported via company batch search: ${item.primaryTrigger}`,
        headcountConfidence: 92,
        annualEdaSpendEstimate: item.annualEdaSpendEstimate,
        edaTools: item.edaTools,
        licenseDaemons: item.licenseDaemons,
        currentEsamTool: item.currentEsamTool,
        renewalQuarter: item.renewalQuarter,
        renewalDaysLeft: item.renewalDaysLeft,
        icpFitScore: item.icpFitScore,
        intentVelocityScore: item.intentVelocityScore,
        compositeScore: item.compositeScore,
        priorityLevel: item.priorityLevel,
        primaryTrigger: item.primaryTrigger,
        activeSignalsCount: 1,
        denialContentionRisk: item.denialContentionRisk,
        notes: item.notes,
      });

      if (item.initialSignal) {
        newSignals.push(item.initialSignal);
      }
    });

    onImportAccounts(newAccounts, newSignals);
    onClose();
  };

  // CSV Parsing
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = text
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean);
        if (rows.length < 2) {
          throw new Error('CSV must contain a header row and at least one data row.');
        }

        const headers = rows[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
        const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('company'));
        const industryIdx = headers.findIndex((h) => h.includes('industry') || h.includes('sector'));
        const toolsIdx = headers.findIndex((h) => h.includes('tool') || h.includes('eda') || h.includes('cad'));
        const daemonsIdx = headers.findIndex((h) => h.includes('daemon') || h.includes('license'));
        const spendIdx = headers.findIndex((h) => h.includes('spend') || h.includes('budget'));
        const renewalIdx = headers.findIndex((h) => h.includes('renewal') || h.includes('window'));

        const parsed: Account[] = [];
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const companyName = cols[nameIdx >= 0 ? nameIdx : 0];
          if (!companyName) continue;

          const industry = (cols[industryIdx >= 0 ? industryIdx : 1] as any) || 'Semiconductors';
          const toolsStr = cols[toolsIdx >= 0 ? toolsIdx : 2] || 'Cadence Virtuoso; Synopsys Design Compiler';
          const daemonsStr = cols[daemonsIdx >= 0 ? daemonsIdx : 3] || 'FlexNet (FLEXlm)';
          const spend = cols[spendIdx >= 0 ? spendIdx : 4] || '$12M/yr';
          const renewalQuarter = cols[renewalIdx >= 0 ? renewalIdx : 5] || 'Q2 2027';

          const seats = 750;
          parsed.push({
            id: 'acc-csv-' + Date.now() + '-' + i,
            name: companyName,
            ticker: '',
            industry: industry.includes('Aero')
              ? 'Aerospace & Defense'
              : industry.includes('Auto')
              ? 'Automotive & EV'
              : 'Semiconductors',
            headcount: '8,000',
            edaEngineersCount: seats,
            totalEngineersEstimate: seats * 3,
            qualificationStatus:
              seats >= 1500
                ? 'Tier-1 Qualified (1,500+ Seats)'
                : seats >= 500
                ? 'Tier-2 Qualified (500–1,499 Seats)'
                : 'Tier-3 Qualified (100–499 Seats)',
            qualificationReason: 'Imported via CSV file with active floating license seats.',
            headcountConfidence: 90,
            annualEdaSpendEstimate: spend,
            edaTools: toolsStr.split(/;/).map((t) => t.trim()).filter(Boolean),
            licenseDaemons: daemonsStr.split(/;/).map((d) => d.trim()).filter(Boolean),
            currentEsamTool: 'Manual Scripts',
            renewalQuarter,
            renewalDaysLeft: 110,
            icpFitScore: 84,
            intentVelocityScore: 78,
            compositeScore: 80,
            priorityLevel: 'High',
            primaryTrigger: 'Imported via CSV - Engineering license tracking initiated',
            activeSignalsCount: 1,
            denialContentionRisk: 'Elevated',
            notes: 'Imported from customer GTM CSV spreadsheet.',
          });
        }

        setParsedCsvAccounts(parsed);
      } catch (err: any) {
        setCsvError(err.message || 'Failed to parse CSV file.');
      }
    };

    reader.readAsText(file);
  };

  const handleApplyCsvImport = () => {
    if (parsedCsvAccounts.length === 0) return;
    onImportAccounts(parsedCsvAccounts);
    onClose();
  };

  // CSV Export
  const handleDownloadCsv = () => {
    const headers = [
      'Account Name',
      'Ticker',
      'Industry',
      'Headcount',
      'EDA Engineers',
      'Annual EDA Spend',
      'EDA Tools',
      'License Daemons',
      'Current ESAM Tool',
      'Renewal Quarter',
      'Renewal Days Left',
      'ICP Fit Score',
      'Intent Velocity Score',
      'Composite Score',
      'Priority Level',
      'Primary Trigger',
      'Contention Risk',
      'Notes',
    ];

    const rows = accounts.map((a) => [
      `"${a.name}"`,
      `"${a.ticker || ''}"`,
      `"${a.industry}"`,
      `"${a.headcount}"`,
      a.edaEngineersCount,
      `"${a.annualEdaSpendEstimate}"`,
      `"${a.edaTools.join('; ')}"`,
      `"${a.licenseDaemons.join('; ')}"`,
      `"${a.currentEsamTool}"`,
      `"${a.renewalQuarter}"`,
      a.renewalDaysLeft,
      a.icpFitScore,
      a.intentVelocityScore,
      a.compositeScore,
      `"${a.priorityLevel}"`,
      `"${a.primaryTrigger.replace(/"/g, '""')}"`,
      `"${a.denialContentionRisk}"`,
      `"${a.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `TeamEDA_GTM_Account_Signals_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSampleTemplate = () => {
    const sampleHeaders = 'Company Name,Industry,EDA Tools,License Daemons,Annual Spend,Renewal Quarter';
    const sampleRows = [
      'AMD,Semiconductors,Synopsys Fusion Compiler; Cadence Virtuoso,FlexNet (FLEXlm); Reprise (RLM),$45M/yr,Q1 2027',
      'BAE Systems,Aerospace & Defense,Siemens NX; Dassault CATIA,DSLS; FlexNet (FLEXlm),$28M/yr,Q4 2026',
      'General Motors Autonomous,Automotive & EV,Altair HyperWorks; Ansys Fluent,FlexNet (FLEXlm),$15M/yr,Q2 2027',
    ];
    const content = [sampleHeaders, ...sampleRows].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TeamEDA_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Account Ingestion & Signal Discovery Console
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-slate-900 font-semibold bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Copy className="w-3.5 h-3.5 text-blue-600" />
            <span>Paste Company Names / Websites</span>
          </button>
          <button
            onClick={() => setActiveTab('csv-import')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'csv-import'
                ? 'border-blue-600 text-slate-900 font-semibold bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV File Import</span>
          </button>
          <button
            onClick={() => setActiveTab('csv-export')}
            className={`pb-2.5 px-4 transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'csv-export'
                ? 'border-blue-600 text-slate-900 font-semibold bg-white rounded-t-md'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export to CSV</span>
          </button>
        </div>

        {/* Tab 1: Paste Company Names or URLs */}
        {activeTab === 'paste' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Enter or Paste Company Names or Website Domains (one per line)
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPastedText(
                      'Marvell Technology\nappliedmaterials.com\nNorthrop Grumman\nmicrochip.com\nSynaptics\nAnalog Devices'
                    )
                  }
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Load 6 High-Value Hardware Targets
                </button>
              </div>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="e.g.&#10;marvell.com&#10;Applied Materials&#10;northropgrumman.com&#10;Microchip Technology"
                className="w-full p-3 font-mono bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The AI engine will profile their CAD/EDA toolchains (Cadence, Synopsys, CATIA, etc.), match against the 6 buying signals, and estimate licensing renewal windows.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Supports domain names (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">marvell.com</code>) or corporate names.
              </span>
              <button
                type="button"
                onClick={handleRunPasteEnrichment}
                disabled={isEnriching || !pastedText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isEnriching ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching & Profiling Signals...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Profile & Discover Signals</span>
                  </>
                )}
              </button>
            </div>

            {pasteError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pasteError}</span>
              </div>
            )}

            {/* Enrichment Preview */}
            {enrichmentResults && enrichmentResults.length > 0 && (
              <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">
                    Discovered Profiles & Signals ({enrichmentResults.length} Accounts)
                  </div>
                  <button
                    onClick={handleApplyEnrichment}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer shadow-xs"
                  >
                    + Add All {enrichmentResults.length} Accounts to Intelligence Hub
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {enrichmentResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.industry}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {item.primaryTrigger}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Tools: {item.edaTools.join(', ')} · Daemons: {item.licenseDaemons.join(', ')}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900">
                          {item.compositeScore}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </div>
                        <div className="text-[10px] text-rose-600 font-semibold font-mono">
                          {item.priorityLevel} Priority
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: CSV File Import */}
        {activeTab === 'csv-import' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center space-y-3">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <label className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                  <span>Click to select a CSV file</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCsvFileUpload}
                  />
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Upload an existing spreadsheet with Company Name, Industry, and EDA Tool columns.
                </p>
              </div>

              {csvFile && (
                <div className="text-xs font-mono text-slate-700 bg-slate-100 py-1.5 px-3 rounded inline-block">
                  Selected file: {csvFile.name} ({parsedCsvAccounts.length} accounts parsed)
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Download Sample CSV Template</span>
              </button>

              {parsedCsvAccounts.length > 0 && (
                <button
                  type="button"
                  onClick={handleApplyCsvImport}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                >
                  Import {parsedCsvAccounts.length} Accounts Now
                </button>
              )}
            </div>

            {csvError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{csvError}</span>
              </div>
            )}

            {parsedCsvAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-900">Parsed Accounts Preview:</div>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <tr>
                        <th className="p-2">Account Name</th>
                        <th className="p-2">Industry</th>
                        <th className="p-2">EDA Tools</th>
                        <th className="p-2">Spend</th>
                        <th className="p-2">Renewal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedCsvAccounts.map((a, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">{a.name}</td>
                          <td className="p-2 text-slate-600">{a.industry}</td>
                          <td className="p-2 text-slate-600 font-mono">{a.edaTools.join(', ')}</td>
                          <td className="p-2 font-mono">{a.annualEdaSpendEstimate}</td>
                          <td className="p-2 font-mono">{a.renewalQuarter}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: CSV Export */}
        {activeTab === 'csv-export' && (
          <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-900">Export GTM Intelligence Data</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download a complete, audit-grade CSV export of all {accounts.length} target accounts, including their detected engineering software tools, active FlexNet/RLM/DSLS daemons, 3-year ELA renewal windows, and computed Intent Velocity scores.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="font-semibold text-slate-800">Fields included in CSV:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div>✓ Account Name & Ticker</div>
                <div>✓ Primary EDA Stack</div>
                <div>✓ License Daemons</div>
                <div>✓ Renewal Window & Days</div>
                <div>✓ Composite Intent Score</div>
                <div>✓ ICP Fit & Velocity</div>
                <div>✓ Denial Contention Risk</div>
                <div>✓ Primary Trigger Signal</div>
                <div>✓ Current ESAM Platform</div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download All {accounts.length} Accounts to CSV</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
