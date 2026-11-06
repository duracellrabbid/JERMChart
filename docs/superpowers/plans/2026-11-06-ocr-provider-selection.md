# OCR AI Provider Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to choose between Gemini and Ollama when importing structure charts via OCR if both providers are configured, or show a clear provider and model label if only one is configured, with persistence of the provider selection.

**Architecture:** Extend `AIConfig` to independently store provider-specific models (`geminiModel` and `ollamaModel`) while maintaining backwards compatibility with `model`. Add helper utilities in `aiConfig.ts` to evaluate provider setup status and retrieve provider details. Update `SettingsModal` so switching tabs does not overwrite either provider's model. Update `PhotoImportModal` to render a provider selector (Option A, placed directly above the dropzone) when both are configured, and display the active provider and model label (`Provider (Model)`) in all configured states.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vitest, Testing Library, Zustand.

## Global Constraints

- **Rule 1 (context-mode)**: Use targeted line ranges and avoid dumping raw unbounded outputs into context.
- **Rule 2 (rtk)**: Prefix all terminal/CLI executions with `rtk` (e.g., `rtk npm test`).
- **Rule 3 (codegraph)**: Ground structural understanding in `codegraph`.
- **Rule 4 (Cognitive Complexity)**: Every function, callback, and hook must maintain cognitive complexity strictly below 15.
- **Rule 5 (Linear ReDoS-Free Regex)**: All regex must be linear $\mathcal{O}(n)$. Prefer string primitives (`includes`, `startsWith`, `slice`).
- **Rule 6 (Test Isolation)**: All tests must live in dedicated `__tests__/` directories excluded from production builds.
- **Rule 7 (Superpower Discipline)**: TDD, systematic verification, and pre-commit gate checks before completion.

---

### Task 1: Extend `AIConfig` and Provider Setup Utilities

**Files:**
- Modify: `src/services/ai/aiConfig.ts`
- Test: `src/__tests__/services/aiConfig.test.ts`

**Interfaces:**
- Consumes: `AIConfig`, `DEFAULT_CONFIG`, `STORAGE_KEY` from `src/services/ai/aiConfig.ts`
- Produces:
  - `isGeminiConfigured(config?: AIConfig): boolean`
  - `isOllamaConfigured(config?: AIConfig): boolean`
  - `getConfiguredProviders(config?: AIConfig): AIProvider[]`
  - `getProviderModel(provider: AIProvider, config?: AIConfig): string`
  - `getProviderDisplayName(provider: AIProvider): string`
  - `geminiModel?: string` and `ollamaModel?: string` fields on `AIConfig`

- [ ] **Step 1: Write the failing tests in `src/__tests__/services/aiConfig.test.ts`**

Add test cases covering:
1. `isGeminiConfigured` returning `true` when `apiKey` is non-empty and `geminiModel` (or active `model` for gemini) is non-empty, and `false` otherwise.
2. `isOllamaConfigured` returning `true` when `ollamaUrl` is non-empty and `ollamaModel` (or active `model` for ollama) is non-empty, and `false` otherwise.
3. `getConfiguredProviders` returning `['gemini', 'ollama']`, `['gemini']`, `['ollama']`, or `[]`.
4. `getProviderModel` returning the model for each provider with defaults.
5. `saveAIConfig` preserving both `geminiModel` and `ollamaModel` without clobbering each other.
6. Legacy migration populating `geminiModel` / `ollamaModel` gracefully from stored `model`.

