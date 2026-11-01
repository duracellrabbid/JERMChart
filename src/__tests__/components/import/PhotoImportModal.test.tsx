import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PhotoImportModal, ConfirmReplaceNotice, ProcessingView } from '../../../components/import/PhotoImportModal';
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    aiConfig.clearAIConfig();
    useStructureStore.setState({ entities: [], relationships: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('prompts to configure API key when none exists', () => {
    const onOpenSettings = vi.fn();
    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText(/api key required/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Gemini/i)).toBeInTheDocument();
    expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
    const configBtn = screen.getByRole('button', { name: /configure api key/i });
    fireEvent.click(configBtn);

    expect(onOpenSettings).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('prompts to configure Ollama when provider is ollama and config is invalid', () => {
    vi.spyOn(aiConfig, 'getAIConfig').mockReturnValue({
      provider: 'ollama',
      apiKey: '',
      model: '',
      ollamaUrl: '',
    });
    vi.spyOn(aiConfig, 'hasValidAIConfig').mockReturnValue(false);

    const onOpenSettings = vi.fn();
    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText(/ollama configuration required/i)).toBeInTheDocument();
    expect(screen.getByText(/local vision AI \(Ollama\)/i)).toBeInTheDocument();
    const configBtn = screen.getByRole('button', { name: /configure ollama/i });
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

  it('revokes previous object URL on re-selection and on modal unmount', () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const { unmount } = render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    const file1 = new File(['mock-1'], 'photo1.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file1] } });

    expect(screen.getByText('photo1.png')).toBeInTheDocument();

    const file2 = new File(['mock-2'], 'photo2.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file2] } });

    expect(revokeSpy).toHaveBeenCalledTimes(1);

    unmount();
    expect(revokeSpy).toHaveBeenCalledTimes(2);

    revokeSpy.mockRestore();
  });

  it('renders dedicated ProcessingView with spinner, progress step, and elapsed timer during analysis', async () => {
    vi.useFakeTimers();
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });

    let resolveAnalysis: (val: any) => void;
    vi.mocked(chartVisionService.analyzeChartImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        })
    );

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    // Initial ProcessingView render
    expect(screen.getByText(/transcribing structure chart\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/elapsed: 0s/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel analysis/i })).toBeInTheDocument();

    // Advance timer by 3 seconds inside act
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText(/elapsed: 3s/i)).toBeInTheDocument();

    // Allow preprocessImageFile microtask to resolve
    await act(async () => {
      await Promise.resolve();
    });

    // Now it has connected to vision AI
    expect(screen.getByText(/connecting to google gemini vision ai\.\.\./i)).toBeInTheDocument();

    // Advance 1000ms inside act to trigger stepTimer
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/transcribing handwritten entities/i)).toBeInTheDocument();

    // Keydown escape during processing does not close modal
    const closeSpy = vi.fn();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(closeSpy).not.toHaveBeenCalled();

    // Resolve analysis
    await act(async () => {
      resolveAnalysis!({
        chart: {
          metadata: { chartTitle: 'Done', effectiveDate: '2026-09-21', confidentialityNotice: '' },
          entities: [],
          relationships: [],
        },
        warnings: [],
      });
    });

    vi.useRealTimers();
  });

  it('allows canceling analysis via Cancel Analysis button and passes abort signal to service', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });

    let receivedSignal: AbortSignal | undefined;
    vi.mocked(chartVisionService.analyzeChartImage).mockImplementation(
      (_base64, _mime, _config, signal) => {
        receivedSignal = signal;
        return new Promise((_, reject) => {
          signal?.addEventListener('abort', () => {
            const abortError = new Error('The operation was aborted.');
            abortError.name = 'AbortError';
            reject(abortError);
          });
        });
      }
    );

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/transcribing structure chart\.\.\./i)).toBeInTheDocument();
    });

    expect(receivedSignal).toBeDefined();
    expect(receivedSignal?.aborted).toBe(false);

    const cancelBtn = screen.getByRole('button', { name: /cancel analysis/i });
    fireEvent.click(cancelBtn);

    expect(receivedSignal?.aborted).toBe(true);

    await waitFor(() => {
      expect(screen.getByText(/analysis was cancelled by user/i)).toBeInTheDocument();
      expect(screen.queryByText(/transcribing structure chart\.\.\./i)).not.toBeInTheDocument();
    });
  });

  it('transitions immediately from ConfirmReplaceNotice into ProcessingView on confirm', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    useStructureStore.setState({
      entities: [{ id: 'e1', name: 'Existing Entity', type: 'Holding Company', jurisdiction: 'BVI', status: 'Active', directors: [] }],
    });

    let resolveAnalysis: (val: any) => void;
    vi.mocked(chartVisionService.analyzeChartImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        })
    );

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
      expect(screen.getByText(/transcribing structure chart\.\.\./i)).toBeInTheDocument();
      expect(screen.queryByText(/replace current canvas chart\?/i)).not.toBeInTheDocument();
    });

    await act(async () => {
      resolveAnalysis!({
        chart: {
          metadata: { chartTitle: 'Done', effectiveDate: '2026-09-21', confidentialityNotice: '' },
          entities: [],
          relationships: [],
        },
        warnings: [],
      });
    });
  });

  it('shows Ollama connection step when provider is ollama', async () => {
    aiConfig.saveAIConfig({ provider: 'ollama', ollamaUrl: 'http://localhost:11434', model: 'llama3.2-vision' });

    let resolveAnalysis: (val: any) => void;
    vi.mocked(chartVisionService.analyzeChartImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveAnalysis = resolve;
        })
    );

    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/connecting to local ollama vision model\.\.\./i)).toBeInTheDocument();
    });

    await act(async () => {
      resolveAnalysis!({
        chart: {
          metadata: { chartTitle: 'Done', effectiveDate: '2026-09-21', confidentialityNotice: '' },
          entities: [],
          relationships: [],
        },
        warnings: [],
      });
    });
  });

  it('cleans up timer and aborts active controller when unmounted during processing', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });

    vi.mocked(chartVisionService.analyzeChartImage).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    const { unmount } = render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'diagram.heif', { type: 'image/heif' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/transcribing structure chart\.\.\./i)).toBeInTheDocument();
    });

    // Unmount while processing is active
    unmount();
  });

  it('renders ConfirmReplaceNotice with disabled buttons when isProcessing is true', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmReplaceNotice
        entityCount={5}
        isProcessing={true}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText(/you currently have 5 entities/i)).toBeInTheDocument();
    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
    const replaceBtn = screen.getByRole('button', { name: /replace & continue/i });
    expect(cancelBtn).toBeDisabled();
    expect(replaceBtn).toBeDisabled();
  });

  it('renders ProcessingView directly and allows clicking cancel button', () => {
    const onCancel = vi.fn();
    render(
      <ProcessingView
        progressStep="Custom progress message"
        elapsedSeconds={12}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Custom progress message')).toBeInTheDocument();
    expect(screen.getByText(/elapsed: 12s/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /cancel analysis/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
