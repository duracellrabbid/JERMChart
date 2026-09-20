# 100% Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Achieve 100% test coverage (100% Statements, 100% Branches, 100% Functions, 100% Lines) across the application codebase with zero gaps, adhering to TDD, cognitive complexity < 15, and strict test isolation.

**Architecture:** Configure Vitest v8 coverage thresholds at 100% with precise include/exclude patterns in `vite.config.ts`. Systematically expand test suites for uncovered edge cases across utilities (`exportService`, `layoutEngine`, `excelParser`), state management (`useStructureStore`), UI components (`ExportModal`, `ExcelImportModal`, `EntityCardNode`, `EntityDetailsTab`, `SidebarInspector`), application entry point (`main.tsx`), and desktop integration (`electron/preload.cjs`, `electron/main.cjs`).

**Tech Stack:** Vitest 3, @vitest/coverage-v8, React Testing Library, jsdom, TypeScript, electron.

## Global Constraints

- Every test file must reside inside dedicated `src/**/__tests__/` directories (Rule 6).
- All shell and CLI commands must be executed via `rtk` (Rule 2).
- Cognitive complexity for any helper function or test utility must remain strictly below 15 (Rule 4).
- All regular expressions must be linear and ReDoS-free (Rule 5).
- Coverage thresholds must strictly enforce 100% on lines, functions, branches, and statements.

---

### Task 1: Configure Vitest Coverage & Package Scripts

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

**Interfaces:**
- Configures `test.coverage` in `vite.config.ts` with v8 provider, text/json/html reporters, include `['src/**', 'electron/**']`, exclude `['src/**/__tests__/**', 'src/test/**', 'src/types/**', '**/*.d.ts']`, and 100% thresholds.
- Adds `"test:coverage": "vitest run --coverage"` script to `package.json`.

- [ ] **Step 1: Update `vite.config.ts` with coverage configuration and 100% thresholds**
- [ ] **Step 2: Update `package.json` with `"test:coverage"` script**
- [ ] **Step 3: Run `rtk npm run test:coverage` to verify coverage configuration loads**

---

### Task 2: Comprehensive Test Suite for `exportService.ts` (100% Coverage)

**Files:**
- Modify: `src/__tests__/utils/exportService.test.ts`
- Target: `src/utils/exportService.ts`

**Missing Coverage to Address:**
- `exportToPptx` full execution: mock `pptxgenjs`, test adding text, subtitle, shape, image, footer, and writing file.
- `exportToPptx` error handling: element not found throws error.
- `exportToPptx` fallback: element without `.react-flow__viewport`.
- `exportToPptx` fallback metadata: default title, default clientReference, default confidentialityNotice.
- `exportToPdf` fallback metadata: default title, default confidentialityNotice, element without `.react-flow__viewport`.
- `downloadJsonBackup`: fallback title when empty.
- `parseJsonBackup`: malformed JSON, non-object JSON, null JSON, missing entities/relationships.

- [ ] **Step 1: Add mock for `pptxgenjs` in `exportService.test.ts`**
- [ ] **Step 2: Add test cases for `exportToPptx` success and failure branches**
- [ ] **Step 3: Add test cases for `exportToPdf` fallback branches**
- [ ] **Step 4: Add test cases for `parseJsonBackup` invalid payloads**
- [ ] **Step 5: Run `rtk npm test -- src/__tests__/utils/exportService.test.ts` and verify 100% coverage**

---

### Task 3: Comprehensive Test Suite for `layoutEngine.ts` (100% Coverage)

**Files:**
- Modify: `src/__tests__/utils/layoutEngine.test.ts`
- Target: `src/utils/layoutEngine.ts`

**Missing Coverage to Address:**
- Lines 122-123: Relationship whose source/target edge was not registered in `parentToChildren` loop (e.g. cross-link or edge originating from node not in entities list).
- Sorting branches in `layoutEngine`:
  - `alphabetical`: matching names (tie-break).
  - `ownership`: matching percentages (tie-break).
  - `jurisdiction`: matching jurisdictions (tie-break).
  - `manual` / default fallback order.
- `getEntityDimensions`: all entity types ('Trust', 'Trust Company', 'Foundation', 'Individual', 'Operating Company', and default).

