# Design

## Context

JERMChart operates as an offline-first client-side web application and standalone Electron desktop application for corporate trust management (see `proposal.md` for core motivation). All sensitive entity trees, ownership edges, and fiduciary rosters reside in the client-side Zustand store (`src/store/useStructureStore.ts`). 

Currently:
- Local git hooks (`.husky/pre-commit` and `.husky/pre-push`) run `npm run verify:pre-commit` and `npm run verify:pre-push`, but lack server-side enforcement.
- AI Vision OCR currently provides multi-provider selection across Google Gemini and OpenAI with custom proxy endpoints, expanding the potential egress surface.
- `index.html` has no explicit Content Security Policy (CSP).
- `electron/main.cjs` handles basic window creation and external URL sandboxing, but lacks network protocol filtering and Chromium telemetry suppression switches.
- Desktop packaging is configured for multiple targets in `electron-builder.json`, but lacks an automated continuous delivery release pipeline.

## Goals / Non-Goals

**Goals:**
- Provide a single unified GitHub Actions CI pipeline (`.github/workflows/ci.yml`) validating pre-commit (linting, cognitive complexity < 15, ReDoS linear regex, 100% test coverage) and pre-push (production build, security audit) on every push and PR.
- Establish a 4-layer defense-in-depth zero-telemetry boundary:
  1. Compile-time AST rule (`no-restricted-globals`) banning network primitives outside `src/services/ai/chartVisionService.ts`.
  2. Browser engine CSP in `index.html` locking `connect-src` strictly to `'self'` and `https://generativelanguage.googleapis.com`.
  3. Electron runtime firewall in `electron/main.cjs` blocking unauthorized egress via `session.defaultSession.webRequest.onBeforeRequest` and disabling Chromium telemetry switches.
  4. Automated Vitest offline isolation suite proving zero outbound calls during entire chart lifecycles.
- Restrict AI Vision OCR exclusively to Google Gemini (`@google/genai`), removing OpenAI and custom proxy endpoints to pin the egress perimeter to one official domain.
- Incorporate a prominent Fiduciary Data Privacy & Enterprise Compliance Disclaimer deflecting legal risk and mandating enterprise Google AI keys.
- Deliver an automated Windows release CD workflow (`.github/workflows/release.yml`) generating NSIS and portable executables with SHA-256 checksums, published as GitHub Draft Releases.

**Non-Goals:**
- Automated macOS / Linux release packaging workflows (deferred to future milestones; current delivery focuses strictly on Windows x64).
- Direct automated publishing of releases (draft releases are strictly enforced to preserve manual human maintainer verification).
- Code signing certificate purchasing or automated EV/OV code signing (builds will produce clean unsigned binaries with SHA-256 integrity verification; secret hooks will be structured for future signing certificate injection).

## Decisions

### Decision 1: Single Unified CI Pipeline vs. Parallel Matrix Jobs
- **Choice**: Implement a single sequential job (`validate`) on `ubuntu-latest` running Node.js 22.
- **Rationale**: A single job runs `npm ci` once with npm cache and completes within ~90–120 seconds. It eliminates GitHub Actions runner queuing overhead and artifact upload/download latency, providing immediate pass/fail feedback while enforcing 100% test coverage and zero lint errors.
- **Alternatives Considered**: Parallel split jobs (`lint`, `test`, `build`, `audit`). Rejected due to 3-4x action runner minute consumption, setup redundancy, and unnecessary overhead for a single-package desktop project.

### Decision 2: Gemini Exclusivity & Retiring OpenAI
- **Choice**: Consolidate AI Vision OCR strictly on Google Gemini (`@google/genai`), deprecating OpenAI provider options and removing custom endpoint text inputs.
- **Rationale**: 
  - Having custom endpoint inputs forces the Content Security Policy and Electron runtime firewall to accept arbitrary user-entered URLs, punching unpredictable holes in the offline perimeter.
  - Pinned Gemini exclusivity collapses the allowed network surface down to exactly one domain: `https://generativelanguage.googleapis.com`.
  - Simplifies the settings interface and eliminates multi-provider edge cases.
- **Alternatives Considered**: Retaining OpenAI with dynamic CSP injection. Rejected because dynamically updating CSP or maintaining wildcard connect-src weakens the zero-telemetry defense and introduces configuration vulnerabilities.

