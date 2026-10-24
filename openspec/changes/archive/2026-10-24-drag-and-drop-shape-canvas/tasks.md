## 1. Test Setup & Foundation

- [x] 1.1 Create unit test fixtures for canvas drag events, connection quick-picker configurations, and topological hierarchy sorting in `src/__tests__/components/canvas/FloatingShapeDock.test.tsx` and `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`.
- [x] 1.2 Write failing tests in `src/__tests__/store/stagedNodes.test.ts` verifying staged node mutations, cycle detection, and undo/redo snapshots.

## 2. Store & Hierarchy Infrastructure

- [x] 2.1 Extend `useStructureStore.ts` with `stagedNodes: StagedNodeData[]` slice and actions (`stageNode`, `unstageNode`, `connectStagedPersonToEntity`).
- [x] 2.2 Implement linear $\mathcal{O}(V+E)$ directed cycle detection helper in `src/utils/graphValidation.ts` to prevent circular ownership loops.
- [x] 2.3 Update `src/utils/treeHierarchy.ts` with topological lineage ordering helper (`deriveLineageHierarchy`) sorting roots, holding companies, operating subsidiaries, and staged draft nodes.

## 3. UI Components Implementation

- [x] 3.1 Implement `FloatingShapeDock.tsx` with draggable chips for Trust, Holding Company, Operating Company, LLC, Bank, and Person token.
- [x] 3.2 Implement `ConnectionQuickPicker.tsx` popover supporting ownership % presets (100%, 50%, custom), share classes, and fiduciary role assignments (`Director`, `Settlor`, `Protector`, `Enforcer`, `Beneficiary/UBO`).
- [x] 3.3 Wire drag-and-drop handlers (`onDragOver`, `onDrop` using `screenToFlowPosition`) and connection interceptor in `src/components/canvas/StructureCanvas.tsx`.

## 4. Dock-and-Absorb Integration & Lineage Sorting

- [x] 4.1 Implement dock-and-absorb transition: converting dropped/connected person tokens into `associatedParties` on target entity and triggering satellite flank layout.
- [x] 4.2 Connect `TreeOutlineTab.tsx` and `EntityDetailsTab.tsx` to display lineage-sorted hierarchies and unlinked draft sections.
- [x] 4.3 Add visual connection cues (highlighting drop target cards and handle feedback) during edge dragging.

## 5. Verification & Quality Gates

- [x] 5.1 Run `rtk npm run lint` to verify zero ESLint errors and confirm cognitive complexity is strictly below 15 for all new functions.
- [x] 5.2 Run `rtk npm run test:coverage` to verify 100% test coverage across all new and modified components.
- [x] 5.3 Run `rtk npm run verify:pre-commit` and `rtk npm run verify:pre-push` to confirm production build and security compliance.
