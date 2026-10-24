# Technical Design: Drag-and-Drop Shape Palette & Interactive Canvas Connections

## Context
See [`proposal.md`](file:///D:/Shared/JERMApp/JERMChart/openspec/changes/drag-and-drop-shape-canvas/proposal.md) for background and motivation. 

Currently, [`StructureCanvas.tsx`](file:///D:/Shared/JERMApp/JERMChart/src/components/canvas/StructureCanvas.tsx) renders `@xyflow/react` in controlled mode:
- Nodes (`EntityCardNode`, `SatelliteRoleCard`) and edges (`OwnershipEdge`) are calculated deterministically on every store mutation via `calculateSortedLayout(...)` in [`src/utils/layoutEngine.ts`](file:///D:/Shared/JERMApp/JERMChart/src/utils/layoutEngine.ts).
- State resides in [`src/store/useStructureStore.ts`](file:///D:/Shared/JERMApp/JERMChart/src/store/useStructureStore.ts), tracking `entities: EntityNodeData[]` and `relationships: OwnershipEdgeData[]`.
- Adding entities currently requires clicking buttons in [`src/components/sidebar/TreeOutlineTab.tsx`](file:///D:/Shared/JERMApp/JERMChart/src/components/sidebar/TreeOutlineTab.tsx), and linking them requires dragging edge handles with silent default commits.

This design introduces a canvas-first direct manipulation architecture while maintaining 100% deterministic layout, zero spaghetti connections, and full export fidelity.

---

## Goals / Non-Goals

### Goals
- Provide a floating, responsive horizontal dock above the canvas for dragging and dropping or click-placing entity and personnel shapes.
- Enable interactive contextual configuration via a quick-picker popover upon connection release.
- Implement the "Dock-and-Absorb" model for personnel, immediately converting temporary tokens into structured `associatedParties` formatted on entity flanks.
- Automatically sort and nest the Tree Outliner and Details Inspector according to the graph's topological lineage.
- Enforce strict engineering standards: all new hooks/functions keep SonarSource cognitive complexity $< 15$, linear regex/string primitives, and dedicated `__tests__/` isolation.

### Non-Goals
- Freeform uncontrolled manual edge routing: Layout Tidy remains driven by Dagre with orthogonal stepped connectors to guarantee print-ready A4 landscape PDF and slide generation.
- Persistent free-floating director graph nodes: Personnel are docked to entity flanks rather than left as unconstrained floating nodes to prevent visual tangle in large multi-director structures.

---

## Architectural Decisions

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                SYSTEM DATA FLOW                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘

  [ FloatingShapeDock ]
        │  (HTML5 Drag / Click)
        ▼
  [ StructureCanvas (onDrop / screenToFlowPosition) ]
        │
        ├────────────────────────────────┬───────────────────────────────┐
        ▼ (Entity dropped)               ▼ (Person dropped)              ▼ (Edge drawn)
  addEntity() / stageEntity()      stagePerson()                  [ ConnectionQuickPicker ]
        │                                │                               │
        │                                └──────────────┬────────────────┘
        │                                               │ (Confirmed)
        ▼                                               ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │ Zustand Store (src/store/useStructureStore.ts)                        │
  │ • entities[]                                                          │
  │ • relationships[]                                                     │
  │ • pushHistory() -> full Undo / Redo snapshots                         │
  └───────────────────────────────────────────────────────────────────────┘
        │                                               │
        ▼ (Recalculate layout)                          ▼ (Derive hierarchy)
  [ layoutEngine.calculateSortedLayout ]          [ treeHierarchy.buildEntityHierarchy ]
        │                                               │
        ▼                                               ▼
  [ React Flow Nodes & Edges Rendered ]           [ TreeOutlineTab & EntityDetailsTab ]
```

### 1. Palette Placement: Floating Horizontal Canvas Dock
- **Decision**: Mount `FloatingShapeDock` as an absolutely positioned, floating horizontal bar at top-center of `#trust-structure-canvas`.
- **Rationale**: Keeps the primary canvas view uncluttered, does not occupy permanent horizontal width like a third sidebar column, and feels native to modern visual tools (Figma, Miro, Canva).
- **Alternatives Considered**: 
  - *Left Sidebar Tab*: Hidden when users are viewing Entity Details or Directors tab.
  - *Permanent Top Bar*: Reduces vertical canvas height on smaller laptop screens.

### 2. Personnel Handling: "Dock-and-Absorb" Architecture
- **Decision**: A dragged `Person` token exists on the canvas as an ephemeral staged node (`sat-staged-*`). When dropped onto or connected to an entity card, `ConnectionQuickPicker` captures the role (`Director`, `Protector`, `Settlor`, etc.) and immediately adds it to that entity's `associatedParties: AssociatedParty[]`. The staged token is deleted, and Dagre immediately re-renders the person in an external hybrid satellite card on the entity's flank.
- **Rationale**:
  - 100% compatible with existing `associated-parties` and `smart-flank-layout` specifications.
  - Avoids edge clutter when an entity has 5-8 board members.
  - Keeps A4 PDF and PPTX slide export geometries fully predictable.
- **Alternatives Considered**:
  - *Persistent Floating Person Nodes*: Causes severe edge crisscrossing in complex trust structures where individuals serve across multiple entities.

### 3. Connection Quick-Picker Popover
- **Decision**: Intercept React Flow's `onConnect` callback in `StructureCanvas.tsx`. Instead of immediately writing to `useStructureStore`, stash the pending connection in a local component state (`pendingConnection: Connection | null`), capturing the client release coordinates. Render `ConnectionQuickPicker` anchored at the release point.
- **Rationale**: Gives users immediate control over ownership % (presets: 100%, 50%, custom), share class, or fiduciary role without requiring a secondary navigation step to the sidebar inspector.
- **Cycle Detection**: Run a fast $\mathcal{O}(V + E)$ depth-first search cycle check before opening the picker. If adding the edge would introduce a directed cycle (e.g., $A \rightarrow B \rightarrow A$), reject immediately with an alert and abort picker display.

### 4. Automatic Hierarchy & Lineage Sorting
- **Decision**: 
  - Graph edges form a Directed Acyclic Graph (DAG).
  - Compute in-degrees: Entities with in-degree 0 are treated as fiduciary roots (Trusts/Settlors).
  - Use topological sort to rank entities by lineage depth (Roots = Level 0, Subsidiaries = Level 1..N).
  - Both `TreeOutlineTab` and `EntityDetailsTab` consume this topological sequence, ensuring the sidebar is automatically structured in lockstep with the visual canvas.
  - Sibling sorting (`sortCriteria`: `alphabetical`, `ownership`, `jurisdiction`) is automatically applied to siblings at the same depth.

---

## Cognitive Complexity & Code Quality Safeguards (< 15)

In compliance with repo rule **Rule 4** (`eslint-plugin-sonarjs`), complex logic will be split into pure, single-purpose helper utilities:
1. `validateConnectionAttempt(connection, entities, relationships)`: Cognitive complexity $\approx 4$. Validates source/target validity, self-loops, and cycles.
2. `deriveDropPayload(dragType, clientPos, reactFlowInstance)`: Cognitive complexity $\approx 3$. Translates screen coordinates to canvas coordinate space.
3. `commitRelationship(pendingConnection, config, storeActions)`: Cognitive complexity $\approx 4$. Dispatches store actions cleanly.
4. Linear string matching: Role lookups and type badges use dictionary lookups (`Record<string, ...>`) and native string methods rather than complex regular expressions.

---

## Risks / Trade-offs

| Risk | Mitigation |
| :--- | :--- |
| **Drop coordinate mismatch with zoom/pan** | Use `@xyflow/react`'s official `screenToFlowPosition({ x, y })` API to convert pointer screen coordinates accurately regardless of viewport zoom or canvas translation. |
| **Accidental circular ownership links** | Execute a cycle-check utility before committing any edge. If a cycle is detected, block the connection and surface a friendly toast notification. |
| **Canvas layout jumping after drop** | Unconnected newly dropped entities receive an initial floating coordinate. Once an ownership wire is confirmed, the Dagre layout engine smoothly positions the node in its correct hierarchical rank. |
| **Undo/Redo fragmentation** | Every quick-picker confirmation executes `pushHistory()` prior to mutating `entities` or `relationships`, ensuring <kbd>Ctrl+Z</kbd> reverses both shape drops and connection commits seamlessly. |

---

## Migration & Test Plan
- **Isolation**: New components (`FloatingShapeDock`, `ConnectionQuickPicker`) and utilities will be covered by unit tests in `src/__tests__/components/canvas/`.
- **Pre-Commit Verification**: Run `rtk npm run verify:pre-commit` to guarantee 100% test coverage and verify cognitive complexity $< 15$.
- **Pre-Push Verification**: Run `rtk npm run verify:pre-push` to guarantee zero build errors and zero security audit vulnerabilities.
