import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StagedPersonNode } from '../../../components/nodes/StagedPersonNode';
import { useStructureStore } from '../../../store/useStructureStore';

describe('StagedPersonNode Component', () => {
  it('renders staged person details correctly', () => {
    const stagedData = {
      id: 'staged-1',
      kind: 'person' as const,
      name: 'Victoria Cross',
      role: 'Protector',
      position: { x: 100, y: 100 },
    };

    render(
      <ReactFlowProvider>
        <StagedPersonNode id="staged-1" data={stagedData} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={100} yPos={100} dragging={false} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Victoria Cross')).toBeInTheDocument();
    expect(screen.getByText('Protector')).toBeInTheDocument();
  });

  it('triggers unstageNode when delete button is clicked', () => {
    const unstageSpy = vi.spyOn(useStructureStore.getState(), 'unstageNode');
    const stagedData = {
      id: 'staged-2',
      kind: 'person' as const,
      name: 'Sir Charles',
      position: { x: 50, y: 50 },
    };

    render(
      <ReactFlowProvider>
        <StagedPersonNode id="staged-2" data={stagedData} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={50} yPos={50} dragging={false} />
      </ReactFlowProvider>
    );

    const removeBtn = screen.getByRole('button', { name: /remove staged person/i });
    fireEvent.click(removeBtn);

    expect(unstageSpy).toHaveBeenCalledWith('staged-2');
  });

  it('hides delete button when read-only', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });
    const stagedData = {
      id: 'staged-3',
      kind: 'person' as const,
      name: 'Sir Charles',
      position: { x: 50, y: 50 },
    };

    render(
      <ReactFlowProvider>
        <StagedPersonNode id="staged-3" data={stagedData} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={false} xPos={50} yPos={50} dragging={false} />
      </ReactFlowProvider>
    );

    expect(screen.queryByRole('button', { name: /remove staged person/i })).toBeNull();
    act(() => {
      useStructureStore.setState({ isReadOnly: false });
    });
  });

  it('renders fallbacks when name or role are empty', () => {
    const stagedData = {
      id: 'staged-empty',
      kind: 'person' as const,
      name: '',
      position: { x: 0, y: 0 },
    };

    render(
      <ReactFlowProvider>
        <StagedPersonNode id="staged-empty" data={stagedData} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={0} yPos={0} dragging={false} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('New Person')).toBeInTheDocument();
    expect(screen.getByText('Unassigned Role')).toBeInTheDocument();
  });
});
