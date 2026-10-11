# Specification: Auto-Tidy Smart Flank Allocation & Overlap Prevention

## Context
When multiple organizations are situated on the same rank, their associated person satellite cards can collide with sibling entity cards or each other if space is not reserved or if flanks are assigned symmetrically without rank awareness.

## Requirements

### REQ-LAYOUT-001: Rank-Aware Smart Flank Allocation
1. When tidying a diagram with associated party satellite cards:
   - For an entity that is the leftmost node in its rank, its satellite cards MUST prioritize placement on the **left** flank.
   - For an entity that is the rightmost node in its rank, its satellite cards MUST prioritize placement on the **right** flank.
   - For an isolated entity or single entity in a rank, satellite cards SHOULD be distributed evenly across left and right flanks.
   - For intermediate/inner siblings, satellite allocation MUST maintain separation from neighboring entities.

### REQ-LAYOUT-002: Compound Bounding Box Allocation
1. The layout engine MUST compute an effective compound bounding box $(W_{\text{eff}}, H_{\text{eff}})$ for each entity:
   - $W_{\text{eff}} = W_{\text{core}} + (\text{leftSatellites} > 0 \,?\, 180 : 0) + (\text{rightSatellites} > 0 \,?\, 180 : 0)$
   - $H_{\text{eff}} = \max(H_{\text{core}}, \text{satelliteCount}_{\text{left}} \times 60, \text{satelliteCount}_{\text{right}} \times 60)$
2. Dagre graph nodes MUST be registered using $(W_{\text{eff}}, H_{\text{eff}})$ instead of bare core dimensions.
3. Post-Dagre unpacking MUST position the core entity and satellites within their designated compound bounding box slots, guaranteeing zero overlap between any sibling entities and satellite cards.

### REQ-LAYOUT-003: Cognitive Complexity Limit
1. All functions and helpers in `layoutEngine.ts` MUST maintain a SonarSource cognitive complexity score strictly below 15.
