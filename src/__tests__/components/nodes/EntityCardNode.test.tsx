import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EntityCardNode, SatelliteRoleCard } from '../../../components/nodes/EntityCardNode';
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
    associatedParties: [
      { id: 'p1', name: 'Sophia Sterling', role: 'Protector', isCorporate: false, isResident: true },
      { id: 'p2', name: 'Anchor Trustees Ltd', role: 'Trustee', isCorporate: true, isResident: false },
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
        highlightedParty: null,
        highlightedDirector: null,
      });
    });
  });

  it('renders Trust entity name, jurisdiction, registration number, and type badge', () => {
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
    expect(screen.getByTestId('trust-triangle-card-node')).toBeInTheDocument();

    // Trust with a single beneficiary (branch coverage for +N badge)
    const singleUboProps = createProps({
      data: {
        ...baseEntityData,
        ubosOrBeneficiaries: ['Single Beneficiary'],
      },
    });
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(singleUboProps as any)} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('Single Beneficiary')).toBeInTheDocument();
  });

  it('renders SubsidiarySquareCard for corporate entity types', () => {
    const props = createProps({
      data: {
        ...baseEntityData,
        type: 'Holding Company',
        name: 'Pacific Holding Ltd',
      },
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(props as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Pacific Holding Ltd')).toBeInTheDocument();
    expect(screen.getByText('Holding Company')).toBeInTheDocument();
    expect(screen.getByTestId('subsidiary-card-node')).toBeInTheDocument();
  });

  it('renders BankCircleCard for Bank entity type', () => {
    const props = createProps({
      data: {
        id: 'bank-1',
        name: 'Apex Merchant Bank',
        type: 'Bank',
        jurisdiction: 'Singapore',
        registrationNumber: 'ACC-9921',
        status: 'Active',
        associatedParties: [],
      },
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(props as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Apex Merchant Bank')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.getByText('Singapore')).toBeInTheDocument();
    expect(screen.getByTestId('bank-circle-card-node')).toBeInTheDocument();
  });

  it('updates selectedEntityId when clicking an entity card', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = screen.getByTestId('trust-triangle-card-node');
    fireEvent.click(card);

    expect(useStructureStore.getState().selectedEntityId).toBe('test-1');
  });

  it('renders SatelliteRoleCard with role badge, party list, and resident tag', () => {
    const satelliteProps = {
      id: 'sat-1',
      data: {
        id: 'sat-1',
        parentEntityId: 'test-1',
        role: 'Directors',
        side: 'left' as const,
        parties: [
          { id: 'p1', name: 'Julian Vance', role: 'Director', isCorporate: false, isResident: true },
          { id: 'p2', name: 'Apex Corp', role: 'Director', isCorporate: true, isResident: false },
        ],
      },
      selected: false,
      type: 'satelliteNode',
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    render(
      <ReactFlowProvider>
        <SatelliteRoleCard {...(satelliteProps as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByTestId('satellite-role-card')).toBeInTheDocument();
    expect(screen.getByText('Directors')).toBeInTheDocument();
    expect(screen.getByText('Julian Vance')).toBeInTheDocument();
    expect(screen.getByText('Apex Corp')).toBeInTheDocument();
    expect(screen.getByText('RES')).toBeInTheDocument();
  });

  it('spotlights party when clicking a party item in SatelliteRoleCard', () => {
    const satelliteProps = {
      id: 'sat-1',
      data: {
        id: 'sat-1',
        parentEntityId: 'test-1',
        role: 'Protector',
        side: 'right' as const,
        parties: [
          { id: 'p1', name: 'Marcus Aurelius', role: 'Protector', isCorporate: false },
        ],
      },
      selected: false,
      type: 'satelliteNode',
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    render(
      <ReactFlowProvider>
        <SatelliteRoleCard {...(satelliteProps as any)} />
      </ReactFlowProvider>
    );

    const partyRow = screen.getByText('Marcus Aurelius');
    fireEvent.click(partyRow);

    expect(useStructureStore.getState().highlightedParty).toBe('Marcus Aurelius');

    // Toggle off
    fireEvent.click(partyRow);
    expect(useStructureStore.getState().highlightedParty).toBeNull();
  });

  it('delegates to SatelliteRoleCard when isSatelliteRoleNode is true on EntityCardNode', () => {
    const nodeProps = {
      id: 'sat-node-1',
      data: {
        isSatelliteRoleNode: true,
        satelliteData: {
          id: 'sat-1',
          parentEntityId: 'test-1',
          role: 'Enforcers',
          side: 'left' as const,
          parties: [{ id: 'p1', name: 'Enforcer Authority', role: 'Enforcer', isCorporate: true }],
        },
      },
      selected: false,
      type: 'entityNode',
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(nodeProps as any)} />
      </ReactFlowProvider>
    );

    expect(screen.getByTestId('satellite-role-card')).toBeInTheDocument();
    expect(screen.getByText('Enforcers')).toBeInTheDocument();
  });

  it('selects parent entity when clicking SatelliteRoleCard background', () => {
    const satelliteProps = {
      id: 'sat-1',
      data: {
        id: 'sat-1',
        parentEntityId: 'test-1',
        role: 'Directors',
        side: 'left' as const,
        parties: [],
      },
      selected: false,
      type: 'satelliteNode',
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    render(
      <ReactFlowProvider>
        <SatelliteRoleCard {...(satelliteProps as any)} />
      </ReactFlowProvider>
    );

    fireEvent.click(screen.getByTestId('satellite-role-card'));
    expect(useStructureStore.getState().selectedEntityId).toBe('test-1');
  });

  it('highlights entity card and dims others when a party is highlighted', () => {
    act(() => {
      useStructureStore.setState({ highlightedParty: 'Sophia Sterling' });
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = screen.getByTestId('trust-triangle-card-node');
    expect(card.className).toContain('ring-amber-500');
  });

  it('dims entity card when a different party is highlighted', () => {
    act(() => {
      useStructureStore.setState({ highlightedParty: 'Unknown Person' });
    });

    render(
      <ReactFlowProvider>
        <EntityCardNode {...(createProps() as any)} />
      </ReactFlowProvider>
    );

    const card = screen.getByTestId('trust-triangle-card-node');
    expect(card.className).toContain('opacity-40');
  });

  it('renders SatelliteRoleCard in selected and dimmed state without parentEntityId or parties', () => {
    act(() => {
      useStructureStore.setState({ highlightedParty: 'Someone Else' });
    });

    const satProps = {
      id: 'sat-isolated',
      data: {
        id: 'sat-isolated',
        role: 'Protectors',
        side: 'left' as const,
        parties: undefined as any,
        parentEntityId: undefined,
      },
      selected: true,
      type: 'satelliteNode',
      zIndex: 0,
      isConnectable: true,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
    };

    render(
      <ReactFlowProvider>
        <SatelliteRoleCard {...(satProps as any)} />
      </ReactFlowProvider>
    );

    const card = screen.getByTestId('satellite-role-card');
    expect(card.className).toContain('ring-2 ring-sky-400');
    expect(card.className).toContain('opacity-40');

    // Clicking when parentEntityId is undefined does not throw or change selectedEntityId
    fireEvent.click(card);
    expect(useStructureStore.getState().selectedEntityId).toBeNull();
  });

  it('renders SubsidiarySquareCard when selected, highlighted, and dimmed', () => {
    const subProps = createProps({
      data: {
        ...baseEntityData,
        type: 'Operating Company',
        associatedParties: [{ id: 'p-sub', name: 'Sub Director', role: 'Director' }],
      },
      selected: true,
    });

    const { rerender } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(subProps as any)} />
      </ReactFlowProvider>
    );
    let card = screen.getByTestId('subsidiary-card-node');
    expect(card.className).toContain('ring-4 ring-sky-400');

    act(() => {
      useStructureStore.setState({ highlightedParty: 'Sub Director' });
    });
    rerender(
      <ReactFlowProvider>
        <EntityCardNode {...(subProps as any)} />
      </ReactFlowProvider>
    );
    card = screen.getByTestId('subsidiary-card-node');
    expect(card.className).toContain('ring-4 ring-amber-500');

    act(() => {
      useStructureStore.setState({ highlightedParty: 'Other Person' });
    });
    rerender(
      <ReactFlowProvider>
        <EntityCardNode {...(subProps as any)} />
      </ReactFlowProvider>
    );
    card = screen.getByTestId('subsidiary-card-node');
    expect(card.className).toContain('opacity-40');
  });

  it('renders BankCircleCard when selected, highlighted, and dimmed', () => {
    const bankProps = createProps({
      data: {
        ...baseEntityData,
        type: 'Bank',
        associatedParties: [{ id: 'p-bank', name: 'Bank Signatory', role: 'Authorised Signatory' }],
      },
      selected: true,
    });

    const { rerender } = render(
      <ReactFlowProvider>
        <EntityCardNode {...(bankProps as any)} />
      </ReactFlowProvider>
    );
    let card = screen.getByTestId('bank-circle-card-node');
    expect(card.className).toContain('ring-4 ring-cyan-400');

    act(() => {
      useStructureStore.setState({ highlightedParty: 'Bank Signatory' });
    });
    rerender(
      <ReactFlowProvider>
        <EntityCardNode {...(bankProps as any)} />
      </ReactFlowProvider>
    );
    card = screen.getByTestId('bank-circle-card-node');
    expect(card.className).toContain('ring-4 ring-amber-500');

    act(() => {
      useStructureStore.setState({ highlightedParty: 'Other Person' });
    });
    rerender(
      <ReactFlowProvider>
        <EntityCardNode {...(bankProps as any)} />
      </ReactFlowProvider>
    );
    card = screen.getByTestId('bank-circle-card-node');
    expect(card.className).toContain('opacity-40');
  });
});
