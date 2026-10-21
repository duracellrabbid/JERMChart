import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from '../../../components/export/ExportModal';
import { useStructureStore } from '../../../store/useStructureStore';
import * as exportService from '../../../utils/exportService';

vi.mock('../../../utils/exportService', () => ({
  exportToImage: vi.fn().mockResolvedValue(undefined),
  exportToPdf: vi.fn().mockResolvedValue(undefined),
  exportToPptx: vi.fn().mockResolvedValue(undefined),
  downloadJsonBackup: vi.fn(),
  downloadExcelStructure: vi.fn(),
  parseJsonBackup: vi.fn(),
}));

describe('ExportModal - Permission & Capability Enforcement', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useStructureStore.setState({ isReadOnly: false, allowJsonBackup: true });
    useStructureStore.getState().resetToSample();
  });

  it('renders JSON backup section with both Save and Load buttons when allowJsonBackup=true and isReadOnly=false', () => {
    useStructureStore.setState({ isReadOnly: false, allowJsonBackup: true });
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByText(/Local File Backup & Restore/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save JSON File/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load JSON File/i })).toBeInTheDocument();
    expect(screen.getByText(/Print-Ready PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/PowerPoint \(\.pptx\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeInTheDocument();
  });

  it('omits the entire JSON backup section from the DOM when allowJsonBackup=false', () => {
    useStructureStore.setState({ isReadOnly: false, allowJsonBackup: false });
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.queryByText(/Local File Backup & Restore/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save JSON File/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load JSON File/i })).not.toBeInTheDocument();

    // Export formats remain available
    expect(screen.getByText(/Print-Ready PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/PowerPoint \(\.pptx\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Resolution PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Vector SVG/i)).toBeInTheDocument();
  });

  it('shows Save JSON File but hides Load JSON File when allowJsonBackup=true and isReadOnly=true', () => {
    useStructureStore.setState({ isReadOnly: true, allowJsonBackup: true });
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByText(/Local File Backup & Restore/i)).toBeInTheDocument();
    const saveBtn = screen.getByRole('button', { name: /Save JSON File/i });
    expect(saveBtn).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load JSON File/i })).not.toBeInTheDocument();

    fireEvent.click(saveBtn);
    expect(exportService.downloadJsonBackup).toHaveBeenCalledTimes(1);

    // Export formats remain available
    expect(screen.getByText(/Print-Ready PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/PowerPoint \(\.pptx\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeInTheDocument();
  });
});
