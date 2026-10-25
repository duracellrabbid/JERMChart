# Implementation Plan: Option B (Local Vendored React Flow Structural CSS)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vendor the essential structural layout CSS from `@xyflow/react` locally into `src/styles/xyflow-base.css`, integrate it into `src/index.css`, eliminate direct node_module CSS imports from `StructureCanvas.tsx`, and add automated CSS security assertions.

**Architecture:** Replace the runtime build dependency on `@xyflow/react/dist/style.css` with a vetted, clean, 100% airgapped local stylesheet containing only mandatory canvas coordinate math, handle positioning, and SVG edge layering. Enforce this via a dedicated CSS security test verifying zero `url()`, zero remote `@import`, and zero external network calls in any project stylesheet.

**Tech Stack:** React 19, `@xyflow/react` 12, Tailwind CSS 4, Vitest 4, TypeScript 5.7.

---

## Global Constraints

- **Strict Zero-Telemetry**: No network primitives (`url()`, `@import`, `fetch`, etc.) in any CSS or JS file.
- **Cognitive Complexity**: Under 15 for any TypeScript functions.
- **Linear Regex**: All regex must be ReDoS-free linear patterns.
- **Test Isolation**: All unit and security tests must reside under `src/__tests__/` (excluded from production builds).
- **Quality Gates**: `rtk npm run verify:pre-commit` (100% coverage threshold) and `rtk npm run verify:pre-push` must pass cleanly.

---

## File Structure

```
src/
├── styles/
│   └── xyflow-base.css        # NEW: Audited, local structural CSS for React Flow canvas
├── index.css                  # MODIFIED: Imports local xyflow-base.css alongside Tailwind
├── components/canvas/
│   └── StructureCanvas.tsx    # MODIFIED: Removes '@xyflow/react/dist/style.css' import
└── __tests__/
    └── offline/
        └── cssSecurity.test.ts # NEW: Automated audit asserting zero network vectors in CSS
```

---

## Tasks

### Task 1: Add Automated CSS Security & Isolation Test

**Files:**
- Test: `src/__tests__/offline/cssSecurity.test.ts`

**Interfaces:**
- Validates all `.css` files in `src/` to ensure zero `url(`, zero remote `@import`, zero `expression(`.
- Validates that `StructureCanvas.tsx` does not import from `@xyflow/react/dist/*.css` or any `node_modules` stylesheet.

- [ ] **Step 1: Write the failing CSS security test**
  Create `src/__tests__/offline/cssSecurity.test.ts` asserting:
  1. `src/styles/xyflow-base.css` exists.
  2. All `.css` files in `src/` contain no `url(`, no remote `@import`, and no `expression(`.
  3. `src/components/canvas/StructureCanvas.tsx` has no imports targeting `.css` from `@xyflow/react`.

- [ ] **Step 2: Run test to confirm it fails**
  Run: `rtk npm test -- src/__tests__/offline/cssSecurity.test.ts`
  Verify that it fails because `src/styles/xyflow-base.css` does not exist yet and `StructureCanvas.tsx` still contains the import.

---

### Task 2: Create Local `src/styles/xyflow-base.css`

**Files:**
- Create: `src/styles/xyflow-base.css`

**Interfaces:**
- Produces: CSS rules for `.react-flow`, `.react-flow__pane`, `.react-flow__viewport`, `.react-flow__node`, `.react-flow__handle`, `.react-flow__edge`, `.react-flow__connectionline`, and `.react-flow__controls`.
- Zero opinionated theming (no default shadows, no generic borders, no remote fonts, no `url()`).

- [ ] **Step 1: Create `src/styles/xyflow-base.css`**
  Extract the pure structural coordinate styles from `@xyflow/react/dist/base.css`:
  - Canvas container and viewport matrix transform classes.
  - Node absolute positioning, pointer-events, and transform origins.
  - Handle anchor geometry (`.react-flow__handle-top`, `-bottom`, `-left`, `-right`).
  - SVG edge renderer, selection layers, and connection line overlays.
  - Verify every line has zero `url()`, zero `@import`, and zero remote assets.

---

### Task 3: Update `src/index.css` and Remove Direct Import from `StructureCanvas.tsx`

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/canvas/StructureCanvas.tsx`

**Interfaces:**
- `src/index.css` imports `@import "./styles/xyflow-base.css";` directly after `@import "tailwindcss";`.
- `StructureCanvas.tsx` removes `import '@xyflow/react/dist/style.css';`.

- [ ] **Step 1: Import local CSS in `src/index.css`**
  Add `@import "./styles/xyflow-base.css";` to `src/index.css`.
- [ ] **Step 2: Remove dependency import from `src/components/canvas/StructureCanvas.tsx`**
  Delete `import '@xyflow/react/dist/style.css';` from line 16.
- [ ] **Step 3: Run the CSS security test to verify it passes**
  Run: `rtk npm test -- src/__tests__/offline/cssSecurity.test.ts`
  Confirm all tests pass.

---

### Task 4: Complete Verification & Quality Gates

**Files:**
- Verify: Full test suite, pre-commit gate, pre-push gate.

- [ ] **Step 1: Run full unit test suite**
  Run: `rtk npm test`
  Confirm all 37 test files and 420+ tests pass.
- [ ] **Step 2: Run pre-commit gate**
  Run: `rtk npm run verify:pre-commit`
  Confirm 100% coverage threshold is met across all files.
- [ ] **Step 3: Run pre-push gate**
  Run: `rtk npm run verify:pre-push`
  Confirm production bundle builds cleanly and 0 vulnerabilities exist.
