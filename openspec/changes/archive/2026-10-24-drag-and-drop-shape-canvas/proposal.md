# Proposal: Drag-and-Drop Shape Palette & Interactive Canvas Connections

## Why
Currently, fiduciary officers and trust administrators must build structure charts by navigating nested form inputs and sidebar tree buttons before seeing results on the canvas. Introducing a floating drag-and-drop shape palette with interactive connection quick-pickers transforms JERMChart into an intuitive, canvas-first diagramming tool where ownership hierarchies and fiduciary details are automatically derived from visual connections.

## What Changes
- **Floating Horizontal Shape Dock**: A floating dock centered above the canvas providing quick access to draggable entity shapes (Trust triangle, Corporate cards, Bank circle) and personnel tokens (Directors, Settlors, Protectors). Supports both drag-and-drop to canvas coordinates and single-click viewport centering.
- **Interactive Connection Quick-Picker**: A contextual popover that appears upon drawing a connection between shapes on canvas:
  - When connecting Entity $\rightarrow$ Entity: Configures ownership percentage (presets: 100%, 50%, custom), share class, and direct vs. cross-link designation.
  - When connecting Person $\rightarrow$ Entity: Configures fiduciary role (Director, Settlor, Protector, Enforcer, Beneficiary/UBO) and resident/corporate status tags.
- **Dock-and-Absorb Personnel Model**: Draggable personnel tokens placed on canvas dock directly into the target entity's satellite columns upon connection or drop-on-entity, preserving clean Dagre layout and export fidelity while updating `associatedParties`.
- **Automatic Hierarchy & Details Sorting**:
  - The Tree Outline tab automatically reorganizes into a nested ownership hierarchy based on graph connections.
  - The Details tab lists entities sorted by topological lineage (Fiduciary Roots $\rightarrow$ Holding Companies $\rightarrow$ Operating Subsidiaries $\rightarrow$ Unconnected Staging).
  - Newly connected siblings are automatically sorted according to the active sibling sort criteria (`alphabetical`, `ownership`, `jurisdiction`).
- **Unconnected Shape Staging**: Unwired shapes remain safely staged in canvas state without corrupting hierarchical export calculations until connected.

## Capabilities

### New Capabilities
- `shape-palette-dock`: Floating horizontal dock above the React Flow canvas supporting drag-and-drop and click-to-place for entity and personnel shapes.
- `connection-quick-picker`: Contextual release popover for configuring ownership percentages, share classes, and fiduciary role assignments upon wiring shapes.
- `canvas-hierarchy-derivation`: Automatic derivation and topological sorting of tree outliner hierarchies, inspector entity details, and satellite role cards from visual canvas connections.

### Modified Capabilities
*(None. Existing specs for `associated-parties`, `trust-connectors`, and `smart-flank-layout` remain backwards compatible and are adhered to by the docked satellite presentation.)*

## Impact

### Affected Code & Components
- `src/components/canvas/StructureCanvas.tsx`: Adds React Flow `onDragOver`, `onDrop` with `screenToFlowPosition`, and hooks `onConnect` into the quick-picker.
- `src/components/canvas/FloatingShapeDock.tsx`: New component providing the floating horizontal shape palette.
- `src/components/canvas/ConnectionQuickPicker.tsx`: New contextual popover for interactive link configuration.
- `src/store/useStructureStore.ts`: Adds staged node state, connection actions, and undo/redo snapshot triggers.
- `src/components/sidebar/TreeOutlineTab.tsx` & `src/components/sidebar/EntityDetailsTab.tsx`: Integrates unconnected staging indicators and lineage-sorted views.
- `src/utils/treeHierarchy.ts`: Adapts hierarchy builders to gracefully handle staged and newly wired entities.

### Domain Impact & Non-Goals
- **User Value**: Drastically accelerates client onboarding and structural modeling meetings for fiduciary trust officers by allowing live whiteboard-style chart drafting.
- **Entity & Director Handling**: Strictly preserves the 12-column Excel roundtrip and existing directors directory spotlight mechanics.
- **Non-Goals**: Does not replace the algorithmic Dagre layout engine with unbounded freeform manual line routing; layout tidy remains algorithmic to preserve print-ready A4 landscape export standards.
- **Privacy & Offline Guarantee**: 100% client-side execution within React/Electron runtime with zero external server dependencies or telemetry.
