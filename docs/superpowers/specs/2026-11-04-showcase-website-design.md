# Design Document: JERMChart Open-Source Showcase Website

- **Date:** 2026-11-04
- **Status:** Approved
- **Target Sub-Directory:** `website/`

---

## 1. Executive Summary & Objectives

JERMChart is an open-source, 100% client-side, zero-telemetry desktop and web structure chart application designed for trust officers, fiduciary specialists, and corporate administrators.

The goal of this sub-project is to build a high-conversion, modern developer & product showcase website modeled after the **DeepSeek Harness** design language (`deepseek.com/en/harness/`). The website will be fully self-contained in a `website/` sub-directory of the repository, enabling independent hosting on GitHub Pages, Cloudflare Pages, Netlify, or standard Nginx/Apache web servers.

### Key Requirements
1. **Fiduciary Color Scheme**: Accurately reflects JERMChart's color system:
   - Deep Navy / Slate background (`#0f172a`, `#1e293b`)
   - Trust Ocean Blue (`#0284c7`, `#0369a1`)
   - Trust Gold / Amber (`#d97706`, `#f59e0b`)
   - Trust Emerald / Teal (`#0d9488`, `#10b981`)
   - High-contrast crisp typography (`#f8fafc`, `#cbd5e1`, `#94a3b8`)
2. **Single-Page Smooth Scrolling**: Sticky header with section anchors, smooth scrolling, and no multi-page routing.
3. **Pure Vanilla Web Architecture**: HTML5, modern CSS3 (with CSS variables and responsive flexbox/grid), and lightweight vanilla JavaScript. Zero npm dependencies, zero build steps, zero remote telemetry, and zero third-party CDNs.
4. **Static High-Fidelity UI Mockup**: An illustrated desktop window diagram with interactive callout pins demonstrating Dagre algorithmic layout, director spotlight, AES-256 encryption, and AI OCR vision.
5. **Balanced CTAs**: Prominently features desktop Windows executable download (GitHub Releases) and GitHub repository star/clone links, while reserving future extensibility for a hosted web demo.
6. **Placeholders**: Clear placeholders for actual logo replacement, social media links (X, LinkedIn, Discord, GitHub), and single-page modal overlays for Privacy Policy and Terms of Use.

---

## 2. Directory Structure & Asset Organization

All website assets will reside within the `website/` sub-directory:

```
JERMChart/
├── website/
│   ├── index.html                  # Main single-page document
│   ├── styles/
│   │   ├── main.css                # Reset, typography, global layout & scrollbar
│   │   ├── theme.css               # Color variables, gradients, and utility tokens
│   │   └── components.css          # Navigation, hero, mockup, feature cards, modals, footer
│   ├── scripts/
│   │   ├── main.js                 # Smooth scroll spy, clipboard copy, modal management
│   │   └── mockup-callouts.js      # Hover states and tooltips for diagram callout pins
│   └── assets/
│       ├── favicon.svg             # Placeholder SVG favicon
│       ├── logo-placeholder.svg    # Modular SVG brand mark (easily swappable)
│       └── icons/                  # Inlined/standalone local SVG icons (GitHub, Windows, Shield, etc.)
```

---

## 3. Page Structure & Component Specifications

### 3.1 Header & Sticky Navigation
- **Left**: Swappable SVG logo placeholder + `JERMChart` wordmark + `v1.3.0` release tag.
- **Center**: Navigation anchor links:
  - `#features` (Features)
  - `#capabilities` (Core Capabilities)
  - `#security` (Zero-Telemetry Security)
  - `#exports` (Exports & Compatibility)
  - `#quickstart` (Quick Start)
- **Right**:
  - GitHub Stars button (links to `https://github.com/duracellrabbid/JERMChart`).
  - Primary CTA button: `Download for Windows` (links to GitHub Releases).
  - *(Extensibility hook)*: Commented/reserved placeholder button for `Launch Web Demo`.

### 3.2 Hero Section & Static High-Fidelity Showcase
- **Announcement Pill**: `100% Client-Side Privacy • Zero Telemetry Architecture`.
- **Headline**: `Algorithmic Fiduciary & Corporate Structure Charts`.
- **Sub-headline**: `An open-source desktop utility for trust officers, corporate secretaries, and legal administrators to organize, interactively sort, and export complex multi-tier entity structures without line crossings.`
- **Action Buttons**:
  - `Download for Windows` (Primary gradient button with Windows icon).
  - `View on GitHub` (Secondary border outline button with GitHub icon).
