import { describe, it, expect } from 'vitest';
import {
  GEMINI_MODELS,
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

    it('exports CUSTOM_MODEL_VALUE constant', () => {
      expect(CUSTOM_MODEL_VALUE).toBe('__custom__');
    });
  });

  describe('getModelsForProvider', () => {
    it('returns Gemini models for gemini provider and default', () => {
      const models = getModelsForProvider('gemini');
      expect(models).toEqual(GEMINI_MODELS);
      expect(getModelsForProvider()).toEqual(GEMINI_MODELS);
    });
  });

  describe('getDefaultModelForProvider', () => {
    it('returns gemini-3.8-flash', () => {
      expect(getDefaultModelForProvider('gemini')).toBe('gemini-3.8-flash');
      expect(getDefaultModelForProvider()).toBe('gemini-3.8-flash');
    });
  });

  describe('getModelDisplayName', () => {
    it('returns display name for known gemini model', () => {
      const name = getModelDisplayName('gemini', 'gemini-3.8-flash');
      expect(name).toContain('Gemini 3.8 Flash');
    });

    it('returns custom indicator or raw model ID if model is not in catalog', () => {
      expect(getModelDisplayName('gemini', 'my-custom-model')).toBe('my-custom-model');
      expect(getModelDisplayName('gemini', '')).toBe('Default');
    });
  });

  describe('isValidModelForProvider', () => {
    it('returns true if model is in catalog for provider', () => {
      expect(isValidModelForProvider('gemini', 'gemini-3.8-flash')).toBe(true);
      expect(isValidModelForProvider('gemini', 'gemini-3.7-flash')).toBe(true);
    });

    it('returns false if model is unknown', () => {
      expect(isValidModelForProvider('gemini', 'gpt-5.2')).toBe(false);
      expect(isValidModelForProvider('gemini', 'unknown-model')).toBe(false);
    });
  });

  describe('isCustomModel', () => {
    it('returns true if model is __custom__ or not in provider catalog', () => {
      expect(isCustomModel('gemini', CUSTOM_MODEL_VALUE)).toBe(true);
      expect(isCustomModel('gemini', 'some-fine-tuned-model')).toBe(true);
    });

    it('returns false if model is in provider catalog', () => {
      expect(isCustomModel('gemini', 'gemini-3.8-flash')).toBe(false);
      expect(isCustomModel('gemini', 'gemini-3.7-flash')).toBe(false);
    });
  });
});
