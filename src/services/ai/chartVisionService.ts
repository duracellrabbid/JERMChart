import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { AIConfig } from './aiConfig';
import { callOllamaVision } from './ollamaService';
import { SYSTEM_INSTRUCTION } from './prompts';

export { SYSTEM_INSTRUCTION };
import {
  AssociatedParty,
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
  'Bank',
];

const VALID_STATUSES: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];

function generateSecureId(prefix: string, index = 1): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
  return `${prefix}-${index}-${Date.now()}-${suffix}`;
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

function sanitizeAssociatedParties(rawParties: any[]): AssociatedParty[] {
  if (!Array.isArray(rawParties)) return [];
  const parties: AssociatedParty[] = [];
  rawParties.forEach((p, idx) => {
    const name = String(p?.name || '').trim();
    if (name) {
      parties.push({
        id: generateSecureId('party', idx + 1),
        name,
        role: String(p?.role || 'Director').trim() || 'Director',
        isCorporate: Boolean(p.isCorporate),
        isResident: Boolean(p.isResident),
        appointmentDate: p?.appointmentDate ? String(p.appointmentDate).trim() : undefined,
      });
    }
  });
  return parties;
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

    const rawParties = e.associatedParties || e.directors || [];

    return {
      id: uuid,
      name: String(e.name || `Entity ${idx + 1}`).trim(),
      type: sanitizeEntityType(e.type),
      jurisdiction: String(e.jurisdiction || 'Unknown Jurisdiction').trim(),
      registrationNumber: String(e.registrationNumber || '').trim(),
      taxId: String(e.taxId || '').trim(),
      status: sanitizeEntityStatus(e.status),
      associatedParties: sanitizeAssociatedParties(rawParties),
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

export const CHART_VISION_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  description: 'Extracted corporate and trust structure chart data matching JERMChart schema',
  properties: {
    chartTitle: {
      type: Type.STRING,
      description: 'Title of the chart if stated, or inferred structure title',
    },
    clientReference: {
      type: Type.STRING,
      description: 'Client matter or reference number if visible',
    },
    entities: {
      type: Type.ARRAY,
      description: 'All entity boxes, circular bank nodes, or individuals identified in the chart',
      items: {
        type: Type.OBJECT,
        properties: {
          tempId: {
            type: Type.STRING,
            description: 'Temporary unique identifier for referencing in relationships, e.g. "e1", "e2"',
          },
          name: {
            type: Type.STRING,
            description: 'Full legal name of the entity or individual',
          },
          type: {
            type: Type.STRING,
            description: 'Legal entity type',
            enum: [
              'Trust',
              'Trust Company',
              'Holding Company',
              'Operating Company',
              'LLC',
              'Foundation',
              'Partnership',
              'Individual',
              'Bank',
            ],
          },
          jurisdiction: {
            type: Type.STRING,
            description: 'Jurisdiction of incorporation or governing law (e.g. Jersey, BVI, Singapore)',
          },
          registrationNumber: {
            type: Type.STRING,
            description: 'Registration or company number if shown',
          },
          taxId: {
            type: Type.STRING,
            description: 'Tax identification or TIN if shown',
          },
          status: {
            type: Type.STRING,
            description: 'Operational status of the entity',
            enum: ['Active', 'Dormant', 'In Liquidation', 'Nominee'],
          },
          associatedParties: {
            type: Type.ARRAY,
            description: 'Associated parties (directors, trustees, settlors, protectors, enforcers, signatories)',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Full name of the party',
                },
                role: {
                  type: Type.STRING,
                  description:
                    'Role: Director, Trustee, Settlor, Protector, Enforcer, Asset Contributor, Authorised Signatory, Fund Manager',
                },
                isCorporate: {
                  type: Type.BOOLEAN,
                  description: 'True if party is a corporate entity',
                },
                isResident: {
                  type: Type.BOOLEAN,
                  description: 'True if noted as resident/local',
                },
                appointmentDate: {
                  type: Type.STRING,
                  description: 'Date of appointment if visible',
                },
              },
              required: ['name', 'role'],
            },
          },
          ubosOrBeneficiaries: {
            type: Type.ARRAY,
            description: 'Names of UBOs or beneficiaries noted for this entity',
            items: {
              type: Type.STRING,
            },
          },
          notes: {
            type: Type.STRING,
            description: 'Additional notes or dates written inside or next to this entity',
          },
        },
        required: ['tempId', 'name', 'type', 'jurisdiction'],
      },
    },
    relationships: {
      type: Type.ARRAY,
      description: 'Directional ownership or shareholding connections between entities',
      items: {
        type: Type.OBJECT,
        properties: {
          sourceTempId: {
            type: Type.STRING,
            description: 'tempId of the owner/parent entity (arrow tail / higher tier)',
          },
          targetTempId: {
            type: Type.STRING,
            description: 'tempId of the owned subsidiary entity (arrow head / lower tier)',
          },
          ownershipPercentage: {
            type: Type.NUMBER,
            description: 'Percentage of ownership as a number (0-100, e.g. 100 for 100%)',
          },
          shareClass: {
            type: Type.STRING,
            description: 'Share class description (e.g. "Ordinary Shares", "Class A Shares")',
          },
        },
        required: ['sourceTempId', 'targetTempId', 'ownershipPercentage'],
      },
    },
    warnings: {
      type: Type.ARRAY,
      description:
        'Explanations for inferred percentages (e.g. defaulting unlabeled direct line to 100%) or ambiguous text',
      items: {
        type: Type.STRING,
      },
    },
  },
  required: ['entities', 'relationships'],
};

async function callGeminiVision(
  base64Image: string,
  mimeType: string,
  config: AIConfig
): Promise<string> {
  const model = config.model || 'gemini-3.8-flash';
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
      {
        text: 'Analyze this structure chart and extract all entities, relationships, and metadata strictly following the response schema.',
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: CHART_VISION_RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) throw new Error('AI returned an empty response.');
  return text;
}

export async function analyzeChartImage(
  base64Image: string,
  mimeType: string,
  config: AIConfig,
  signal?: AbortSignal
): Promise<{ chart: TrustStructureChart; warnings: string[] }> {
  if (config.provider === 'ollama') {
    if (!config.ollamaUrl || config.ollamaUrl.trim().length === 0) {
      throw new Error('Ollama Server URL is required. Please configure it in Settings.');
    }
    const jsonText = await callOllamaVision(base64Image, mimeType, config, signal);
    return parseRawAiResponse(jsonText);
  }

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error('API key is required. Please set your API key in Settings.');
  }

  const jsonText = await callGeminiVision(base64Image, mimeType, config);
  return parseRawAiResponse(jsonText);
}
