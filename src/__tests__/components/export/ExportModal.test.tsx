import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../../../components/export/ExportModal';
import { useStructureStore } from '../../../store/useStructureStore';
import * as exportService from '../../../utils/exportService';

vi.mock('../../../utils/exportService', () => ({
  exportToImage: vi.fn().mockResolvedValue(undefined),
  exportToPdf: vi.fn().mockResolvedValue(undefined),
  exportToPptx: vi.fn().mockResolvedValue(undefined),
  downloadJsonBackup: vi.fn(),
  parseJsonBackup: vi.fn(),
}));

describe('ExportModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useStructureStore.getState().resetToSample();
  });

  it('renders modal dialog with export options and close button', () => {
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Export Structure Chart/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    expect(screen.getByText(/Print-Ready PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Resolution PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Vector SVG/i)).toBeInTheDocument();
    expect(screen.getByText(/PowerPoint \(\.pptx\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save JSON File/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load JSON File/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ExportModal onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('triggers PDF export and displays success feedback', async () => {
    render(<ExportModal onClose={mockOnClose} />);

    const pdfBtn = screen.getByRole('button', { name: /Print-Ready PDF/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(exportService.exportToPdf).toHaveBeenCalledWith(
        'trust-structure-canvas',
        expect.objectContaining({ chartTitle: expect.any(String) })
      );
      expect(screen.getByText(/PDF generated successfully/i)).toBeInTheDocument();
    });
  });

  it('triggers PowerPoint export and displays success feedback', async () => {
    render(<ExportModal onClose={mockOnClose} />);

    const pptxBtn = screen.getByRole('button', { name: /PowerPoint \(\.pptx\)/i });
    fireEvent.click(pptxBtn);

    await waitFor(() => {
      expect(exportService.exportToPptx).toHaveBeenCalledWith(
        'trust-structure-canvas',
        expect.objectContaining({ chartTitle: expect.any(String) })
      );
      expect(screen.getByText(/PowerPoint presentation generated successfully/i)).toBeInTheDocument();
    });
  });

  it('triggers PNG export and displays success feedback', async () => {
    render(<ExportModal onClose={mockOnClose} />);

    const pngBtn = screen.getByRole('button', { name: /High-Resolution PNG/i });
    fireEvent.click(pngBtn);

    await waitFor(() => {
      expect(exportService.exportToImage).toHaveBeenCalledWith(
        'trust-structure-canvas',
        'png',
        expect.any(String)
      );
      expect(screen.getByText(/PNG downloaded successfully/i)).toBeInTheDocument();
    });
  });

  it('triggers SVG export and displays success feedback', async () => {
    render(<ExportModal onClose={mockOnClose} />);

    const svgBtn = screen.getByRole('button', { name: /Vector SVG/i });
    fireEvent.click(svgBtn);

    await waitFor(() => {
      expect(exportService.exportToImage).toHaveBeenCalledWith(
        'trust-structure-canvas',
        'svg',
        expect.any(String)
      );
      expect(screen.getByText(/SVG downloaded successfully/i)).toBeInTheDocument();
    });
  });

  it('triggers JSON backup download and displays success feedback', () => {
    render(<ExportModal onClose={mockOnClose} />);

    const saveBtn = screen.getByRole('button', { name: /Save JSON File/i });
    fireEvent.click(saveBtn);

    expect(exportService.downloadJsonBackup).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.any(Object),
        entities: expect.any(Array),
        relationships: expect.any(Array),
      })
    );
    expect(screen.getByText(/Structure backup \(\.json\) saved\./i)).toBeInTheDocument();
  });

  it('loads valid JSON structure via file upload', async () => {
    const mockChart = {
      metadata: {
        chartTitle: 'Imported Trust',
        effectiveDate: '2026-09-19',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-new',
          name: 'Imported Corp',
          type: 'Operating Company' as const,
          jurisdiction: 'Delaware',
          status: 'Active' as const,
          directors: [],
        },
      ],
      relationships: [],
    };

    vi.mocked(exportService.parseJsonBackup).mockReturnValue(mockChart);

    render(<ExportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File([JSON.stringify(mockChart)], 'backup.json', {
      type: 'application/json',
    });

    // Mock FileReader
    const mockFileReaderInstance = {
      readAsText: vi.fn(function (this: any) {
        this.onload({ target: { result: JSON.stringify(mockChart) } });
      }),
      onload: vi.fn(),
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
      return mockFileReaderInstance as unknown as FileReader;
    } as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(exportService.parseJsonBackup).toHaveBeenCalled();
      expect(useStructureStore.getState().entities.length).toBe(1);
      expect(useStructureStore.getState().entities[0].name).toBe('Imported Corp');
      expect(screen.getByText(/Loaded 1 entities from backup/i)).toBeInTheDocument();
    });
  });

  it('handles invalid JSON file upload gracefully', async () => {
    vi.mocked(exportService.parseJsonBackup).mockReturnValue(null);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ExportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['corrupt data'], 'bad.json', {
      type: 'application/json',
    });

    const mockFileReaderInstance = {
      readAsText: vi.fn(function (this: any) {
        this.onload({ target: { result: 'corrupt data' } });
      }),
      onload: vi.fn(),
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
      return mockFileReaderInstance as unknown as FileReader;
    } as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid or corrupted structure file.');
      expect(fileInput.value).toBe('');
    });
  });

  it('displays alert dialog when export throws an error', async () => {
    vi.mocked(exportService.exportToPdf).mockRejectedValueOnce(new Error('PDF generation failed'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ExportModal onClose={mockOnClose} />);

    const pdfBtn = screen.getByRole('button', { name: /Print-Ready PDF/i });
    fireEvent.click(pdfBtn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Export failed: PDF generation failed');
    });
  });

  it('handles PNG, SVG, and PPTX export errors, including non-Error rejections', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.mocked(exportService.exportToImage).mockRejectedValueOnce(new Error('PNG failed'));

    render(<ExportModal onClose={mockOnClose} />);

    // PNG failure
    fireEvent.click(screen.getByRole('button', { name: /High-Resolution PNG/i }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Export failed: PNG failed');
    });

    // SVG failure with non-Error string
    vi.mocked(exportService.exportToImage).mockRejectedValueOnce('SVG failed string' as any);
    fireEvent.click(screen.getByRole('button', { name: /Vector SVG/i }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Export failed: Unknown error');
    });

    // PPTX failure
    vi.mocked(exportService.exportToPptx).mockRejectedValueOnce(new Error('PPTX failed'));
    fireEvent.click(screen.getByRole('button', { name: /PowerPoint \(\.pptx\)/i }));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Export failed: PPTX failed');
    });
  });

  it('ignores file upload change event when no file is selected', () => {
    render(<ExportModal onClose={mockOnClose} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [] } });
    expect(exportService.parseJsonBackup).not.toHaveBeenCalled();
  });

  it('triggers file input click when Load JSON File button is clicked', () => {
    render(<ExportModal onClose={mockOnClose} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    const loadBtn = screen.getByRole('button', { name: /Load JSON File/i });
    fireEvent.click(loadBtn);

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
