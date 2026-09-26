import { describe, it, expect } from 'vitest';
import {
  GEMINI_MODELS,
  OPENAI_MODELS,
  CUSTOM_MODEL_VALUE,
  getModelsForProvider,
  getDefaultModelForProvider,
  getModelDisplayName,
  isValidModelForProvider,
  isCustomModel,
} from '../../services/ai/modelCatalog';

describe('modelCatalog', () => {
  describe('constants', () => {
    it('defines valid Gemini models with gemini-3.8-flash as default', () => {
      expect(GEMINI_MODELS.length).toBeGreaterThanOrEqual(3);
      const defaultGemini = GEMINI_MODELS.find((m) => m.isDefault);
      expect(defaultGemini).toBeDefined();
      expect(defaultGemini?.id).toBe('gemini-3.8-flash');
      expect(GEMINI_MODELS.some((m) => m.id === 'gemini-3.7-flash')).toBe(true);
      expect(GEMINI_MODELS.some((m) => m.id === 'gemini-3.5-flash')).toBe(true);
      expect(GEMINI_MODELS.some((m) => m.id === 'gemini-3.1-pro-preview')).toBe(true);
    });

    it('defines valid OpenAI models with gpt-5.2 as default', () => {
      expect(OPENAI_MODELS.length).toBeGreaterThanOrEqual(3);
      const defaultOpenAI = OPENAI_MODELS.find((m) => m.isDefault);
      expect(defaultOpenAI).toBeDefined();
      expect(defaultOpenAI?.id).toBe('gpt-5.2');
      expect(OPENAI_MODELS.some((m) => m.id === 'gpt-5.2-pro')).toBe(true);
      expect(OPENAI_MODELS.some((m) => m.id === 'gpt-5.4')).toBe(true);
      expect(OPENAI_MODELS.some((m) => m.id === 'gpt-5.6')).toBe(true);
    });

    it('exports CUSTOM_MODEL_VALUE constant', () => {
      expect(CUSTOM_MODEL_VALUE).toBe('__custom__');
    });
  });

  describe('getModelsForProvider', () => {
    it('returns Gemini models for gemini provider', () => {
      const models = getModelsForProvider('gemini');
      expect(models).toEqual(GEMINI_MODELS);
    });

    it('returns OpenAI models for openai provider', () => {
      const models = getModelsForProvider('openai');
      expect(models).toEqual(OPENAI_MODELS);
    });
  });

  describe('getDefaultModelForProvider', () => {
    it('returns gemini-3.8-flash for gemini', () => {
      expect(getDefaultModelForProvider('gemini')).toBe('gemini-3.8-flash');
    });

    it('returns gpt-5.2 for openai', () => {
      expect(getDefaultModelForProvider('openai')).toBe('gpt-5.2');
    });
  });

  describe('getModelDisplayName', () => {
    it('returns display name for known gemini model', () => {
      const name = getModelDisplayName('gemini', 'gemini-3.8-flash');
      expect(name).toContain('Gemini 3.8 Flash');
    });

    it('returns display name for known openai model', () => {
      const name = getModelDisplayName('openai', 'gpt-5.2');
      expect(name).toContain('GPT-5.2');
    });

    it('returns custom indicator or raw model ID if model is not in catalog', () => {
      expect(getModelDisplayName('gemini', 'my-custom-model')).toBe('my-custom-model');
      expect(getModelDisplayName('openai', 'custom-gpt')).toBe('custom-gpt');
      expect(getModelDisplayName('gemini', '')).toBe('Default');
    });
  });

  describe('isValidModelForProvider', () => {
    it('returns true if model is in catalog for provider', () => {
      expect(isValidModelForProvider('gemini', 'gemini-3.8-flash')).toBe(true);
      expect(isValidModelForProvider('openai', 'gpt-5.2')).toBe(true);
    });

    it('returns false if model belongs to other provider or is unknown', () => {
      expect(isValidModelForProvider('gemini', 'gpt-5.2')).toBe(false);
      expect(isValidModelForProvider('openai', 'gemini-3.8-flash')).toBe(false);
      expect(isValidModelForProvider('gemini', 'unknown-model')).toBe(false);
    });
  });

  describe('isCustomModel', () => {
    it('returns true if model is __custom__ or not in provider catalog', () => {
      expect(isCustomModel('gemini', CUSTOM_MODEL_VALUE)).toBe(true);
      expect(isCustomModel('gemini', 'some-fine-tuned-model')).toBe(true);
      expect(isCustomModel('openai', 'azure-gpt-5-deployment')).toBe(true);
    });

    it('returns false if model is in provider catalog', () => {
      expect(isCustomModel('gemini', 'gemini-3.8-flash')).toBe(false);
      expect(isCustomModel('openai', 'gpt-5.2')).toBe(false);
    });
  });
});
