# Specification: Association Line Style Toggle

## Context
By default, association lines between organizations and associated party cards are rendered with dashed/dotted lines. Users need an explicit control to toggle between dotted and solid lines.

## Requirements

### REQ-LINE-001: Store State
1. `StructureState` MUST include a property `associationLineStyle` with values `'dotted' | 'solid'`.
2. The initial default value MUST be `'dotted'`.
3. `StructureState` MUST expose an action `setAssociationLineStyle: (style: 'dotted' | 'solid') => void`.

### REQ-LINE-002: App Header Control
1. A control button MUST be present in `AppHeader` toolbar allowing the user to toggle `associationLineStyle`.
2. The button MUST visually indicate the current state (`Dotted` or `Solid`).
3. Clicking the button MUST switch between `'dotted'` and `'solid'` and trigger instant canvas re-render.

### REQ-LINE-003: Edge Rendering
1. `OwnershipEdge` for association edges (`data?.isAssociationEdge === true`):
   - MUST render with `strokeDasharray: '4,4'` when `associationLineStyle === 'dotted'`.
   - MUST render without `strokeDasharray` (solid stroke) when `associationLineStyle === 'solid'`.
2. Ownership edges (`isAssociationEdge !== true`) MUST NOT be affected and MUST continue rendering with their default solid stroke.
