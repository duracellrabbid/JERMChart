import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  hasValidApiKey,
  hasValidAIConfig,
  clearAIConfig,
  migrateLegacyModel,
  DEFAULT_CONFIG,
  isGeminiConfigured,
  isOllamaConfigured,
  getConfiguredProviders,
  getProviderModel,
  getProviderDisplayName,
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
    expect(DEFAULT_CONFIG.geminiModel).toBe('gemini-3.8-flash');
    expect(DEFAULT_CONFIG.ollamaModel).toBe('');
  });

  describe('Provider Setup Utilities and Dual-Model Synchronization', () => {
    it('returns correct display names for providers', () => {
      expect(getProviderDisplayName('gemini')).toBe('Google Gemini');
      expect(getProviderDisplayName('ollama')).toBe('Ollama');
    });

    it('evaluates isGeminiConfigured correctly', () => {
      expect(
        isGeminiConfigured({
          provider: 'gemini',
          apiKey: 'AIzaSy12345',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
        })
      ).toBe(true);

      // Falls back to model if provider is gemini and geminiModel absent
      expect(
        isGeminiConfigured({
          provider: 'gemini',
          apiKey: 'AIzaSy12345',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
        })
      ).toBe(true);

      // Provider is ollama, but geminiModel and apiKey are configured
      expect(
        isGeminiConfigured({
          provider: 'ollama',
          apiKey: 'AIzaSy12345',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
        })
      ).toBe(true);

      // Empty apiKey
      expect(
        isGeminiConfigured({
          provider: 'gemini',
          apiKey: '   ',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
        })
      ).toBe(false);

      // Empty geminiModel and provider is not gemini
      expect(
        isGeminiConfigured({
          provider: 'ollama',
          apiKey: 'AIzaSy12345',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: '   ',
        })
      ).toBe(false);

      // Non-string apiKey or model
      expect(
        isGeminiConfigured({
          provider: 'gemini',
          apiKey: 12345 as any,
          model: 67890 as any,
          ollamaUrl: 'http://localhost:11434',
        })
      ).toBe(false);

      // Active config fallback
      clearAIConfig();
      expect(isGeminiConfigured()).toBe(false);
      saveAIConfig({ apiKey: 'AIzaSyKey', geminiModel: 'gemini-3.8-flash' });
      expect(isGeminiConfigured()).toBe(true);
    });

    it('evaluates isOllamaConfigured correctly', () => {
      expect(
        isOllamaConfigured({
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2-vision',
        })
      ).toBe(true);

      // Falls back to model if provider is ollama and ollamaModel absent
      expect(
        isOllamaConfigured({
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).toBe(true);

      // Provider is gemini, but ollamaModel and ollamaUrl are present
      expect(
        isOllamaConfigured({
          provider: 'gemini',
          apiKey: 'AIzaSy12345',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2-vision',
        })
      ).toBe(true);

      // Empty ollamaUrl
      expect(
        isOllamaConfigured({
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: '   ',
          ollamaModel: 'llama3.2-vision',
        })
      ).toBe(false);

      // Empty ollamaModel and provider is gemini
      expect(
        isOllamaConfigured({
          provider: 'gemini',
          apiKey: 'AIzaSy12345',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: '   ',
        })
      ).toBe(false);

      // Non-string ollamaUrl or model
      expect(
        isOllamaConfigured({
          provider: 'ollama',
          apiKey: '',
          model: 67890 as any,
          ollamaUrl: 12345 as any,
        })
      ).toBe(false);

      // Active config fallback
      clearAIConfig();
      expect(isOllamaConfigured()).toBe(false);
      saveAIConfig({
        provider: 'ollama',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2-vision',
      });
      expect(isOllamaConfigured()).toBe(true);
    });

    it('returns configured providers in proper order', () => {
      // Neither configured
      expect(
        getConfiguredProviders({
          provider: 'gemini',
          apiKey: '',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
          ollamaModel: '',
        })
      ).toEqual([]);

      // Only gemini configured
      expect(
        getConfiguredProviders({
          provider: 'gemini',
          apiKey: 'AIzaSyKey',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
          ollamaModel: '',
        })
      ).toEqual(['gemini']);

      // Only ollama configured
      expect(
        getConfiguredProviders({
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: '',
          ollamaModel: 'llama3.2-vision',
        })
      ).toEqual(['ollama']);

      // Both configured
      expect(
        getConfiguredProviders({
          provider: 'gemini',
          apiKey: 'AIzaSyKey',
          model: 'gemini-3.8-flash',
          ollamaUrl: 'http://localhost:11434',
          geminiModel: 'gemini-3.8-flash',
          ollamaModel: 'llama3.2-vision',
        })
      ).toEqual(['gemini', 'ollama']);

      // Active config fallback
      clearAIConfig();
      expect(getConfiguredProviders()).toEqual([]);
      saveAIConfig({ apiKey: 'AIzaSyKey', geminiModel: 'gemini-3.8-flash' });
      expect(getConfiguredProviders()).toEqual(['gemini']);
      saveAIConfig({ ollamaModel: 'llama3.2-vision' });
      expect(getConfiguredProviders()).toEqual(['gemini', 'ollama']);
    });

    it('retrieves provider-specific models via getProviderModel', () => {
      const config = {
        provider: 'gemini' as const,
        apiKey: 'AIzaSyKey',
        model: 'gemini-3.7-flash',
        ollamaUrl: 'http://localhost:11434',
        geminiModel: 'gemini-3.7-flash',
        ollamaModel: 'llama3.2-vision',
      };

      expect(getProviderModel('gemini', config)).toBe('gemini-3.7-flash');
      expect(getProviderModel('ollama', config)).toBe('llama3.2-vision');

      // Fallbacks when geminiModel / ollamaModel not explicitly defined
      const legacyGeminiConfig = {
        provider: 'gemini' as const,
        apiKey: 'AIzaSyKey',
        model: 'gemini-custom',
        ollamaUrl: 'http://localhost:11434',
      };
      expect(getProviderModel('gemini', legacyGeminiConfig)).toBe('gemini-custom');
      expect(getProviderModel('ollama', legacyGeminiConfig)).toBe('');

      const legacyOllamaConfig = {
        provider: 'ollama' as const,
        apiKey: '',
        model: 'ollama-custom',
        ollamaUrl: 'http://localhost:11434',
      };
      expect(getProviderModel('gemini', legacyOllamaConfig)).toBe('gemini-3.8-flash');
      expect(getProviderModel('ollama', legacyOllamaConfig)).toBe('ollama-custom');

      // Without arguments uses active config
      clearAIConfig();
      saveAIConfig({
        provider: 'gemini',
        geminiModel: 'gemini-3.7-flash',
        ollamaModel: 'llama3.2-vision',
      });
      expect(getProviderModel('gemini')).toBe('gemini-3.7-flash');
      expect(getProviderModel('ollama')).toBe('llama3.2-vision');
    });

    it('synchronizes geminiModel and ollamaModel in getAIConfig and migrates legacy models', () => {
      window.localStorage.setItem(
        'tmu_ai_config',
        JSON.stringify({
          provider: 'gemini',
          apiKey: 'AIzaSyKey',
          geminiModel: 'gemini-2.0-flash',
          ollamaModel: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      );
      const config = getAIConfig();
      expect(config.geminiModel).toBe('gemini-3.8-flash'); // migrated legacy model
      expect(config.ollamaModel).toBe('llama3.2-vision');
      expect(config.model).toBe('gemini-3.8-flash');

      // Absent fields migrate from stored provider and fallback defaults
      window.localStorage.setItem(
        'tmu_ai_config',
        JSON.stringify({
          provider: 'gemini',
          apiKey: 'AIzaSyKey',
          model: 'gemini-3.7-flash',
        })
      );
      const legacyLoaded = getAIConfig();
      expect(legacyLoaded.geminiModel).toBe('gemini-3.7-flash');
      expect(legacyLoaded.ollamaModel).toBe('');
      expect(legacyLoaded.model).toBe('gemini-3.7-flash');

      window.localStorage.setItem(
        'tmu_ai_config',
        JSON.stringify({
          provider: 'ollama',
          apiKey: '',
          model: 'custom-ollama:latest',
        })
      );
      const ollamaLegacyLoaded = getAIConfig();
      expect(ollamaLegacyLoaded.geminiModel).toBe('gemini-3.8-flash');
      expect(ollamaLegacyLoaded.ollamaModel).toBe('custom-ollama:latest');
      expect(ollamaLegacyLoaded.model).toBe('custom-ollama:latest');

      // Whitespace geminiModel and ollamaModel fallback correctly
      window.localStorage.setItem(
        'tmu_ai_config',
        JSON.stringify({
          provider: 'gemini',
          apiKey: 'AIzaSyKey',
          geminiModel: '   ',
          ollamaModel: '   ',
        })
      );
      const whitespaceLoaded = getAIConfig();
      expect(whitespaceLoaded.geminiModel).toBe('gemini-3.8-flash');
      expect(whitespaceLoaded.ollamaModel).toBe('');
    });

    it('synchronizes model, geminiModel, and ollamaModel in saveAIConfig', () => {
      // 1. Updating model when provider is gemini updates geminiModel
      saveAIConfig({
        provider: 'gemini',
        model: 'gemini-3.7-flash',
      });
      let cfg = getAIConfig();
      expect(cfg.model).toBe('gemini-3.7-flash');
      expect(cfg.geminiModel).toBe('gemini-3.7-flash');

      // 2. Updating geminiModel directly updates active model when provider is gemini
      saveAIConfig({
        geminiModel: 'gemini-3.8-flash',
      });
      cfg = getAIConfig();
      expect(cfg.geminiModel).toBe('gemini-3.8-flash');
      expect(cfg.model).toBe('gemini-3.8-flash');

      // 3. Updating ollamaModel while provider is gemini does not alter active model
      saveAIConfig({
        ollamaModel: 'llama3.2-vision',
      });
      cfg = getAIConfig();
      expect(cfg.ollamaModel).toBe('llama3.2-vision');
      expect(cfg.model).toBe('gemini-3.8-flash');

      // 4. Switching provider to ollama updates active model to ollamaModel
      saveAIConfig({
        provider: 'ollama',
      });
      cfg = getAIConfig();
      expect(cfg.provider).toBe('ollama');
      expect(cfg.model).toBe('llama3.2-vision');
      expect(cfg.geminiModel).toBe('gemini-3.8-flash');

      // 5. Updating model when provider is ollama updates ollamaModel
      saveAIConfig({
        model: 'minicpm-v',
      });
      cfg = getAIConfig();
      expect(cfg.model).toBe('minicpm-v');
      expect(cfg.ollamaModel).toBe('minicpm-v');

      // 6. Updating patch.model updates active model and provider-specific model
      saveAIConfig({
        provider: 'gemini',
        model: 'gemini-explicit-model',
      });
      cfg = getAIConfig();
      expect(cfg.model).toBe('gemini-explicit-model');
      expect(cfg.geminiModel).toBe('gemini-explicit-model');

      // 7. Switching provider back to gemini updates active model to geminiModel
      saveAIConfig({
        provider: 'ollama',
      });
      saveAIConfig({
        provider: 'gemini',
      });
      cfg = getAIConfig();
      expect(cfg.provider).toBe('gemini');
      expect(cfg.model).toBe('gemini-explicit-model');
    });
  });
});
