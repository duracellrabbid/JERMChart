# associated-parties Specification

## Purpose
Replaces the restrictive directors-only model with generalized associated parties representing diverse fiduciary roles (Enforcers, Directors, Settlors, Protectors, Asset Contributors, Authorised Signatories, Fund Managers), presented as external hybrid satellite cards placed beside the entity.

## Requirements

### Requirement: Generalized Associated Parties Data Model
Entities SHALL store associated parties via `associatedParties: AssociatedParty[]`, where each party defines `id`, `name`, `role`, and optional fiduciary flags (`isCorporate`, `isResident`, `appointmentDate`). Internal director arrays are discontinued.

#### Scenario: Adding an associated party with a specialized role
- **WHEN** a user assigns a party with role `'Enforcer'` or `'Protector'` to an entity
- **THEN** the party is saved in `associatedParties` and displayed with its associated role.

### Requirement: External Hybrid Satellite Cards Presentation
Associated parties SHALL NOT be rendered inside the entity shapes. Instead, they SHALL be rendered as external satellite cards beside the organization. If multiple parties share a role, they SHALL be grouped into a single role card; otherwise, single parties SHALL render as dedicated individual cards.

#### Scenario: Entity with multiple directors and one protector
- **WHEN** an entity has two associated parties with role `'Director'` and one with role `'Protector'`
- **THEN** the canvas renders a grouped `'Directors'` satellite card listing both director names, and a single `'Protector'` satellite card.

### Requirement: Equal Left and Right Distribution in Auto-Tidy Layout
During Auto-Tidy layout calculation, the layout engine SHALL automatically distribute an entity's satellite cards equally across its Left and Right sides ($\lceil N/2 \rceil$ on the Left, $\lfloor N/2 \rfloor$ on the Right) and connect each satellite card to the entity with a directed association edge.

#### Scenario: Auto-Tidy distributing 3 satellite cards
- **WHEN** an entity has 3 satellite cards (e.g., Enforcers, Settlor, Protector)
- **THEN** 2 cards are positioned to the Left of the entity and 1 card is positioned to the Right of the entity, vertically aligned and linked with directional arrows into the entity handles.
