# Audit Findings Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 10 findings identified in the Ponytail repository audit, improving canvas drag stability, export reliability, spreadsheet parsing accuracy, input validation, and code leaness while strictly maintaining 100% test coverage, cognitive complexity < 15, and zero security vulnerabilities.

**Architecture:**
- Store: Add node coordinate persistence for entity cards and staged person nodes; guard relationship mutations against self-loops and circular cycles.
- Canvas & UI: Bind `onNodeDragStop` on ReactFlow; add Escape key accessibility and dynamic viewport positioning for `ConnectionQuickPicker`; update copy in `PhotoImportModal`.
- File I/O & Parsers: Sanitize export filenames for PNG/SVG; delay Blob URL revocation in export/import modals; detect decimal Excel percentages and scale to 100%; consolidate redundant function aliases.
- Package Lean: Remove unused dependencies `clsx` and `tailwind-merge`.

**Tech Stack:** React 19, TypeScript 5.9, Zustand 5, `@xyflow/react`, `@dagrejs/dagre`, `xlsx`, `jspdf`, Vitest 5.

## Global Constraints

- 100% test coverage threshold strictly enforced on all statements, branches, functions, and lines (`npm run test:coverage`).
- Cognitive complexity strictly below 15 for every function (`eslint-plugin-sonarjs`).
- ReDoS-free linear regular expressions (`eslint-plugin-regexp`).
- Zero moderate or higher npm vulnerabilities (`npm run audit:security`).
- All tests isolated in `__tests__/` and excluded from production builds.
- CLI commands proxied with `rtk`.

---

### Task 1: Remove Unused Production Dependencies (Finding 7)

**Files:**
- Modify: `package.json:31,39`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: None
- Produces: Cleaner `package.json` with `-2` dependencies.

- [ ] **Step 1: Verify current absence of clsx and tailwind-merge imports**

Run: `rtk git grep "from 'clsx'"` and `rtk git grep "from 'tailwind-merge'"`
Expected: No imports in `src/` or `electron/`.

- [ ] **Step 2: Uninstall unused dependencies**

Run: `npm uninstall clsx tailwind-merge`
Expected: `package.json` and `package-lock.json` updated with `clsx` and `tailwind-merge` removed.

- [ ] **Step 3: Verify build and test suite**

Run: `rtk npm test` and `rtk npm run build`
Expected: All tests pass and build succeeds.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused clsx and tailwind-merge dependencies"
```

---

### Task 2: Sanitize Export Filenames & Delay Blob URL Revocation (Findings 2 & 3)

**Files:**
- Modify: `src/utils/exportService.ts:24-49, 152-180`
- Modify: `src/components/import/ExcelImportModal.tsx:45-56`
- Modify: `src/__tests__/utils/exportService.test.ts`
- Modify: `src/__tests__/components/import/ExcelImportModal.test.tsx`

**Interfaces:**
- Consumes: `ChartMetadata`, `TrustStructureChart`
- Produces:
  - `exportToImage(elementId: string, format: 'png' | 'svg', filename: string): Promise<void>` (sanitizes filename)
  - `downloadJsonBackup(chart: TrustStructureChart): void` (async revocation)
  - `downloadExcelStructure(chart: TrustStructureChart): void` (async revocation)

- [ ] **Step 1: Write the failing tests for filename sanitization and deferred revocation**

In `src/__tests__/utils/exportService.test.ts`, add test cases:
```typescript
it('sanitizes illegal filename characters in exportToImage', async () => {
  const container = document.createElement('div');
  container.id = 'test-canvas-node';
  document.body.appendChild(container);

  await exportToImage('test-canvas-node', 'png', 'Smith / Jones: Special *Trust*?');
  expect(mockClick).toHaveBeenCalled();
  expect(mockAnchor.download).toBe('Smith___Jones__Special__Trust___png');
  document.body.removeChild(container);
});

