# Tasks

## 1. Compile-Time AST Guardrails & Content Security Policy

- [x] 1.1 Configure ESLint `no-restricted-globals` in `eslint.config.js` to disallow `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `navigator.sendBeacon` across all application files, granting an exception strictly to `src/services/ai/chartVisionService.ts`. Verify by running `rtk npm run lint`.
- [x] 1.2 Add Content Security Policy `<meta http-equiv="Content-Security-Policy">` to `index.html` restricting `connect-src` strictly to `'self'` and `https://generativelanguage.googleapis.com`. Verify by checking `index.html` rendering.

## 2. Gemini OCR Exclusivity & Enterprise Compliance Disclaimer

- [x] 2.1 Update `src/services/ai/aiConfig.ts` and `src/services/ai/modelCatalog.ts` to retire OpenAI provider configurations and custom endpoint handling, standardizing provider type to `'gemini'`. Update tests in `src/__tests__/services/aiConfig.test.ts` and `src/__tests__/services/modelCatalog.test.ts` to verify 100% coverage.
- [x] 2.2 Refactor `src/services/ai/chartVisionService.ts` to remove OpenAI client logic and custom baseURL resolution, ensuring calls route solely to GoogleGenAI with linear string helpers. Update `src/__tests__/services/chartVisionService.test.ts` to verify 100% test coverage.
- [x] 2.3 Update `src/components/settings/SettingsModal.tsx` to remove provider selector and custom endpoint inputs, displaying curated Gemini models and the prominent Fiduciary Data Privacy & Enterprise Compliance Notice. Update `src/__tests__/components/settings/SettingsModal.test.tsx` to verify rendering and 100% test coverage.

## 3. Electron Runtime Firewall & Chromium Hardening

- [x] 3.1 Hardened Electron main process in `electron/main.cjs` with Chromium privacy switches (`disable-background-networking`, `disable-component-update`, `disable-domain-reliability`, `disable-sync`, `metrics-recording-only`, `no-report-upload`).
- [x] 3.2 Implement `session.defaultSession.webRequest.onBeforeRequest` firewall in `electron/main.cjs` to intercept all egress traffic, permitting only local resources and `generativelanguage.googleapis.com`, and cancelling unauthorized requests.
- [x] 3.3 Update Electron unit tests in `src/__tests__/electron/main.test.ts` to verify the firewall allows Gemini and local requests while cancelling unapproved traffic, maintaining 100% test coverage.

## 4. Automated Offline Network Isolation Test Suite

- [x] 4.1 Write dedicated offline isolation tests in `src/__tests__/offline/networkIsolation.test.ts` spying on global network interfaces (`fetch`, `XMLHttpRequest`, `WebSocket`) and asserting that zero outbound calls occur during full chart lifecycles (node addition, Dagre layout calculation, Excel import, and PDF/PPTX/Excel/PNG export). Verify by running `rtk npm test src/__tests__/offline/networkIsolation.test.ts`.

## 5. GitHub Actions Unified CI Pipeline

- [x] 5.1 Create `.github/workflows/ci.yml` defining a single unified job (`validate`) on `ubuntu-latest` running Node.js 22, caching `npm`, running `npm ci`, and executing `npm run verify:pre-commit` followed by `npm run verify:pre-push`.
- [x] 5.2 Validate workflow YAML syntax and verify local pre-commit and pre-push scripts run cleanly.

## 6. GitHub Actions Windows Release CD Pipeline

- [x] 6.1 Create `.github/workflows/release.yml` on `windows-latest` configured with tag trigger (`v*.*.*`) and manual dispatch (`workflow_dispatch`), running full verification gates, packaging via `npm run electron:build`, generating SHA-256 checksums in `release/SHA256SUMS.txt`, and publishing a draft release via `softprops/action-gh-release@v2`.
- [x] 6.2 Validate workflow YAML syntax and verify `electron-builder.json` targets for Windows x64 NSIS and portable executables.

## 7. Quality Gate & Integration Verification

- [x] 7.1 Execute full pre-commit verification (`rtk npm run verify:pre-commit`) to confirm zero ESLint violations (cognitive complexity < 15, linear regex) and 100% test coverage across statements, branches, functions, and lines.
- [x] 7.2 Execute full pre-push verification (`rtk npm run verify:pre-push`) to confirm clean TypeScript compilation, successful Vite production bundling, and zero moderate or higher security vulnerabilities.
