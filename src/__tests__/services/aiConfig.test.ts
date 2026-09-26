import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  hasValidApiKey,
  clearAIConfig,
  migrateLegacyModel,
} from '../../services/ai/aiConfig';

describe('aiConfig', () => {
  beforeEach(() => {
    clearAIConfig();
  });

  it('returns default gemini configuration when empty', () => {
    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.model).toBe('gemini-3.8-flash');
    expect(config.apiKey).toBe('');
    expect(hasValidApiKey()).toBe(false);
  });

  it('saves and retrieves updated configuration', () => {
    saveAIConfig({
      provider: 'openai',
      apiKey: 'sk-test-key-12345',
      model: 'gpt-5.2',
    });

    const config = getAIConfig();
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('sk-test-key-12345');
    expect(config.model).toBe('gpt-5.2');
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
    expect(config.model).toBe('gemini-3.8-flash');
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
    expect(config.model).toBe('gpt-5.2');
    expect(config.customEndpoint).toBe('');

    // Non-string model branch
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'gemini',
        model: 9999,
      })
    );
    expect(getAIConfig().model).toBe('gemini-3.8-flash');
  });

  it('migrates legacy model identifiers automatically', () => {
    expect(migrateLegacyModel('gemini', 'gemini-2.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-3.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-1.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-2.0-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-4o')).toBe('gpt-5.2');
    expect(migrateLegacyModel('openai', 'gpt-4o-mini')).toBe('gpt-5.2');
    expect(migrateLegacyModel('openai', 'gpt-4-turbo')).toBe('gpt-5.2');
    expect(migrateLegacyModel('openai', 'gpt-4')).toBe('gpt-5.2');

    // Preserves active models or custom enterprise models
    expect(migrateLegacyModel('gemini', 'gemini-3.7-flash')).toBe('gemini-3.7-flash');
    expect(migrateLegacyModel('gemini', 'custom-enterprise-gemini')).toBe('custom-enterprise-gemini');
    expect(migrateLegacyModel('openai', 'gpt-5.4')).toBe('gpt-5.4');
    expect(migrateLegacyModel('openai', 'azure-deployment-gpt')).toBe('azure-deployment-gpt');

    // Blank returns default
    expect(migrateLegacyModel('gemini', '')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', '')).toBe('gpt-5.2');
  });

  it('migrates legacy stored models when loading config from storage', () => {
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'gemini',
        apiKey: 'AIzaSy12345',
        model: 'gemini-2.5-flash',
      })
    );
    expect(getAIConfig().model).toBe('gemini-3.8-flash');

    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'openai',
        apiKey: 'sk-12345',
        model: 'gpt-4o',
      })
    );
    expect(getAIConfig().model).toBe('gpt-5.2');
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
