import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoImportModal } from '../../../components/import/PhotoImportModal';
import * as aiConfig from '../../../services/ai/aiConfig';
import * as imagePreprocessing from '../../../utils/imagePreprocessing';
import * as chartVisionService from '../../../services/ai/chartVisionService';
import { useStructureStore } from '../../../store/useStructureStore';

vi.mock('../../../utils/imagePreprocessing', () => ({
  preprocessImageFile: vi.fn().mockResolvedValue({
    base64Data: 'mockbase64',
    mimeType: 'image/jpeg',
    previewUrl: 'data:image/jpeg;base64,mockbase64',
  }),
}));

vi.mock('../../../services/ai/chartVisionService', () => ({
  analyzeChartImage: vi.fn().mockResolvedValue({
    chart: {
      metadata: { chartTitle: 'Inferred Chart', effectiveDate: '2026-09-21', confidentialityNotice: '' },
      entities: [
        { id: 'new-1', name: 'Inferred Trust', type: 'Trust', jurisdiction: 'Jersey', status: 'Active', directors: [] },
      ],
      relationships: [],
    },
    warnings: ['Illegible note on Trustee'],
  }),
}));

describe('PhotoImportModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
    useStructureStore.setState({ entities: [], relationships: [] });
    vi.clearAllMocks();
  });

  it('prompts to configure API key when none exists', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText(/api key required/i)).toBeInTheDocument();
    const configBtn = screen.getByRole('button', { name: /configure api key/i });
    fireEvent.click(configBtn);

    expect(onOpenSettings).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows upload dropzone when API key is present', () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    expect(screen.getByText(/upload hand-drawn structure chart/i)).toBeInTheDocument();
  });

  it('handles file selection, analyzes photo, and updates structure store', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('chart.png')).toBeInTheDocument();

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(imagePreprocessing.preprocessImageFile).toHaveBeenCalledWith(file);
      expect(chartVisionService.analyzeChartImage).toHaveBeenCalled();
      expect(useStructureStore.getState().entities[0].name).toBe('Inferred Trust');
      expect(useStructureStore.getState().ocrReviewState?.summary).toContain('Inferred 1 entities');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('prompts confirmation when existing entities exist on canvas', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    useStructureStore.setState({
      entities: [{ id: 'e1', name: 'Existing Entity', type: 'Holding Company', jurisdiction: 'BVI', status: 'Active', directors: [] }],
    });

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    expect(screen.getByText(/replace current canvas chart\?/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /replace & continue/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(useStructureStore.getState().undoSnapshot?.entities[0].name).toBe('Existing Entity');
    });
  });

  it('displays error message when analysis fails', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    vi.mocked(chartVisionService.analyzeChartImage).mockRejectedValueOnce(new Error('AI Quota Exceeded'));

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/ai quota exceeded/i)).toBeInTheDocument();
    });
  });

  it('handles escape key, close button click, and non-escape keys', () => {
    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles drag over, drag leave, drop, and file input click via dropzone', () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const dropzone = screen.getByText(/upload hand-drawn structure chart/i).closest('div')!;
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' }) as HTMLInputElement;
    const inputClickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.dragOver(dropzone);
    fireEvent.dragLeave(dropzone);

    // Click dropzone to trigger input click
    fireEvent.click(dropzone);
    expect(inputClickSpy).toHaveBeenCalled();

    // Drop without file
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [] },
    });

    // Drop with .heic file (previewUrl set to null)
    const heicFile = new File(['mock-heic'], 'chart.heic', { type: 'image/heic' });
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [heicFile] },
    });
    expect(screen.getByText('chart.heic')).toBeInTheDocument();
    expect(screen.queryByAltText(/selected diagram preview/i)).not.toBeInTheDocument();
  });

  it('allows canceling replace confirmation dialog', () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    useStructureStore.setState({
      entities: [{ id: 'e1', name: 'Existing Entity', type: 'Holding Company', jurisdiction: 'BVI', status: 'Active', directors: [] }],
    });

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    expect(screen.getByText(/replace current canvas chart\?/i)).toBeInTheDocument();

    const cancelReplaceBtn = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelReplaceBtn);

    expect(screen.queryByText(/replace current canvas chart\?/i)).not.toBeInTheDocument();
  });

  it('handles empty input file change and non-Error analysis failure', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    vi.mocked(chartVisionService.analyzeChartImage).mockRejectedValueOnce('Network failure string');

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    // Empty files change
    fireEvent.change(fileInput, { target: { files: [] } });

    // Now select valid file and fail with string error
    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/failed to analyze photo\. please check your api key/i)
      ).toBeInTheDocument();
    });
  });
});
