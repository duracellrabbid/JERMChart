export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

const STORAGE_KEY = 'tmu_ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
  customEndpoint: '',
};

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
    const provider: AIProvider = parsed.provider === 'openai' ? 'openai' : 'gemini';
    const defaultModel = provider === 'openai' ? 'gpt-4o' : 'gemini-3.5-flash';
    return {
      provider,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : defaultModel,
      customEndpoint: typeof parsed.customEndpoint === 'string' ? parsed.customEndpoint.trim() : '',
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAIConfig(patch: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...patch };
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
