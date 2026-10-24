---
name: JERMChart
description: Client-side fiduciary structure charting & corporate governance diagramming utility
colors:
  obsidian-navy: "#0f172a"
  slate-surface: "#1e293b"
  slate-border: "#334155"
  paper-white: "#ffffff"
  canvas-bg: "#f8fafc"
  panel-bg: "#f1f5f9"
  border-light: "#e2e8f0"
  text-primary: "#0f172a"
  text-secondary: "#475569"
  text-muted: "#94a3b8"
  sovereign-sky: "#0284c7"
  sovereign-sky-hover: "#0369a1"
  sovereign-sky-light: "#e0f2fe"
  trust-amber: "#d97706"
  trust-amber-light: "#fef3c7"
  ledger-emerald: "#059669"
  ledger-emerald-hover: "#047857"
  ledger-emerald-light: "#d1fae5"
  custodian-cyan: "#0891b2"
  custodian-cyan-light: "#cffafe"
  fiduciary-purple: "#9333ea"
  fiduciary-purple-light: "#f3e8ff"
  fiduciary-rose: "#e11d48"
  fiduciary-rose-light: "#ffe4e6"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-emerald}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.ledger-emerald-hover}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-secondary:
    backgroundColor: "{colors.slate-surface}"
    textColor: "{colors.canvas-bg}"
    rounded: "{rounded.md}"
    padding: "6px 10px"
  button-danger:
    backgroundColor: "{colors.fiduciary-rose}"
    textColor: "{colors.paper-white}"
    rounded: "{rounded.md}"
    padding: "6px 14px"
  card-entity:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "12px"
    width: "220px"
  card-bank:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: "12px"
    width: "180px"
    height: "180px"
  badge-pill:
    backgroundColor: "{colors.sovereign-sky-light}"
    textColor: "{colors.sovereign-sky}"
    rounded: "{rounded.full}"
    padding: "2px 6px"
---

# Design System: JERMChart

## Overview

**Creative North Star: "The Fiduciary Vault"**

JERMChart is an executive-grade structure charting and fiduciary governance workbench. Built for trust officers, private wealth managers, and corporate secretarial teams, the visual system commands quiet authority, mathematical precision, and uncompromising legal clarity. The environment conveys the gravitas of a sovereign private bank vault: deep obsidian steel headers anchoring the workspace, crisp paper-white entity cards floating upon an infinite architectural canvas, and laser-precise orthogonal connector routing.

Every pixel serves fiduciary comprehension. Dense tabular figures, standardized legal taxonomy badges, and unambiguous ownership percentages displace consumer fluff. JERMChart explicitly rejects playful SaaS cliches—there are no pastel gradients, bouncy micro-interactions, cartoonish mascots, or oversized rounded pills. Instead, the interface balances dense desktop productivity with boardroom-ready executive presentation elegance.

**Key Characteristics:**
- **Institutional Gravitas**: Deep slate toolbar chrome paired with crisp, high-contrast light work surfaces for zero eye fatigue during multi-hour structuring reviews.
- **Strict Information Density**: Compact 12px typography, 6px-8px geometric radii, and tabular lining numerals aligned for instant financial and regulatory auditing.
- **Fiduciary Geometry**: Distinct entity silhouettes (Apex Triangles for Trusts/Foundations, Circles for Banking/Custodians, Rectangular Cards for SPVs/Operating Companies) establish immediate structural comprehension.
- **Zero Decorative Noise**: Color is strictly semantic; every hue maps 1:1 to entity legal classification, governance roles, or operational validation.

## Colors

The palette is anchored in an authoritative institutional harmony of deep obsidian slate, crisp white cardstock, and saturated fiduciary role accents.

### Primary
- **Obsidian Navy** (`#0f172a`): Command chrome, application header, active toolframes, and primary text headings. Communicates foundational stability and absolute data security.
- **Sovereign Sky** (`#0284c7`): Primary brand accent, active selection boundaries, holding company badges, and system focus rings.

### Secondary
- **Trust Amber** (`#d97706`): Apex fiduciary identifier for Family Trusts, Dynasty Settlements, and global spotlight governance highlights.
- **Ledger Emerald** (`#059669`): Operational corporate entities, primary export triggers, active entity indicators, and balance sheet affirmations.

### Tertiary
- **Custodian Cyan** (`#0891b2`): Institutional banking partners, depository entities, and custodian nodes.
- **Fiduciary Purple** (`#9333ea`): LLCs, partnerships, and protector governance roles.
- **Fiduciary Rose** (`#e11d48`): Entities in liquidation, enforcer roles, and irreversible destructive actions (canvas reset).