### Decision 3: 4-Layer Defense-in-Depth for Zero Telemetry
```
┌────────────────────────────────────────────────────────┐
│ 1. Compile Time: ESLint `no-restricted-globals`        │
│    (Blocks fetch/XHR outside chartVisionService.ts)    │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Renderer Engine: index.html CSP Meta Tag            │
│    (connect-src 'self' https://generativelanguage...)  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Main Process: Electron webRequest Firewall & Flags  │
│    (Drops all non-whitelisted outbound requests)       │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. CI Verification: Automated Network Isolation Test   │
│    (Asserts 0 requests during full app lifecycle)      │
└────────────────────────────────────────────────────────┘
```
- **Rationale**: No single security layer is foolproof. AST checks prevent developer errors; CSP prevents dependency script injection; Electron runtime firewall stops low-level Chromium leaks; CI tests verify ongoing architectural integrity.
- **Alternatives Considered**: Relying solely on Electron webRequest. Rejected because browser-based preview (`npm run preview`) or web instances would lack protection without CSP and AST enforcement.

### Decision 4: Draft-First Automated Windows CD Workflow
- **Choice**: GitHub Actions triggers on semantic tags (`v*.*.*`) or manual dispatch (`workflow_dispatch`), packages Windows binaries via `electron-builder --win --x64`, generates `release/SHA256SUMS.txt`, and publishes a draft release using `softprops/action-gh-release@v2`.
- **Rationale**: Draft releases guarantee that no binary is distributed publicly without explicit maintainer inspection, virus scanning, and release note approval.

### Decision 5: Architectural Impact on Zustand Store, React Flow & Dagre
- **Zustand Store (`src/store/useStructureStore.ts`)**: Completely unaffected in data model; entity nodes, edges, undo/redo stacks, and director rosters remain 100% offline and in-memory.
- **Layout & Canvas (`@xyflow/react`, `@dagrejs/dagre`)**: Operates entirely client-side with zero network dependencies.
- **Export Engines (`jspdf`, `pptxgenjs`, `html-to-image`, `xlsx`)**: Tested to ensure no remote fonts or external assets are fetched during export.
- **Cognitive Complexity & String Processing**: All new helper functions (e.g. firewall filters, URL validation, disclaimer checks) will maintain cognitive complexity strictly below 15 using early guard returns and linear-time string primitives (`indexOf`, `startsWith`, `trimTrailingSlashes`), in strict accordance with Rules 4 and 5.

## Risks / Trade-offs

- **[Risk] Consumer Google AI Key Data Logging** → *Mitigation*: Prominently display the Fiduciary Data Privacy Notice in `SettingsModal.tsx` and the OCR upload dialog, explicitly stating that users must use an Enterprise / Paid Google Cloud Gemini API key with data logging disabled, deflecting legal liability.
- **[Risk] False Positive Network Blocks in Dev Server** → *Mitigation*: In `electron/main.cjs`, the webRequest firewall explicitly permits `localhost:5173` and Vite WebSocket HMR when `isDev` is true.
- **[Risk] Unsigned Executable SmartScreen Warning on Windows** → *Mitigation*: Generate cryptographic `SHA256SUMS.txt` alongside executables so enterprise administrators can verify binary integrity. Maintain environment variable hooks (`CSC_LINK`, `CSC_KEY_PASSWORD`) in the workflow for seamless future certificate integration.
- **[Risk] Test Coverage Dropping Below 100% Threshold** → *Mitigation*: Every new file (offline isolation test, updated settings modal, firewall logic) must maintain 100% test coverage across lines, branches, functions, and statements as enforced by `npm run test:coverage`.

## Migration Plan

1. **Step 1: ESLint & Offline Guardrails**: Configure `no-restricted-globals` in `eslint.config.js` and add CSP meta tag to `index.html`.
2. **Step 2: Gemini OCR & Settings Simplification**: Update `src/services/ai/aiConfig.ts`, `modelCatalog.ts`, `chartVisionService.ts`, and `SettingsModal.tsx` to standardize on Gemini and render the Enterprise Disclaimer. Update corresponding test suites.
3. **Step 3: Electron Process Firewall**: Update `electron/main.cjs` with Chromium privacy switches and `webRequest.onBeforeRequest` filtering. Update Electron main process unit tests.
4. **Step 4: Offline Isolation Test Suite**: Implement `src/__tests__/offline/networkIsolation.test.ts` verifying zero outbound calls.
5. **Step 5: GitHub Actions Workflows**: Create `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
6. **Rollback Strategy**: If any CI or runtime firewall issue occurs, git revert returns the repository to its prior state without database or schema migration side-effects.
