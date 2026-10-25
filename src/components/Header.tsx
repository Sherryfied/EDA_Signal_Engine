import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Sparkles,
  Upload,
  Bell,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AutonomousScanConfig, AutonomousNotification, Account } from '../types.ts';

interface HeaderProps {
  activeTab: 'accounts' | 'calibration' | 'rules' | 'scanner' | 'playbooks';
  setActiveTab: (tab: 'accounts' | 'calibration' | 'rules' | 'scanner' | 'playbooks') => void;
  onOpenQuickScan: () => void;
  onOpenImportExport: () => void;
  totalSignalsCount: number;
  trackedRulesCount: number;
  // Autonomous polling & notifications
  autonomousConfig: AutonomousScanConfig;
  onToggleAutonomousScan: () => void;
  onChangePollingInterval: (minutes: number) => void;
  onManualScanNow: () => void;
  onToggleAutoIngest?: () => void;
  onSweepAllVerticals?: () => void;
  isScanningNow: boolean;
  notifications: AutonomousNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSelectNotificationAccount: (account: Account) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickScan,
  onOpenImportExport,
  totalSignalsCount,
  trackedRulesCount,
  autonomousConfig,
  onToggleAutonomousScan,
  onChangePollingInterval,
  onManualScanNow,
  onToggleAutoIngest,
  onSweepAllVerticals,
  isScanningNow,
  notifications,
  onMarkNotificationAsRead,
  onMarkAllNotificationsRead,
  onSelectNotificationAccount,
}) => {
  const [isIntervalMenuOpen, setIsIntervalMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const intervalMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        intervalMenuRef.current &&
        !intervalMenuRef.current.contains(event.target as Node)
      ) {
        setIsIntervalMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const intervalLabels: Record<number, string> = {
    15: 'Every 15m',
    60: 'Every 1h',
    360: 'Every 6h',
    1440: 'Daily (24h)',
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-sm tracking-wider shadow-xs">
              EDA
            </div>
            <a
              href="#accounts"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('accounts');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-blue-600 transition-colors"
            >
              TeamEDA <span className="text-blue-600">SignalPulse</span>
            </a>
            <span className="hidden lg:inline-block text-xs font-mono text-slate-400 pl-2 border-l border-slate-200">
              LAMUM GTM Engine
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('accounts')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'accounts'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Account Intelligence
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rules'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>Tracked Signals & Rules</span>
              <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                {trackedRulesCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calibration')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calibration'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <span>Live Stream & Calibration</span>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                {totalSignalsCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'scanner'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Live AI Scanner</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('playbooks')}
              className={`transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 cursor-pointer ${
                activeTab === 'playbooks'
                  ? 'border-blue-600 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Playbooks & Routing
            </button>
          </nav>

          {/* Zone 3: Autonomous Polling Status & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Autonomous Polling Widget */}
            <div className="relative hidden xl:flex items-center" ref={intervalMenuRef}>
              <div className="flex items-center text-xs bg-slate-50 border border-slate-200 rounded-md p-1 shadow-xs">
                {/* Active Indicator & Toggle */}
                <button
                  type="button"
                  onClick={onToggleAutonomousScan}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
                  title={
                    autonomousConfig.isEnabled
                      ? 'Autonomous scanning active. Click to pause.'
                      : 'Autonomous scanning paused. Click to resume.'
                  }
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      autonomousConfig.isEnabled
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-medium text-[11px]">
                    {autonomousConfig.isEnabled ? 'Auto-Poll' : 'Paused'}
                  </span>
                </button>

                <span className="text-slate-200 mx-1">|</span>

                {/* Direct Table Auto-Ingest Status */}
                {onToggleAutoIngest && (
                  <>
                    <button
                      type="button"
                      onClick={onToggleAutoIngest}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        autonomousConfig.autoIngestDirectly
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                      title={
                        autonomousConfig.autoIngestDirectly
                          ? 'Direct Table Auto-Ingest: Enabled. Detected accounts automatically added to Tracked Accounts.'
                          : 'Direct Table Auto-Ingest: Staging only. Click to enable direct table addition.'
                      }
                    >
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{autonomousConfig.autoIngestDirectly ? 'Auto-Ingest: ON' : 'Staged'}</span>
                    </button>
                    <span className="text-slate-200 mx-1">|</span>
                  </>
                )}

                {/* Interval Selector */}
                <button
                  type="button"
                  onClick={() => setIsIntervalMenuOpen(!isIntervalMenuOpen)}
                  className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span>{intervalLabels[autonomousConfig.intervalMinutes] || '15m'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Run Scan Now */}
                <button
                  type="button"
                  onClick={onManualScanNow}
                  disabled={isScanningNow}
                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 cursor-pointer ml-1"
                  title="Run background signal polling now"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin text-blue-600' : ''}`}
                  />
                </button>
              </div>

              {/* Interval Dropdown */}
              {isIntervalMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                    <span>Background Polling</span>
                    <span className="text-emerald-600 font-bold">5 Verticals</span>
                  </div>
                  {[15, 60, 360, 1440].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        onChangePollingInterval(mins);
                        setIsIntervalMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        autonomousConfig.intervalMinutes === mins
                          ? 'font-semibold text-blue-600 bg-blue-50/50'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{intervalLabels[mins]}</span>
                      {autonomousConfig.intervalMinutes === mins && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </button>
                  ))}

                  {/* Sweep All Verticals Action */}
                  {onSweepAllVerticals && (
                    <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsIntervalMenuOpen(false);
                          onSweepAllVerticals();
                        }}
                        disabled={isScanningNow}
                        className="w-full text-left px-2 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>Sweep All 5 Target Verticals</span>
                        <Radio className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                  )}

                  <div className="px-3 py-1.5 text-[10px] text-slate-400 border-t border-slate-100 mt-1 space-y-0.5">
                    <div>Scans: Semiconductors, Aero, Auto, Defense, Hyperscale</div>
                    <div className="text-emerald-600 font-medium">Direct Auto-Ingest: {autonomousConfig.autoIngestDirectly ? 'Enabled' : 'Paused'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell with Badge */}
            <div className="relative" ref={notificationMenuRef}>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Continuous Market Signals & Intake Alerts"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">Market Signals & Alerts</span>
                      {unreadCount > 0 && (
                        <span className="font-mono text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={onMarkAllNotificationsRead}
                        className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3 transition-colors hover:bg-slate-50 ${
                            !item.isRead ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900 truncate">
                              {item.companyName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {item.timestamp}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                            {item.signalTitle}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60">
                            <span className="text-[10px] font-mono text-emerald-600 font-medium">
                              Confidence: {item.confidence}%
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onMarkNotificationAsRead(item.id);
                                onSelectNotificationAccount(item.account);
                                setIsNotificationOpen(false);
                              }}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                            >
                              <span>Inspect Evidence</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400">
                        <Clock className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p>No new autonomous signals detected.</p>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified signals via autonomous radar</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onManualScanNow();
                        setIsNotificationOpen(false);
                      }}
                      className="font-semibold text-blue-600 hover:underline cursor-pointer"
                    >
                      Scan Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Import / Export */}
            <button
              type="button"
              onClick={onOpenImportExport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Import or Export CSV & Paste Company Search"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import / Export</span>
            </button>

            {/* Quick Ingest Signal */}
            <button
              type="button"
              onClick={onOpenQuickScan}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Ingest Signal</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-2 py-2 overflow-x-auto border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === 'accounts' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Accounts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === 'rules' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rules ({trackedRulesCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calibration')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === 'calibration' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Signals ({totalSignalsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === 'scanner' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            AI Scanner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playbooks')}
            className={`px-3 py-1 rounded whitespace-nowrap ${
              activeTab === 'playbooks' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Playbooks
          </button>
          <button
            type="button"
            onClick={onOpenImportExport}
            className="px-3 py-1 rounded whitespace-nowrap text-blue-600 hover:bg-blue-50 font-medium"
          >
            Import/Export
          </button>
        </div>
      </div>
    </header>
  );
};
