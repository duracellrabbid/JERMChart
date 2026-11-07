import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as PhotoImportModalModule from '../../../components/import/PhotoImportModal';
import { PhotoImportModal, ConfirmReplaceNotice, ProcessingView, ProviderSelectionSection, getInitialProvider } from '../../../components/import/PhotoImportModal';
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

vi.mock('../../../services/ai/chartVisionService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/ai/chartVisionService')>();
  return {
    ...actual,
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
  };
});

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

  it('displays error and does not close modal when analysis returns 0 entities', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    vi.mocked(chartVisionService.analyzeChartImage).mockResolvedValueOnce({
      chart: {
        metadata: { chartTitle: 'Empty', effectiveDate: '2026-09-21', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      },
      warnings: ['Analysis failed: No discernible structure chart image was provided.'],
    });

    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/no discernible structure chart image was provided/i)
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('displays default error message when analysis returns 0 entities and no warnings', async () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    vi.mocked(chartVisionService.analyzeChartImage).mockResolvedValueOnce({
      chart: {
        metadata: { chartTitle: 'Empty', effectiveDate: '2026-09-21', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      },
      warnings: [],
    });

    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/no entities could be identified from the uploaded chart image/i)
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('includes Ollama vision model hint when 0 entities returned for non-vision Ollama model', async () => {
    vi.spyOn(aiConfig, 'getAIConfig').mockReturnValue({
      provider: 'ollama',
      apiKey: '',
      model: 'gemma4:latest',
      ollamaUrl: 'http://localhost:11434',
    });
    vi.spyOn(aiConfig, 'hasValidAIConfig').mockReturnValue(true);

    vi.mocked(chartVisionService.analyzeChartImage).mockResolvedValueOnce({
      chart: {
        metadata: { chartTitle: 'Empty', effectiveDate: '2026-09-21', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      },
      warnings: ['No entities detected'],
    });

    const onClose = vi.fn();
    render(<PhotoImportModal onClose={onClose} onOpenSettings={vi.fn()} />);

    const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/may lack vision capabilities/i)
      ).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
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

  describe('Task 3: Provider Selection & Label UI', () => {
    it('shows provider label with model and hides selection controls when only Gemini is configured', () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        apiKey: 'test-gemini-key',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: '',
        ollamaModel: '',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      expect(screen.getByText(/using google gemini \(gemini-3\.8-flash\)/i)).toBeInTheDocument();
      expect(screen.queryByRole('radiogroup', { name: /select ai provider/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /ollama/i })).not.toBeInTheDocument();
    });

    it('shows provider label with model and hides selection controls when only Ollama is configured', () => {
      aiConfig.saveAIConfig({
        provider: 'ollama',
        apiKey: '',
        geminiModel: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      expect(screen.getByText(/using ollama \(llama3\.2-vision\)/i)).toBeInTheDocument();
      expect(screen.queryByRole('radiogroup', { name: /select ai provider/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: /google gemini/i })).not.toBeInTheDocument();
    });

    it('shows provider selector and active label when both providers are configured', () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        apiKey: 'test-gemini-key',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      expect(screen.getByText(/using google gemini \(gemini-3\.8-flash\)/i)).toBeInTheDocument();
      const radiogroup = screen.getByRole('radiogroup', { name: /select ai provider/i });
      expect(radiogroup).toBeInTheDocument();

      const geminiRadio = screen.getByRole('radio', { name: /google gemini/i });
      const ollamaRadio = screen.getByRole('radio', { name: /ollama/i });
      expect(geminiRadio).toHaveAttribute('aria-checked', 'true');
      expect(ollamaRadio).toHaveAttribute('aria-checked', 'false');
    });

    it('switches provider when clicked, updates status label, and persists selection', () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        apiKey: 'test-gemini-key',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      const ollamaRadio = screen.getByRole('radio', { name: /ollama/i });
      fireEvent.click(ollamaRadio);

      expect(screen.getByText(/using ollama \(llama3\.2-vision\)/i)).toBeInTheDocument();
      expect(ollamaRadio).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: /google gemini/i })).toHaveAttribute('aria-checked', 'false');

      expect(aiConfig.getAIConfig().provider).toBe('ollama');

      const geminiRadio = screen.getByRole('radio', { name: /google gemini/i });
      fireEvent.click(geminiRadio);

      expect(screen.getByText(/using google gemini \(gemini-3\.8-flash\)/i)).toBeInTheDocument();
      expect(geminiRadio).toHaveAttribute('aria-checked', 'true');
      expect(ollamaRadio).toHaveAttribute('aria-checked', 'false');
      expect(aiConfig.getAIConfig().provider).toBe('gemini');
    });

    it('routes inference with selected provider and its respective model in executeAnalysis', async () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        apiKey: 'test-gemini-key',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      // Switch provider to Ollama
      const ollamaRadio = screen.getByRole('radio', { name: /ollama/i });
      fireEvent.click(ollamaRadio);

      // Select image file
      const file = new File(['mock-img'], 'chart.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Click analyze
      const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(chartVisionService.analyzeChartImage).toHaveBeenCalledWith(
          'mockbase64',
          'image/jpeg',
          expect.objectContaining({
            provider: 'ollama',
            model: 'llama3.2-vision',
          }),
          expect.any(AbortSignal)
        );
      });
    });

    it('automatically falls back to configured provider if default config.provider is not configured', () => {
      // Saved provider is 'gemini', but gemini is unconfigured (empty key) while Ollama is configured
      aiConfig.saveAIConfig({
        provider: 'gemini',
        apiKey: '',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });

      render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);

      // Drops directly to upload UI (hasConfig is true) with Ollama active
      expect(screen.getByText(/upload hand-drawn structure chart/i)).toBeInTheDocument();
      expect(screen.getByText(/using ollama \(llama3\.2-vision\)/i)).toBeInTheDocument();
      expect(screen.queryByRole('radiogroup', { name: /select ai provider/i })).not.toBeInTheDocument();
    });

    it('renders ProviderSelectionSection directly and handles interaction and disabled state', () => {
      const onSelect = vi.fn();
      const mockConfig: aiConfig.AIConfig = {
        provider: 'gemini',
        apiKey: 'key',
        model: 'gemini-3.8-flash',
        geminiModel: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      };

      const { rerender } = render(
        <ProviderSelectionSection
          config={mockConfig}
          selectedProvider="gemini"
          onSelectProvider={onSelect}
          disabled={false}
        />
      );

      expect(screen.getByText(/using google gemini \(gemini-3\.8-flash\)/i)).toBeInTheDocument();
      const ollamaBtn = screen.getByRole('radio', { name: /ollama/i });
      fireEvent.click(ollamaBtn);
      expect(onSelect).toHaveBeenCalledWith('ollama');

      const geminiBtn = screen.getByRole('radio', { name: /google gemini/i });
      fireEvent.click(geminiBtn);
      expect(onSelect).toHaveBeenCalledWith('gemini');

      // Test disabled state
      rerender(
        <ProviderSelectionSection
          config={mockConfig}
          selectedProvider="gemini"
          onSelectProvider={onSelect}
          disabled={true}
        />
      );

      const disabledGeminiBtn = screen.getByRole('radio', { name: /google gemini/i });
      expect(disabledGeminiBtn).toBeDisabled();
      expect(screen.getByRole('radio', { name: /ollama/i })).toBeDisabled();
    });

    it('getInitialProvider correctly resolves initial provider in all scenarios', () => {
      // Both ready, provider is gemini
      expect(
        getInitialProvider({
          provider: 'gemini',
          apiKey: 'k',
          model: 'm',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'g',
          ollamaModel: 'o',
        })
      ).toBe('gemini');

      // Both ready, provider is ollama
      expect(
        getInitialProvider({
          provider: 'ollama',
          apiKey: 'k',
          model: 'm',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'g',
          ollamaModel: 'o',
        })
      ).toBe('ollama');

      // Only gemini ready, provider was set to ollama
      expect(
        getInitialProvider({
          provider: 'ollama',
          apiKey: 'k',
          model: 'm',
          ollamaUrl: '',
          geminiModel: 'g',
          ollamaModel: '',
        })
      ).toBe('gemini');

      // Only ollama ready, provider was set to gemini
      expect(
        getInitialProvider({
          provider: 'gemini',
          apiKey: '',
          model: 'm',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: '',
          ollamaModel: 'o',
        })
      ).toBe('ollama');

      // Neither ready
      expect(
        getInitialProvider({
          provider: 'gemini',
          apiKey: '',
          model: '',
          ollamaUrl: '',
          geminiModel: '',
          ollamaModel: '',
        })
      ).toBe('gemini');
    });
  });

  describe('Enterprise OCR Mode', () => {
    it('renders EnterpriseConfigRequiredNotice when enterpriseOcr status has no configured provider', () => {
      const mockOnClose = vi.fn();
      const mockOnOpenSettings = vi.fn();
      const unconfiguredAdapter: aiConfig.EnterpriseOcrAdapter = {
        status: {
          gemini_configured: false,
          ollama_configured: false,
          gemini_model: null,
          ollama_model: null,
          default_provider: 'gemini',
        },
        onAnalyzeImage: vi.fn(),
      };

      render(
        <PhotoImportModal
          onClose={mockOnClose}
          onOpenSettings={mockOnOpenSettings}
          enterpriseOcr={unconfiguredAdapter}
        />
      );

      expect(screen.getByText(/AI OCR Not Configured/i)).toBeInTheDocument();
      expect(
        screen.getByText(/AI OCR has not been configured for your organization/i)
      ).toBeInTheDocument();
      // Must NOT display settings gear or "Configure in Settings" button
      expect(screen.queryByRole('button', { name: /configure/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /settings/i })).not.toBeInTheDocument();
    });

    it('renders single configured provider badge and calls onAnalyzeImage on analyze', async () => {
      const mockOnClose = vi.fn();
      const mockAnalyze = vi.fn().mockResolvedValue({
        chart: {
          metadata: { chartTitle: 'Enterprise Trust', effectiveDate: '2026-11-07', confidentialityNotice: '' },
          entities: [
            { id: 'ent-1', name: 'Alpha Ltd', type: 'Operating Company', jurisdiction: 'UK', status: 'Active', associatedParties: [] },
          ],
          relationships: [],
        },
        warnings: [],
      });

      const singleProviderAdapter: aiConfig.EnterpriseOcrAdapter = {
        status: {
          gemini_configured: true,
          ollama_configured: false,
          gemini_model: 'gemini-3.8-flash',
          ollama_model: null,
          default_provider: 'gemini',
        },
        onAnalyzeImage: mockAnalyze,
      };

      render(
        <PhotoImportModal
          onClose={mockOnClose}
          onOpenSettings={vi.fn()}
          enterpriseOcr={singleProviderAdapter}
        />
      );

      // Verify active provider banner showing model badge
      expect(screen.getByText(/Organization Vision AI/i)).toBeInTheDocument();
      expect(screen.getByText(/gemini-3.8-flash/i)).toBeInTheDocument();
      // Should not have radio toggle when only one provider is configured
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();

      // Upload file and click analyze
      const file = new File(['img-bytes'], 'chart.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(mockAnalyze).toHaveBeenCalledTimes(1);
      });

      expect(mockAnalyze).toHaveBeenCalledWith(
        'mockbase64',
        'image/jpeg',
        'gemini',
        expect.any(AbortSignal)
      );
      expect(mockOnClose).toHaveBeenCalled();
      expect(useStructureStore.getState().entities).toHaveLength(1);
      expect(useStructureStore.getState().entities[0].name).toBe('Alpha Ltd');
    });

    it('handles raw JSON string response from onAnalyzeImage in enterprise mode', async () => {
      const mockOnClose = vi.fn();
      const mockAnalyze = vi.fn().mockResolvedValue({
        raw_json: JSON.stringify({
          chartTitle: 'From Backend OCR',
          entities: [
            { tempId: 't1', name: 'Raw Enterprise Entity', type: 'LLC', jurisdiction: 'Delaware', status: 'Active' },
          ],
          relationships: [],
        }),
      });

      const singleProviderAdapter: aiConfig.EnterpriseOcrAdapter = {
        status: {
          gemini_configured: false,
          ollama_configured: true,
          gemini_model: null,
          ollama_model: 'llama3.2-vision:latest',
          default_provider: 'ollama',
        },
        onAnalyzeImage: mockAnalyze,
      };

      render(
        <PhotoImportModal
          onClose={mockOnClose}
          onOpenSettings={vi.fn()}
          enterpriseOcr={singleProviderAdapter}
        />
      );

      expect(screen.getByText(/llama3.2-vision:latest/i)).toBeInTheDocument();

      const file = new File(['img-bytes'], 'chart.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });

      expect(mockAnalyze).toHaveBeenCalledWith(
        'mockbase64',
        'image/jpeg',
        'ollama',
        expect.any(AbortSignal)
      );
      expect(useStructureStore.getState().entities).toHaveLength(1);
      expect(useStructureStore.getState().entities[0].name).toBe('Raw Enterprise Entity');
    });

    it('renders provider selection radio group when both providers are configured and allows switching', async () => {
      const mockAnalyze = vi.fn().mockResolvedValue({
        chart: {
          metadata: { chartTitle: 'Dual Provider Chart', effectiveDate: '2026-11-07', confidentialityNotice: '' },
          entities: [{ id: 'ent-1', name: 'Dual Entity', type: 'Trust', jurisdiction: 'BVI', status: 'Active', associatedParties: [] }],
          relationships: [],
        },
        warnings: [],
      });

      const dualProviderAdapter: aiConfig.EnterpriseOcrAdapter = {
        status: {
          gemini_configured: true,
          ollama_configured: true,
          gemini_model: 'gemini-3.8-flash',
          ollama_model: 'llama3.2-vision',
          default_provider: 'gemini',
        },
        onAnalyzeImage: mockAnalyze,
      };

      render(
        <PhotoImportModal
          onClose={vi.fn()}
          onOpenSettings={vi.fn()}
          enterpriseOcr={dualProviderAdapter}
        />
      );

      const radioGroup = screen.getByRole('radiogroup', { name: /select enterprise vision provider/i });
      expect(radioGroup).toBeInTheDocument();

      const geminiRadio = screen.getByRole('radio', { name: /google gemini/i });
      const ollamaRadio = screen.getByRole('radio', { name: /ollama/i });

      expect(geminiRadio).toHaveAttribute('aria-checked', 'true');
      expect(ollamaRadio).toHaveAttribute('aria-checked', 'false');

      // Click Ollama radio
      fireEvent.click(ollamaRadio);
      expect(ollamaRadio).toHaveAttribute('aria-checked', 'true');
      expect(geminiRadio).toHaveAttribute('aria-checked', 'false');

      // Upload and analyze
      const file = new File(['img'], 'dual.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(mockAnalyze).toHaveBeenCalledTimes(1);
      });

      expect(mockAnalyze).toHaveBeenCalledWith(
        'mockbase64',
        'image/jpeg',
        'ollama',
        expect.any(AbortSignal)
      );
    });

    it('handles enterprise OCR analysis errors gracefully and shows error message', async () => {
      const mockAnalyze = vi.fn().mockRejectedValue(new Error('Enterprise OCR service unavailable'));

      const adapter: aiConfig.EnterpriseOcrAdapter = {
        status: {
          gemini_configured: true,
          ollama_configured: false,
          gemini_model: 'gemini-3.8-flash',
          ollama_model: null,
          default_provider: 'gemini',
        },
        onAnalyzeImage: mockAnalyze,
      };

      render(
        <PhotoImportModal
          onClose={vi.fn()}
          onOpenSettings={vi.fn()}
          enterpriseOcr={adapter}
        />
      );

      const file = new File(['img'], 'err.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/upload photo/i, { selector: 'input' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      const analyzeBtn = screen.getByRole('button', { name: /analyze & create chart/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByText(/Enterprise OCR service unavailable/i)).toBeInTheDocument();
      });
    });

    it('covers all helper functions for Enterprise OCR', () => {
      // isEnterpriseGeminiReady
      expect(PhotoImportModalModule.isEnterpriseGeminiReady(null)).toBe(false);
      expect(PhotoImportModalModule.isEnterpriseGeminiReady(undefined)).toBe(false);
      expect(PhotoImportModalModule.isEnterpriseGeminiReady({ geminiConfigured: true })).toBe(true);
      expect(PhotoImportModalModule.isEnterpriseGeminiReady({ gemini_configured: false })).toBe(false);

      // isEnterpriseOllamaReady
      expect(PhotoImportModalModule.isEnterpriseOllamaReady(null)).toBe(false);
      expect(PhotoImportModalModule.isEnterpriseOllamaReady(undefined)).toBe(false);
      expect(PhotoImportModalModule.isEnterpriseOllamaReady({ ollamaConfigured: true })).toBe(true);
      expect(PhotoImportModalModule.isEnterpriseOllamaReady({ ollama_configured: false })).toBe(false);

      // getEnterpriseGeminiModel
      expect(PhotoImportModalModule.getEnterpriseGeminiModel(null)).toBe('gemini-3.8-flash');
      expect(PhotoImportModalModule.getEnterpriseGeminiModel({})).toBe('gemini-3.8-flash');
      expect(PhotoImportModalModule.getEnterpriseGeminiModel({ geminiModel: 'custom-gemini' })).toBe('custom-gemini');
      expect(PhotoImportModalModule.getEnterpriseGeminiModel({ gemini_model: 'custom-gemini-2' })).toBe('custom-gemini-2');

      // getEnterpriseOllamaModel
      expect(PhotoImportModalModule.getEnterpriseOllamaModel(null)).toBe('llama3.2-vision');
      expect(PhotoImportModalModule.getEnterpriseOllamaModel({})).toBe('llama3.2-vision');
      expect(PhotoImportModalModule.getEnterpriseOllamaModel({ ollamaModel: 'custom-ollama' })).toBe('custom-ollama');
      expect(PhotoImportModalModule.getEnterpriseOllamaModel({ ollama_model: 'custom-ollama-2' })).toBe('custom-ollama-2');

      // getEnterpriseInitialProvider
      expect(PhotoImportModalModule.getEnterpriseInitialProvider(null)).toBe('gemini');
      expect(PhotoImportModalModule.getEnterpriseInitialProvider({})).toBe('gemini');
      expect(
        PhotoImportModalModule.getEnterpriseInitialProvider({
          gemini_configured: true,
          ollama_configured: true,
          default_provider: 'ollama',
        })
      ).toBe('ollama');
      expect(
        PhotoImportModalModule.getEnterpriseInitialProvider({
          gemini_configured: true,
          ollama_configured: true,
          defaultProvider: 'gemini',
        })
      ).toBe('gemini');
      expect(
        PhotoImportModalModule.getEnterpriseInitialProvider({
          gemini_configured: false,
          ollama_configured: true,
          default_provider: 'gemini',
        })
      ).toBe('ollama');
      expect(
        PhotoImportModalModule.getEnterpriseInitialProvider({
          gemini_configured: true,
          ollama_configured: false,
          default_provider: 'ollama',
        })
      ).toBe('gemini');
      expect(
        PhotoImportModalModule.getEnterpriseInitialProvider({
          gemini_configured: false,
          ollama_configured: false,
          default_provider: 'ollama',
        })
      ).toBe('ollama');

      // parseEnterpriseOcrResult edge cases
      expect(() => PhotoImportModalModule.parseEnterpriseOcrResult(null)).toThrow(
        /Enterprise OCR returned an empty or invalid response/i
      );
      expect(() => PhotoImportModalModule.parseEnterpriseOcrResult('invalid')).toThrow(
        /Enterprise OCR returned an empty or invalid response/i
      );
      expect(() => PhotoImportModalModule.parseEnterpriseOcrResult({ foo: 'bar' })).toThrow(
        /Enterprise OCR returned an unexpected payload structure/i
      );

      // parseEnterpriseOcrResult with warnings not provided or empty
      const chartWithoutWarnings = PhotoImportModalModule.parseEnterpriseOcrResult({
        chart: {
          metadata: { chartTitle: 'No Warnings', effectiveDate: '2026-11-07', confidentialityNotice: '' },
          entities: [],
          relationships: [],
        },
      });
      expect(chartWithoutWarnings.warnings).toEqual([]);

      // parseEnterpriseOcrResult with non-array warnings
      const chartWithNonArrayWarnings = PhotoImportModalModule.parseEnterpriseOcrResult({
        chart: {
          metadata: { chartTitle: 'Non-Array Warnings', effectiveDate: '2026-11-07', confidentialityNotice: '' },
          entities: [],
          relationships: [],
        },
        warnings: 'not-an-array',
      });
      expect(chartWithNonArrayWarnings.warnings).toEqual([]);

      // EnterpriseProviderSection direct test
      const onSelect = vi.fn();
      const { rerender } = render(
        <PhotoImportModalModule.EnterpriseProviderSection
          status={{
            gemini_configured: true,
            ollama_configured: true,
            gemini_model: 'g-model',
            ollama_model: 'o-model',
          }}
          selectedProvider="gemini"
          onSelectProvider={onSelect}
          disabled={false}
        />
      );
      const geminiBtn = screen.getByRole('radio', { name: /google gemini/i });
      fireEvent.click(geminiBtn);
      expect(onSelect).toHaveBeenCalledWith('gemini');

      // EnterpriseProviderSection with selectedProvider = 'ollama'
      rerender(
        <PhotoImportModalModule.EnterpriseProviderSection
          status={{
            gemini_configured: true,
            ollama_configured: true,
            gemini_model: 'g-model',
            ollama_model: 'o-model',
          }}
          selectedProvider="ollama"
          onSelectProvider={onSelect}
          disabled={false}
        />
      );
      expect(screen.getByText(/Using Ollama \(o-model\)/i)).toBeInTheDocument();
    });
  });
});