### Neutral
- **Paper White** (`#ffffff`): Entity node bodies, active modal containers, and sidebar tab panels.
- **Canvas Architectural Wash** (`#f8fafc`): The endless diagram drafting canvas background.
- **Slate Panel Fill** (`#f1f5f9`): Inspector sidebar tab header strips and disabled form surfaces.
- **Border Crisp** (`#e2e8f0`): Structural containment lines, grid dividers, and modal separators.
- **Border Dark** (`#334155`): Dark chrome dividers and header button framing.
- **Text Primary** (`#0f172a`): Legal entity names, modal titles, and primary figures.
- **Text Secondary** (`#475569`): Jurisdictions, table values, and field labels.
- **Text Muted** (`#94a3b8`): Registration numbers, timestamps, and placeholder guidance.

### Named Rules
**The Semantic Accent Rule.** Color is never applied purely as decoration. Every color swatch on the canvas conveys either an entity legal classification, a fiduciary officer role, or an active governance spotlight.
**The Sovereign Contrast Rule.** All text elements must preserve a minimum contrast ratio of 4.5:1 against their direct container background; badge pills always pair a deep saturated glyph with an 8-15% tonal background wash.

## Typography

**Display Font:** System UI font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
**Body Font:** System UI font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
**Label/Mono Font:** Monospace with Tabular Lining Figures (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`)

**Character:** Crisp, neutral executive Swiss typography tuned for legibility in dense legal registers, hierarchical tree outliners, and high-resolution board deck exports.

### Hierarchy
- **Display** (Bold 700, `14px`, line-height `1.25`, tracking `-0.01em`): Top application header structure title and primary modal dialog headers.
- **Headline** (Semibold 600, `14px`, line-height `1.3`): Section titles, group headers, and export configuration titles.
- **Title** (Semibold 600, `12px`, line-height `1.35`, tracking `-0.01em`): Legal entity names inside cards and tree outliner rows.
- **Body** (Regular 400, `12px`, line-height `1.5`): Form fields, inspector descriptions, dialog explanatory paragraphs, and fiduciary notes.
- **Label** (Semibold 600, `10px`, line-height `1.2`, tracking `0.05em`, uppercase): Entity type pills, governance badges (`RES`, `DIR`), and table column headers.
- **Tabular Mono** (Regular 400, `9px-11px`, `tabular-nums lining-nums`): Registration numbers, tax IDs, share class percentages, and date metadata.

### Named Rules
**The Tabular Precision Rule.** Every numeric figure, ownership percentage, registration code, and monetary/share value must enforce `font-variant-numeric: tabular-nums lining-nums` to guarantee vertical column alignment.
**The Case Doctrine Rule.** Entity type pills and fiduciary governance indicators (`RES`, `DIR`, `UBO`) must be rendered in uppercase with expanded letter-spacing (`tracking-wider` / `0.05em`) to ensure instant scanability at zoom scale.

## Layout

The workspace utilizes an ergonomic desktop master-detail split layout optimized for high-resolution monitors (minimum 1280x720):

- **Header Bar**: Fixed 56px (`h-14`) obsidian slate toolbar across the top. Groups trust title & client reference on the left, history & view configurations in the center, and primary actions (Import, Export, Settings) on the right.
- **Sidebar Inspector**: Fixed 340px width collapsible left drawer with a 3-tab segment controller (Tree Outliner, Entity Details, Directors Directory). Features instant keyboard navigation and inline search.
- **Central Canvas Workspace**: Infinite pan/zoom interactive viewport with subtle geometric dot grid. Supports orthogonal stepped connector routing with auto-tidy alignment algorithms.
- **Floating Legend & Overlays**: Unobtrusive floating glassmorphic panels (`bg-white/95 backdrop-blur-sm shadow-lg`) docked at bottom-left for fiduciary notation keys and top-center for OCR preview verification banners.
- **Density & Rhythm**: Compact 4px base spatial unit (`p-1`, `p-2`, `p-3`). Content paddings are tightly bounded to avoid wasted screen real estate.

## Elevation & Depth

JERMChart adheres to a **Tonal Layered with Structural Focus** philosophy. The default canvas state is intentionally flat and architectural, relying on precise 1px and 2px borders, contrasting tonal surfaces, and crisp accent bars. Soft shadows and luminous focus rings are strictly reserved for state elevation: active node selection, modal popovers, and cross-structure director spotlights.

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`): Standard resting elevation for subsidiary cards and bank nodes, providing separation from the canvas grid.
- **Panel Elevation** (`box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`): Dropdown menus, view configuration flyouts, and floating legend panels.
- **Modal Scrim** (`box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25)`): High-contrast institutional modal dialogs over a `bg-slate-950/60 backdrop-blur-sm` overlay.
- **Spotlight Halo** (`ring-4 ring-amber-500 shadow-xl scale-[1.02]`): Vibrant dual-ring halo applied when an associated party or director seat is clicked, illuminating all related entities across the hierarchy while dimming unrelated nodes.

### Named Rules
**The Flat-By-Default Rule.** Canvas nodes and outliner rows remain planar at rest. Shadows and elevation shifts occur exclusively as an explicit response to user interaction (hover, selection, drag, or spotlighting).
**The Focus Isolation Rule.** Modals and overlay dialogs must always pair a deep 60% obsidian backdrop with a subtle backdrop blur (`backdrop-blur-sm`) to visually isolate fiduciary decision-making from canvas clutter.

