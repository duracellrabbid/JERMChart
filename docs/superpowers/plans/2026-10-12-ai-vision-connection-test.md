# AI Vision Connection Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a standalone CLI diagnostics script to test Gemini API key and multimodal Vision connection, and improve connection testing and error reporting in the JERMChart UI.

**Architecture:** Create `src/services/ai/connectionTestService.ts` for connection testing and error parsing logic. Use it in `SettingsModal.tsx`. Add `scripts/test-ai-connection.mjs` as a standalone Node script with CLI arguments and environment variable support.

**Tech Stack:** TypeScript, React, `@google/genai`, Vitest, Node.js (ESM).

## Global Constraints

- ESLint cognitive complexity strictly below 15.
- All regex must be linear and ReDoS-free.
- Tests must reside exclusively in `__tests__/` directories.
- Maintain 100% test coverage threshold (`verify:pre-commit`).

---

### Task 1: Connection Test Service & Error Parsing

**Files:**
- Create: `src/services/ai/connectionTestService.ts`
- Test: `src/__tests__/services/connectionTestService.test.ts`

**Interfaces:**
- Produces:
  - `extractErrorMessage(error: unknown): string`
  - `testAIConnection(apiKey: string, model?: string): Promise<{ success: boolean; message: string }>`

- [ ] **Step 1: Write failing tests in `src/__tests__/services/connectionTestService.test.ts`**
- [ ] **Step 2: Run test to verify it fails (`rtk npm test src/__tests__/services/connectionTestService.test.ts`)**
- [ ] **Step 3: Implement `src/services/ai/connectionTestService.ts`**
- [ ] **Step 4: Run test to verify it passes**

---

### Task 2: Integrate `connectionTestService` into `SettingsModal.tsx`

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Test: `src/__tests__/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- Consumes:
  - `testAIConnection`, `extractErrorMessage` from `src/services/ai/connectionTestService.ts`

- [ ] **Step 1: Update tests in `src/__tests__/components/settings/SettingsModal.test.tsx` to verify clean error message display**
- [ ] **Step 2: Refactor `handleTestConnection` in `SettingsModal.tsx` to use `testAIConnection`**
- [ ] **Step 3: Run vitest for `SettingsModal.test.tsx` and verify all tests pass**

---

### Task 3: Standalone Diagnostic Script (`scripts/test-ai-connection.mjs`)

**Files:**
- Create: `scripts/test-ai-connection.mjs`
- Modify: `package.json` (add `"test:ai": "node scripts/test-ai-connection.mjs"`)

**Interfaces:**
- Standalone CLI utility running on Node >= 20.
- Usage: `node scripts/test-ai-connection.mjs [API_KEY] [--model=gemini-3.8-flash]`

- [ ] **Step 1: Create `scripts/test-ai-connection.mjs` supporting arguments, env var, ping test, and multimodal vision test**
- [ ] **Step 2: Add `"test:ai"` npm script to `package.json`**
- [ ] **Step 3: Test execution with dummy key (`node scripts/test-ai-connection.mjs dummy_key`) and verify formatted diagnostics**

---

### Task 4: Verification and Quality Gates

- [ ] **Step 1: Run `npm run verify:pre-commit` (lint + 100% test coverage)**
- [ ] **Step 2: Run `npm run verify:pre-push` (build + security audit)**
