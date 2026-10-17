## MODIFIED Requirements

### Requirement: Global Director Visibility Cap
Entities SHALL NOT render internal director rows inside the entity shapes. Instead, associated parties SHALL be displayed as external satellite cards outside the entity card, and any party truncation SHALL occur within satellite cards or be governed by satellite card display limits.

#### Scenario: Entity cards rendered without internal director rows
- **WHEN** an entity card (Trust triangle, Subsidiary square, or Bank circle) is rendered on canvas
- **THEN** it renders without internal director rows or embedded director overflow badges, displaying strictly entity governance data.

#### Scenario: Satellite role card overflow handling
- **WHEN** a satellite role card contains more individuals than the visible satellite threshold
- **THEN** the satellite card displays an overflow badge disclosing the remaining individuals.
