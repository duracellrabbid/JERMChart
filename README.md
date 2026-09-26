# JERMChart: A Trust Management Structure Chart Utility

A 100% client-side web application designed for trust officers, fiduciary specialists, and corporate administrators to quickly prepare, organize, interactively sort, and export corporate and trust structure charts.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview & Key Challenges Solved

In corporate trust and wealth management, trust officers regularly draft structure charts detailing trusts, holding companies, operating subsidiaries, property SPVs, foundations, and their boards of directors.

Hand-drawing these in generic diagramming tools (like Visio or PowerPoint) often creates:
- **Tangled, overlapping connectors** as structures expand.
- **Tedious manual realignment** whenever an entity or director is added or updated.
- **Lack of cross-entity insight** (e.g. identifying all entities where a specific individual or corporate trustee sits on the board).

This utility solves these challenges with an **algorithmic layout engine**, **customizable sibling sorting rules**, a **dual-mode entry workflow**, and **one-click fiduciary-grade exports**.

---

## Key Features

- **Automated Hierarchical Layout (`@dagrejs/dagre`)**:
  - Automatically calculates optimal, non-overlapping coordinates in clean top-down tiers (Settlor / Trust $\to$ Holding Vehicles $\to$ Operating Subsidiaries $\to$ SPVs).
  - Eliminates line crossings with stepped orthogonal connectors.
  - "Auto-Tidy" button restores optimal visual alignment at any time while preserving manual drag tweaks.

- **Configurable Sibling Sorting**:
  - **Alphabetical (A–Z)**: Sorts subsidiary cards alphabetically by entity name.
  - **Ownership % (High $\to$ Low)**: Places majority/wholly-owned subsidiaries first, followed by joint ventures and minority holdings.
  - **Jurisdiction Grouping**: Groups sibling entities by incorporation jurisdiction.
  - **Manual Mode**: Preserves custom drag-and-drop placements.

- **Dual-Mode Data Entry**:
  - **Tree Outline**: Quick hierarchical outliner allowing one-click addition of subsidiaries (`+`) with automatic ownership links, root entity creation, and entity deletion.
  - **Entity Details Form**: Edit entity names, legal types (Trust, HoldCo, OpCo, LLC, Foundation, Partnership), jurisdictions (with common fiduciary autocomplete suggestions), registration/tax numbers, and legal notes.

- **Board of Directors & Spotlight Mode**:
  - Track individual and corporate directors, appointment dates, and fiduciary status tags (e.g. local resident director requirement `RES`).
  - **Cross-Structure Director Directory**: Aggregates all directors across the entire structure. Clicking or focusing any director spotlights all entities where they hold board seats while dimming unrelated cards.

- **Excel Spreadsheet Import & Roundtrip Export (`xlsx`)**:
  - Full roundtrip compatibility: export the active canvas structure to a standard 12-column Excel workbook, or import existing client entity registers into editable interactive charts.
  - Multi-parent ownership resolution, share classes, and director parsing.

- **AI-Powered Photo & Hand-Drawn Chart OCR**:
  - Transcribe photos of whiteboard sketches, whiteboard diagrams, or hand-drawn trust structures directly into editable digital charts using Google Gemini or OpenAI vision models.
  - Interactive OCR review banner with one-click undo snapshot restoration.

- **100% In-Browser Privacy & Export Engine**:
  - **No backend or cloud database required**: Client data stays completely inside the user's browser for compliance and privacy.
  - **Print-Ready PDF**: A4 Landscape layout embedding structure title, client/matter reference, effective date, and confidentiality footer (`"STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY"`).
  - **PowerPoint Presentation (.pptx)**: Export presentation slides directly to Microsoft PowerPoint via `pptxgenjs`.
  - **High-Resolution PNG (2.5x DPI) & Vector SVG**: Crisp vector and raster formats for Word advisory memos and client deliverables.
  - **JSON Backup & Restore**: Save and load `.json` client files locally for individual client matters.

- **Enterprise Quality & Security Safeguards**:
  - **Guaranteed Linear String Primitives**: ReDoS-free URL/path utilities (`urlUtils.ts`) preventing catastrophic regular expression backtracking.
  - **Cognitive Complexity < 15**: Strictly enforced via `eslint-plugin-sonarjs` for maintainability.
  - **Automated Git Lifecycle Guards**: Pre-commit and pre-push hooks via Husky enforcing 100% test coverage and zero security vulnerabilities.

---

## Tech Stack

- **Runtime / Desktop**: Electron 44+ (Node 22 / Chromium)
- **Framework**: React 18 + TypeScript 5.7 + Vite 6
- **Canvas & Graph UI**: `@xyflow/react` (React Flow)
- **Graph Layout Engine**: `@dagrejs/dagre`
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: Zustand 5
- **File I/O & Export Services**: `xlsx`, `jspdf`, `pptxgenjs`, `html-to-image`, `heic2any`
- **AI Multimodal Vision**: `@google/genai` (Google Gemini) and OpenAI Vision APIs
- **Code Quality & Linting**: ESLint 10 (`eslint-plugin-sonarjs`, `eslint-plugin-regexp`), Husky 9
- **Testing & Coverage**: Vitest 4 (v8 coverage) + React Testing Library

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 20.0.0 or higher; v22 recommended)
- `npm` (packaged with Node.js) or `pnpm` / `yarn`

