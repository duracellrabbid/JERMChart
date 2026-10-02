# Proposal

## Why

JERMChart is an offline-first fiduciary structure chart application handling hyper-confidential corporate trust, wealth management, and entity governance structures (settlors, beneficiaries, trust assets, tax IDs, and resident director rosters). Fiduciary compliance demands mathematically verifiable privacy and automated quality enforcement:

1. **Client-Side Hook Bypass**: Local git hooks (`.husky/pre-commit` and `.husky/pre-push`) are easily bypassed using `git --no-verify`. Without server-side CI/CD enforcement on GitHub, code violating cognitive complexity limits (< 15), ReDoS linear regex, or 100% test coverage thresholds can slip into the shared repository.
2. **Defensible Zero-Telemetry Guarantee**: Trust officers and corporate administrators need an absolute guarantee that no entity metadata, director rosters, or confidential chart data leaves their local workstation. While AI Vision OCR is supported for digitizing hand-drawn charts, free-tier / consumer AI API keys present significant data-mining risks where user data may be used for model training. The application must restrict external network access strictly to Gemini, deflect compliance risk via prominent enterprise disclaimers, and enforce defense-in-depth offline barriers.
3. **Automated, Secure Windows Releases**: Manual desktop packaging is prone to human error and packaging drift. An automated GitHub Actions CD workflow is required to package Windows installers (`portable` and `nsis`) with verifiable SHA-256 checksums, publishing them as draft releases for maintainer review prior to distribution.

## What Changes

- **GitHub Actions CI Pipeline (Single Unified Job)**: Introduce `.github/workflows/ci.yml` running on Node 22 (`ubuntu-latest`). Executes pre-commit gates (`npm run verify:pre-commit`: ESLint 10 enforcing SonarJS complexity < 15 and linear regex, followed by Vitest with 100% coverage across statements, branches, functions, and lines) and pre-push gates (`npm run verify:pre-push`: TypeScript check, Vite production build, and `npm audit --audit-level=moderate`).
- **Zero-Telemetry Offline Defense-in-Depth**:
  - **AST Compile-Time Ban**: Enforce ESLint `no-restricted-globals` across all application source code, prohibiting `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `navigator.sendBeacon`, with an explicit whitelist granted strictly to `src/services/ai/chartVisionService.ts`.
  - **Renderer CSP**: Add `<meta http-equiv="Content-Security-Policy">` in `index.html` restricting `connect-src` strictly to `'self'` and `https://generativelanguage.googleapis.com`.
  - **Electron Runtime Firewall & Flag Hardening**: In `electron/main.cjs`, append Chromium privacy switches (`disable-background-networking`, `disable-component-update`, `disable-domain-reliability`, `disable-sync`, `metrics-recording-only`, `no-report-upload`) and implement a `session.defaultSession.webRequest.onBeforeRequest` firewall that drops all non-allowlisted outbound traffic.
  - **Offline Network Isolation Suite**: Add automated Vitest integration tests verifying that core chart manipulation (outliner editing, Dagre layout, Excel import, and PDF/PPTX/Excel/PNG export) produces zero outbound network calls.
- **AI Vision OCR Gemini Exclusivity & Enterprise Disclaimer**:
  - Close OpenAI provider support for now, standardizing purely on official Google Gemini (`@google/genai`).
  - Collapse external network perimeter to exactly one domain: `https://generativelanguage.googleapis.com`.
  - Add a prominent, dismissible Fiduciary Data Privacy & Compliance Disclaimer in Settings and OCR modals informing users that they are responsible for using an Enterprise / Paid Google Cloud Gemini API key with data logging disabled.
- **Windows Release CD Pipeline**: Introduce `.github/workflows/release.yml` running on `windows-latest`. Triggered by git tag push (`v*.*.*`) or manual `workflow_dispatch`, runs full verification gates, builds Windows NSIS and portable executables, computes SHA-256 checksums, and creates a GitHub Draft Release for maintainer inspection.

## Capabilities

### New Capabilities
- `cicd-pipeline`: Automated GitHub Actions continuous integration workflow running unified pre-commit and pre-push validation gates on every push and pull request.
- `offline-zero-telemetry`: Multi-layered defense-in-depth architectural enforcement (AST linting, Content Security Policy, Electron webRequest firewall, and isolation tests) ensuring zero unauthorized outbound traffic.
- `windows-release-pipeline`: Automated GitHub Actions continuous delivery workflow building Windows desktop artifacts (`nsis` and `portable`) and publishing draft GitHub releases with cryptographic checksums.

### Modified Capabilities
- `ai-ocr-model-selection`: Restrict AI OCR engine exclusively to Google Gemini, remove OpenAI and custom endpoint configurations, and add mandatory Enterprise Tier fiduciary compliance disclaimers.

## Impact

- **Developer Workflow**: Pull requests and commits pushed to GitHub are automatically validated against all 7 repository engineering rules; branch protection can block unverified changes.
- **Security & Privacy Posture**: Eliminates outbound telemetry risk and prevents data leaks of sensitive client/trust data.
- **AI Settings UI**: `SettingsModal.tsx` simplifies to Gemini models only, removing provider switching, custom endpoints, and OpenAI configurations while displaying the Enterprise Privacy Notice.
- **Desktop Runtime**: `electron/main.cjs` hardens Chromium startup arguments and filters network calls at the protocol layer.
- **Dependencies**: Retains existing `@google/genai` dependency; removes or deprecates active usage of `openai` in the application runtime.
- **Non-Goals**: Support for macOS/Linux release automation is deferred to future milestones (focusing strictly on Windows x64 NSIS + portable); automatic direct release publishing is non-goal (draft releases required for manual maintainer sign-off).
