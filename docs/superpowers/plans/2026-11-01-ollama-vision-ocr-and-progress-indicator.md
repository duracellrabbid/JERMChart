# Ollama Vision OCR & Progress Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Ollama as a first-class local AI provider for zero-cloud-egress chart vision OCR, and resolve UI freezing during diagram analysis with an interactive loading overlay, live step progress, elapsed timer, and request cancellation.

**Architecture:** Extend `AIConfig` to support `'gemini' | 'ollama'`. Implement a modular `ollamaService.ts` for dynamic model discovery (`/api/tags`), connection verification, and vision chat inference (`/api/chat`). Update Electron's security firewall in `electron/main.cjs` to permit local and LAN Ollama endpoints on approved API routes. Update `SettingsModal.tsx` with dynamic model badges and `PhotoImportModal.tsx` with a multi-step loading card and `AbortController`.

**Tech Stack:** React 19, TypeScript 5.7, Zustand 5, Electron 44, Vitest 5, `@google/genai` 2.23, Tailwind CSS.

## Global Constraints
- Every function and hook must maintain Cognitive Complexity strictly `< 15` (SonarSource).
- All regular expressions must run in guaranteed linear time $\mathcal{O}(n)$ with zero catastrophic backtracking. Native string methods preferred.
- All tests must reside inside `src/**/__tests__/*.test.ts(x)` and remain excluded from production builds.
- 100% code coverage threshold strictly enforced across all files (`npm run verify:pre-commit`).
- Production builds and security audits must pass with 0 moderate or higher vulnerabilities (`npm run verify:pre-push`).
- Shell commands executed exclusively via `rtk <command>`.

---

### Task 1: Extend AI Configuration & Validation for Ollama

**Files:**
- Modify: `src/services/ai/aiConfig.ts`
- Modify: `src/__tests__/services/aiConfig.test.ts`

**Interfaces:**
- Consumes: `localStorage` / fallback memory store.
- Produces:
  - `AIProvider = 'gemini' | 'ollama'`
  - `AIConfig`: `{ provider: AIProvider; apiKey: string; model: string; ollamaUrl: string; }`
  - `hasValidAIConfig(config?: AIConfig): boolean`
  - `DEFAULT_AI_CONFIG: AIConfig`

- [ ] **Step 1: Write failing tests for Ollama AIConfig and validation**

In `src/__tests__/services/aiConfig.test.ts`, add test cases for `ollama` provider validation, default config containing `ollamaUrl: 'http://localhost:11434'`, and `hasValidAIConfig()`:

```typescript
it('validates configuration correctly for both gemini and ollama providers', () => {
  expect(hasValidAIConfig({ provider: 'gemini', apiKey: 'AIzaSyKey', model: 'gemini-3.8-flash', ollamaUrl: 'http://localhost:11434' })).toBe(true);
  expect(hasValidAIConfig({ provider: 'gemini', apiKey: '', model: 'gemini-3.8-flash', ollamaUrl: 'http://localhost:11434' })).toBe(false);
  expect(hasValidAIConfig({ provider: 'ollama', apiKey: '', model: 'llama3.2-vision', ollamaUrl: 'http://localhost:11434' })).toBe(true);
  expect(hasValidAIConfig({ provider: 'ollama', apiKey: '', model: '', ollamaUrl: 'http://localhost:11434' })).toBe(false);
  expect(hasValidAIConfig({ provider: 'ollama', apiKey: '', model: 'llama3.2-vision', ollamaUrl: '   ' })).toBe(false);
});

it('migrates legacy stored config and ensures default ollamaUrl is populated', () => {
  const saved = saveAIConfig({ provider: 'ollama', model: 'llama3.2-vision' });
  expect(saved.provider).toBe('ollama');
  expect(saved.ollamaUrl).toBe('http://localhost:11434');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/services/aiConfig.test.ts`  
Expected: FAIL with `hasValidAIConfig is not defined` or property missing.

- [ ] **Step 3: Implement minimal code in `src/services/ai/aiConfig.ts`**

Update `AIProvider`, `AIConfig`, `DEFAULT_CONFIG`, and export `hasValidAIConfig`:

