# smart-flank-layout Specification

## Purpose
Provides rank-aware smart flank positioning and compound bounding box layout calculations for associated party satellite cards, eliminating visual overlap between sibling entities and satellite nodes.

## Requirements

### Requirement: Rank-Aware Smart Flank Allocation
The layout engine MUST determine the lateral flank assignment (left vs. right) of associated party satellite cards based on the host entity's relative position within its Dagre rank.

#### Scenario: Leftmost entity in rank
- **WHEN** an entity is positioned at the leftmost edge of its rank tier
- **THEN** its associated party satellite cards prioritize placement on the left flank.

#### Scenario: Rightmost entity in rank
- **WHEN** an entity is positioned at the rightmost edge of its rank tier
- **THEN** its associated party satellite cards prioritize placement on the right flank.

#### Scenario: Isolated or single entity in rank
- **WHEN** an entity has no immediate horizontal rank siblings
- **THEN** its satellite cards are balanced symmetrically across both left and right flanks.

#### Scenario: Inner or intermediate sibling entities
- **WHEN** an entity is flanked by sibling entities on both sides
- **THEN** satellite card flank assignment is partitioned to prevent collision with neighboring entities.

### Requirement: Compound Bounding Box Dagre Registration
The layout engine MUST compute effective compound dimensions for each entity including its lateral satellite wings prior to Dagre graph execution.

#### Scenario: Effective width calculation with satellites
- **WHEN** an entity node has satellites assigned to left or right flanks
- **THEN** effective width $W_{\text{eff}} = W_{\text{core}} + (\text{hasLeftSatellites} \,?\, 180 : 0) + (\text{hasRightSatellites} \,?\, 180 : 0)$.

#### Scenario: Effective height calculation with satellites
- **WHEN** an entity node has satellites assigned to left or right flanks
- **THEN** effective height $H_{\text{eff}} = \max(H_{\text{core}}, \text{count}_{\text{left}} \times 60, \text{count}_{\text{right}} \times 60)$.

#### Scenario: Post-Dagre coordinate unpacking
- **WHEN** Dagre finishes layout computation using compound bounding boxes
- **THEN** core entity and satellite coordinates are unpacked into their designated slots, ensuring zero overlap across all nodes.

### Requirement: Cognitive Complexity Constraint
All layout calculation and unpacking helper functions in `layoutEngine.ts` MUST maintain a SonarSource cognitive complexity score strictly below 15.

#### Scenario: Complexity lint verification
- **WHEN** `npm run lint` is executed
- **THEN** zero cognitive complexity errors are reported for layout calculation functions.
