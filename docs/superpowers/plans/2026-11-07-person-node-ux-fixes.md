# Person Node UI/UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve three UI/UX defects surrounding Person nodes: allow deleting persons (both staged on canvas and globally from the directory), enable editing person names (inline on node and during the connection modal), and fix connection modal clipping at screen edges via viewport-fixed boundary clamping.

**Architecture:**
- Extend `useStructureStore` with `updateStagedNode`, `deleteAssociatedPartyByName`, and an optional `name` override in `connectStagedPersonToEntity`.
- Switch `ConnectionQuickPicker` from `absolute` (which caused a ~340px offset mismatch inside the canvas) to `fixed z-50` with mathematical viewport clamping (`Math.max(PADDING, Math.min(..., window.innerWidth - WIDTH - PADDING))`), and add a Person Name input field for `person-to-entity` links.
- Update `StagedPersonNode` with inline click-to-edit name capabilities and accessible delete controls.
- Add `onNodesDelete` to `StructureCanvas` for canvas keyboard/selection deletion (`Delete`/`Backspace`), and add a delete action with confirmation modal to `DirectorsDirectoryTab`.

**Tech Stack:**
- React 18, TypeScript 5.7, Zustand 5, `@xyflow/react` 12, Lucide React, Vitest 4, Testing Library.

## Global Constraints
- Cognitive complexity must be strictly below 15 for every function, handler, and hook.
- All regular expressions must be linear and ReDoS-free (Rule 5).
- All tests must reside inside dedicated `__tests__/` directories (Rule 6).
- Use `rtk` prefix for all shell/CLI execution commands (Rule 2).
- All 621+ baseline tests must continue to pass with 100% test coverage threshold intact.

---

### Task 1: Store Actions for Staged Node Mutations & Global Person Deletion

**Files:**
- Modify: `src/store/useStructureStore.ts`
- Test: `src/__tests__/store/stagedNodes.test.ts`
- Test: `src/__tests__/store/useStructureStore.test.ts`

**Interfaces:**
- Consumes: `StagedNodeData`, `AssociatedParty`, `StructureState` from `src/types/structure.ts` and `src/store/useStructureStore.ts`.
- Produces:
  - `updateStagedNode: (id: string, updates: Partial<StagedNodeData>) => void`
  - `deleteAssociatedPartyByName: (partyName: string) => void`
  - Updated `connectStagedPersonToEntity: (stagedId: string, targetEntityId: string, roleData: { name?: string; role: string; isResident?: boolean; isCorporate?: boolean }) => void`

- [ ] **Step 1: Write failing store tests for `updateStagedNode`, `deleteAssociatedPartyByName`, and `connectStagedPersonToEntity` custom name**

In `src/__tests__/store/stagedNodes.test.ts`:
```typescript
it('updates staged node attributes such as name and role', () => {
  const { stageNode, updateStagedNode } = useStructureStore.getState();
  const node = stageNode({
    kind: 'person',
    name: 'New Person',
    role: 'Director',
    position: { x: 10, y: 20 },
  });

  updateStagedNode(node.id, { name: 'Alice Smith', role: 'Protector' });

  const updated = useStructureStore.getState().stagedNodes.find((n) => n.id === node.id);
  expect(updated?.name).toBe('Alice Smith');
  expect(updated?.role).toBe('Protector');
});

it('connects staged person to entity with a custom overridden name', () => {
  const { stageNode, connectStagedPersonToEntity, entities } = useStructureStore.getState();
  const targetEntity = entities[0];
  const node = stageNode({
    kind: 'person',
    name: 'New Person',
    position: { x: 0, y: 0 },
  });

  connectStagedPersonToEntity(node.id, targetEntity.id, {
    name: 'Custom Person Name',
    role: 'Beneficiary',
    isResident: true,
  });

  const updatedEntity = useStructureStore.getState().entities.find((e) => e.id === targetEntity.id);
  const party = updatedEntity?.associatedParties?.find((p) => p.name === 'Custom Person Name');
  expect(party).toBeDefined();
  expect(party?.role).toBe('Beneficiary');
  expect(party?.isResident).toBe(true);
});
```