- **Showcase Window (High-Fidelity Illustration)**:
  - Styled dark desktop window container with title bar (`Apex International Trust - Fiduciary Structure`).
  - Rendered SVG hierarchy diagram:
    - Trust Entity (Amber border & badge).
    - Holding Company (Trust Blue border & badge, 100% ownership).
    - Operating Company (Emerald border, 100% ownership).
    - Property SPV (Emerald border, 75% JV).
    - Nominee/Bank Node (Indigo border).
  - Stepped orthogonal non-crossing connector lines.
  - 4 Interactive Callout Pins (hoverable with glowing pulse animation):
    - *Pin 1: Dagre Layout Engine* — "Automated tier placement with collision avoidance".
    - *Pin 2: Director Directory & Spotlight* — "Cross-structure board seat tracking".
    - *Pin 3: AES-256 GCM Protection* — "Client-side encrypted backups with PBKDF2".
    - *Pin 4: AI Diagram OCR* — "Offline Ollama & Google Gemini diagram recognition".

### 3.3 Trust & Metric Bar
Horizontal strip highlighting key project benchmarks:
- `100% Client-Side` (Zero unauthorized network egress)
- `460+ Automated Tests` (100% coverage threshold enforced in CI)
- `AES-256-GCM` (PBKDF2 key derivation for confidential files)
- `MIT Licensed` (Free and open source for corporate fiduciaries)

### 3.4 Feature Matrix (DeepSeek-style Modular Grid)
Six structured technical cards with category badges and icons:
1. **Algorithmic Dagre Layout Engine**: Automated non-overlapping hierarchy, orthogonal connectors, one-click Auto-Tidy, and smart sibling flanking.
2. **Fiduciary & Banking Entity Models**: Built-in support for Trusts, HoldCos, OpCos, SPVs, Foundations, Partnerships, and Banks with visual fiduciary badges.
3. **Configurable Sibling Sorting Rules**: Automatic branch ordering by Alphabetical (A-Z), Ownership Percentage (High to Low), or Incorporation Jurisdiction.
4. **Cross-Structure Director Spotlight**: Board of Directors directory with resident director tags (`RES`) and interactive visual spotlighting.
5. **Fiduciary-Grade Export Engine**: Print-ready A4 Landscape PDFs (confidentiality notices, matter references), PowerPoint (`.pptx`), 2.5x PNG, vector SVG, and roundtrip Excel (`.xlsx`).
6. **Airgapped AI Diagram OCR**: Whiteboard/sketch-to-chart transcription supporting both on-premises offline Ollama and Google Gemini multimodal vision.

### 3.5 Security & Zero-Telemetry Deep-Dive
A dedicated technical breakdown providing peace of mind to fiduciary compliance teams:
- **Compile-Time Network Bans**: ESLint `no-restricted-globals` statically forbids unauthorized network APIs.
- **Electron Firewall**: 6 Chromium privacy flags and IPC egress filtering.
- **Vendored CSS & Local Assets**: Fully self-contained styles with zero external CDN injection vectors.
- **Client-Side AES-256 Encryption**: Password-protected matter files with 100,000 PBKDF2 iterations.

### 3.6 Quick Start & Installation Section
Dual-path setup section:
- **Desktop Users**: Direct download card for Windows installer `.exe` with release notes link.
- **Developers**: Tabbed terminal block with copy button:
  ```bash
  git clone https://github.com/duracellrabbid/JERMChart.git
  cd JERMChart
  npm install
  npm run dev
  npm run electron:dev
  ```

### 3.7 Modals & Footer
- **Privacy Policy Modal**: Explains client-side execution, absence of tracking/telemetry, and local API key storage.
- **Terms of Use Modal**: MIT license disclaimers, warranty limitations, and fiduciary verification guidelines.
- **Footer**:
  - Logo placeholder and mission statement.
  - Quick navigation links.
  - Community links (GitHub, Issues, Releases).
  - Social media placeholders: X (Twitter), LinkedIn, Discord, GitHub.
  - Legal triggers for Privacy Policy and Terms of Use modals.
  - Copyright: `© 2026 JERMChart Contributors. Released under the MIT License.`

---

## 4. Non-Functional Requirements & Design Principles

1. **Performance**: Initial load time < 200ms on standard connections (no external network requests). Total uncompressed asset size < 100KB.
2. **Accessibility**: Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<dialog>`), full keyboard navigation support, and ARIA attributes for modal dialogs.
3. **Responsiveness**: Mobile-first fluid CSS grid/flexbox supporting screens from 320px to 4K displays.
4. **Maintainability**: Clear separation of concerns between structure (`index.html`), design tokens (`theme.css`), component layout (`components.css`), and behavior (`main.js`).
5. **Brand Consistency**: Uses the same CSS color variables, font metrics, and entity color definitions as the main JERMChart desktop application.
