import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../../../components/settings/SettingsModal';
import * as aiConfig from '../../../services/ai/aiConfig';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe('SettingsModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
    vi.clearAllMocks();
  });

  it('renders provider selection, api key input, and model fields', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    expect(screen.getByText(/ai provider & api keys/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
  });

  it('saves configuration when Save Settings clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSy12345Test' } });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    expect(aiConfig.getAIConfig().apiKey).toBe('AIzaSy12345Test');
    expect(onClose).toHaveBeenCalled();
  });

  it('switches default model when provider changes', () => {
    render(<SettingsModal onClose={vi.fn()} />);

    const providerSelect = screen.getByLabelText(/provider/i);
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    const modelInput = screen.getByLabelText(/model/i) as HTMLInputElement;
    expect(modelInput.value).toBe('gpt-4o');

    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    expect(modelInput.value).toBe('gemini-2.5-flash');
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

  it('tests connection successfully when ping passes', async () => {
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

  it('tests connection for OpenAI provider successfully and handles failure', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Pong' } }] }),
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const providerSelect = screen.getByLabelText(/provider/i);
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'sk-test-key' } });

    const endpointInput = screen.getByLabelText(/custom endpoint/i);
    fireEvent.change(endpointInput, { target: { value: 'https://my-openai-proxy.com/v1///' } });

    const modelInput = screen.getByLabelText(/model/i);
    fireEvent.change(modelInput, { target: { value: 'gpt-4o-mini' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://my-openai-proxy.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });

    // Test failure path
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Invalid API key',
    });

    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: HTTP 401: Invalid API key/i)).toBeInTheDocument();
    });

    // Test non-error rejection
    global.fetch = vi.fn().mockRejectedValue('String rejection');
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed: Network error/i)).toBeInTheDocument();
    });

    // Test with empty custom endpoint and empty model to cover fallback branches
    fireEvent.change(endpointInput, { target: { value: '' } });
    fireEvent.change(modelInput, { target: { value: '' } });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Pong' } }] }),
    });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"gpt-4o"'),
        })
      );
    });

    // Switch to Gemini with empty model to cover Gemini model fallback
    fireEvent.change(providerSelect, { target: { value: 'gemini' } });
    fireEvent.change(screen.getByLabelText(/model/i), { target: { value: '' } });
    mockGenerateContent.mockResolvedValueOnce({ text: 'pong' });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
        })
      );
    });

    global.fetch = originalFetch;
  });
});