In `src/__tests__/store/useStructureStore.test.ts`:
```typescript
it('deletes an associated party globally across all entities by name', () => {
  const store = useStructureStore.getState();
  const partyNameToDelete = 'Global Director';

  // Add party to two different entities
  store.addAssociatedParty(store.entities[0].id, {
    name: partyNameToDelete,
    role: 'Director',
  });
  store.addAssociatedParty(store.entities[1].id, {
    name: partyNameToDelete,
    role: 'Protector',
  });

  expect(
    useStructureStore
      .getState()
      .entities.flatMap((e) => e.associatedParties || [])
      .filter((p) => p.name === partyNameToDelete)
  ).toHaveLength(2);

  useStructureStore.getState().deleteAssociatedPartyByName(partyNameToDelete);

  expect(
    useStructureStore
      .getState()
      .entities.flatMap((e) => e.associatedParties || [])
      .filter((p) => p.name === partyNameToDelete)
  ).toHaveLength(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/store/stagedNodes.test.ts src/__tests__/store/useStructureStore.test.ts`
Expected: FAIL with `updateStagedNode is not a function` or `deleteAssociatedPartyByName is not a function`.

- [ ] **Step 3: Implement store methods in `src/store/useStructureStore.ts`**

Update `StructureState` interface in `src/store/useStructureStore.ts`:
```typescript
updateStagedNode: (id: string, updates: Partial<StagedNodeData>) => void;
deleteAssociatedPartyByName: (partyName: string) => void;
connectStagedPersonToEntity: (
  stagedId: string,
  targetEntityId: string,
  roleData: { name?: string; role: string; isResident?: boolean; isCorporate?: boolean }
) => void;
```

Implement in `useStructureStore`:
```typescript
updateStagedNode: (id, updates) => {
  if (get().isReadOnly) return;
  get().pushHistory();
  set((state) => ({
    stagedNodes: state.stagedNodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
  }));
},

deleteAssociatedPartyByName: (partyName) => {
  if (get().isReadOnly) return;
  get().pushHistory();
  set((state) => ({
    entities: state.entities.map((e) => ({
      ...e,
      associatedParties: (e.associatedParties || []).filter((p) => p.name !== partyName),
    })),
    highlightedParty: state.highlightedParty === partyName ? null : state.highlightedParty,
    highlightedDirector: state.highlightedDirector === partyName ? null : state.highlightedDirector,
  }));
},

connectStagedPersonToEntity: (stagedId, targetEntityId, roleData) => {
  if (get().isReadOnly) return;
  const staged = get().stagedNodes.find((n) => n.id === stagedId);
  if (!staged) return;
  get().pushHistory();

  const partyName = roleData.name?.trim() || staged.name || 'New Person';
  const newParty: AssociatedParty = {
    id: `party-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    name: partyName,
    role: roleData.role,
    isResident: Boolean(roleData.isResident),
    isCorporate: Boolean(roleData.isCorporate),
  };

  set((state) => ({
    stagedNodes: state.stagedNodes.filter((n) => n.id !== stagedId),
    entities: state.entities.map((e) => {
      if (e.id !== targetEntityId) return e;
      return {
        ...e,
        associatedParties: [...(e.associatedParties || []), newParty],
      };
    }),
  }));
},
```

- [ ] **Step 4: Run store tests to verify they pass**

Run: `rtk npm test src/__tests__/store/stagedNodes.test.ts src/__tests__/store/useStructureStore.test.ts`
Expected: PASS.

---

### Task 2: Person Name Editing & Viewport Clamping in `ConnectionQuickPicker`

**Files:**
- Modify: `src/components/canvas/ConnectionQuickPicker.tsx`
- Test: `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`

**Interfaces:**
- Consumes: `PendingConnectionInfo`, `ConnectionQuickPickerProps`
- Produces:
  - Updated `PersonConnectionResult`:
    ```typescript
    export type PersonConnectionResult = {
      connectionKind: 'person-to-entity';
      personName: string;
      role: string;
      isResident: boolean;
      isCorporate: boolean;
    };
    ```

- [ ] **Step 1: Write failing tests for Person Name input and edge clamping in `ConnectionQuickPicker.test.tsx`**

Add tests to `src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`:
```typescript
it('allows editing person name when connecting person to entity', () => {
  const onConfirm = vi.fn();
  render(
    <ConnectionQuickPicker
      connection={{
        sourceId: 'staged-1',
        sourceName: 'New Person',
        targetId: 'entity-1',
        targetName: 'Acme Holding Ltd',
        connectionKind: 'person-to-entity',
      }}
      position={{ x: 300, y: 300 }}
      onConfirm={onConfirm}
      onCancel={vi.fn()}
    />
  );

  const nameInput = screen.getByLabelText(/person name/i);
  expect(nameInput).toHaveValue('New Person');

  fireEvent.change(nameInput, { target: { value: 'Dr. Jane Doe' } });
  fireEvent.click(screen.getByRole('button', { name: /assign role/i }));

  expect(onConfirm).toHaveBeenCalledWith(
    expect.objectContaining({
      connectionKind: 'person-to-entity',
      personName: 'Dr. Jane Doe',
      role: 'Director',
    })
  );
});