```typescript
// Test additions to src/__tests__/services/aiConfig.test.ts
describe('provider setup criteria and independent models', () => {
  it('identifies gemini setup status accurately based on apiKey and model', () => {
    expect(isGeminiConfigured({ provider: 'gemini', apiKey: 'test-key', model: 'gemini-3.8-flash', ollamaUrl: '' })).toBe(true);
    expect(isGeminiConfigured({ provider: 'gemini', apiKey: '   ', model: 'gemini-3.8-flash', ollamaUrl: '' })).toBe(false);
    expect(isGeminiConfigured({ provider: 'gemini', apiKey: 'test-key', model: '', geminiModel: '', ollamaUrl: '' })).toBe(false);
  });

  it('identifies ollama setup status accurately based on ollamaUrl and model', () => {
    expect(isOllamaConfigured({ provider: 'ollama', apiKey: '', model: 'llama3.2-vision', ollamaUrl: 'http://localhost:11434' })).toBe(true);
    expect(isOllamaConfigured({ provider: 'ollama', apiKey: '', model: '', ollamaModel: '', ollamaUrl: 'http://localhost:11434' })).toBe(false);
    expect(isOllamaConfigured({ provider: 'ollama', apiKey: '', model: 'llama3.2-vision', ollamaUrl: '   ' })).toBe(false);
  });

  it('returns configured providers list', () => {
    expect(getConfiguredProviders({
      provider: 'gemini',
      apiKey: 'key',
      geminiModel: 'gemini-3.8-flash',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2-vision',
      model: 'gemini-3.8-flash',
    })).toEqual(['gemini', 'ollama']);
  });

  it('preserves both geminiModel and ollamaModel when saving configuration', () => {
    saveAIConfig({
      apiKey: 'gemini-key',
      geminiModel: 'gemini-3.8-flash',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.2-vision',
    });
    const config = getAIConfig();
    expect(config.geminiModel).toBe('gemini-3.8-flash');
    expect(config.ollamaModel).toBe('llama3.2-vision');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/services/aiConfig.test.ts`
Expected: FAIL due to missing exported helper functions.

- [ ] **Step 3: Implement minimal code in `src/services/ai/aiConfig.ts`**

Update `AIConfig` interface and implement:
- `geminiModel?: string;`
- `ollamaModel?: string;`
- `isGeminiConfigured(config?: AIConfig): boolean`
- `isOllamaConfigured(config?: AIConfig): boolean`
- `getConfiguredProviders(config?: AIConfig): AIProvider[]`
- `getProviderModel(provider: AIProvider, config?: AIConfig): string`
- `getProviderDisplayName(provider: AIProvider): string`
- Update `getAIConfig()` and `saveAIConfig()` to handle and synchronize `geminiModel`, `ollamaModel`, and `model`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/services/aiConfig.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/services/ai/aiConfig.ts src/__tests__/services/aiConfig.test.ts
git commit -m "feat(ai): add provider-specific model persistence and setup helpers"
```

---

### Task 2: Preserve Dual Provider Configuration in `SettingsModal`

**Files:**
- Modify: `src/components/settings/SettingsModal.tsx`
- Test: `src/__tests__/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- Consumes: `AIConfig`, `isGeminiConfigured`, `isOllamaConfigured`, `getProviderModel` from `src/services/ai/aiConfig.ts`
- Produces: Non-destructive switching between Gemini and Ollama settings in `SettingsModal`.

- [ ] **Step 1: Write the failing tests in `src/__tests__/components/settings/SettingsModal.test.tsx`**

Add tests verifying:
1. Switching from Gemini tab to Ollama tab retains Gemini's model in `config.geminiModel`.
2. Setting an Ollama model, then switching back to Gemini tab preserves Ollama's model in `config.ollamaModel`.
3. Saving settings persists both models.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/settings/SettingsModal.test.tsx`
Expected: FAIL because `handleProviderChange` in `SettingsModal` currently clears/resets the model.

- [ ] **Step 3: Update `SettingsModal.tsx`**

Refactor `handleProviderChange`, `handleGeminiModelChange`, and `handleOllamaModelChange` in `SettingsModal.tsx`:
- When switching `provider`, preserve `prev.geminiModel` and `prev.ollamaModel`.
- Update `config.model` to reflect the active provider's respective model (`geminiModel` or `ollamaModel`).
- In `handleGeminiModelChange`, update `geminiModel` as well as `model`.
- In `handleOllamaModelChange`, update `ollamaModel` as well as `model`.
- Ensure cognitive complexity of all handlers remains `< 15`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/settings/SettingsModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/settings/SettingsModal.tsx src/__tests__/components/settings/SettingsModal.test.tsx
git commit -m "fix(settings): preserve both gemini and ollama models when switching tabs"
```

