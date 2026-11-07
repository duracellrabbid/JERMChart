import chartVisionSpec from './chartVisionSchema.json';

export const SYSTEM_INSTRUCTION: string = chartVisionSpec.systemInstruction;

export const VISION_USER_PROMPT: string = chartVisionSpec.visionUserPrompt;

export function cleanBase64Image(base64: string): string {
  const trimmed = (base64 || '').trim();
  const commaIndex = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1).trim();
  }
  return trimmed;
}

export const CHART_VISION_SCHEMA: Record<string, unknown> =
  chartVisionSpec.schema as Record<string, unknown>;
