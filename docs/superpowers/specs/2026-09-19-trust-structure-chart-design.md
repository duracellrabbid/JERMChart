# Design Specification: Trust Management Structure Chart Web Application

**Date:** 2026-09-19  
**Status:** Approved  
**Target Platform:** 100% Client-Side Web Application (React + Vite + TypeScript + `@xyflow/react`)

---

## 1. Executive Summary & Problem Statement

In trust management and corporate fiduciary services, trust officers must regularly prepare structure charts representing trusts, holding companies, operating subsidiaries, property SPVs, foundations, and their associated directors and beneficial owners.

Key operational challenges addressed by this utility:
1. **Layout Sorting & Tidiness**: Hand-drawing or manually arranging structure charts in Visio, PowerPoint, or generic drawing tools often leads to messy, overlapping lines, unbalanced branches, and time-consuming manual realignment whenever an entity or director is added.
2. **Dual-Mode Data Entry**: Trust officers need both a rapid, structured form/tree inspector to key in corporate entities and directors, alongside an intuitive interactive canvas to visually inspect and fine-tune the hierarchy.
3. **Multi-Entity Cross-Ties**: While corporate ownership primarily follows a hierarchical tree (Trust $\to$ HoldCo $\to$ OpCo), shared directorships (e.g. an individual or corporate trustee serving on multiple boards) must be easily traced and spotlighted.
4. **Fiduciary-Ready Presentation & Export**: One-click generation of crisp, high-resolution PNGs, SVGs, and formal A4/A3 landscape PDFs with matter headers, dates, and confidentiality notices for client and regulatory presentations.

---

## 2. Architecture & Tech Stack

The application is built completely client-side with zero backend dependencies, enabling instant browser execution, local data privacy, and offline capability.

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | React 18 / 19 + Vite + TypeScript | Type safety, component modularity, instant HMR |
| **Canvas & Nodes** | `@xyflow/react` (React Flow) | Production-grade pan/zoom, interactive nodes, drag handling, custom orthogonal edges |
| **Layout Engine** | `dagre` (`@dagrejs/dagre`) | Directed graph hierarchical leveling, tier separation, and orthogonal rank assignment |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Clean, executive corporate design (fiduciary color palette: navy, slate, gold/amber, emerald) |
| **State Management** | Lightweight Zustand store | Reactive state with zero boilerplate, syncing canvas and sidebar |
| **Export Services** | `html-to-image` + `jspdf` | High-DPI canvas capture, vector-grade SVG generation, print-ready PDF compilation |
| **Testing** | Vitest + React Testing Library | Fast unit and layout verification testing |

---

## 3. Data Model & Schema

### 3.1 Entity Types and Attributes
```typescript
export type EntityType = 
  | 'Trust' 
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual';

export type EntityStatus = 'Active' | 'Dormant' | 'In Liquidation' | 'Nominee';

export interface Director {
  id: string;
  name: string;
  isCorporate: boolean;         // Corporate trustee/director vs individual
  appointmentDate?: string;     // e.g. "2021-04-15"
  isResident?: boolean;         // Fiduciary requirement tracking (e.g. local resident director)
}

export interface EntityNodeData {
  id: string;
  name: string;
  type: EntityType;
  jurisdiction: string;         // e.g. "Cayman Islands", "Singapore", "Delaware", "BVI"
  registrationNumber?: string;
  taxId?: string;
  status: EntityStatus;
  directors: Director[];
  ubosOrBeneficiaries?: string[]; // Settlors, Protectors, UBOs, Beneficiaries
  notes?: string;
}

export interface OwnershipEdgeData {
  id: string;
  source: string;               // Parent Entity ID
  target: string;               // Subsidiary Entity ID
  ownershipPercentage?: number;  // e.g. 100, 75, 50, 33.33
  shareClass?: string;          // e.g. "Ordinary Shares", "Class A Preferred"
  isCrossLink?: boolean;        // Indicating affiliate or non-hierarchical link
}

export interface ChartMetadata {
  chartTitle: string;           // e.g. "The Horizon Family Trust Corporate Structure"
  clientReference?: string;     // e.g. "TRUST-2026-904"
  effectiveDate: string;        // e.g. "2026-09-19"
  confidentialityNotice: string;// e.g. "STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY"
}

export interface TrustStructureChart {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
}
```

---

## 4. UI & Layout Organization

### 4.1 Interface Layout
1. **Top Application Header (`AppHeader`)**:
   - **Chart Title & Date**: Inline editable title, matter reference, and effective date.
   - **Sibling Sort Criteria Selector**: Instant switch between `Alphabetical (A-Z)`, `Ownership % (High to Low)`, `Jurisdiction`, and `Manual`.
   - **Auto-Tidy Button**: Triggers the algorithmic tree re-layout while respecting sibling ordering.
   - **Template Loader**: 1-click loading of realistic trust structure templates (e.g. Discretionary Family Trust with BVI HoldCo and Operating Subsidiaries).
   - **Export Menu**: Triggers High-Res PNG, SVG, or Print-Ready PDF modal.

