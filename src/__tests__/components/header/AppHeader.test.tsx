import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppHeader } from './AppHeader';
import { useStructureStore } from '../../store/useStructureStore';

describe('AppHeader', () => {
  const onOpenExportMock = vi.fn();
  const onOpenExcelImportMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useStructureStore.getState().resetToSample();
    });
  });

  it('renders default chart title, client reference, effective date, and fiduciary badge', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    expect(screen.getByText(/The Aurelius Dynasty Trust Structure/i)).toBeInTheDocument();
    expect(screen.getByText(/\(TRUST-2026-088\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Effective: 2026-09-19/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidential Fiduciary Document/i)).toBeInTheDocument();
  });

  it('allows editing chart title inline and updates store', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

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
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('The Aurelius Dynasty Trust Structure');
    fireEvent.change(input, { target: { value: 'Imperial Trust' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Imperial Trust/i)).toBeInTheDocument();
  });

  it('enters title edit mode when pressing Enter or Space on title heading', () => {
    const { unmount } = render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute('tabIndex', '0');

    // Test Enter key
    fireEvent.keyDown(heading, { key: 'Enter', code: 'Enter' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    unmount();

    // Test Space key
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);
    const heading2 = screen.getByRole('heading', { level: 1 });
    fireEvent.keyDown(heading2, { key: ' ', code: 'Space' });
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('reverts title to initial value and closes edit mode on Escape key press', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('The Aurelius Dynasty Trust Structure');
    fireEvent.change(input, { target: { value: 'Draft Trust Name That Will Be Cancelled' } });
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Draft Trust Name That Will Be Cancelled');

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(useStructureStore.getState().metadata.chartTitle).toBe('The Aurelius Dynasty Trust Structure');
    expect(screen.getByText(/The Aurelius Dynasty Trust Structure/i)).toBeInTheDocument();
  });

  it('displays sibling sort criteria and updates store on selection change', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

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

    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const autoTidyBtn = screen.getByRole('button', { name: /Auto-Tidy/i });
    fireEvent.click(autoTidyBtn);

    expect(setStateSpy).toHaveBeenCalled();
  });

  it('opens reset dropdown, prompts confirmation, and resets store to sample when confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    act(() => {
      useStructureStore.getState().setMetadata({ chartTitle: 'Modified Title' });
    });
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Modified Title');

    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Template/i });
    expect(loadSampleBtn).toBeInTheDocument();
    fireEvent.click(loadSampleBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Reset chart to Aurelius Dynasty Trust sample template?')
    );
    expect(useStructureStore.getState().metadata.chartTitle).toBe('The Aurelius Dynasty Trust Structure');
  });

  it('does not reset store when reset sample confirmation is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    act(() => {
      useStructureStore.getState().setMetadata({ chartTitle: 'Custom Unsaved Trust' });
    });

    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    const loadSampleBtn = screen.getByRole('button', { name: /Load Sample Template/i });
    fireEvent.click(loadSampleBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(useStructureStore.getState().metadata.chartTitle).toBe('Custom Unsaved Trust');
  });

  it('prompts confirmation and clears canvas when Clear Canvas (Blank) is selected', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    expect(useStructureStore.getState().entities.length).toBeGreaterThan(0);

    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    const clearCanvasBtn = screen.getByRole('button', { name: /Clear Canvas \(Blank\)/i });
    expect(clearCanvasBtn).toBeInTheDocument();
    fireEvent.click(clearCanvasBtn);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Clear all entities and start with a blank canvas?')
    );
    expect(useStructureStore.getState().entities).toEqual([]);
    expect(useStructureStore.getState().relationships).toEqual([]);
    expect(useStructureStore.getState().metadata.chartTitle).toBe('New Trust Structure');
  });

  it('does not clear canvas when Clear Canvas (Blank) confirmation is cancelled', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    const initialCount = useStructureStore.getState().entities.length;
    expect(initialCount).toBeGreaterThan(0);

    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    const clearCanvasBtn = screen.getByRole('button', { name: /Clear Canvas \(Blank\)/i });
    fireEvent.click(clearCanvasBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(useStructureStore.getState().entities.length).toBe(initialCount);
  });

  it('closes reset menu when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Outside Element</div>
        <AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />
      </div>
    );

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    expect(screen.getByRole('button', { name: /Clear Canvas \(Blank\)/i })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId('outside'));

    expect(screen.queryByRole('button', { name: /Clear Canvas \(Blank\)/i })).not.toBeInTheDocument();
  });

  it('closes reset menu when Escape key is pressed', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const resetTrigger = screen.getByRole('button', { name: /Reset \/ New/i });
    fireEvent.click(resetTrigger);

    expect(screen.getByRole('button', { name: /Clear Canvas \(Blank\)/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(screen.queryByRole('button', { name: /Clear Canvas \(Blank\)/i })).not.toBeInTheDocument();
  });

  it('calls onOpenExcelImport callback when Import Excel button is clicked', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const importBtn = screen.getByRole('button', { name: /Import Excel/i });
    expect(importBtn).toBeInTheDocument();
    fireEvent.click(importBtn);

    expect(onOpenExcelImportMock).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenExport callback when Export Chart button is clicked', () => {
    render(<AppHeader onOpenExport={onOpenExportMock} onOpenExcelImport={onOpenExcelImportMock} />);

    const exportBtn = screen.getByRole('button', { name: /Export Chart/i });
    fireEvent.click(exportBtn);

    expect(onOpenExportMock).toHaveBeenCalledTimes(1);
  });
});
