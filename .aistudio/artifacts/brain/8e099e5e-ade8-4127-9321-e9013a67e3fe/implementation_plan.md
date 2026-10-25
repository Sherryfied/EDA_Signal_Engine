# Implementation Plan - Fix Signal Discovery Radar & Batch Account Ingestion

Fix the Signal Discovery Radar scanning bugs and implement bulk selection ("Select All", checkboxes, and "Add Selected to Tracked Target Accounts"). Promoted accounts will be immediately removed from the Discovery Radar list upon ingestion into Active Tracked Accounts.

## User Requirements & Clarifications
1. **No Duplicates on Scan**: Consecutive "Scan Radar" clicks will not return the same accounts. The system will pass all active tracked accounts and currently discovered accounts as exclusion filters.
2. **Dynamic AI Synthesis on Exhaustion**: When the pre-vetted catalog pool is exhausted, the backend will dynamically generate fresh real-world engineering enterprises (Semiconductors, Aerospace, Automotive, Defense, Industrial IoT) with EDA/CAD software footprints and source citations using Gemini AI.
3. **Multi-Selection Checkboxes**: The Signal Discovery Radar table will feature:
   - Header checkbox to **"Select All"** (or clear all).
   - Individual checkboxes for each discovered account row.
   - Live badge counter showing "X accounts selected".
4. **Batch Promotion ("Add Selected to Tracked Target Accounts")**:
   - One-click batch promotion button in the table action bar.
   - Once added, accounts are moved directly into Active Tracked Accounts with their detected high-intent signals.
   - As clarified by the user, promoted accounts are cleanly removed from the Discovery Radar view.

---

## Proposed Changes

### 1. Backend: `/server.ts` & AI Radar Synthesis
- Update `/api/discover-market-signals` in `server.ts`:
  - Accept `excludeIds` (containing all existing tracked and discovered accounts).
  - Prioritize untracked accounts from `EXPANDED_MARKET_RADAR`.
  - If untracked catalog candidates are fewer than requested `limit`, call Gemini API (`gemini-2.5-flash` or server-side SDK `GoogleGenAI`) to synthesize new real-world engineering enterprises with realistic EDA license daemons (`snpslmd`, `cdslmd`, `mgcld`, `DSLS.exe`), verified competitor tooling (`Flexera FNMEA`, `OpenLM`, `Manual Scripts`), confidence metrics, and verifiable source citations (10-K filings, career postings, engineering team disclosures).
  - Return distinct, newly discovered accounts.

### 2. Frontend: `src/components/AccountTable.tsx`
- In `activeAccountView === 'discovered'`:
  - Add `selectedDiscoveredIds` state (`Set<string>`).
  - Add `onBatchPromoteDiscoveredAccounts?: (accountIds: string[]) => void` prop.
  - Add a table header checkbox with indeterminate/checked states for "Select All".
  - Add individual checkboxes on each row with clear highlight styling when selected.
  - Add a bulk action bar when `selectedDiscoveredIds.size > 0`:
    - Shows count: `Selected 4 of 12 discovered accounts`.
    - Button: **"Add Selected to Tracked Target Accounts (X)"** (with icon & primary styling).
    - Button: **"Select All Discovered (N)"** / **"Deselect All"**.
    - Individual row action also allows single-click promotion.

### 3. Frontend: `src/App.tsx`
- Implement `handleBatchPromoteDiscoveredAccounts(accountIds: string[])`:
  - Move the selected accounts into `accounts` (Active Tracked Accounts).
  - Merge their signals into the global `signals` feed with high-priority markers.
  - Remove the promoted accounts from `discoveredAccounts` state (per user requirement).
  - Update autonomous radar metrics (`totalAutonomousIngested`).
  - Display informative toast confirmation.
- Update `pollBackgroundRadar(manual = false)`:
  - Exclude both `accounts.map(a => a.id)` and current `discoveredAccounts.map(a => a.id)` so clicking "Scan Radar" always fetches distinct fresh accounts.
  - Append or seamlessly replace fresh candidates without duplicate collisions.

---

## Verification Plan

### Automated Verification
- Run `lint_applet` / `compile_applet` to ensure strict TypeScript compliance with zero errors.
- Test server API `/api/discover-market-signals` with exclusion filters.

### Manual / Browser Verification
- Open Signal Discovery Radar tab.
- Click "Scan Radar" -> verify new unique accounts populate.
- Click "Scan Radar" again -> verify a different set of fresh accounts appears without duplicates.
- Test "Select All" checkbox -> verify all rows check.
- Test unselecting single rows -> verify header checkbox reflects partial selection.
- Click "Add Selected to Tracked Target Accounts" -> verify selected accounts are removed from Discovery Radar and appear immediately in the Active Tracked Accounts list with all signals and citations intact.
