# offline-zero-telemetry Specification

## Purpose
Multi-layered architectural defense-in-depth framework guaranteeing zero unauthorized outbound network traffic, absolute client-side data privacy, and isolation of all chart data.

## Requirements

### Requirement: Static AST Network API Prohibition
The ESLint configuration MUST prohibit standard web network APIs (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `navigator.sendBeacon`) across all application source files, with an explicit exception granted solely to `src/services/ai/chartVisionService.ts`.

#### Scenario: Code attempting unauthorized fetch fails linting
- **WHEN** any source code outside `src/services/ai/chartVisionService.ts` references `fetch` or `XMLHttpRequest`
- **THEN** ESLint triggers a `no-restricted-globals` error and prevents pre-commit / CI completion.

#### Scenario: Vision OCR service maintains scoped access
- **WHEN** `src/services/ai/chartVisionService.ts` executes Vision OCR operations
- **THEN** the restricted globals rule does not flag the service file.

### Requirement: Browser Renderer Content Security Policy
The application HTML entry point (`index.html`) MUST specify a strict Content Security Policy (`<meta http-equiv="Content-Security-Policy">`) that enforces default-src self, blocks object/plugin embedding, and strictly restricts network connections (`connect-src`) to `'self'` and `https://generativelanguage.googleapis.com`.

#### Scenario: Attempted network connection to unapproved host is blocked by CSP
- **WHEN** client-side script attempts to establish an HTTP, HTTPS, or WebSocket connection to any third-party host other than `generativelanguage.googleapis.com`
- **THEN** Chromium's CSP engine immediately rejects the connection at the renderer boundary.

### Requirement: Electron Runtime Firewall and Chromium Telemetry Suppression
The Electron main process (`electron/main.cjs`) MUST disable background networking and telemetry switches on application initialization, and MUST intercept all outbound network requests using `session.defaultSession.webRequest.onBeforeRequest` to cancel any non-allowlisted network traffic.

#### Scenario: Electron initializes with privacy switches
- **WHEN** the Electron desktop application launches
- **THEN** command-line switches `disable-background-networking`, `disable-component-update`, `disable-domain-reliability`, `disable-sync`, `metrics-recording-only`, and `no-report-upload` are appended.

#### Scenario: Runtime firewall intercepts unauthorized egress
- **WHEN** any internal module or runtime component initiates an outbound HTTP/HTTPS request to an origin other than `generativelanguage.googleapis.com` (or local dev server in development mode)
- **THEN** the `onBeforeRequest` filter cancels the request and logs a security notification.

### Requirement: Automated Offline Network Isolation Verification
The test suite MUST include dedicated offline isolation tests verifying that standard chart manipulation, state updates, file imports, and file exports generate zero outbound network activity.

#### Scenario: Standard chart workflows make zero network calls
- **WHEN** entities are created, edges linked, Dagre layout applied, Excel imported, and PDF/PPTX/Excel/PNG exported under a global network spy
- **THEN** zero outbound network calls are recorded.
