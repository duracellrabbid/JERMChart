import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExcelImportModal } from '../../../components/import/ExcelImportModal';
import { useStructureStore } from '../../../store/useStructureStore';
import * as excelParser from '../../../utils/excelParser';
import { TrustStructureChart } from '../../../types/structure';

vi.mock('../../../utils/excelParser', () => ({
  parseExcelWorkbook: vi.fn(),
  generateExcelTemplate: vi.fn(() => new Uint8Array([1, 2, 3])),
}));

describe('ExcelImportModal Component', () => {
  const mockOnClose = vi.fn();
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;
  let clickSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    useStructureStore.getState().resetToSample();

    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-template-url');
    window.URL.revokeObjectURL = vi.fn();
    createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
    revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal dialog with accessibility attributes, template download button, and dropzone', () => {
    render(<ExcelImportModal onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/Import Structure from Excel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download Excel Template/i })).toBeInTheDocument();
    expect(screen.getByText(/Click to browse or drop your Excel\/CSV file here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apply to Canvas/i })).toBeDisabled();
  });

  it('calls onClose when close button (X) or Cancel button is clicked', () => {
    render(<ExcelImportModal onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('downloads Excel template when Download Excel Template button is clicked', () => {
    render(<ExcelImportModal onClose={mockOnClose} />);

    const downloadBtn = screen.getByRole('button', { name: /Download Excel Template/i });
    fireEvent.click(downloadBtn);

    expect(excelParser.generateExcelTemplate).toHaveBeenCalledTimes(1);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-template-url');
  });

  it('parses uploaded Excel file and displays preview summary cards and entities table', async () => {
    const mockChart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Apex Dynasty Trust Structure',
        effectiveDate: '2026-09-19',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-1',
          name: 'Apex Dynasty Trust',
          type: 'Trust',
          jurisdiction: 'Jersey',
          status: 'Active',
          directors: [{ id: 'd-1', name: 'Trustee Corp', isCorporate: true }],
        },
        {
          id: 'ent-2',
          name: 'Apex Holdings Ltd',
          type: 'Holding Company',
          jurisdiction: 'BVI',
          status: 'Active',
          directors: [
            { id: 'd-2', name: 'Alice Smith', isCorporate: false },
            { id: 'd-3', name: 'Bob Jones', isCorporate: false },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel-1',
          source: 'ent-1',
          target: 'ent-2',
          ownershipPercentage: 100,
          shareClass: 'Ordinary Shares',
        },
      ],
    };

    vi.mocked(excelParser.parseExcelWorkbook).mockReturnValue({
      chart: mockChart,
      warnings: [],
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File(['fake content'], 'test_structure.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    // Ensure arrayBuffer is defined for jsdom File
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(16));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(excelParser.parseExcelWorkbook).toHaveBeenCalled();
      // Summary cards
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 Entities
      expect(screen.getByText(/Entities Found/i)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 Relationship
      expect(screen.getByText(/Ownership Links/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 Directors total
      expect(screen.getByText(/Total Directors/i)).toBeInTheDocument();

      // Table rows
      expect(screen.getByText('Apex Dynasty Trust')).toBeInTheDocument();
      expect(screen.getByText('Apex Holdings Ltd')).toBeInTheDocument();
      expect(screen.getByText('1 recorded')).toBeInTheDocument();
      expect(screen.getByText('2 recorded')).toBeInTheDocument();

      // Apply button enabled
      expect(screen.getByRole('button', { name: /Apply to Canvas/i })).not.toBeDisabled();
    });
  });

  it('displays validation warnings when unlinked parent entities are detected', async () => {
    const mockChart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Warning Structure',
        effectiveDate: '2026-09-19',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-1',
          name: 'Child Corp',
          type: 'Operating Company',
          jurisdiction: 'Singapore',
          status: 'Active',
          directors: [],
        },
      ],
      relationships: [],
    };

    vi.mocked(excelParser.parseExcelWorkbook).mockReturnValue({
      chart: mockChart,
      warnings: ['Entity "Child Corp" references parent "Unknown Parent", but "Unknown Parent" was not found in the spreadsheet.'],
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake content'], 'warnings.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(16));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Validation Warnings \(1\)/i)).toBeInTheDocument();
      expect(
        screen.getByText(/references parent "Unknown Parent", but "Unknown Parent" was not found/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Unlinked entities will still be imported as independent top-level cards\./i)
      ).toBeInTheDocument();
    });
  });

  it('displays error message when parsing results in 0 valid entities', async () => {
    vi.mocked(excelParser.parseExcelWorkbook).mockReturnValue({
      chart: {
        metadata: { chartTitle: '', effectiveDate: '', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      },
      warnings: [],
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['empty'], 'empty.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/No valid entities found in the file\. Ensure "Entity Name" column is filled\./i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply to Canvas/i })).toBeDisabled();
      expect(fileInput.value).toBe('');
    });
  });

  it('displays error message when parser throws an exception', async () => {
    vi.mocked(excelParser.parseExcelWorkbook).mockImplementation(() => {
      throw new Error('Unsupported or corrupted workbook format');
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bad content'], 'corrupted.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported or corrupted workbook format/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply to Canvas/i })).toBeDisabled();
    });
  });

  it('applies parsed structure to canvas and closes modal when Apply to Canvas is clicked', async () => {
    const mockChart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Applied Trust',
        effectiveDate: '2026-09-19',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-1',
          name: 'Applied Entity',
          type: 'Trust',
          jurisdiction: 'Jersey',
          status: 'Active',
          directors: [],
        },
      ],
      relationships: [],
    };

    vi.mocked(excelParser.parseExcelWorkbook).mockReturnValue({
      chart: mockChart,
      warnings: [],
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake content'], 'test.xlsx');
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(16));

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Apply to Canvas/i })).not.toBeDisabled();
    });

    const applyBtn = screen.getByRole('button', { name: /Apply to Canvas/i });
    fireEvent.click(applyBtn);

    expect(useStructureStore.getState().entities).toHaveLength(1);
    expect(useStructureStore.getState().entities[0].name).toBe('Applied Entity');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles file dropped onto dropzone', async () => {
    const mockChart: TrustStructureChart = {
      metadata: { chartTitle: 'Dropped', effectiveDate: '2026-09-19', confidentialityNotice: '' },
      entities: [
        {
          id: 'ent-dropped',
          name: 'Dropped Corp',
          type: 'Operating Company',
          jurisdiction: 'Delaware',
          status: 'Active',
          directors: [],
        },
      ],
      relationships: [],
    };

    vi.mocked(excelParser.parseExcelWorkbook).mockReturnValue({
      chart: mockChart,
      warnings: [],
    });

    render(<ExcelImportModal onClose={mockOnClose} />);

    const dropzone = screen.getByTestId('excel-dropzone');
    const file = new File(['dropped content'], 'dropped.xlsx');
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(16));

    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Dropped Corp')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Apply to Canvas/i })).not.toBeDisabled();
    });
  });

  it('closes modal when Escape key is pressed on window', () => {
    render(<ExcelImportModal onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('highlights dropzone on dragEnter and removes highlight on dragLeave', () => {
    render(<ExcelImportModal onClose={mockOnClose} />);

    const dropzone = screen.getByTestId('excel-dropzone');
    expect(dropzone.className).toContain('border-slate-300');
    expect(dropzone.className).not.toContain('ring-2');

    fireEvent.dragEnter(dropzone);
    expect(dropzone.className).toContain('border-sky-500');
    expect(dropzone.className).toContain('ring-2 ring-sky-300');

    // Simulate dragLeave by leaving container (relatedTarget outside)
    fireEvent.dragLeave(dropzone, { relatedTarget: document.body });
    expect(dropzone.className).toContain('border-slate-300');
    expect(dropzone.className).not.toContain('ring-2');
  });
});
