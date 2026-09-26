## Why

In corporate trust and fiduciary structure charts, Trust entities are traditionally represented as distinct upright triangles, while subsidiaries appear as rectangles. Currently, Trust cards have a hardcoded 340x280px bounding box and naive vertical flex positioning. When entity names wrap across multiple lines or when multiple directors and beneficiaries are recorded, text frequently escapes the diagonal SVG boundaries because an upright triangle's width narrows dramatically toward its apex. 

Furthermore, as trust structures grow in governance complexity (recording 5 to 10+ directors), cards either produce cramped vertical scrollbars or risk ballooning across the canvas. Fiduciary officers require a clean, compact canvas for exploration with a configurable director density cap, while ensuring that exported documents (PDF, PNG, SVG, PPTX) completely and faithfully display all directors without truncation or scroll clipping.

## What Changes

- **Predictive Geometric Inscription for Trust Cards**: Dynamic calculation of Trust triangle width and height ($W = R \times H$, with aspect ratio $R \approx 1.25$) based on character length of entity name, presence of registration details, visible directors count, and beneficiaries, ensuring all rectangular content tiers fit strictly within the sloping SVG polygon.
- **Apex & Tier Internal Restructuring**:
  - Restructure the narrow top apex into a compact vertical stack (24px icon circle + compact type/status pill) to reclaim vertical clearance.
  - Convert hardcoded pixel widths (`max-w-[155px]`, `w-[230px]`) into proportional tier widths (`max-w-[32%]`, `max-w-[62%]`, `max-w-[85%]`).
  - Compute SVG polygon points dynamically from calculated dimensions `${width/2},6 ${width-8},${height-6} 8,${height-6}`.
- **Configurable Global Director Cap**:
  - Add a visible director cap control in the application header (default: 3; options: 2, 3, 4, 5, All).
  - Apply the director cap across both Trust triangles and Subsidiary cards on the live canvas.
  - When an entity exceeds the cap, display a clean `+N more directors...` badge.
  - Interactive badges: hovering displays a floating popover listing the remaining directors; clicking selects the entity and focuses the Directors Directory / Entity Details tab.
- **Uncapped High-Fidelity Document Export**:
  - Temporary two-phase layout cycle during export (`isExportMode`): when exporting to PNG, SVG, PDF, or PowerPoint, the system temporarily lifts the director cap ($N = \infty$), dynamically expanding node heights and executing a Dagre re-layout pass so child nodes never collide.
  - Guarantees 100% complete, unclipped fiduciary disclosure in exported artifacts with zero scrollbars, restoring the user's canvas view immediately after capture.

## Capabilities

### New Capabilities
- `content-aware-trust-shape`: Content-aware geometric sizing of triangular trust entity cards, tiered internal layout, and boundary-safe text containment.
- `chart-director-cap`: Global director visibility cap for live diagram rendering with interactive overflow badges, coupled with full uncapped expansion during document exports.

### Modified Capabilities
<!-- None: No existing specs in openspec/specs/ are modified. -->

## Impact

- `src/utils/layoutEngine.ts`: Update `getEntityDimensions` to accept the entity data and director cap, computing dynamic width and height for Trust cards and dynamic heights for Subsidiary cards; update Dagre node registration and React Flow node mapping.
- `src/components/nodes/EntityCardNode.tsx`: Refactor `TrustTriangleCard` to use dynamic SVG polygon points, restructured apex, proportional tier widths, and director capping; update `SubsidiarySquareCard` with director capping and export expansion.
- `src/store/useStructureStore.ts`: Add `directorCap` (number | 'all') and `isExportMode` (boolean) to Zustand store with corresponding setter actions.
- `src/components/header/AppHeader.tsx`: Add Director Cap dropdown control next to the Sibling Sort selector.
- `src/components/export/ExportModal.tsx`: Wrap visual export routines (`handleExportPng`, `handleExportSvg`, `handleExportPdf`, `handleExportPptx`) in `setExportMode(true)` / `setExportMode(false)` lifecycle.
- `src/__tests__/`: Unit tests for `layoutEngine`, `EntityCardNode`, and store additions covering boundary containment, capping, and export transitions.
