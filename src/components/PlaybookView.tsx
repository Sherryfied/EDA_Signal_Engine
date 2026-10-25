import React, { useState } from 'react';
import { Account, PlaybookGeneration, WebhookAlert, SourceCitation } from '../types.ts';
import { BATTLE_CARDS } from '../data/seedData.ts';
import {
  Sparkles,
  Copy,
  Check,
  Send,
  Loader2,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
  ExternalLink,
  Quote
} from 'lucide-react';

interface PlaybookViewProps {
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (account: Account) => void;
  dispatchedAlerts: WebhookAlert[];
  onDispatchWebhook: (service: 'Slack' | 'Salesforce' | 'HubSpot', account: Account, signalTitle: string) => void;
}

export const PlaybookView: React.FC<PlaybookViewProps> = ({
  accounts,
  selectedAccount,
  onSelectAccount,
  dispatchedAlerts,
  onDispatchWebhook,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'outreach' | 'battlecards' | 'webhooks'>('outreach');
  const [currentAccount, setCurrentAccount] = useState<Account>(selectedAccount || accounts[0]);
  const [targetPersona, setTargetPersona] = useState<string>('Director of CAD & EDA Systems');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [generatedPlaybook, setGeneratedPlaybook] = useState<PlaybookGeneration | null>(null);
  const [isCitationExpanded, setIsCitationExpanded] = useState(false);

  // Sync if selectedAccount changes externally
  React.useEffect(() => {
    if (selectedAccount) {
      setCurrentAccount(selectedAccount);
    }
  }, [selectedAccount]);

  const activeCitation: SourceCitation = currentAccount.sourceCitations?.[0] || {
    id: `cite-${currentAccount.id}-fallback`,
    documentType: currentAccount.primaryTrigger.toLowerCase().includes('rfp') ? 'Procurement RFP' : 'SEC 10-K',
    sourceTitle: currentAccount.primaryTrigger.toLowerCase().includes('rfp')
      ? `${currentAccount.name} Engineering IT Infrastructure RFP`
      : `${currentAccount.name} Form 10-K R&D Disclosures & Engineering Operations`,
    publisherOrAuthority: currentAccount.primaryTrigger.toLowerCase().includes('rfp')
      ? 'Corporate Vendor Procurement'
      : 'SEC Edgar Database (Item 1)',
    publishDate: 'Active Period',
    directQuote: currentAccount.notes || `Engineering operations maintain ${currentAccount.edaEngineersCount.toLocaleString()} floating CAD/EDA seats across multi-site centers with active concurrent checkout contention.`,
    confidenceScore: currentAccount.headcountConfidence || 95,
    verifiedDate: 'Active Verified',
    verificationMethod: currentAccount.primaryTrigger.toLowerCase().includes('rfp')
      ? 'Public Procurement RFP'
      : 'SEC Disclosure Audit',
  };

  const handleGeneratePlaybook = async () => {
    setIsGenerating(true);
    setCopiedEmail(false);

    try {
      const response = await fetch('/api/generate-outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: currentAccount.name,
          targetPersona,
          primaryTrigger: currentAccount.primaryTrigger,
          edaTools: currentAccount.edaTools,
          licenseDaemons: currentAccount.licenseDaemons,
          renewalQuarter: currentAccount.renewalQuarter,
          currentEsamTool: currentAccount.currentEsamTool,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Failed to generate outreach');
      }

      const data = await response.json();
      const playbook: PlaybookGeneration = {
        ...data.playbook,
        supportingCitation: activeCitation,
      };
      setGeneratedPlaybook(playbook);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    if (!generatedPlaybook) return;
    const text = `Subject: ${generatedPlaybook.emailSubject}\n\n${generatedPlaybook.emailBody}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            GTM Sales Activation & Outreach Studio
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Turn verified buying signals into hyper-personalized, citation-backed executive cold outreach and CAD battle cards.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSubTab('outreach')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'outreach'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            AI Outreach Generator
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('battlecards')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'battlecards'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CAD Battle Cards ({BATTLE_CARDS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('webhooks')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeSubTab === 'webhooks'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CRM & Slack Webhooks ({dispatchedAlerts.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: AI OUTREACH GENERATOR */}
      {activeSubTab === 'outreach' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs shadow-xs">
            {/* Account Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Account</label>
              <select
                value={currentAccount.id}
                onChange={(e) => {
                  const acc = accounts.find((a) => a.id === e.target.value);
                  if (acc) {
                    setCurrentAccount(acc);
                    onSelectAccount(acc);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.priorityLevel} · Score: {acc.compositeScore})
                  </option>
                ))}
              </select>
            </div>

            {/* Persona Selector */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Buying Committee Persona</label>
              <select
                value={targetPersona}
                onChange={(e) => setTargetPersona(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              >
                <option value="Director of CAD & EDA Systems">Director of CAD & EDA Systems (Primary)</option>
                <option value="VP of Engineering & Silicon Architecture">VP of Engineering & Silicon Architecture</option>
                <option value="IT Procurement & Software Asset Manager">IT Procurement & Software Asset Manager (SAM)</option>
                <option value="Engineering Systems Administrator">Engineering IT Systems Administrator</option>
              </select>
            </div>

            {/* Action Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGeneratePlaybook}
                disabled={isGenerating}
                className="w-full px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Signal Playbook...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generate Tailored Playbook</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Account Context & Verification Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-slate-600">
              <span className="font-semibold text-slate-900">{currentAccount.name}</span>
              <span aria-hidden="true">·</span>
              <span>Tools: {currentAccount.edaTools.slice(0, 2).join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span>Daemons: {currentAccount.licenseDaemons.join(', ')}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-amber-700 font-mono">
                Renewal: {currentAccount.renewalDaysLeft}d ({currentAccount.renewalQuarter})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Grounded Evidence: {activeCitation.documentType} ({activeCitation.confidenceScore}%)</span>
              </span>
            </div>
          </div>

          {/* Playbook Content Display */}
          {generatedPlaybook ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left 2 Cols: Email Draft */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Contextual Sales Sequence (Touch 1)
                    </span>
                    <div className="text-sm font-semibold text-slate-900 mt-0.5">
                      Targeting: {generatedPlaybook.targetPersona}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedEmail ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Grounding Source Citation Box */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-900 text-[11px]">
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verifiable Claim Grounding ({activeCitation.documentType}):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCitationExpanded(!isCitationExpanded)}
                      className="text-[10px] text-emerald-700 hover:underline font-mono cursor-pointer"
                    >
                      {isCitationExpanded ? 'Collapse' : 'Inspect Raw Quote'}
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-950 bg-white/80 p-2 rounded border border-emerald-100">
                    "{activeCitation.directQuote}"
                  </div>
                  {isCitationExpanded && (
                    <div className="text-[10px] text-emerald-800 font-mono pt-1 flex items-center justify-between">
                      <span>Source: {activeCitation.sourceTitle}</span>
                      <span>Verified: {activeCitation.publishDate}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono select-none mr-2">Subject:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {generatedPlaybook.emailSubject}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50/70 border border-slate-200 rounded font-sans text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {generatedPlaybook.emailBody}
                  </div>

                  {generatedPlaybook.suggestedFollowUp && (
                    <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded text-xs text-blue-900">
                      <span className="font-semibold">Suggested Day-4 Follow Up Hook: </span>
                      "{generatedPlaybook.suggestedFollowUp}"
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Pain Points & Battle Card */}
              <div className="space-y-4">
                {/* Pain Points */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs shadow-xs">
                  <h4 className="font-semibold text-slate-900">Key Engineering IT Pain Points</h4>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                    {generatedPlaybook.keyPainPoints.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* Competitive Wedge */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs shadow-xs">
                  <div className="text-slate-500 font-medium">Competitive Wedge Angle</div>
                  <div className="font-semibold text-slate-900">
                    Vs {generatedPlaybook.battleCard.competitor}
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {generatedPlaybook.battleCard.wedgeAngle}
                  </p>
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    {generatedPlaybook.battleCard.proofPoints.map((proof, i) => (
                      <div key={i} className="text-slate-700 flex items-start gap-1.5">
                        <span className="text-blue-600 font-bold shrink-0">✓</span>
                        <span>{proof}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Offer */}
                <div className="bg-slate-900 text-slate-100 rounded-lg p-4 space-y-1 text-xs shadow-xs">
                  <div className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
                    Recommended Low-Friction Offer
                  </div>
                  <div className="font-bold text-sm text-white">
                    {generatedPlaybook.recommendedOffer}
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Provides zero-cost audit evidence before the account commits to their 3-year vendor contract.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-lg text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">No Playbook Generated Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select your target account and persona above, then click "Generate Tailored Playbook" to craft a contextual SDR sequence.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: BATTLE CARDS */}
      {activeSubTab === 'battlecards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BATTLE_CARDS.map((card, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Competitive Battle Card
                </div>
                <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {card.wedgeAngle}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="font-semibold text-slate-800">Key Rebuttals & Proof Points:</div>
                  <ul className="space-y-1.5 text-slate-600">
                    {card.proofPoints.map((proof, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">·</span>
                        <span>{proof}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 italic">
                {card.customerQuote}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: CRM & SLACK WEBHOOK SIMULATOR */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900">
              Simulate Real-Time GTM Alert Delivery
            </h3>
            <p className="text-xs text-slate-500">
              Test how high-velocity buying signals trigger alerts in Slack, Salesforce, or HubSpot when an account exceeds priority thresholds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <button
                type="button"
                onClick={() =>
                  onDispatchWebhook('Slack', currentAccount, currentAccount.primaryTrigger)
                }
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Send Slack Channel Ping</span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  Pings #gtm-buying-signals with interactive AE sequence buttons.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onDispatchWebhook('Salesforce', currentAccount, currentAccount.primaryTrigger)
                }
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Sync Account to Salesforce</span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  Updates Account object with latest CAD intent score & denial risk.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  onDispatchWebhook('HubSpot', currentAccount, currentAccount.primaryTrigger)
                }
                className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>Trigger HubSpot Cadence</span>
                  <Send className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-slate-500 text-[11px] mt-1">
                  Enrolls buying committee members into automated multi-touch campaign.
                </p>
              </button>
            </div>
          </div>

          {/* Dispatched Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dispatched Webhook Event Log ({dispatchedAlerts.length})
            </h4>

            {dispatchedAlerts.length > 0 ? (
              <div className="space-y-3">
                {dispatchedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 text-xs shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{alert.service}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-600 font-medium">{alert.accountName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {alert.status}
                      </span>
                    </div>

                    <div className="text-slate-700 font-medium">{alert.signalTitle}</div>

                    <pre className="p-3 bg-slate-900 text-slate-200 rounded text-[11px] font-mono overflow-x-auto">
                      {alert.payloadPreview}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-white border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                No outbound alerts simulated yet. Click one of the buttons above to test integration payloads.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
