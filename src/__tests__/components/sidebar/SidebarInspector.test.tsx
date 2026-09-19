import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarInspector } from './SidebarInspector';
import { useStructureStore } from '../../store/useStructureStore';

describe('SidebarInspector', () => {
  beforeEach(() => {
    useStructureStore.getState().resetToSample();
    vi.restoreAllMocks();
  });

  it('renders tabs: Tree, Details, Directors', () => {
    render(<SidebarInspector />);
    expect(screen.getByRole('button', { name: /Tree/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Directors/i })).toBeInTheDocument();
  });

  it('can collapse and expand the sidebar', () => {
    render(<SidebarInspector />);
    // Check initial state has collapse button
    const collapseBtn = screen.getByTitle('Collapse Sidebar');
    expect(collapseBtn).toBeInTheDocument();

    // Click collapse
    fireEvent.click(collapseBtn);
    expect(screen.queryByRole('button', { name: /Tree/i })).not.toBeInTheDocument();

    // Find expand button
    const expandBtn = screen.getByTitle('Open Sidebar');
    expect(expandBtn).toBeInTheDocument();

    // Click expand
    fireEvent.click(expandBtn);
    expect(screen.getByRole('button', { name: /Tree/i })).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(<SidebarInspector />);

    // Default tab is Tree
    expect(screen.getByText(/Entities \(\d+\)/i)).toBeInTheDocument();

    // Switch to Details
    fireEvent.click(screen.getByRole('button', { name: /Details/i }));
    expect(screen.getByText(/Select an entity from the canvas/i)).toBeInTheDocument();

    // Switch to Directors
    fireEvent.click(screen.getByRole('button', { name: /Directors/i }));
    expect(screen.getByText(/Click any director below to highlight/i)).toBeInTheDocument();
    expect(screen.getByText('Julian Vance')).toBeInTheDocument();
  });

  describe('TreeOutlineTab', () => {
    it('displays entities with their types, jurisdictions, and incoming ownership', () => {
      render(<SidebarInspector />);
      expect(screen.getByText('The Aurelius Dynasty Trust')).toBeInTheDocument();
      expect(screen.getByText('Aurelius Global Holdings Ltd')).toBeInTheDocument();
      expect(screen.getByText('Jersey, Channel Islands')).toBeInTheDocument();
      // Aurelius Tech Ventures LLC has 75% incoming
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('selects an entity when clicked', () => {
      render(<SidebarInspector />);
      const entityItem = screen.getByText('The Aurelius Dynasty Trust');
      fireEvent.click(entityItem);
      expect(useStructureStore.getState().selectedEntityId).toBe('entity-1');
    });

    it('adds a new root entity when "Add Entity" is clicked', () => {
      render(<SidebarInspector />);
      const countBefore = useStructureStore.getState().entities.length;
      const addBtn = screen.getByRole('button', { name: /Add Entity/i });
      fireEvent.click(addBtn);

      const entities = useStructureStore.getState().entities;
      expect(entities.length).toBe(countBefore + 1);
      expect(entities[entities.length - 1].name).toBe('New Holding Entity');
      expect(entities[entities.length - 1].type).toBe('Holding Company');
    });

    it('adds a subsidiary when plus icon on entity row is clicked', () => {
      render(<SidebarInspector />);
      const countBefore = useStructureStore.getState().entities.length;
      const plusButtons = screen.getAllByTitle('Add Subsidiary to this entity');
      fireEvent.click(plusButtons[0]); // for entity-1

      const state = useStructureStore.getState();
      expect(state.entities.length).toBe(countBefore + 1);
      const newEntity = state.entities[state.entities.length - 1];
      expect(newEntity.name).toBe('New Subsidiary Entity');
      expect(newEntity.type).toBe('Operating Company');

      // Check relationship created
      const rel = state.relationships.find((r) => r.target === newEntity.id);
      expect(rel).toBeDefined();
      expect(rel?.source).toBe('entity-1');
      expect(rel?.ownershipPercentage).toBe(100);
    });

    it('deletes entity when trash icon is clicked and confirmed', () => {
      window.confirm = vi.fn().mockReturnValue(true);
      render(<SidebarInspector />);
      const deleteButtons = screen.getAllByTitle('Delete Entity');
      fireEvent.click(deleteButtons[4]); // delete entity-5

      expect(window.confirm).toHaveBeenCalled();
      const exists = useStructureStore.getState().entities.some((e) => e.id === 'entity-5');
      expect(exists).toBe(false);
    });

    it('does not delete entity when confirm is cancelled', () => {
      window.confirm = vi.fn().mockReturnValue(false);
      render(<SidebarInspector />);
      const deleteButtons = screen.getAllByTitle('Delete Entity');
      fireEvent.click(deleteButtons[4]);

      expect(window.confirm).toHaveBeenCalled();
      const exists = useStructureStore.getState().entities.some((e) => e.id === 'entity-5');
      expect(exists).toBe(true);
    });
  });

  describe('EntityDetailsTab', () => {
    beforeEach(() => {
      useStructureStore.getState().setSelectedEntityId('entity-1');
    });

    it('renders entity details form for selected entity', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      const nameInput = screen.getByDisplayValue('The Aurelius Dynasty Trust');
      expect(nameInput).toBeInTheDocument();
      expect(screen.getByDisplayValue('Jersey, Channel Islands')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TR-JER-2018-912')).toBeInTheDocument();
    });

    it('updates entity name and jurisdiction on input change', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      const nameInput = screen.getByDisplayValue('The Aurelius Dynasty Trust');
      fireEvent.change(nameInput, { target: { value: 'Updated Dynasty Trust' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.name).toBe(
        'Updated Dynasty Trust'
      );

      const jurInput = screen.getByDisplayValue('Jersey, Channel Islands');
      fireEvent.change(jurInput, { target: { value: 'Guernsey' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.jurisdiction).toBe(
        'Guernsey'
      );
    });

    it('updates entity type and status', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      const typeSelect = screen.getByDisplayValue('Trust');
      fireEvent.change(typeSelect, { target: { value: 'Foundation' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.type).toBe('Foundation');

      const statusSelect = screen.getByDisplayValue('Active');
      fireEvent.change(statusSelect, { target: { value: 'Dormant' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.status).toBe('Dormant');
    });

    it('allows adding and removing directors', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      // Check existing directors
      expect(screen.getByText('Apex Trust Corp (Jersey) Ltd')).toBeInTheDocument();
      expect(screen.getByText('Julian Vance')).toBeInTheDocument();

      // Add a new director
      const dirInput = screen.getByPlaceholderText('New Director or Trustee Name');
      const corporateCheckbox = screen.getByLabelText(/Corporate/i);
      const residentCheckbox = screen.getByLabelText(/Resident Director/i);

      fireEvent.change(dirInput, { target: { value: 'Lady Penelope' } });
      fireEvent.click(corporateCheckbox);
      fireEvent.click(residentCheckbox);

      const addDirectorBtn = screen.getByRole('button', { name: /Add to Board/i });
      fireEvent.click(addDirectorBtn);

      const entity = useStructureStore.getState().entities.find((e) => e.id === 'entity-1');
      const addedDir = entity?.directors.find((d) => d.name === 'Lady Penelope');
      expect(addedDir).toBeDefined();
      expect(addedDir?.isCorporate).toBe(true);
      expect(addedDir?.isResident).toBe(true);

      // Now remove a director (Julian Vance)
      const julianTrash = screen.getByTitle('Remove Julian Vance');
      expect(julianTrash).toBeInTheDocument();
      fireEvent.click(julianTrash);

      const updatedEntity = useStructureStore.getState().entities.find((e) => e.id === 'entity-1');
      expect(updatedEntity?.directors.some((d) => d.name === 'Julian Vance')).toBe(false);
    });
    it('updates registration number, tax id, and notes', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      const regInput = screen.getByPlaceholderText('e.g. BVI-BC-123');
      fireEvent.change(regInput, { target: { value: 'REG-999' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.registrationNumber).toBe('REG-999');

      const taxInput = screen.getByPlaceholderText('Optional');
      fireEvent.change(taxInput, { target: { value: 'TAX-888' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.taxId).toBe('TAX-888');

      const notesInput = screen.getByPlaceholderText(/Settlor, protector/i);
      fireEvent.change(notesInput, { target: { value: 'Updated deed notes' } });
      expect(useStructureStore.getState().entities.find((e) => e.id === 'entity-1')?.notes).toBe('Updated deed notes');
    });

    it('does not add director if name is empty or only whitespace', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Details/i }));

      const dirInput = screen.getByPlaceholderText('New Director or Trustee Name');
      fireEvent.change(dirInput, { target: { value: '   ' } });

      const addDirectorBtn = screen.getByRole('button', { name: /Add to Board/i });
      fireEvent.click(addDirectorBtn);

      const entity = useStructureStore.getState().entities.find((e) => e.id === 'entity-1');
      expect(entity?.directors.length).toBe(2);
    });
  });

  describe('DirectorsDirectoryTab', () => {
    it('aggregates unique directors and shows board counts', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Directors/i }));

      // Julian Vance serves on entity-1, entity-2, entity-4 -> 3 boards
      expect(screen.getByText('Julian Vance')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();

      // Helena Sterling serves on entity-2, entity-3 -> 2 boards
      expect(screen.getByText('Helena Sterling')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays empty state when no directors are present in any entity', () => {
      // Clear all directors across all entities
      const entitiesWithoutDirectors = useStructureStore.getState().entities.map((e) => ({
        ...e,
        directors: [],
      }));
      useStructureStore.setState({ entities: entitiesWithoutDirectors });

      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Directors/i }));

      expect(screen.getByText('No directors recorded.')).toBeInTheDocument();
    });

    it('toggles highlightedDirector when director item is clicked', () => {
      render(<SidebarInspector />);
      fireEvent.click(screen.getByRole('button', { name: /Directors/i }));

      const julianItem = screen.getByText('Julian Vance').closest('div[class*="cursor-pointer"]');
      expect(julianItem).toBeInTheDocument();

      // Click to highlight
      if (julianItem) fireEvent.click(julianItem);
      expect(useStructureStore.getState().highlightedDirector).toBe('Julian Vance');

      // Click again to unhighlight
      if (julianItem) fireEvent.click(julianItem);
      expect(useStructureStore.getState().highlightedDirector).toBeNull();
    });
  });
});
