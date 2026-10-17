# Design: Tidy Layout, Trust Triangle Connectors, and Association Line Toggle

## 1. Trust Triangle Exact Boundary Geometry

### Problem
`TrustTriangleCard` is enclosed in a rectangular container of width $W = 300\text{px}$ and height $H = 180\text{px}$. The SVG triangle path is defined with vertices:
- Apex: $(W/2, 6) = (150, 6)$
- Bottom-Left: $(6, H - 6) = (6, 174)$
- Bottom-Right: $(W - 6, H - 6) = (294, 174)$

Default handles placed at `left: 0` and `right: 0` ($y = 50\% = 90\text{px}$) create a visual gap of $150 - 6 - \frac{84}{168} \times 144 = 72\text{px}$ from the rectangular edge to the triangle line.

### Solution
For any connection handle at vertical position $Y \in [6, 174]$:
$$X_{\text{left}}(Y) = 150 - \frac{Y - 6}{168} \times 144$$
$$X_{\text{right}}(Y) = 150 + \frac{Y - 6}{168} \times 144$$

At vertical midpoint $Y = 90\text{px}$:
- $X_{\text{left}}(90) = 78\text{px}$
- $X_{\text{right}}(90) = 222\text{px}$

`TrustTriangleCard` or `EntityCardNode` will position `left-in` at `left: 78px; top: 90px;` and `right-in` at `left: 222px; top: 90px;` (or `right: 78px; top: 90px;`). This guarantees that edges landing on `left-in` and `right-in` terminate on the rendered SVG triangle border.

---

## 2. Association Line Style Toggle

### State & Store
- In `StructureState` (`src/types/structure.ts`), introduce:
  ```ts
  associationLineStyle: 'dotted' | 'solid';
  setAssociationLineStyle: (style: 'dotted' | 'solid') => void;
  ```
- Default value in `useStructureStore.ts`: `'dotted'`.

### UI Component (`AppHeader.tsx`)
- Add a toggle button in the header toolbar near the layout controls.
- Displays current state (e.g. `Connector: Dotted` vs `Connector: Solid` or dashed vs solid line icon).
- Clicking cycles between `'dotted'` and `'solid'`.

### Edge Rendering (`OwnershipEdge.tsx`)
- For edges where `data?.isAssociationEdge` is true:
  - Read `associationLineStyle` from store (or edge data).
  - When `associationLineStyle === 'dotted'`: apply `strokeDasharray: '4,4'`.
  - When `associationLineStyle === 'solid'`: omit `strokeDasharray` (renders solid stroke).

---

## 3. Auto-Tidy Smart Flank Allocation & Compound Dagre Sizing

### Architecture
To prevent overlapping under all hierarchy depths and sibling counts:

```
[Level Tier Detection]
        │
        ▼
[Smart Flank Assignment]
   - Leftmost in rank: Left flank
   - Rightmost in rank: Right flank
   - Middle / Single: Distributed / Symmetrical
        │
        ▼
[Compound Bounding Box Calculation]
   - W_eff = W_core + (leftCount > 0 ? 180 : 0) + (rightCount > 0 ? 180 : 0)
   - H_eff = max(H_core, leftCount * 60, rightCount * 60)
        │
        ▼
[Dagre Layout Execution]
   - Dagre positions compound boxes with guaranteed separation (nodesep >= 50)
        │
        ▼
[Coordinate Unpacking & Positioning]
   - Place core entity at X_compound + W_left_sat
   - Place left satellites at X_compound
   - Place right satellites at X_compound + W_left_sat + W_core + 20
   - Center satellites vertically relative to entity
```

### Cognitive Complexity Budget
- Separate logic into dedicated pure utility functions:
  - `computeFlankAllocations(entities, ranks)`
  - `calculateCompoundDimensions(entity, flanks)`
  - `unpackCompoundPositions(compoundPositions, flanks)`
- Each helper kept strictly below 15 cognitive complexity.
