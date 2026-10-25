/**
 * Core type definitions for TeamEDA SignalPulse
 */

export type PriorityLevel = 'Very High' | 'High' | 'Low-Med' | 'Low';

export type SignalSource = 
  | 'SEC 10-K' 
  | 'Job Board' 
  | 'Job Requisition'
  | 'Press Release' 
  | 'G2 / Dark Funnel' 
  | 'Website Telemetry' 
  | 'Call Transcript'
  | 'Procurement RFP';

export interface TrackedPattern {
  id: string;
  name: string;
  rawQuery: string;
  interpretation: string;
  priority: PriorityLevel;
  weight: number;
  regexPatterns: string[];
  isNoiseFilter?: boolean;
  isExpansionMultiplier?: boolean;
}

export interface BuyingSignal {
  id: string;
  accountId: string;
  accountName: string;
  patternId: string;
  patternName: string;
  title: string;
  summary: string;
  source: SignalSource;
  timestamp: string;
  confidence: number; // 0 - 100
  priority: PriorityLevel;
  rawSnippet: string;
  matchedKeywords: string[];
  status: 'New' | 'Actioned' | 'Snoozed';
  scoreImpact: number;
}

export type QualificationStatus =
  | 'Tier-1 Qualified (1,500+ Seats)'
  | 'Tier-2 Qualified (500–1,499 Seats)'
  | 'Tier-3 Qualified (100–499 Seats)'
  | 'Under Threshold (<100 Seats)';

export interface DepartmentBreakdown {
  asicChipDesign?: number;
  cadMechanical?: number;
  caeSimulation?: number;
  firmwareEmbedded?: number;
  softwareAi?: number;
}

export interface SourceCitation {
  id: string;
  documentType: SignalSource;
  sourceTitle: string;
  publisherOrAuthority: string;
  publishDate: string;
  verifiableUrl?: string;
  directQuote: string;
  confidenceScore: number;
  verifiedDate: string;
  verificationMethod:
    | 'SEC Disclosure Audit'
    | 'Daemon Architecture Standard'
    | 'Job Requisition Parser'
    | 'Public Procurement RFP'
    | 'Corporate Press Release'
    | 'Corporate RFP Disclosure'
    | 'DoD Procurement Tender'
    | 'Active Job Requisition';
}

export type TargetIndustry =
  | 'Semiconductors'
  | 'Aerospace & Defense'
  | 'Automotive & EV'
  | 'Automotive & Mobility'
  | 'Industrial & Hardware'
  | 'Hyperscale Silicon'
  | 'Hyperscale & Computing';

export interface Account {
  id: string;
  name: string;
  ticker?: string;
  industry: TargetIndustry;
  headcount: string;
  edaEngineersCount: number;
  totalEngineersEstimate?: number;
  qualificationStatus: QualificationStatus;
  qualificationReason?: string;
  headcountConfidence?: number;
  departmentBreakdown?: DepartmentBreakdown;
  annualEdaSpendEstimate: string; // e.g. "$14.5M/yr"
  edaTools: string[]; // e.g. ["Cadence Virtuoso", "Synopsys Design Compiler", "Siemens Calibre"]
  licenseDaemons: string[]; // e.g. ["FlexNet (FLEXlm)", "Reprise (RLM)"]
  currentEsamTool: string; // e.g. "Flexera FNMEA", "OpenLM", "Manual Scripts", "None"
  renewalQuarter: string; // e.g. "Q4 2026"
  renewalDaysLeft: number;
  icpFitScore: number; // 0 - 100
  intentVelocityScore: number; // 0 - 100
  compositeScore: number; // 0 - 100
  priorityLevel: PriorityLevel;
  primaryTrigger: string;
  activeSignalsCount: number;
  denialContentionRisk: 'Critical' | 'Elevated' | 'Moderate' | 'Low';
  notes: string;
  sourceCitations?: SourceCitation[];
  isVerified?: boolean;
}

export interface AutonomousScanConfig {
  isEnabled: boolean;
  intervalMinutes: number; // e.g. 15, 60, 360, 1440
  lastPolledAt: string | null;
  nextPollAt: string | null;
  newAlertsCount: number;
  autoIngestDirectly: boolean; // Automatically adds discovered accounts straight into Active Tracked table
  scannedVerticals?: string[];
  totalAutonomousIngested?: number;
}

export interface AutonomousNotification {
  id: string;
  timestamp: string;
  companyName: string;
  signalTitle: string;
  confidence: number;
  isRead: boolean;
  priority: PriorityLevel;
  account: Account;
}

export interface PlaybookGeneration {
  accountId: string;
  accountName: string;
  targetPersona: string;
  emailSubject: string;
  emailBody: string;
  keyPainPoints: string[];
  battleCard: {
    competitor: string;
    wedgeAngle: string;
    proofPoints: string[];
  };
  recommendedOffer: string;
  suggestedFollowUp: string;
  supportingCitation?: SourceCitation;
}

export interface WebhookAlert {
  id: string;
  service: 'Slack' | 'Salesforce' | 'HubSpot';
  accountId: string;
  accountName: string;
  signalTitle: string;
  priority: PriorityLevel;
  timestamp: string;
  status: 'Delivered' | 'Pending';
  payloadPreview: string;
}

export interface CalibrationItem {
  id: string;
  observedSignal: string;
  buyingIntentInterpretation: string;
  priority: PriorityLevel;
  scoreWeight: number;
  isNoiseFiltered?: boolean;
}