it('clamps modal position within viewport bounds when positioned near extreme edges', () => {
  const { container, rerender } = render(
    <ConnectionQuickPicker
      connection={{
        sourceId: 'staged-1',
        sourceName: 'New Person',
        targetId: 'entity-1',
        targetName: 'Acme Holding Ltd',
        connectionKind: 'person-to-entity',
      }}
      position={{ x: 1910, y: 1050 }}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
    />
  );

  const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
  expect(dialog).toHaveClass('fixed');

  // Verify it is clamped inside window bounds and not clipped
  const topVal = parseFloat(dialog.style.top);
  const leftVal = parseFloat(dialog.style.left);
  expect(leftVal).toBeLessThanOrEqual(window.innerWidth - 300);
  expect(topVal).toBeLessThanOrEqual(window.innerHeight - 340);
  expect(leftVal).toBeGreaterThanOrEqual(16);
  expect(topVal).toBeGreaterThanOrEqual(16);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`
Expected: FAIL with `Unable to find a label with the text of: /person name/i` and missing `fixed` class.

- [ ] **Step 3: Update `ConnectionQuickPicker.tsx`**

1. Update `PersonConnectionResult`:
```typescript
export type PersonConnectionResult = {
  connectionKind: 'person-to-entity';
  personName: string;
  role: string;
  isResident: boolean;
  isCorporate: boolean;
};
```
2. Add `personName` state initialized to `connection.sourceName`:
```typescript
const [personName, setPersonName] = useState<string>(connection.sourceName || 'New Person');
useEffect(() => {
  setPersonName(connection.sourceName || 'New Person');
}, [connection.sourceName]);
```
3. Update `handlePersonSubmit`:
```typescript
const handlePersonSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onConfirm({
    connectionKind: 'person-to-entity',
    personName: personName.trim() || sourceName || 'New Person',
    role,
    isResident,
    isCorporate,
  });
};
```
4. Render Person Name input in `person-to-entity` form:
```tsx
<div>
  <label htmlFor="person-name-input" className="block text-[11px] font-semibold text-slate-700 mb-1">
    Person Name
  </label>
  <input
    id="person-name-input"
    type="text"
    value={personName}
    onChange={(e) => setPersonName(e.target.value)}
    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
    placeholder="Enter person name"
    maxLength={120}
  />
</div>
```
5. Switch dialog container to `fixed z-50` with boundary clamping:
```typescript
const MODAL_WIDTH = 300;
const MODAL_HEIGHT = 420;
const PADDING = 16;
const modalLeft = Math.max(PADDING, Math.min(position.x - 140, window.innerWidth - MODAL_WIDTH - PADDING));
const modalTop = Math.max(PADDING, Math.min(position.y - 120, window.innerHeight - MODAL_HEIGHT - PADDING));
```
Update root element className:
```tsx
className="fixed z-50 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-xs select-none"
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/canvas/ConnectionQuickPicker.test.tsx`
Expected: PASS.

---

### Task 3: Inline Name Editing & Node Deletion on Canvas (`StagedPersonNode` & `StructureCanvas`)

**Files:**
- Modify: `src/components/nodes/StagedPersonNode.tsx`
- Modify: `src/components/canvas/StructureCanvas.tsx`
- Test: `src/__tests__/components/nodes/StagedPersonNode.test.tsx`
- Test: `src/__tests__/components/canvas/StructureCanvas.test.tsx`

**Interfaces:**
- Consumes: `updateStagedNode`, `unstageNode`, `deleteEntity` from `useStructureStore`.
- Produces:
  - Inline edit mode on `StagedPersonNode` with commit on Enter or Blur.
  - `onNodesDelete` callback on `<ReactFlow>` to support keyboard `Delete`/`Backspace` for staged person nodes and entities.
  - Connection confirm handler passes `result.personName` to `connectStagedPersonToEntity`.

- [ ] **Step 1: Write failing tests for inline rename and canvas delete in `StagedPersonNode.test.tsx` and `StructureCanvas.test.tsx`**

In `src/__tests__/components/nodes/StagedPersonNode.test.tsx`:
```typescript
it('allows inline editing of the person name', () => {
  const { stageNode } = useStructureStore.getState();
  const node = stageNode({
    kind: 'person',
    name: 'New Person',
    role: 'Director',
    position: { x: 0, y: 0 },
  });

  render(
    <ReactFlowProvider>
      <StagedPersonNode
        id={node.id}
        data={node}
        type="stagedPersonNode"
        selected={false}
        zIndex={1}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    </ReactFlowProvider>
  );

  const nameDisplay = screen.getByText('New Person');
  fireEvent.click(nameDisplay);

  const inlineInput = screen.getByDisplayValue('New Person');
  fireEvent.change(inlineInput, { target: { value: 'Robert Miller' } });
  fireEvent.blur(inlineInput);

  expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)?.name).toBe('Robert Miller');
});
```

In `src/__tests__/components/canvas/StructureCanvas.test.tsx`:
```typescript
it('unstages person node when deleted via onNodesDelete', () => {
  const { stageNode } = useStructureStore.getState();
  const node = stageNode({
    kind: 'person',
    name: 'To Delete',
    position: { x: 100, y: 100 },
  });

  render(<StructureCanvas />);

  // Verify node rendered
  expect(screen.getByText('To Delete')).toBeInTheDocument();

  // Trigger delete on staged person node
  const deleteBtn = screen.getByTitle(/remove staged person/i);
  fireEvent.click(deleteBtn);

  expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)).toBeUndefined();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/nodes/StagedPersonNode.test.tsx`
Expected: FAIL with `fireEvent.click(nameDisplay)` not showing input.

- [ ] **Step 3: Implement inline editing in `StagedPersonNode.tsx`**

In `src/components/nodes/StagedPersonNode.tsx`:
- Add state `[isEditing, setIsEditing] = useState(false);` and `[editName, setEditName] = useState(staged.name || 'New Person');`.
- On click or double click on the name, if `!isReadOnly`, set `isEditing(true)`.
- On input `onKeyDown`: if `Enter`, commit via `updateStagedNode(id, { name: editName.trim() || 'New Person' })` and set `isEditing(false)`. If `Escape`, revert `editName` and exit editing.
- On input `onBlur`: commit via `updateStagedNode(id, { name: editName.trim() || 'New Person' })` and set `isEditing(false)`.
- Ensure Cognitive Complexity is below 15 by extracting `commitNameEdit` and `handleKeyDown` pure helpers.

- [ ] **Step 4: Implement `onNodesDelete` and connection name forwarding in `StructureCanvas.tsx`**

In `src/components/canvas/StructureCanvas.tsx`:
- Retrieve `unstageNode` and `deleteEntity` from `useStructureStore`.
- Implement `onNodesDelete`:
```typescript
const onNodesDelete = useCallback(
  (deletedNodes: Node[]) => {
    if (isReadOnly) return;
    deletedNodes.forEach((node) => {
      if (node.type === 'stagedPersonNode') {
        unstageNode(node.id);
      } else if (node.type === 'entityNode') {
        deleteEntity(node.id);
      }
    });
  },
  [isReadOnly, unstageNode, deleteEntity]
);
```
- In `handleConfirmConnection`, pass `result.personName` when `result.connectionKind === 'person-to-entity'`:
```typescript
connectStagedPersonToEntity(info.sourceId, info.targetId, {
  name: result.personName,
  role: result.role,
  isResident: result.isResident,
  isCorporate: result.isCorporate,
});
```
- Add `onNodesDelete={onNodesDelete}` and `deleteKeyCode={['Backspace', 'Delete']}` to `<ReactFlow>`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/nodes/StagedPersonNode.test.tsx src/__tests__/components/canvas/StructureCanvas.test.tsx`
Expected: PASS.

