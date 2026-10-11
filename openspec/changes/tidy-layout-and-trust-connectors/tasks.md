# Tasks: Tidy Layout, Trust Triangle Connectors, and Association Line Toggle

## Phase 1: Trust Triangle Boundary Connectors
- [x] 1.1 Write failing unit tests for `TrustTriangleCard` / `EntityCardNode` handle positioning at $(78\text{px}, 90\text{px})$ and $(222\text{px}, 90\text{px})$
- [x] 1.2 Implement exact triangle boundary handle coordinates in `TrustTriangleCard` / `EntityCardNode`
- [x] 1.3 Verify tests pass and visual gap is eliminated

## Phase 2: Association Line Style Toggle
- [x] 2.1 Write failing unit tests for `associationLineStyle` in `useStructureStore` and edge rendering in `OwnershipEdge`
- [x] 2.2 Add `associationLineStyle: 'dotted' | 'solid'` and action `setAssociationLineStyle` to `useStructureStore` and `structure.ts`
- [x] 2.3 Implement the toggle button in `AppHeader` toolbar
- [x] 2.4 Update `OwnershipEdge` to conditionally render `strokeDasharray: '4,4'` or solid stroke
- [x] 2.5 Verify store, edge rendering, and toolbar component tests pass

## Phase 3: Auto-Tidy Smart Flank Allocation & Compound Dagre Sizing
- [x] 3.1 Write failing unit tests for sibling rank flank allocation and compound bounding box sizing in `layoutEngine.test.ts`
- [x] 3.2 Implement pure helper functions for rank flank assignment and compound dimension calculation (enforcing cognitive complexity < 15)
- [x] 3.3 Update Dagre layout execution to use compound bounding boxes and unpack entity + satellite coordinates
- [x] 3.4 Verify multi-sibling tiers and dense satellite charts layout with zero overlap

## Phase 4: Verification & Pre-Commit Gates
- [x] 4.1 Run `rtk npm run verify:pre-commit` (lint with cognitive complexity check + 100% test coverage)
- [x] 4.2 Run `rtk npm run verify:pre-push` (build check)
- [x] 4.3 Final validation and report
