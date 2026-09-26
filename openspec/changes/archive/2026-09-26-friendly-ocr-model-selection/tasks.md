## 1. Dependencies & Model Catalog

- [x] 1.1 Install `openai` package via `npm install openai`
- [x] 1.2 Write unit tests for `modelCatalog` in `src/__tests__/services/modelCatalog.test.ts`
- [x] 1.3 Implement `src/services/ai/modelCatalog.ts` with active Gemini (`gemini-3.8-flash`, etc.) and OpenAI (`gpt-5.2`, etc.) definitions and lookup helpers

## 2. OpenAI SDK Integration & Service Refactoring

- [x] 2.1 Update tests in `src/__tests__/services/chartVisionService.test.ts` to mock `openai` SDK methods and test error conditions
- [x] 2.2 Refactor `callOpenAIVision` in `src/services/ai/chartVisionService.ts` to use the official `openai` SDK with `dangerouslyAllowBrowser: true`
- [x] 2.3 Update `src/services/ai/aiConfig.ts` with new default model IDs (`gemini-3.8-flash` and `gpt-5.2`) and migration for legacy model strings

## 3. Settings UI Enhancement (Dropdown & Custom Input)

- [x] 3.1 Update unit and component tests in `src/__tests__/components/settings/SettingsModal.test.tsx` covering model dropdown selection, custom input toggle, and SDK connection testing
- [x] 3.2 Refactor `src/components/settings/SettingsModal.tsx` to replace raw model text box with the friendly dropdown, custom model toggle, and SDK-based ping test

## 4. Verification & Quality Gates

- [x] 4.1 Run pre-commit verification `rtk npm run verify:pre-commit` to ensure zero lint errors and 100% test coverage
- [x] 4.2 Run pre-push verification `rtk npm run verify:pre-push` to validate production bundle compilation and security audit
