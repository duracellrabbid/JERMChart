import { describe, it, expect, vi } from 'vitest';
import { extractErrorMessage, testAIConnection } from '../../services/ai/connectionTestService';
import { AIConfig } from '../../services/ai/aiConfig';

const mockGenerateContent = vi.fn();
const mockTestOllamaConnection = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class MockGoogleGenAI {
    models = {
      generateContent: mockGenerateContent,
    };
  },
}));

vi.mock('../../services/ai/ollamaService', () => ({
  testOllamaConnection: (...args: unknown[]) => mockTestOllamaConnection(...args),
}));

describe('connectionTestService', () => {
  describe('extractErrorMessage', () => {
    it('returns default message if error is falsy', () => {
      expect(extractErrorMessage(null)).toBe('Network error');
      expect(extractErrorMessage(undefined)).toBe('Network error');
    });

    it('extracts nested JSON error message from Google GenAI error string', () => {
      const err = new Error(
        JSON.stringify({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
            status: 'INVALID_ARGUMENT',
          },
        })
      );
      expect(extractErrorMessage(err)).toBe('API key not valid. Please pass a valid API key.');
    });

    it('returns raw message if not valid JSON error payload', () => {
      const err = new Error('Connection refused');
      expect(extractErrorMessage(err)).toBe('Connection refused');
    });

    it('handles string input directly', () => {
      expect(extractErrorMessage('Direct error message')).toBe('Direct error message');
    });

    it('handles empty message error objects', () => {
      expect(extractErrorMessage({})).toBe('Network error');
      expect(extractErrorMessage({ message: '' })).toBe('Network error');
      expect(extractErrorMessage({ otherKey: 123 })).toBe('Network error');
    });
  });

  describe('testAIConnection', () => {
    it('returns error if api key is empty or whitespace', async () => {
      const res = await testAIConnection('   ');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Please enter an API key first.');
    });

    it('returns success when model ping succeeds', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });
      const res = await testAIConnection('valid-key', 'gemini-3.8-flash');
      expect(res.success).toBe(true);
      expect(res.message).toContain('Connection verified successfully');
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
          contents: 'Ping',
        })
      );
    });

    it('defaults model to gemini-3.8-flash when model parameter is omitted or empty', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });
      const res = await testAIConnection('valid-key');
      expect(res.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
        })
      );

      mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });
      const resEmpty = await testAIConnection('valid-key', '   ');
      expect(resEmpty.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
        })
      );
    });

    it('handles API rejection and returns extracted error message', async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error(
          JSON.stringify({
            error: {
              message: 'Invalid API key provided.',
            },
          })
        )
      );
      const res = await testAIConnection('invalid-key');
      expect(res.success).toBe(false);
      expect(res.message).toBe('Connection test failed: Invalid API key provided.');
    });

    it('dispatches to testOllamaConnection when config.provider is ollama', async () => {
      mockTestOllamaConnection.mockResolvedValueOnce({
        success: true,
        message: 'Connected to Ollama (version 0.5.1). Model "llama3.2-vision" is ready.',
      });

      const config: AIConfig = {
        provider: 'ollama',
        apiKey: '',
        model: 'llama3.2-vision',
        ollamaUrl: 'http://localhost:11434',
      };

      const res = await testAIConnection('', 'llama3.2-vision', config);
      expect(res.success).toBe(true);
      expect(res.message).toContain('Connected to Ollama');
      expect(mockTestOllamaConnection).toHaveBeenCalledWith('http://localhost:11434', 'llama3.2-vision');
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('continues to use Gemini ping when config provider is gemini', async () => {
      mockGenerateContent.mockResolvedValueOnce({ text: 'Pong' });

      const config: AIConfig = {
        provider: 'gemini',
        apiKey: 'valid-gemini-key',
        model: 'gemini-3.8-flash',
        ollamaUrl: 'http://localhost:11434',
      };

      const res = await testAIConnection('valid-gemini-key', 'gemini-3.8-flash', config);
      expect(res.success).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
          contents: 'Ping',
        })
      );
      expect(mockTestOllamaConnection).not.toHaveBeenCalled();
    });
  });
});
