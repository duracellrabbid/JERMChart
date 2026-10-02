import { AIProvider } from './aiConfig';

export interface AIModelDefinition {
  id: string;
  displayName: string;
  description: string;
  isDefault?: boolean;
}

export const CUSTOM_MODEL_VALUE = '__custom__';

export const GEMINI_MODELS: AIModelDefinition[] = [
  {
    id: 'gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash (Recommended - Fastest & Latest)',
    description: 'Latest high-speed multimodal vision with thinking capabilities',
    isDefault: true,
  },
  {
    id: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    description: 'Stable hybrid reasoning and vision model',
  },
  {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    description: 'Predecessor generation flash model',
  },
  {
    id: 'gemini-3.1-pro-preview',
    displayName: 'Gemini 3.1 Pro (Deep Reasoning)',
    description: 'High-precision model for dense, intricate structure charts',
  },
];

export function getModelsForProvider(_provider?: AIProvider): AIModelDefinition[] {
  return GEMINI_MODELS;
}

export function getDefaultModelForProvider(_provider?: AIProvider): string {
  return 'gemini-3.8-flash';
}

export function isValidModelForProvider(provider: AIProvider, modelId: string): boolean {
  const models = getModelsForProvider(provider);
  return models.some((m) => m.id === modelId);
}

export function isCustomModel(provider: AIProvider, modelId: string): boolean {
  if (modelId === CUSTOM_MODEL_VALUE) return true;
  return !isValidModelForProvider(provider, modelId);
}

export function getModelDisplayName(provider: AIProvider, modelId: string): string {
  if (!modelId) return 'Default';
  const models = getModelsForProvider(provider);
  const found = models.find((m) => m.id === modelId);
  return found ? found.displayName : modelId;
}
