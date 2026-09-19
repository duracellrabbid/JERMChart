# Design Document: Triangular Trust Nodes, Square Subsidiary Nodes, and PowerPoint Export

**Date:** 2026-09-20  
**Status:** Approved  
**Repository:** `trust-management-utility`

---

## 1. Executive Summary

This feature updates the Trust Management Utility to meet corporate and fiduciary charting conventions:
1. **Triangular Shape for Trust Companies / Trusts**: Entities of type `'Trust'` (and optionally `'Trust Company'`) are visually styled as triangles (apex pointing upward), conforming to standard fiduciary structure chart conventions.
2. **Square Shape for Subsidiaries**: All corporate subsidiary entities (Holding Company, Operating Company, LLC, Foundation, Partnership, Individual) are styled as 220px $\times$ 220px square cards rather than elongated rectangles.
3. **PowerPoint (.pptx) Export**: Users can export the complete structure chart directly to Microsoft PowerPoint presentation format (.pptx, 16:9 widescreen) with high-fidelity canvas capture, metadata header, and confidentiality footer.

---

## 2. Requirements & Scope

### Functional Requirements
- **FR-1**: Render 'Trust' and 'Trust Company' entities with an upward-pointing triangular silhouette (260px width $\times$ 220px height) with top inflow handle and bottom outflow handle.
- **FR-2**: Render all other entities (subsidiaries) as 220px $\times$ 220px square cards with compact headers, clean director listings, and UBO indicator.
- **FR-3**: Update Dagre layout engine calculations (`layoutEngine.ts`) to calculate bounding boxes per entity type (260 $\times$ 220 for triangular trusts, 220 $\times$ 220 for square subsidiaries) to ensure balanced graph spacing and avoid node overlaps.
- **FR-4**: Add `exportToPptx` in `exportService.ts` utilizing `pptxgenjs` to generate professional 16:9 widescreen PowerPoint slides.
- **FR-5**: Add PowerPoint export option in `ExportModal.tsx` with download trigger and user feedback notification.
- **FR-6**: Support 'Trust Company' as an explicit entity type in `types/structure.ts` and entity selector forms.

### Non-Functional Requirements & Constraints
- **NFR-1**: Cognitive complexity of every new or modified function must be strictly `< 15`.
- **NFR-2**: All regex expressions must be linear-time and ReDoS-free.
- **NFR-3**: All tests must reside in `src/__tests__/` and be excluded from production builds.
- **NFR-4**: Maintain 100% test pass rate across the existing 130 tests and new test cases.

---

## 3. Architecture & Detailed Design

### 3.1 Data Model & Types (`src/types/structure.ts`)
Add `'Trust Company'` to `EntityType`:
```typescript
export type EntityType = 
  | 'Trust' 
  | 'Trust Company'
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual';
```

### 3.2 Layout Engine Updates (`src/utils/layoutEngine.ts`)
Define dimension constants:
- `TRUST_CARD_WIDTH = 260`
- `TRUST_CARD_HEIGHT = 220`
- `SUBSIDIARY_CARD_SIZE = 220`

Helper function:
```typescript
export function getEntityDimensions(type: EntityType): { width: number; height: number } {
  if (type === 'Trust' || type === 'Trust Company') {
    return { width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT };
  }
  return { width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE };
}
```
Update `calculateSortedLayout` to use `getEntityDimensions(entity.type)` when setting Dagre node dimensions and React Flow node position offsets.

### 3.3 Node Components (`src/components/nodes/EntityCardNode.tsx`)
Decompose the card rendering into shape-specific presentations:
- **TrustTriangleNode**: Renders an SVG-backed triangle with apex-up styling, top handle at $(50\%, 0)$, bottom handle at $(50\%, 100\%)$, centered content container accommodating Trust badge, title, jurisdiction, and trustee/settlor.
- **SubsidiarySquareNode**: 220px $\times$ 220px square card container (`w-[220px] h-[220px]`) with flex column layout:
  - Header: Entity type badge + status indicator dot.
  - Body: Entity name (truncated/wrapped), jurisdiction, registration number.
  - Directors: Compact scrollable container displaying director badges.
  - Footer: UBO or Settlor note if present.
- **EntityCardNode**: Dispatches to the appropriate subcomponent based on whether `entity.type === 'Trust' || entity.type === 'Trust Company'`.

### 3.4 PowerPoint Export Service (`src/utils/exportService.ts`)
Install `pptxgenjs` and implement:
```typescript
export async function exportToPptx(
  elementId: string,
  metadata: ChartMetadata
): Promise<void>
```
Workflow:
1. Capture target element via `html-to-image` `toPng` (pixel ratio 2.5, white background).
2. Instantiate `PptxGenJS` with layout `LAYOUT_16x9` (10 inches $\times$ 5.625 inches).
3. Add slide:
   - Header text: `metadata.chartTitle` (font size 16pt, bold slate-900).
   - Metadata subtext: Matter Ref + Effective Date (font size 9pt, slate-500).
   - Separator line.
   - Embed captured PNG chart scaled proportionally to fit slide bounds.
   - Footer text: Confidentiality notice (font size 8pt, center aligned).
4. Save presentation: `${safeTitle}_Structure.pptx`.

### 3.5 UI Modal Updates (`src/components/export/ExportModal.tsx`)
Add PowerPoint export card:
- Icon: Presentation / FileText (Lucide React).
- Title: "PowerPoint Presentation (.pptx)".
- Description: "Widescreen 16:9 slide with corporate branding & high-res chart".
- Trigger: `handleExportPptx`.

---

## 4. Testing & Verification Strategy

1. **Unit Tests**:
   - `src/__tests__/utils/layoutEngine.test.ts`: Verify `getEntityDimensions` returns $260 \times 220$ for Trusts and $220 \times 220$ for subsidiaries.
   - `src/__tests__/utils/exportService.test.ts`: Mock `pptxgenjs` and verify `exportToPptx` creates presentation with slide, text, image, and saves file.
2. **Component Tests**:
   - `src/__tests__/components/nodes/EntityCardNode.test.tsx`: Test rendering of both triangular trust cards and square subsidiary cards.
   - `src/__tests__/components/export/ExportModal.test.tsx`: Test PowerPoint export button renders and triggers `exportToPptx`.
3. **Regression Tests**:
   - Run complete suite: `rtk npm test`.
   - Run typecheck and bundle: `rtk npm run build`.

---

## 5. Spec Self-Review
- **Placeholders**: No TODOs or TBDs.
- **Consistency**: Dimensions across layoutEngine and EntityCardNode align at 260x220 for triangles and 220x220 for squares.
- **Scope**: Focused precisely on triangular trusts, square subsidiaries, and PPTX export.
- **Ambiguity**: Entity types mapped explicitly.
