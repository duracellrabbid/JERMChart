# Trust Management Structure Chart Utility

A 100% client-side web application designed for trust officers, fiduciary specialists, and corporate administrators to quickly prepare, organize, interactively sort, and export corporate and trust structure charts.

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

- **100% In-Browser Privacy & Export Engine**:
  - **No backend or cloud database required**: Client data stays completely inside the user's browser for compliance and privacy.
  - **Print-Ready PDF**: A4 Landscape layout embedding structure title, client/matter reference, effective date, and confidentiality footer (`"STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY"`).
  - **High-Resolution PNG (2.5x DPI) & Vector SVG**: Crisp vector and raster formats for Word advisory memos and PowerPoint presentations.
  - **JSON Backup & Restore**: Save and load `.json` client files locally for individual client matters.

---

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Canvas & Graph UI**: `@xyflow/react` (React Flow)
- **Graph Layout Engine**: `@dagrejs/dagre`
- **Styling**: Tailwind CSS + Lucide React Icons
- **State Management**: Zustand
- **Export Services**: `html-to-image` + `jspdf`
- **Testing**: Vitest + React Testing Library

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher; v20+ recommended)
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

5. **Run tests**:
   ```bash
   npm test
   ```

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

### Option C: Desktop App Wrapper (Electron / Tauri / PWA)
To distribute as a native Windows `.exe` or macOS `.dmg` installer:
- The static files in `dist/` can be wrapped into a native desktop installer using [Tauri](https://tauri.app/) or [Electron](https://www.electronjs.org/).

---

## Project Structure

```
trust-management-utility/
├── index.html                   # HTML shell
├── package.json                 # Project dependencies and scripts
├── vite.config.ts               # Vite configuration and Vitest setup
├── tailwind.config.js           # Corporate fiduciary color themes
├── tsconfig.json                # TypeScript compiler configuration
├── src/
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Root layout (Header, Sidebar, Canvas)
│   ├── index.css                # Tailwind directives and base styling
│   ├── types/
│   │   └── structure.ts         # Fiduciary schema (Entity, Director, Edge, Metadata)
│   ├── data/
│   │   └── sampleStructure.ts   # Aurelius Dynasty Trust demonstration template
│   ├── store/
│   │   ├── useStructureStore.ts # Central Zustand state store
│   │   └── useStructureStore.test.ts
│   ├── utils/
│   │   ├── layoutEngine.ts      # Dagre auto-layout & sibling sorting algorithms
│   │   ├── layoutEngine.test.ts
│   │   ├── entityStyle.ts       # Fiduciary entity styling & color schemes
│   │   ├── exportService.ts     # PNG, SVG, PDF generation & JSON backup
│   │   └── exportService.test.ts
│   └── components/
│       ├── header/              # Top action bar, sorting switcher, auto-tidy
│       ├── sidebar/             # Outliner tree, entity form, director directory
│       ├── canvas/              # React Flow interactive canvas wrapper
│       ├── nodes/               # Custom executive entity card node
│       ├── edges/               # Custom stepped orthogonal ownership connector
│       └── export/              # Export modal for PDF/PNG/SVG and JSON file load/save
```

---

## License

Internal Enterprise / Proprietary Use.
