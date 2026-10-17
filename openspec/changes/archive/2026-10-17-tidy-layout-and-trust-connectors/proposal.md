# Change: Tidy Layout, Trust Triangle Connectors, and Association Line Toggle

## Why
Following the implementation of Bank entities and external associated party cards (`bank-entities-and-associated-parties`), three specific presentation and layout issues were identified in production usage:
1. **Trust Triangle Connector Gap**: In `TrustTriangleCard`, connector lines from associated party satellite cards anchor to the card's rectangular bounding box (`left: 0` / `right: 0`), leaving an empty ~78px visual gap from the line of the sloped triangle. Connectors must touch the actual stroke of the triangle.
2. **Association Line Style Toggle**: Connector lines between organizations and associated party cards are currently hardcoded as dotted lines (`strokeDasharray: '4,4'`). Users require the ability to toggle between dotted lines and solid lines directly from the App Header toolbar.
3. **Auto-Tidy Layout Overlapping**: When multiple organizations sit on the same hierarchical level, associated person satellite cards overlap each other and adjacent entity cards. The layout engine needs smart flank distribution (outer entities allocate to outer flanks) paired with compound bounding box sizing in Dagre so all entities and their satellite cards are tidied without collisions across any hierarchy depth or sibling count.

## What Changes
- **Trust Boundary Handles**: Calculate exact geometrical intersection points along the triangle's sloped edges ($X_{\text{left}}(Y)$ and $X_{\text{right}}(Y)$) and position `left-in` and `right-in` handles directly on the triangle stroke in `TrustTriangleCard`.
- **Association Line Style Setting**:
  - Add `associationLineStyle: 'dotted' | 'solid'` property to `StructureStore`.
  - Add an intuitive toggle button in `AppHeader` (next to Tidy Layout) switching between Dotted and Solid connector styles.
  - Update `OwnershipEdge` to conditionally apply or omit `strokeDasharray` based on `associationLineStyle`.
  - Persist `associationLineStyle` in diagram state / export.
- **Auto-Tidy Smart Flank Allocation & Compound Dagre Sizing**:
  - Detect rank siblings in `layoutEngine.ts`.
  - Assign flanks smartly (leftmost entity prefers left flank; rightmost entity prefers right flank; single/isolated balances both).
  - Compute compound bounding box dimensions $(W_{\text{eff}}, H_{\text{eff}})$ per entity including allocated satellite flanks and vertical stack height.
  - Pass compound dimensions to Dagre, then offset core entity and satellite cards into their allocated bounding box slots, guaranteeing zero overlap across all scenarios.

## Impact & Scope
- **Components Modified**:
  - `src/components/nodes/TrustTriangleCard.tsx` / `src/components/nodes/EntityCardNode.tsx`
  - `src/components/edges/OwnershipEdge.tsx`
  - `src/components/layout/AppHeader.tsx`
  - `src/store/useStructureStore.ts`
  - `src/types/structure.ts`
  - `src/utils/layoutEngine.ts`
- **Tests**:
  - Unit tests for trust handle boundary geometry.
  - Unit and integration tests for `associationLineStyle` store state, header toggle, and edge rendering.
  - Comprehensive layout tests for sibling rank collision avoidance, compound bounding boxes, and multi-entity tiers.
  - Maintain 100% test coverage across all metrics.
