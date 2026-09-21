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
});
