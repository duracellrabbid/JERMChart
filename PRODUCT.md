# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trust officers, fiduciary specialists, corporate secretaries, and private wealth management administrators managing multi-tiered corporate trust structures, holding vehicles, operating subsidiaries, property SPVs, foundations, and their boards of directors.

## Product Purpose

JERMChart provides a dedicated, 100% client-side, zero-telemetry structure charting utility for corporate trust management and fiduciary governance. It replaces tedious, error-prone manual diagramming in generic tools (Visio, PowerPoint) with automated hierarchical layouts, smart sibling sorting, cross-structure director spotlighting, spreadsheet roundtripping, and AI-assisted photo/sketch ingestion while enforcing strict airgapped offline data privacy.

## Positioning

Unlike generic diagramming software (Visio, Lucidchart, Miro) or cloud-hosted equity management platforms (Carta), JERMChart is a zero-telemetry, mathematically airgapped, fiduciary-specific tool. It natively understands trust/holding entity hierarchies, multi-parent ownership percentages, share classes, resident director governance constraints, and allows instant roundtrip synchronization with corporate secretarial Excel entity registers without leaking sensitive client structures to external clouds.

## Operating Context

- Desktop application (Electron 44+, Windows/macOS/Linux) and standalone web application (browser build).
- Used during client onboarding, annual fiduciary reviews, regulatory compliance audits, board meetings, and corporate restructuring advisory.
- Environments frequently involve airgapped corporate networks, confidential client data handling, and strict compliance policies barring unauthorized cloud egress.

## Capabilities and Constraints

- **Automated Hierarchical Layout**: Powered by `@dagrejs/dagre` with orthogonal stepped connectors and "Auto-Tidy" alignment.
- **Configurable Sibling Sorting**: Alphabetical, Ownership % (descending), Jurisdiction grouping, and Manual mode.
- **Dual-Mode Data Entry**: Quick hierarchical tree outliner and comprehensive entity details form (legal types, jurisdiction autocomplete, tax/reg IDs, notes).
- **Director Directory & Spotlight**: Cross-entity director aggregation with one-click spotlighting of board seats and resident director indicators (`RES`).
- **File I/O & Spreadsheet Interop**: Full 12-column Excel roundtrip (`xlsx`), fiduciary PDF generation (`jspdf`), PowerPoint export (`pptxgenjs`), and high-resolution canvas capture (`html-to-image`).
- **Multimodal AI Vision (Gemini)**: Optional, user-initiated transcription of whiteboard photos or hand-drawn sketches via Google Gemini (`@google/genai`) with undo snapshot protection.
- **Zero-Telemetry Offline Architecture**: AST compile-time restrictions on unauthorized network primitives (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`), strict CSP, and Electron firewall canceling unauthorized outbound traffic.
- **Quality & Complexity Gates**: Strict ESLint rules, cognitive complexity < 15, ReDoS-free linear regex, dedicated `__tests__` isolated from production builds, and 100% test coverage threshold.

## Brand Commitments

- **Name**: JERMChart
- **Voice**: Fiduciary-grade, authoritative, precise, professional, trustworthy, understated executive elegance.
- **Aesthetic Tone**: Clean financial/legal workspace, high visual contrast, structured typography, zero clutter, distraction-free drafting.

## Evidence on Hand

- Production-grade codebase in React 19, TypeScript 5.7, Tailwind CSS, Zustand, and Electron 44.
- Automated tests verifying layout calculations, Excel roundtrip parsing, and offline network isolation under `src/__tests__/`.
- Documentation and specification in `README.md`, `ARCHITECTURE.md`, and `AGENTS.md`.

## Product Principles

1. **Fiduciary Privacy First**: Confidential client structures never touch third-party servers; zero telemetry is mathematically and architecturally guaranteed.
2. **Automated Algorithmic Order**: The software handles connector routing, tier alignments, and sibling sorting so the fiduciary specialist never spends time manually untangling lines.
3. **Lossless Interoperability**: Flawless roundtrip compatibility with standard spreadsheet registers (`.xlsx`) and executive presentation formats (`.pdf`, `.pptx`, `.png`).
4. **Governed Clarity**: Highlighting corporate governance reality—such as cross-board directorships and jurisdiction footprints—takes precedence over generic diagram decoration.

## Accessibility & Inclusion

- Keyboard navigability across tree outline, entity editing forms, and canvas zoom/pan controls.
- High-contrast visual separation between ownership tiers, entity types, and active spotlight states.
- Clear semantic labeling and ARIA attributes for fiduciary data tables and modal dialogs.
