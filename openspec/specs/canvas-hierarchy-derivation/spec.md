# canvas-hierarchy-derivation Specification

## Purpose
Automatically derives hierarchical tree outliner structures, details view lineage ordering, and satellite personnel formatting from visual shape connections and dock-and-absorb events.
## Requirements
### Requirement: Real-Time Tree Outliner Hierarchy Derivation
When an ownership connection is established or modified between entities on canvas, the Tree Outline tab in the sidebar SHALL immediately re-index and nest the child entity under the parent entity with its configured ownership badge.

#### Scenario: Wiring an independent entity into a parent
- **WHEN** an unlinked entity $B$ receives a directed ownership edge from entity $A$
- **THEN** entity $B$ moves from root/draft status and is rendered nested beneath entity $A$ in the Tree Outliner.

#### Scenario: Deleting an ownership edge
- **WHEN** an ownership connection between entity $A$ and entity $B$ is removed
- **THEN** entity $B$ is automatically promoted back to a top-level root or staging item in the Tree Outliner.

### Requirement: Lineage Sorting in Entity Details Inspector
The Entity Details tab and entity selectors SHALL order entities based on topological lineage: fiduciary roots (Trusts/Settlors) at the top, intermediate holding companies in the middle, operating subsidiaries at the bottom, and unlinked draft nodes in a designated staging section.

#### Scenario: Viewing entities in details selector
- **WHEN** the user inspects the entity selection dropdown or list in the sidebar
- **THEN** entities appear grouped and ordered from top-level parents down to leaf subsidiaries rather than by random creation timestamp.

### Requirement: Dock-and-Absorb Personnel Role Assimilation
When a staged personnel token is assigned to an entity via connection or direct drop, the individual SHALL be absorbed into that entity's `associatedParties` collection, auto-formatted into the appropriate satellite card on the entity's flank, and removed from temporary canvas staging.

#### Scenario: Assigning a staged director to an operating company
- **WHEN** a staged person named `"Eleanor Vance"` is assigned the `'Director'` role on `"Apex OpCo"`
- **THEN** `"Eleanor Vance"` is appended to `"Apex OpCo"`'s `associatedParties`, rendered in the right-side Directors satellite card, and the temporary staged token is deleted from canvas memory.

#### Scenario: Cross-structure spotlight reflection
- **WHEN** an absorbed director matches an entry in the Directors Directory
- **THEN** clicking that director in the directory activates the cross-structure spotlight mode highlighting every entity where that individual holds office.

