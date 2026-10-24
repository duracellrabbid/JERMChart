## Purpose

Provides an interactive contextual popover upon creating shape connections on the canvas to configure ownership percentages, share classes, or fiduciary governance roles before persisting relationships.

## ADDED Requirements

### Requirement: Contextual Quick-Picker Popover on Edge Release
When a user draws a connection line between two shapes and releases the mouse cursor, the application SHALL display a modal or popover at the connection release point instead of silently committing a default relationship.

#### Scenario: Connecting two corporate entities
- **WHEN** a user draws a wire from entity $A$ to entity $B$ and completes the connection
- **THEN** the quick-picker popover opens displaying ownership percentage presets (100%, 50%, custom input), share class selection, and connection type options.

#### Scenario: Connecting a personnel token to an entity
- **WHEN** a user draws a wire from a staged `Person` token to an entity card
- **THEN** the quick-picker popover opens displaying fiduciary role selections (`Director`, `Settlor`, `Protector`, `Enforcer`, `Beneficiary/UBO`) and status checkboxes (`Resident (RES)`, `Corporate Nominee`).

### Requirement: Ownership Connection Confirmation
Upon confirming an Entity $\rightarrow$ Entity connection in the quick-picker, the application SHALL create an `OwnershipEdgeData` record with the configured percentage and share class, register an undo snapshot, and update the graph.

#### Scenario: Confirming 100% Ordinary Shares subsidiary link
- **WHEN** the user selects 100% Ordinary Shares and clicks `"Establish Link"` in the quick-picker
- **THEN** a directed ownership edge is registered between parent and child, and the quick-picker dismisses.

#### Scenario: Cancelling connection creation
- **WHEN** the user clicks `"Cancel"` or presses the Escape key inside the quick-picker
- **THEN** the pending connection is discarded with zero mutation to existing entities or edges.

### Requirement: Multi-Parent and Cycle Prevention Guard
The quick-picker and connection handler SHALL validate that establishing a connection does not introduce an invalid self-loop ($A \rightarrow A$) or circular ownership cycle ($A \rightarrow B \rightarrow A$) prior to committing.

#### Scenario: Attempting a circular ownership connection
- **WHEN** a user connects an existing subsidiary back to its ultimate parent entity
- **THEN** the system rejects the connection, closes the popover, and displays a non-destructive warning toast indicating cyclical ownership is prohibited.
