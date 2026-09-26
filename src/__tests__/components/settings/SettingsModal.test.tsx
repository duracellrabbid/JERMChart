import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../../../components/settings/SettingsModal';
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

const mockChatCompletionsCreate = vi.fn();
let capturedSettingsOpenAIOptions: any = null;
vi.mock('openai', () => ({
  default: class MockOpenAI {
    chat = {
      completions: {
        create: mockChatCompletionsCreate,
      },
    };
    constructor(public options: any) {
      capturedSettingsOpenAIOptions = options;
    }
  },
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
    vi.clearAllMocks();
    capturedSettingsOpenAIOptions = null;
  });

  it('renders provider selection, api key input, and model dropdown fields', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    expect(screen.getByText(/ai provider & api keys/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^model$/i)).toBeInTheDocument();
  });

  it('saves configuration when Save Settings clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSy12345Test' } });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    expect(aiConfig.getAIConfig().apiKey).toBe('AIzaSy12345Test');
    expect(aiConfig.getAIConfig().model).toBe('gemini-3.8-flash');
    expect(onClose).toHaveBeenCalled();
  });

  it('switches default model when provider changes', () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const providerSelect = screen.getByLabelText(/provider/i);
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    const modelSelect = screen.getByLabelText(/^model$/i) as HTMLSelectElement;
    expect(modelSelect.value).toBe('gpt-5.2');

    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    expect(modelSelect.value).toBe('gemini-3.8-flash');
  });

  it('allows selecting custom model and entering custom identifier', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const modelSelect = screen.getByLabelText(/^model$/i);
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
      provider: 'openai',
      model: 'my-private-gpt-deployment',
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const modelSelect = screen.getByLabelText(/^model$/i) as HTMLSelectElement;
    expect(modelSelect.value).toBe(CUSTOM_MODEL_VALUE);

    const customInput = screen.getByLabelText(/custom model identifier/i) as HTMLInputElement;
    expect(customInput.value).toBe('my-private-gpt-deployment');
  });

  it('toggles password visibility', () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i) as HTMLInputElement;
    expect(keyInput.type).toBe('password');

    const toggleBtn = screen.getByRole('button', { name: /toggle api key visibility/i });
    fireEvent.click(toggleBtn);
    expect(keyInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(keyInput.type).toBe('password');
  });

  it('tests connection successfully when ping passes for Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'pong' });

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'valid-test-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: 'Ping',
          model: 'gemini-3.8-flash',
        })
      );
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error when testing connection with invalid key or network error', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('Permission denied'));

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'bad-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: Permission denied/i)).toBeInTheDocument();
    });
  });

  it('closes modal on escape key, but ignores other keys', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('displays warning when Test Connection is clicked with empty API key', async () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    expect(screen.getByText(/please enter an api key first/i)).toBeInTheDocument();
  });

  it('tests connection for OpenAI provider successfully via SDK and handles failure', async () => {
    mockChatCompletionsCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Pong' } }],
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const providerSelect = screen.getByLabelText(/provider/i);
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'sk-test-key' } });

    const endpointInput = screen.getByLabelText(/custom endpoint/i);
    fireEvent.change(endpointInput, { target: { value: 'https://my-openai-proxy.com/v1///' } });

    const modelSelect = screen.getByLabelText(/^model$/i);
    fireEvent.change(modelSelect, { target: { value: 'gpt-5.4' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(capturedSettingsOpenAIOptions).toEqual({
        apiKey: 'sk-test-key',
        baseURL: 'https://my-openai-proxy.com/v1',
        dangerouslyAllowBrowser: true,
      });
      expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5.4',
          messages: [{ role: 'user', content: 'Ping' }],
        })
      );
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });

    // Test failure path
    mockChatCompletionsCreate.mockRejectedValueOnce(new Error('Invalid API key'));
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: Invalid API key/i)).toBeInTheDocument();
    });

    // Test non-error rejection
    mockChatCompletionsCreate.mockRejectedValueOnce('String rejection');
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: Network error/i)).toBeInTheDocument();
    });

    // Test with empty custom model and empty endpoint
    fireEvent.change(endpointInput, { target: { value: '   ' } });
    fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });
    const customInput = screen.getByLabelText(/custom model identifier/i);
    fireEvent.change(customInput, { target: { value: 'my-custom-gpt' } });

    // Selecting custom model again while it's already custom keeps existing value
    fireEvent.change(modelSelect, { target: { value: CUSTOM_MODEL_VALUE } });
    expect(customInput).toHaveValue('my-custom-gpt');

    // Clear custom input and test OpenAI fallback model
    fireEvent.change(customInput, { target: { value: '' } });
    mockChatCompletionsCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'Pong' } }],
    });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(capturedSettingsOpenAIOptions.baseURL).toBeUndefined();
      expect(mockChatCompletionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5.2',
        })
      );
    });

    // Switch back to Gemini and test empty custom model fallback to gemini-3.8-flash
    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    fireEvent.change(screen.getByLabelText(/^model$/i), { target: { value: CUSTOM_MODEL_VALUE } });
    const geminiCustomInput = screen.getByLabelText(/custom model identifier/i);
    fireEvent.change(geminiCustomInput, { target: { value: '' } });

    mockGenerateContent.mockResolvedValueOnce({ text: 'pong' });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
        })
      );
    });
  });
});
