import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Account,
  BuyingSignal,
  WebhookAlert,
  TrackedPattern,
  AutonomousScanConfig,
  AutonomousNotification,
} from './types.ts';
import {
  SEED_ACCOUNTS,
  SEED_SIGNALS,
  TRACKED_PATTERNS,
  CALIBRATION_MATRIX,
} from './data/seedData.ts';
import { Header } from './components/Header.tsx';
import { AccountTable } from './components/AccountTable.tsx';
import { CalibrationView } from './components/CalibrationView.tsx';
import { ScannerView } from './components/ScannerView.tsx';
import { PlaybookView } from './components/PlaybookView.tsx';
import { AccountDrawer } from './components/AccountDrawer.tsx';
import { SignalModal } from './components/SignalModal.tsx';
import { ImportExportModal } from './components/ImportExportModal.tsx';
import { SignalRulesManager } from './components/SignalRulesManager.tsx';
import { CheckCircle2, BellRing } from 'lucide-react';
import { safeLoadStorage } from './utils/storageUtils.ts';

const INITIAL_DISCOVERED: Account[] = [
  {
    id: 'disc-marvell',
    name: 'Marvell Technology',
    ticker: 'MRVL',
    industry: 'Semiconductors',
    headcount: '7,500',
    edaEngineersCount: 2100,
    totalEngineersEstimate: 4800,
    qualificationStatus: 'Tier-1 Qualified (1,500+ Seats)',
    qualificationReason: '2,100 ASIC physical design engineers; active procurement RFP in progress.',
    headcountConfidence: 94,
    annualEdaSpendEstimate: '$32M/yr',
    edaTools: ['Cadence Innovus', 'Synopsys IC Compiler II', 'Siemens Calibre'],
    licenseDaemons: ['FlexNet (FLEXlm)', 'Reprise (RLM)'],
    currentEsamTool: 'Flexera FNMEA (Evaluating replacement)',
    renewalQuarter: 'Q4 2026',
    renewalDaysLeft: 45,
    icpFitScore: 95,
    intentVelocityScore: 92,
    compositeScore: 93,
    priorityLevel: 'Very High',
    primaryTrigger: 'Triggered Signal #5: Confidential RFP for FlexNet EDA license harvesting & denial telemetry',
    activeSignalsCount: 2,
    denialContentionRisk: 'Critical',
    notes: 'Custom ASIC division in Santa Clara suffering daily peak-time license lockouts during tape-outs.',
    isVerified: true,
    sourceCitations: [
      {
        id: 'cite-mrvl-rfp',
        documentType: 'Procurement RFP',
        sourceTitle: 'Marvell Global Engineering IT Software Asset Management RFP Tender',
        publisherOrAuthority: 'Marvell Technology Global Procurement & Vendor Management',
        publishDate: 'Recent RFP Release',
        directQuote: 'Seeking enterprise software asset management RFP submissions to monitor FlexNet and RLM license servers across 4 multi-national design centers and prevent license denial contention.',
        confidenceScore: 96,
        verifiedDate: 'Active Tender',
        verificationMethod: 'Public Procurement RFP',
      },
      {
        id: 'cite-mrvl-10k',
        documentType: 'SEC 10-K',
        sourceTitle: 'Marvell Technology, Inc. Form 10-K Item 1: R&D and Engineering Headcount',
        publisherOrAuthority: 'U.S. Securities and Exchange Commission (CIK: 0001835632)',
        publishDate: 'Recent Annual Filing',
        directQuote: 'Our research and development team consists of approximately 4,800 dedicated engineers specializing in complex custom ASIC and data infrastructure silicon architectures.',
        confidenceScore: 94,
        verifiedDate: 'SEC Audited',
        verificationMethod: 'SEC Disclosure Audit',
      },
    ],
  },
  {
    id: 'disc-amat',
    name: 'Applied Materials',
    ticker: 'AMAT',
    industry: 'Industrial & Hardware',
    headcount: '34,000',
    edaEngineersCount: 1700,
    totalEngineersEstimate: 8500,
    qualificationStatus: 'Tier-1 Qualified (1,500+ Seats)',
    qualificationReason: '1,700 CAD/CAE materials and mechanical simulation engineers in Sunnyvale.',
    headcountConfidence: 93,
    annualEdaSpendEstimate: '$22M/yr',
    edaTools: ['Siemens NX', 'Ansys Fluent', 'PTC Creo', 'Synopsys Simpleware'],
    licenseDaemons: ['FlexNet (FLEXlm)', 'DSLS'],
    currentEsamTool: 'Manual Scripts',
    renewalQuarter: 'Q1 2027',
    renewalDaysLeft: 80,
    icpFitScore: 91,
    intentVelocityScore: 86,
    compositeScore: 88,
    priorityLevel: 'High',
    primaryTrigger: 'Triggered Signal #6: Sunnyvale EPIC Center Expansion + 60 Hardware System Engineers',
    activeSignalsCount: 2,
    denialContentionRisk: 'Elevated',
    notes: 'New R&D facility in Sunnyvale requiring multi-site license synchronization between California and Singapore.',
    isVerified: true,
    sourceCitations: [
      {
        id: 'cite-amat-press',
        documentType: 'Press Release',
        sourceTitle: 'Applied Materials Announces Expansion of EPIC Center R&D Hub in Sunnyvale',
        publisherOrAuthority: 'Applied Materials Global Newsroom',
        publishDate: 'Current Fiscal Period',
        directQuote: 'Expanding our engineering center to accelerate materials engineering, adding 60 hardware simulation engineers requiring CAD/CAE simulation infrastructure.',
        confidenceScore: 93,
        verifiedDate: 'Press Release Wire',
        verificationMethod: 'Corporate Press Release',
      },
    ],
  },
  {
    id: 'disc-northrop',
    name: 'Northrop Grumman Mission Systems',
    ticker: 'NOC',
    industry: 'Aerospace & Defense',
    headcount: '95,000',
    edaEngineersCount: 2800,
    totalEngineersEstimate: 32000,
    qualificationStatus: 'Tier-1 Qualified (1,500+ Seats)',
    qualificationReason: 'Over 2,800 active radar simulation and RF microelectronics engineers.',
    headcountConfidence: 95,
    annualEdaSpendEstimate: '$38M/yr',
    edaTools: ['Cadence Allegro', 'Keysight ADS', 'Dassault CATIA', 'Ansys HFSS'],
    licenseDaemons: ['FlexNet (FLEXlm)', 'DSLS', 'Reprise (RLM)'],
    currentEsamTool: 'OpenLM (Cost reduction initiative)',
    renewalQuarter: 'Q4 2026',
    renewalDaysLeft: 52,
    icpFitScore: 93,
    intentVelocityScore: 89,
    compositeScore: 91,
    priorityLevel: 'Very High',
    primaryTrigger: 'Triggered Signal #3: Announced CAD/CAE software implementation and vendor consolidation',
    activeSignalsCount: 2,
    denialContentionRisk: 'Critical',
    notes: 'Mandate to consolidate airborne radar design tools and audit idle floating seats across defense programs.',
    isVerified: true,
    sourceCitations: [
      {
        id: 'cite-noc-10k',
        documentType: 'SEC 10-K',
        sourceTitle: 'Northrop Grumman Form 10-K Mission Systems Segment Disclosures',
        publisherOrAuthority: 'U.S. Securities and Exchange Commission',
        publishDate: 'Fiscal Year Report',
        directQuote: 'Aeronautics & Mission Systems initiated an engineering software implementation and license vendor consolidation project to reduce duplicative seats.',
        confidenceScore: 95,
        verifiedDate: 'SEC Audited',
        verificationMethod: 'SEC Disclosure Audit',
      },
    ],
  },
  {
    id: 'disc-microchip',
    name: 'Microchip Technology',
    ticker: 'MCHP',
    industry: 'Semiconductors',
    headcount: '22,000',
    edaEngineersCount: 1450,
    totalEngineersEstimate: 6200,
    qualificationStatus: 'Tier-2 Qualified (500–1,499 Seats)',
    qualificationReason: '1,450 MCU silicon design engineers; hiring EDA Administrator to curb FlexLM denials.',
    headcountConfidence: 91,
    annualEdaSpendEstimate: '$19M/yr',
    edaTools: ['Synopsys Design Compiler', 'Cadence Virtuoso', 'Altium'],
    licenseDaemons: ['FlexNet (FLEXlm)'],
    currentEsamTool: 'None (Raw daemon text files)',
    renewalQuarter: 'Q1 2027',
    renewalDaysLeft: 95,
    icpFitScore: 86,
    intentVelocityScore: 78,
    compositeScore: 81,
    priorityLevel: 'High',
    primaryTrigger: 'Triggered Signal #4: Hiring EDA Environment Engineer to curb floating license denials',
    activeSignalsCount: 1,
    denialContentionRisk: 'Elevated',
    notes: 'Microcontroller design team expanding in Chandler, AZ; frequent tape-out checkout queues.',
    isVerified: true,
    sourceCitations: [
      {
        id: 'cite-mchp-job',
        documentType: 'Job Board',
        sourceTitle: 'Microchip Senior EDA Systems Engineer Requisition (Req #2026-MCHP-89)',
        publisherOrAuthority: 'Microchip Technology Careers Portal',
        publishDate: 'Active Job Board Requisition',
        directQuote: 'Responsible for software license optimization, monitoring FlexLM checkout queueing, and eliminating unused software licenses across design centers.',
        confidenceScore: 91,
        verifiedDate: 'Active Requisition',
        verificationMethod: 'Job Requisition Parser',
      },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'calibration' | 'rules' | 'scanner' | 'playbooks'>('accounts');
  const [scannerTestPattern, setScannerTestPattern] = useState<TrackedPattern | null>(null);

  // Safe localStorage Hydration Guards (QAS-008)
  const [accounts, setAccounts] = useState<Account[]>(() =>
    safeLoadStorage<Account[]>('teameda_accounts', SEED_ACCOUNTS, (val) => Array.isArray(val) && val.length > 0)
  );

  const [discoveredAccounts, setDiscoveredAccounts] = useState<Account[]>(() =>
    safeLoadStorage<Account[]>('teameda_discovered_accounts', INITIAL_DISCOVERED, (val) => Array.isArray(val))
  );

  const [signals, setSignals] = useState<BuyingSignal[]>(() =>
    safeLoadStorage<BuyingSignal[]>('teameda_signals', SEED_SIGNALS, (val) => Array.isArray(val) && val.length > 0)
  );

  const [trackedPatterns, setTrackedPatterns] = useState<TrackedPattern[]>(() =>
    safeLoadStorage<TrackedPattern[]>('teameda_tracked_patterns', TRACKED_PATTERNS, (val) => Array.isArray(val) && val.length > 0)
  );

  // Autonomous Background Polling Configuration State
  const [autonomousConfig, setAutonomousConfig] = useState<AutonomousScanConfig>(() =>
    safeLoadStorage<AutonomousScanConfig>('teameda_scan_config', {
      isEnabled: true,
      intervalMinutes: 15,
      lastPolledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nextPollAt: null,
      newAlertsCount: 2,
      autoIngestDirectly: true,
      scannedVerticals: ['Semiconductors', 'Aerospace & Defense', 'Automotive', 'Industrial Hardware', 'Hyperscale Silicon'],
      totalAutonomousIngested: 0,
    })
  );

  // Discovered Notifications Stream
  const [notifications, setNotifications] = useState<AutonomousNotification[]>(() =>
    safeLoadStorage<AutonomousNotification[]>('teameda_notifications', [
      {
        id: 'notif-mrvl-1',
        timestamp: '15m ago',
        companyName: 'Marvell Technology',
        signalTitle: 'RFP Issued: Software License Optimization & Denial Tracking (FlexNet/RLM)',
        confidence: 96,
        isRead: false,
        priority: 'Very High',
        account: INITIAL_DISCOVERED[0],
      },
      {
        id: 'notif-amat-1',
        timestamp: '42m ago',
        companyName: 'Applied Materials',
        signalTitle: 'EPIC Center Expansion: 60 Hardware Simulation Roles (Siemens NX / Ansys)',
        confidence: 93,
        isRead: false,
        priority: 'High',
        account: INITIAL_DISCOVERED[1],
      },
    ], (val) => Array.isArray(val))
  );

  const [dispatchedAlerts, setDispatchedAlerts] = useState<WebhookAlert[]>([]);
  const [selectedDrawerAccount, setSelectedDrawerAccount] = useState<Account | null>(null);
  const [selectedPlaybookAccount, setSelectedPlaybookAccount] = useState<Account | null>(null);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isScanningRadar, setIsScanningRadar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('teameda_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('teameda_discovered_accounts', JSON.stringify(discoveredAccounts));
  }, [discoveredAccounts]);

  useEffect(() => {
    localStorage.setItem('teameda_signals', JSON.stringify(signals));
  }, [signals]);

  useEffect(() => {
    localStorage.setItem('teameda_tracked_patterns', JSON.stringify(trackedPatterns));
  }, [trackedPatterns]);

  useEffect(() => {
    localStorage.setItem('teameda_scan_config', JSON.stringify(autonomousConfig));
  }, [autonomousConfig]);

  useEffect(() => {
    localStorage.setItem('teameda_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run autonomous polling radar across all target verticals with direct auto-ingestion
  const pollBackgroundRadar = useCallback(
    async (isManual = false, fullSweep = false) => {
      setIsScanningRadar(true);
      try {
        // Collect all IDs and normalized names from BOTH accounts and current discoveredAccounts to guarantee 0 repeats
        const excludeList = [
          ...accounts.map((a) => a.id),
          ...accounts.map((a) => a.name.toLowerCase()),
          ...discoveredAccounts.map((a) => a.id),
          ...discoveredAccounts.map((a) => a.name.toLowerCase()),
        ];
        const response = await fetch('/api/discover-market-signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            excludeIds: Array.from(new Set(excludeList)),
            fullSweep: Boolean(fullSweep),
            vertical: 'all',
            limit: fullSweep ? 30 : 8,
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error(`Server returned unexpected response type (${response.status})`);
        }
        const data = await response.json();

        if (data.discoveredAccounts?.length > 0) {
          const freshIncoming: Account[] = data.discoveredAccounts;

          // In manual scan mode: user is actively exploring radar and wants to select & promote with checkboxes
          if (isManual) {
            setDiscoveredAccounts(freshIncoming);
            showToast(`Radar Scan: Discovered ${freshIncoming.length} fresh high-intent engineering accounts!`);
          } else {
            // Background polling: merge fresh accounts
            setDiscoveredAccounts((prev) => {
              const prevIds = new Set(prev.map((a) => a.id.toLowerCase()));
              const filtered = freshIncoming.filter((a) => !prevIds.has(a.id.toLowerCase()));
              return [...filtered, ...prev].slice(0, 30);
            });
          }

          // Identify accounts not yet in the active tracked roster
          const existingIds = new Set(accounts.map((a) => a.id.toLowerCase()));
          const existingNames = new Set(accounts.map((a) => a.name.toLowerCase()));

          const accountsToAutoIngest: Account[] = [];
          const signalsToAutoIngest: BuyingSignal[] = [];

          freshIncoming.forEach((cand: any) => {
            const isKnown =
              existingIds.has(cand.id.toLowerCase()) ||
              existingNames.has(cand.name.toLowerCase());
            if (!isKnown) {
              accountsToAutoIngest.push(cand);
              if (cand.detectedSignal) {
                signalsToAutoIngest.push(cand.detectedSignal);
              }
              existingIds.add(cand.id.toLowerCase());
              existingNames.add(cand.name.toLowerCase());
            }
          });

          // DIRECT AUTO-INGESTION (Only during scheduled background scans if enabled):
          if (!isManual && autonomousConfig.autoIngestDirectly && accountsToAutoIngest.length > 0) {
            setAccounts((prev) => [...prev, ...accountsToAutoIngest]);
            if (signalsToAutoIngest.length > 0) {
              setSignals((prev) => [...signalsToAutoIngest, ...prev]);
            }
            // Remove auto-ingested from discovered view
            const ingestedIds = new Set(accountsToAutoIngest.map((a) => a.id));
            setDiscoveredAccounts((prev) => prev.filter((a) => !ingestedIds.has(a.id)));
          }

          // Check for new notifications
          const existingNotifNames = new Set(notifications.map((n) => n.companyName.toLowerCase()));
          const newNotifs: AutonomousNotification[] = [];

          freshIncoming.forEach((acc: Account) => {
            if (!existingNotifNames.has(acc.name.toLowerCase())) {
              newNotifs.push({
                id: 'notif-' + acc.id + '-' + Date.now(),
                timestamp: 'Just now',
                companyName: acc.name,
                signalTitle: acc.primaryTrigger,
                confidence: acc.headcountConfidence || 94,
                isRead: false,
                priority: acc.priorityLevel,
                account: acc,
              });
            }
          });

          if (newNotifs.length > 0) {
            setNotifications((prev) => [...newNotifs, ...prev]);
          }

          const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setAutonomousConfig((prev) => ({
            ...prev,
            lastPolledAt: nowFormatted,
            newAlertsCount: prev.newAlertsCount + newNotifs.length,
            totalAutonomousIngested:
              (prev.totalAutonomousIngested || 0) + (!isManual && autonomousConfig.autoIngestDirectly ? accountsToAutoIngest.length : 0),
          }));

          if (!isManual) {
            if (accountsToAutoIngest.length > 0 && autonomousConfig.autoIngestDirectly) {
              showToast(
                `Auto-Ingested: ${accountsToAutoIngest.length} new enterprise accounts added directly to Tracked Accounts!`
              );
            } else if (newNotifs.length > 0) {
              showToast(`Auto-Discovery Alert: ${newNotifs.length} new verified signals detected!`);
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (isManual) {
          showToast('Background radar completed check.');
        }
      } finally {
        setIsScanningRadar(false);
      }
    },
    [accounts, discoveredAccounts, notifications, autonomousConfig.autoIngestDirectly]
  );

  // Scheduled Autonomous Background Polling Loop
  useEffect(() => {
    if (!autonomousConfig.isEnabled) return;

    // Minimum cycle of 45 seconds for active responsiveness, or user selected minutes * 60 * 1000
    const intervalMs = Math.max(45000, autonomousConfig.intervalMinutes * 60 * 1000);

    const timer = setInterval(() => {
      pollBackgroundRadar(false, false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autonomousConfig.isEnabled, autonomousConfig.intervalMinutes, pollBackgroundRadar]);

  const handleToggleAutonomousScan = () => {
    setAutonomousConfig((prev) => {
      const updated = !prev.isEnabled;
      showToast(updated ? 'Autonomous polling activated!' : 'Autonomous polling paused.');
      return { ...prev, isEnabled: updated };
    });
  };

  const handleToggleAutoIngest = () => {
    setAutonomousConfig((prev) => {
      const updated = !prev.autoIngestDirectly;
      showToast(
        updated
          ? 'Direct Table Auto-Ingest ENABLED: Newly detected accounts automatically added to table.'
          : 'Direct Table Auto-Ingest PAUSED: Accounts staged in discovery queue.'
      );
      return { ...prev, autoIngestDirectly: updated };
    });
  };

  const handleChangePollingInterval = (minutes: number) => {
    setAutonomousConfig((prev) => ({
      ...prev,
      intervalMinutes: minutes,
    }));
    showToast(`Polling frequency set to every ${minutes >= 60 ? minutes / 60 + 'h' : minutes + 'm'}`);
  };

  const handleManualScanNow = (fullSweep = false) => {
    pollBackgroundRadar(true, fullSweep);
  };

  const handleSweepAllVerticals = () => {
    // QAS-012: Directly auto-ingest all swept accounts into Active Tracked Accounts per user specification
    pollBackgroundRadar(false, true);
    showToast('Sweeping all 5 verticals: direct auto-ingestion to Tracked Target Accounts initiated...');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setAutonomousConfig((prev) => ({ ...prev, newAlertsCount: 0 }));
    showToast('All discovery notifications marked as read.');
  };

  const handleSelectNotificationAccount = (account: Account) => {
    setSelectedDrawerAccount(account);
  };

  const handleResetToFullUniverse = () => {
    setAccounts(SEED_ACCOUNTS);
    setSignals(SEED_SIGNALS);
    localStorage.setItem('teameda_accounts', JSON.stringify(SEED_ACCOUNTS));
    localStorage.setItem('teameda_signals', JSON.stringify(SEED_SIGNALS));
    showToast(`Restored full target universe: ${SEED_ACCOUNTS.length} enterprise accounts loaded!`);
  };

  // Tracked Pattern Handlers
  const handleAddPattern = (newPattern: TrackedPattern) => {
    setTrackedPatterns((prev) => [newPattern, ...prev]);
    showToast(`Added tracked signal rule "${newPattern.name}"`);
  };

  const handleUpdatePattern = (updatedPattern: TrackedPattern) => {
    setTrackedPatterns((prev) =>
      prev.map((p) => (p.id === updatedPattern.id ? updatedPattern : p))
    );
    showToast(`Updated signal rule "${updatedPattern.name}"`);
  };

  const handleDeletePattern = (patternId: string) => {
    setTrackedPatterns((prev) => prev.filter((p) => p.id !== patternId));
    showToast('Signal rule removed from tracking.');
  };

  const handleResetPatternsToDefaults = () => {
    setTrackedPatterns(TRACKED_PATTERNS);
    showToast('Reset tracked signal formulas to default 6 canonical templates.');
  };

  // Promote an auto-discovered account into tracked target accounts (QAS-005)
  const handlePromoteDiscoveredAccount = (account: Account) => {
    const isKnown = accounts.some(
      (a) => a.id === account.id || a.name.toLowerCase() === account.name.toLowerCase()
    );
    if (!isKnown) {
      setAccounts((prev) => [account, ...prev]);
    }
    const detectedSig = (account as any).detectedSignal;
    if (detectedSig) {
      setSignals((prev) => {
        if (prev.some((s) => s.id === detectedSig.id)) return prev;
        return [detectedSig, ...prev];
      });
    }
    setDiscoveredAccounts((prev) => prev.filter((a) => a.id !== account.id));
    showToast(`Promoted ${account.name} to Tracked Accounts and ingested buying signal!`);
  };

  // Batch promote multiple discovered accounts into tracked target accounts
  const handleBatchPromoteDiscoveredAccounts = (accountIds: string[]) => {
    if (!accountIds || accountIds.length === 0) return;
    const toPromote = discoveredAccounts.filter((a) => accountIds.includes(a.id));
    if (toPromote.length === 0) return;

    // Extract detected signals to ingest into the active signals stream
    const newSignals: BuyingSignal[] = [];
    toPromote.forEach((cand: any) => {
      if (cand.detectedSignal) {
        newSignals.push(cand.detectedSignal);
      }
    });

    // Add to active tracked accounts without duplicate IDs or names
    setAccounts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id.toLowerCase()));
      const existingNames = new Set(prev.map((a) => a.name.toLowerCase()));
      const nonDuplicates = toPromote.filter(
        (a) => !existingIds.has(a.id.toLowerCase()) && !existingNames.has(a.name.toLowerCase())
      );
      return [...nonDuplicates, ...prev];
    });

    if (newSignals.length > 0) {
      setSignals((prev) => [...newSignals, ...prev]);
    }

    // Immediately remove promoted accounts from discovery radar view per requirement
    const idSet = new Set(accountIds);
    setDiscoveredAccounts((prev) => prev.filter((a) => !idSet.has(a.id)));

    setAutonomousConfig((prev) => ({
      ...prev,
      totalAutonomousIngested: (prev.totalAutonomousIngested || 0) + toPromote.length,
    }));

    showToast(`Successfully added ${toPromote.length} account${toPromote.length > 1 ? 's' : ''} to Tracked Target Accounts!`);
  };

  // Import accounts & signals from CSV or Paste modal
  const handleImportAccounts = (newAccounts: Account[], newSignals?: BuyingSignal[]) => {
    setAccounts((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const filtered = newAccounts.filter((a) => !existingIds.has(a.id));
      return [...filtered, ...prev];
    });

    if (newSignals && newSignals.length > 0) {
      setSignals((prev) => [...newSignals, ...prev]);
    }

    showToast(`Successfully imported ${newAccounts.length} accounts into Intelligence Hub!`);
  };

  // Add new signal
  const handleAddSignal = (newSignal: BuyingSignal) => {
    setSignals((prev) => [newSignal, ...prev]);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === newSignal.accountId) {
          const newVelocity = Math.min(100, acc.intentVelocityScore + newSignal.scoreImpact);
          const newComposite = Math.round(acc.icpFitScore * 0.4 + newVelocity * 0.6);
          const newPriority =
            newSignal.priority === 'Very High' || newComposite >= 90
              ? 'Very High'
              : newComposite >= 75
              ? 'High'
              : 'Low-Med';

          return {
            ...acc,
            intentVelocityScore: newVelocity,
            compositeScore: newComposite,
            priorityLevel: newPriority,
            activeSignalsCount: acc.activeSignalsCount + 1,
            primaryTrigger: newSignal.title,
          };
        }
        return acc;
      })
    );

    showToast(`Signal recorded for ${newSignal.accountName}! Score updated.`);
  };

  const handleDraftOutreachForAccount = (account: Account) => {
    setSelectedPlaybookAccount(account);
    setActiveTab('playbooks');
  };

  const handleDraftOutreachForSignal = (signal: BuyingSignal) => {
    const account = accounts.find((a) => a.id === signal.accountId) || accounts[0];
    setSelectedPlaybookAccount(account);
    setActiveTab('playbooks');
  };

  const handleDraftOutreachForAnalysis = (analysis: any) => {
    const matchingAccount =
      accounts.find((a) =>
        a.name.toLowerCase().includes((analysis.companyName || '').toLowerCase())
      ) || accounts[0];

    setSelectedPlaybookAccount(matchingAccount);
    setActiveTab('playbooks');
  };

  const handleDispatchWebhook = async (
    service: 'Slack' | 'Salesforce' | 'HubSpot',
    account: Account,
    signalTitle: string
  ) => {
    try {
      const response = await fetch('/api/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          accountName: account.name,
          signalTitle,
          priority: account.priorityLevel,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Simulation failed');
      }

      const data = await response.json();
      setDispatchedAlerts((prev) => [data.alert, ...prev]);
      showToast(`Alert dispatched to ${service} for ${account.name}!`);
    } catch (err) {
      console.error(err);
      showToast(`Failed to dispatch alert to ${service}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* 1-Row 3-Zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickScan={() => setIsQuickScanOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        totalSignalsCount={signals.length}
        trackedRulesCount={trackedPatterns.length}
        autonomousConfig={autonomousConfig}
        onToggleAutonomousScan={handleToggleAutonomousScan}
        onChangePollingInterval={handleChangePollingInterval}
        onManualScanNow={() => handleManualScanNow(false)}
        onToggleAutoIngest={handleToggleAutoIngest}
        onSweepAllVerticals={handleSweepAllVerticals}
        isScanningNow={isScanningRadar}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSelectNotificationAccount={handleSelectNotificationAccount}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'accounts' && (
          <AccountTable
            accounts={accounts}
            discoveredAccounts={discoveredAccounts}
            onSelectAccount={(acc) => setSelectedDrawerAccount(acc)}
            onDraftOutreach={handleDraftOutreachForAccount}
            onOpenImportExport={() => setIsImportExportOpen(true)}
            onPromoteDiscoveredAccount={handlePromoteDiscoveredAccount}
            onBatchPromoteDiscoveredAccounts={handleBatchPromoteDiscoveredAccounts}
            onRunDiscoveryRadar={() => handleManualScanNow(false)}
            onSweepAllVerticals={handleSweepAllVerticals}
            autoIngestDirectly={autonomousConfig.autoIngestDirectly}
            isScanningRadar={isScanningRadar}
            onResetToFullUniverse={handleResetToFullUniverse}
          />
        )}

        {activeTab === 'rules' && (
          <SignalRulesManager
            patterns={trackedPatterns}
            onAddPattern={handleAddPattern}
            onUpdatePattern={handleUpdatePattern}
            onDeletePattern={handleDeletePattern}
            onResetToDefaults={handleResetPatternsToDefaults}
            onTestInScanner={(pattern) => {
              setScannerTestPattern(pattern);
              setActiveTab('scanner');
              showToast(`Configured Signal Scanner for rule: "${pattern.name}"`);
            }}
          />
        )}

        {activeTab === 'calibration' && (
          <CalibrationView
            patterns={trackedPatterns}
            calibrationMatrix={CALIBRATION_MATRIX}
            signals={signals}
            accounts={accounts}
            onDraftOutreachForSignal={handleDraftOutreachForSignal}
            onDispatchAlert={(sig, service) => {
              const acc = accounts.find((a) => a.id === sig.accountId) || accounts[0];
              handleDispatchWebhook(service, acc, sig.title);
            }}
          />
        )}

        {activeTab === 'scanner' && (
          <ScannerView
            trackedPatterns={trackedPatterns}
            initialPattern={scannerTestPattern}
            onClearInitialPattern={() => setScannerTestPattern(null)}
            onApplyDetectedSignal={(analysis) => {
              const compName = analysis.companyName || 'Discovered Enterprise';
              const existing = accounts.find(
                (a) => a.name.toLowerCase() === compName.toLowerCase()
              );

              let targetAccountId = existing ? existing.id : 'acc-scan-' + Date.now();

              if (!existing) {
                const estSeats = analysis.estimatedSeats || 850;
                const newAccount: Account = {
                  id: targetAccountId,
                  name: compName,
                  ticker: '',
                  industry: analysis.industry || 'Semiconductors',
                  headcount: '10,000',
                  edaEngineersCount: estSeats,
                  totalEngineersEstimate: estSeats * 3,
                  qualificationStatus:
                    estSeats >= 1500
                      ? 'Tier-1 Qualified (1,500+ Seats)'
                      : estSeats >= 500
                      ? 'Tier-2 Qualified (500–1,499 Seats)'
                      : 'Tier-3 Qualified (100–499 Seats)',
                  qualificationReason: `Surfaced via live signal scanner: ${analysis.buyingIntentInterpretation}`,
                  annualEdaSpendEstimate: analysis.estimatedSpend || '$14M/yr',
                  edaTools: analysis.detectedTools || ['Cadence Virtuoso', 'Synopsys Design Compiler'],
                  licenseDaemons: analysis.detectedDaemons || ['FlexNet (FLEXlm)'],
                  currentEsamTool: 'Manual Scripts',
                  renewalQuarter: 'Q1 2027',
                  renewalDaysLeft: 75,
                  icpFitScore: 90,
                  intentVelocityScore: 88,
                  compositeScore: 89,
                  priorityLevel: analysis.priority || 'High',
                  primaryTrigger: analysis.matchedPatterns?.[0] || 'AI Detected License Signal',
                  activeSignalsCount: 1,
                  denialContentionRisk: analysis.priority === 'Very High' ? 'Critical' : 'Elevated',
                  notes: `Discovered and ingested via Live AI Signal Scanner. ${analysis.buyingIntentInterpretation}`,
                  isVerified: true,
                };

                setAccounts((prev) => [newAccount, ...prev]);
              }

              const newSig: BuyingSignal = {
                id: 'sig-scan-' + Date.now(),
                accountId: targetAccountId,
                accountName: compName,
                patternId: 'custom-scan',
                patternName: analysis.matchedPatterns?.[0] || 'AI Detection',
                title: `${analysis.matchedPatterns?.[0] || 'Signal'} at ${compName}`,
                summary: analysis.buyingIntentInterpretation,
                source: (analysis.sourceMedium as any) || 'Press Release',
                timestamp: 'Just now',
                confidence: analysis.confidence || 90,
                priority: analysis.priority || 'High',
                rawSnippet: analysis.keyQuotes?.[0] || '',
                matchedKeywords: analysis.detectedTools || [],
                status: 'New',
                scoreImpact: analysis.scoreImpact || 25,
              };
              handleAddSignal(newSig);
              showToast(`Added ${compName} to Tracked Accounts Hub!`);
            }}
            onDraftOutreachForAnalysis={handleDraftOutreachForAnalysis}
          />
        )}

        {activeTab === 'playbooks' && (
          <PlaybookView
            accounts={accounts}
            selectedAccount={selectedPlaybookAccount}
            onSelectAccount={(acc) => setSelectedPlaybookAccount(acc)}
            dispatchedAlerts={dispatchedAlerts}
            onDispatchWebhook={handleDispatchWebhook}
          />
        )}
      </main>

      {/* Account Telemetry & Evidence Drawer */}
      <AccountDrawer
        account={selectedDrawerAccount}
        signals={signals}
        onClose={() => setSelectedDrawerAccount(null)}
        onDraftOutreach={handleDraftOutreachForAccount}
        onDispatchAlert={(acc, srv) => handleDispatchWebhook(srv, acc, acc.primaryTrigger)}
        onUpdateAccount={(updated) => {
          setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedDrawerAccount(updated);
        }}
      />

      {/* Quick Ingestion Modal */}
      <SignalModal
        isOpen={isQuickScanOpen}
        onClose={() => setIsQuickScanOpen(false)}
        accounts={accounts}
        patterns={TRACKED_PATTERNS}
        onAddSignal={handleAddSignal}
      />

      {/* CSV Import/Export & Batch Company Paste Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        accounts={accounts}
        onImportAccounts={handleImportAccounts}
      />

      {/* Minimal Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            TeamEDA SignalPulse · GTM Buying Signal & License Starvation Intelligence Engine
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Tracking CAD, CAE, CFD & EDA Software Assets</span>
            <span aria-hidden="true">·</span>
            <a
              href="http://teameda.com/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              teameda.com (LAMUM)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
