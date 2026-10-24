# shape-palette-dock Specification

## Purpose
Provides a floating horizontal shape palette dock directly above the structure canvas that enables trust officers to drag and drop or click-to-place entity shapes and personnel tokens directly into the chart.
## Requirements
### Requirement: Floating Horizontal Dock Presentation
The application SHALL render a floating horizontal shape dock centered near the top of the canvas viewport with high z-index visibility, subtle elevation shadow, and translucent backdrop styling without occluding chart header actions or sidebar panels.

#### Scenario: Dock rendered on canvas
- **WHEN** the canvas viewport is loaded in editable mode
- **THEN** the horizontal shape dock is visibly mounted at the top-center of the canvas presenting entity shapes and personnel tool options.

#### Scenario: Read-only mode hides dock
- **WHEN** the chart is set to read-only mode (`isReadOnly = true`) or export preview mode (`isExportMode = true`)
- **THEN** the floating shape dock is hidden from view.

### Requirement: Draggable Entity and Personnel Chips
The shape dock SHALL provide interactive draggable chips for standard fiduciary entity types (`Trust`, `Holding Company`, `Operating Company`, `LLC`, `Bank`) and personnel tokens (`Person / Fiduciary`). Each chip SHALL support HTML5 drag-and-drop data transfer as well as single-click placement.

#### Scenario: Dragging an entity shape onto the canvas
- **WHEN** a user drags the `Trust` chip from the dock and drops it onto coordinate $(X, Y)$ on the canvas
- **THEN** an entity node with type `'Trust'` and a unique identifier is created and positioned at $(X, Y)$ in the canvas coordinate space.

#### Scenario: Single-click placement from dock
- **WHEN** a user clicks the `Holding Company` chip in the dock
- **THEN** a new entity node with type `'Holding Company'` is created near the center of the current canvas viewport without requiring manual drag.

### Requirement: Draggable Personnel Token Staging
The shape dock SHALL provide a `Person` token representing unassigned directors, settlors, protectors, or beneficiaries. Dropping a `Person` token onto empty canvas space SHALL place an unlinked staged personnel token displaying a placeholder name (`"New Person"`).

#### Scenario: Dropping a person token onto empty canvas
- **WHEN** a user drags and drops a `Person` token onto an unoccupied area of the canvas
- **THEN** a staged personnel token is rendered at the drop coordinates with handles ready for role connection.

#### Scenario: Dropping a person token directly onto an entity card
- **WHEN** a user drops a `Person` token directly on top of an existing entity card
- **THEN** the connection quick-picker is immediately triggered targeting the hovered entity without creating a staged token.

