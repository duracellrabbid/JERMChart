import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EntityCardNode } from '../../../components/nodes/EntityCardNode';
import { ReactFlowProvider } from '@xyflow/react';
import { useStructureStore } from '../../../store/useStructureStore';

describe('EntityCardNode', () => {
  const baseEntityData = {
    id: 'test-1',
    name: 'Pacific Heritage Trust',
    type: 'Trust' as const,
    jurisdiction: 'Cook Islands',
    registrationNumber: 'REG-12345',
    status: 'Active' as const,
    directors: [
      { id: 'd1', name: 'Sophia Sterling', isCorporate: false, isResident: true },
      { id: 'd2', name: 'Anchor Trustees Ltd', isCorporate: true, isResident: false },
    ],
    ubosOrBeneficiaries: ['Sterling Family', 'Second Beneficiary'],
  };

  const createProps = (overrides = {}) => ({
    id: 'test-1',
    data: { ...baseEntityData },
    selected: false,
    type: 'entityCard',
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    ...overrides,
  });

  beforeEach(() => {
    act(() => {
      useStructureStore.setState({
        selectedEntityId: null,
        highlightedDirector: null,
      });
    });
  });

  it('renders entity name, jurisdiction, registration number, and type badge', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Pacific Heritage Trust')).toBeInTheDocument();
    expect(screen.getByText('Cook Islands')).toBeInTheDocument();
    expect(screen.getByText('REG-12345')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders directors list with corporate and resident badges', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Directors (2)')).toBeInTheDocument();
    expect(screen.getByText('Sophia Sterling')).toBeInTheDocument();
    expect(screen.getByText('Anchor Trustees Ltd')).toBeInTheDocument();
    expect(screen.getByText('RES')).toBeInTheDocument();
  });

  it('renders empty director message when no directors exist', () => {
    const props = createProps({
      data: {
        ...baseEntityData,
        directors: [],
      },
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(props as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Directors (0)')).toBeInTheDocument();
    expect(screen.getByText('No directors recorded')).toBeInTheDocument();
  });

  it('renders safely when directors is undefined or missing', () => {
    const props = createProps({
      data: {
        ...baseEntityData,
        directors: undefined,
      },
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(props as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Directors (0)')).toBeInTheDocument();
    expect(screen.getByText('No directors recorded')).toBeInTheDocument();
  });

  it('renders UBO summary and additional count badge when multiple UBOs', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText(/Sterling Family/)).toBeInTheDocument();
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
  });

  it('selects the entity when clicked', () => {
    const { container } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);

    expect(useStructureStore.getState().selectedEntityId).toBe('test-1');
  });

  it('applies selection ring styling when selected', () => {
    const { container, rerender } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps({ selected: true }) as any)} />
      </ReactFlowProvider>
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('ring-4 ring-sky-400');

    // Also when selectedEntityId in store matches
    act(() => {
      useStructureStore.setState({ selectedEntityId: 'test-1' });
    });
    rerender(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps({ selected: false }) as any)} />
      </ReactFlowProvider>
    );
    expect(card.className).toContain('ring-4 ring-sky-400');
  });

  it('handles director spotlighting click to toggle highlight in store', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const directorTag = screen.getByText('Sophia Sterling').closest('div')!;
    fireEvent.click(directorTag);

    expect(useStructureStore.getState().highlightedDirector).toBe('Sophia Sterling');

    // Clicking again toggles it off
    fireEvent.click(directorTag);
    expect(useStructureStore.getState().highlightedDirector).toBeNull();
  });

  it('supports keyboard interaction (Enter and Space) on director tag to toggle highlight', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const directorBtn = screen.getByRole('button', { name: /Sophia Sterling/i });
    expect(directorBtn).toHaveAttribute('tabIndex', '0');

    // Press Enter to toggle highlight on
    fireEvent.keyDown(directorBtn, { key: 'Enter', code: 'Enter' });
    expect(useStructureStore.getState().highlightedDirector).toBe('Sophia Sterling');

    // Press Space to toggle highlight off
    fireEvent.keyDown(directorBtn, { key: ' ', code: 'Space' });
    expect(useStructureStore.getState().highlightedDirector).toBeNull();
  });

  it('applies spotlight ring when entity contains highlighted director', () => {
    act(() => {
      useStructureStore.setState({ highlightedDirector: 'Sophia Sterling' });
    });

    const { container } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('ring-4 ring-amber-500');
    expect(card.className).toContain('opacity-100');
  });

  it('dims entity when highlighted director is not present in entity', () => {
    act(() => {
      useStructureStore.setState({ highlightedDirector: 'NonExistent Director' });
    });

    const { container } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('opacity-40 grayscale-[20%]');
  });

  it('renders triangular shape styling for Trust and Trust Company entities', () => {
    const { container } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps({ data: { ...baseEntityData, type: 'Trust' } }) as any)} />
      </ReactFlowProvider>
    );
    expect(container.querySelector('svg.triangle-shape-bg')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="trust-triangle-card-node"]')).toBeInTheDocument();
  });

  it('renders square 220px styling for subsidiary entities', () => {
    const { container } = render(
      <ReactFlowProvider>
        <EntityCardNode
          {...(createProps({
            data: { ...baseEntityData, type: 'Holding Company', name: 'HoldCo 1' },
          }) as any)}
        />
      </ReactFlowProvider>
    );
    const cardElement = container.querySelector('[data-testid="subsidiary-card-node"]');
    expect(cardElement).toBeInTheDocument();
    expect(cardElement?.className).toContain('w-[220px]');
    expect(cardElement?.className).toContain('h-[220px]');
  });
});
