# content-aware-trust-shape Specification

## Purpose
Provides predictive geometric sizing and tiered internal layout for triangular Trust entity cards, guaranteeing that entity text, jurisdiction details, and director rosters remain strictly contained within the visual SVG polygon boundary.

## Requirements

### Requirement: Predictive Geometric Triangle Sizing
The layout engine MUST deterministically compute Trust triangle width and height before executing Dagre layout positioning, maintaining an aspect ratio $R \approx 1.25$ with minimum dimensions of $340 \times 280\text{px}$.

#### Scenario: Short Trust name with minimal directors
- **WHEN** an entity has type `Trust` or `Trust Company`, a short name ($\le 20$ characters), $\le 1$ director, and no beneficiaries
- **THEN** `getEntityDimensions` returns the base dimensions of width 350px and height 280px.

#### Scenario: Long Trust name wrapping across multiple lines
- **WHEN** an entity has type `Trust` or `Trust Company` and a name exceeding 40 characters
- **THEN** the required height expands to accommodate 3 lines of title text plus jurisdiction and registration number, with width expanding proportionally by $1.25 \times \text{height}$.

#### Scenario: Trust with multiple directors and beneficiaries
- **WHEN** an entity has type `Trust` or `Trust Company` with 3 visible directors and beneficiaries
- **THEN** the base tier height expands to fit each director row and the beneficiary badge, and the overall triangle dimensions expand such that the base width provides at least 240px clearance.

### Requirement: Restructured Apex and Proportional Tiers
The internal DOM structure of `TrustTriangleCard` MUST organize content into three vertically stacked, geometrically bounded clearance tiers.

#### Scenario: Apex tier containment
- **WHEN** the Trust card renders its top section
- **THEN** the Landmark icon (24x24px) renders at the apex with the compact type and status pill stacked vertically below it, with a maximum tier width not exceeding 35% of the total card width.

#### Scenario: Middle name tier containment
- **WHEN** the Trust card renders its entity name, jurisdiction, and registration details
- **THEN** the text container is bounded to a maximum width not exceeding 65% of total card width, positioned with sufficient top clearance to prevent diagonal clipping.

#### Scenario: Base tier directors and beneficiaries
- **WHEN** the Trust card renders its directors list and UBO/beneficiaries
- **THEN** the container is bounded to a maximum width of 85% of total card width near the bottom base of the triangle.

### Requirement: Dynamic SVG Polygon Scaling
The SVG background element of `TrustTriangleCard` MUST compute its polygon points dynamically from the node's computed width and height.

#### Scenario: Custom calculated node dimensions
- **WHEN** `TrustTriangleCard` receives `computedWidth` and `computedHeight`
- **THEN** the SVG polygon renders points at `${computedWidth / 2},6 ${computedWidth - 8},${computedHeight - 6} 8,${computedHeight - 6}` with preserveAspectRatio and full container viewBox.
