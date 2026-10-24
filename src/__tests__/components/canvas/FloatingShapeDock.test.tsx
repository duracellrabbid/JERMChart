import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingShapeDock } from '../../../components/canvas/FloatingShapeDock';
import { useStructureStore } from '../../../store/useStructureStore';

describe('FloatingShapeDock Component', () => {
  const mockOnAddShape = vi.fn();

  beforeEach(() => {
    mockOnAddShape.mockClear();
    act(() => {
      useStructureStore.setState({ isReadOnly: false, isExportMode: false });
    });
  });

  it('renders all shape chips and personnel tools in editable mode with bottom-dock positioning', () => {
    render(<FloatingShapeDock onAddShape={mockOnAddShape} />);

    const dock = screen.getByTestId('floating-shape-dock');
    expect(dock).toBeInTheDocument();
    expect(dock).toHaveClass('bottom-6', 'z-10');
    expect(dock).not.toHaveClass('top-4');
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getByText('HoldCo')).toBeInTheDocument();
    expect(screen.getByText('OpCo')).toBeInTheDocument();
    expect(screen.getByText('Bank')).toBeInTheDocument();
    expect(screen.getByText('Person')).toBeInTheDocument();
  });

  it('hides dock when chart is in read-only mode', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });
    const { container } = render(<FloatingShapeDock onAddShape={mockOnAddShape} />);
    expect(container.firstChild).toBeNull();
  });

  it('hides dock when chart is in export mode', () => {
    act(() => {
      useStructureStore.setState({ isExportMode: true });
    });
    const { container } = render(<FloatingShapeDock onAddShape={mockOnAddShape} />);
    expect(container.firstChild).toBeNull();
  });

  it('triggers onAddShape when a shape chip is clicked', () => {
    render(<FloatingShapeDock onAddShape={mockOnAddShape} />);
    
    const trustButton = screen.getByRole('button', { name: /trust/i });
    fireEvent.click(trustButton);

    expect(mockOnAddShape).toHaveBeenCalledTimes(1);
    expect(mockOnAddShape).toHaveBeenCalledWith({ kind: 'entity', type: 'Trust' });
  });

  it('safely handles click when onAddShape is undefined', () => {
    render(<FloatingShapeDock />);
    const trustButton = screen.getByRole('button', { name: /trust/i });
    expect(() => fireEvent.click(trustButton)).not.toThrow();
  });

  it('sets dataTransfer on dragstart for a shape chip', () => {
    render(<FloatingShapeDock onAddShape={mockOnAddShape} />);
    
    const personChip = screen.getByRole('button', { name: /person/i });
    const setDataMock = vi.fn();

    fireEvent.dragStart(personChip, {
      dataTransfer: {
        setData: setDataMock,
        effectAllowed: 'copy',
      },
    });

    expect(setDataMock).toHaveBeenCalledWith(
      'application/jermchart-shape',
      JSON.stringify({ kind: 'person', role: 'Director' })
    );
  });
});
