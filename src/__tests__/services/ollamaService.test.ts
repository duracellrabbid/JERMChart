import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isVisionModel,
  sanitizeBaseUrl,
  cleanBase64Image,
  createTimeoutSignal,
  fetchOllamaModels,
  testOllamaConnection,
  callOllamaVision,
  isModelInstalled,
} from '../../services/ai/ollamaService';
import {
  CHART_VISION_SCHEMA,
  SYSTEM_INSTRUCTION,
  VISION_USER_PROMPT,
} from '../../services/ai/prompts';

describe('ollamaService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isVisionModel', () => {
    it('returns true for known vision model names and families', () => {
      expect(isVisionModel('llama3.2-vision:latest')).toBe(true);
      expect(isVisionModel('LLaVA:13b')).toBe(true);
      expect(isVisionModel('minicpm-v:latest')).toBe(true);
      expect(isVisionModel('qwen2.5-vl:7b')).toBe(true);
      expect(isVisionModel('qwen-vl:chat')).toBe(true);
      expect(isVisionModel('moondream:latest')).toBe(true);
      expect(isVisionModel('bakllava:latest')).toBe(true);
      expect(isVisionModel('paligemma:latest')).toBe(true);
      expect(isVisionModel('pixtral:12b')).toBe(true);
      expect(isVisionModel('custom-model:latest', 'mllama')).toBe(true);
      expect(isVisionModel('custom-model:latest', 'vision')).toBe(true);
    });

    it('returns false for non-vision text models', () => {
      expect(isVisionModel('qwen2.5-coder:7b')).toBe(false);
      expect(isVisionModel('llama3:8b')).toBe(false);
      expect(isVisionModel('mistral:7b')).toBe(false);
      expect(isVisionModel('deepseek-r1:8b')).toBe(false);
      expect(isVisionModel('')).toBe(false);
    });

    it('isModelInstalled correctly checks matching model names and tags', () => {
      const models = [{ name: 'llama3.2-vision:latest', isVisionCapable: true, size: 1000 }];
      expect(isModelInstalled(models, 'llama3.2-vision')).toBe(true);
      expect(isModelInstalled(models, 'llama3.2-vision:latest')).toBe(true);
      expect(isModelInstalled(models, 'other-model')).toBe(false);
    });
  });

  describe('sanitizeBaseUrl', () => {
    it('strips trailing slashes cleanly', () => {
      expect(sanitizeBaseUrl('http://localhost:11434/')).toBe('http://localhost:11434');
      expect(sanitizeBaseUrl('http://localhost:11434///')).toBe('http://localhost:11434');
    });

    it('ensures standard protocol prefix when missing', () => {
      expect(sanitizeBaseUrl('localhost:11434')).toBe('http://localhost:11434');
      expect(sanitizeBaseUrl('127.0.0.1:11434/')).toBe('http://127.0.0.1:11434');
    });

    it('preserves https prefix', () => {
      expect(sanitizeBaseUrl('https://ollama.internal:11434/')).toBe('https://ollama.internal:11434');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeBaseUrl('')).toBe('');
      expect(sanitizeBaseUrl('   ')).toBe('');
    });
  });

  describe('createTimeoutSignal', () => {
    it('uses AbortSignal.timeout when available', () => {
      const signal = createTimeoutSignal(1000);
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('falls back to AbortController when AbortSignal.timeout is unavailable', () => {
      vi.useFakeTimers();
      const originalTimeout = AbortSignal.timeout;
      // @ts-expect-error mutating for test
      AbortSignal.timeout = undefined;

      try {
        const signal = createTimeoutSignal(500);
        expect(signal.aborted).toBe(false);
        vi.advanceTimersByTime(500);
        expect(signal.aborted).toBe(true);
      } finally {
        // @ts-expect-error restoring
        AbortSignal.timeout = originalTimeout;
        vi.useRealTimers();
      }
    });
  });

  describe('fetchOllamaModels edge cases', () => {
    it('handles item with empty name and model', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            models: [{ name: '', model: '' }],
          }),
          { status: 200 }
        )
      );

      const models = await fetchOllamaModels('http://localhost:11434');
      expect(models[0].name).toBe('');
    });

    it('handles error without message in fetchOllamaModels', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce({});

      await expect(fetchOllamaModels('http://localhost:11434')).rejects.toThrow(
        /Network error/
      );
    });

    it('handles malformed JSON body in tags response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('not valid json', { status: 200 })
      );

      const models = await fetchOllamaModels('http://localhost:11434');
      expect(models).toEqual([]);
    });
  });

  describe('testOllamaConnection edge cases', () => {
    it('handles error without message in testOllamaConnection', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce({});

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(false);
      expect(res.message).toContain('Server unreachable');
    });
    it('handles missing version in /api/version payload', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200 })
      );

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(true);
      expect(res.message).toContain('version unknown');
    });

    it('handles invalid JSON in /api/version payload', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('not json', { status: 200 })
      );

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(true);
      expect(res.message).toContain('version unknown');
    });
  });

  describe('callOllamaVision edge cases', () => {
    it('handles malformed JSON response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('not json', { status: 200 })
      );

      await expect(
        callOllamaVision('base64data', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/empty response/i);
    });

    it('handles message.content returned as a parsed JSON object', async () => {
      const contentObj = {
        entities: [{ tempId: 'e1', name: 'Alpha Ltd' }],
        relationships: [],
        warnings: [],
      };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: { content: contentObj },
          }),
          { status: 200 }
        )
      );

      const result = await callOllamaVision(
        'base64data',
        'image/png',
        {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        }
      );

      expect(result).toBe(JSON.stringify(contentObj));
    });

    it('handles error response with JSON but missing error property', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'something else' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      );

      await expect(
        callOllamaVision('base64data', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/HTTP 400 Bad Request/);
    });
  });
  describe('cleanBase64Image', () => {
    it('strips data:image/*;base64, prefix', () => {
      expect(cleanBase64Image('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA')).toBe(
        'iVBORw0KGgoAAAANSUhEUgAA'
      );
      expect(cleanBase64Image('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==')).toBe(
        '/9j/4AAQSkZJRgABAQ=='
      );
    });

    it('preserves clean base64 string without data prefix', () => {
      expect(cleanBase64Image('iVBORw0KGgoAAAANSUhEUgAA')).toBe('iVBORw0KGgoAAAANSUhEUgAA');
    });

    it('handles empty input gracefully', () => {
      expect(cleanBase64Image('')).toBe('');
      expect(cleanBase64Image('   ')).toBe('');
    });
  });

  describe('fetchOllamaModels', () => {
    it('returns empty array when baseUrl is empty', async () => {
      const models = await fetchOllamaModels('');
      expect(models).toEqual([]);
    });

    it('fetches and maps models from /api/tags', async () => {
      const mockResponse = {
        models: [
          {
            name: 'llama3.2-vision:latest',
            size: 7924401768,
            details: {
              family: 'mllama',
              parameter_size: '11B',
            },
          },
          {
            name: 'qwen2.5-coder:7b',
            size: 4700000000,
            details: {
              family: 'qwen2',
              parameter_size: '7B',
            },
          },
          {
            name: 'minimal-model',
          },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), { status: 200, statusText: 'OK' })
      );

      const models = await fetchOllamaModels('http://localhost:11434/');
      expect(models).toHaveLength(3);
      expect(models[0]).toEqual({
        name: 'llama3.2-vision:latest',
        isVisionCapable: true,
        size: 7924401768,
        parameterSize: '11B',
      });
      expect(models[1]).toEqual({
        name: 'qwen2.5-coder:7b',
        isVisionCapable: false,
        size: 4700000000,
        parameterSize: '7B',
      });
      expect(models[2]).toEqual({
        name: 'minimal-model',
        isVisionCapable: false,
        size: 0,
        parameterSize: undefined,
      });
    });

    it('handles response without models array', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({}), { status: 200, statusText: 'OK' })
      );

      const models = await fetchOllamaModels('http://localhost:11434');
      expect(models).toEqual([]);
    });

    it('throws error when server responds with non-ok status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' })
      );

      await expect(fetchOllamaModels('http://localhost:11434')).rejects.toThrow(
        /HTTP 500/
      );
    });

    it('throws error when fetch throws network error or timeout', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

      await expect(fetchOllamaModels('http://localhost:11434')).rejects.toThrow(
        /Connection refused/
      );
    });
  });

  describe('testOllamaConnection', () => {
    it('returns error when baseUrl is empty', async () => {
      const res = await testOllamaConnection('');
      expect(res.success).toBe(false);
      expect(res.message).toContain('URL is required');
    });

    it('returns error when endpoint version call fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(false);
      expect(res.message).toContain('ECONNREFUSED');
    });

    it('returns error when endpoint version call returns HTTP error status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Not found', { status: 404, statusText: 'Not Found' })
      );

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(false);
      expect(res.message).toContain('HTTP 404');
    });

    it('returns success for version check when no model is specified', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ version: '0.5.1' }), { status: 200 })
      );

      const res = await testOllamaConnection('http://localhost:11434');
      expect(res.success).toBe(true);
      expect(res.message).toContain('0.5.1');
    });

    it('returns success when specified model is installed', async () => {
      // 1st call for /api/version
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: '0.5.1' }), { status: 200 })
        )
        // 2nd call for /api/tags
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              models: [{ name: 'llama3.2-vision:latest', size: 1000 }],
            }),
            { status: 200 }
          )
        );

      const res = await testOllamaConnection('http://localhost:11434', 'llama3.2-vision');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Model "llama3.2-vision" is ready');
    });

    it('returns warning note when installed model is not vision-capable', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: '0.5.1' }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              models: [{ name: 'gemma4:latest', size: 1000 }],
            }),
            { status: 200 }
          )
        );

      const res = await testOllamaConnection('http://localhost:11434', 'gemma4');
      expect(res.success).toBe(true);
      expect(res.message).toContain('may lack vision/OCR capabilities');
    });

    it('returns failure suggesting ollama pull when model is missing', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: '0.5.1' }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              models: [{ name: 'qwen2.5-coder:7b', size: 1000 }],
            }),
            { status: 200 }
          )
        );

      const res = await testOllamaConnection('http://localhost:11434', 'llama3.2-vision');
      expect(res.success).toBe(false);
      expect(res.message).toContain('ollama pull llama3.2-vision');
    });

    it('returns failure if model verification throws an error', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ version: '0.5.1' }), { status: 200 })
        )
        .mockRejectedValueOnce(new Error('Tags endpoint failed'));

      const res = await testOllamaConnection('http://localhost:11434', 'llama3.2-vision');
      expect(res.success).toBe(false);
      expect(res.message).toContain('failed to verify installed models');
    });
  });

  describe('callOllamaVision', () => {
    it('throws error when ollamaUrl is missing', async () => {
      await expect(
        callOllamaVision('abc123', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: '',
        })
      ).rejects.toThrow(/Ollama Server URL is required/);
    });

    it('throws error when model is missing', async () => {
      await expect(
        callOllamaVision('abc123', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: '',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/model name is required/i);
    });

    it('throws error when image data is empty', async () => {
      await expect(
        callOllamaVision('', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/Image data is required/);
    });

    it('sends correctly structured POST request and returns message content', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: {
              role: 'assistant',
              content: '{"entities": [], "relationships": []}',
            },
          }),
          { status: 200 }
        )
      );

      const result = await callOllamaVision(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA',
        'image/png',
        {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision:latest',
          ollamaUrl: 'http://localhost:11434/',
        }
      );

      expect(result).toBe('{"entities": [], "relationships": []}');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [url, options] = fetchSpy.mock.calls[0];
      expect(url).toBe('http://localhost:11434/api/chat');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });

      const parsedBody = JSON.parse(options.body as string);
      expect(parsedBody.model).toBe('llama3.2-vision:latest');
      expect(parsedBody.format).toEqual(CHART_VISION_SCHEMA);
      expect(parsedBody.stream).toBe(false);
      expect(parsedBody.options.temperature).toBeCloseTo(0.1);
      expect(parsedBody.options.num_ctx).toBe(8192);
      expect(parsedBody.messages[0]).toEqual({
        role: 'system',
        content: SYSTEM_INSTRUCTION,
      });
      expect(parsedBody.messages[1].content).toBe(VISION_USER_PROMPT);
      expect(parsedBody.messages[1].images).toEqual(['iVBORw0KGgoAAAANSUhEUgAA']);
    });

    it('forwards AbortSignal to fetch', async () => {
      const controller = new AbortController();
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: { content: '{"ok": true}' },
          }),
          { status: 200 }
        )
      );

      await callOllamaVision(
        'base64data',
        'image/png',
        {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        },
        controller.signal
      );

      expect(fetchSpy.mock.calls[0][1].signal).toBe(controller.signal);
    });

    it('extracts error from response JSON if request fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'model "llama3.2-vision" not found' }), {
          status: 404,
          statusText: 'Not Found',
        })
      );

      await expect(
        callOllamaVision('base64data', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/model "llama3.2-vision" not found/);
    });

    it('handles non-JSON error response gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Raw bad gateway', {
          status: 502,
          statusText: 'Bad Gateway',
        })
      );

      await expect(
        callOllamaVision('base64data', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/HTTP 502 Bad Gateway/);
    });

    it('throws error when response content is empty', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            message: { content: '   ' },
          }),
          { status: 200 }
        )
      );

      await expect(
        callOllamaVision('base64data', 'image/png', {
          provider: 'ollama',
          apiKey: '',
          model: 'llama3.2-vision',
          ollamaUrl: 'http://localhost:11434',
        })
      ).rejects.toThrow(/empty response/i);
    });
  });
});
