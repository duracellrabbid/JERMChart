# chart-director-cap Specification

## Purpose
Provides a configurable director visibility cap for structure charts to maintain a clean, readable canvas during live exploration while automatically expanding all directors without clipping during document exports.

## Requirements

### Requirement: Global Director Visibility Cap
The application state MUST maintain a configurable `directorCap` (default: 3; options: 2, 3, 4, 5, 'all') that limits the number of rendered director rows across both Trust triangles and Subsidiary cards on the live canvas.

#### Scenario: Entity with director count below cap
- **WHEN** an entity has 2 directors and `directorCap` is 3
- **THEN** both directors are rendered and no overflow indicator is shown.

#### Scenario: Entity with director count exceeding cap
- **WHEN** an entity has 6 directors and `directorCap` is 3
- **THEN** exactly the first 3 directors are rendered followed by an overflow indicator displaying `+3 more directors...`.

#### Scenario: Global cap changed via header control
- **WHEN** the user selects a new cap value in the `AppHeader` dropdown
- **THEN** the store updates `directorCap`, and the layout engine recalculates node dimensions and positions for all entities.

### Requirement: Interactive Overflow Badge
The overflow indicator badge MUST provide progressive disclosure of remaining director details on the live canvas.

#### Scenario: Hovering over the overflow indicator
- **WHEN** the user hovers over the `+N more directors...` badge
- **THEN** a tooltip popover appears listing the names and fiduciary tags (Resident/Corporate) of the remaining hidden directors.

#### Scenario: Clicking the overflow indicator
- **WHEN** the user clicks the `+N more directors...` badge
- **THEN** the entity node is selected and the application focuses the Directors Directory or Entity Details tab in the right sidebar.

### Requirement: Uncapped Full Document Export
When generating visual exports (PNG, SVG, PDF, PowerPoint), the system MUST temporarily lift the director cap to render 100% of recorded directors for all entities without internal scrollbars.

#### Scenario: Triggering document export
- **WHEN** any visual export action is triggered in `ExportModal`
- **THEN** `isExportMode` is set to `true`, the layout engine recomputes node dimensions with `directorCap = 'all'`, Dagre repoisitions all nodes to prevent collision, and the canvas captures the fully expanded chart.

#### Scenario: Export completion or error
- **WHEN** the export generation finishes or encounters an error
- **THEN** `isExportMode` is set to `false`, immediately restoring the live canvas to the user's configured `directorCap`.
