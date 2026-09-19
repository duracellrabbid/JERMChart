import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppHeader } from './AppHeader';
import { useStructureStore } from '../../store/useStructureStore';

describe('AppHeader', () => {
  const onOpenExportMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useStructureStore.getState().resetToSample();
    });
  });

  it('renders default chart title, client reference, effective date, and fiduciary badge', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} />);

    expect(screen.getByText(/The Aurelius Dynasty Trust Structure/i)).toBeInTheDocument();
    expect(screen.getByText(/\(TRUST-2026-088\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Effective: 2026-09-19/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidential Fiduciary Document/i)).toBeInTheDocument();
  });

  it('allows editing chart title inline and updates store', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('The Aurelius Dynasty Trust Structure');
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Horizon Capital Trust' } });
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Horizon Capital Trust');

    fireEvent.blur(input);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Horizon Capital Trust/i)).toBeInTheDocument();
  });

  it('closes title edit mode on Enter key press', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('The Aurelius Dynasty Trust Structure');
    fireEvent.change(input, { target: { value: 'Imperial Trust' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Imperial Trust/i)).toBeInTheDocument();
  });

  it('displays sibling sort criteria and updates store on selection change', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('alphabetical');

    fireEvent.change(select, { target: { value: 'ownership' } });
    expect(useStructureStore.getState().sortCriteria).toBe('ownership');

    fireEvent.change(select, { target: { value: 'jurisdiction' } });
    expect(useStructureStore.getState().sortCriteria).toBe('jurisdiction');

    fireEvent.change(select, { target: { value: 'manual' } });
    expect(useStructureStore.getState().sortCriteria).toBe('manual');
  });

  it('triggers layout refresh on clicking Auto-Tidy button', () => {
    const setStateSpy = vi.spyOn(useStructureStore, 'setState');

    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const autoTidyBtn = screen.getByRole('button', { name: /Auto-Tidy/i });
    fireEvent.click(autoTidyBtn);

    expect(setStateSpy).toHaveBeenCalled();
  });

  it('prompts confirmation and resets store to sample when confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    act(() => {
      useStructureStore.getState().setMetadata({ chartTitle: 'Modified Title' });
    });
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Modified Title');

    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Reset chart to Aurelius Dynasty Trust sample template?')
    );
    expect(useStructureStore.getState().metadata.chartTitle).toBe('The Aurelius Dynasty Trust Structure');
  });

  it('does not reset store when reset confirmation is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    act(() => {
      useStructureStore.getState().setMetadata({ chartTitle: 'Custom Unsaved Trust' });
    });

    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    fireEvent.click(resetBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Custom Unsaved Trust');
  });

  it('calls onOpenExport callback when Export Chart button is clicked', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} />);

    const exportBtn = screen.getByRole('button', { name: /Export Chart/i });
    fireEvent.click(exportBtn);

    expect(onOpenExportMock).toHaveBeenCalledTimes(1);
  });
});
