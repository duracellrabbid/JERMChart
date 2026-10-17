# line-style-toggle Specification

## Purpose
Provides an explicit canvas and toolbar control allowing users to switch association connector lines between dashed/dotted and solid styling without affecting hierarchical ownership edges.

## Requirements

### Requirement: Store State for Association Line Style
`StructureState` MUST maintain a configurable `associationLineStyle` state property and expose an action to toggle or update it.

#### Scenario: Default association line style
- **WHEN** the application initializes or state is reset
- **THEN** `associationLineStyle` defaults to `'dotted'`.

#### Scenario: Updating association line style
- **WHEN** `setAssociationLineStyle` is called with `'solid'` or `'dotted'`
- **THEN** `StructureState` updates `associationLineStyle` accordingly and triggers reactive subscribers.

### Requirement: App Header Toolbar Control
A toggle control button MUST be present in the `AppHeader` toolbar allowing users to switch between dotted and solid association lines with real-time visual feedback.

#### Scenario: Visual indicator of current line style
- **WHEN** the toolbar renders
- **THEN** the button displays the current mode (Dotted or Solid) with an appropriate icon or label.

#### Scenario: User toggles line style
- **WHEN** the user clicks the association line style button
- **THEN** `setAssociationLineStyle` is dispatched, alternating between `'dotted'` and `'solid'`, and canvas edges re-render immediately.

### Requirement: Association Edge Rendering
`OwnershipEdge` MUST respect `associationLineStyle` specifically for association edges while strictly preserving solid rendering for ownership edges.

#### Scenario: Dotted association edge rendering
- **WHEN** an edge has `data.isAssociationEdge === true` and `associationLineStyle === 'dotted'`
- **THEN** the edge path renders with `strokeDasharray: '4,4'`.

#### Scenario: Solid association edge rendering
- **WHEN** an edge has `data.isAssociationEdge === true` and `associationLineStyle === 'solid'`
- **THEN** the edge path renders without `strokeDasharray` (solid stroke).

#### Scenario: Standard ownership edges unaffected
- **WHEN** an edge has `data.isAssociationEdge !== true`
- **THEN** the edge renders with its default solid line style regardless of `associationLineStyle`.
