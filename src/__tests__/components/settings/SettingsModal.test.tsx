import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import {
  SettingsModal,
  resolveRestoredGeminiModel,
  resolveRestoredOllamaModel,
  resolveIsCustomOllama,
  resolveOllamaModelOnFetch,
  getCurrentGeminiModel,
  getCurrentOllamaModel,
} from '../../../components/settings/SettingsModal';
import * as aiConfig from '../../../services/ai/aiConfig';
import { CUSTOM_MODEL_VALUE } from '../../../services/ai/modelCatalog';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

const mockFetchOllamaModels = vi.fn();
const mockTestOllamaConnection = vi.fn();

vi.mock('../../../services/ai/ollamaService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../services/ai/ollamaService')>();
  return {
    ...actual,
    fetchOllamaModels: (...args: any[]) => mockFetchOllamaModels(...args),
    testOllamaConnection: (...args: any[]) => mockTestOllamaConnection(...args),
  };
});

describe('SettingsModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
    vi.clearAllMocks();
    mockFetchOllamaModels.mockResolvedValue([
      { name: 'llama3.2-vision:latest', isVisionCapable: true, size: 7900000000 },
      { name: 'qwen2.5-coder:7b', isVisionCapable: false, size: 4700000000 },
    ]);
    mockTestOllamaConnection.mockResolvedValue({
      success: true,
      message: 'Connected to Ollama. Model "llama3.2-vision:latest" is ready.',
    });
  });

  it('renders fiduciary disclaimer, api key input, and model dropdown fields', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    expect(screen.getByText(/ai provider & api keys/i)).toBeInTheDocument();
    expect(screen.getByText(/fiduciary privacy & enterprise disclaimer/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter gemini api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/google gemini vision model/i)).toBeInTheDocument();
  });

  it('saves configuration when Save Settings clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSy12345Test' } });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    expect(aiConfig.getAIConfig().apiKey).toBe('AIzaSy12345Test');
    expect(aiConfig.getAIConfig().model).toBe('gemini-3.8-flash');
    expect(onClose).toHaveBeenCalled();
  });

  it('allows selecting custom model and entering custom identifier', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const modelSelect = screen.getByLabelText(/google gemini vision model/i);
    fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });

    const customInput = screen.getByLabelText(/custom model identifier/i);
    expect(customInput).toBeInTheDocument();

    fireEvent.change(customInput, { target: { value: 'gemini-custom-experiment' } });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    expect(aiConfig.getAIConfig().model).toBe('gemini-custom-experiment');
    expect(onClose).toHaveBeenCalled();
  });

  it('recognizes previously saved custom model on modal open', () => {
    aiConfig.saveAIConfig({
      model: 'my-private-gemini-deployment',
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const customInput = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
    expect(customInput.value).toBe('my-private-gemini-deployment');
  });

  it('switches between predefined model options and clears custom state', () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const modelSelect = screen.getByLabelText(/google gemini vision model/i);
    fireEvent.change(modelSelect, { target: { value: 'gemini-3.7-flash' } });

    expect(screen.queryByLabelText(/custom model identifier/i)).not.toBeInTheDocument();
  });

  it('toggles password visibility for API key input', () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i) as HTMLInputElement;
    expect(keyInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /toggle api key visibility/i });
    fireEvent.click(toggleBtn);
    expect(keyInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(keyInput.type).toBe('password');
  });

  it('closes on Escape key press and Cancel button click', () => {
    const onClose = vi.fn();
    const { unmount } = render(<SettingsModal onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);

    unmount();
  });

  it('displays warning when testing connection with empty API key', async () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/please enter an api key first/i)).toBeInTheDocument();
    });
  });

  it('tests connection successfully with Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSyTestKey' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it('handles connection test failures with error message', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'bad-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('handles connection test failures with JSON error payload from Google GenAI', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error(
        JSON.stringify({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
          },
        })
      )
    );

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'bad-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/connection test failed: api key not valid\. please pass a valid api key\./i)
      ).toBeInTheDocument();
    });
  });

  it('handles connection test failures when error has no message', async () => {
    mockGenerateContent.mockRejectedValueOnce({});

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'bad-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: network error/i)).toBeInTheDocument();
    });
  });

  it('preserves existing custom model when selecting Custom Model dropdown again', () => {
    aiConfig.saveAIConfig({
      model: 'my-custom-model-id',
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const modelSelect = screen.getByLabelText(/google gemini vision model/i);
    fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });

    const customInput = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
    expect(customInput.value).toBe('my-custom-model-id');
  });

  it('tests connection with empty model falling back to gemini-3.8-flash default', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });

    render(<SettingsModal onClose={vi.fn()} />);

    const modelSelect = screen.getByLabelText(/google gemini vision model/i);
    fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });

    const customInput = screen.getByLabelText(/custom model identifier/i);
    fireEvent.change(customInput, { target: { value: '' } });

    const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSyTestKey' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
      })
    );
  });

  describe('Ollama Provider', () => {
    it('renders provider switcher and allows switching to Ollama', async () => {
      render(<SettingsModal onClose={vi.fn()} />);

      const ollamaBtn = screen.getByRole('button', { name: /ollama/i });
      expect(ollamaBtn).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(ollamaBtn);
      });

      expect(screen.getByText(/zero cloud egress/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ollama server url/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/enter gemini api key/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/fiduciary privacy & enterprise disclaimer/i)).not.toBeInTheDocument();
    });

    it('switches back from Ollama to Gemini cleanly', async () => {
      render(<SettingsModal onClose={vi.fn()} />);

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      });
      expect(screen.getByLabelText(/ollama server url/i)).toBeInTheDocument();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));
      });
      expect(screen.getByPlaceholderText(/enter gemini api key/i)).toBeInTheDocument();
      expect(screen.getByText(/fiduciary privacy & enterprise disclaimer/i)).toBeInTheDocument();
    });

    it('updates Ollama server URL on input change', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      });

      const urlInput = screen.getByLabelText(/ollama server url/i) as HTMLInputElement;
      expect(urlInput.value).toBe('http://localhost:11434');

      await act(async () => {
        fireEvent.change(urlInput, { target: { value: 'http://192.168.1.100:11434' } });
      });
      expect(urlInput.value).toBe('http://192.168.1.100:11434');
    });

    it('fetches Ollama models dynamically and displays [Vision] badges', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(mockFetchOllamaModels).toHaveBeenCalledWith('http://localhost:11434');
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i) as HTMLSelectElement;
      const options = Array.from(modelSelect.options).map((o) => o.text);

      expect(options).toContain('llama3.2-vision:latest [Vision]');
      expect(options).toContain('qwen2.5-coder:7b');
    });

    it('shows warning banner when a non-vision model is selected', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(modelSelect, { target: { value: 'qwen2.5-coder:7b' } });

      expect(
        screen.getByText(/selected model may lack image-understanding capabilities/i)
      ).toBeInTheDocument();
    });

    it('does not show warning banner when a vision model is selected', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(modelSelect, { target: { value: 'llama3.2-vision:latest' } });

      expect(
        screen.queryByText(/selected model may lack image-understanding capabilities/i)
      ).not.toBeInTheDocument();
    });

    it('handles empty models list or fetch failure with helpful message and fallback input', async () => {
      mockFetchOllamaModels.mockRejectedValueOnce(new Error('Connection refused'));

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/no models found at this url\. ensure ollama is running\./i)
        ).toBeInTheDocument();
      });

      const fallbackInput = screen.getByLabelText(/ollama model name/i) as HTMLInputElement;
      expect(fallbackInput).toBeInTheDocument();

      fireEvent.change(fallbackInput, { target: { value: 'my-custom-vision-fallback' } });
      expect(fallbackInput.value).toBe('my-custom-vision-fallback');
    });

    it('allows manual refresh of Ollama models via Refresh button', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(mockFetchOllamaModels).toHaveBeenCalledTimes(1);
      });

      const refreshBtn = screen.getByRole('button', { name: /refresh models/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockFetchOllamaModels).toHaveBeenCalledTimes(2);
      });
    });

    it('supports selecting custom model when models are loaded', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });

      const customInput = screen.getByLabelText(/custom model identifier/i);
      expect(customInput).toBeInTheDocument();

      fireEvent.change(customInput, { target: { value: 'my-custom-vision-model' } });
      expect((customInput as HTMLInputElement).value).toBe('my-custom-vision-model');
    });

    it('tests Ollama connection successfully', async () => {
      mockTestOllamaConnection.mockResolvedValueOnce({
        success: true,
        message: 'Connected to Ollama (version 0.5.7). Model "llama3.2-vision:latest" is ready.',
      });

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const testBtn = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/connected to ollama \(version 0\.5\.7\)\. model "llama3\.2-vision:latest" is ready\./i)
        ).toBeInTheDocument();
      });
    });

    it('handles Ollama connection test failure', async () => {
      mockTestOllamaConnection.mockResolvedValueOnce({
        success: false,
        message: 'Could not connect to Ollama at http://localhost:11434: Connection refused.',
      });

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      const testBtn = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/could not connect to ollama at http:\/\/localhost:11434: connection refused\./i)
        ).toBeInTheDocument();
      });
    });

    it('persists Ollama configuration on Save Settings', async () => {
      const onClose = vi.fn();
      render(<SettingsModal onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const urlInput = screen.getByLabelText(/ollama server url/i);
      fireEvent.change(urlInput, { target: { value: 'http://10.0.0.5:11434' } });

      const modelSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(modelSelect, { target: { value: 'llama3.2-vision:latest' } });

      const saveBtn = screen.getByRole('button', { name: /save settings/i });
      fireEvent.click(saveBtn);

      const saved = aiConfig.getAIConfig();
      expect(saved.provider).toBe('ollama');
      expect(saved.ollamaUrl).toBe('http://10.0.0.5:11434');
      expect(saved.model).toBe('llama3.2-vision:latest');
      expect(onClose).toHaveBeenCalled();
    });

    it('loads previously stored Ollama configuration on modal open', async () => {
      aiConfig.saveAIConfig({
        provider: 'ollama',
        ollamaUrl: 'http://192.168.1.55:11434',
        model: 'llama3.2-vision:latest',
      });

      render(<SettingsModal onClose={vi.fn()} />);

      const urlInput = screen.getByLabelText(/ollama server url/i) as HTMLInputElement;
      expect(urlInput.value).toBe('http://192.168.1.55:11434');

      await waitFor(() => {
        expect(mockFetchOllamaModels).toHaveBeenCalledWith('http://192.168.1.55:11434');
      });
    });

    it('ignores clicking the already active provider button', () => {
      render(<SettingsModal onClose={vi.fn()} />);

      const geminiBtn = screen.getByRole('button', { name: /google gemini/i });
      fireEvent.click(geminiBtn);

      expect(screen.getByLabelText(/google gemini vision model/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/ollama server url/i)).not.toBeInTheDocument();
    });

    it('recognizes previously saved custom model on modal open for Ollama', async () => {
      aiConfig.saveAIConfig({
        provider: 'ollama',
        model: 'my-custom-vision-ollama',
      });

      render(<SettingsModal onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/custom model identifier/i)).toBeInTheDocument();
      });

      const customInput = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
      expect(customInput.value).toBe('my-custom-vision-ollama');
    });

    it('normalizes untagged model to tagged model name when matching tag is returned by Ollama', async () => {
      aiConfig.saveAIConfig({
        provider: 'ollama',
        model: 'llama3.2-vision',
      });

      render(<SettingsModal onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i) as HTMLSelectElement;
      expect(modelSelect.value).toBe('llama3.2-vision:latest');
    });

    it('falls back to first model if no vision-capable models exist in Ollama response', async () => {
      mockFetchOllamaModels.mockResolvedValueOnce([
        { name: 'llama3:8b', isVisionCapable: false, size: 4000000000 },
        { name: 'mistral:7b', isVisionCapable: false, size: 4000000000 },
      ]);

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i) as HTMLSelectElement;
      expect(modelSelect.value).toBe('llama3:8b');
      expect(
        screen.getByText(/selected model may lack image-understanding capabilities/i)
      ).toBeInTheDocument();
    });

    it('shows vision warning in fallback mode when user types non-vision model and hides for vision model', async () => {
      mockFetchOllamaModels.mockResolvedValueOnce([]);

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/no models found at this url\. ensure ollama is running\./i)
        ).toBeInTheDocument();
      });

      const fallbackInput = screen.getByLabelText(/ollama model name/i);
      fireEvent.change(fallbackInput, { target: { value: 'qwen2.5-coder:7b' } });

      expect(
        screen.getByText(/selected model may lack image-understanding capabilities/i)
      ).toBeInTheDocument();

      fireEvent.change(fallbackInput, { target: { value: 'llama3.2-vision:latest' } });
      expect(
        screen.queryByText(/selected model may lack image-understanding capabilities/i)
      ).not.toBeInTheDocument();
    });

    it('handles switching to Ollama when ollamaUrl is empty and model does not start with gemini', async () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        ollamaUrl: '',
        model: 'custom-pretrained-model',
      });

      render(<SettingsModal onClose={vi.fn()} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      });

      const urlInput = screen.getByLabelText(/ollama server url/i) as HTMLInputElement;
      expect(urlInput.value).toBe('http://localhost:11434');
    });

    it('preserves existing model when switching to Gemini if it starts with gemini', async () => {
      aiConfig.saveAIConfig({
        provider: 'ollama',
        model: 'gemini-3.7-flash',
      });

      render(<SettingsModal onClose={vi.fn()} />);
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));
      });

      const modelSelect = screen.getByLabelText(/google gemini vision model/i) as HTMLSelectElement;
      expect(modelSelect.value).toBe('gemini-3.7-flash');
    });

    it('does not update model if provider switched away from ollama before fetch resolves', async () => {
      let resolveModels!: (val: any) => void;
      mockFetchOllamaModels.mockReturnValueOnce(
        new Promise((resolve) => {
          resolveModels = resolve;
        })
      );

      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));

      resolveModels([{ name: 'llama3.2-vision:latest', isVisionCapable: true, size: 1000 }]);

      await waitFor(() => {
        expect(screen.getByLabelText(/google gemini vision model/i)).toBeInTheDocument();
      });
    });

    it('preserves custom model when reselecting custom model from dropdown in Ollama', async () => {
      render(<SettingsModal onClose={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const modelSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });

      const customInput = screen.getByLabelText(/custom model identifier/i);
      fireEvent.change(customInput, { target: { value: 'my-custom-active-model' } });

      fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });
      expect((customInput as HTMLInputElement).value).toBe('my-custom-active-model');
    });
  });

  describe('Dual Provider Model Preservation', () => {
    it('preserves both Gemini and Ollama models when switching back and forth between tabs', async () => {
      const onClose = vi.fn();
      render(<SettingsModal onClose={onClose} />);

      // On Gemini tab: select gemini-3.7-flash
      const geminiSelect = screen.getByLabelText(/google gemini vision model/i);
      fireEvent.change(geminiSelect, { target: { value: 'gemini-3.7-flash' } });
      expect((geminiSelect as HTMLSelectElement).value).toBe('gemini-3.7-flash');

      // Switch to Ollama tab
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      // Select qwen2.5-coder:7b
      const ollamaSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(ollamaSelect, { target: { value: 'qwen2.5-coder:7b' } });
      expect((ollamaSelect as HTMLSelectElement).value).toBe('qwen2.5-coder:7b');

      // Switch back to Gemini tab
      fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));
      const geminiSelectBack = screen.getByLabelText(/google gemini vision model/i) as HTMLSelectElement;
      expect(geminiSelectBack.value).toBe('gemini-3.7-flash');

      // Switch back to Ollama tab
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      const ollamaSelectBack = screen.getByLabelText(/ollama model/i) as HTMLSelectElement;
      expect(ollamaSelectBack.value).toBe('qwen2.5-coder:7b');

      // Save settings
      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));
      expect(onClose).toHaveBeenCalled();

      const saved = aiConfig.getAIConfig();
      expect(saved.provider).toBe('ollama');
      expect(saved.model).toBe('qwen2.5-coder:7b');
      expect(saved.geminiModel).toBe('gemini-3.7-flash');
      expect(saved.ollamaModel).toBe('qwen2.5-coder:7b');
    });

    it('preserves custom model inputs when switching between tabs and saves both', async () => {
      const onClose = vi.fn();
      render(<SettingsModal onClose={onClose} />);

      // Gemini tab: select custom model
      const geminiSelect = screen.getByLabelText(/google gemini vision model/i);
      fireEvent.change(geminiSelect, { target: { value: CUSTOM_MODEL_VALUE } });
      const customGeminiInput = screen.getByLabelText(/custom model identifier/i);
      fireEvent.change(customGeminiInput, { target: { value: 'custom-gemini-preview' } });

      // Switch to Ollama tab
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/custom model identifier/i)).toBeInTheDocument();
      });

      // Ollama tab: enter custom model
      const customOllamaInput = screen.getByLabelText(/custom model identifier/i);
      fireEvent.change(customOllamaInput, { target: { value: 'custom-ollama-llama-vision' } });

      // Switch back to Gemini
      fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));
      const restoredCustomGemini = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
      expect(restoredCustomGemini.value).toBe('custom-gemini-preview');

      // Switch back to Ollama
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      const restoredCustomOllama = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
      expect(restoredCustomOllama.value).toBe('custom-ollama-llama-vision');

      // Switch back to Gemini and save
      fireEvent.click(screen.getByRole('button', { name: /google gemini/i }));
      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      const saved = aiConfig.getAIConfig();
      expect(saved.provider).toBe('gemini');
      expect(saved.model).toBe('custom-gemini-preview');
      expect(saved.geminiModel).toBe('custom-gemini-preview');
      expect(saved.ollamaModel).toBe('custom-ollama-llama-vision');
    });

    it('tests connection for the active provider tab with its respective model', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });

      render(<SettingsModal onClose={vi.fn()} />);

      // On Gemini tab
      const keyInput = screen.getByPlaceholderText(/enter gemini api key/i);
      fireEvent.change(keyInput, { target: { value: 'AIzaSyGeminiKey' } });

      const geminiSelect = screen.getByLabelText(/google gemini vision model/i);
      fireEvent.change(geminiSelect, { target: { value: 'gemini-3.7-flash' } });

      const testBtn = screen.getByRole('button', { name: /test connection/i });
      fireEvent.click(testBtn);

      await waitFor(() => {
        expect(mockGenerateContent).toHaveBeenCalledWith(
          expect.objectContaining({
            model: 'gemini-3.7-flash',
          })
        );
      });

      // Switch to Ollama tab
      fireEvent.click(screen.getByRole('button', { name: /ollama/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/ollama model/i)).toBeInTheDocument();
      });

      const ollamaSelect = screen.getByLabelText(/ollama model/i);
      fireEvent.change(ollamaSelect, { target: { value: 'qwen2.5-coder:7b' } });

      mockTestOllamaConnection.mockResolvedValueOnce({
        success: true,
        message: 'Connected to Ollama with qwen2.5-coder:7b',
      });

      fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

      await waitFor(() => {
        expect(mockTestOllamaConnection).toHaveBeenCalledWith(
          'http://localhost:11434',
          'qwen2.5-coder:7b'
        );
      });
    });

    it('preserves pre-existing ollamaModel when editing and saving Gemini settings', () => {
      aiConfig.saveAIConfig({
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        geminiModel: 'gemini-3.8-flash',
        ollamaModel: 'llava:latest',
      });

      const onClose = vi.fn();
      render(<SettingsModal onClose={onClose} />);

      const geminiSelect = screen.getByLabelText(/google gemini vision model/i);
      fireEvent.change(geminiSelect, { target: { value: 'gemini-3.1-pro-preview' } });

      fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

      const saved = aiConfig.getAIConfig();
      expect(saved.provider).toBe('gemini');
      expect(saved.model).toBe('gemini-3.1-pro-preview');
      expect(saved.geminiModel).toBe('gemini-3.1-pro-preview');
      expect(saved.ollamaModel).toBe('llava:latest');
    });
  });

  describe('SettingsModal Helper Functions', () => {
    it('resolves restored gemini model under different config states', () => {
      // Custom gemini model
      expect(
        resolveRestoredGeminiModel({
          provider: 'ollama',
          apiKey: '',
          model: 'llama3',
          ollamaUrl: '',
          geminiModel: 'gemini-3.7-flash',
        })
      ).toBe('gemini-3.7-flash');

      // Model starts with gemini
      expect(
        resolveRestoredGeminiModel({
          provider: 'ollama',
          apiKey: '',
          model: 'gemini-3.1-pro-preview',
          ollamaUrl: '',
          geminiModel: 'gemini-3.8-flash',
        })
      ).toBe('gemini-3.1-pro-preview');

      // Fallback
      expect(
        resolveRestoredGeminiModel({
          provider: 'ollama',
          apiKey: '',
          model: 'custom-ollama',
          ollamaUrl: '',
          geminiModel: '',
        })
      ).toBe('gemini-3.8-flash');
    });

    it('resolves restored ollama model under different states and model lists', () => {
      // Explicit ollamaModel
      expect(
        resolveRestoredOllamaModel(
          {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-3.8-flash',
            ollamaUrl: '',
            ollamaModel: 'llama3.2-vision',
          },
          []
        )
      ).toBe('llama3.2-vision');

      // Model does not start with gemini
      expect(
        resolveRestoredOllamaModel(
          {
            provider: 'gemini',
            apiKey: '',
            model: 'my-custom-local-model',
            ollamaUrl: '',
            ollamaModel: '',
          },
          []
        )
      ).toBe('my-custom-local-model');

      // Selects first vision model from loaded models
      expect(
        resolveRestoredOllamaModel(
          {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-3.8-flash',
            ollamaUrl: '',
            ollamaModel: '',
          },
          [
            { name: 'llama3:8b', isVisionCapable: false },
            { name: 'llama3.2-vision:latest', isVisionCapable: true },
          ]
        )
      ).toBe('llama3.2-vision:latest');

      // Selects first model if no vision model
      expect(
        resolveRestoredOllamaModel(
          {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-3.8-flash',
            ollamaUrl: '',
            ollamaModel: '',
          },
          [{ name: 'llama3:8b', isVisionCapable: false }]
        )
      ).toBe('llama3:8b');

      // Fallback empty
      expect(
        resolveRestoredOllamaModel(
          {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-3.8-flash',
            ollamaUrl: '',
            ollamaModel: '',
          },
          []
        )
      ).toBe('');
    });

    it('resolves custom ollama model state accurately', () => {
      expect(resolveIsCustomOllama('', [])).toBe(false);
      expect(resolveIsCustomOllama('llama3.2-vision', [])).toBe(false);
      expect(
        resolveIsCustomOllama('llama3.2-vision', [{ name: 'llama3.2-vision', isVisionCapable: true }])
      ).toBe(false);
      expect(
        resolveIsCustomOllama('unknown-custom-model', [{ name: 'llama3.2-vision', isVisionCapable: true }])
      ).toBe(true);
    });

    it('resolves ollama model on fetch callback', () => {
      // Non-ollama provider ignores
      expect(
        resolveOllamaModelOnFetch(
          { provider: 'gemini', apiKey: '', model: 'gemini-3.8-flash', ollamaUrl: '' },
          [{ name: 'llama3.2-vision', isVisionCapable: true }]
        )
      ).toBeNull();

      // Empty fetched list returns null
      expect(
        resolveOllamaModelOnFetch(
          { provider: 'ollama', apiKey: '', model: 'llama3.2-vision', ollamaUrl: '' },
          []
        )
      ).toBeNull();
    });

    it('gets current provider models with fallbacks', () => {
      expect(
        getCurrentGeminiModel({
          provider: 'gemini',
          apiKey: '',
          model: '',
          ollamaUrl: '',
          geminiModel: 'gemini-3.7-flash',
        })
      ).toBe('gemini-3.7-flash');

      expect(
        getCurrentGeminiModel({
          provider: 'gemini',
          apiKey: '',
          model: 'gemini-custom',
          ollamaUrl: '',
          geminiModel: '',
        })
      ).toBe('gemini-custom');

      expect(
        getCurrentGeminiModel({
          provider: 'gemini',
          apiKey: '',
          model: '',
          ollamaUrl: '',
          geminiModel: '',
        })
      ).toBe('gemini-3.8-flash');

      expect(
        getCurrentOllamaModel({
          provider: 'ollama',
          apiKey: '',
          model: '',
          ollamaUrl: '',
          ollamaModel: 'qwen2.5-coder:7b',
        })
      ).toBe('qwen2.5-coder:7b');

      expect(
        getCurrentOllamaModel({
          provider: 'ollama',
          apiKey: '',
          model: 'my-model',
          ollamaUrl: '',
          ollamaModel: '',
        })
      ).toBe('my-model');

      expect(
        getCurrentOllamaModel({
          provider: 'ollama',
          apiKey: '',
          model: '',
          ollamaUrl: '',
          ollamaModel: '',
        })
      ).toBe('');
    });
  });
});