2. **Left Collapsible Sidebar (`SidebarInspector`)**:
   - **Tree Outline Tab**: Collapsible hierarchical tree list of all entities. Quick actions to "Add Subsidiary", "Add Parent", or delete entity.
   - **Entity Details Tab**: Form view for the active selected entity:
     - Entity Name & Type dropdown.
     - Jurisdiction selector with common fiduciary jurisdictions pre-populated (Cayman Islands, BVI, Singapore, Hong Kong, Delaware, Jersey, Guernsey, UK, Switzerland, etc.).
     - Registration Number, Tax ID, and Status (Active/Dormant/In Liquidation).
     - Director Manager: Add/remove directors, toggle "Corporate Director" badge, toggle "Resident Director" badge, and record appointment dates.
     - UBO / Settlor / Beneficiary tag manager.
   - **Director Directory Tab**: Aggregated list of all directors across the entire structure. Hovering or clicking any director spotlights all entities across the canvas where they serve.

3. **Visual Structure Canvas (`StructureCanvas`)**:
   - Infinite canvas powered by `@xyflow/react` with smooth trackpad/mouse pan, zoom, fit-view, and minimap.
   - **Custom Entity Node (`EntityCardNode`)**:
     - Visual hierarchy styling (color-coded top border & badge for Trust, HoldCo, OpCo, etc.).
     - Status indicator dot.
     - Country flag / jurisdiction badge and registration number.
     - Ownership received badge at top (e.g. `100% Ordinary Shares`).
     - Director section with pills and badges for corporate/resident status.
     - Bottom handle for child connections; top handle for parent connections.
   - **Orthogonal Ownership Edge (`OwnershipEdge`)**:
     - Stepped non-overlapping connectors with centered ownership pill (e.g. `100%`).
     - Clickable to edit ownership percentage or delete relationship.

---

## 5. Algorithmic Sorting & Layout Engine

To guarantee the chart is presented in a "nicely sorted manner":
1. **Sibling Pre-Sorting**:
   - For every parent entity with multiple subsidiaries, child nodes are sorted before passing into Dagre according to the active criteria:
     - `Alphabetical`: A $\to$ Z by entity name.
     - `Ownership %`: Descending order of ownership percentage (100% $\to$ 50% $\to$ ...).
     - `Jurisdiction`: Grouped by jurisdiction name.
   - This ensures sibling branches are placed predictably and consistently from left to right.
2. **Layered Dagre Layout**:
   - Direction: `TB` (Top to Bottom).
   - Node separation (`nodesep`): 60px horizontal buffer between sibling cards.
   - Rank separation (`ranksep`): 100px vertical buffer between ownership tiers.
   - Card dimensions: Fixed width (280px) and dynamic height calculated based on director count to prevent card overlap.
3. **Manual Fine-Tuning**:
   - Trust officers can drag any entity card to adjust visual balance. Manual adjustments are preserved until the officer clicks "Auto-Tidy".

---

## 6. Export Pipeline

1. **High-Resolution PNG / SVG**:
   - Uses `html-to-image` at pixel ratio 2x/3x to render sharp, printable images suitable for Word documents and PowerPoint slides.
   - Preserves custom font rendering, badges, and sharp borders.
2. **Print-Ready PDF**:
   - Formatted for standard A4 or A3 Landscape.
   - Embeds the official Header:
     - Structure Chart Title
     - Client Reference & Effective Date
     - Generated timestamp
   - Embeds the official Footer:
     - Confidentiality statement: `"STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY"`
     - Page numbering and fiduciary notice.

---

## 7. Error Handling, Validation & Persistence

1. **Cycle Prevention**: The relationship engine validates graph edges to prevent circular ownership loops (an entity cannot be an ancestor of itself).
2. **Disconnected Entities**: Handled gracefully by placing orphan entities in an "Unconnected Entities" staging row at the top.
3. **Data Persistence**:
   - Debounced sync to `localStorage` prevents data loss.
   - **File Export/Import**: Users can download the entire structure as `.json` and reload it anytime for different client files.

---

## 8. Verification & Testing

- **Unit Tests**:
  - Sibling sorting functions (alphabetical, percentage, jurisdiction).
  - Dagre coordinate generator (tier assignment, node spacing, non-NaN coordinates).
  - Cycle detection algorithms.
- **Component Tests**:
  - Entity card rendering (proper badge colors, director chips).
  - Inspector form updates reflecting on canvas nodes.
  - Sibling sort selector triggering layout recalculation.
