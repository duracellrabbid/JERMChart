import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportModal } from '../../../components/export/ExportModal';
import { useStructureStore } from '../../../store/useStructureStore';
import * as exportService from '../../../utils/exportService';
import * as cryptoService from '../../../utils/cryptoService';

let mockFeatureFlags = {
  enablePdfExport: false,
  enablePptxExport: false,
  enableJsonEncryption: true,
};

vi.mock('../../../config/featureFlags', () => ({
  get FEATURE_FLAGS() {
    return mockFeatureFlags;
  },
}));

vi.mock('../../../utils/exportService', () => ({
  exportToImage: vi.fn().mockResolvedValue(undefined),
  exportToPdf: vi.fn().mockResolvedValue(undefined),
  exportToPptx: vi.fn().mockResolvedValue(undefined),
  downloadJsonBackup: vi.fn(),
  downloadEncryptedJsonBackup: vi.fn(),
  downloadExcelStructure: vi.fn(),
  parseJsonBackup: vi.fn(),
}));

vi.mock('../../../utils/cryptoService', () => ({
  encryptChart: vi.fn().mockResolvedValue('{"format":"jermchart-encrypted","mock":true}'),
  decryptChart: vi.fn(),
  isEncryptedEnvelope: vi.fn((data: any) => data?.format === 'jermchart-encrypted'),
}));

