import { GoogleGenAI } from '@google/genai';

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Network error';

  let raw = '';
  if (typeof error === 'string') {
    raw = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    raw = String((error as { message: unknown }).message || '');
  }

  if (!raw.trim()) return 'Network error';

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.error && typeof parsed.error.message === 'string') {
      return parsed.error.message;
    }
  } catch {
    // Non-JSON string; return raw message
  }

  return raw;
}

export async function testAIConnection(
  apiKey: string,
  model = 'gemini-3.8-flash'
): Promise<ConnectionTestResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return {
      success: false,
      message: 'Please enter an API key first.',
    };
  }

  try {
    const targetModel = model.trim() || 'gemini-3.8-flash';
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    await ai.models.generateContent({
      model: targetModel,
      contents: 'Ping',
    });

    return {
      success: true,
      message: 'Connection verified successfully! The model is responsive.',
    };
  } catch (err: unknown) {
    const detail = extractErrorMessage(err);
    return {
      success: false,
      message: `Connection test failed: ${detail}`,
    };
  }
}
