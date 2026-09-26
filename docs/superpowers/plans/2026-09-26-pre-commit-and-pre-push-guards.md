# Pre-Commit & Pre-Push Quality & Security Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish automated Git hooks via Husky that enforce zero lint violations and 100% test coverage before commits, and enforce successful production builds and zero moderate-or-higher security vulnerabilities before git pushes.

**Architecture:** 
- `package.json` defines centralized verification scripts: `verify:pre-commit` (runs `npm run lint` and `npm run test:coverage`) and `verify:pre-push` (runs `npm run build` and `npm run audit:security`).
- Husky 9 hooks (`.husky/pre-commit` and `.husky/pre-push`) trigger these verification scripts directly, preventing non-compliant code from being committed or pushed.
- `main.test.tsx` timeout is adjusted to prevent test runner flakiness under V8 coverage instrumentation.
- Operational documentation in `AGENTS.md` and `.agents/AGENTS.md` is synchronized with the new lifecycle gates.

**Tech Stack:** Husky 9, Vitest 4 (v8 coverage), ESLint 10, npm audit, Vite 6, TypeScript 5.7.

## Global Constraints

- **Pre-commit gate**: Must enforce clean linting (`npm run lint`, exit code 0) AND 100% test coverage across statements, branches, functions, and lines (`npm run test:coverage`, exit code 0).
- **Pre-push gate**: Must enforce production build (`npm run build`, exit code 0) AND zero moderate, high, or critical vulnerabilities (`npm audit --audit-level=moderate`, exit code 0).
- Cognitive complexity of all codebase functions must remain strictly `< 15` (Rule 4).
- All regular expressions must run in guaranteed linear time $\mathcal{O}(n)$ (Rule 5).
- Dedicated `__tests__` directories must remain excluded from production builds (Rule 6).
- All verification commands must be runnable via RTK (`rtk <command>`).

---

### Task 1: Stabilization of Test Runner for Coverage Runs

**Files:**
- Modify: `src/__tests__/main.test.tsx`

**Context:**
- Under V8 coverage instrumentation, dynamically importing `../main` (which loads the complete React, ReactFlow, Dagre, and Excel component tree) takes ~5–8s on Windows, which can occasionally exceed Vitest's default 5s test timeout.
- Explicitly extending `main.test.tsx` timeout ensures `npm run test:coverage` remains 100% deterministic and reliable across all environments.

- [x] **Step 1: Verify `main.test.tsx` timeout configuration**

In `src/__tests__/main.test.tsx`:
```typescript
  it('renders App into root container without errors', async () => {
    const mockRender = vi.fn();
    const mockCreateRoot = vi.fn().mockReturnValue({ render: mockRender });

    vi.doMock('react-dom/client', () => ({
      default: {
        createRoot: mockCreateRoot,
      },
      createRoot: mockCreateRoot,
    }));

    await import('../main');

    expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById('root'));
    expect(mockRender).toHaveBeenCalled();
  }, 25000);
```

- [x] **Step 2: Run test coverage to verify 100% pass & 100% thresholds**

Run: `rtk npm run test:coverage`
Expected: 24 test suites pass, 253 tests pass, all coverage columns (Stmts, Branch, Funcs, Lines) display 100%.

---

### Task 2: Configure Verification Scripts in `package.json`

**Files:**
- Modify: `package.json`

**Scripts to Add / Update:**
- `"audit:security": "npm audit --audit-level=moderate"`
- `"verify:pre-commit": "npm run lint && npm run test:coverage"`
- `"verify:pre-push": "npm run build && npm run audit:security"`

- [x] **Step 1: Add scripts to `package.json`**

Update `package.json` scripts section:
```json
"scripts": {
  "dev": "vite",
  "build": "npm run lint && tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint src",
  "lint:fix": "eslint src --fix",
  "test": "vitest run",
  "test:coverage": "vitest run --coverage",
  "audit:security": "npm audit --audit-level=moderate",
  "verify:pre-commit": "npm run lint && npm run test:coverage",
  "verify:pre-push": "npm run build && npm run audit:security",
  "prepare": "husky",
  "electron:dev": "concurrently -k \"cross-env BROWSER=none vite\" \"wait-on tcp:5173 && cross-env NODE_ENV=development electron .\"",
  "electron:pack": "npm run build && electron-builder --dir",
  "electron:build": "npm run build && electron-builder --win --x64"
}
```

- [x] **Step 2: Verify `npm run audit:security` passes with 0 vulnerabilities**

Run: `rtk npm run audit:security`
Expected: `found 0 vulnerabilities`, exit code 0.

- [x] **Step 3: Verify `npm run verify:pre-commit` passes cleanly**

Run: `rtk npm run verify:pre-commit`
Expected: Linting passes with 0 errors, all 24 test suites pass with 100% coverage.

- [x] **Step 4: Verify `npm run verify:pre-push` passes cleanly**

Run: `rtk npm run verify:pre-push`
Expected: Build passes with exit code 0, audit passes with 0 vulnerabilities.

---

### Task 3: Configure Husky Git Hooks (`.husky/pre-commit` & `.husky/pre-push`)

**Files:**
- Modify: `.husky/pre-commit`
- Create: `.husky/pre-push`

- [x] **Step 1: Update `.husky/pre-commit`**

Configure `.husky/pre-commit` to execute `npm run verify:pre-commit`:
```bash
npm run verify:pre-commit
```

- [x] **Step 2: Create `.husky/pre-push`**

Create `.husky/pre-push` to execute `npm run verify:pre-push`:
```bash
npm run verify:pre-push
```

- [x] **Step 3: Test that hooks prevent bad commits and bad pushes**

1. Verify pre-commit blocks commit if lint fails or test coverage drops below 100%.
2. Verify pre-push blocks push if build fails or a moderate+ vulnerability exists.

---

### Task 4: Synchronize Operational Guidelines (`AGENTS.md` and `.agents/AGENTS.md`)

**Files:**
- Modify: `AGENTS.md`
- Modify: `.agents/AGENTS.md`

- [x] **Step 1: Document pre-commit and pre-push guards in `AGENTS.md`**

1. In Section 1 (Rule 7 / Protocol):
   - Document pre-commit guard: `npm run verify:pre-commit` (lint + 100% test coverage).
   - Document pre-push guard: `npm run verify:pre-push` (build + moderate+ vulnerability audit).
2. In Section 3 (Standard Agent Workflow):
   - Update flowchart and validation checklist to explicitly mention git hook gates.

- [x] **Step 2: Synchronize `.agents/AGENTS.md`**

Ensure `.agents/AGENTS.md` mirrors all updates made to `AGENTS.md`.

- [x] **Step 3: Final complete verification**

Run:
```bash
rtk npm run verify:pre-commit
rtk npm run verify:pre-push
```
Verify all gates pass with exit code 0.
