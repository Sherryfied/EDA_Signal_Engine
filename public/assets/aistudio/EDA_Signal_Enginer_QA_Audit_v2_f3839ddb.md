# QA Audit Report — TeamEDA SignalPulse (Re-audited v2)

**Repository:** [sheryfied/EDA_Signal_Enginer](https://github.com/sheryfied/EDA_Signal_Enginer)  
**Branch reviewed:** `main`  
**Snapshot:** `738f07a311ce829c167538b307d115ed2bed3995` (`feat: initialize TeamEDA SignalPulse application`)  
**Audit date:** 25 October 2026  
**Mode:** Audit only — no repository files changed  
**QA-of-QA note:** This version corrects three broken `App.tsx` links, removes one duplicated paragraph, narrows the original QAS-007 reproduction claim to a reachable stale-draft scenario, and adds two omitted workflow defects (QAS-011 and QAS-012). Counts below reflect the revised register.

## A. Executive summary

The repository is a React 19 + TypeScript + Vite frontend backed by an Express server. The backend exposes endpoints for signal analysis, AI-generated outreach, company enrichment, radar discovery, headcount qualification, and simulated webhooks. The Gemini SDK is initialized server-side from `GEMINI_API_KEY`; frontend account, signal, notification, and rule state is persisted in browser `localStorage`.

The product is a promising UI prototype, but the current source is **not release-ready** for use as a trusted, evidence-backed buying-signal intelligence system. The most consequential findings are that generated or placeholder signal evidence is represented as verified, the billable AI routes have no authentication or rate limiting, and several always-mounted dialogs place hooks after conditional early returns. CSV export/import is also not round-trip safe, manual promotion drops the discovered signal from the feed, and custom rules are not wired into the actual detection logic.

### Findings summary

| Severity | Count | Meaning |
|---|---:|---|
| P0 — Critical | 0 | No P0 issue established in this static pass |
| P1 — High | 3 | Evidence integrity, unmetered public AI use, core dialog rendering risk |
| P2 — Medium | 8 | Data loss/corruption or core workflow inconsistencies |
| P3 — Low | 1 | Misleading failure feedback |
| **Total** | **12** | All findings are **statically verified**, not runtime-reproduced |

**Runtime tests executed:** 0. **Build/type-check/test commands passed:** 0. **Build/type-check/test commands failed:** 0. No test command was run. A local checkout attempt was blocked by this execution environment's DNS/network restriction; see Section F. This report therefore does not claim runtime behavior, performance, or dependency vulnerability checks were completed.

## B. Architecture and critical workflows

### Architecture observed

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, Lucide icons, Motion.
- **Backend:** Express 4 in `server.ts`, using `@google/genai` for model-backed workflows.
- **Local persistence:** `localStorage` for accounts, discovered accounts, signals, tracked patterns, scan configuration, and notifications.
- **Data sources:** static seed files (`src/data/seedData.ts`, `src/data/marketRadarCatalog.ts`, plus a procedural pool in `server.ts`) and model-generated data. I did not find a real source-retrieval/citation-validation pipeline in the reviewed code.
- **Build/deploy:** `npm run build` calls `vite build` and bundles `server.ts` with esbuild; production serves `dist` from Express.

### Critical workflows traced statically

1. **Radar discovery:** `Header` / `AccountTable` → `App.pollBackgroundRadar` → `POST /api/discover-market-signals` → static candidate pool and optional Gemini synthesis → front-end staging or auto-ingestion.
2. **Manual signal scan:** `ScannerView` → `POST /api/analyze-signal` → deterministic heuristics and optional Gemini analysis → account and signal state.
3. **Company enrichment:** `ImportExportModal` → `POST /api/discover-company-intent` → optional Gemini enrichment or deterministic fallback → account import.
4. **Headcount revalidation:** `AccountDrawer` → `POST /api/validate-engineer-headcount` → deterministic benchmark and optional Gemini response → account update.
5. **Account persistence:** app state → `localStorage` via effects; hydration occurs in `App` state initializers.
6. **CSV data flow:** tracked accounts → client-generated CSV download → CSV file parser → imported account objects.

## C. Repository health overview

| Area | Status | Findings / evidence |
|---|---|---|
| Functional correctness | ISSUES | Single promotion does not add its `detectedSignal`; custom rules are not connected to analysis behavior. |
| API / backend | ISSUES | AI endpoints have no visible authentication or rate limiter; input validation is incomplete. |
| Data integrity | ISSUES | Model-generated or placeholder evidence is marked verified; CSV import can corrupt seat/tool fields. |
| Frontend / UI | ISSUES | Conditional returns precede hooks in always-mounted components; discovery selection can persist through filters; the drawer draft can become stale after revalidation. |
| Security | ISSUES | Publicly reachable billable routes are unmetered; CSV fields are not neutralized against spreadsheet formula injection. |
| Performance | NOT TESTED | No runtime profiling, load testing, or request-volume benchmarks were executed. |
| Reliability | ISSUES | Two `localStorage` initializers parse JSON without a guarded fallback. |
| Automated tests | ISSUES / NOT TESTED | No test script or test files were present in the inspected repository tree. |
| Build / deployment | NOT TESTED | No local build or TypeScript check was run; no lockfile or CI workflow was found in the repository tree. |

## D. Prioritized defect register

| ID | Severity | Verification | Component | Defect | Impact |
|---|---|---|---|---|---|
| QAS-001 | P1 | Statically Verified | Radar / source citations | Generated and placeholder evidence is marked verified without source URLs or source retrieval | False buying-intent claims may drive sales outreach and damage trust |
| QAS-002 | P1 | Statically Verified | Express API | AI-backed routes are not authenticated or rate-limited | A public caller can trigger potentially billable model requests and resource consumption |
| QAS-003 | P1 | Statically Verified | `AccountDrawer`, `SignalModal`, `ImportExportModal` | Hooks follow conditional early returns in always-mounted components | Opening/closing these surfaces can violate React hook ordering and break UI rendering |
| QAS-004 | P2 | Statically Verified | CSV import/export | Exported CSV is not safely round-trippable; EDA seats can be parsed as tools and seats are reset to 750 | Account records lose or corrupt important fields on re-import |
| QAS-005 | P2 | Statically Verified | `App.handlePromoteDiscoveredAccount` | Single-account promotion removes the account from discovery without adding its detected signal to the signal feed | Users lose the signal that motivated tracking the account |
| QAS-006 | P2 | Statically Verified | Signal Rules Manager / Scanner / backend | Edited rules are persisted/displayed but do not govern scanning, radar discovery, or score calculation | UI promises configuration behavior that the engine does not implement |
| QAS-007 | P2 | Statically Verified | `AccountDrawer` | Local edit drafts are not reconciled after account revalidation updates the underlying object | Saving an older draft can overwrite refreshed values |
| QAS-008 | P2 | Statically Verified | `App` state hydration | Discovered-account and tracked-pattern `localStorage` JSON is parsed without a try/catch or schema guard | Malformed/stale stored data can crash app startup |
| QAS-009 | P2 | Statically Verified | CSV export | User-controlled text is quoted but not neutralized against spreadsheet formulas | Opening an exported CSV in a spreadsheet can evaluate malicious formula-like cells |
| QAS-010 | P3 | Statically Verified | `AccountDrawer` revalidation | Catch path displays a positive “Re-validated” message after the API request fails | Users are told a failed validation succeeded, obscuring stale/unverified data |
| QAS-011 | P2 | Statically Verified | `AccountTable` discovery selection | Selection persists across filter changes, so hidden accounts may still be batch-promoted | The selected count can exceed the visible result count, and hidden accounts can be promoted unexpectedly |
| QAS-012 | P2 | Statically Verified | `App` / radar controls | “Sweep 5 Verticals (Auto-Ingest)” calls the manual path, which explicitly skips auto-ingestion | Button does not perform the action its label and tooltip promise |

### QAS-001 — Generated / placeholder evidence is represented as verified

**Severity:** P1 — High  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected files:** [`src/data/marketRadarCatalog.ts`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/data/marketRadarCatalog.ts#L1-L55), [`src/data/seedData.ts`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/data/seedData.ts), [`server.ts`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L1310-L1465), [`src/components/AccountDrawer.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountDrawer.tsx#L51-L88)

**Description / evidence:** Static catalog records carry detailed “RFP”, “SEC 10-K”, and job-requisition quotes, but the reviewed catalog and seed files contain no source URLs. The backend's Gemini synthesis accepts an `evidenceQuote` and maps it into a `SourceCitation` with a generated title/publisher and labels such as “Audited Requisition” / “Automated Radar Verification”; the resulting account is set to `isVerified: true`. If no catalog candidate remains, `server.ts` creates a synthetic name such as `Enterprise Silicon Labs #NNN` and returns it as a verified high-intent account. The drawer then displays “SEC Verified” whenever `account.isVerified` is true.

**Expected behavior:** An account should be described as verified only after a source has been retrieved and checked. Model-written quotations or generated placeholder records must not be presented as factual evidence.

**Impact:** Salespeople can act on invented RFPs, job postings, toolchain details, renewal windows, or license problems. This is the highest business-integrity risk in the application.

**Recommended fix:** Add a real source retrieval/grounding step and persist the canonical URL, publisher, publication date, retrieval time, and exact quoted passage. Validate that the URL resolves and the quote is present in the fetched source. Keep generated suggestions explicitly `unverified`; do not set `isVerified` true by default or invent direct quotes. Remove the random synthetic-company fallback or return an explicit “no new verified candidates” result.

**Regression test:** Feed the discovery endpoint a fabricated company and fabricated quote. Assert the API cannot return `isVerified: true` without a successfully retrieved source URL and quote-match evidence.

### QAS-002 — Billable AI endpoints have no visible authentication or rate limiting

**Severity:** P1 — High  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`server.ts`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L1-L20), [`/api/analyze-signal`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L236-L375), [`/api/generate-outreach`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L377-L500), [`/api/discover-company-intent`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L562-L760), [`/api/discover-market-signals`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L1210-L1475), [`/api/validate-engineer-headcount`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L1483-L1743)

**Description / evidence:** The Express setup installs `express.json()` but no authentication middleware, user/session authorization, or rate limiter is present in the reviewed server. Several endpoints call Gemini when `GEMINI_API_KEY` is configured. The public repository does not itself prove the deployed service is internet-exposed; however, **if this app is deployed publicly**, those routes can be called directly without passing through the UI.

**Expected behavior:** Billable AI operations should be limited to authorized users, with per-user/IP rate limits, quotas, timeouts, and budget controls.

**Impact:** An unauthenticated caller could generate unexpected model usage, service degradation, and API costs.

**Recommended fix:** Add authentication appropriate to the deployment, per-user and per-IP throttling, request/response size limits, per-endpoint quota controls, and a server-side usage budget. Validate request fields before calling Gemini. Keep error responses generic while logging request IDs and safe diagnostics.

**Regression test:** Confirm unauthenticated requests are rejected when auth is required; issue requests above the configured threshold and assert `429` is returned without invoking the model again.

### QAS-003 — Conditional early returns precede hooks in always-mounted dialogs

**Severity:** P1 — High  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected files:** [`AccountDrawer.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountDrawer.tsx#L107-L118), [`SignalModal.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/SignalModal.tsx#L20-L31), [`ImportExportModal.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/ImportExportModal.tsx#L18-L35), parent mounting in [`App.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L870-L895)

**Description / evidence:** Each component returns early when `account` / `isOpen` is falsy, then declares multiple hooks below that return. `App.tsx` renders these components persistently and changes their props rather than conditionally mounting/unmounting them.

**Expected behavior:** The hook call order must remain identical on every render. Hidden stateful surfaces should either declare hooks before the early return or be mounted conditionally by the parent.

**Impact:** Opening and then closing a drawer/modal can cause React to observe a different hook sequence and throw a “Rendered fewer hooks than expected” class of error, disrupting core workflows.

**Recommended fix:** Move every hook to the top of the component before the conditional return, with safe initial values for a missing account. Alternatively, mount the component only while open (`{isOpen && <Modal ... />}`) and reset state deliberately on remount.

**Regression test:** Render each surface closed, open it, close it, and reopen it. Assert there are no React errors and the expected form state resets/persists according to product requirements.

### QAS-004 — CSV export/import can corrupt the app's own account data

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`ImportExportModal.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/ImportExportModal.tsx#L132-L190) and [`#L217-L261`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/ImportExportModal.tsx#L217-L261)

**Description / evidence:** The importer selects the first header containing `tool`, `eda`, or `cad`. In the app's own export header order, `EDA Engineers` appears before `EDA Tools`, so `toolsIdx` matches the seat-count column. The import code also hardcodes `const seats = 750` instead of parsing the exported EDA Engineers field. Both CSV headers and rows are parsed with `split(',')`, which does not handle quoted commas, embedded newlines, or escaped quotes according to CSV rules. The exporter also does not escape embedded quotes consistently across all text columns.

**Reproduction steps:** Export one tracked account to CSV and import that same file. The importer can use the numeric EDA seat count as the tool name and resets the account's seat count to 750; several other fields are also reset to defaults.

**Impact:** Re-importing a backup can silently corrupt seat qualification and toolchain data.

**Recommended fix:** Use an RFC-compliant CSV parser and writer. Match known column names exactly (prefer `EDA Tools` over substring matching), parse `EDA Engineers`, and retain all fields that the export claims to preserve. Show row-level parse errors rather than silently defaulting required values.

**Regression test:** Round-trip records containing commas, quotes, Unicode, embedded newlines, different seat counts, multiple tools, and all supported columns; assert values are preserved exactly.

### QAS-005 — Single-account promotion drops the detected signal

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected files:** [`App.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L571-L599), [`AccountTable.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountTable.tsx#L1018-L1032)

**Description / evidence:** The row-level “Track Account” action calls `handlePromoteDiscoveredAccount`, which adds the account and removes it from the discovery list but never moves `account.detectedSignal` into `signals`. The batch handler immediately below explicitly extracts `detectedSignal` and adds it to the signal feed.

**Expected behavior:** Single and batch promotion should have consistent outcomes, including preserving the signal that caused the discovery.

**Impact:** A user tracking one account can lose the strongest context for why it was surfaced; the signal feed and account's active signal count can become inconsistent.

**Recommended fix:** Reuse a shared promotion function for single and batch paths. Add each detected signal only when its ID is not already present, and preserve its account ID/name.

**Regression test:** Promote one discovered account with a `detectedSignal`; assert the account is tracked, removed from discovery, and its signal appears exactly once in the global feed.

### QAS-006 — Rule editor changes do not govern the detection engine

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected files:** [`SignalRulesManager.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/SignalRulesManager.tsx#L140-L150), [`App.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L758-L770), [`ScannerView.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/ScannerView.tsx), [`server.ts`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/server.ts#L55-L135)

**Description / evidence:** The rules screen says changes govern the scanner, radar, and scoring. In implementation, the scanner API prompt and deterministic evaluator hardcode the six formulas. `ScannerView` is not given the edited `trackedPatterns`; the radar endpoint uses its own hardcoded prompt. In addition, the “Test in Scanner” callback in `App.tsx` ignores the supplied `pattern` argument and only switches tabs.

**Expected behavior:** Rule edits, deletes, weights, and test actions should affect the real evaluator, or the UI should label them as documentation-only settings.

**Impact:** Users can configure or delete a rule and reasonably believe the system's detection behavior changed when it did not.

**Recommended fix:** Create a shared rule contract and pass the active rules to the server-side evaluator/model prompt and score calculation. Wire “Test in Scanner” to prefill the selected rule/query and show an explicit result.

**Regression test:** Add a custom test rule with a unique keyword, verify a matching input produces the rule's result, then remove the rule and verify the same input no longer matches.

### QAS-007 — Account drawer draft fields can become stale after revalidation

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`AccountDrawer.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountDrawer.tsx#L107-L120) and [`#L188-L215`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountDrawer.tsx#L188-L215)

**Description / evidence:** `editSeats`, `editTotalEng`, `editCompetitor`, `editDaemons`, and `editTools` are initialized from `account` only during the component's initial mount. The drawer has no effect to reconcile these local draft fields when the account object is updated. The live revalidation handler can update the account via `onUpdateAccount(updated)` while the drawer remains mounted, but it does not reset the local edit fields. If the edit form is active while revalidation completes, saving the draft can overwrite refreshed headcount/competitor/daemon/tool values with the earlier draft. The prior report’s specific “switch to another account while the drawer remains open” repro path was not substantiated by the normal overlay UI and has been removed.

**Expected behavior:** Draft values and revalidated account data should be reconciled explicitly; a stale draft should not silently overwrite a just-refreshed account.

**Impact:** Revalidation updates may be lost if the user saves an older manual draft afterward.

**Recommended fix:** Track a dirty draft and warn/merge when a revalidation updates the base account, or disable revalidation while editing. Keep the selected account identity stable and reset the draft when the account ID changes.

**Regression test:** Open an account, edit one or more fields without saving, trigger revalidation and return an updated account, then attempt to save. Assert the UI makes the conflict explicit or applies the documented merge policy rather than silently discarding the refreshed values.

### QAS-008 — Two localStorage initializers can crash on malformed JSON

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`App.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L219-L242)

**Description / evidence:** `teameda_discovered_accounts` and `teameda_tracked_patterns` are parsed directly with `JSON.parse` in state initializers. Other state initializers nearby use `try/catch`, so this is an inconsistent failure path. The resulting values are not checked to be arrays with valid object shapes.

**Expected behavior:** Invalid, stale, or corrupted local storage should be discarded safely and replaced with valid defaults.

**Impact:** A malformed value can prevent the app from rendering, potentially forcing the user to manually clear site storage.

**Recommended fix:** Implement a shared safe hydration function with `try/catch`, runtime schema checks, and versioned migrations. Validate arrays before using `.map`, `.filter`, or similar operations.

**Regression test:** Seed each key with invalid JSON, `null`, an object instead of an array, and old-schema records; assert the app starts with defaults and preserves valid keys.

### QAS-009 — CSV export does not mitigate spreadsheet formula injection

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`ImportExportModal.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/ImportExportModal.tsx#L238-L261)

**Description / evidence:** Account text such as names, ticker, industry, tools, competitor, trigger, and notes is emitted into the CSV. Several cells are wrapped in double quotes, but quoting does not neutralize spreadsheet formulas, and not all fields are escaped consistently. Arbitrary company names and notes can enter through CSV import or company enrichment.

**Expected behavior:** Exported values should be safe to open in spreadsheet applications, including values beginning with formula characters.

**Impact:** A crafted imported field beginning with `=`, `+`, `-`, or `@` may be interpreted as a formula by a spreadsheet application when the CSV is opened.

**Recommended fix:** Use a robust CSV writer and a documented spreadsheet-safe export policy that neutralizes formula-like cell prefixes after accounting for leading whitespace/control characters. Do not rely on double-quoting alone.

**Regression test:** Export values beginning with `=`, `+`, `-`, `@`, tabs, and carriage returns; verify they are emitted as inert text and normal CSV quoting remains valid.

### QAS-010 — Failed headcount revalidation reports a success message

**Severity:** P3 — Low  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`AccountDrawer.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountDrawer.tsx#L127-L184)

**Description / evidence:** The `catch` block logs the error but sets the positive message “Re-validated against technical daemon architecture benchmarks.” despite the request failing. This is indistinguishable from a successful validation in the UI.

**Expected behavior:** A failed revalidation should show a failure state and leave the existing data explicitly marked as not revalidated.

**Impact:** Users may rely on stale data believing it was refreshed.

**Recommended fix:** Set an error state in `catch`; reserve success messaging for a validated response. Separate “benchmark fallback available” from “official source verification succeeded.”

**Regression test:** Mock a network failure and a 500 response; assert an error is shown and no success text or verification badge is added.

### QAS-011 — Discovery selection can include rows hidden by the current filters

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected file:** [`AccountTable.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountTable.tsx#L150-L170) and selection/count logic at [#L319-L340](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountTable.tsx#L319-L340), toolbar at [#L490-L550](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountTable.tsx#L490-L550)

**Description / evidence:** `selectedDiscoveredIds` is pruned when `discoveredAccounts` or `activeAccountView` changes, but not when `searchQuery` or any industry/priority/competitor/tier filter changes. Selection can therefore retain IDs for rows no longer in `filteredAccounts`. The toolbar displays `selectedDiscoveredIds.size` beside `filteredAccounts.length`, and batch promotion submits every selected ID, including hidden rows.

**Reproduction steps:** In the Discovery Radar, select several accounts. Apply a filter that hides some selected rows. Observe that the selection count may exceed the visible row count; press “Add Selected” and the hidden selected accounts are promoted too.

**Expected behavior:** The UI should make it unambiguous whether selection applies to visible filtered rows or all discovered rows. Counts must use the same scope as the batch action.

**Impact:** Users may promote accounts that are no longer visible and may misinterpret the count (for example, “5 of 2 Selected”).

**Recommended fix:** Either clear/prune selection whenever the filtered result changes, or explicitly support cross-filter selection and display a total-discovered selection count with clear wording. Add a confirmation summary of the exact accounts to be promoted.

**Regression test:** Select rows, change search and filters, and verify that the count, selected rows, and batch payload all follow the documented selection scope.

### QAS-012 — “Sweep 5 Verticals (Auto-Ingest)” does not auto-ingest

**Severity:** P2 — Medium  
**Verification:** Statically Verified  
**Confidence:** High  
**Affected files:** [`AccountTable.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/components/AccountTable.tsx#L401-L413), [`App.tsx`](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L515-L521) and the auto-ingestion guard at [#L405-L420](https://github.com/sheryfied/EDA_Signal_Enginer/blob/main/src/App.tsx#L405-L420)

**Description / evidence:** The UI labels the action “Sweep 5 Verticals (Auto-Ingest)” and its tooltip promises direct auto-ingestion. However, `handleSweepAllVerticals` calls `pollBackgroundRadar(true, true)`. The first argument sets `isManual=true`, while account ingestion only runs when `!isManual && autonomousConfig.autoIngestDirectly`. The full sweep therefore follows the manual staging behavior, not the promised auto-ingestion path.

**Expected behavior:** Either a full sweep should ingest directly when that mode is selected, or the label/tooltip should accurately describe that it only stages candidates for review.

**Impact:** Users can believe a full scan populated tracked accounts when it only populated the Discovery Radar; follow-up reporting may be based on an incorrect understanding of the workflow.

**Recommended fix:** Separate “full sweep” from “manual review/auto-ingest” as independent options, or change the UI copy to match the current behavior. Do not make ingestion automatic without an explicit product decision, since that action modifies the tracked roster.

**Regression test:** Click the sweep action with auto-ingest enabled; assert either that new non-duplicate accounts enter the tracked table and signals feed, or that the UI clearly states it is staging rather than auto-ingesting.

## E. Security findings and release risks

1. **Unmetered AI routes (QAS-002):** Prioritize authentication, rate limiting, quotas, and billing alerts before public deployment.
2. **CSV formula injection (QAS-009):** Treat exports as untrusted until dangerous spreadsheet formulas are neutralized.
3. **Evidence provenance (QAS-001):** This is a business-integrity risk as well as a functional defect. Do not use the current `isVerified` flag or citations as proof for live sales execution.
4. **Secrets:** The inspected tree contained `.env.example` but no actual `.env` file or obvious live API key. This is not a full repository-history secret scan; no claim is made that all history/branches were scanned.

## F. Test execution summary

| Command | Result | Notes |
|---|---|---|
| `git clone --depth 1 https://github.com/sheryfied/EDA_Signal_Enginer.git /tmp/eda-audit` | BLOCKED | The execution environment returned `Could not resolve host: github.com`. Source was instead inspected through GitHub's repository connector. |

No `npm install`, `npm run lint`, `npm run build`, browser test, integration test, load test, or dependency vulnerability command was executed. The repository's `package.json` defines `lint` as `tsc --noEmit` but has no `test` script. No test files, lockfile, or GitHub Actions workflow files appeared in the inspected default-branch tree. TypeScript strictness is not enabled in `tsconfig.json`, so the configured type check also would not replace runtime or integration tests.

## G. Missing test coverage

| Coverage gap | Why it matters | Recommended test layer / scenarios | Expected assertion |
|---|---|---|---|
| Dialog lifecycle | Early-return hook defects affect normal open/close interactions | React component tests for all three surfaces | Open/close/reopen without console errors |
| Evidence verification | Current data can claim verification without retrieved sources | Backend integration tests with mocked source retrieval/model outputs | No verified record without a valid source URL and matched quote |
| API abuse controls | Public callers may trigger billable model work | API integration tests | Authentication/rate limits/quota return expected 401/403/429 without a model call |
| CSV round-trip | Import/export is a primary data-transfer workflow | Unit/integration tests with generated CSV fixtures | All supported fields survive export then import |
| Promotion consistency | Single and batch promotion diverge | `App` state/workflow tests | Promoted account and associated signal both exist exactly once |
| Rules end-to-end | Rule editor currently does not modify the engine | Backend and frontend integration tests | Adding/editing/removing a custom rule changes matching behavior as documented |
| Account editing | Drawer draft state can become stale after revalidation | React component test | Saving an older draft cannot silently overwrite refreshed account values |
| Local-storage resilience | Corrupted browser state can block app startup | Startup/hydration tests | Invalid JSON and old schemas fall back safely |
| Error feedback | Network/API failures should not be reported as success | UI tests with rejected fetch / non-2xx responses | Failure text shown; success and verified markers remain absent |

## H. Remediation plan

### Immediate

1. Stop marking model-generated and placeholder records as verified; remove invented citations and the random synthetic-company fallback unless clearly labeled as mock data.
2. Protect and rate-limit AI-backed API routes before exposing the application publicly.
3. Fix conditional hook placement in `AccountDrawer`, `SignalModal`, and `ImportExportModal`.
4. Resolve the mismatch between the full-sweep button label and the actual manual staging behavior; clarify multi-selection scope when filters change.

### Short-term

1. Replace CSV splitting with an RFC-compliant parser/writer and make export/import round-trip safe.
2. Align Discovery Radar selection state and visible counts with the intended filter-selection scope.
3. Unify single and batch promotion behavior so both preserve discovered signals.
4. Wire custom tracked rules into the actual analysis/radar/scoring execution path and fix “Test in Scanner.”
5. Reconcile account-drawer edit drafts after revalidation and harden localStorage hydration.

### Medium-term

1. Add component, API, and end-to-end regression tests for the workflows listed in Section G.
2. Add CI to run type checking, build, and tests on pushes and pull requests.
3. Add a package lockfile and validate dependency updates in CI.
4. Add structured request IDs, safe API error messages, and monitoring for model errors, quota consumption, and discovery results.

### Long-term

1. Separate demo/seed accounts from verified production discoveries in the UI and type system.
2. Make evidence provenance an explicit data model (source URL, retrieval timestamp, quote validation, verification status) instead of a boolean flag.
3. Define acceptance criteria and scoring/calibration tests so sales-intent classifications are measurable rather than prompt-only.

## I. Release readiness assessment

**Decision: NOT READY** for production use as a trusted buying-signal intelligence tool.

The decision is based on three statically verified high-priority concerns: (1) source claims can be presented as verified despite not being sourced, (2) billable AI endpoints have no visible abuse controls, and (3) critical always-mounted UI surfaces violate hook-order rules. CSV round-trip corruption, disconnected rule configuration, filter-persistent multi-selection, and the full-sweep/auto-ingest mismatch further undermine data correctness.

This is a static code audit of the inspected default-branch snapshot, not a claim that every defect has been runtime-reproduced. A local build, TypeScript check, browser automation, API integration tests, dependency audit, and performance tests remain outstanding.
