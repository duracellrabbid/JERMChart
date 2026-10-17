# structure-chart-integrity Specification

## Purpose
Provides data integrity safeguards across Excel import parsing, canvas connection creation, and hierarchical layout graph computation.
## Requirements
### Requirement: Excel Import Multi-Share Class Edge Disambiguation
The Excel import parser SHALL generate unique relationship IDs for all ownership holdings, even when an entity is owned by the same parent across multiple share classes or holding percentages.

#### Scenario: Multiple holdings between identical parent and subsidiary
- **WHEN** an Excel workbook contains multiple rows linking the same parent entity to the same subsidiary with different share classes (e.g. Ordinary Shares vs. Preference Shares)
- **THEN** each relationship in the resulting chart SHALL receive a unique relationship ID disambiguated by index or unique identifier, and all relationships SHALL be rendered without key collisions or dropped edges.

### Requirement: Canvas Connection Entity Validation
The canvas `onConnect` handler SHALL validate that both the connection source and target correspond to valid entities in the store, and SHALL ignore connections initiated from or targeted at satellite role nodes.

#### Scenario: User connects an entity to a satellite handle
- **WHEN** a user drags a connection between an entity handle and a satellite role pill handle (ID prefixed with `sat-`)
- **THEN** no relationship SHALL be added to the store, and the chart state SHALL remain unmodified.

### Requirement: Layout Graph Sanitization
The hierarchical layout engine SHALL filter out orphan relationships whose source or target entity ID does not exist in the active entity list before constructing the Dagre graph.

#### Scenario: Stale relationship references deleted entity
- **WHEN** `calculateSortedLayout` is invoked with a relationship referencing an entity ID that is not present in the `entities` array
- **THEN** the layout engine SHALL not create unmeasured ghost nodes in the Dagre graph, and SHALL omit the orphan edge from the returned layout edges.