- [ ] **Step 1: Add test cases for cross-links and unregistered relationship edges**
- [ ] **Step 2: Add test cases for all sibling sorting criteria and tie-breaks**
- [ ] **Step 3: Add test cases for all entity type dimensions**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/utils/layoutEngine.test.ts` and verify 100% coverage**

---

### Task 4: Comprehensive Test Suite for `excelParser.ts` (100% Coverage)

**Files:**
- Modify: `src/__tests__/utils/excelParser.test.ts`
- Target: `src/utils/excelParser.ts`

**Missing Coverage to Address:**
- Lines 61-62 in `splitTopLevel`: comma-separated strings without `;` or `\n`, including nested parentheses/brackets and empty segments.
- Empty or non-string input to `parseDirectorString`.
- Fallback entity type resolution when type column contains unrecognized value.
- Missing headers, non-array sheets, and invalid workbooks.

- [ ] **Step 1: Add test cases for `splitTopLevel` with comma delimiters and parenthesis nesting**
- [ ] **Step 2: Add test cases for empty/non-string inputs in director parsing**
- [ ] **Step 3: Add test cases for edge cases in entity and relationship parsing from sheets**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/utils/excelParser.test.ts` and verify 100% coverage**

---

### Task 5: Comprehensive Test Suite for `useStructureStore.ts` (100% Coverage)

**Files:**
- Modify: `src/__tests__/store/useStructureStore.test.ts`
- Target: `src/store/useStructureStore.ts`

**Missing Coverage to Address:**
- Line 68: `addEntity` with undefined `directors` and undefined `ubosOrBeneficiaries`.
- `addRelationship`: duplicate relationship prevention (returns unchanged state).
- `deleteEntity`: deleting an entity that is currently selected vs not selected.
- `updateEntity` and `updateRelationship` on non-existent IDs.

- [ ] **Step 1: Add test cases for `addEntity` default directors and UBO fallbacks**
- [ ] **Step 2: Add test cases for duplicate relationship prevention**
- [ ] **Step 3: Add test cases for `deleteEntity` with selectedEntityId match and mismatch**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/store/useStructureStore.test.ts` and verify 100% coverage**

---

### Task 6: Comprehensive Test Suite for `ExportModal.tsx` (100% Coverage)

**Files:**
- Modify: `src/__tests__/components/export/ExportModal.test.tsx`
- Target: `src/components/export/ExportModal.tsx`

**Missing Coverage to Address:**
- Lines 32, 44, 56, 68: Error rejection branches in `handleExportPng`, `handleExportSvg`, `handleExportPdf`, `handleExportPptx` (both Error objects and non-Error strings).
- Line 81: `handleUploadBackup` when no file is selected.
- Line 92: `handleUploadBackup` when `parseJsonBackup` returns null.
- File input ref reset in `finally` block.

- [ ] **Step 1: Add test cases for PNG, SVG, PDF, PPTX export error catches**
- [ ] **Step 2: Add test cases for upload backup with no file and corrupted JSON**
- [ ] **Step 3: Run `rtk npm test -- src/__tests__/components/export/ExportModal.test.tsx` and verify 100% coverage**

---

### Task 7: Comprehensive Test Suite for `ExcelImportModal.tsx` (100% Coverage)

**Files:**
- Modify: `src/__tests__/components/import/ExcelImportModal.test.tsx`
- Target: `src/components/import/ExcelImportModal.tsx`

**Missing Coverage to Address:**
- Line 72: Parsing error catch with custom error message vs fallback generic error message.
- Line 81: `handleFileChange` when `e.target.files` is empty/undefined.
- Lines 92-94: `handleDragLeave` when `relatedTarget` is within current target vs outside.
- Line 101: `handleDrop` when `e.dataTransfer.files` is empty/undefined.
- Line 106: `handleApplyToCanvas` when `parsedData` is null.
- Template download button click.

- [ ] **Step 1: Add test cases for empty file change and drag/drop events**
- [ ] **Step 2: Add test cases for error parsing without message**
- [ ] **Step 3: Add test cases for template download click and applying when null**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/components/import/ExcelImportModal.test.tsx` and verify 100% coverage**

---

### Task 8: Comprehensive Test Suite for `EntityCardNode.tsx` (100% Coverage)

**Files:**
- Modify: `src/__tests__/components/nodes/EntityCardNode.test.tsx`
- Target: `src/components/nodes/EntityCardNode.tsx`