## Shapes

- **Standard Cards**: `8px` (`rounded-lg`) corner radius with crisp 2px colored top accent bars and 1px/2px outer borders.
- **Trust Apex Geometries**: Sharp triangular polygon silhouettes (`fill="#ffffff" stroke="#f59e0b"`) with a softened amber apex cap (`#fef3c7`) representing paramount settlement authority.
- **Banking / Custodian Nodes**: Pure `180px` circles (`rounded-full`) with concentric 1px/2px cyan borders and central institutional iconography.
- **Form Inputs & Buttons**: Compact `6px` (`rounded-md`) corner radii offering tactile precision without bubbly curves.
- **Status & Role Badges**: `9999px` (`rounded-full`) pill badges for entity status (`Active`, `Dormant`, `Nominee`) and `4px` (`rounded`) badges for officer roles (`Director`, `Protector`, `Settlor`).

## Components

### Buttons
- **Shape:** Refined rectangular form with 6px corner radius (`rounded-md`).
- **Primary Export:** Emerald ledger green (`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 shadow`).
- **Secondary / Tooling:** Obsidian slate (`bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 border border-slate-700`).
- **Danger Action:** Rose destructive (`bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs px-3.5 py-1.5 shadow-sm`).
- **History Undo/Redo:** Compact icon pairing (`p-1.5 text-slate-200 hover:text-white rounded disabled:text-slate-600`).

### Entity Cards (Subsidiaries & OpCos)
- **Shape:** 220px width, 140px standard height, 8px radius (`rounded-lg bg-white shadow-md border-2`).
- **Accent Bar:** 6px top header stripe reflecting entity type color (`bg-sky-600`, `bg-emerald-600`, `bg-purple-600`).
- **Metadata Layout:** 3-row structured layout containing uppercase type badge, status dot, bold legal name, jurisdiction flag, and tabular registration ID.
- **Handles:** Crisp 12px circular connection ports (`bg-slate-700 border-2 border-white`) at Top, Bottom, Left, and Right boundaries.

### Trust Apex Nodes
- **Shape:** Dynamic equilateral triangle SVG (`width: 260px`, `height: 180px`).
- **Styling:** Paper-white polygon body with 2px amber stroke, crowned by a soft amber apex cap fill (`#fef3c7`).
- **Content:** Center-weighted typography with prominent fiduciary shield indicator and tabular settlement date.

### Bank Custodian Circles
- **Shape:** 180px circular geometry (`rounded-full bg-white shadow-md border-2 border-cyan-500`).
- **Styling:** Central circular icon badge featuring the institutional Landmark icon, surrounded by bank name and jurisdictional status.

### Satellite Officer Cards
- **Shape:** Compact 140px-180px floating card (`rounded-md bg-white border shadow-sm p-2`).
- **Header:** Uppercase role identifier pill (`DIRECTOR`, `SETTLOR`, `PROTECTOR`) paired with a tabular count indicator.
- **List Items:** Interactive list rows with corporate vs individual user icons, clickable for instant global spotlight highlighting.

### Form Fields & Inputs
- **Style:** Crisp 1px slate border (`border-slate-300`), white background, 4px radius (`rounded`), compact 12px font (`text-xs px-2.5 py-1.5`).
- **Focus:** Sharp 1px sky focus ring (`focus:ring-1 focus:ring-sky-500 focus:outline-none`).
- **Disabled State:** Tonal muted wash (`bg-slate-100 text-slate-500 cursor-not-allowed`).

## Do's and Don'ts

### Do:
- **Do** format all financial ownership percentages and company registration numbers with `.font-tabular` (`tabular-nums lining-nums`).
- **Do** enforce 220px fixed width on subsidiary entity cards to maintain deterministic dagre layout alignment.
- **Do** preserve the 3 distinct geometric silhouettes (Triangle for Trusts, Circle for Banks, Rectangle for Companies) across all diagram themes.
- **Do** use uppercase tracking (`tracking-wider text-[9px] font-bold`) for governance and role badge labels.
- **Do** pair destructive dialog actions with an explicit confirmation modal and a distinct rose visual cue.

### Don't:
- **Don't** use pastel neon gradients, decorative cartoon illustrations, or bubbly oversized pill buttons.
- **Don't** introduce floating ambient box-shadows on canvas nodes at rest; elevation must be functional and state-driven.
- **Don't** allow entity names to wrap beyond 3 lines on cards; truncate with ellipsis to prevent layout breakage.
- **Don't** mix arbitrary rounded corner values; strictly adhere to the 4px (inputs), 6px (buttons), and 8px (cards) scale.
- **Don't** use unanchored or decorative animation curves; keep UI transitions bounded to 150ms-200ms ease-out.
