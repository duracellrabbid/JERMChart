import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseRawAiResponse,
  analyzeChartImage,
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
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
          directors: [{ name: 'Arthur Pendelton', isResident: true, isCorporate: false }],
        },
      ],
      relationships: [
        {
          sourceTempId: 't1',
          targetTempId: 't2',
          ownershipPercentage: 100,
          shareClass: 'Ordinary Shares',
        },
      ],
      warnings: ['Assumed 100% ownership based on vertical hierarchy line'],
    });

    const result = parseRawAiResponse(rawAiOutput);
    expect(result.chart.entities).toHaveLength(2);
    expect(result.chart.relationships).toHaveLength(1);
    expect(result.chart.metadata.chartTitle).toBe('The Wellington Trust Structure');
    expect(result.warnings).toContain('Assumed 100% ownership based on vertical hierarchy line');

    const sourceId = result.chart.relationships[0].source;
    const targetId = result.chart.relationships[0].target;
    expect(result.chart.entities.find((e) => e.id === sourceId)?.name).toBe('The Wellington Trust');
    expect(result.chart.entities.find((e) => e.id === targetId)?.name).toBe('Wellington Holding Ltd');
    expect(result.chart.entities[1].directors[0].name).toBe('Arthur Pendelton');
    expect(result.chart.entities[1].directors[0].isResident).toBe(true);
  });

  it('handles markdown fence wrapped json and assigns fallback values', () => {
    const markdownWrapped = `\`\`\`json
    {
      "entities": [
        {
          "tempId": "node-a",
          "name": "Unknown Entity Ltd",
          "type": "InvalidType",
          "status": "InvalidStatus"
        }
      ],
      "relationships": []
    }
    \`\`\``;

    const result = parseRawAiResponse(markdownWrapped);
    expect(result.chart.entities).toHaveLength(1);
    expect(result.chart.entities[0].type).toBe('Holding Company');
    expect(result.chart.entities[0].status).toBe('Active');
    expect(result.chart.entities[0].jurisdiction).toBe('Unknown Jurisdiction');
    expect(result.chart.metadata.chartTitle).toBe('Inferred Trust Structure');
  });

  it('throws helpful error on malformed JSON payload', () => {
    expect(() => parseRawAiResponse('This is not json at all')).toThrow(
      /failed to extract valid structure/i
    );
  });

  it('calls Google Gemini API via official SDK and returns parsed chart', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      text: JSON.stringify({
        chartTitle: 'Gemini Structure',
        entities: [
          { tempId: 'g1', name: 'Gemini Trust', type: 'Trust', jurisdiction: 'Cayman Islands' },
        ],
        relationships: [],
        warnings: [],
      }),
    });

    const config: AIConfig = {
      provider: 'gemini',
      apiKey: 'test-gemini-key',
      model: 'gemini-2.5-flash',
    };

    const result = await analyzeChartImage('base64imgdata', 'image/jpeg', config);
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-2.5-flash',
        contents: expect.arrayContaining([
          expect.objectContaining({
            inlineData: { mimeType: 'image/jpeg', data: 'base64imgdata' },
          }),
        ]),
      })
    );
    expect(result.chart.metadata.chartTitle).toBe('Gemini Structure');
    expect(result.chart.entities).toHaveLength(1);
  });

  it('calls OpenAI API and returns parsed chart', async () => {
    const mockOpenAIResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              chartTitle: 'OpenAI Structure',
              entities: [
                { tempId: 'o1', name: 'OpenAI Trust', type: 'Trust', jurisdiction: 'Jersey' },
              ],
              relationships: [],
              warnings: [],
            }),
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse,
    });

    const config: AIConfig = {
      provider: 'openai',
      apiKey: 'sk-test-key',
      model: 'gpt-4o',
    };

    const result = await analyzeChartImage('base64imgdata', 'image/jpeg', config);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result.chart.metadata.chartTitle).toBe('OpenAI Structure');
  });

  it('throws error on missing API key', async () => {
    const config: AIConfig = {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
    };

    await expect(analyzeChartImage('data', 'image/jpeg', config)).rejects.toThrow(
      /API key not valid/i
    );
  });

  it('throws error on OpenAI HTTP failure with details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'Quota exceeded',
    });

    const config: AIConfig = {
      provider: 'openai',
      apiKey: 'invalid-key',
      model: 'gpt-4o',
    };

    await expect(analyzeChartImage('data', 'image/jpeg', config)).rejects.toThrow(
      /ai request failed \(400\): Quota exceeded/i
    );
  });
});