---

### Task 3: Build Provider Selection & Label UI in `PhotoImportModal`

**Files:**
- Modify: `src/components/import/PhotoImportModal.tsx`
- Test: `src/__tests__/components/import/PhotoImportModal.test.tsx`

**Interfaces:**
- Consumes:
  - `isGeminiConfigured`, `isOllamaConfigured`, `getConfiguredProviders`, `getProviderModel`, `getProviderDisplayName`, `saveAIConfig` from `src/services/ai/aiConfig.ts`
- Produces:
  - `ProviderSelectorBanner` component or inline section above dropzone in `PhotoImportModal`
  - Dynamic inference configuration routed to the selected provider

- [ ] **Step 1: Write the failing tests in `src/__tests__/components/import/PhotoImportModal.test.tsx`**

Add test cases covering:
1. **Both Providers Set Up**:
   - Renders segmented toggle buttons for `Google Gemini` and `Ollama`.
   - Displays label in `Provider (Model)` format (e.g., `Using Google Gemini (gemini-3.8-flash)`).
   - Clicking `Ollama` toggle switches the active provider and updates label to `Using Ollama (llama3.2-vision)`.
   - Switching provider calls `saveAIConfig({ provider: 'ollama' })` to persist preference.
   - Analysis executes with Ollama configuration.
2. **Only Gemini Set Up**:
   - Provider toggle is NOT rendered.
   - Displays label `Using Google Gemini (gemini-3.8-flash)`.
   - Analysis executes with Gemini.
3. **Only Ollama Set Up**:
   - Provider toggle is NOT rendered.
   - Displays label `Using Ollama (llama3.2-vision)`.
   - Analysis executes with Ollama.
4. **Neither Set Up**:
   - Shows existing `ConfigRequiredNotice`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/import/PhotoImportModal.test.tsx`
Expected: FAIL because provider selection and label above dropzone are not yet implemented.

- [ ] **Step 3: Implement `ProviderSelectorBanner` and integrate into `PhotoImportModal.tsx`**

1. Create a focused sub-component `ProviderSelectorBanner` (cognitive complexity < 10):
   - Computes active model display: `${getProviderDisplayName(selectedProvider)} (${getProviderModel(selectedProvider, config)})`.
   - If `bothConfigured`: renders a clean segmented switch (Google Gemini / Ollama) styled with Tailwind (`bg-slate-100 p-0.5 rounded-lg border text-xs`).
   - Renders the status label `Using: {Provider} ({Model})` with a subtle badge or text indicator.
2. Place `ProviderSelectorBanner` directly above the dropzone in `renderModalBody()`.
3. In `executeAnalysis()`, construct `inferenceConfig` using `selectedProvider` and its respective credentials and model (`getProviderModel(selectedProvider, config)`).
4. Update processing text step to match the selected provider.

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/import/PhotoImportModal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/import/PhotoImportModal.tsx src/__tests__/components/import/PhotoImportModal.test.tsx
git commit -m "feat(ocr): add provider selection and status label to photo import modal"
```

---

### Task 4: Full Verification and Quality Gate

**Files:**
- Test: All unit and integration test suites

- [ ] **Step 1: Run Pre-Commit Verification Gate**

Run: `rtk npm run verify:pre-commit`
Checks:
- Linting rules (cognitive complexity < 15, linear regex)
- 100% test pass and coverage

- [ ] **Step 2: Run Pre-Push Verification Gate**

Run: `rtk npm run verify:pre-push`
Checks:
- Production Vite build and TypeScript type-check
- Security audit

- [ ] **Step 3: Verification Review**

Confirm all acceptance criteria from the spec are verified with zero regressions.