---

### Task 4: Global Person Deletion in Directors Directory Tab

**Files:**
- Modify: `src/components/sidebar/DirectorsDirectoryTab.tsx`
- Test: `src/__tests__/components/sidebar/SidebarInspector.test.tsx`

**Interfaces:**
- Consumes: `deleteAssociatedPartyByName`, `entities`, `highlightedParty`, `setHighlightedParty`, `isReadOnly` from `useStructureStore`.
- Produces:
  - Delete button for each party in `DirectorsDirectoryTab`.
  - Accessible `ConfirmationModal` before calling `deleteAssociatedPartyByName`.

- [ ] **Step 1: Write failing test in `SidebarInspector.test.tsx` for deleting a director from the directory tab**

Add test to `src/__tests__/components/sidebar/SidebarInspector.test.tsx`:
```typescript
it('allows deleting an associated party globally from the directors tab with confirmation', () => {
  render(<SidebarInspector />);
  
  // Switch to Directors tab
  fireEvent.click(screen.getByTestId('tab-directors'));

  // Find a party row with a delete button
  const deleteButtons = screen.getAllByTitle(/delete person/i);
  expect(deleteButtons.length).toBeGreaterThan(0);

  // Click delete on the first person
  fireEvent.click(deleteButtons[0]);

  // Confirmation modal should appear
  expect(screen.getByRole('dialog', { name: /delete person/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();

  // Confirm delete
  fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

  // Modal closes and party is removed
  expect(screen.queryByRole('dialog', { name: /delete person/i })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/sidebar/SidebarInspector.test.tsx`