```typescript
export type AIProvider = 'gemini' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  ollamaUrl: string;
}

export const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.8-flash',
  ollamaUrl: 'http://localhost:11434',
};

export function hasValidAIConfig(config?: AIConfig): boolean {
  const target = config || getAIConfig();
  if (target.provider === 'ollama') {
    return target.ollamaUrl.trim().length > 0 && target.model.trim().length > 0;
  }
  return target.apiKey.trim().length > 0 && target.model.trim().length > 0;
}

export function hasValidApiKey(): boolean {
  return hasValidAIConfig();
}
```

Update `getAIConfig()` and `saveAIConfig()` to preserve and sanitize `provider` and `ollamaUrl`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/services/aiConfig.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/aiConfig.ts src/__tests__/services/aiConfig.test.ts
rtk git commit -m "feat(ai): extend AIConfig and validation for Ollama provider"
```

---

### Task 2: Implement Ollama Service (`ollamaService.ts`)

**Files:**
- Create: `src/services/ai/ollamaService.ts`
- Create: `src/__tests__/services/ollamaService.test.ts`

**Interfaces:**
- Consumes: `AIConfig`
- Produces:
  - `interface OllamaModelItem { name: string; isVisionCapable: boolean; size: number; parameterSize?: string; }`
  - `fetchOllamaModels(baseUrl: string): Promise<OllamaModelItem[]>`
  - `testOllamaConnection(baseUrl: string, model?: string): Promise<{ success: boolean; message: string; }>`
  - `callOllamaVision(base64Image: string, mimeType: string, config: AIConfig, signal?: AbortSignal): Promise<string>`

- [ ] **Step 1: Write failing tests for `ollamaService.ts`**

In `src/__tests__/services/ollamaService.test.ts`:
- Test `fetchOllamaModels` with mocked `fetch` returning `/api/tags`: verifies vision detection for `llama3.2-vision:latest`, `llava:13b`, `qwen2.5-coder:7b` (non-vision).
- Test `fetchOllamaModels` handles network timeout/failure cleanly.
- Test `testOllamaConnection` with healthy Ollama and model installed.
- Test `testOllamaConnection` with missing model (suggests `ollama pull`).
- Test `testOllamaConnection` when endpoint is down.
- Test `callOllamaVision` sends correct JSON payload to `/api/chat` without base64 prefix and returns `content`.
- Test `callOllamaVision` propagates error when response is not ok or missing content.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/services/ollamaService.test.ts`  
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/services/ai/ollamaService.ts`**

Implement `isVisionModel(name, family)`, `sanitizeBaseUrl(url)`, `fetchOllamaModels`, `testOllamaConnection`, and `callOllamaVision`. Ensure Cognitive Complexity `< 15` by breaking request building, payload formatting, and error extraction into single-purpose pure functions.

```typescript
const VISION_KEYWORDS = ['vision', 'llava', 'minicpm', 'qwen2.5-vl', 'qwen-vl', 'moondream', 'mllama', 'bakllava'];

