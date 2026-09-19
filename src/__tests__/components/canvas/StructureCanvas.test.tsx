import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { StructureCanvas } from './StructureCanvas';
import { useStructureStore } from '../../store/useStructureStore';

let capturedOnConnect: ((connection: any) => void) | undefined;

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>();
  return {
    ...actual,
    ReactFlow: (props: any) => {
      capturedOnConnect = props.onConnect;
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

  it('updates layout when sort criteria changes', () => {
    render(<StructureCanvas />);

    act(() => {
      useStructureStore.getState().setSortCriteria('ownership');
    });

    // Verify it remains rendered and stable
    expect(screen.getByText('The Aurelius Dynasty Trust')).toBeInTheDocument();
    expect(useStructureStore.getState().sortCriteria).toBe('ownership');
  });
});

