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
    const handles = screen.getByTestId('staged-person-node').querySelectorAll('.react-flow__handle');
    expect(handles.length).toBe(4);
    handles.forEach((h) => expect(h).toHaveClass('source'));
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
    expect(removeBtn).toHaveAttribute('data-testid', 'remove-staged-person');
    expect(removeBtn).toHaveAttribute('title', 'Remove staged person');
    fireEvent.click(removeBtn);

    expect(unstageSpy).toHaveBeenCalledWith('staged-2');
  });

  it('allows inline editing of person name committing on blur and enter', () => {
    const node = useStructureStore.getState().stageNode({
      kind: 'person',
      name: 'Initial Name',
      role: 'Director',
      position: { x: 0, y: 0 },
    });

    render(
      <ReactFlowProvider>
        <StagedPersonNode id={node.id} data={node} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={0} yPos={0} dragging={false} />
      </ReactFlowProvider>
    );

    const nameDisplay = screen.getByText('Initial Name');
    fireEvent.click(nameDisplay);

    const input = screen.getByTestId('staged-person-name-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Initial Name');

    // Click on input stops propagation and ignores non-control key
    fireEvent.click(input);
    fireEvent.keyDown(input, { key: 'ArrowLeft', code: 'ArrowLeft' });

    // Change and commit on blur
    fireEvent.change(input, { target: { value: 'Updated Name' } });
    fireEvent.blur(input);

    expect(screen.queryByTestId('staged-person-name-input')).toBeNull();
    expect(screen.getByText('Updated Name')).toBeInTheDocument();
    expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)?.name).toBe('Updated Name');

    // Re-enter edit mode and commit on Enter
    fireEvent.click(screen.getByText('Updated Name'));
    const input2 = screen.getByTestId('staged-person-name-input');
    fireEvent.change(input2, { target: { value: 'Final Name' } });
    fireEvent.keyDown(input2, { key: 'Enter', code: 'Enter' });

    expect(screen.queryByTestId('staged-person-name-input')).toBeNull();
    expect(screen.getByText('Final Name')).toBeInTheDocument();
    expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)?.name).toBe('Final Name');
  });

  it('cancels inline editing on Escape without saving changes', () => {
    const node = useStructureStore.getState().stageNode({
      kind: 'person',
      name: 'Original Person',
      role: 'Protector',
      position: { x: 0, y: 0 },
    });

    render(
      <ReactFlowProvider>
        <StagedPersonNode id={node.id} data={node} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={0} yPos={0} dragging={false} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByText('Original Person'));
    const input = screen.getByTestId('staged-person-name-input');
    fireEvent.change(input, { target: { value: 'Unsaved Person' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByTestId('staged-person-name-input')).toBeNull();
    expect(screen.getByText('Original Person')).toBeInTheDocument();
    expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)?.name).toBe('Original Person');
  });

  it('falls back to New Person if inline name is cleared on blur', () => {
    const node = useStructureStore.getState().stageNode({
      kind: 'person',
      name: 'Some Person',
      position: { x: 0, y: 0 },
    });

    render(
      <ReactFlowProvider>
        <StagedPersonNode id={node.id} data={node} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={true} xPos={0} yPos={0} dragging={false} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByText('Some Person'));
    const input = screen.getByTestId('staged-person-name-input');
    fireEvent.change(input, { target: { value: '    ' } });
    fireEvent.blur(input);

    expect(screen.getByText('New Person')).toBeInTheDocument();
    expect(useStructureStore.getState().stagedNodes.find((n) => n.id === node.id)?.name).toBe('New Person');
  });

  it('prevents inline editing when isReadOnly is true', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });

    const stagedData = {
      id: 'staged-ro',
      kind: 'person' as const,
      name: 'Read Only Person',
      position: { x: 0, y: 0 },
    };

    render(
      <ReactFlowProvider>
        <StagedPersonNode id="staged-ro" data={stagedData} selected={false} type="stagedPersonNode" zIndex={1} isConnectable={false} xPos={0} yPos={0} dragging={false} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByText('Read Only Person'));
    expect(screen.queryByTestId('staged-person-name-input')).toBeNull();

    act(() => {
      useStructureStore.setState({ isReadOnly: false });
    });
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

    // Verify handleCancel fallback to 'New Person' when staged.name is empty
    fireEvent.click(screen.getByText('New Person'));
    const input = screen.getByTestId('staged-person-name-input');
    fireEvent.change(input, { target: { value: 'Something' } });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
    expect(screen.getByText('New Person')).toBeInTheDocument();
  });
});
