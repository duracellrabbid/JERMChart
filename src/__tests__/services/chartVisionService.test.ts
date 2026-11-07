import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseRawAiResponse,
  analyzeChartImage,
  CHART_VISION_RESPONSE_SCHEMA,
  SYSTEM_INSTRUCTION,
} from '../../services/ai/chartVisionService';
import {
  CHART_VISION_SCHEMA,
  VISION_USER_PROMPT,
} from '../../services/ai/prompts';
import rawVisionSpec from '../../services/ai/chartVisionSchema.json';
import { AIConfig } from '../../services/ai/aiConfig';

const mockGenerateContent = vi.fn();
const mockCallOllamaVision = vi.fn();

vi.mock('@google/genai', () => ({
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    ARRAY: 'ARRAY',
    BOOLEAN: 'BOOLEAN',
  },
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

vi.mock('../../services/ai/ollamaService', () => ({
  callOllamaVision: (...args: unknown[]) => mockCallOllamaVision(...args),
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

  it('calls Gemini API and passes responseSchema, systemInstruction, and image payload', async () => {
    const mockGeminiResponse = {
      text: JSON.stringify({
        chartTitle: 'Gemini Structure',
        entities: [
          {
            tempId: 'g1',
            name: 'Gemini Trust',
            type: 'Trust',
            jurisdiction: 'Jersey',
            registrationNumber: 'REG-999',
            taxId: 'TIN-888',
            status: 'Active',
            associatedParties: [
              {
                name: 'Alice Trustee',
                role: 'Trustee',
                isCorporate: false,
                isResident: true,
                appointmentDate: '2020-01-15',
              },
            ],
            ubosOrBeneficiaries: ['Beneficiary Alice'],
            notes: 'Primary Trust Node',
          },
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

    const result = await analyzeChartImage(
      'data:image/jpeg;base64,base64imgdata',
      'image/jpeg',
      config
    );
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: 'base64imgdata',
            },
          },
          {
            text: VISION_USER_PROMPT,
          },
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: CHART_VISION_RESPONSE_SCHEMA,
        },
      })
    );
    expect(result.chart.metadata.chartTitle).toBe('Gemini Structure');
    expect(result.chart.entities[0].associatedParties[0].appointmentDate).toBe('2020-01-15');
    expect(result.chart.entities[0].taxId).toBe('TIN-888');
    expect(result.chart.entities[0].registrationNumber).toBe('REG-999');
    expect(result.chart.entities[0].ubosOrBeneficiaries).toEqual(['Beneficiary Alice']);
  });

  it('validates that CHART_VISION_RESPONSE_SCHEMA contains correct constraints and enums', () => {
    expect(CHART_VISION_RESPONSE_SCHEMA).toBeDefined();
    expect(CHART_VISION_RESPONSE_SCHEMA).toBe(CHART_VISION_SCHEMA);
    expect(CHART_VISION_RESPONSE_SCHEMA.type).toBe('object');
    expect(CHART_VISION_RESPONSE_SCHEMA.required).toEqual(['entities', 'relationships']);

    const entityProps = (CHART_VISION_RESPONSE_SCHEMA.properties as any).entities.items.properties;
    expect(entityProps.tempId).toBeDefined();
    expect(entityProps.type.enum).toContain('Trust');
    expect(entityProps.type.enum).toContain('Bank');
    expect(entityProps.type.enum).toContain('Individual');
    expect(entityProps.status.enum).toEqual(['Active', 'Dormant', 'In Liquidation', 'Nominee']);
    expect(entityProps.associatedParties.items.properties.appointmentDate).toBeDefined();

    const relProps = (CHART_VISION_RESPONSE_SCHEMA.properties as any).relationships.items.properties;
    expect(relProps.sourceTempId).toBeDefined();
    expect(relProps.targetTempId).toBeDefined();
    expect(relProps.ownershipPercentage).toBeDefined();
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
    expect(result.chart.entities[0].associatedParties).toHaveLength(1);
    expect(result.chart.entities[0].associatedParties[0].name).toBe('Valid Dir');
    expect(result.chart.relationships).toHaveLength(1);
    expect(result.chart.relationships[0].ownershipPercentage).toBe(100);
    expect(result.chart.relationships[0].shareClass).toBe('Ordinary Shares');
    expect(result.warnings).toEqual([]);
  });

  it('handles markdown fence without valid newline or closing backticks', () => {
    const raw = '```json { "entities": [] }';
    expect(() => parseRawAiResponse(raw)).toThrow();
  });

  it('handles non-array associatedParties and blank role string in AI response', () => {
    const raw = JSON.stringify({
      entities: [
        {
          name: 'Firm Ltd',
          associatedParties: 'not-an-array',
        },
        {
          name: 'Trust Corp',
          associatedParties: [
            { name: 'John Doe', role: '   ' },
          ],
        },
      ],
    });
    const result = parseRawAiResponse(raw);
    expect(result.chart.entities[0].associatedParties).toEqual([]);
    expect(result.chart.entities[1].associatedParties[0].role).toBe('Director');
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

  describe('analyzeChartImage with Ollama provider', () => {
    it('dispatches to callOllamaVision and forwards signal when provider is ollama', async () => {
      const mockOllamaResponse = JSON.stringify({
        chartTitle: 'Ollama Dispatched Structure',
        entities: [
          {
            tempId: 'o1',
            name: 'Ollama Trust',
            type: 'Trust',
            jurisdiction: 'Jersey',
          },
        ],
        relationships: [],
        warnings: [],
      });

      mockCallOllamaVision.mockResolvedValueOnce(mockOllamaResponse);

      const controller = new AbortController();
      const config: AIConfig = {
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: 'http://localhost:11434',
      };

      const result = await analyzeChartImage('base64imgdata', 'image/png', config, controller.signal);

      expect(mockCallOllamaVision).toHaveBeenCalledWith(
        'base64imgdata',
        'image/png',
        config,
        controller.signal
      );
      expect(result.chart.metadata.chartTitle).toBe('Ollama Dispatched Structure');
      expect(result.chart.entities).toHaveLength(1);
      expect(result.chart.entities[0].name).toBe('Ollama Trust');
    });

    it('throws error when provider is ollama and ollamaUrl is missing or whitespace', async () => {
      const configMissingUrl: AIConfig = {
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: '',
      };

      await expect(
        analyzeChartImage('base64imgdata', 'image/png', configMissingUrl)
      ).rejects.toThrow('Ollama Server URL is required. Please configure it in Settings.');

      const configWhitespaceUrl: AIConfig = {
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: '   ',
      };

      await expect(
        analyzeChartImage('base64imgdata', 'image/png', configWhitespaceUrl)
      ).rejects.toThrow('Ollama Server URL is required. Please configure it in Settings.');
    });
  });

  describe('analyzeChartImage with Gemini provider and AbortSignal', () => {
    it('rejects with AbortError when signal is already aborted prior to Gemini vision request', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        analyzeChartImage(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
          'image/png',
          { provider: 'gemini', apiKey: 'test-key', model: 'gemini-3.8-flash', ollamaUrl: '' },
          controller.signal
        )
      ).rejects.toThrow('The user aborted a request.');

      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('rejects with AbortError when signal is aborted while Gemini vision request is in-flight', async () => {
      const controller = new AbortController();

      mockGenerateContent.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ text: JSON.stringify({ chartTitle: 'Delayed', entities: [], relationships: [] }) });
            }, 100);
          })
      );

      const promise = analyzeChartImage(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'image/png',
        { provider: 'gemini', apiKey: 'test-key', model: 'gemini-3.8-flash', ollamaUrl: '' },
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The user aborted a request.');
    });

    it('completes Gemini vision request successfully when signal is provided but not aborted', async () => {
      const controller = new AbortController();

      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({ chartTitle: 'Active Gemini Chart', entities: [{ name: 'E1' }], relationships: [] }),
      });

      const result = await analyzeChartImage(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'image/png',
        { provider: 'gemini', apiKey: 'test-key', model: 'gemini-3.8-flash', ollamaUrl: '' },
        controller.signal
      );

      expect(result.chart.metadata.chartTitle).toBe('Active Gemini Chart');
      expect(result.chart.entities).toHaveLength(1);
    });
  });

  describe('Canonical chartVisionSchema.json synchronization', () => {
    it('exports SYSTEM_INSTRUCTION, VISION_USER_PROMPT, and CHART_VISION_SCHEMA from canonical JSON', () => {
      expect(SYSTEM_INSTRUCTION).toBe(rawVisionSpec.systemInstruction);
      expect(VISION_USER_PROMPT).toBe(rawVisionSpec.visionUserPrompt);
      expect(CHART_VISION_SCHEMA).toEqual(rawVisionSpec.schema);
    });

    it('parses and preserves Individual alongside corporate entities with personal names', () => {
      const response = JSON.stringify({
        chartTitle: 'Family & Corporate Structure',
        entities: [
          {
            tempId: 'e1',
            name: 'Alex Tan',
            type: 'Individual',
            jurisdiction: 'Singapore',
            status: 'Active',
          },
          {
            tempId: 'e2',
            name: 'George 1 PL',
            type: 'Operating Company',
            jurisdiction: 'Singapore',
            status: 'Active',
          },
          {
            tempId: 'e3',
            name: 'Licenced Trustee A',
            type: 'Trust Company',
            jurisdiction: 'Singapore',
            status: 'Active',
          },
        ],
        relationships: [
          {
            sourceTempId: 'e1',
            targetTempId: 'e2',
            ownershipPercentage: 100,
            shareClass: 'Ordinary Shares',
          },
        ],
        warnings: [],
      });

      const parsed = parseRawAiResponse(response);
      expect(parsed.chart.entities).toHaveLength(3);
      expect(parsed.chart.entities[0].name).toBe('Alex Tan');
      expect(parsed.chart.entities[0].type).toBe('Individual');
      expect(parsed.chart.entities[1].name).toBe('George 1 PL');
      expect(parsed.chart.entities[1].type).toBe('Operating Company');
      expect(parsed.chart.entities[2].name).toBe('Licenced Trustee A');
      expect(parsed.chart.entities[2].type).toBe('Trust Company');
      expect(parsed.chart.relationships[0].ownershipPercentage).toBe(100);
    });
  });
});
