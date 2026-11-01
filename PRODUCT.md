# Product

<!-- impeccable:product-schema 1 -->

## Platform

Desktop application (Electron 44+, Windows/macOS/Linux) and standalone web application (modern browsers).

## Users

Trust officers, fiduciary specialists, corporate secretaries, and private wealth management administrators managing multi-tiered corporate trust structures, holding vehicles, operating subsidiaries, property SPVs, foundations, and their boards of directors.

## Product Purpose

JERMChart provides a dedicated, 100% client-side, zero-telemetry structure charting utility for corporate trust management and fiduciary governance. It replaces tedious, error-prone manual diagramming in generic tools (Visio, PowerPoint) with automated hierarchical layouts, smart sibling sorting, cross-structure director spotlighting, spreadsheet roundtripping, interactive drag-and-drop shape palettes with omnidirectional connection handles, client-side AES-256 encrypted JSON backups, and AI-assisted photo/sketch ingestion (Local Ollama and Google Gemini) while enforcing strict airgapped offline data privacy.

## Positioning

Unlike generic diagramming software (Visio, Lucidchart, Miro) or cloud-hosted equity management platforms (Carta), JERMChart is a zero-telemetry, mathematically airgapped, fiduciary-specific tool. It natively understands trust/holding entity hierarchies, multi-parent ownership percentages, share classes, resident director governance constraints, and allows instant roundtrip synchronization with corporate secretarial Excel entity registers without leaking sensitive client structures to external clouds.

## Operating Context

- Standalone desktop application (Electron 44+, Windows/macOS/Linux) and client-side web application (modern browsers).
- Used during client onboarding, annual fiduciary reviews, regulatory compliance audits, board meetings, and corporate restructuring advisory.
- Environments frequently involve airgapped corporate networks, confidential client data handling, and strict compliance policies barring unauthorized cloud egress.
- Fully supports air-gapped on-premises local AI vision (via Local Ollama) requiring zero internet connectivity or third-party cloud API keys.

## Capabilities and Constraints

- **Automated Hierarchical Layout & Orthogonal Routing**: Powered by `@dagrejs/dagre` with stepped orthogonal routing, manual drag coordinate preservation, and "Auto-Tidy" one-click visual realigner.
- **Interactive Drag-and-Drop Canvas & Omnidirectional Handles**: Floating Shape Dock palette allowing users to drag-and-drop or click-to-add Entities, Trusts, Associated Parties / Persons, and Banks directly onto the canvas; 4-point connection handles (North, South, East, West) on entity cards; Connection Quick Picker modal with ownership percentage slider, relationship types (Ownership, Advisory, Control, Custody), and source/target direction swapping; structural integrity guards preventing circular ownership and self-loops.
- **Bank Entities & Associated Parties**: Dedicated styling and iconography for Bank / Financial Institution entity types; staged Person / Associated Party nodes (Protectors, Enforcers, Nominees, Custodians, Settlors); interactive on-canvas Fiduciary Legend.
- **Configurable Sibling Sorting**: Alphabetical (A–Z), Ownership % (descending), Jurisdiction grouping, and Manual mode.
- **Dual-Mode Data Entry**: Quick hierarchical tree outliner with branch manipulation and comprehensive entity details form (legal types, jurisdiction autocomplete, tax/reg IDs, notes).
- **Board of Directors, Spotlight Mode & Director Cap**: Cross-entity director directory with one-click spotlighting of board seats and resident director indicators (`RES`); visual card director caps with compact overflow badges (`+N more`) preventing card bloat.
- **Read-Only Presentation Mode & Governance**: Non-destructive view mode (`isReadOnly`) for client review and board meetings; administrative feature flag gating (`allowJsonBackup`) for enterprise policy control.
- **Client-Side Encrypted JSON Backups & Export Engine**: Fiduciary AES-256-GCM encryption with PBKDF2 (100,000 iterations, SHA-256) password derivation; backward-compatible plaintext/encrypted `.json` auto-detection; sanitized export filenames; multi-format exports: 12-column Excel roundtrip (`xlsx`), print-ready PDF (`jspdf`), Microsoft PowerPoint (`pptxgenjs`), high-res PNG (2.5x DPI), and vector SVG.
- **Dual Multimodal AI Vision OCR (Local Ollama & Google Gemini)**: User-initiated transcription of whiteboard sketches or photographed diagrams into editable charts. Supports **Local Ollama** (`llama3.2-vision`, `minicpm-v`, `llava`) for 100% air-gapped, zero-cloud offline OCR, as well as cloud-hosted Google Gemini (`@google/genai`). Features unified canonical JSON schema validation, live model discovery (`/api/tags`), real-time progress feedback overlay with elapsed timer and cancellation/abort control, and post-OCR undo snapshot protection.
- **Zero-Telemetry Offline Architecture**: AST compile-time restrictions on unauthorized network primitives (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`), audited local vendored CSS (`xyflow-base.css`), strict CSP, and Electron runtime firewall canceling unauthorized outbound traffic while permitting safe user-configured local/LAN Ollama endpoints.
- **Quality & Complexity Gates**: Strict ESLint rules, cognitive complexity < 15, ReDoS-free linear regex, dedicated `__tests__` isolated from production builds, 40 test suites (464 tests), and 100% test coverage threshold across statements, branches, functions, and lines.

## Brand Commitments

- **Name**: JERMChart
- **Voice**: Fiduciary-grade, authoritative, precise, professional, trustworthy, understated executive elegance.
- **Aesthetic Tone**: Clean financial/legal workspace, high visual contrast, structured typography, zero clutter, distraction-free drafting.

## Evidence on Hand

- Production-grade codebase in React 19, TypeScript 5.9, Tailwind CSS v4, Zustand 5, Vite 8, and Electron 44+.
- 40 automated test suites verifying layout calculations, Excel roundtrip parsing, and offline network isolation under `src/__tests__/` (464 tests, 100% coverage threshold).
- Documentation and specification in `README.md`, `PRODUCT.md`, `DESIGN.md`, and `AGENTS.md`.

## Product Principles

1. **Fiduciary Privacy First**: Confidential client structures never touch third-party servers; zero telemetry is mathematically and architecturally guaranteed.
2. **Automated Algorithmic Order**: The software handles connector routing, tier alignments, and sibling sorting so the fiduciary specialist never spends time manually untangling lines.
3. **Lossless Interoperability**: Flawless roundtrip compatibility with standard spreadsheet registers (`.xlsx`) and executive presentation formats (`.pdf`, `.pptx`, `.png`).
4. **Governed Clarity**: Highlighting corporate governance reality—such as cross-board directorships and jurisdiction footprints—takes precedence over generic diagram decoration.

## Accessibility & Inclusion

- Keyboard navigability across tree outline, entity editing forms, and canvas zoom/pan controls.
- High-contrast visual separation between ownership tiers, entity types, and active spotlight states.
- Clear semantic labeling and ARIA attributes for fiduciary data tables and modal dialogs.
