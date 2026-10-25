import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Account } from '../types.ts';
import {
  Search,
  ChevronRight,
  Clock,
  ShieldAlert,
  Sparkles,
  Building2,
  Radar,
  Upload,
  Plus,
  Loader2,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  CheckSquare,
  Square,
  UserPlus,
  CheckCheck,
} from 'lucide-react';

// ==========================================
// CANONICAL TIER CLASSIFICATION LOGIC
// Reused for filters, badges, and metrics
// Boundaries: <100, 100–499, 500–1,499, 1,500+
// ==========================================
export type AccountTierId = 'all' | 'Tier-1' | 'Tier-2' | 'Tier-3' | 'Under-Threshold';

export interface TierInfo {
  id: 'Tier-1' | 'Tier-2' | 'Tier-3' | 'Under-Threshold';
  label: string;
  badgeLabel: string;
  badgeClass: string;
  minSeats: number;
  maxSeats: number | null;
}

export function getAccountTier(edaSeats: number): TierInfo {
  const seats = Number(edaSeats) || 0;
  if (seats >= 1500) {
    return {
      id: 'Tier-1',
      label: 'Tier-1 (1,500+ Seats)',
      badgeLabel: 'Tier-1 Target',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      minSeats: 1500,
      maxSeats: null,
    };
  }
  if (seats >= 500) {
    return {
      id: 'Tier-2',
      label: 'Tier-2 (500–1,499 Seats)',
      badgeLabel: 'Tier-2 Target',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      minSeats: 500,
      maxSeats: 1499,
    };
  }
  if (seats >= 100) {
    return {
      id: 'Tier-3',
      label: 'Tier-3 (100–499 Seats)',
      badgeLabel: 'Tier-3 Target',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      minSeats: 100,
      maxSeats: 499,
    };
  }
  return {
    id: 'Under-Threshold',
    label: 'Under Threshold (<100 Seats)',
    badgeLabel: '<100 Seats (Under Threshold)',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    minSeats: 0,
    maxSeats: 99,
  };
}

// ==========================================
// CANONICAL COMPETITOR CLASSIFICATION LOGIC
// Reused for filters, badge dots, and wedge text
// ==========================================
export type CompetitorCategory = 'OpenLM' | 'Flexera' | 'Scripts' | 'Greenfield' | 'Other';

export interface CompetitorInfo {
  category: CompetitorCategory;
  displayName: string;
  wedgeAngle: string;
  dotClass: string;
}

export function categorizeCompetitor(toolStr?: string): CompetitorInfo {
  const raw = (toolStr || '').trim();
  const lower = raw.toLowerCase();

  if (lower.includes('openlm')) {
    return {
      category: 'OpenLM',
      displayName: raw.split('(')[0].trim() || 'OpenLM',
      wedgeAngle: 'Wedge: High per-user cost & module sprawl',
      dotClass: 'bg-purple-600',
    };
  }
  if (lower.includes('flexera') || lower.includes('fnmea')) {
    return {
      category: 'Flexera',
      displayName: raw.split('(')[0].trim() || 'Flexera FNMEA',
      wedgeAngle: 'Wedge: Heavyweight DB admin & slow reports',
      dotClass: 'bg-indigo-600',
    };
  }
  if (
    lower.includes('script') ||
    lower.includes('python') ||
    lower.includes('perl') ||
    lower.includes('in-house')
  ) {
    return {
      category: 'Scripts',
      displayName: raw.split('(')[0].trim() || 'In-House Scripts',
      wedgeAngle: 'Wedge: Daemon upgrade breakage & no alerts',
      dotClass: 'bg-amber-600',
    };
  }
  if (
    !raw ||
    lower.includes('none') ||
    lower.includes('raw') ||
    lower.includes('manual') ||
    lower.includes('unmanaged')
  ) {
    return {
      category: 'Greenfield',
      displayName: raw ? raw.split('(')[0].trim() : 'Greenfield (Unmanaged)',
      wedgeAngle: 'Wedge: Greenfield idle seat harvesting',
      dotClass: 'bg-slate-400',
    };
  }
  return {
    category: 'Other',
    displayName: raw.split('(')[0].trim(),
    wedgeAngle: `Wedge: Displace ${raw.split('(')[0].trim()}`,
    dotClass: 'bg-cyan-600',
  };
}

