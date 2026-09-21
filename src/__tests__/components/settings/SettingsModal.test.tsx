import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../../../components/settings/SettingsModal';
import * as aiConfig from '../../../services/ai/aiConfig';

describe('SettingsModal', () => {
  beforeEach(() => {
    aiConfig.clearAIConfig();
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'pong' }] } }] }),
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'valid-test-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection verified successfully/i)).toBeInTheDocument();
    });
  });

  it('displays error when testing connection with invalid key or network error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'Permission denied',
    });

    render(<SettingsModal onClose={vi.fn()} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'bad-key' } });

    const testBtn = screen.getByRole('button', { name: /test connection/i });
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(screen.getByText(/connection test failed/i)).toBeInTheDocument();
    });
  });

  it('closes modal on escape key', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