export function isVisionModel(name: string, family = ''): boolean {
  const target = `${name.toLowerCase()} ${family.toLowerCase()}`;
  return VISION_KEYWORDS.some((kw) => target.includes(kw));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/services/ollamaService.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/ollamaService.ts src/__tests__/services/ollamaService.test.ts
rtk git commit -m "feat(ai): implement Ollama client service with vision discovery and chat execution"
```

---

### Task 3: Integrate Ollama into Unified Vision & Connection Services

**Files:**
- Modify: `src/services/ai/chartVisionService.ts`
- Modify: `src/services/ai/connectionTestService.ts`
- Modify: `src/__tests__/services/chartVisionService.test.ts`
- Modify: `src/__tests__/services/connectionTestService.test.ts`

**Interfaces:**
- Consumes: `callOllamaVision`, `testOllamaConnection`, `callGeminiVision`
- Produces:
  - `analyzeChartImage(base64Image: string, mimeType: string, config: AIConfig, signal?: AbortSignal): Promise<{ chart: TrustStructureChart; warnings: string[]; }>`
  - `testAIConnection(apiKey: string, model: string, config?: AIConfig): Promise<ConnectionTestResult>`

- [ ] **Step 1: Write failing tests for provider dispatching**

In `src/__tests__/services/chartVisionService.test.ts`:
- Add test for `analyzeChartImage` when `config.provider === 'ollama'`: verifies `callOllamaVision` is invoked and passes `signal`.
- Verify validation throws if `ollamaUrl` is missing when provider is `ollama`.

In `src/__tests__/services/connectionTestService.test.ts`:
- Add test for `testAIConnection` when `config.provider === 'ollama'`: calls `testOllamaConnection`.

- [ ] **Step 2: Run tests to verify failure**

Run: `rtk npm test -- src/__tests__/services/chartVisionService.test.ts src/__tests__/services/connectionTestService.test.ts`  
Expected: FAIL due to missing dispatching.

- [ ] **Step 3: Implement dispatching in `chartVisionService.ts` & `connectionTestService.ts`**

In `chartVisionService.ts`:
```typescript
export async function analyzeChartImage(
  base64Image: string,
  mimeType: string,
  config: AIConfig,
  signal?: AbortSignal
): Promise<{ chart: TrustStructureChart; warnings: string[] }> {
  if (config.provider === 'ollama') {
    if (!config.ollamaUrl || config.ollamaUrl.trim().length === 0) {
      throw new Error('Ollama Server URL is required. Please configure it in Settings.');
    }
    const jsonText = await callOllamaVision(base64Image, mimeType, config, signal);
    return parseRawAiResponse(jsonText);
  }

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('API key is required. Please set your API key in Settings.');
  }

  const jsonText = await callGeminiVision(base64Image, mimeType, config);
  return parseRawAiResponse(jsonText);
}
```

In `connectionTestService.ts`:
Dispatch to `testOllamaConnection` when `config?.provider === 'ollama'`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test -- src/__tests__/services/chartVisionService.test.ts src/__tests__/services/connectionTestService.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/services/ai/chartVisionService.ts src/services/ai/connectionTestService.ts src/__tests__/services/chartVisionService.test.ts src/__tests__/services/connectionTestService.test.ts
rtk git commit -m "feat(ai): wire provider dispatching in vision and connection services"
```

---

### Task 4: Update Electron Security Firewall for Ollama Endpoints

**Files:**
- Modify: `electron/main.cjs:25-50`
- Modify: `src/__tests__/electron/main.test.ts`

**Interfaces:**
- Consumes: Outbound URLs intercepted by `session.defaultSession.webRequest.onBeforeRequest`
- Produces: `isAllowedUrl(rawUrl: string, isDevelopment: boolean): boolean`

- [ ] **Step 1: Write failing tests in `src/__tests__/electron/main.test.ts`**

Add tests:
- `http://localhost:11434/api/tags` -> allowed in dev and prod.
- `http://127.0.0.1:11434/api/chat` -> allowed in dev and prod.
- `http://192.168.1.50:11434/api/tags` -> allowed in dev and prod (LAN private IP).
- `http://localhost:11434/api/unauthorized` -> blocked in prod.
- `http://localhost:5432/api/tags` -> allowed only if path is approved Ollama route, or blocked if non-HTTP.
- `https://evil-site.com/api/chat` -> blocked in prod.
- Dangerous protocols like `file:` remain allowed for local assets, but `ftp:` or `gopher:` blocked.

- [ ] **Step 2: Run test to verify failure**

Run: `rtk npm test -- src/__tests__/electron/main.test.ts`  
Expected: FAIL because production `isAllowedUrl` currently blocks `http://127.0.0.1:11434`.

- [ ] **Step 3: Update `isAllowedUrl` in `electron/main.cjs`**

Define approved Ollama paths and safe host check helper:
```javascript
const ALLOWED_OLLAMA_PATHS = new Set(['/api/tags', '/api/chat', '/api/version']);

function isPrivateOrLoopbackHost(hostname) {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.')) return true;
  if (hostname.startsWith('172.')) {
    const parts = hostname.split('.');
    const second = Number.parseInt(parts[1], 10);
    if (!Number.isNaN(second) && second >= 16 && second <= 31) return true;
  }
  return false;
}
```

In `isAllowedUrl`:
If protocol is `http:` or `https:`, path is in `ALLOWED_OLLAMA_PATHS`, and host is private or loopback, return `true`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/electron/main.test.ts`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add electron/main.cjs src/__tests__/electron/main.test.ts
rtk git commit -m "feat(security): permit safe local and LAN Ollama API routes in Electron firewall"
```

