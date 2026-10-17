# AI Vision Connection Test & Diagnostics Design

## 1. Problem Statement
Users configuring AI Vision in JERMChart report that "testing connection for AI vision does not work".
Investigation reveals:
1. **Raw Error Message Clutter**: `@google/genai` errors throw JSON strings (e.g. `{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT",...}}`), which when passed directly into `err.message || 'Network error'` in `SettingsModal.tsx` output raw JSON or get obscured.
2. **Lack of Diagnostics**: Users cannot isolate whether a connection issue is due to an invalid API key, network/firewall blocking Google Generative AI endpoints, model availability, or multimodal vision capability.
3. **No Standalone Verification Tool**: There is no standalone script to directly test an API key and verify both text ping and multimodal vision capability outside the UI.

## 2. Solution Architecture
We implement Option C:
1. **Dedicated AI Connection Verification Service (`src/services/ai/connectionTestService.ts`)**:
   - `testAIConnection(apiKey: string, model?: string)`: tests ping connectivity using `@google/genai`.
   - `extractErrorMessage(error: unknown)`: cleanly extracts user-facing error messages from `@google/genai` JSON/Error payloads.
   - Cognitive complexity $< 15$, ReDoS-free linear processing.
2. **Refactored Settings Modal (`src/components/settings/SettingsModal.tsx`)**:
   - Uses `testAIConnection` and `extractErrorMessage` to provide clean, informative user feedback.
3. **Standalone Diagnostics Script (`scripts/test-ai-connection.mjs`)**:
   - Accepts API key via CLI argument or `GEMINI_API_KEY` environment variable.
   - Accepts optional `--model=<model-id>` (defaulting to `gemini-3.8-flash`).
   - Runs two test phases:
     - **Phase 1: Basic Ping / Model Handshake** (checks credentials & API accessibility).
     - **Phase 2: Multimodal Vision Test** (transmits a 1x1 transparent PNG with `inlineData` to verify vision capability).
   - Formats clear console diagnostics with response time and step-by-step status.
4. **Unit Tests in dedicated `__tests__/` directory**:
   - Unit tests for `connectionTestService.ts` in `src/__tests__/services/connectionTestService.test.ts`.
   - Updated `SettingsModal.test.tsx` verifying clean error display.

## 3. Global Constraints
- ESLint Cognitive Complexity $< 15$.
- ReDoS-free linear regex.
- All tests in `__tests__/`.
- 100% test coverage threshold maintained.
