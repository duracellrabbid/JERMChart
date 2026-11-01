import { AIConfig } from './aiConfig';
import { SYSTEM_INSTRUCTION } from './chartVisionService';

export interface OllamaModelItem {
  name: string;
  isVisionCapable: boolean;
  size: number;
  parameterSize?: string;
}

const VISION_KEYWORDS = [
  'vision',
  'llava',
  'minicpm',
  'qwen2.5-vl',
  'qwen-vl',
  'moondream',
  'mllama',
  'bakllava',
];

export function isVisionModel(name: string, family = ''): boolean {
  const target = `${(name || '').toLowerCase()} ${(family || '').toLowerCase()}`;
  return VISION_KEYWORDS.some((kw) => target.includes(kw));
}

export function sanitizeBaseUrl(url: string): string {
  let cleaned = (url || '').trim();
  if (!cleaned) return '';
  while (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `http://${cleaned}`;
  }
  return cleaned;
}

export function cleanBase64Image(base64: string): string {
  const trimmed = (base64 || '').trim();
  const commaIndex = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1).trim();
  }
  return trimmed;
}

export function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function mapOllamaModelItem(item: any): OllamaModelItem {
  const name = String(item?.name || item?.model || '').trim();
  const family = String(item?.details?.family || '').trim();
  const size = typeof item?.size === 'number' ? item.size : 0;
  const parameterSize = item?.details?.parameter_size ? String(item.details.parameter_size) : undefined;
  return {
    name,
    isVisionCapable: isVisionModel(name, family),
    size,
    parameterSize,
  };
}

export async function fetchOllamaModels(baseUrl: string): Promise<OllamaModelItem[]> {
  const cleanUrl = sanitizeBaseUrl(baseUrl);
  if (!cleanUrl) return [];

  const signal = createTimeoutSignal(5000);
  let res: Response;
  try {
    res = await fetch(`${cleanUrl}/api/tags`, { signal });
  } catch (err: any) {
    throw new Error(
      `Failed to fetch models from Ollama at ${cleanUrl}: ${err?.message || 'Network error'}`,
      { cause: err }
    );
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch models from Ollama: HTTP ${res.status} ${res.statusText}`);
  }

  const data = await res.json().catch(() => ({}));
  const rawModels = Array.isArray(data?.models) ? data.models : [];
  return rawModels.map(mapOllamaModelItem);
}

function isModelInstalled(models: OllamaModelItem[], targetModel: string): boolean {
  const normalized = targetModel.trim().toLowerCase();
  return models.some((m) => {
    const n = m.name.toLowerCase();
    return n === normalized || n === `${normalized}:latest` || n.split(':')[0] === normalized;
  });
}

export async function testOllamaConnection(
  baseUrl: string,
  model?: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = sanitizeBaseUrl(baseUrl);
  if (!cleanUrl) {
    return { success: false, message: 'Ollama Server URL is required.' };
  }

  let version = 'unknown';
  try {
    const res = await fetch(`${cleanUrl}/api/version`, { signal: createTimeoutSignal(5000) });
    if (!res.ok) {
      return {
        success: false,
        message: `Could not connect to Ollama at ${cleanUrl} (HTTP ${res.status} ${res.statusText}).`,
      };
    }
    const data = await res.json().catch(() => ({}));
    if (data?.version) version = String(data.version);
  } catch (err: any) {
    return {
      success: false,
      message: `Could not connect to Ollama at ${cleanUrl}: ${err?.message || 'Server unreachable'}.`,
    };
  }

  const trimmedModel = model?.trim();
  if (!trimmedModel) {
    return { success: true, message: `Connected to Ollama (version ${version}).` };
  }

  let models: OllamaModelItem[];
  try {
    models = await fetchOllamaModels(cleanUrl);
  } catch {
    return {
      success: false,
      message: `Connected to Ollama (version ${version}), but failed to verify installed models.`,
    };
  }

  if (isModelInstalled(models, trimmedModel)) {
    return {
      success: true,
      message: `Connected to Ollama (version ${version}). Model "${trimmedModel}" is ready.`,
    };
  }

  return {
    success: false,
    message: `Connected to Ollama (version ${version}), but model "${trimmedModel}" is not installed. Run "ollama pull ${trimmedModel}" to install it.`,
  };
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
  } catch {
    // fallback to status
  }
  return `HTTP ${res.status} ${res.statusText}`;
}

export async function callOllamaVision(
  base64Image: string,
  mimeType: string,
  config: AIConfig,
  signal?: AbortSignal
): Promise<string> {
  const cleanUrl = sanitizeBaseUrl(config.ollamaUrl);
  if (!cleanUrl) {
    throw new Error('Ollama Server URL is required. Please configure it in Settings.');
  }
  if (!config.model?.trim()) {
    throw new Error('Ollama Model name is required. Please select or configure a model in Settings.');
  }

  const cleanBase64 = cleanBase64Image(base64Image);
  if (!cleanBase64) {
    throw new Error('Image data is required.');
  }

  const payload = {
    model: config.model.trim(),
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      {
        role: 'user',
        content:
          'Analyze this structure chart and extract all entities, relationships, and metadata strictly following the schema.',
        images: [cleanBase64],
      },
    ],
    format: 'json',
    stream: false,
    options: {
      temperature: 0.1,
    },
  };

  const response = await fetch(`${cleanUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errorDetail = await extractErrorMessage(response);
    throw new Error(`Ollama vision request failed: ${errorDetail}`);
  }

  const data = await response.json().catch(() => ({}));
  const content = data?.message?.content;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Ollama returned an empty response.');
  }

  return content;
}