interface AccountTableProps {
  accounts: Account[];
  discoveredAccounts: Account[];
  onSelectAccount: (account: Account) => void;
  onDraftOutreach: (account: Account) => void;
  onOpenImportExport: () => void;
  onPromoteDiscoveredAccount: (account: Account) => void;
  onBatchPromoteDiscoveredAccounts?: (accountIds: string[]) => void;
  onRunDiscoveryRadar: () => void;
  isScanningRadar: boolean;
  onResetToFullUniverse?: () => void;
  onSweepAllVerticals?: () => void;
  autoIngestDirectly?: boolean;
}

export const AccountTable: React.FC<AccountTableProps> = ({
  accounts,
  discoveredAccounts,
  onSelectAccount,
  onDraftOutreach,
  onOpenImportExport,
  onPromoteDiscoveredAccount,
  onBatchPromoteDiscoveredAccounts,
  onRunDiscoveryRadar,
  isScanningRadar,
  onResetToFullUniverse,
  onSweepAllVerticals,
  autoIngestDirectly = true,
}) => {
  const [activeAccountView, setActiveAccountView] = useState<'tracked' | 'discovered'>('tracked');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<AccountTierId>('all');
  const [sortBy, setSortBy] = useState<'composite' | 'renewal' | 'velocity'>('composite');

  // Multi-Select state for Signal Discovery Radar
  const [selectedDiscoveredIds, setSelectedDiscoveredIds] = useState<Set<string>>(new Set());
  const masterCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Sync / prune selected IDs when discovered dataset changes or view switches
  useEffect(() => {
    if (activeAccountView !== 'discovered') {
      setSelectedDiscoveredIds(new Set());
    } else {
      const validIds = new Set(discoveredAccounts.map((a) => a.id));
      setSelectedDiscoveredIds((prev) => {
        const next = new Set<string>();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
    }
  }, [discoveredAccounts, activeAccountView]);

  const currentDataset = activeAccountView === 'tracked' ? accounts : discoveredAccounts;

  // Filtered & Sorted Accounts with Bulletproof Null/Undefined Guards
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return currentDataset
      .filter((acc) => {
        // Safe Search Guard: prevent null/undefined runtime exceptions on incomplete records
        const matchesSearch =
          !q ||
          Boolean(acc.name && typeof acc.name === 'string' && acc.name.toLowerCase().includes(q)) ||
          Boolean(acc.ticker && typeof acc.ticker === 'string' && acc.ticker.toLowerCase().includes(q)) ||
          Boolean(acc.industry && typeof acc.industry === 'string' && acc.industry.toLowerCase().includes(q)) ||
          (Array.isArray(acc.edaTools) &&
            acc.edaTools.some((t) => typeof t === 'string' && t.toLowerCase().includes(q))) ||
          (Array.isArray(acc.licenseDaemons) &&
            acc.licenseDaemons.some((d) => typeof d === 'string' && d.toLowerCase().includes(q))) ||
          Boolean(
            acc.currentEsamTool &&
              typeof acc.currentEsamTool === 'string' &&
              acc.currentEsamTool.toLowerCase().includes(q)
          ) ||
          Boolean(
            acc.primaryTrigger &&
              typeof acc.primaryTrigger === 'string' &&
              acc.primaryTrigger.toLowerCase().includes(q)
          );

        // Industry Filter
        const matchesIndustry =
          selectedIndustry === 'all' || acc.industry === selectedIndustry;

        // Priority Filter
        const matchesPriority =
          selectedPriority === 'all' || acc.priorityLevel === selectedPriority;

        // Normalized Competitor Filter
        const competitorInfo = categorizeCompetitor(acc.currentEsamTool);
        const matchesCompetitor =
          selectedCompetitor === 'all' ||
          competitorInfo.category === selectedCompetitor;

        // Canonical Tier Filter using single getAccountTier logic
        const tierInfo = getAccountTier(acc.edaEngineersCount);
        const matchesTier =
          selectedTier === 'all' || tierInfo.id === selectedTier;

        return matchesSearch && matchesIndustry && matchesPriority && matchesCompetitor && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'composite') return (b.compositeScore || 0) - (a.compositeScore || 0);
        if (sortBy === 'renewal') return (a.renewalDaysLeft || 0) - (b.renewalDaysLeft || 0);
        if (sortBy === 'velocity') return (b.intentVelocityScore || 0) - (a.intentVelocityScore || 0);
        return 0;
      });
  }, [
    currentDataset,
    searchQuery,
    selectedIndustry,
    selectedPriority,
    selectedCompetitor,
    selectedTier,
    sortBy,
  ]);

  // Dynamic Aggregate Metrics (Calculated live from accounts data)
  const tier1Count = useMemo(() => {
    return accounts.filter((a) => (Number(a.edaEngineersCount) || 0) >= 1500).length;
  }, [accounts]);

  const criticalAccountsCount = useMemo(() => {
    return accounts.filter((a) => a.priorityLevel === 'Very High').length;
  }, [accounts]);

  // Renewal metrics: cleanly separate active 0–90d imminent renewals from overdue/expired renewals (<0)
  const imminentRenewalsCount = useMemo(() => {
    return accounts.filter(
      (a) => typeof a.renewalDaysLeft === 'number' && a.renewalDaysLeft >= 0 && a.renewalDaysLeft <= 90
    ).length;
  }, [accounts]);

  const overdueRenewalsCount = useMemo(() => {
    return accounts.filter(
      (a) => typeof a.renewalDaysLeft === 'number' && a.renewalDaysLeft < 0
    ).length;
  }, [accounts]);

  // Dynamic Annual EDA Spend calculation (replaces hardcoded $352M)
  const totalAnnualEdaSpendEstimate = useMemo(() => {
    let totalMillions = 0;
    accounts.forEach((acc) => {
      if (!acc.annualEdaSpendEstimate) return;
      const str = acc.annualEdaSpendEstimate.trim().replace(/,/g, '');
      const match = str.match(/\$?\s*([\d.]+)\s*([MBKmbk])?/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = (match[2] || 'M').toUpperCase();
        if (!isNaN(val)) {
          if (unit === 'B') totalMillions += val * 1000;
          else if (unit === 'K') totalMillions += val / 1000;
          else totalMillions += val;
        }
      }
    });

    if (totalMillions >= 1000) {
      return `$${(totalMillions / 1000).toFixed(2)}B`;
    }
    return `$${Math.round(totalMillions)}M`;
  }, [accounts]);

  // Selection computed helpers
  const isAllDiscoveredSelected = useMemo(() => {
    if (filteredAccounts.length === 0) return false;
    return filteredAccounts.every((a) => selectedDiscoveredIds.has(a.id));
  }, [filteredAccounts, selectedDiscoveredIds]);

  const isSomeDiscoveredSelected = useMemo(() => {
    return selectedDiscoveredIds.size > 0 && !isAllDiscoveredSelected;
  }, [selectedDiscoveredIds, isAllDiscoveredSelected]);

  // Set indeterminate state on master checkbox
  useEffect(() => {
    if (masterCheckboxRef.current) {
      masterCheckboxRef.current.indeterminate = isSomeDiscoveredSelected;
    }
  }, [isSomeDiscoveredSelected]);

  const handleToggleSelectAllDiscovered = () => {
    if (isAllDiscoveredSelected) {
      setSelectedDiscoveredIds(new Set());
    } else {
      setSelectedDiscoveredIds(new Set(filteredAccounts.map((a) => a.id)));
    }
  };

  const handleToggleSelectRow = (accountId: string) => {
    setSelectedDiscoveredIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleBatchPromoteSelected = () => {
    if (selectedDiscoveredIds.size === 0) return;
    const ids = Array.from(selectedDiscoveredIds);
    if (onBatchPromoteDiscoveredAccounts) {
      onBatchPromoteDiscoveredAccounts(ids);
    } else {
      // Fallback
      ids.forEach((id) => {
        const acc = discoveredAccounts.find((a) => a.id === id);
        if (acc) onPromoteDiscoveredAccount(acc);
      });
    }
    setSelectedDiscoveredIds(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        {/* Switcher: Tracked Accounts vs Autonomous Discovery */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveAccountView('tracked')}
            className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeAccountView === 'tracked'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tracked Target Accounts ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveAccountView('discovered')}
            className={`px-3.5 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              activeAccountView === 'discovered'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radar className="w-3.5 h-3.5 text-blue-600" />
            <span>Signal Discovery Radar ({discoveredAccounts.length})</span>
          </button>
        </div>

        {/* Action Buttons: Scan Market Signals & Import/Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {onSweepAllVerticals && (
            <button
              type="button"
              onClick={onSweepAllVerticals}
              disabled={isScanningRadar}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Sweep all 5 enterprise verticals (Semiconductors, Aerospace, Automotive, Industrial, Hyperscale) with direct auto-ingestion into active table"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sweep 5 Verticals (Auto-Ingest)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRunDiscoveryRadar}
            disabled={isScanningRadar}
            className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Scan external web signals for untracked accounts matching the 6 formulas"
          >
            {isScanningRadar ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            ) : (
              <Radar className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Scan Radar</span>
          </button>

          <button
            type="button"
            onClick={onOpenImportExport}
            className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import / Export & Paste</span>
          </button>

          {onResetToFullUniverse && (
            <button
              type="button"
              onClick={onResetToFullUniverse}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset target accounts roster to full 31 seed enterprise companies"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Reset Target Universe (31)</span>
              <span className="lg:hidden">Reset (31)</span>
            </button>
          )}
        </div>
      </div>

      {/* Autonomous Discovery Banner when in Discovery view */}
      {activeAccountView === 'discovered' && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Radar className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>Autonomous Market Signal Radar</span>
                {autoIngestDirectly && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    Direct Auto-Ingest to Active Table: ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                The continuous background radar sweeps across 5 core verticals (Semiconductors, Aerospace, Automotive, Industrial Hardware, and Hyperscale Silicon) identifying verified primary source citations (SEC 10-K disclosures, DoD procurement RFPs, and hiring surges). When auto-ingest is enabled, qualified accounts are added straight into your Active Tracked Accounts table.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onSweepAllVerticals && (
              <button
                type="button"
                onClick={onSweepAllVerticals}
                disabled={isScanningRadar}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                {isScanningRadar ? 'Sweeping...' : 'Sweep All 5 Verticals'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interactive Multi-Select & Batch Action Toolbar in Discovery Radar */}
      {activeAccountView === 'discovered' && (
        <div
          className={`rounded-lg p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            selectedDiscoveredIds.size > 0
              ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-1 ring-blue-500'
              : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="bulk-radar-select-all"
              checked={isAllDiscoveredSelected}
              onChange={handleToggleSelectAllDiscovered}
              className={`w-4 h-4 rounded cursor-pointer ${
                selectedDiscoveredIds.size > 0
                  ? 'text-blue-900 bg-white border-white focus:ring-white'
                  : 'text-blue-600 border-slate-300 focus:ring-blue-500'
              }`}
            />
            <label
              htmlFor="bulk-radar-select-all"
              className="cursor-pointer font-medium text-xs flex items-center gap-2 select-none"
            >
              {selectedDiscoveredIds.size > 0 ? (
                <>
                  <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded">
                    {selectedDiscoveredIds.size} of {filteredAccounts.length} Selected
                  </span>
                  <span className="text-blue-100 hidden md:inline">
                    · Ready to add to Active Tracked Target Accounts
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-900">
                    Select All ({filteredAccounts.length} Discovered Accounts)
                  </span>
                  <span className="text-slate-500 hidden md:inline">
                    · Check individual rows or click 'Select All' to batch promote into Active Tracked Accounts
                  </span>
                </>
              )}
            </label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedDiscoveredIds.size > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handleBatchPromoteSelected}
                  className="px-4 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-md shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Add all selected accounts to Active Tracked Target Accounts"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Add Selected to Tracked Target Accounts ({selectedDiscoveredIds.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDiscoveredIds(new Set())}
                  className="px-3 py-2 text-xs font-medium text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                >
                  Clear Selection
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleToggleSelectAllDiscovered}
                disabled={filteredAccounts.length === 0}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:opacity-50 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>Select All ({filteredAccounts.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metric Strip (when in Tracked view) */}
      {activeAccountView === 'tracked' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Tracked Accounts with accurate Tier-1 count */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500">Tracked Target Accounts</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {accounts.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({tier1Count} Tier-1 Qualified)
              </span>
            </div>
          </div>

          {/* Card 2: Very High Priority */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>Very High Priority</span>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-rose-600">
                {criticalAccountsCount}
              </span>
              <span className="text-xs text-slate-500">Active RFP / Project</span>
            </div>
          </div>

          {/* Card 3: ELA Renewals 0–90d */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
              <span>ELA Renewals (0–90d)</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-amber-600">
                {imminentRenewalsCount}
              </span>
              <span className="text-xs text-slate-500">
                {overdueRenewalsCount > 0
                  ? `+ ${overdueRenewalsCount} overdue`
                  : 'Bargaining Window'}
              </span>
            </div>
          </div>

          {/* Card 4: Dynamically Calculated EDA Spend */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500">Tracked Annual EDA Spend</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalAnnualEdaSpendEstimate}
              </span>
              <span className="text-xs text-slate-500">Est. Floating Licenses</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by account, EDA software (Synopsys, Cadence, CATIA), daemon, or trigger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
            <div className="flex items-center p-0.5 bg-slate-100 rounded-md">
              <button
                type="button"
                onClick={() => setSortBy('composite')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  sortBy === 'composite'
                    ? 'bg-white text-slate-900 font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Composite Score
              </button>
              <button
                type="button"
                onClick={() => setSortBy('renewal')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  sortBy === 'renewal'
                    ? 'bg-white text-slate-900 font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Renewal Countdown
              </button>
              <button
                type="button"
                onClick={() => setSortBy('velocity')}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                  sortBy === 'velocity'
                    ? 'bg-white text-slate-900 font-medium shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Intent Velocity
              </button>
            </div>
          </div>
        </div>

        {/* Industry, Priority, Seat Tier & Competitor Segments */}
        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium mr-1">Industry:</span>
              {[
                'all',
                'Semiconductors',
                'Aerospace & Defense',
                'Automotive & EV',
                'Industrial & Hardware',
              ].map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setSelectedIndustry(ind)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedIndustry === ind
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ind === 'all' ? 'All Industries' : ind}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium mr-1">Priority:</span>
              {['all', 'Very High', 'High', 'Low-Med'].map((pri) => (
                <button
                  key={pri}
                  type="button"
                  onClick={() => setSelectedPriority(pri)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedPriority === pri
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {pri === 'all' ? 'All Priorities' : pri}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-50">
            {/* Qualification Tier Filter (Unified getAccountTier Logic) */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium mr-1">Seat Tier:</span>
              {(
                [
                  { id: 'all', label: 'All Tiers' },
                  { id: 'Tier-1', label: 'Tier-1 (1,500+ Seats)' },
                  { id: 'Tier-2', label: 'Tier-2 (500–1,499)' },
                  { id: 'Tier-3', label: 'Tier-3 (100–499)' },
                  { id: 'Under-Threshold', label: '<100 Seats' },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTier(tier.id)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedTier === tier.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Competitor Incumbent Filter (Unified categorizeCompetitor Logic) */}
            <div className="flex items-center gap-1">
              <span className="text-slate-400 font-medium mr-1">Incumbent:</span>
              {[
                { id: 'all', label: 'All Incumbents' },
                { id: 'OpenLM', label: 'OpenLM' },
                { id: 'Flexera', label: 'Flexera FNMEA' },
                { id: 'Scripts', label: 'In-House Scripts' },
                { id: 'Greenfield', label: 'Greenfield / None' },
                { id: 'Other', label: 'Other SAM Tools' },
              ].map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedCompetitor(comp.id)}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCompetitor === comp.id
                      ? 'bg-purple-700 text-white font-medium'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Account Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" role="table">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                {activeAccountView === 'discovered' && (
                  <th scope="col" className="w-12 px-3 py-3 text-center">
                    <input
                      ref={masterCheckboxRef}
                      type="checkbox"
                      aria-label="Select all discovered accounts"
                      checked={isAllDiscoveredSelected}
                      onChange={handleToggleSelectAllDiscovered}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                  </th>
                )}
                <th scope="col" className="px-4 py-3">Account & Industry</th>
                <th scope="col" className="px-4 py-3">Seat Qualification</th>
                <th scope="col" className="px-4 py-3">Engineering Footprint</th>
                <th scope="col" className="px-4 py-3">Incumbent Competitor</th>
                <th scope="col" className="px-4 py-3">Renewal Window</th>
                <th scope="col" className="px-4 py-3">
                  {activeAccountView === 'tracked' ? 'Primary Trigger' : 'Auto-Discovered Signal'}
                </th>
                <th scope="col" className="px-4 py-3 text-right">Intent Score</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAccounts.map((account) => {
                const isOverdue =
                  typeof account.renewalDaysLeft === 'number' && account.renewalDaysLeft < 0;
                const isRenewalNear =
                  typeof account.renewalDaysLeft === 'number' &&
                  account.renewalDaysLeft >= 0 &&
                  account.renewalDaysLeft <= 90;
                const isDiscovered = activeAccountView === 'discovered';
                const isSelected = isDiscovered && selectedDiscoveredIds.has(account.id);

                // Unified Tier & Competitor helpers
                const tier = getAccountTier(account.edaEngineersCount);
                const competitor = categorizeCompetitor(account.currentEsamTool);

                return (
                  <tr
                    key={account.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`View dossier for ${account.name}`}
                    className={`hover:bg-slate-50/80 focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer group ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : ''
                    }`}
                    onClick={() => onSelectAccount(account)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectAccount(account);
                      }
                    }}
                  >
                    {/* Multi-Select Row Checkbox */}
                    {isDiscovered && (
                      <td
                        className="w-12 px-3 py-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${account.name}`}
                          checked={selectedDiscoveredIds.has(account.id)}
                          onChange={() => handleToggleSelectRow(account.id)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Account Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{account.name}</span>
                            {account.ticker && (
                              <span className="font-mono text-xs text-slate-400">
                                {account.ticker}
                              </span>
                            )}
                            {(account.isVerified || (account.sourceCitations && account.sourceCitations.length > 0)) && (
                              <span title="Grounded in SEC 10-K & verified license daemons" className="text-emerald-600 inline-flex items-center">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1.5">
                            <span>{account.industry}</span>
                            <span aria-hidden="true">·</span>
                            <span>{account.headcount} employees</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Seat Qualification Tier (Consistent with getAccountTier) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="font-mono tabular-nums text-blue-700">
                          {(account.edaEngineersCount || 0).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500">CAD/EDA seats</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {account.totalEngineersEstimate
                          ? `${account.totalEngineersEstimate.toLocaleString()} total engineers`
                          : account.qualificationStatus || 'Enterprise Footprint'}
                      </div>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tier.badgeClass}`}
                        >
                          {tier.badgeLabel}
                        </span>
                      </div>
                    </td>

                    {/* Engineering Software Stack */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="text-slate-800 font-medium truncate">
                        {Array.isArray(account.edaTools) && account.edaTools.length > 0
                          ? account.edaTools.slice(0, 2).join(', ')
                          : 'EDA/CAD Toolchain'}
                        {Array.isArray(account.edaTools) &&
                          account.edaTools.length > 2 &&
                          ` +${account.edaTools.length - 2}`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        Daemons:{' '}
                        {Array.isArray(account.licenseDaemons) && account.licenseDaemons.length > 0
                          ? account.licenseDaemons.join(' · ')
                          : 'FlexNet'}
                      </div>
                    </td>

                    {/* Incumbent Competitor (Consistent with categorizeCompetitor) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${competitor.dotClass}`} />
                        <span className="font-medium text-slate-800">
                          {competitor.displayName}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        {competitor.wedgeAngle}
                      </div>
                    </td>

                    {/* Renewal Window (With overdue guard) */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isOverdue ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        ) : (
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              isRenewalNear ? 'text-amber-500' : 'text-slate-400'
                            }`}
                          />
                        )}
                        <span
                          className={`font-mono font-medium tabular-nums ${
                            isOverdue
                              ? 'text-rose-700 font-bold'
                              : isRenewalNear
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-700'
                          }`}
                        >
                          {isOverdue
                            ? `${Math.abs(account.renewalDaysLeft)}d overdue`
                            : `${account.renewalDaysLeft} days left`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                        Target: {account.renewalQuarter || 'Upcoming'}
                      </div>
                    </td>

                    {/* Primary Trigger */}
                    <td className="px-4 py-3.5 max-w-sm">
                      <div className="text-slate-800 line-clamp-1 font-medium">
                        {account.primaryTrigger || 'Observed License Signal'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            account.priorityLevel === 'Very High'
                              ? 'text-rose-600'
                              : account.priorityLevel === 'High'
                              ? 'text-amber-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {account.priorityLevel} Priority
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{account.activeSignalsCount || 1} active signals</span>
                      </div>
                    </td>

                    {/* Intent Score */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="font-mono text-base font-bold tabular-nums text-slate-900">
                        {account.compositeScore}
                        <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                        ICP: {account.icpFitScore} · Vel: {account.intentVelocityScore}
                      </div>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-4 py-3.5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {isDiscovered ? (
                          <button
                            type="button"
                            onClick={() => onPromoteDiscoveredAccount(account)}
                            className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Promote to Tracked Target Accounts"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Track Account</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDraftOutreach(account)}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
                            title="Generate Contextual Outreach"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Outreach</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectAccount(account)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="View Full Account Dossier"
                          aria-label={`Open dossier for ${account.name}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-800">
              {activeAccountView === 'discovered'
                ? 'All Discovered Accounts Promoted to Tracked Accounts!'
                : 'No matching accounts found'}
            </div>
            <div className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {activeAccountView === 'discovered' ? (
                <div className="space-y-3 pt-1">
                  <p>
                    All high-intent prospects from this radar sweep have been added to your Active Tracked Accounts roster.
                  </p>
                  <button
                    type="button"
                    onClick={onRunDiscoveryRadar}
                    disabled={isScanningRadar}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {isScanningRadar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Radar className="w-3.5 h-3.5" />
                    )}
                    <span>Scan Radar for Fresh Accounts</span>
                  </button>
                </div>
              ) : (
                'Try adjusting your search terms, industry filters, or priority selections.'
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
