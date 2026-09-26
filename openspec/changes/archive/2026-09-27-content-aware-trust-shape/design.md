## Context

See `proposal.md` for problem motivation and scope.
In JERMChart, node dimensions are registered into `@dagrejs/dagre` inside `src/utils/layoutEngine.ts`. Dagre determines the $(x, y)$ coordinate positions for all React Flow nodes. Currently, `getEntityDimensions(type)` returns a static `{ width: 340, height: 280 }` for Trust entities and `{ width: 220, height: 220 }` for subsidiaries. When Trust cards render in `src/components/nodes/EntityCardNode.tsx`, their fixed SVG polygon (`points="170,6 332,274 8,274"`) and flexbox layout (`justify-between`) cause rectangular text content to cross the sloping boundaries.

Exports (`PNG`, `SVG`, `PDF`, `PPTX` via `src/utils/exportService.ts`) use `toPng` / `toSvg` on the DOM viewport. Any content that requires internal scrollbars on the live canvas gets clipped or renders with partial scrollbars in exported files.

## Goals / Non-Goals

**Goals:**
- Provide deterministic predictive sizing for Trust triangles so Dagre positions nodes with zero post-render collision or layout shifts.
- Restructure `TrustTriangleCard` interior into three geometric clearance tiers (apex, middle, base) with dynamic SVG polygon generation.
- Implement a global `directorCap` in `useStructureStore` and `AppHeader` (default: 3) applying to both Trusts and Subsidiaries, rendering clean `+N more directors...` overflow badges.
- Provide progressive disclosure via hover tooltips and click-to-sidebar navigation on capped badges.
- Implement an automated two-phase export lifecycle (`isExportMode`) that lifts the director cap ($N = \infty$), triggers a Dagre re-layout, captures the unclipped high-res chart, and restores the live canvas state.
- Keep cognitive complexity strictly $< 15$ for all layout and rendering helper functions (enforcing AGENTS.md Rule 4).

**Non-Goals:**
- Free-form manual dragging / stretching of triangle dimensions by users.
- Non-triangular trust representations (the fiduciary convention requires triangles for trusts).
- Paginating directors into separate sub-pages inside the card on export.

## Decisions

### Decision 1: Predictive Inscription Sizing in `layoutEngine.ts` vs DOM `ResizeObserver`
- **Choice**: Deterministic mathematical sizing function (`calculateTrustDimensions(entity, cap)`) executed during the layout phase before Dagre runs.
- **Rationale**: Dagre requires exact $(w, h)$ bounds to compute acyclic layered placement and edge routing. Relying on DOM `ResizeObserver` causes asynchronous layout thrashing, flashing, and circular re-render loops.
- **Alternative Considered**: Multi-pass DOM measurement. Rejected due to visual jitter and high complexity.

### Decision 2: Geometry & Aspect Ratio
- **Choice**: Aspect ratio $R = W / H \approx 1.25$ with minimum dimensions $340 \times 280\text{px}$.
- **Formula**:
  - $h_{\text{top}} = 50\text{px}$ (apex clearance $y_{\text{top}} = 26\text{px}$).
  - $h_{\text{mid}} = 20\text{px (name line 1)} + (\text{len} > 20 ? 18 : 0) + (\text{len} > 42 ? 16 : 0) + 16\text{px (jurisdiction)} + (\text{hasRegNo} ? 14 : 0) + 12\text{px (gap)}$.
  - $\text{visibleCount} = \text{cap} === \text{'all'} \ ? \ \text{directors.length} : \min(\text{directors.length}, \text{cap})$.
  - $\text{hasOverflow} = \text{cap} !== \text{'all'} \ \&\& \ \text{directors.length} > \text{cap}$.
  - $h_{\text{base}} = 18\text{px (header)} + (\text{visibleCount} \times 20\text{px}) + (\text{hasOverflow} ? 18\text{px} : 0) + (\text{hasUBO} ? 22\text{px} : 0) + 16\text{px (padding)}$.
  - $H = \max\left(280, \ \max(y_{\text{top}} + h_{\text{top}} + h_{\text{mid}} + h_{\text{base}}, \ \frac{240}{R} + h_{\text{base}})\right)$.
  - $W = \text{round}(H \times R)$.

### Decision 3: Internal Geometric Tiers in `TrustTriangleCard`
- **Choice**: 3 proportional tiers:
  - **Tier 1 (Apex, $w \le 32\%$)**: 24px Landmark circle at $y \approx 26\text{px}$, followed by compact type pill `[TRUST ●]` (width $\approx 55\text{px}$).
  - **Tier 2 (Name & Metadata, $w \le 62\%$)**: Centered title, jurisdiction, and mono registration code.
  - **Tier 3 (Base, $w \le 85\%$)**: Directors header, director rows, overflow badge, and UBO pill.
- **Alternative Considered**: CSS `shape-outside`. Rejected because `shape-outside` does not constrain vertical flexbox children and fails during `html-to-image` rasterization.

### Decision 4: Two-Phase Export Lifecycle in Store
- **Choice**: `useStructureStore` tracks `isExportMode: boolean` and `directorCap: number | 'all'`. `ExportModal` sets `setExportMode(true)`, awaits rendering pass, captures vector/PNG, and in `finally` sets `setExportMode(false)`.
- **Rationale**: Guarantees that exported artifacts include all directors without internal scrollbars while avoiding permanent alteration of the user's canvas view.
- **Subsidiary Cards**: When `isExportMode` is active or director count exceeds 3, subsidiary cards expand height from $220\text{px}$ to $220 + (\text{directors.length} - 3) \times 22\text{px}$.

## Risks / Trade-offs

- **[Risk] Layout jump during export**:
  - *Mitigation*: The export routine already displays an `isExporting` modal overlay. The temporary expansion and capture complete within 150–250ms, appearing as normal export processing.
- **[Risk] Very long director names overflowing the base tier**:
  - *Mitigation*: Apply `truncate` with `title` attributes on individual director rows, and expand the base width to 85% of total card width.
- **[Risk] Backward compatibility of `getEntityDimensions`**:
  - *Mitigation*: Update `getEntityDimensions(type: EntityType, entity?: EntityNodeData, cap?: number | 'all')` so existing callers or unit tests passing only `type` receive safe default dimensions.

## Cognitive Complexity & Linear Execution Guard

All helper functions (`calculateTrustDimensions`, `calculateSubsidiaryDimensions`, `renderDirectorRows`) will be kept pure, modular, and flattened with guard clauses to ensure cognitive complexity remains strictly $< 15$ per AGENTS.md Rule 4. String operations will use native primitives (`length`, `slice`) with zero non-linear regex.
