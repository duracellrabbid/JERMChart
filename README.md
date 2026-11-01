# JERMChart: Fiduciary Structure Chart Utility

A 100% client-side, zero-telemetry application designed for trust officers, fiduciary specialists, and corporate administrators to quickly prepare, organize, interactively sort, and export corporate and trust structure charts.

[![CI](https://github.com/duracellrabbid/JERMChart/actions/workflows/ci.yml/badge.svg)](https://github.com/duracellrabbid/JERMChart/actions/workflows/ci.yml)
[![Release](https://github.com/duracellrabbid/JERMChart/actions/workflows/release.yml/badge.svg)](https://github.com/duracellrabbid/JERMChart/actions/workflows/release.yml)
[![Version: 1.3.0](https://img.shields.io/badge/version-1.3.0-informational.svg)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview & Key Challenges Solved

In corporate trust and wealth management, trust officers regularly draft structure charts detailing trusts, holding companies, operating subsidiaries, property SPVs, foundations, partnerships, banking institutions, and their boards of directors.

Hand-drawing these in generic diagramming tools (like Visio or PowerPoint) often creates:
- **Tangled, overlapping connectors** as structures expand across multi-tier entities.
- **Tedious manual realignment** whenever an entity or director is added or updated.
- **Lack of cross-entity insight** (e.g. identifying all entities where a specific individual or corporate trustee sits on the board).
- **Security & Data Privacy Risks** when uploading confidential client structures into cloud-hosted web diagramming tools.

This utility solves these challenges with an **algorithmic layout engine**, **customizable sibling sorting rules**, an **interactive drag-and-drop shape dock**, **omnidirectional connections with loop protection**, **AES-256 encrypted JSON backups**, and **one-click fiduciary-grade exports**.

---

## Key Features

- **Automated Hierarchical Layout & Orthogonal Styling (`@dagrejs/dagre`)**:
  - Automatically calculates optimal, non-overlapping coordinates in clean top-down tiers (Settlor / Trust $\to$ Holding Vehicles $\to$ Operating Subsidiaries $\to$ SPVs).
  - Eliminates line crossings with stepped orthogonal connectors or optional straight/curved line styling.
  - "Auto-Tidy" button restores optimal visual alignment at any time while preserving manual drag tweaks and custom positioning.
  - Smart flanking and branch distribution for complex multi-parent trust structures.

- **Interactive Drag-and-Drop Canvas & Omnidirectional Connections**:
  - **Floating Shape Dock**: Canvas palette allowing users to drag-and-drop or click-to-add Entities, Trusts, Persons / Associated Parties, and Banks directly onto the canvas.
  - **Omnidirectional Connection Handles**: 4-point connection handles (North, South, East, West) on all entity cards for flexible ownership and advisory connections.
  - **Connection Quick Picker**: On-the-fly popover modal upon dragging a connection handle to configure ownership percentage, relationship type, or swap source/target direction.
  - **Structural Integrity Guards**: Automatic validation preventing circular ownership loops and self-referential connections.

- **Bank Entities & Associated Parties**:
  - Specialized styling and iconography for **Bank / Financial Institution** entity types.
  - Staged Person and Associated Party nodes (Protectors, Enforcers, Nominees, Custodians, Settlors).
  - **Fiduciary Legend**: On-canvas interactive legend detailing entity color schemes, legal entity types, and fiduciary badge statuses.

- **Configurable Sibling Sorting**:
  - **Alphabetical (A–Z)**: Sorts subsidiary cards alphabetically by entity name.
  - **Ownership % (High $\to$ Low)**: Places majority/wholly-owned subsidiaries first, followed by joint ventures and minority holdings.
  - **Jurisdiction Grouping**: Groups sibling entities by incorporation jurisdiction.
  - **Manual Mode**: Preserves custom drag-and-drop placements.

- **Dual-Mode Data Entry**:
  - **Tree Outline**: Hierarchical outliner allowing quick addition of subsidiaries (`+`) with automatic ownership links, root entity creation, and entity deletion.
  - **Entity Details Form**: Edit entity names, legal types (Trust, HoldCo, OpCo, LLC, Foundation, Partnership, Bank), jurisdictions (with common fiduciary autocomplete suggestions), registration/tax numbers, and legal notes.

- **Board of Directors, Spotlight Mode & Director Cap**:
  - Track individual and corporate directors, appointment dates, and fiduciary status tags (e.g. local resident director requirement `RES`).
  - **Director Cap**: Visual capacity thresholds on cards with compact overflow count badges (`+N more`) to prevent visual bloating on large boards.
  - **Cross-Structure Director Directory**: Aggregates all directors across the entire structure. Clicking or focusing any director spotlights all entities where they hold board seats while dimming unrelated cards.

- **Read-Only Mode & Access Governance**:
  - Non-destructive **Read-Only Mode** (`isReadOnly`) for client review and presentations—disables canvas mutations and shape palette while preserving smooth navigation, inspection, and allowed exports.
  - Administrative export gating (`allowJsonBackup`) to enforce strict enterprise compliance policies.

- **Encrypted JSON Backups & Export Engine**:
  - **Encrypted JSON Backups**: Client-side AES-256-GCM encryption with PBKDF2 key derivation (100,000 iterations, SHA-256) and password protection for sensitive fiduciary matter files.
  - Seamless backward compatibility: automatically detects plaintext vs. encrypted `.json` files upon import and prompts for password when required.
  - Feature flags (`allowEncryptedJsonExport`, `allowJsonBackup`) for enterprise deployment control.
  - **Print-Ready PDF**: A4 Landscape layout embedding structure title, client/matter reference, effective date, and confidentiality footer (`"STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY"`).
  - **PowerPoint Presentation (.pptx)**: Export presentation slides directly to Microsoft PowerPoint via `pptxgenjs`.
  - **High-Resolution PNG (2.5x DPI) & Vector SVG**: Crisp vector and raster formats for Word advisory memos and client deliverables.
  - **Filename Sanitization**: Automatically sanitizes matter references and export filenames to prevent invalid character errors across operating systems.

- **Excel Spreadsheet Import & Roundtrip Export (`xlsx`)**:
  - Full roundtrip compatibility: export the active canvas structure to a standard 12-column Excel workbook, or import existing client entity registers into editable interactive charts.
  - Multi-parent ownership resolution, share classes, percentage normalization (supporting decimal 0.0–1.0 and whole 0–100 scales), and director parsing.

- **AI-Powered Photo & Hand-Drawn Chart OCR (Local Ollama & Google Gemini)**:
  - Transcribe photos of whiteboard sketches, diagrams, or hand-drawn trust structures directly into editable digital charts using either **Local Ollama** (100% offline & airgapped) or **Google Gemini** multimodal vision (`@google/genai`).
  - **Local Ollama Provider**: Run fully air-gapped on-premises vision models (`llama3.2-vision`, `minicpm-v`, `llava`, etc.) with dynamic local model discovery (`/api/tags`), local/LAN endpoint configuration, and zero data leaving the local network.
  - **Google Gemini Provider**: Multi-model catalog selection supporting Gemini 2.5 Flash, Gemini 1.5 Pro, and latest Gemini vision models with enterprise data privacy disclaimers.
  - **Unified Canonical Schema & Guardrails**: Enforces structured JSON output (`prompts.ts`) across both providers with robust parsing, entity normalization, and guardrails for OCR inference.
  - **Live Progress & Cancellation**: Real-time progress overlay with elapsed timer and instant cancellation control (`AbortController`) in the photo import dialog.
  - Built-in AI connection testing utility (`npm run test:ai` and in-app settings verification).
  - Interactive OCR review banner with one-click undo snapshot restoration.
  - **Fiduciary Data Privacy Notice**: Built-in enterprise compliance disclaimer deflecting liability and requiring users to ensure their Google AI API key is an Enterprise/Paid tier with model training disabled.

- **Airgapped Zero-Telemetry & Mathematical Offline Architecture**:
  - **100% In-Browser Privacy**: Client data stays completely inside the user's browser or local machine. Zero unauthorized network egress, analytics, or background telemetry.
  - **Vendored CSS Security**: Replaced external dependency CSS imports with locally audited `src/styles/xyflow-base.css` to eliminate remote injection vectors and enforce strict offline isolation.
  - **Compile-Time AST Restrictions**: ESLint `no-restricted-globals` statically forbids `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `navigator.sendBeacon` across all application modules, with an exception solely for explicit user-initiated OCR in `chartVisionService.ts` and `ollamaService.ts`.
  - **Content Security Policy (CSP)**: Strict `<meta http-equiv="Content-Security-Policy">` restricting `connect-src` strictly to `'self'`, `https://generativelanguage.googleapis.com`, and user-configured local/LAN Ollama endpoints.
  - **Electron Runtime Firewall & Chromium Hardening**: Suppresses Chromium background telemetry via 6 privacy flags (`disable-background-networking`, `disable-component-update`, `disable-domain-reliability`, `disable-sync`, `metrics-recording-only`, `no-report-upload`) and enforces an active network firewall via `session.defaultSession.webRequest.onBeforeRequest` that cancels unauthorized egress while strictly permitting safe local/LAN Ollama API routes when configured.
  - **Automated Offline Isolation Suite**: Dedicated test suite (`src/__tests__/offline/networkIsolation.test.ts` and `src/__tests__/offline/cssSecurity.test.ts`) guaranteeing zero network requests across all entity operations, Dagre layout calculations, Excel imports, and document exports.

- **Enterprise Quality & Security Safeguards**:
  - **40 Automated Test Suites (464 Tests)**: Comprehensive unit, component, and integration coverage with Vitest and React Testing Library.
  - **100% Test Coverage Threshold**: Strictly enforced across statements, branches, functions, and lines in CI and pre-commit hooks.
  - **Automated GitHub Actions CI/CD**: Unified quality and security pipeline preventing `--no-verify` bypass by running pre-commit and pre-push gates in CI on every push and pull request.
  - **Cognitive Complexity < 15**: Strictly enforced via `eslint-plugin-sonarjs` for maintainability.
  - **Zero Security Vulnerabilities**: Automated npm security audits enforcing zero moderate, high, or critical vulnerabilities.

---

## Tech Stack

- **Runtime / Desktop**: Electron 44+ (Node 22 / Chromium)
- **Framework**: React 19 + TypeScript 5.9 + Vite 8
- **Canvas & Graph UI**: `@xyflow/react` 12+ (with locally vendored offline stylesheet)
- **Graph Layout Engine**: `@dagrejs/dagre`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + Lucide React Icons
- **State Management**: Zustand 5
- **Security & Cryptography**: Web Crypto API (AES-256-GCM, PBKDF2 with SHA-256)
- **File I/O & Export Services**: `xlsx` (`@e965/xlsx`), `jspdf`, `pptxgenjs`, `html-to-image`, `heic2any`
- **AI Multimodal Vision**: Local Ollama (100% offline airgapped vision models) & Google Gemini (`@google/genai`)
- **Code Quality & Linting**: ESLint 10 (`eslint-plugin-sonarjs`, `eslint-plugin-regexp`), Husky 9
- **Testing & Coverage**: Vitest 5 (v8 coverage) + React Testing Library (100% global threshold)
- **CI/CD & Packaging**: GitHub Actions, `electron-builder` 27

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20.0.0 or higher; v22 recommended)
- `npm` (packaged with Node.js) or `pnpm` / `yarn`

---

## Getting Started (Development Mode)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/duracellrabbid/JERMChart.git
   cd JERMChart
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173` (or the URL displayed in the terminal).

---

## Available Scripts & Quality Gates

| Command | Description | Gate / Rule Enforced |
| :--- | :--- | :--- |
| `npm run dev` | Starts Vite local development server with HMR. | &mdash; |
| `npm run lint` | Runs ESLint across `src/`. | Cognitive complexity < 15, ReDoS-free linear regex. |
| `npm run lint:fix` | Automatically fixes auto-fixable lint issues. | &mdash; |
| `npm test` | Runs all 40 unit and component test suites (464 tests) via Vitest. | 0 test failures. |
| `npm run test:coverage` | Runs full test suite with V8 coverage reporting. | **100% threshold** across statements, branches, functions, and lines. |
| `npm run test:ai` | Verifies Google Gemini AI API credentials and connectivity. | &mdash; |
| `npm run audit:security` | Audits installed npm dependencies for vulnerabilities. | Blocks `moderate`, `high`, and `critical` vulnerabilities. |
| `npm run verify:pre-commit` | **Pre-Commit Gate**: Runs `npm run lint` then `npm run test:coverage`. | Enforced automatically by Git pre-commit hook via Husky and GitHub Actions CI. |
| `npm run verify:pre-push` | **Pre-Push Gate**: Runs `npm run build` then `npm run audit:security`. | Enforced automatically by Git pre-push hook via Husky and GitHub Actions CI. |
| `npm run build` | Compiles production assets: runs linter, `tsc`, and `vite build`. | Produces optimized static web bundle in `dist/`. |
| `npm run electron:dev` | Launches Electron desktop app in development mode with live reload. | Desktop dev runtime. |
| `npm run electron:pack` | Packages unpacked standalone desktop binary in `release/win-unpacked/`. | Portable testing. |
| `npm run electron:build` | Builds Windows standalone installer and portable `.exe` in `release/`. | Production desktop installer. |

---

## Continuous Integration & Automated Releases (GitHub Actions)

To prevent code hygiene regressions and bypass of local git hooks via `--no-verify`, the repository includes automated GitHub Actions workflows:

### 1. Unified CI Pipeline (`.github/workflows/ci.yml`)
- **Triggers**: Every `push` and `pull_request` targeting `main` or `master`.
- **Environment**: Clean `ubuntu-latest` runner on Node.js 22 with npm dependency caching.
- **Workflow Steps**:
  1. Installs clean locked dependencies via `npm ci`.
  2. Runs `npm run verify:pre-commit` (ESLint cognitive complexity < 15, ReDoS-free linear regex, AST-level network bans, and 100% test coverage across statements, branches, functions, and lines).
  3. Runs `npm run verify:pre-push` (TypeScript type check, Vite production bundling, and npm security audit for moderate or higher vulnerabilities).

### 2. Windows Desktop CD Release Pipeline (`.github/workflows/release.yml`)
- **Triggers**: Pushing a version tag matching `v*.*.*` or manual dispatch via `workflow_dispatch`.
- **Environment**: `windows-latest` runner on Node.js 22.
- **Workflow Steps**:
  1. Runs full pre-commit and pre-push verification gates.
  2. Builds and packages Windows x64 executables via `npm run electron:build`.
  3. Computes cryptographic SHA-256 hashes for all `.exe` artifacts and writes `release/SHA256SUMS.txt`.
  4. Publishes a **Draft Release** on GitHub via `softprops/action-gh-release@v2`, allowing maintainers to inspect and verify binaries before manually publishing.

---

## Production Build & Distribution

Because this project is **100% client-side**, building it produces a static bundle (HTML, CSS, JavaScript) in the `dist/` directory that can be deployed or installed anywhere without needing a Node.js backend.

### 1. Compile the Production Build

Run the following command:
```bash
npm run build
```

This will run TypeScript type checks (`tsc`) and compile the optimized production assets into the `dist/` folder:
```
dist/
├── index.html
└── assets/
    ├── index-*.css
    └── index-*.js
```

### 2. Preview the Production Build Locally

To verify the production build locally before distribution:
```bash
npm run preview
```

---

## Installation & Deployment Options for Users

You can distribute and install this utility on users' machines using any of the following methods depending on your IT environment:

### Option A: Corporate Intranet or Web Hosting (Recommended for Teams)
Deploy the contents of the `dist/` folder to any static file server or internal company intranet:
- **Nginx / Apache / IIS**: Copy the `dist/` directory to the web root.
- **Cloud Object Storage**: AWS S3 + CloudFront, Cloudflare Pages, GitHub Pages, or Google Cloud Storage.
- **Docker / Container**:
  ```dockerfile
  FROM nginx:alpine
  COPY dist /usr/share/nginx/html
  EXPOSE 80
  CMD ["nginx", "-g", "daemon off;"]
  ```

### Option B: Standalone Offline Installation (Local Machine)
Trust officers can run the application offline on their workstation without an internet connection:

1. Build the project:
   ```bash
   npm run build
   ```
2. Distribute the `dist/` folder to user machines.
3. Users can serve it locally using a lightweight local web server:
   - **Using Node `npx`**:
     ```bash
     npx serve dist -l 3000
     ```
   - **Using Python 3** (built into macOS and Windows developer installs):
     ```bash
     python -m http.server 3000 --directory dist
     ```
   - Then open `http://localhost:3000` in Chrome, Edge, or Firefox.

### Option C: Standalone Desktop App (Electron)
The project includes a ready-to-use **Electron** desktop wrapper that turns the web application into a native desktop software package for Windows (`.exe`), macOS (`.dmg`), or Linux:

1. **Run in Desktop Development Mode**:
   Launch both the Vite dev server and the Electron desktop window with live reloading:
   ```bash
   npm run electron:dev
   ```

2. **Package Unpacked Executable (Immediate Local Testing)**:
   Generates a standalone portable directory in `release/win-unpacked/`:
   ```bash
   npm run electron:pack
   ```
   Users can immediately double-click:
   `release/win-unpacked/JERMChart.exe`

3. **Build Distributable Installers (.exe / Portable)**:
   Compiles optimized production installers and standalone portable binaries into the `release/` directory:
   ```bash
   npm run electron:build
   ```
   This generates:
   - **`release/JERMChart Setup 1.3.0.exe`**: Standard Windows installer with desktop and start-menu shortcuts.
   - **`release/JERMChart 1.3.0.exe`**: Zero-install standalone portable `.exe` that users can copy to a USB drive or local folder and run immediately.

4. **Automated GitHub Releases**:
   Pre-built Windows binaries are automatically generated and attached to GitHub Draft Releases via the [Windows Release Workflow](.github/workflows/release.yml), accompanied by cryptographic `SHA256SUMS.txt` hashes for binary integrity verification.

---

## Project Structure

```
JERMChart/
├── .github/
│   └── workflows/
│       ├── ci.yml               # Unified CI pipeline (Lint, 100% Coverage, Build, Security Audit)
│       └── release.yml          # Windows Draft Release CD workflow with SHA-256 checksums
├── .husky/                      # Git hooks (pre-commit, pre-push)
├── docs/                        # Architecture documentation, standards, and specifications
├── scripts/
│   └── test-ai-connection.mjs   # Node CLI script to verify Gemini API key & model access
├── DESIGN.md                    # Visual design specification, tokens, and UI layout
├── PRODUCT.md                   # Product vision, user personas, and fiduciary workflows
├── index.html                   # HTML shell with strict Content Security Policy (CSP)
├── package.json                 # Project dependencies, scripts, and quality gates
├── electron-builder.json        # Electron packaging & NSIS installer configuration
├── eslint.config.js             # ESLint 10 flat configuration (SonarJS, Regexp, AST network ban)
├── vite.config.ts               # Vite configuration and Vitest 100% coverage thresholds
├── tsconfig.json                # TypeScript compiler configuration
├── electron/                    # Native desktop application main (firewall) and preload wrappers
├── src/
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Root layout (Header, Sidebar, Canvas, Modals)
│   ├── index.css                # Tailwind v4 directives, theme variables, and typography
│   ├── config/
│   │   └── featureFlags.ts      # Feature flags for export capabilities and permissions
│   ├── styles/
│   │   └── xyflow-base.css      # Audited local vendored stylesheet for React Flow canvas
│   ├── types/
│   │   └── structure.ts         # Fiduciary schema (Entity, Director, Edge, Metadata, Party)
│   ├── data/
│   │   └── sampleStructure.ts   # Aurelius Dynasty Trust demonstration template
│   ├── store/
│   │   └── useStructureStore.ts # Central Zustand state store with read-only guards & undo snapshots
│   ├── services/
│   │   └── ai/                  # AI vision OCR integration (Local Ollama & Google Gemini, canonical schemas & prompts)
│   ├── utils/
│   │   ├── cryptoService.ts     # AES-256-GCM encryption & PBKDF2 password derivation
│   │   ├── graphValidation.ts   # Circular ownership detection and self-reference guards
│   │   ├── treeHierarchy.ts     # Hierarchical level calculation & parent-child trees
│   │   ├── layoutEngine.ts      # Dagre auto-layout & sibling sorting algorithms
│   │   ├── entityStyle.ts       # Fiduciary entity styling, colors, and border styles
│   │   ├── excelExporter.ts     # Excel workbook (.xlsx) chart serializer
│   │   ├── excelParser.ts       # Excel spreadsheet importer & percentage normalizer
│   │   ├── exportService.ts     # PDF, PPTX, PNG, SVG generation & encrypted JSON backups
│   │   └── imagePreprocessing.ts# Client-side HEIC/JPEG conversion & resizing
│   ├── components/
│   │   ├── header/              # Top action bar, sorting switcher, line toggle, auto-tidy
│   │   ├── sidebar/             # Outliner tree, entity form, director directory
│   │   ├── canvas/              # React Flow canvas, FloatingShapeDock, ConnectionQuickPicker, Legend
│   │   ├── common/              # Common modals (PasswordPromptModal, AlertModal, ConfirmationModal)
│   │   ├── nodes/               # Custom entity card nodes & staged person nodes
│   │   ├── edges/               # Custom stepped orthogonal and straight ownership connectors
│   │   ├── import/              # Excel spreadsheet & AI photo OCR import modals (with progress timer & abort)
│   │   ├── settings/            # AI provider selector (Ollama / Gemini), model manager & Enterprise Compliance Notice
│   │   └── export/              # Export modal for PDF/PNG/SVG/PPTX and encrypted JSON
│   └── __tests__/               # Isolated test suites (40 suites, 464 tests, 100% coverage)
│       └── offline/             # Automated network isolation & CSS security suites
```

---

## License

This project is licensed under the [MIT License](LICENSE).
See the [`LICENSE`](LICENSE) file for the full license text.