**Missing Coverage to Address:**
- Line 263: `SubsidiarySquareCard` with empty/undefined directors ("No directors recorded").
- Line 157: `TrustTriangleCard` with empty/undefined directors ("No directors recorded").
- Director toggle action: clicking director name sets highlighted director; clicking again unsets it.
- Resident badge rendering for resident vs non-resident directors.
- Registration number rendering when present vs absent.
- UBO / Beneficiaries: single UBO vs multiple UBOs (`+N` badge).
- Status dot colors across all entity statuses ('Active', 'Dormant', 'In Liquidation', 'Nominee').
- Dimmed and targeted visual states when another director is highlighted.

- [ ] **Step 1: Add test cases for empty directors in both square and triangular cards**
- [ ] **Step 2: Add test cases for director toggle, residency badge, and UBO badges**
- [ ] **Step 3: Add test cases for dimmed and targeted director states**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/components/nodes/EntityCardNode.test.tsx` and verify 100% coverage**

---

### Task 9: Comprehensive Test Suite for `EntityDetailsTab.tsx` & `SidebarInspector.tsx` (100% Coverage)

**Files:**
- Modify: `src/__tests__/components/sidebar/SidebarInspector.test.tsx`
- Target: `src/components/sidebar/EntityDetailsTab.tsx`
- Target: `src/components/sidebar/SidebarInspector.tsx`

**Missing Coverage to Address:**
- In `SidebarInspector.tsx`: collapse button and expand button clicks.
- In `EntityDetailsTab.tsx`:
  - Lines 137, 147, 171, 226: empty registration number, empty tax ID, resident badge (false vs true), empty notes.
  - Adding a director with empty inputs vs filled inputs.
  - Updating entity type and status via select dropdowns.

- [ ] **Step 1: Add test cases for collapsing and expanding SidebarInspector**
- [ ] **Step 2: Add test cases for fallback field values, empty notes, and resident status in EntityDetailsTab**
- [ ] **Step 3: Add test cases for adding a director and changing type/status in EntityDetailsTab**
- [ ] **Step 4: Run `rtk npm test -- src/__tests__/components/sidebar/SidebarInspector.test.tsx` and verify 100% coverage**

---

### Task 10: Test Suite for `src/main.tsx` (100% Coverage)

**Files:**
- Create: `src/__tests__/main.test.tsx`
- Target: `src/main.tsx`

**Coverage Strategy:**
- Mock `createRoot` and `react-dom/client`, verify `createRoot` is called with `#root` element and `.render()` is invoked with `React.StrictMode` and `App`.
- Dynamically import `../main` in test.

- [ ] **Step 1: Create `src/__tests__/main.test.tsx` with DOM root setup and mock `createRoot`**
- [ ] **Step 2: Run `rtk npm test -- src/__tests__/main.test.tsx` and verify 100% coverage**

---

### Task 11: Test Suite for `electron/preload.cjs` & `electron/main.cjs` (100% Coverage)

**Files:**
- Create: `src/__tests__/electron/preload.test.ts`
- Create: `src/__tests__/electron/main.test.ts`
- Target: `electron/preload.cjs`
- Target: `electron/main.cjs`

**Coverage Strategy:**
- `preload.test.ts`: mock `electron.contextBridge`, require `preload.cjs`, assert `exposeInMainWorld` called with `desktopApp`.
- `main.test.ts`: mock `electron` (`app`, `BrowserWindow`, `Menu`, `shell`), test `createWindow`, test all menu clicks (reload, exit, zoom, documentation), test window open handler, dev server vs production file load, `whenReady`, `activate`, and `window-all-closed` (darwin vs non-darwin).

- [ ] **Step 1: Create `src/__tests__/electron/preload.test.ts`**
- [ ] **Step 2: Create `src/__tests__/electron/main.test.ts` covering all lifecycle events, menus, and window handlers**
- [ ] **Step 3: Run `rtk npm test -- src/__tests__/electron/` and verify 100% coverage**

---

### Task 12: Verification and Quality Enforcement

**Files:**
- Verify: Full test suite with coverage
- Verify: Cognitive complexity (< 15)
- Verify: ReDoS safety
- Verify: Build and release packaging exclusion

- [ ] **Step 1: Run `rtk npm run test:coverage` and assert 100% across all metrics**
- [ ] **Step 2: Run `rtk npm run build` to confirm production build succeeds without test leaks**
- [ ] **Step 3: Review cognitive complexity and regex to ensure compliance with Rules 4 & 5**
