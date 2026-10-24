import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { StructureCanvas } from '../../../components/canvas/StructureCanvas';
import { useStructureStore } from '../../../store/useStructureStore';

let capturedOnConnect: ((connection: any) => void) | undefined;
let capturedProps: any = {};

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    useReactFlow: () => ({
      screenToFlowPosition: ({ x, y }: any) => ({ x, y }),
    }),
    ReactFlow: (props: any) => {
      capturedOnConnect = props.onConnect;
      capturedProps = props;
      return (
        <div data-testid="react-flow-wrapper">
          <actual.ReactFlow {...props} />
        </div>
      );
    },
  };
});

describe('StructureCanvas', () => {
  beforeEach(() => {
    act(() => {
      useStructureStore.setState({ isReadOnly: false, allowJsonBackup: true });
      useStructureStore.getState().resetToSample();
    });
  });

  it('mounts the canvas container cleanly', () => {
    const { container } = render(<StructureCanvas />);
    expect(container.querySelector('#trust-structure-canvas')).toBeInTheDocument();
  });

  it('renders entity nodes from store', () => {
    render(<StructureCanvas />);
    expect(screen.getByText('The Aurelius Dynasty Trust')).toBeInTheDocument();
    expect(screen.getAllByText('Aurelius Global Holdings Ltd').length).toBeGreaterThan(0);
    expect(screen.getByText('Aurelius Capital Singapore Pte Ltd')).toBeInTheDocument();
  });

  it('deselects selected entity when pane is clicked', async () => {
    useStructureStore.setState({ selectedEntityId: 'entity-1' });
    expect(useStructureStore.getState().selectedEntityId).toBe('entity-1');

    const { container } = render(<StructureCanvas />);
    
    const pane = container.querySelector('.react-flow__pane');
    expect(pane).toBeInTheDocument();

    if (pane) {
      fireEvent.click(pane);
    }

    expect(useStructureStore.getState().selectedEntityId).toBeNull();
  });

  it('handles connection between entities and adds relationship to store', () => {
    render(<StructureCanvas />);

    expect(capturedOnConnect).toBeDefined();

    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const confirmBtn = screen.getByRole('button', { name: /establish link/i });
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    const rels = useStructureStore.getState().relationships;
    const newRel = rels.find((r) => r.source === 'entity-1' && r.target === 'entity-4');
    expect(newRel).toBeDefined();
    expect(newRel?.ownershipPercentage).toBe(100);
    expect(newRel?.shareClass).toBe('Ordinary Shares');
  });

  it('does not add relationship if source or target is missing', () => {
    render(<StructureCanvas />);

    const initialRelCount = useStructureStore.getState().relationships.length;

    act(() => {
      capturedOnConnect?.({
        source: null,
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);
  });

  it('disables node connections and guards onConnect when isReadOnly is true', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });

    render(<StructureCanvas />);
    expect(capturedProps.nodesConnectable).toBe(false);

    const initialRelCount = useStructureStore.getState().relationships.length;
    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);
  });

  it('does not add relationship if source and target are identical (prevents self-loops)', () => {
    render(<StructureCanvas />);

    const initialRelCount = useStructureStore.getState().relationships.length;

    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'entity-1',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);
  });

  it('does not add relationship if source or target is a satellite node or invalid entity', () => {
    render(<StructureCanvas />);
    const initialRelCount = useStructureStore.getState().relationships.length;

    // Connect from satellite node
    act(() => {
      capturedOnConnect?.({
        source: 'sat-entity-1-left-0',
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });
    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);

    // Connect to satellite node
    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'sat-entity-4-right-0',
        sourceHandle: null,
        targetHandle: null,
      });
    });
    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);

    // Connect to non-existent entity
    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'ghost-entity-999',
        sourceHandle: null,
        targetHandle: null,
      });
    });
    expect(useStructureStore.getState().relationships.length).toBe(initialRelCount);
  });

  it('updates layout when sort criteria changes', () => {
    render(<StructureCanvas />);

    act(() => {
      useStructureStore.getState().setSortCriteria('ownership');
    });

    // Verify it remains rendered and stable
    expect(screen.getByText('The Aurelius Dynasty Trust')).toBeInTheDocument();
    expect(useStructureStore.getState().sortCriteria).toBe('ownership');
  });

  it('renders FiduciaryLegend and toggles notation items', () => {
    render(<StructureCanvas />);

    const legendBtn = screen.getByRole('button', { name: /Fiduciary Notation Key/i });
    expect(legendBtn).toBeInTheDocument();

    // Initially collapsed
    expect(screen.queryByText(/Apex Triangle/i)).not.toBeInTheDocument();

    // Toggle open
    fireEvent.click(legendBtn);
    expect(screen.getByText(/Apex Triangle/i)).toBeInTheDocument();
    expect(screen.getByText(/Resident Director Governance/i)).toBeInTheDocument();

    // Toggle close
    fireEvent.click(legendBtn);
  });

  it('handles drag and drop of entity and person onto canvas', () => {
    const { container } = render(<StructureCanvas />);
    const canvas = container.querySelector('#trust-structure-canvas');
    expect(canvas).toBeInTheDocument();

    const initialEntityCount = useStructureStore.getState().entities.length;

    // Drag over
    fireEvent.dragOver(canvas!, {
      dataTransfer: { dropEffect: 'copy' },
    });

    // Drop entity
    fireEvent.drop(canvas!, {
      clientX: 200,
      clientY: 300,
      dataTransfer: {
        getData: (format: string) =>
          format === 'application/jermchart-shape'
            ? JSON.stringify({ kind: 'entity', type: 'Operating Company' })
            : '',
      },
    });

    expect(useStructureStore.getState().entities.length).toBe(initialEntityCount + 1);

    // Drop person
    fireEvent.drop(canvas!, {
      clientX: 250,
      clientY: 350,
      dataTransfer: {
        getData: (format: string) =>
          format === 'application/jermchart-shape'
            ? JSON.stringify({ kind: 'person', role: 'Protector' })
            : '',
      },
    });

    expect(useStructureStore.getState().stagedNodes.length).toBe(1);
  });

  it('adds shapes directly when palette chips are clicked', () => {
    render(<StructureCanvas />);
    const initialEntityCount = useStructureStore.getState().entities.length;
    const initialStagedCount = useStructureStore.getState().stagedNodes.length;

    // Click Trust chip
    const trustChip = screen.getByRole('button', { name: /trust/i });
    fireEvent.click(trustChip);
    expect(useStructureStore.getState().entities.length).toBe(initialEntityCount + 1);

    // Click Person chip
    const personChip = screen.getByRole('button', { name: /person/i });
    fireEvent.click(personChip);
    expect(useStructureStore.getState().stagedNodes.length).toBe(initialStagedCount + 1);
  });

  it('ignores invalid drag data payload on canvas drop', () => {
    const { container } = render(<StructureCanvas />);
    const canvas = container.querySelector('#trust-structure-canvas');
    const initialCount = useStructureStore.getState().entities.length;

    fireEvent.drop(canvas!, {
      clientX: 100,
      clientY: 100,
      dataTransfer: {
        getData: () => 'invalid-json-{',
      },
    });

    expect(useStructureStore.getState().entities.length).toBe(initialCount);

    fireEvent.drop(canvas!, {
      clientX: 100,
      clientY: 100,
      dataTransfer: {
        getData: () => '',
      },
    });

    expect(useStructureStore.getState().entities.length).toBe(initialCount);
  });

  it('cancels pending quick picker connection when cancelled', () => {
    render(<StructureCanvas />);

    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    expect(screen.queryByRole('button', { name: /establish link/i })).toBeNull();
  });

  it('supports reverse connection from entity to staged person', () => {
    act(() => {
      useStructureStore.getState().stageNode({
        kind: 'person',
        name: 'Lady Beatrice',
        role: 'Director',
        position: { x: 50, y: 50 },
      });
    });

    const stagedId = useStructureStore.getState().stagedNodes[0].id;
    render(<StructureCanvas />);

    // Connect from entity-1 -> stagedId
    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: stagedId,
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const assignBtn = screen.getByRole('button', { name: /assign role/i });
    expect(assignBtn).toBeInTheDocument();
    fireEvent.click(assignBtn);

    expect(useStructureStore.getState().stagedNodes.length).toBe(0);
  });

  it('connects staged person to entity and absorbs role via quick picker', () => {
    act(() => {
      useStructureStore.getState().stageNode({
        kind: 'person',
        name: 'Lord Sterling',
        role: 'Enforcer',
        position: { x: 100, y: 100 },
      });
    });

    const stagedId = useStructureStore.getState().stagedNodes[0].id;
    render(<StructureCanvas />);

    act(() => {
      capturedOnConnect?.({
        source: stagedId,
        target: 'entity-1',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const assignBtn = screen.getByRole('button', { name: /assign role/i });
    expect(assignBtn).toBeInTheDocument();
    fireEvent.click(assignBtn);

    // Person should be absorbed
    expect(useStructureStore.getState().stagedNodes.length).toBe(0);
    const entity1 = useStructureStore.getState().entities.find((e) => e.id === 'entity-1');
    expect(entity1?.associatedParties.some((p) => p.name === 'Lord Sterling')).toBe(true);
  });

  it('prevents circular ownership connection and shows warning', () => {
    render(<StructureCanvas />);

    // entity-2 is child of entity-1. Connecting entity-2 -> entity-1 would create a cycle.
    act(() => {
      capturedOnConnect?.({
        source: 'entity-2',
        target: 'entity-1',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    expect(screen.getByText(/circular ownership loops are not permitted/i)).toBeInTheDocument();
    // Dismiss warning
    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/circular ownership loops are not permitted/i)).toBeNull();
  });

  it('positions connection quick picker at pointer coordinates when connecting nodes', () => {
    const { container } = render(<StructureCanvas />);
    const canvas = container.querySelector('#trust-structure-canvas')!;
    expect(canvas).toBeInTheDocument();

    // Move pointer to (500, 350)
    fireEvent.pointerMove(canvas, { clientX: 500, clientY: 350 });

    act(() => {
      capturedOnConnect?.({
        source: 'entity-1',
        target: 'entity-4',
        sourceHandle: null,
        targetHandle: null,
      });
    });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // With cursorPos = { x: 500, y: 350 }, dialog left should be 500 - 140 = 360, top should be 350 - 120 = 230
    expect(dialog.style.left).toBe('360px');
    expect(dialog.style.top).toBe('230px');
  });
});

