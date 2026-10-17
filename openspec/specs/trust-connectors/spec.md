# trust-connectors Specification

## Purpose
Provides geometrical boundary connection handle positioning for triangular Trust entity cards, ensuring association lines terminate flush against the sloped triangular border with zero perceptible gap.

## Requirements

### Requirement: Geometrical Boundary Handles on Trust Cards
Connection handles on `TrustTriangleCard` nodes MUST be placed directly on the angled borders of the triangular polygon rather than at the rectangular boundary box.

#### Scenario: Left-in handle placement on trust triangle
- **WHEN** a `trust` or `TrustTriangleCard` renders its `left-in` connection handle
- **THEN** the handle is positioned at coordinates $(78\text{px}, 90\text{px})$ relative to the top-left corner of the card container.

#### Scenario: Right-in handle placement on trust triangle
- **WHEN** a `trust` or `TrustTriangleCard` renders its `right-in` connection handle
- **THEN** the handle is positioned at coordinates $(222\text{px}, 90\text{px})$ relative to the top-left corner of the card container.

#### Scenario: Association edge termination on trust card
- **WHEN** an association edge connects to a trust card's `left-in` or `right-in` handle
- **THEN** the connector line terminates exactly on the sloped border without visual gap or overshoot.

### Requirement: Preservation of Rectangular and Circular Card Handles
Standard rectangular cards (Company, Subsidiary, SPV, Foundation) and circular Bank cards MUST preserve their standard perimeter handle positions.

#### Scenario: Non-trust card handle positioning
- **WHEN** handles are rendered for any non-trust entity type
- **THEN** standard perimeter boundary coordinates are preserved unchanged.