it('delays URL.revokeObjectURL in downloadJsonBackup and downloadExcelStructure', () => {
  vi.useFakeTimers();
  const chart: TrustStructureChart = {
    metadata: { chartTitle: 'Delay Test', effectiveDate: '2026-01-01', confidentialityNotice: 'Notice' },
    entities: [],
    relationships: [],
  };

  downloadJsonBackup(chart);
  expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  expect(mockRevokeObjectURL).toHaveBeenCalled();

  mockRevokeObjectURL.mockClear();
  downloadExcelStructure(chart);
  expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  expect(mockRevokeObjectURL).toHaveBeenCalled();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/utils/exportService.test.ts`
Expected: FAIL due to unsanitized download name and immediate revocation.

- [ ] **Step 3: Implement filename sanitization and deferred URL revocation**

In `src/utils/exportService.ts`:
```typescript
export function sanitizeDownloadFilename(filename?: string, fallback = 'Chart'): string {
  return (filename || fallback).replace(/[^a-z0-9]/gi, '_');
}

export function revokeObjectURLDeferred(url: string, delayMs = 1000): void {
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, delayMs);
}
```
Update `downloadJsonBackup`:
```typescript
link.download = `${sanitizeDownloadFilename(chart.metadata?.chartTitle, 'Trust')}_Structure.json`;
link.href = url;
link.click();
revokeObjectURLDeferred(url);
```
Update `downloadExcelStructure`:
```typescript
link.download = `${sanitizeDownloadFilename(chart.metadata?.chartTitle, 'Trust')}_Structure.xlsx`;
link.href = url;
link.click();
revokeObjectURLDeferred(url);
```
Update `exportToImage`:
```typescript
const safeTitle = sanitizeDownloadFilename(filename, 'Chart');
const link = document.createElement('a');
link.download = `${safeTitle}.${format}`;
link.href = dataUrl;
link.click();
```
In `src/components/import/ExcelImportModal.tsx`, update `handleDownloadTemplate`:
```typescript
a.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test -- src/__tests__/utils/exportService.test.ts src/__tests__/components/import/ExcelImportModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/exportService.ts src/components/import/ExcelImportModal.tsx src/__tests__/utils/exportService.test.ts src/__tests__/components/import/ExcelImportModal.test.tsx
git commit -m "fix: sanitize export filenames and defer blob URL revocation"
```

---

### Task 3: Fix Excel Decimal Percentage Parsing (Finding 4)

**Files:**
- Modify: `src/utils/excelParser.ts:189-195`
- Modify: `src/__tests__/utils/excelParser.test.ts`

**Interfaces:**
- Consumes: Raw Excel cell values
- Produces: Correct 0–100 ownership numbers in `parseExcelWorkbook`

- [ ] **Step 1: Write the failing tests for Excel decimal percentages**

In `src/__tests__/utils/excelParser.test.ts`:
```typescript
it('scales decimal Excel percentages between 0 and 1 up to percentage scale 0-100', () => {
  const rows = [
    { 'Entity Name': 'Parent Co' },
    {
      'Entity Name': 'Half Sub',
      'Parent Entity': 'Parent Co',
      'Ownership %': 0.5, // 50% stored as numeric 0.5 in Excel
    },
    {
      'Entity Name': 'Whole Sub',
      'Parent Entity': 'Parent Co',
      'Ownership %': 1, // 100% stored as numeric 1 in Excel without %
    },
    {
      'Entity Name': 'Explicit String Half Sub',
      'Parent Entity': 'Parent Co',
      'Ownership %': '0.5%', // Explicit fractional percentage preserved
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Structure');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const { chart } = parseExcelWorkbook(buffer);
  const relHalf = chart.relationships.find((r) => r.target === chart.entities.find((e) => e.name === 'Half Sub')?.id);
  const relWhole = chart.relationships.find((r) => r.target === chart.entities.find((e) => e.name === 'Whole Sub')?.id);
  const relExplicit = chart.relationships.find((r) => r.target === chart.entities.find((e) => e.name === 'Explicit String Half Sub')?.id);

  expect(relHalf?.ownershipPercentage).toBe(50);
  expect(relWhole?.ownershipPercentage).toBe(100);
  expect(relExplicit?.ownershipPercentage).toBe(0.5);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/utils/excelParser.test.ts`
Expected: FAIL (`relHalf` is `0.5`, expected `50`).

- [ ] **Step 3: Implement decimal percentage detection**

In `src/utils/excelParser.ts`:
```typescript
export function normalizeOwnershipPercentage(rawVal: unknown): number {
  const rawStr = String(rawVal ?? '').trim();
  let pct = Number.parseFloat(rawStr);
  if (Number.isNaN(pct)) return 100;

  // If input was a raw numeric decimal without literal % (e.g. 0.5 or 1 from Excel percentage formatting)
  if (pct > 0 && pct <= 1 && !rawStr.includes('%')) {
    pct = Math.round(pct * 100 * 100) / 100;
  }
  return pct;
}
```
Replace the inline `Number.parseFloat` in `parseExcelWorkbook` with `normalizeOwnershipPercentage(mapped.ownership)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/utils/excelParser.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/excelParser.ts src/__tests__/utils/excelParser.test.ts
git commit -m "fix: normalize decimal Excel percentages to 0-100 scale"
```

---

### Task 4: Guard `addRelationship` Against Self-Loops and Cycles (Finding 5)

**Files:**
- Modify: `src/store/useStructureStore.ts:353-364`
- Modify: `src/__tests__/store/useStructureStore.test.ts`

**Interfaces:**
- Consumes: `isCycleIntroducingEdge` from `src/utils/graphValidation.ts`
- Produces: Guarded `addRelationship(rel: Omit<OwnershipEdgeData, 'id'>): void`

- [ ] **Step 1: Write the failing tests for self-loop and cycle rejection**

In `src/__tests__/store/useStructureStore.test.ts`:
```typescript
it('rejects self-loops where source and target are the same entity', () => {
  const store = useStructureStore.getState();
  const countBefore = store.relationships.length;

  store.addRelationship({
    source: 'entity-1',
    target: 'entity-1',
    ownershipPercentage: 100,
  });

  expect(useStructureStore.getState().relationships.length).toBe(countBefore);
});

it('rejects cycle-introducing relationships', () => {
  const store = useStructureStore.getState();
  // In sample structure: entity-1 -> entity-2 -> entity-3
  const countBefore = store.relationships.length;

  store.addRelationship({
    source: 'entity-3',
    target: 'entity-1',
    ownershipPercentage: 50,
  });

  expect(useStructureStore.getState().relationships.length).toBe(countBefore);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/store/useStructureStore.test.ts`
Expected: FAIL (self-loop and cycle were allowed).

- [ ] **Step 3: Implement relationship cycle and self-loop guards**

In `src/store/useStructureStore.ts`:
Import `isCycleIntroducingEdge` from `../utils/graphValidation`:
```typescript
import { isCycleIntroducingEdge } from '../utils/graphValidation';
```
In `addRelationship`:
```typescript
addRelationship: (rel) => {
  if (get().isReadOnly) return;
  if (!rel.source || !rel.target || rel.source === rel.target) return;
  const currentRels = get().relationships;
  if (currentRels.some((r) => r.source === rel.source && r.target === rel.target)) return;
  if (isCycleIntroducingEdge(rel.source, rel.target, currentRels)) return;

  get().pushHistory();
  const newRel: OwnershipEdgeData = {
    ...rel,
    id: `rel-${rel.source}-${rel.target}-${Date.now()}`,
  };
  set((state) => ({ relationships: [...state.relationships, newRel] }));
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/store/useStructureStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/useStructureStore.ts src/__tests__/store/useStructureStore.test.ts
git commit -m "fix: guard addRelationship against self-loops and circular ownership"
```

---

### Task 5: Connection Quick Picker Positioning & Keyboard Escape (Findings 6 & 9)

**Files:**
- Modify: `src/components/canvas/ConnectionQuickPicker.tsx:40-84`
- Modify: `src/components/canvas/StructureCanvas.tsx:173-240`
- Modify: `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`
- Modify: `src/__tests__/components/canvas/StructureCanvas.test.tsx`

**Interfaces:**
- Consumes: Keyboard events, mouse/node client coordinates
- Produces: Accessible dialog with Escape key dismiss and viewport-aware coordinates

- [ ] **Step 1: Write failing tests for Escape key dismiss and clamp positioning**

In `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`:
```typescript
it('calls onCancel when Escape key is pressed', () => {
  const onCancel = vi.fn();
  render(
    <ConnectionQuickPicker
      connection={{
        sourceId: 'a',
        sourceName: 'Entity A',
        targetId: 'b',
        targetName: 'Entity B',
        connectionKind: 'entity-to-entity',
      }}
      position={{ x: 300, y: 300 }}
      onConfirm={vi.fn()}
      onCancel={onCancel}
    />
  );

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
});
```
In `src/__tests__/components/canvas/StructureCanvas.test.tsx`:
Test that `resolveConnectionAttempt` positions dialog near connection target or mouse coordinates.

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`
Expected: FAIL (onCancel not called on Escape).

- [ ] **Step 3: Implement Escape listener and dynamic picker placement**

In `src/components/canvas/ConnectionQuickPicker.tsx`:
Add Escape listener:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onCancel]);
```
Clamp position so dialog does not overflow right or bottom of viewport:
```typescript
const modalLeft = Math.min(Math.max(16, position.x - 140), window.innerWidth - 320);
const modalTop = Math.min(Math.max(16, position.y - 120), window.innerHeight - 340);
```
In `src/components/canvas/StructureCanvas.tsx`:
Track last mouse position on canvas or calculate position from target node when `onConnect` triggers:
```typescript
const [cursorPos, setCursorPos] = useState({ x: 400, y: 250 });

const handlePointerMove = useCallback((e: React.PointerEvent) => {
  setCursorPos({ x: e.clientX, y: e.clientY });
}, []);
```
Pass `cursorPos` in `onConnect`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test -- src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx src/__tests__/components/canvas/StructureCanvas.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/ConnectionQuickPicker.tsx src/components/canvas/StructureCanvas.tsx src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx src/__tests__/components/canvas/StructureCanvas.test.tsx
git commit -m "fix: add Escape key dismissal and viewport clamping to quick picker"
```

---

### Task 6: Node Dragging & Coordinate Persistence (Finding 1)

**Files:**
- Modify: `src/types/structure.ts:37-48, 66-73`
- Modify: `src/store/useStructureStore.ts:57-76, 249-265, 306-325`
- Modify: `src/utils/layoutEngine.ts:288-355`
- Modify: `src/components/canvas/StructureCanvas.tsx:85-117, 304-325`
- Modify: `src/__tests__/store/useStructureStore.test.ts`
- Modify: `src/__tests__/components/canvas/StructureCanvas.test.tsx`
- Modify: `src/__tests__/utils/layoutEngine.test.ts`

**Interfaces:**
- Consumes: Node drag events from ReactFlow (`onNodeDragStop`)
- Produces:
  - `EntityNodeData.position?: { x: number; y: number }`
  - `updateEntityPosition(id: string, position: { x: number; y: number }): void`
  - `updateStagedNodePosition(id: string, position: { x: number; y: number }): void`

- [ ] **Step 1: Write the failing tests for node position persistence**

In `src/__tests__/store/useStructureStore.test.ts`:
```typescript
it('updates and persists node position for entity and staged nodes', () => {
  const store = useStructureStore.getState();
  const entity = store.entities[0];

  store.updateEntity(entity.id, { position: { x: 550, y: 320 } });
  expect(useStructureStore.getState().entities[0].position).toEqual({ x: 550, y: 320 });

  const staged = store.stageNode({
    kind: 'person',
    name: 'Test Person',
    role: 'Director',
    position: { x: 100, y: 100 },
  });

  store.updateStagedNodePosition(staged.id, { x: 420, y: 280 });
  const updatedStaged = useStructureStore.getState().stagedNodes.find((s) => s.id === staged.id);
  expect(updatedStaged?.position).toEqual({ x: 420, y: 280 });
});
```
In `src/__tests__/components/canvas/StructureCanvas.test.tsx`:
Add a test verifying that dragging a node fires `onNodeDragStop` and updates the store position rather than snapping back on state changes.

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/store/useStructureStore.test.ts`
Expected: FAIL (property or method missing).

- [ ] **Step 3: Implement position support in types, store, layout engine, and canvas**

1. In `src/types/structure.ts`:
Add `position?: { x: number; y: number }` to `EntityNodeData`.

2. In `src/store/useStructureStore.ts`:
Add `updateStagedNodePosition(id: string, position: { x: number; y: number })`:
```typescript
updateStagedNodePosition: (id, position) => {
  if (get().isReadOnly) return;
  set((state) => ({
    stagedNodes: state.stagedNodes.map((n) => (n.id === id ? { ...n, position } : n)),
  }));
},
```

3. In `src/utils/layoutEngine.ts`:
In `calculateSortedLayout`: if `sortCriteria === 'manual'` and an entity has `entity.position`, use `entity.position` instead of overwriting with Dagre's computed coordinates.

4. In `src/components/canvas/StructureCanvas.tsx`:
Add `onNodeDragStop`:
```typescript
const onNodeDragStop = useCallback(
  (_event: React.MouseEvent, node: Node) => {
    if (isReadOnly) return;
    if (node.type === 'stagedPersonNode') {
      useStructureStore.getState().updateStagedNodePosition(node.id, node.position);
    } else if (node.type === 'entityNode') {
      useStructureStore.getState().updateEntity(node.id, { position: node.position });
    }
  },
  [isReadOnly]
);
```
Wire `onNodeDragStop={onNodeDragStop}` into `<ReactFlow>`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test -- src/__tests__/store/useStructureStore.test.ts src/__tests__/components/canvas/StructureCanvas.test.tsx src/__tests__/utils/layoutEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/structure.ts src/store/useStructureStore.ts src/utils/layoutEngine.ts src/components/canvas/StructureCanvas.tsx src/__tests__/store/useStructureStore.test.ts src/__tests__/components/canvas/StructureCanvas.test.tsx src/__tests__/utils/layoutEngine.test.ts
git commit -m "fix: persist dragged entity and staged node positions on canvas"
```

---

### Task 7: Update Photo OCR Copy & Consolidate Function Aliases (Findings 8 & 10)

**Files:**
- Modify: `src/components/import/PhotoImportModal.tsx:35-37`
- Modify: `src/utils/excelExporter.ts:18-20, 119`
- Modify: `src/utils/excelParser.ts:123-125`
- Modify: `src/utils/exportService.ts:5, 38`
- Modify: `src/__tests__/components/import/PhotoImportModal.test.tsx`
- Modify: `src/__tests__/utils/excelExporter.test.ts`
- Modify: `src/__tests__/utils/excelParser.test.ts`

**Interfaces:**
- Consumes: `formatAssociatedPartiesString`, `parseAssociatedPartiesString`, `exportChartToExcel`
- Produces: Canonical function names without forwarding wrappers

- [ ] **Step 1: Write tests verifying accurate copy and canonical function calls**

In `src/__tests__/components/import/PhotoImportModal.test.tsx`:
Verify text does not mention OpenAI:
```typescript
expect(screen.getByText(/Google Gemini/i)).toBeInTheDocument();
expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
```
In `src/__tests__/utils/excelExporter.test.ts` and `excelParser.test.ts`:
Update test imports to call `formatAssociatedPartiesString`, `parseAssociatedPartiesString`, and `exportChartToExcel` directly.

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/components/import/PhotoImportModal.test.tsx`
Expected: FAIL on OpenAI regex check.

- [ ] **Step 3: Update copy and consolidate aliases**

In `src/components/import/PhotoImportModal.tsx`:
```typescript
<p className="leading-relaxed">
  To transcribe hand-drawn diagrams into digital structure charts, this feature uses
  multimodal vision AI (Google Gemini). Please configure your API key in Settings first.
</p>
```
In `src/utils/exportService.ts`:
Replace `import { exportStructureToExcel } from './excelExporter'` with:
```typescript
import { exportChartToExcel } from './excelExporter';
```
And replace calls to `exportStructureToExcel` with `exportChartToExcel`.
In `src/utils/excelExporter.ts`:
Remove alias `export const exportStructureToExcel = exportChartToExcel;` (or keep as deprecated thin export if required for external tests, or update callers).
Remove alias `export function formatDirectorsString`.
In `src/utils/excelParser.ts`:
Remove alias `export function parseDirectorString`.
Update references across test files.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test`
Expected: PASS across all test files.

- [ ] **Step 5: Commit**

```bash
git add src/components/import/PhotoImportModal.tsx src/utils/excelExporter.ts src/utils/excelParser.ts src/utils/exportService.ts src/__tests__/
git commit -m "refactor: update photo OCR copy and consolidate redundant export aliases"
```

---

### Task 8: Full Verification Pre-Commit and Pre-Push Gates

**Files:**
- Entire repository

**Interfaces:**
- Consumes: Pre-commit and pre-push scripts
- Produces: 100% verified release-ready branch

- [ ] **Step 1: Run pre-commit gate (lint + 100% test coverage)**

Run: `rtk npm run verify:pre-commit`
Expected: ESLint passes with 0 errors and coverage report shows 100% across all files.

- [ ] **Step 2: Run pre-push gate (production build + security audit)**

Run: `rtk npm run verify:pre-push`
Expected: TypeScript compile and Vite build succeed; npm audit reports 0 vulnerabilities.

- [ ] **Step 3: Verify git status**

Run: `rtk git status`
Expected: Clean working tree.
