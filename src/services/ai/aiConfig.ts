import { getDefaultModelForProvider } from './modelCatalog';

export type AIProvider = 'gemini' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  ollamaUrl: string;
  geminiModel?: string;
  ollamaModel?: string;
}

const STORAGE_KEY = 'tmu_ai_config';
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';

export const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.8-flash',
  ollamaUrl: DEFAULT_OLLAMA_URL,
  geminiModel: 'gemini-3.8-flash',
  ollamaModel: '',
};

const LEGACY_GEMINI_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
]);

const LEGACY_OPENAI_MODELS = new Set([
  'gpt-4',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-5.2',
  'gpt-5.2-pro',
  'gpt-5.4',
  'gpt-5.6',
]);

export function migrateLegacyModel(provider: string, storedModel: string): string {
  const trimmed = storedModel.trim();
  if (!trimmed) {
    return provider === 'ollama' ? 'llama3.2-vision' : getDefaultModelForProvider('gemini');
  }
  if (provider === 'gemini' && LEGACY_GEMINI_MODELS.has(trimmed)) {
    return 'gemini-3.8-flash';
  }
  if (provider === 'openai' || LEGACY_OPENAI_MODELS.has(trimmed)) {
    return 'gemini-3.8-flash';
  }
  return trimmed;
}

const memoryStore = new Map<string, string>();

interface SimpleStorage {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
}

function getStorage(): SimpleStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('__tmu_test__', '1');
      window.localStorage.removeItem('__tmu_test__');
      return window.localStorage;
    }
  } catch {
    // Use in-memory fallback
  }
  return {
    getItem: (k: string) => memoryStore.get(k) ?? null,
    setItem: (k: string, v: string) => memoryStore.set(k, v),
    removeItem: (k: string) => memoryStore.delete(k),
  };
}

function resolveStoredGeminiModel(
  parsed: Record<string, unknown>,
  storedProvider: AIProvider,
  fallbackModel: string
): string {
  if (typeof parsed.geminiModel === 'string') {
    const trimmed = parsed.geminiModel.trim();
    return trimmed ? migrateLegacyModel('gemini', trimmed) : 'gemini-3.8-flash';
  }
  return storedProvider === 'gemini' ? fallbackModel : 'gemini-3.8-flash';
}

function resolveStoredOllamaModel(
  parsed: Record<string, unknown>,
  storedProvider: AIProvider,
  fallbackModel: string
): string {
  if (typeof parsed.ollamaModel === 'string') {
    const trimmed = parsed.ollamaModel.trim();
    return trimmed ? migrateLegacyModel('ollama', trimmed) : '';
  }
  return storedProvider === 'ollama' ? fallbackModel : '';
}

export function getAIConfig(): AIConfig {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    const storedProvider: AIProvider = parsed.provider === 'ollama' ? 'ollama' : 'gemini';
    const rawModel = typeof parsed.model === 'string' ? parsed.model : '';
    const fallbackModel = migrateLegacyModel(storedProvider, rawModel);
    const geminiModel = resolveStoredGeminiModel(parsed, storedProvider, fallbackModel);
    const ollamaModel = resolveStoredOllamaModel(parsed, storedProvider, fallbackModel);
    const model = storedProvider === 'ollama' ? ollamaModel : geminiModel;
    const rawOllamaUrl = typeof parsed.ollamaUrl === 'string' ? parsed.ollamaUrl.trim() : '';
    const ollamaUrl = rawOllamaUrl || DEFAULT_OLLAMA_URL;
    return {
      provider: storedProvider,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
      model,
      ollamaUrl,
      geminiModel,
      ollamaModel,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function resolveSavedModels(
  current: AIConfig,
  patch: Partial<AIConfig>,
  provider: AIProvider
): { model: string; geminiModel: string; ollamaModel: string } {
  let geminiModel = patch.geminiModel !== undefined ? patch.geminiModel : (current.geminiModel as string);
  let ollamaModel = patch.ollamaModel !== undefined ? patch.ollamaModel : (current.ollamaModel as string);

  if (typeof patch.model === 'string') {
    if (provider === 'gemini') {
      geminiModel = patch.model;
    } else {
      ollamaModel = patch.model;
    }
  }

  let model = current.model;
  if (typeof patch.model === 'string') {
    model = patch.model;
  } else if (patch.geminiModel !== undefined && provider === 'gemini') {
    model = patch.geminiModel;
  } else if (patch.ollamaModel !== undefined && provider === 'ollama') {
    model = patch.ollamaModel;
  } else if (patch.provider !== undefined) {
    model = provider === 'ollama' ? ollamaModel : geminiModel;
  }

  return { model, geminiModel, ollamaModel };
}

export function saveAIConfig(patch: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const rawProvider = patch.provider ?? current.provider;
  const provider: AIProvider = rawProvider === 'ollama' ? 'ollama' : 'gemini';
  const rawOllamaUrl = patch.ollamaUrl ?? current.ollamaUrl;
  const ollamaUrl = (typeof rawOllamaUrl === 'string' ? rawOllamaUrl.trim() : '') || DEFAULT_OLLAMA_URL;

  const { model, geminiModel, ollamaModel } = resolveSavedModels(current, patch, provider);

  const updated: AIConfig = {
    ...current,
    ...patch,
    provider,
    model,
    ollamaUrl,
    geminiModel,
    ollamaModel,
  };
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function isGeminiConfigured(config?: AIConfig): boolean {
  const target = config || getAIConfig();
  const apiKey = typeof target.apiKey === 'string' ? target.apiKey.trim() : '';
  const modelCandidate = target.geminiModel || (target.provider === 'gemini' ? target.model : '');
  const model = typeof modelCandidate === 'string' ? modelCandidate.trim() : '';
  return apiKey.length > 0 && model.length > 0;
}

export function isOllamaConfigured(config?: AIConfig): boolean {
  const target = config || getAIConfig();
  const ollamaUrl = typeof target.ollamaUrl === 'string' ? target.ollamaUrl.trim() : '';
  const modelCandidate = target.ollamaModel || (target.provider === 'ollama' ? target.model : '');
  const model = typeof modelCandidate === 'string' ? modelCandidate.trim() : '';
  return ollamaUrl.length > 0 && model.length > 0;
}

export function getConfiguredProviders(config?: AIConfig): AIProvider[] {
  const target = config || getAIConfig();
  const providers: AIProvider[] = [];
  if (isGeminiConfigured(target)) {
    providers.push('gemini');
  }
  if (isOllamaConfigured(target)) {
    providers.push('ollama');
  }
  return providers;
}

export function getProviderModel(provider: AIProvider, config?: AIConfig): string {
  const target = config || getAIConfig();
  if (provider === 'gemini') {
    return target.geminiModel || (target.provider === 'gemini' ? target.model : 'gemini-3.8-flash');
  }
  return target.ollamaModel || (target.provider === 'ollama' ? target.model : '');
}

export function getProviderDisplayName(provider: AIProvider): string {
  if (provider === 'gemini') {
    return 'Google Gemini';
  }
  return 'Ollama';
}

export function hasValidAIConfig(config?: AIConfig): boolean {
  const target = config || getAIConfig();
  if (target.provider === 'ollama') {
    return target.ollamaUrl.trim().length > 0 && target.model.trim().length > 0;
  }
  return target.apiKey.trim().length > 0 && target.model.trim().length > 0;
}

export function hasValidApiKey(): boolean {
  return hasValidAIConfig();
}

export function clearAIConfig(): void {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
  memoryStore.clear();
}
