## Context

See [proposal.md](proposal.md) for motivation and [specs/ai-ocr-model-selection/spec.md](specs/ai-ocr-model-selection/spec.md) for requirements.

Currently, `src/services/ai/aiConfig.ts` persists an `AIConfig` object in browser `localStorage` (falling back to an in-memory map). The AI provider is either `'gemini'` or `'openai'`, and the `model` property stores the API model string directly. In `src/components/settings/SettingsModal.tsx`, the model was configured via a plain text `<input>`. In `src/services/ai/chartVisionService.ts`, Gemini calls use `@google/genai`, while OpenAI calls use low-level `fetch` requests with manual payload formatting.

The application is 100% client-side (React 18 / Electron desktop), requiring that all API keys and custom model preferences remain local to the user's machine without external tracking or proxy servers.

## Goals / Non-Goals

**Goals:**
- Centralize model definitions in a typed `modelCatalog.ts` covering active Gemini (`gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.1-pro-preview`) and OpenAI models (`gpt-5.2`, `gpt-5.2-pro`, `gpt-5.4`, `gpt-5.6`).
- Provide human-friendly dropdown options in `SettingsModal.tsx` while allowing custom model input via a "Custom Model..." option.
- Install and use the official `openai` SDK (`new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true })`) in both `chartVisionService.ts` and `SettingsModal.tsx`.
- Guarantee that all new and refactored functions maintain SonarSource cognitive complexity $< 15$ with early guard returns and dictionary lookups.
- Maintain 100% test coverage across statements, branches, functions, and lines in dedicated `src/**/__tests__/` test suites.

**Non-Goals:**
- Altering the core diagram layout engine (`@dagrejs/dagre`), React Flow canvas state, or fiduciary export pipelines (`jspdf`, `pptxgenjs`, `xlsx`).
- Changing the Zustand store (`src/store/useStructureStore.ts`) structure, as OCR ingestion already feeds through the existing `loadStructure` and `setOcrReviewState` actions.
- Automatically validating API keys against remote quotas on startup.

## Decisions

### 1. Central Model Registry (`src/services/ai/modelCatalog.ts`)
- **Decision**: Define a lightweight registry mapping providers to arrays of `AIModelDefinition` objects:
  ```typescript
  export interface AIModelDefinition {
    id: string;
    displayName: string;
    description: string;
    isDefault?: boolean;
  }
  ```
- **Rationale**: Isolates model metadata from UI components and vision services. Adding or retiring models requires editing only this catalog.
- **Alternatives Considered**: Hardcoding `<option>` tags inside `SettingsModal.tsx` was rejected because default model selection, fallback validation, and testing need a single source of truth.

### 2. Official `openai` SDK with `dangerouslyAllowBrowser: true`
- **Decision**: Add `openai` to dependencies and instantiate the client in client-side code:
  ```typescript
  import OpenAI from 'openai';
  const client = new OpenAI({
    apiKey: config.apiKey.trim(),
    baseURL: config.customEndpoint?.trim() || undefined,
    dangerouslyAllowBrowser: true,
  });
  ```
- **Rationale**: Standardizes request formatting, JSON schema handling, and SDK error types (`APIError`, `AuthenticationError`). The flag `dangerouslyAllowBrowser: true` is standard and safe for client-side Electron/local desktop utilities where keys are owned by the end-user.
- **Alternatives Considered**: Continuing raw `fetch` was rejected because it duplicates SDK logic, makes error parsing fragile, and lacks official client-side guarantees.

### 3. Settings Dropdown State with Custom Fallback
- **Decision**: In `SettingsModal.tsx`, maintain state for whether the selected model matches a catalog ID or is custom. If a saved model does not match any catalog entry for the selected provider, the dropdown defaults to selecting the custom option and displaying the custom input populated with that model string.
- **Rationale**: Guarantees backwards compatibility for users who previously typed custom enterprise or fine-tuned model identifiers.
- **Cognitive Complexity Guard**: Handler functions (`handleProviderChange`, `handleModelSelect`, `testConnection`) are kept decomposed into concise helper functions $< 15$ complexity.

### 4. String Handling & ReDoS Prevention
- **Decision**: Any endpoint trimming, model ID sanitation, and JSON extraction use linear string primitives (`trim()`, `startsWith()`, `slice()`) or existing linear utilities in `src/utils/urlUtils.ts`. No catastrophic backtracking regular expressions are introduced.

## Architectural & Store Impact

- **Zustand Store (`src/store/useStructureStore.ts`)**: No modifications required. The store consumes the inferred `TrustStructureChart` resulting from `analyzeChartImage`.
- **Canvas & Dagre Layout Engine**: Untouched. Inferred nodes and edges continue to be laid out via `calculateSortedLayout`.
- **Exports**: Untouched. All PDF, PPTX, and Excel export routines operate downstream on the loaded entities and relationships.

## Risks / Trade-offs

- **[Risk] OpenAI SDK bundle size in Vite client build**
  → *Mitigation*: The `openai` package is tree-shaken by Vite/Rollup; `verify:pre-push` validates production build size and asset compilation.
- **[Risk] User previously had an obsolete model (e.g. `gemini-3.5-flash`) stored in `localStorage`**
  → *Mitigation*: `getAIConfig()` in `aiConfig.ts` checks if the stored model exists or is valid; if it's the obsolete default, it transparently upgrades to `gemini-3.8-flash` or `gpt-5.2`.
- **[Risk] Electron/browser environment blocking network calls without CORS support**
  → *Mitigation*: OpenAI and Gemini APIs natively support CORS when valid API keys and authorization headers are supplied. Custom enterprise endpoints can be routed via standard base URLs.
