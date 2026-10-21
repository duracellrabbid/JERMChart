import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppHeader } from '../../../components/header/AppHeader';
import { useStructureStore } from '../../../store/useStructureStore';

describe('AppHeader - Read-Only Mode and Header Slots', () => {
  const onOpenExportMock = vi.fn();
  const onOpenExcelImportMock = vi.fn();
  const onOpenPhotoImportMock = vi.fn();
  const onOpenSettingsMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useStructureStore.setState({ isReadOnly: false, allowJsonBackup: true });
      useStructureStore.getState().resetToSample();
    });
  });

  it('renders headerLeftSlot and headerRightSlot correctly', () => {
    render(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
        headerLeftSlot={<div data-testid="custom-left-slot">Left Slot Content</div>}
        headerRightSlot={<div data-testid="custom-right-slot">Right Slot Content</div>}
      />
    );

    expect(screen.getByTestId('custom-left-slot')).toBeInTheDocument();
    expect(screen.getByTestId('custom-right-slot')).toBeInTheDocument();
  });

  it('hides AI settings button when hideSettingsButton is true', () => {
    const { rerender } = render(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
        hideSettingsButton={true}
      />
    );

    expect(screen.queryByLabelText(/AI Settings/i)).not.toBeInTheDocument();

    rerender(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
        hideSettingsButton={false}
      />
    );

    expect(screen.getByLabelText(/AI Settings/i)).toBeInTheDocument();
  });

  it('hides mutating controls (Undo/Redo, Reset/New, Import) when isReadOnly is true', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });

    render(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
      />
    );

    // Mutating controls should be hidden
    expect(screen.queryByLabelText('Undo')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Redo')).not.toBeInTheDocument();
    expect(screen.queryByText(/Reset \/ New/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Import/i)).not.toBeInTheDocument();

    // Non-mutating controls remain active and visible
    expect(screen.getByText(/View Options/i)).toBeInTheDocument();
    expect(screen.getByText(/Auto-Tidy/i)).toBeInTheDocument();
    expect(screen.getByText(/Export Chart/i)).toBeInTheDocument();
  });

  it('disables inline title editing when isReadOnly is true', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: true });
    });

    render(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
      />
    );

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.keyDown(titleElement, { key: 'Enter', code: 'Enter' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.keyDown(titleElement, { key: ' ', code: 'Space' });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows mutating controls and allows title editing when isReadOnly is false', () => {
    act(() => {
      useStructureStore.setState({ isReadOnly: false });
    });

    render(
      <AppHeader
        onOpenExport={onOpenExportMock}
        onOpenExcelImport={onOpenExcelImportMock}
        onOpenPhotoImport={onOpenPhotoImportMock}
        onOpenSettings={onOpenSettingsMock}
      />
    );

    expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
    expect(screen.getByText(/Reset \/ New/i)).toBeInTheDocument();
    expect(screen.getByText(/Import/i)).toBeInTheDocument();

    const titleElement = screen.getByText(/The Aurelius Dynasty Trust Structure/i);
    fireEvent.click(titleElement);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
