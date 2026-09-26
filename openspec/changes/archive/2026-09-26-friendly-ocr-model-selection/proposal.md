## Why

Currently, when configuring AI OCR for scanned or photographed trust structure charts, users are required to type exact API model identifier strings (e.g. `gemini-3.8-flash`, `gpt-5.2`) into a raw text input. For fiduciary administrators, corporate trustees, and wealth managers who are not technical developers, guessing or looking up model identifiers causes configuration errors, failed OCR scans, and unnecessary friction. Furthermore, existing fallback defaults reference outdated or invalid identifiers, and OpenAI integrations use manual `fetch` calls rather than the official `openai` SDK.

Providing a curated dropdown of user-friendly model names backed by active, verified vision models (Gemini 3.8 Flash, GPT-5.2+)—while transitioning OpenAI network requests to the official `openai` client package—simplifies onboarding and ensures robust, production-grade chart digitization.

## What Changes

- **User-Friendly Model Dropdown**: Replace the freeform text input in `SettingsModal` with a curated `<select>` dropdown displaying clear, human-readable labels (e.g., "Gemini 3.8 Flash (Recommended - Fastest & Latest)", "GPT-5.2 (Recommended - High Accuracy)") with an optional "Custom Model..." escape hatch for enterprise or fine-tuned deployments.
- **Up-to-Date Vision Model Catalog**: Define a centralized `modelCatalog.ts` holding verified vision-capable models:
  - Google Gemini: `gemini-3.8-flash` (default), `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.1-pro-preview`.
  - OpenAI: `gpt-5.2` (default), `gpt-5.2-pro`, `gpt-5.4`, `gpt-5.6`.
- **Official OpenAI SDK Integration**: Add the official `openai` npm package and replace manual `fetch` calls in `chartVisionService.ts` and `SettingsModal.tsx` with standard typed `OpenAI` client calls (`dangerouslyAllowBrowser: true` for the Electron/Vite client runtime).
- **Graceful Migration & Model Fallbacks**: Ensure existing stored configurations smoothly map to the new catalog without breaking existing user API keys, maintaining 100% client-side local storage privacy.

## Capabilities

### New Capabilities
- `ai-ocr-model-selection`: Curated user-friendly model selection for AI vision OCR, central catalog of active Gemini and OpenAI models, and official OpenAI client integration.

### Modified Capabilities
<!-- None: No previous specs exist in openspec/specs/ -->

## Impact

- **Dependencies**: Adds `openai` package to `package.json`.
- **UI Components**: `src/components/settings/SettingsModal.tsx` replaces the model text input with the friendly dropdown and conditional custom model text box.
- **Services**: `src/services/ai/chartVisionService.ts` uses `new OpenAI()` client instead of direct `fetch`; `src/services/ai/aiConfig.ts` updates default model identifiers to `gemini-3.8-flash` and `gpt-5.2`.
- **New Module**: `src/services/ai/modelCatalog.ts` provides metadata and helper functions for available models.
- **Privacy & Security**: Retains strict 100% client-side data privacy; API keys remain stored locally in `localStorage` or memory only.
- **Testing**: Vitest suites in `src/__tests__/services/chartVisionService.test.ts` and `src/__tests__/components/settings/SettingsModal.test.tsx` updated to mock the `openai` SDK and verify dropdown interactions with 100% code coverage.