Expected: FAIL with `getAllByTitle(/delete person/i)` finding 0 elements.

- [ ] **Step 3: Implement delete button and ConfirmationModal in `DirectorsDirectoryTab.tsx`**

In `src/components/sidebar/DirectorsDirectoryTab.tsx`:
- Import `Trash2` from `lucide-react` and `ConfirmationModal` from `../common/ConfirmationModal`.
- Access `deleteAssociatedPartyByName` and `isReadOnly` from `useStructureStore`.
- Add state `[deletingPartyName, setDeletingPartyName] = useState<string | null>(null);`.
- Render delete button in each party item row (when `!isReadOnly`):
```tsx
{!isReadOnly && (
  <button
    type="button"
    title={`Delete person ${item.name}`}
    aria-label={`Delete person ${item.name}`}
    onClick={(e) => {
      e.stopPropagation();
      setDeletingPartyName(item.name);
    }}
    className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition ml-1"
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
)}
```
- Render `ConfirmationModal`:
```tsx
{deletingPartyName && (
  <ConfirmationModal
    isOpen={true}
    title="Delete Person"
    message={`Are you sure you want to delete "${deletingPartyName}"? This person will be removed from all entities where they are appointed across the entire structure.`}
    confirmLabel="Confirm Delete"
    cancelLabel="Cancel"
    variant="danger"
    onConfirm={() => {
      deleteAssociatedPartyByName(deletingPartyName);
      setDeletingPartyName(null);
    }}
    onCancel={() => setDeletingPartyName(null)}
  />
)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/sidebar/SidebarInspector.test.tsx`
Expected: PASS.

---

### Task 5: Full Verification & Lifecycle Gates

**Files:**
- Test all modified files across full test runner.

- [ ] **Step 1: Run complete Vitest suite**

Run: `rtk npm test`
Expected: 43 test files passed, 621+ tests passing.

- [ ] **Step 2: Run pre-commit verification gate**

Run: `rtk npm run verify:pre-commit`
Expected:
1. `npm run lint` passes with 0 errors (Rule 4 Cognitive Complexity < 15 & Rule 5 Linear ReDoS-free Regex enforced).
2. `npm run test:coverage` passes with 100% threshold satisfied.

- [ ] **Step 3: Run pre-push verification gate**

Run: `rtk npm run verify:pre-push`
Expected:
1. `npm run build` succeeds cleanly with production bundle generated.
2. `npm run audit:security` passes with 0 moderate or higher vulnerabilities.
