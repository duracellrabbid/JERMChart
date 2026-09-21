import { GoogleGenAI } from '@google/genai';
import { AIConfig } from './aiConfig';
import {
  Director,
  EntityNodeData,
  EntityStatus,
  EntityType,
  OwnershipEdgeData,
  TrustStructureChart,
} from '../../types/structure';

const VALID_ENTITY_TYPES: EntityType[] = [
  'Trust',
  'Trust Company',
  'Holding Company',
  'Operating Company',
  'LLC',
  'Foundation',
  'Partnership',
  'Individual',
];

const VALID_STATUSES: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];

function generateSecureId(prefix: string, index?: number): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
  return index !== undefined
    ? `${prefix}-${index}-${Date.now()}-${suffix}`
    : `${prefix}-${Date.now()}-${suffix}`;
}

export function extractJsonFromText(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const firstNewline = trimmed.indexOf('\n');
    const lastBackticks = trimmed.lastIndexOf('```');
    if (firstNewline !== -1 && lastBackticks > firstNewline) {
      return trimmed.slice(firstNewline + 1, lastBackticks).trim();
    }
  }
  return trimmed;
}

function sanitizeEntityType(rawType: any): EntityType {
  const typeStr = String(rawType || '').trim().toLowerCase();
  const found = VALID_ENTITY_TYPES.find((t) => t.toLowerCase() === typeStr);
  return found || 'Holding Company';
}

function sanitizeEntityStatus(rawStatus: any): EntityStatus {
  const statusStr = String(rawStatus || '').trim().toLowerCase();
  const found = VALID_STATUSES.find((s) => s.toLowerCase() === statusStr);
  return found || 'Active';
}

function sanitizeDirectors(rawDirectors: any[]): Director[] {
  if (!Array.isArray(rawDirectors)) return [];
  const directors: Director[] = [];
  rawDirectors.forEach((d, idx) => {
    const name = String(d?.name || '').trim();
    if (name) {
      directors.push({
        id: generateSecureId('dir', idx + 1),
        name,
        isCorporate: Boolean(d.isCorporate),
        isResident: Boolean(d.isResident),
      });
    }
  });
  return directors;
}

export function parseRawAiResponse(jsonText: string): { chart: TrustStructureChart; warnings: string[] } {
  const cleanJson = extractJsonFromText(jsonText);
  let parsed: any;
  try {
    parsed = JSON.parse(cleanJson);
  } catch {
    throw new Error('Failed to extract valid structure: response is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entities)) {
    throw new Error('Failed to extract valid structure: missing entities array.');
  }

  const rawEntities: any[] = parsed.entities;
  const rawRelationships: any[] = Array.isArray(parsed.relationships) ? parsed.relationships : [];
  const rawWarnings: any[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];

  const tempIdToUuid = new Map<string, string>();

  const entities: EntityNodeData[] = rawEntities.map((e, idx) => {
    const uuid = generateSecureId('entity', idx + 1);
    const tempId = String(e.tempId || `temp-${idx + 1}`);
    tempIdToUuid.set(tempId, uuid);

    return {
      id: uuid,
      name: String(e.name || `Entity ${idx + 1}`).trim(),
      type: sanitizeEntityType(e.type),
      jurisdiction: String(e.jurisdiction || 'Unknown Jurisdiction').trim(),
      registrationNumber: String(e.registrationNumber || '').trim(),
      taxId: String(e.taxId || '').trim(),
      status: sanitizeEntityStatus(e.status),
      directors: sanitizeDirectors(e.directors),
      ubosOrBeneficiaries: Array.isArray(e.ubosOrBeneficiaries)
        ? e.ubosOrBeneficiaries.map(String).filter(Boolean)
        : [],
      notes: String(e.notes || '').trim(),
    };
  });

  const relationships: OwnershipEdgeData[] = [];
  rawRelationships.forEach((r, idx) => {
    const sourceUuid = tempIdToUuid.get(String(r.sourceTempId || ''));
    const targetUuid = tempIdToUuid.get(String(r.targetTempId || ''));

    if (sourceUuid && targetUuid) {
      let pct = Number.parseFloat(String(r.ownershipPercentage));
      if (Number.isNaN(pct)) pct = 100;

      relationships.push({
        id: generateSecureId('edge', idx + 1),
        source: sourceUuid,
        target: targetUuid,
        ownershipPercentage: pct,
        shareClass: String(r.shareClass || 'Ordinary Shares'),
      });
    }
  });

  const warnings = rawWarnings.map(String).filter(Boolean);

  const chart: TrustStructureChart = {
    metadata: {
      chartTitle: String(parsed.chartTitle || '').trim() || 'Inferred Trust Structure',
      clientReference: String(parsed.clientReference || '').trim(),
      effectiveDate: new Date().toISOString().split('T')[0],
      confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
    },
    entities,
    relationships,
  };

  return { chart, warnings };
}

const SYSTEM_INSTRUCTION = `You are an expert trust, corporate law, and fiduciary chart analyst.
Analyze the provided handwritten or drawn structure chart image and output a clean JSON structure adhering strictly to the schema.
Instructions:
1. Identify each entity box/node: extract name, legal type (Trust, Trust Company, Holding Company, Operating Company, LLC, Foundation, Partnership, Individual), jurisdiction (e.g. Jersey, BVI, Singapore, Cayman Islands, Delaware), registration number, and directors/trustees.
2. Trace directional ownership arrows: the source is the owner/parent entity (higher up in the hierarchy or arrow tail); the target is the subsidiary/owned entity (arrow head).
3. Read written ownership percentages along the lines (e.g. 100%, 50%). If a direct ownership line has no percentage, assume 100% and add a note to warnings.
4. If text is hard to read or ambiguous, make your best educated inference and add an explanatory item to the warnings array.
Output ONLY JSON matching the schema without commentary.`;

async function callGeminiVision(
  base64Image: string,
  mimeType: string,
  config: AIConfig
): Promise<string> {
  const model = config.model || 'gemini-2.5-flash';
  const ai = new GoogleGenAI({ apiKey: config.apiKey.trim() });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
      { text: SYSTEM_INSTRUCTION },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI returned an empty response.');
  return text;
}

async function callOpenAIVision(
  base64Image: string,
  mimeType: string,
  config: AIConfig
): Promise<string> {
  const baseUrl = config.customEndpoint || 'https://api.openai.com/v1';
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const model = config.model || 'gpt-4o';

  const requestBody = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Extract this trust structure chart into JSON.' },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('AI returned an empty response.');
  return text;
}

export async function analyzeChartImage(
  base64Image: string,
  mimeType: string,
  config: AIConfig
): Promise<{ chart: TrustStructureChart; warnings: string[] }> {
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('API key is required. Please set your API key in Settings.');
  }

  const jsonText =
    config.provider === 'openai'
      ? await callOpenAIVision(base64Image, mimeType, config)
      : await callGeminiVision(base64Image, mimeType, config);

  return parseRawAiResponse(jsonText);
}
