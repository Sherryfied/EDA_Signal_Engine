# Remediation Plan: TeamEDA SignalPulse QA Audit (QAS-001 – QAS-012)

This plan provides a comprehensive remediation for all 12 findings identified in the QA Audit Report (`EDA_Signal_Enginer_QA_Audit_v2_f3839ddb.md`).

---

## 1. Finding-by-Finding Remediation Matrix

### P1 — High Severity

#### **QAS-001: Evidence Integrity & Provenance Grounding**
- **Issue:** Synthetic or generated records were marked `isVerified: true` with synthetic quotation badges ("SEC Verified"), and synthetic fallback companies (`Enterprise Silicon Labs #...`) were presented as verified.
- **Remediation:**
  - Update `src/data/marketRadarCatalog.ts` and `src/data/seedData.ts` to include canonical source documentation URLs/identifiers, publication dates, and precise publisher authorities for all catalog items.
  - In `server.ts` dynamic radar synthesis:
    - Mark newly synthesized LLM or heuristic accounts explicitly as `isVerified: false` with label `Verification Status: AI Synthesized (Pending Primary Filing Retrieval)`.
    - Only flag accounts as `isVerified: true` if backed by cataloged SEC filings, DoD contracts, or verified requisitions with valid source citation structures.
    - Remove the randomized synthetic company fallback (`Enterprise Silicon Labs #...`) or label it clearly as unverified staging preview.
  - In `src/components/AccountDrawer.tsx`: only show the "SEC Verified" green badge when `account.isVerified === true` AND a verified primary source citation with verified authority is present.

#### **QAS-002: Backend Rate Limiting & Input Sanitization**
- **Issue:** Express routes (`/api/*`) were open to unmetered callers with no rate limiting or payload validation.
- **Remediation:**
  - Implement an in-memory IP sliding-window rate limiter in `server.ts` (e.g. 60 requests/minute per client IP), returning HTTP `429 Too Many Requests` with a clear JSON error payload.
  - Add strict input size and type checks on all `/api/*` endpoints (`text` max 50KB, `items` array max 25 items, sanitized string lengths).

#### **QAS-003: React Hook Order Violations in Always-Mounted Dialogs**
- **Issue:** `AccountDrawer.tsx`, `SignalModal.tsx`, and `ImportExportModal.tsx` returned `null` conditionally *before* declaring `useState` and other hooks.
- **Remediation:**
  - In `AccountDrawer.tsx`: Declare all `useState` and `useEffect` hooks at the top of the component with safe fallback defaults (`account?.edaEngineersCount || 0`). Move `if (!account) return null;` to immediately precede the JSX return.
  - In `SignalModal.tsx`: Declare all state hooks unconditionally at the top. Move `if (!isOpen || !signal) return null;` immediately before JSX.
  - In `ImportExportModal.tsx`: Declare all state hooks unconditionally at the top. Move `if (!isOpen) return null;` immediately before JSX.

---

### P2 — Medium Severity

#### **QAS-004 & QAS-009: RFC-Compliant CSV Parser/Writer & Formula Injection Defense**
- **Issue:** CSV parser used naive `split(',')`, matched `toolsIdx` against `EDA Engineers` before `EDA Tools`, hardcoded `const seats = 750`, and failed to sanitize formula characters (`=`, `+`, `-`, `@`).
- **Remediation:**
  - Implement an RFC 4180 compliant CSV parser and serializer in `src/utils/csvUtils.ts` that handles quoted fields, commas inside quotes, embedded line breaks, and escaped quotes (`""`).
  - Column matching: Match exact header names (`EDA Tools` vs `EDA Engineers`) so seat count is never parsed as a tool.
  - Parse numeric `EDA Engineers` correctly and preserve all fields across export and import.
  - Formula Injection Mitigation: Sanitize all string fields beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` by prepending a single quote `'` during CSV export.

#### **QAS-005: Signal Feed Consistency on Single Account Promotion**
- **Issue:** `handlePromoteDiscoveredAccount` in `App.tsx` promoted the account to tracked accounts and removed it from radar, but neglected to add `account.detectedSignal` to the global `signals` feed, whereas batch promotion added it.
- **Remediation:**
  - Update `handlePromoteDiscoveredAccount` to extract `account.detectedSignal` and insert it into `signals` if it has not already been ingested, keeping single and batch promotion completely synchronized.

