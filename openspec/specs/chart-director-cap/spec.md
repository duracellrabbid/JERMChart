# chart-director-cap Specification

## Purpose
Provides a configurable director visibility cap for structure charts to maintain a clean, readable canvas during live exploration while automatically expanding all directors without clipping during document exports.

## Requirements

### Requirement: Global Director Visibility Cap
Entities SHALL NOT render internal director rows inside the entity shapes. Instead, associated parties SHALL be displayed as external satellite cards outside the entity card, and any party truncation SHALL occur within satellite cards or be governed by satellite card display limits.

#### Scenario: Entity cards rendered without internal director rows
- **WHEN** an entity card (Trust triangle, Subsidiary square, or Bank circle) is rendered on canvas
- **THEN** it renders without internal director rows or embedded director overflow badges, displaying strictly entity governance data.

#### Scenario: Satellite role card overflow handling
- **WHEN** a satellite role card contains more individuals than the visible satellite threshold
- **THEN** the satellite card displays an overflow badge disclosing the remaining individuals.

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
