import { getDefaultModelForProvider } from './modelCatalog';

export type AIProvider = 'gemini';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'tmu_ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.8-flash',
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
    return getDefaultModelForProvider('gemini');
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

export function getAIConfig(): AIConfig {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    const storedProvider = typeof parsed.provider === 'string' ? parsed.provider : 'gemini';
    const rawModel = typeof parsed.model === 'string' ? parsed.model : '';
    const model = migrateLegacyModel(storedProvider, rawModel);
    return {
      provider: 'gemini',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
      model,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAIConfig(patch: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...patch, provider: 'gemini' };
  const storage = getStorage();
  storage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function hasValidApiKey(): boolean {
  return getAIConfig().apiKey.length > 5;
}

export function clearAIConfig(): void {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEY);
  memoryStore.clear();
}
