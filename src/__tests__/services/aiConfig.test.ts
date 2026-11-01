import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  hasValidApiKey,
  hasValidAIConfig,
  clearAIConfig,
  migrateLegacyModel,
  DEFAULT_CONFIG,
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

  it('saves and retrieves updated configuration locked to gemini', () => {
    saveAIConfig({
      apiKey: 'AIzaSyTestKey12345',
      model: 'gemini-3.7-flash',
    });

    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('AIzaSyTestKey12345');
    expect(config.model).toBe('gemini-3.7-flash');
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

  it('handles non-string or whitespace properties and defaults model to gemini-3.8-flash', () => {
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'openai',
        apiKey: 12345,
        model: '   ',
      })
    );
    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('');
    expect(config.model).toBe('gemini-3.8-flash');

    // Non-string model branch and non-string provider branch
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 9999,
        model: 9999,
      })
    );
    expect(getAIConfig().model).toBe('gemini-3.8-flash');
    expect(getAIConfig().provider).toBe('gemini');
  });

  it('migrates legacy and OpenAI model identifiers automatically to Gemini', () => {
    expect(migrateLegacyModel('gemini', 'gemini-2.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-3.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-1.5-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gemini-2.0-flash')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-4o')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-4o-mini')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-4-turbo')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-4')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', 'gpt-5.2')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('gemini', 'gpt-5.4')).toBe('gemini-3.8-flash');

    // Preserves active models or custom enterprise models
    expect(migrateLegacyModel('gemini', 'gemini-3.7-flash')).toBe('gemini-3.7-flash');
    expect(migrateLegacyModel('gemini', 'custom-enterprise-gemini')).toBe('custom-enterprise-gemini');

    // Blank returns default
    expect(migrateLegacyModel('gemini', '')).toBe('gemini-3.8-flash');
    expect(migrateLegacyModel('openai', '')).toBe('gemini-3.8-flash');
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
    expect(getAIConfig().model).toBe('gemini-3.8-flash');
    expect(getAIConfig().provider).toBe('gemini');
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

  it('validates configuration correctly for both gemini and ollama providers', () => {
    expect(
      hasValidAIConfig({
        provider: 'gemini',
        apiKey: 'AIzaSyKey',
        model: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
      })
    ).toBe(true);
    expect(
      hasValidAIConfig({
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
      })
    ).toBe(false);
    expect(
      hasValidAIConfig({
        provider: 'gemini',
        apiKey: 'AIzaSyKey',
        model: '   ',
        ollamaUrl: 'http://localhost:11434',
      })
    ).toBe(false);
    expect(
      hasValidAIConfig({
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: 'http://localhost:11434',
      })
    ).toBe(true);
    expect(
      hasValidAIConfig({
        provider: 'ollama',
        apiKey: '',
        model: '',
        ollamaUrl: 'http://localhost:11434',
      })
    ).toBe(false);
    expect(
      hasValidAIConfig({
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: '   ',
      })
    ).toBe(false);

    // When called with no arguments, validates active config from storage
    clearAIConfig();
    expect(hasValidAIConfig()).toBe(false);
    saveAIConfig({
      provider: 'ollama',
      model: 'llama3.2-vision',
      ollamaUrl: 'http://localhost:11434',
    });
    expect(hasValidAIConfig()).toBe(true);
    expect(hasValidApiKey()).toBe(true);
  });

  it('migrates legacy stored config and ensures default ollamaUrl is populated', () => {
    const saved = saveAIConfig({ provider: 'ollama', model: 'llama3.2-vision' });
    expect(saved.provider).toBe('ollama');
    expect(saved.ollamaUrl).toBe('http://localhost:11434');

    const loaded = getAIConfig();
    expect(loaded.provider).toBe('ollama');
    expect(loaded.model).toBe('llama3.2-vision');
    expect(loaded.ollamaUrl).toBe('http://localhost:11434');
  });

  it('preserves provider and custom ollamaUrl when updating config partially', () => {
    saveAIConfig({
      provider: 'ollama',
      model: 'llama3.2-vision',
      ollamaUrl: 'http://192.168.1.100:11434',
    });

    const updated = saveAIConfig({
      model: 'minicpm-v',
    });
    expect(updated.provider).toBe('ollama');
    expect(updated.model).toBe('minicpm-v');
    expect(updated.ollamaUrl).toBe('http://192.168.1.100:11434');

    // Passing whitespace for ollamaUrl resets to default
    const resetUrl = saveAIConfig({
      ollamaUrl: '   ',
    });
    expect(resetUrl.ollamaUrl).toBe('http://localhost:11434');

    const nonStringUrl = saveAIConfig({
      ollamaUrl: 12345 as any,
    });
    expect(nonStringUrl.ollamaUrl).toBe('http://localhost:11434');
  });

  it('handles non-string or whitespace ollamaUrl when parsing stored config', () => {
    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'ollama',
        model: 'llama3.2-vision',
        ollamaUrl: 12345,
      })
    );
    expect(getAIConfig().ollamaUrl).toBe('http://localhost:11434');

    window.localStorage.setItem(
      'tmu_ai_config',
      JSON.stringify({
        provider: 'ollama',
        model: 'llama3.2-vision',
        ollamaUrl: '   ',
      })
    );
    expect(getAIConfig().ollamaUrl).toBe('http://localhost:11434');
  });

  it('handles empty storedModel for ollama provider in migrateLegacyModel', () => {
    expect(migrateLegacyModel('ollama', '')).toBe('llama3.2-vision');
    expect(migrateLegacyModel('ollama', '   ')).toBe('llama3.2-vision');
    expect(migrateLegacyModel('ollama', 'custom-model:latest')).toBe('custom-model:latest');
  });

  it('exports DEFAULT_CONFIG with ollamaUrl initialized', () => {
    expect(DEFAULT_CONFIG.provider).toBe('gemini');
    expect(DEFAULT_CONFIG.ollamaUrl).toBe('http://localhost:11434');
  });
});