---

## Getting Started (Development Mode)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd trust-management-utility
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
| `npm test` | Runs all 24 unit and component test suites via Vitest. | 0 test failures. |
| `npm run test:coverage` | Runs full test suite with V8 coverage reporting. | **100% threshold** across statements, branches, functions, and lines. |
| `npm run audit:security` | Audits installed npm dependencies for vulnerabilities. | Blocks `moderate`, `high`, and `critical` vulnerabilities. |
| `npm run verify:pre-commit` | **Pre-Commit Gate**: Runs `npm run lint` then `npm run test:coverage`. | Enforced automatically by Git pre-commit hook via Husky. |
| `npm run verify:pre-push` | **Pre-Push Gate**: Runs `npm run build` then `npm run audit:security`. | Enforced automatically by Git pre-push hook via Husky. |
| `npm run build` | Compiles production assets: runs linter, `tsc`, and `vite build`. | Produces optimized static web bundle in `dist/`. |
| `npm run electron:dev` | Launches Electron desktop app in development mode with live reload. | Desktop dev runtime. |
| `npm run electron:pack` | Packages unpacked standalone desktop binary in `release/win-unpacked/`. | Portable testing. |
| `npm run electron:build` | Builds Windows standalone installer and portable `.exe` in `release/`. | Production desktop installer. |

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
   `release/win-unpacked/Trust Structure Chart Utility.exe`

3. **Build Distributable Installers (.exe / Portable)**:
   Compiles optimized production installers and standalone portable binaries into the `release/` directory:
   ```bash
   npm run electron:build
   ```
   This generates:
   - **`release/Trust Structure Chart Utility Setup 1.0.0.exe`**: Standard Windows installer with desktop and start-menu shortcuts.
   - **`release/Trust Structure Chart Utility 1.0.0.exe`**: Zero-install standalone portable `.exe` that users can copy to a USB drive or local folder and run immediately.

---

## Project Structure

```
trust-management-utility/
├── .husky/                      # Git hooks (pre-commit, pre-push)
├── docs/                        # Superpower implementation plans and specs
├── index.html                   # HTML shell
├── package.json                 # Project dependencies, scripts, and quality gates
├── eslint.config.js             # ESLint 10 flat configuration (SonarJS, Regexp)
├── vite.config.ts               # Vite configuration and Vitest 100% coverage thresholds
├── tailwind.config.js           # Corporate fiduciary color themes
├── tsconfig.json                # TypeScript compiler configuration
├── electron/                    # Native desktop application main and preload wrappers
├── src/
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Root layout (Header, Sidebar, Canvas, Modals)
│   ├── index.css                # Tailwind directives and base styling
│   ├── types/
│   │   └── structure.ts         # Fiduciary schema (Entity, Director, Edge, Metadata)
│   ├── data/
│   │   └── sampleStructure.ts   # Aurelius Dynasty Trust demonstration template
│   ├── store/
│   │   └── useStructureStore.ts # Central Zustand state store with undo snapshots
│   ├── services/
│   │   └── ai/                  # AI vision integrations (Gemini, OpenAI, AIConfig)
│   ├── utils/
│   │   ├── urlUtils.ts          # ReDoS-free linear string primitives for URL/path handling
│   │   ├── layoutEngine.ts      # Dagre auto-layout & sibling sorting algorithms
│   │   ├── entityStyle.ts       # Fiduciary entity styling & color schemes
│   │   ├── excelExporter.ts     # Excel workbook (.xlsx) chart serializer
│   │   ├── excelParser.ts       # Excel spreadsheet importer & column normalizer
│   │   ├── exportService.ts     # PNG, SVG, PDF, PowerPoint generation & JSON backup
│   │   └── imagePreprocessing.ts# Client-side HEIC/JPEG conversion & resizing
│   ├── components/
│   │   ├── header/              # Top action bar, sorting switcher, auto-tidy
│   │   ├── sidebar/             # Outliner tree, entity form, director directory
│   │   ├── canvas/              # React Flow interactive canvas & OCR review banner
│   │   ├── nodes/               # Custom executive entity card & trust triangle nodes
│   │   ├── edges/               # Custom stepped orthogonal ownership connector
│   │   ├── import/              # Excel spreadsheet & AI photo OCR import modals
│   │   ├── settings/            # AI provider configuration & API key manager
│   │   └── export/              # Export modal for PDF/PNG/SVG/PPTX and JSON
│   └── __tests__/               # Isolated unit and integration test suites (Rule 6)
```

---

## License

This project is licensed under the [MIT License](LICENSE).
See the [`LICENSE`](LICENSE) file for the full license text.
