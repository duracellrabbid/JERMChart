## 1. State Management & Types

- [x] 1.1 Update `src/store/useStructureStore.ts` to add `directorCap: number | 'all'` (default: 3) and `isExportMode: boolean` (default: false) to store state
- [x] 1.2 Implement store actions `setDirectorCap(cap: number | 'all')` and `setExportMode(isExport: boolean)` with undo/redo snapshot safety
- [x] 1.3 Add unit tests in `src/__tests__/store/useStructureStore.test.ts` verifying directorCap and isExportMode mutations

## 2. Predictive Sizing & Layout Engine

- [x] 2.1 Implement pure helper `calculateTrustDimensions(entity: EntityNodeData, cap: number | 'all')` in `src/utils/layoutEngine.ts` with aspect ratio $R \approx 1.25$ and cognitive complexity $< 15$
- [x] 2.2 Implement pure helper `calculateSubsidiaryDimensions(entity: EntityNodeData, cap: number | 'all', isExportMode: boolean)` in `src/utils/layoutEngine.ts`
- [x] 2.3 Update `getEntityDimensions(type: EntityType, entity?: EntityNodeData, cap?: number | 'all', isExportMode?: boolean)` in `src/utils/layoutEngine.ts` preserving backward compatibility for existing callers
- [x] 2.4 Update `calculateSortedLayout` in `src/utils/layoutEngine.ts` to accept `cap` and `isExportMode`, setting dynamic Dagre node dimensions and populating `computedWidth` and `computedHeight` on node data
- [x] 2.5 Add comprehensive unit tests in `src/__tests__/utils/layoutEngine.test.ts` covering geometric bounds, aspect ratio, and director capping

## 3. Node Components & Geometric Containment

- [x] 3.1 Refactor `TrustTriangleCard` in `src/components/nodes/EntityCardNode.tsx` to use dynamic SVG polygon points `${w/2},6 ${w-8},${h-6} 8,${h-6}` based on computed dimensions
- [x] 3.2 Restructure `TrustTriangleCard` apex into a compact vertical stack (24px icon circle + compact type/status pill) and replace fixed pixel widths with proportional tier widths (32%, 62%, 85%)
- [x] 3.3 Implement director capping on `TrustTriangleCard` and `SubsidiarySquareCard` displaying `+N more directors...` when director count exceeds `directorCap`
- [x] 3.4 Add interactive hover popover (displaying remaining directors) and click handler (navigating to sidebar directory) on the overflow badge
- [x] 3.5 Update `src/__tests__/components/nodes/EntityCardNode.test.tsx` testing boundary containment, dynamic SVG points, and overflow badge interactions

## 4. Header UI & Export Lifecycle

- [x] 4.1 Add Visible Directors selector dropdown (`2`, `3`, `4`, `5`, `All`) to `src/components/header/AppHeader.tsx` connected to `setDirectorCap`
- [x] 4.2 Update `src/components/canvas/StructureCanvas.tsx` to subscribe to `directorCap` and `isExportMode` from store and pass to `calculateSortedLayout`
- [x] 4.3 Wrap export actions in `src/components/export/ExportModal.tsx` (`handleExportPng`, `handleExportSvg`, `handleExportPdf`, `handleExportPptx`) with `setExportMode(true)` and `setExportMode(false)` in `try...finally` blocks
- [x] 4.4 Update `src/__tests__/components/header/AppHeader.test.tsx` and `src/__tests__/components/export/ExportModal.test.tsx` verifying director cap changes and export lifecycle triggers

## 5. Verification & Quality Gates

- [x] 5.1 Run `rtk npm run lint` to verify zero ESLint errors and cognitive complexity $< 15$
- [x] 5.2 Run `rtk npm run test:coverage` to confirm 100% test coverage across all modified files
- [x] 5.3 Run `rtk npm run verify:pre-commit` and `rtk npm run verify:pre-push` to ensure production compilation and security audit pass
