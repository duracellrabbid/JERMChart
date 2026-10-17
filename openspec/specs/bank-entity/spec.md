# bank-entity Specification

## Purpose
Allows fiduciary users to represent banking institutions, corporate depository accounts, and financing banks as circular nodes directly within the trust structure chart.

## Requirements

### Requirement: Bank Entity Type and Circular Visual Representation
The system SHALL support `'Bank'` as a valid `EntityType`. Bank entities SHALL be rendered on the canvas as circular shapes with dedicated banking metadata.

#### Scenario: Rendering a Bank node on canvas
- **WHEN** an entity with `type: 'Bank'` is present in the structure chart
- **THEN** it renders as a circular card displaying the bank name, branch/jurisdiction, registration or account reference, and status indicator.

#### Scenario: Connecting an entity to a Bank
- **WHEN** a relationship edge is created from an Operating or Holding Company to a Bank entity
- **THEN** the edge connects cleanly to the top or side handle of the Bank node and displays the relationship cleanly in the layout.

### Requirement: Layout Engine Integration for Bank Entities
The Dagre hierarchical layout engine SHALL compute appropriate circular bounds for Bank entities and position them consistently in the hierarchy.

#### Scenario: Auto-Tidy layout with Bank entities
- **WHEN** the user triggers Auto-Tidy on a structure containing Bank entities
- **THEN** the layout engine assigns circular dimensions (diameter ~180px) and positions the Bank entity at the appropriate subsidiary/account level below its parent.