---

### Task 5: Update Settings Modal UI (`SettingsModal.tsx`)

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Modify: `src/__tests__/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `AIConfig`, `fetchOllamaModels`, `testAIConnection`
- Produces: Provider switcher (Gemini vs Ollama), dynamic model listing with `[Vision]` badges, Ollama URL configuration.

- [ ] **Step 1: Write failing tests in `SettingsModal.test.tsx`**

Add tests:
- Renders provider toggle buttons/radios.
- Switching to Ollama shows Server URL input and hides Gemini API key field.
- Displays "Refresh Models" button and fetches models on click or mount.
- Displays `[Vision]` badge next to vision-capable models in dropdown.
- Shows warning banner when a model without vision badge is selected.
- Test connection invokes connection testing with current Ollama URL and model.
- Saving updates stored `AIConfig` with `provider: 'ollama'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/components/settings/SettingsModal.test.tsx`  
Expected: FAIL due to missing Ollama UI controls.

- [ ] **Step 3: Implement Ollama controls in `SettingsModal.tsx`**

Add provider switcher at top of modal.
When `config.provider === 'gemini'`: render existing Gemini model selector and API key field.
When `config.provider === 'ollama'`: render Ollama URL input, refresh button, dynamic model dropdown with vision badges, and zero-egress privacy note.
Ensure Cognitive Complexity `< 15` by breaking Ollama settings sub-form into a focused sub-component.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/components/settings/SettingsModal.test.tsx`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/components/settings/SettingsModal.tsx src/__tests__/components/settings/SettingsModal.test.tsx
rtk git commit -m "feat(ui): add Ollama provider selection and model discovery to SettingsModal"
```

---

### Task 6: Interactive Progress Indicator & Cancellation in Photo Import Modal

**Files:**
- Modify: `src/components/import/PhotoImportModal.tsx`
- Modify: `src/__tests__/components/import/PhotoImportModal.test.tsx`

**Interfaces:**
- Consumes: `hasValidAIConfig`, `analyzeChartImage`, `AbortController`
- Produces: Full-modal loading view, elapsed seconds timer, abort cancellation, and fix for `ConfirmReplaceNotice`.

- [ ] **Step 1: Write failing tests in `PhotoImportModal.test.tsx`**

Add tests:
- Checks `hasValidAIConfig()` instead of only `hasValidApiKey()`.
- When Ollama is selected without configuration, prompts to configure Ollama.
- When analysis begins, displays dedicated loading card with animated spinner, multi-step message, and elapsed timer.
- When `ConfirmReplaceNotice` is accepted, immediately switches to the loading view instead of freezing on the notice.
- Clicking "Cancel Analysis" aborts the request via `AbortController` and resets modal state cleanly.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- src/__tests__/components/import/PhotoImportModal.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Implement loading overlay & abort controller in `PhotoImportModal.tsx`**

Add `abortControllerRef`, `elapsedSeconds` timer using `setInterval`, step progression state, and dedicated `ProcessingView` sub-component with `Loader2` spinner and Cancel button. Fix `executeAnalysis` to reset `showConfirmReplace` immediately on start so the loading view renders.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- src/__tests__/components/import/PhotoImportModal.test.tsx`  
Expected: PASS with 100% coverage.

- [ ] **Step 5: Commit changes**

```bash
rtk git add src/components/import/PhotoImportModal.tsx src/__tests__/components/import/PhotoImportModal.test.tsx
rtk git commit -m "feat(ui): add progress overlay, elapsed timer, and abort control to PhotoImportModal"
```

---

### Task 7: Full Pre-Commit and Pre-Push Verification

**Files:**
- Verify all modified files across codebase.

- [ ] **Step 1: Run pre-commit gate check**

Run: `rtk npm run verify:pre-commit`  
Expected: PASS with 0 ESLint errors/warnings and 100% test coverage across all files.

- [ ] **Step 2: Run pre-push gate check**

Run: `rtk npm run verify:pre-push`  
Expected: PASS with successful Vite/Electron compilation and 0 security vulnerabilities.

- [ ] **Step 3: Verify git status and history**

Run: `rtk git status` and `rtk git log -n 7 --oneline`  
Expected: Clean working tree with discrete, well-structured commits.