describe('ExportModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFeatureFlags = {
      enablePdfExport: false,
      enablePptxExport: false,
      enableJsonEncryption: true,
    };
    useStructureStore.getState().resetToSample();
  });

  it('renders modal dialog with default export options and hides PDF/PPTX buttons', () => {
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Export Structure Chart/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
    expect(screen.queryByText(/Print-Ready PDF/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PowerPoint \(\.pptx\)/i)).not.toBeInTheDocument();
    expect(screen.getByText(/High-Resolution PNG/i)).toBeInTheDocument();
    expect(screen.getByText(/Vector SVG/i)).toBeInTheDocument();
    expect(screen.getByText(/Excel Spreadsheet \(\.xlsx\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save JSON File/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Load JSON File/i })).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<ExportModal onClose={mockOnClose} />);

    const closeBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('triggers Excel export and displays success feedback', async () => {
    render(<ExportModal onClose={mockOnClose} />);

    const excelBtn = screen.getByRole('button', { name: /Excel Spreadsheet \(\.xlsx\)/i });
    fireEvent.click(excelBtn);

    await waitFor(() => {
      expect(exportService.downloadExcelStructure).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.any(Object),
          entities: expect.any(Array),
          relationships: expect.any(Array),
        })
      );
      expect(screen.getByText(/Excel workbook \(\.xlsx\) downloaded successfully/i)).toBeInTheDocument();
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

  describe('Encrypted JSON Export & Import', () => {
    it('opens PasswordPromptModal on Save JSON File when encryption flag is enabled and saves encrypted file on password submit', async () => {
      render(<ExportModal onClose={mockOnClose} />);

      const saveBtn = screen.getByRole('button', { name: /Save JSON File/i });
      fireEvent.click(saveBtn);

      expect(screen.getByText('Encrypt Chart Backup')).toBeInTheDocument();

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/^Confirm Password$/i);

      fireEvent.change(passwordInput, { target: { value: 'SecretPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SecretPass123!' } });

      const submitBtn = screen.getByRole('button', { name: /Encrypt & Download/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(cryptoService.encryptChart).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.any(Object),
            entities: expect.any(Array),
            relationships: expect.any(Array),
          }),
          'SecretPass123!'
        );
        expect(exportService.downloadEncryptedJsonBackup).toHaveBeenCalledWith(
          '{"format":"jermchart-encrypted","mock":true}',
          'The Aurelius Dynasty Trust Structure'
        );
        expect(screen.getByText('Structure backup (.json) encrypted and saved.')).toBeInTheDocument();
        expect(screen.queryByText('Encrypt Chart Backup')).not.toBeInTheDocument();
      });
    });

    it('passes custom chart title to downloadEncryptedJsonBackup on encrypted export', async () => {
      useStructureStore.getState().setMetadata({ chartTitle: 'MyCustomTrust' });
      render(<ExportModal onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/^Confirm Password$/i);

      fireEvent.change(passwordInput, { target: { value: 'SecretPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SecretPass123!' } });

      fireEvent.click(screen.getByRole('button', { name: /Encrypt & Download/i }));

      await waitFor(() => {
        expect(exportService.downloadEncryptedJsonBackup).toHaveBeenCalledWith(
          '{"format":"jermchart-encrypted","mock":true}',
          'MyCustomTrust'
        );
      });
    });

    it('passes empty chart title to downloadEncryptedJsonBackup when chartTitle is empty', async () => {
      useStructureStore.getState().setMetadata({ chartTitle: '' });
      render(<ExportModal onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/^Confirm Password$/i);

      fireEvent.change(passwordInput, { target: { value: 'SecretPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SecretPass123!' } });

      fireEvent.click(screen.getByRole('button', { name: /Encrypt & Download/i }));

      await waitFor(() => {
        expect(exportService.downloadEncryptedJsonBackup).toHaveBeenCalledWith(
          '{"format":"jermchart-encrypted","mock":true}',
          ''
        );
      });
    });

    it('handles encryption failure and displays error inside password modal', async () => {
      vi.mocked(cryptoService.encryptChart).mockRejectedValueOnce(new Error('SubtleCrypto failure'));
      render(<ExportModal onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));

      const passwordInput = screen.getByLabelText(/^Password$/i);
      const confirmInput = screen.getByLabelText(/^Confirm Password$/i);

      fireEvent.change(passwordInput, { target: { value: 'Pass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'Pass123!' } });

      fireEvent.click(screen.getByRole('button', { name: /Encrypt & Download/i }));

      await waitFor(() => {
        expect(screen.getByText('SubtleCrypto failure')).toBeInTheDocument();
        expect(screen.getByText('Encrypt Chart Backup')).toBeInTheDocument();
      });
    });

    it('allows closing the password modal via Cancel button', () => {
      render(<ExportModal onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));
      expect(screen.getByText('Encrypt Chart Backup')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(screen.queryByText('Encrypt Chart Backup')).not.toBeInTheDocument();
    });

    it('downloads plaintext backup directly when enableJsonEncryption is false', () => {
      mockFeatureFlags = {
        enablePdfExport: false,
        enablePptxExport: false,
        enableJsonEncryption: false,
      };

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
      expect(screen.queryByText('Encrypt Chart Backup')).not.toBeInTheDocument();
    });

    it('detects encrypted envelope on upload, prompts for password, and decrypts structure', async () => {
      const mockChart = {
        metadata: { chartTitle: 'Decrypted Trust', effectiveDate: '2026-10-31', confidentialityNotice: 'Strict' },
        entities: [
          {
            id: 'ent-decrypted',
            name: 'Decrypted Holding Co',
            type: 'Operating Company' as const,
            jurisdiction: 'Nevada',
            status: 'Active' as const,
            directors: [],
          },
        ],
        relationships: [],
      };

      vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(true);
      vi.mocked(cryptoService.decryptChart).mockResolvedValue(mockChart);

      render(<ExportModal onClose={mockOnClose} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{"format":"jermchart-encrypted"}'], 'backup.json', {
        type: 'application/json',
      });

      const mockFileReaderInstance = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: '{"format":"jermchart-encrypted"}' } });
        }),
        onload: vi.fn(),
      };
      vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
        return mockFileReaderInstance as unknown as FileReader;
      } as any);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^Password$/i);
      fireEvent.change(passwordInput, { target: { value: 'SecretKey123!' } });

      const submitBtn = screen.getByRole('button', { name: /Decrypt & Load/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(cryptoService.decryptChart).toHaveBeenCalledWith(
          '{"format":"jermchart-encrypted"}',
          'SecretKey123!'
        );
        expect(useStructureStore.getState().entities[0].name).toBe('Decrypted Holding Co');
        expect(screen.getByText('Loaded 1 entities from encrypted backup.')).toBeInTheDocument();
        expect(screen.queryByText('Decrypt Chart Backup')).not.toBeInTheDocument();
      });
    });

    it('displays error in password modal when decryption fails and allows retry', async () => {
      const mockChart = {
        metadata: { chartTitle: 'Retry Trust', effectiveDate: '2026-10-31', confidentialityNotice: '' },
        entities: [
          {
            id: 'ent-retry',
            name: 'Retry Corp',
            type: 'Operating Company' as const,
            jurisdiction: 'Delaware',
            status: 'Active' as const,
            directors: [],
          },
        ],
        relationships: [],
      };

      vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(true);
      vi.mocked(cryptoService.decryptChart).mockRejectedValueOnce(
        new Error('Authentication failed - incorrect password or corrupted ciphertext')
      );

      render(<ExportModal onClose={mockOnClose} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{"format":"jermchart-encrypted"}'], 'backup.json', {
        type: 'application/json',
      });

      const mockFileReaderInstance = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: '{"format":"jermchart-encrypted"}' } });
        }),
        onload: vi.fn(),
      };
      vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
        return mockFileReaderInstance as unknown as FileReader;
      } as any);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
      });

      // Attempt 1: wrong password
      fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'WrongPass' } });
      fireEvent.click(screen.getByRole('button', { name: /Decrypt & Load/i }));

      await waitFor(() => {
        expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
        expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
      });

      // Attempt 2: correct password
      vi.mocked(cryptoService.decryptChart).mockResolvedValueOnce(mockChart);
      fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'RightPass' } });
      fireEvent.click(screen.getByRole('button', { name: /Decrypt & Load/i }));

      await waitFor(() => {
        expect(screen.getByText('Loaded 1 entities from encrypted backup.')).toBeInTheDocument();
        expect(screen.queryByText('Decrypt Chart Backup')).not.toBeInTheDocument();
      });
    });

    it('handles non-Error decryption rejection with fallback error message', async () => {
      vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(true);
      vi.mocked(cryptoService.decryptChart).mockRejectedValueOnce('string error');

      render(<ExportModal onClose={mockOnClose} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['{"format":"jermchart-encrypted"}'], 'backup.json', {
        type: 'application/json',
      });

      const mockFileReaderInstance = {
        readAsText: vi.fn(function (this: any) {
          this.onload({ target: { result: '{"format":"jermchart-encrypted"}' } });
        }),
        onload: vi.fn(),
      };
      vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
        return mockFileReaderInstance as unknown as FileReader;
      } as any);

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Decrypt Chart Backup')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'TestPass' } });
      fireEvent.click(screen.getByRole('button', { name: /Decrypt & Load/i }));

      await waitFor(() => {
        expect(screen.getByText('Incorrect password or corrupted file')).toBeInTheDocument();
      });
    });

    it('preserves stagedNodes from store during JSON export (both cleartext and encrypted)', async () => {
      useStructureStore.setState({
        stagedNodes: [
          {
            id: 'staged-1',
            kind: 'person',
            name: 'Jane Doe',
            position: { x: 50, y: 50 },
          },
        ],
      });

      // Test cleartext export preserves stagedNodes
      mockFeatureFlags.enableJsonEncryption = false;
      const { unmount } = render(<ExportModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));
      expect(exportService.downloadJsonBackup).toHaveBeenCalledWith(
        expect.objectContaining({
          stagedNodes: [
            expect.objectContaining({ id: 'staged-1', name: 'Jane Doe' }),
          ],
        })
      );
      unmount();

      // Test encrypted export preserves stagedNodes
      mockFeatureFlags.enableJsonEncryption = true;
      render(<ExportModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /Save JSON File/i }));
      fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Secret123' } });
      fireEvent.change(screen.getByLabelText(/^Confirm Password/i), { target: { value: 'Secret123' } });
      fireEvent.click(screen.getByRole('button', { name: /Encrypt & Download/i }));

      await waitFor(() => {
        expect(cryptoService.encryptChart).toHaveBeenCalledWith(
          expect.objectContaining({
            stagedNodes: [
              expect.objectContaining({ id: 'staged-1', name: 'Jane Doe' }),
            ],
          }),
          'Secret123'
        );
      });
    });
  });

  it('loads valid plaintext JSON structure via file upload without password prompt', async () => {
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

    vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(false);
    vi.mocked(exportService.parseJsonBackup).mockReturnValue(mockChart);

    render(<ExportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = new File([JSON.stringify(mockChart)], 'backup.json', {
      type: 'application/json',
    });

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
      expect(screen.queryByText(/Decrypt Chart Backup/i)).not.toBeInTheDocument();
    });
  });

  it('handles invalid JSON file upload gracefully', async () => {
    vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(false);
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
      expect(screen.getByText('Invalid Backup File')).toBeInTheDocument();
      expect(fileInput.value).toBe('');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));
    expect(screen.queryByText('Invalid Backup File')).not.toBeInTheDocument();
  });

  it('handles valid JSON that is neither encrypted nor valid chart backup', async () => {
    vi.mocked(cryptoService.isEncryptedEnvelope).mockReturnValue(false);
    vi.mocked(exportService.parseJsonBackup).mockReturnValue(null);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ExportModal onClose={mockOnClose} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{"random":"object"}'], 'bad.json', {
      type: 'application/json',
    });

    const mockFileReaderInstance = {
      readAsText: vi.fn(function (this: any) {
        this.onload({ target: { result: '{"random":"object"}' } });
      }),
      onload: vi.fn(),
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
      return mockFileReaderInstance as unknown as FileReader;
    } as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Invalid or corrupted structure file.');
      expect(screen.getByText('Invalid Backup File')).toBeInTheDocument();
    });
  });

  it('handles finally block when file input ref is null (modal unmounted during read)', async () => {
    const { unmount } = render(<ExportModal onClose={mockOnClose} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['{}'], 'data.json', { type: 'application/json' });

    let onLoadHandler: any;
    const mockFileReaderInstance = {
      readAsText: vi.fn(function (this: any) {
        onLoadHandler = this.onload;
      }),
      onload: vi.fn(),
    };
    vi.spyOn(window, 'FileReader').mockImplementation(function (this: any) {
      return mockFileReaderInstance as unknown as FileReader;
    } as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    unmount();
    onLoadHandler({ target: { result: '{}' } });
  });

  it('handles PNG and SVG export errors, including non-Error rejections', async () => {
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

  it('toggles setExportMode true during export and false after completion', async () => {
    const setExportModeSpy = vi.spyOn(useStructureStore.getState(), 'setExportMode');
    render(<ExportModal onClose={mockOnClose} />);

    const pngBtn = screen.getByRole('button', { name: /High-Resolution PNG/i });
    fireEvent.click(pngBtn);

    await waitFor(() => {
      expect(exportService.exportToImage).toHaveBeenCalled();
    });

    expect(setExportModeSpy).toHaveBeenCalledWith(true);
    expect(setExportModeSpy).toHaveBeenCalledWith(false);
  });

  it('hides Load JSON File button when isReadOnly is true', () => {
    useStructureStore.setState({ isReadOnly: true });
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByRole('button', { name: /Save JSON File/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load JSON File/i })).not.toBeInTheDocument();
  });

  describe('when PDF and PPTX feature flags are enabled', () => {
    beforeEach(() => {
      mockFeatureFlags = {
        enablePdfExport: true,
        enablePptxExport: true,
        enableJsonEncryption: false,
      };
    });

    it('renders PDF and PPTX export options', () => {
      render(<ExportModal onClose={mockOnClose} />);

      expect(screen.getByText(/Print-Ready PDF/i)).toBeInTheDocument();
      expect(screen.getByText(/PowerPoint \(\.pptx\)/i)).toBeInTheDocument();
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

    it('displays alert dialog when PDF export throws an error', async () => {
      vi.mocked(exportService.exportToPdf).mockRejectedValueOnce(new Error('PDF generation failed'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ExportModal onClose={mockOnClose} />);

      const pdfBtn = screen.getByRole('button', { name: /Print-Ready PDF/i });
      fireEvent.click(pdfBtn);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Export failed: PDF generation failed');
      });
    });

    it('displays alert dialog when PPTX export throws an error', async () => {
      vi.mocked(exportService.exportToPptx).mockRejectedValueOnce(new Error('PPTX failed'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ExportModal onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /PowerPoint \(\.pptx\)/i }));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Export failed: PPTX failed');
      });
    });
  });
});
