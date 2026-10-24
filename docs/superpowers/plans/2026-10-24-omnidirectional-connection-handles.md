# Omnidirectional Node Connection Handles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the UX issue where connection can only be established from the right connector of a person node to the left connector of an organization node, enabling seamless, omnidirectional connections from any handle to any handle for both Person-to-Org and Org-to-Org links.

**Architecture:** Switch React Flow to `ConnectionMode.Loose`, unify interactive handle declarations on entity and staged person cards to `type="source"`, provide smooth magnetic snap (`connectionRadius={25}`), validate connections in real time via `isValidConnection`, and introduce a 1-click direction swap button in `ConnectionQuickPicker`.

**Tech Stack:** React 19, `@xyflow/react`, Zustand, TypeScript 5.9, Tailwind CSS 4, Vitest 5.

## Global Constraints

- Cognitive complexity must be strictly $< 15$ for every function/hook (`eslint-plugin-sonarjs`).
- 100% test coverage threshold enforced on statements, branches, functions, and lines (`@vitest/coverage-v8`).
- All shell/CLI commands must be run through `rtk`.
- Test isolation: all tests in dedicated `__tests__/` directory.
- Preserve existing handle IDs (`top-in`, `bottom-out`, `left-in`, `right-in`) so [`layoutEngine.ts`](file:///D:/Shared/JERMApp/JERMChart/src/utils/layoutEngine.ts) edge calculations remain unchanged.

---

### Task 1: Unify Handle Types to Omnidirectional Source Handles

**Files:**
- Modify: `src/components/nodes/EntityCardNode.tsx`
- Modify: `src/components/nodes/StagedPersonNode.tsx`
- Test: `src/__tests__/components/nodes/EntityCardNode.test.tsx`
- Test: `src/__tests__/components/nodes/StagedPersonNode.test.tsx`

**Interfaces:**
- Consumes: `@xyflow/react` Handle components.
- Produces: Omnidirectional handles with `type="source"` and persistent handle IDs (`top-in`, `left-in`, `right-in`, `bottom-out`). Satellite badges have `isConnectable={false}`.

- [x] **Step 1: Write/update tests in `EntityCardNode.test.tsx` and `StagedPersonNode.test.tsx`**
  - Verify all handles on `TrustTriangleCard`, `SubsidiarySquareCard`, `BankCircleCard`, and `StagedPersonNode` are rendered and connectable.
  - Verify `SatelliteRoleCard` handles have `isConnectable={false}`.

- [x] **Step 2: Update `EntityCardNode.tsx`**
  - Change `type="target"` to `type="source"` on `top-in`, `left-in`, and `right-in` across `TrustTriangleCard`, `SubsidiarySquareCard`, and `BankCircleCard`.
  - Add `isConnectable={false}` to satellite cards.

- [x] **Step 3: Update `StagedPersonNode.tsx`**
  - Change `type="target"` to `type="source"` on `top-in` and `left-in`.

- [x] **Step 4: Run unit tests**
  - Run `rtk npm test src/__tests__/components/nodes/` to ensure tests pass.

---

### Task 2: Configure React Flow Loose Connection Mode & Connection Validation

**Files:**
- Modify: `src/components/canvas/StructureCanvas.tsx`
- Modify: `src/index.css`
- Test: `src/__tests__/components/canvas/StructureCanvas.test.tsx`

**Interfaces:**
- Consumes: `ConnectionMode` from `@xyflow/react`, `stagedNodes` from store.
- Produces: `<ReactFlow>` configured with `connectionMode={ConnectionMode.Loose}`, `connectionRadius={25}`, and `isValidConnection` callback.

- [x] **Step 1: Write failing unit test in `StructureCanvas.test.tsx`**
  - Assert `capturedProps.connectionMode === 'loose'`.
  - Assert `capturedProps.connectionRadius === 25`.
  - Assert `capturedProps.isValidConnection` returns `false` for self-connections ($A \rightarrow A$) and person-to-person connections ($P_1 \rightarrow P_2$).
  - Assert `capturedProps.isValidConnection` returns `true` for entity-to-entity and person-to-entity connections.

- [x] **Step 2: Update `StructureCanvas.tsx`**
  - Import `ConnectionMode` from `@xyflow/react`.
  - Implement `isValidConnection` guard.
  - Add `connectionMode={ConnectionMode.Loose}`, `connectionRadius={25}`, and `isValidConnection={isValidConnection}` to `<ReactFlow>`.

- [x] **Step 3: Update `src/index.css`**
  - Ensure `.react-flow__handle.valid` and `.react-flow__handle-valid` trigger green border/background cues.

- [x] **Step 4: Run unit tests**
  - Run `rtk npm test src/__tests__/components/canvas/StructureCanvas.test.tsx`.

---

### Task 3: Add 1-Click Direction Swap in ConnectionQuickPicker

**Files:**
- Modify: `src/components/canvas/ConnectionQuickPicker.tsx`
- Modify: `src/components/canvas/StructureCanvas.tsx`
- Test: `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`

**Interfaces:**
- Consumes: `PendingConnectionInfo`, `relationships` for cycle checking.
- Produces: Swap direction button in `ConnectionQuickPicker` enabling switching parent/subsidiary hierarchy before committing link.

- [x] **Step 1: Write failing test in `ConnectionQuickPicker.test.tsx`**
  - Verify that clicking "Swap Direction" reverses `sourceId`/`sourceName` and `targetId`/`targetName` in the displayed connection and submitted result.

- [x] **Step 2: Implement swap direction logic in `ConnectionQuickPicker.tsx`**
  - Add internal state `currentSource` and `currentTarget` initialized from `connection`.
  - Add "Swap Direction" button with icon next to "▼ connects to".
  - On submit, pass swapped IDs if reversed.

- [x] **Step 3: Run unit tests**
  - Run `rtk npm test src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`.

---

### Task 4: Full Quality Gate Verification

**Files:**
- Test: All suites under `src/__tests__/`

- [x] **Step 1: Run `rtk npm run verify:pre-commit`**
  - Verify ESLint 0 warnings, 0 errors, cognitive complexity $< 15$.
  - Verify 100% test coverage across all files.

- [x] **Step 2: Run `rtk npm run verify:pre-push`**
  - Verify clean production build and 0 audit vulnerabilities.
