# Unify AI Vision Schemas & Ollama Structured Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide Ollama with a formal JSON Schema payload (`format: CHART_VISION_SCHEMA`) to enforce constrained decoding, and consolidate shared prompt strings, user instructions, base64 cleaning, and schemas across `chartVisionService.ts` and `ollamaService.ts`.

**Architecture:** Centralize the canonical JSON Schema (`CHART_VISION_SCHEMA`), `SYSTEM_INSTRUCTION`, `VISION_USER_PROMPT`, and `cleanBase64Image()` in `src/services/ai/prompts.ts`. Update `ollamaService.ts` to supply `format: CHART_VISION_SCHEMA` in `callOllamaVision()`. Update `chartVisionService.ts` to use shared utilities and re-export `CHART_VISION_RESPONSE_SCHEMA` for backward compatibility.

**Tech Stack:** TypeScript 5.7, Vitest 5, `@google/genai` 2.23, ESLint 9.

## Global Constraints
- Cognitive complexity strictly `< 15` for every function.
- All regular expressions must run in guaranteed linear time $\mathcal{O}(n)$. Native string methods preferred.
- All tests must reside in `src/**/__tests__/*.test.ts(x)`.
- 100% test coverage threshold strictly enforced across all files (`npm run verify:pre-commit`).
- Production packaging and security audits must pass with 0 vulnerabilities (`npm run verify:pre-push`).
- Shell commands run via `rtk <command>`.

---

### Task 1: Centralize Canonical JSON Schema, Prompts & Image Cleaner in `prompts.ts`

**Files:**
- Modify: `src/services/ai/prompts.ts`
- Create/Modify: `src/__tests__/services/prompts.test.ts`

**Interfaces:**
- Consumes: Nothing
- Produces:
  - `export const SYSTEM_INSTRUCTION: string`
  - `export const VISION_USER_PROMPT: string`
  - `export const CHART_VISION_SCHEMA: Record<string, unknown>`
  - `export function cleanBase64Image(base64: string): string`

- [ ] **Step 1: Write failing tests in `src/__tests__/services/prompts.test.ts`**

Create `src/__tests__/services/prompts.test.ts` testing:
- `CHART_VISION_SCHEMA` has `type: 'object'`, `required: ['entities', 'relationships']`, correct entity types and statuses in enum arrays.
- `cleanBase64Image` strips data URI prefix (e.g. `data:image/png;base64,` and `data:image/jpeg;base64,`), handles plain base64, whitespace, and empty input.
- `VISION_USER_PROMPT` and `SYSTEM_INSTRUCTION` are non-empty strings containing expected extraction instructions.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/services/prompts.test.ts`  
Expected: FAIL due to missing exports.

- [ ] **Step 3: Implement `prompts.ts`**

Define `CHART_VISION_SCHEMA` using standard lowercase JSON Schema types (`'object'`, `'string'`, `'number'`, `'array'`, `'boolean'`). Move `cleanBase64Image` from `ollamaService.ts` to `prompts.ts`. Export `VISION_USER_PROMPT`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/services/prompts.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/prompts.ts src/__tests__/services/prompts.test.ts
rtk git commit -m "feat(ai): centralize canonical vision schema, prompts, and base64 cleaner in prompts.ts"
```

---

### Task 2: Update `ollamaService.ts` to Use `CHART_VISION_SCHEMA` in `/api/chat` Payload

**Files:**
- Modify: `src/services/ai/ollamaService.ts`
- Modify: `src/__tests__/services/ollamaService.test.ts`

**Interfaces:**
- Consumes: `CHART_VISION_SCHEMA`, `SYSTEM_INSTRUCTION`, `VISION_USER_PROMPT`, `cleanBase64Image` from `./prompts`
- Produces: `callOllamaVision(base64Image, mimeType, config, signal?)` sending `format: CHART_VISION_SCHEMA`

- [ ] **Step 1: Write failing test in `src/__tests__/services/ollamaService.test.ts`**

Update test in `src/__tests__/services/ollamaService.test.ts` to verify that `callOllamaVision` sends `format: CHART_VISION_SCHEMA` and `content: VISION_USER_PROMPT` in the `POST /api/chat` payload.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/services/ollamaService.test.ts`  
Expected: FAIL because `format` is currently `'json'`.

- [ ] **Step 3: Update `callOllamaVision` in `src/services/ai/ollamaService.ts`**

Import `CHART_VISION_SCHEMA`, `cleanBase64Image`, and `VISION_USER_PROMPT` from `./prompts`. Re-export `cleanBase64Image` for backward compatibility. Replace `format: 'json'` with `format: CHART_VISION_SCHEMA` and use `VISION_USER_PROMPT`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/services/ollamaService.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/ollamaService.ts src/__tests__/services/ollamaService.test.ts
rtk git commit -m "feat(ai): enforce structured JSON schema on Ollama vision chat payload"
```

---

### Task 3: Update `chartVisionService.ts` to Use Shared Schema and Cleaner

**Files:**
- Modify: `src/services/ai/chartVisionService.ts`
- Modify: `src/__tests__/services/chartVisionService.test.ts`

**Interfaces:**
- Consumes: `CHART_VISION_SCHEMA`, `SYSTEM_INSTRUCTION`, `VISION_USER_PROMPT`, `cleanBase64Image` from `./prompts`
- Produces:
  - `CHART_VISION_RESPONSE_SCHEMA` (aliased to `CHART_VISION_SCHEMA as Schema`)
  - `callGeminiVision` using `cleanBase64Image` and `VISION_USER_PROMPT`

- [ ] **Step 1: Write/update tests in `src/__tests__/services/chartVisionService.test.ts`**

Verify that `callGeminiVision` passes `cleanBase64Image(base64Image)` and `VISION_USER_PROMPT`, and that `CHART_VISION_RESPONSE_SCHEMA` matches `CHART_VISION_SCHEMA`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/services/chartVisionService.test.ts`

- [ ] **Step 3: Update `chartVisionService.ts`**

Import `CHART_VISION_SCHEMA`, `VISION_USER_PROMPT`, `cleanBase64Image` from `./prompts`. Re-export `CHART_VISION_RESPONSE_SCHEMA = CHART_VISION_SCHEMA as unknown as Schema` for backward compatibility. Use `cleanBase64Image(base64Image)` in `inlineData.data`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/services/chartVisionService.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/chartVisionService.ts src/__tests__/services/chartVisionService.test.ts
rtk git commit -m "refactor(ai): unify Gemini vision client with shared canonical schema and prompts"
```

---

### Task 4: Full Pre-Commit & Pre-Push Verification

**Files:**
- All codebase files

- [ ] **Step 1: Run pre-commit gate check**

Run: `rtk npm run verify:pre-commit`  
Expected: PASS with 0 ESLint errors and 100% test coverage across all files.

- [ ] **Step 2: Run pre-push gate check**

Run: `rtk npm run verify:pre-push`  
Expected: PASS with successful Vite/Electron build and 0 vulnerabilities.

- [ ] **Step 3: Check git log**

Run: `rtk git log -n 5 --oneline`  
Expected: Clean linear history of discrete commits.
