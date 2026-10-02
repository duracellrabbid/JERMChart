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

describe('SettingsModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
    vi.clearAllMocks();
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
});
