import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseRawAiResponse,
  analyzeChartImage,
  trimTrailingSlashes,
} from '../../services/ai/chartVisionService';
import { AIConfig } from '../../services/ai/aiConfig';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

describe('chartVisionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses valid AI structured output and sanitizes node types and UUIDs', () => {
    const rawAiOutput = JSON.stringify({
      chartTitle: 'The Wellington Trust Structure',
      entities: [
        {
          tempId: 't1',
          name: 'The Wellington Trust',
          type: 'Trust',
          jurisdiction: 'Jersey',
          status: 'Active',
          directors: [],
          notes: 'Settled 2015',
        },
        {
          tempId: 't2',
          name: 'Wellington Holding Ltd',
          type: 'Holding Company',
          jurisdiction: 'BVI',
          status: 'Active',
          directors: [{ name: 'Jane Doe', role: 'Director', isResident: true }],
        },
      ],
      relationships: [
        {
          sourceTempId: 't1',
          targetTempId: 't2',
          ownershipPercentage: 100,
          shareClass: 'Class A Ordinary',
        },
      ],
      warnings: ['Inferred ownership percentage 100% for t1 -> t2'],
    });

    const result = parseRawAiResponse(rawAiOutput);
    expect(result.chart.metadata.chartTitle).toBe('The Wellington Trust Structure');
    expect(result.chart.entities).toHaveLength(2);
    expect(result.chart.relationships).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
  });

  it('parses output wrapped in markdown code fence', () => {
    const payload = {
      chartTitle: 'Clean Markdown Chart',
      entities: [
        {
          tempId: 'm1',
          name: 'Trust Entity',
          type: 'Trust',
          jurisdiction: 'Singapore',
        },
      ],
      relationships: [],
    };
    const wrappedOutput = `\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``;

    const result = parseRawAiResponse(wrappedOutput);
    expect(result.chart.metadata.chartTitle).toBe('Clean Markdown Chart');
    expect(result.chart.entities).toHaveLength(1);
  });

  it('calls Gemini API and returns parsed chart', async () => {
    const mockGeminiResponse = {
      text: JSON.stringify({
        chartTitle: 'Gemini Structure',
        entities: [
          { tempId: 'g1', name: 'Gemini Trust', type: 'Trust', jurisdiction: 'Jersey' },
        ],
        relationships: [],
        warnings: [],
      }),
    };

    mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);

    const config: AIConfig = {
      provider: 'gemini',
      apiKey: 'AIzaSyValidGeminiKey',
      model: 'gemini-3.8-flash',
    };

    const result = await analyzeChartImage('base64imgdata', 'image/jpeg', config);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
        config: { responseMimeType: 'application/json' },
      })
    );
    expect(result.chart.metadata.chartTitle).toBe('Gemini Structure');
  });

  it('throws error on missing API key', async () => {
    const config: AIConfig = {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-3.8-flash',
    };

    await expect(analyzeChartImage('data', 'image/jpeg', config)).rejects.toThrow(
      /api key is required/i
    );
  });

  it('throws error on Gemini API failure with details', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API key not valid'));

    const config: AIConfig = {
      provider: 'gemini',
      apiKey: 'invalid-key',
      model: 'gemini-3.8-flash',
    };

    await expect(analyzeChartImage('data', 'image/jpeg', config)).rejects.toThrow(
      /API key not valid/i
    );
  });

  it('throws error when Gemini returns empty response text', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: '' });
    const config: AIConfig = {
      provider: 'gemini',
      apiKey: 'test-key',
      model: '',
    };

    await expect(analyzeChartImage('data', 'image/jpeg', config)).rejects.toThrow(
      /ai returned an empty response/i
    );
  });

  it('throws error when JSON is missing entities array', () => {
    expect(() => parseRawAiResponse(JSON.stringify({ chartTitle: 'No entities' }))).toThrow(
      /missing entities array/i
    );
    expect(() => parseRawAiResponse(JSON.stringify({ entities: 'not-an-array' }))).toThrow(
      /missing entities array/i
    );
  });

  it('handles entities with missing fields and sanitizes directors and relationships', () => {
    const raw = JSON.stringify({
      chartTitle: ' ',
      clientReference: 'REF-123',
      entities: [
        {
          type: null,
          directors: [null, { name: '  ' }, { name: 'Valid Dir', isCorporate: true }],
          ubosOrBeneficiaries: ['Beneficiary 1', ''],
        },
      ],
      relationships: [
        {
          sourceTempId: '',
          targetTempId: '',
          ownershipPercentage: 'not-a-number',
        },
        {
          sourceTempId: 'temp-1',
          targetTempId: 'temp-1',
          ownershipPercentage: 'invalid',
          shareClass: '',
        },
      ],
      warnings: null,
    });

    const result = parseRawAiResponse(raw);
    expect(result.chart.metadata.chartTitle).toBe('Inferred Trust Structure');
    expect(result.chart.metadata.clientReference).toBe('REF-123');
    expect(result.chart.entities[0].name).toBe('Entity 1');
    expect(result.chart.entities[0].type).toBe('Holding Company');
    expect(result.chart.entities[0].directors).toHaveLength(1);
    expect(result.chart.entities[0].directors[0].name).toBe('Valid Dir');
    expect(result.chart.relationships).toHaveLength(1);
    expect(result.chart.relationships[0].ownershipPercentage).toBe(100);
    expect(result.chart.relationships[0].shareClass).toBe('Ordinary Shares');
    expect(result.warnings).toEqual([]);
  });

  it('handles markdown fence without valid newline or closing backticks', () => {
    const raw = '```json { "entities": [] }';
    expect(() => parseRawAiResponse(raw)).toThrow();
  });

  it('falls back when crypto is undefined or randomUUID is missing', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
    });

    const raw = JSON.stringify({
      entities: [{ name: 'Test' }],
    });
    const result = parseRawAiResponse(raw);
    expect(result.chart.entities).toHaveLength(1);

    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  describe('trimTrailingSlashes', () => {
    it('removes trailing slashes without regex backtracking', () => {
      expect(trimTrailingSlashes('https://generativelanguage.googleapis.com/')).toBe(
        'https://generativelanguage.googleapis.com'
      );
      expect(trimTrailingSlashes('https://generativelanguage.googleapis.com///')).toBe(
        'https://generativelanguage.googleapis.com'
      );
      expect(trimTrailingSlashes('https://generativelanguage.googleapis.com')).toBe(
        'https://generativelanguage.googleapis.com'
      );
    });

    it('handles empty strings, whitespace, and root slashes', () => {
      expect(trimTrailingSlashes('')).toBe('');
      expect(trimTrailingSlashes('   ')).toBe('');
      expect(trimTrailingSlashes('///')).toBe('');
      expect(trimTrailingSlashes('  https://example.com/  ')).toBe('https://example.com');
    });

    it('preserves internal slashes in paths', () => {
      expect(trimTrailingSlashes('https://example.com/api/v2/')).toBe('https://example.com/api/v2');
      expect(trimTrailingSlashes('/a/b/c//')).toBe('/a/b/c');
    });
  });
});