#### **QAS-006: Dynamic Signal Rules Engine Governance**
- **Issue:** Custom rules edited in `SignalRulesManager.tsx` were saved in local state but never passed to the evaluator or radar. "Test in Scanner" only switched tabs without prefilling the pattern.
- **Remediation:**
  - Pass the active `trackedPatterns` from `App.tsx` into `ScannerView.tsx` and supply them in `/api/analyze-signal` payloads.
  - In `server.ts`, evaluate both standard formulas and any active custom rules/keywords sent by the client.
  - Wire "Test in Scanner" in `App.tsx` to set `ScannerView`'s preset/input text and highlight the selected pattern.

#### **QAS-007: Account Drawer Edit Draft Synchronization**
- **Issue:** Local draft state (`editSeats`, `editTotalEng`, `editCompetitor`, `editDaemons`, `editTools`) did not synchronize when `account.id` changed or after a live revalidation updated the account.
- **Remediation:**
  - Add a `useEffect` keyed on `account.id` and `account.headcountConfidence` to reset and sync draft state to the updated account.
  - Provide a dirty draft indicator and ensure saving cannot overwrite freshly revalidated data with stale drafts.

#### **QAS-008: Safe LocalStorage Hydration Guards**
- **Issue:** `teameda_discovered_accounts` and `teameda_tracked_patterns` in `App.tsx` called raw `JSON.parse` without `try/catch`.
- **Remediation:**
  - Implement a centralized `safeLoadStorage<T>(key: string, fallback: T, validator?: (val: any) => boolean): T` helper with `try/catch` and array shape validation.
  - Replace raw `JSON.parse` across all `localStorage` state initializers in `App.tsx`.

#### **QAS-011: Filter-Scoped Discovery Multi-Selection**
- **Issue:** `selectedDiscoveredIds` in `AccountTable.tsx` persisted across filter and search changes, causing hidden rows to be batch-promoted and displaying mismatched counts (e.g. "5 of 2 Selected").
- **Remediation:**
  - Prune or clear `selectedDiscoveredIds` when search queries, industry, tier, or priority filters change.
  - Restrict "Select All" and "Add Selected" strictly to visible `filteredAccounts`.
  - Update count badges to display `X of Y visible accounts selected`.

#### **QAS-012: Direct Auto-Ingestion for "Sweep 5 Verticals"**
- **Issue:** Clicking "Sweep 5 Verticals (Auto-Ingest)" called `pollBackgroundRadar(true, true)` with `isManual=true`, which skipped auto-ingestion.
- **Remediation:**
  - In accordance with user preference, update `handleSweepAllVerticals` to call `pollBackgroundRadar(false, true)` and force direct auto-ingestion of newly discovered accounts and signals into Active Tracked Target Accounts.
  - Show a descriptive toast notification confirming the number of accounts and signals auto-ingested.

---

### P3 — Low Severity

#### **QAS-010: Revalidation Failure Messaging**
- **Issue:** The catch block in `handleLiveRevalidate` set `validationSuccess` to a positive message even when the server request failed.
- **Remediation:**
  - Add `validationError` state in `AccountDrawer.tsx`.
  - On network/API failure, display a red error message: `Validation service temporarily unavailable. Stale data retained.` and clear any success badge.

---

## 2. Implementation Steps

1. **Backend (`server.ts`)**:
   - Add sliding-window in-memory rate-limiter middleware.
   - Support `customRules` evaluation in `/api/analyze-signal`.
   - Update verification provenance in radar synthesis and eliminate random placeholder generation.

2. **Utilities (`src/utils/csvUtils.ts` & `src/utils/storageUtils.ts`)**:
   - Create RFC 4180 CSV parser, serializer, and formula-injection sanitizer.
   - Create safe `localStorage` hydration utilities with schema validation.

3. **Dialog Components (`AccountDrawer.tsx`, `SignalModal.tsx`, `ImportExportModal.tsx`)**:
   - Reorder hooks above all early returns to eliminate React lifecycle crashes (QAS-003).
   - Reconcile edit drafts on account change and fix revalidation error messaging (QAS-007, QAS-010).
   - Integrate RFC CSV utils with formula neutralization (QAS-004, QAS-009).

4. **Table & App Orchestration (`AccountTable.tsx`, `App.tsx`, `ScannerView.tsx`)**:
   - Synchronize single-account promotion to ingest signals (QAS-005).
   - Wire custom rules into scanner and test callback (QAS-006).
   - Prune selection on filter change in Discovery Radar (QAS-011).
   - Wire "Sweep 5 Verticals" to directly auto-ingest into Active Tracked Accounts (QAS-012).
   - Protect all localStorage keys with safe hydration (QAS-008).

5. **Verification**:
   - Run `npm run build` to verify full TypeScript compilation and Node bundle.
   - Run `lint_applet` and test dialog lifecycles and CSV round-trips.
