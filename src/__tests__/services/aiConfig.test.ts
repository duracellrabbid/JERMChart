import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  hasValidApiKey,
  clearAIConfig,
} from '../../services/ai/aiConfig';

describe('aiConfig', () => {
  beforeEach(() => {
    clearAIConfig();
  });

  it('returns default gemini configuration when empty', () => {
    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.model).toBe('gemini-2.5-flash');
    expect(config.apiKey).toBe('');
    expect(hasValidApiKey()).toBe(false);
  });

  it('saves and retrieves updated configuration', () => {
    saveAIConfig({
      provider: 'openai',
      apiKey: 'sk-test-key-12345',
      model: 'gpt-4o',
    });

    const config = getAIConfig();
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('sk-test-key-12345');
    expect(config.model).toBe('gpt-4o');
    expect(hasValidApiKey()).toBe(true);
  });

  it('clears configuration accurately', () => {
    saveAIConfig({ apiKey: 'some-key-67890' });
    expect(hasValidApiKey()).toBe(true);
    clearAIConfig();
    expect(getAIConfig().apiKey).toBe('');
    expect(hasValidApiKey()).toBe(false);
  });

  it('falls back to default config when storage contains corrupted JSON', () => {
    window.localStorage.setItem('tmu_ai_config', '{ corrupted json');
    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('');
    expect(config.model).toBe('gemini-2.5-flash');
  });

  it('handles non-string or whitespace properties and sets default model for openai', () => {
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'openai',
        apiKey: 12345,
        model: '   ',
        customEndpoint: null,
      })
    );
    const config = getAIConfig();
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('');
    expect(config.model).toBe('gpt-4o');
    expect(config.customEndpoint).toBe('');
  });

  it('falls back to in-memory storage if localStorage throws an error', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    saveAIConfig({ apiKey: 'memory-test-key-12345' });
    const config = getAIConfig();
    expect(config.apiKey).toBe('memory-test-key-12345');

    clearAIConfig();
    window.localStorage.setItem = originalSetItem;
  });

  it('falls back to memory store when window.localStorage is undefined', () => {
    const originalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: undefined,
      configurable: true,
    });

    saveAIConfig({ apiKey: 'no-window-test-key' });
    expect(getAIConfig().apiKey).toBe('no-window-test-key');

    Object.defineProperty(window, 'localStorage', {
      value: originalStorage,
      configurable: true,
    });
  });
});
