export const SYSTEM_INSTRUCTION = `You are an expert trust, corporate law, and fiduciary chart analyst.
Analyze the provided handwritten or drawn structure chart image and output a clean JSON structure adhering strictly to the schema.

Extraction Rules:
1. ENTITY NODES:
   - Identify each entity box, circle, or person. Assign a unique "tempId" (e.g. "e1", "e2").
   - Extract legal name, entity type ('Trust', 'Trust Company', 'Holding Company', 'Operating Company', 'LLC', 'Foundation', 'Partnership', 'Individual', 'Bank'), jurisdiction, registration number, tax ID, and operational status ('Active', 'Dormant', 'In Liquidation', 'Nominee').
   - Bank entities are typically drawn as circular nodes.
   - Extract associated parties (directors, trustees, enforcers, settlors, protectors, asset contributors, authorised signatories, fund managers) with roles, corporate/resident flags, and appointment dates.
   - Extract any named UBOs or trust beneficiaries in "ubosOrBeneficiaries".

2. DIRECTIONAL OWNERSHIP ARROWS:
   - "sourceTempId" is the owner/parent entity (higher in the hierarchy or at the arrow tail).
   - "targetTempId" is the owned/subsidiary entity (lower in the hierarchy or at the arrow head).
   - Read written ownership percentages along the lines (e.g. 100%, 50%). If a direct ownership line has no percentage, assume 100% and add an explanatory note to the "warnings" array.
   - Extract share class if labeled (e.g. "Ordinary Shares", "Class A").

3. AMBIGUITY & UNCERTAINTY:
   - If handwritten text is difficult to read or ambiguous, make your best educated inference and describe the uncertainty in the "warnings" array.`;

export const VISION_USER_PROMPT =
  'Analyze this structure chart and extract all entities, relationships, and metadata strictly following the response schema.';

export function cleanBase64Image(base64: string): string {
  const trimmed = (base64 || '').trim();
  const commaIndex = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1).trim();
  }
  return trimmed;
}

export const CHART_VISION_SCHEMA: Record<string, unknown> = {
  type: 'object',
  description: 'Extracted corporate and trust structure chart data matching JERMChart schema',
  properties: {
    chartTitle: {
      type: 'string',
      description: 'Title of the chart if stated, or inferred structure title',
    },
    clientReference: {
      type: 'string',
      description: 'Client matter or reference number if visible',
    },
    entities: {
      type: 'array',
      description: 'All entity boxes, circular bank nodes, or individuals identified in the chart',
      items: {
        type: 'object',
        properties: {
          tempId: {
            type: 'string',
            description: 'Temporary unique identifier for referencing in relationships, e.g. "e1", "e2"',
          },
          name: {
            type: 'string',
            description: 'Full legal name of the entity or individual',
          },
          type: {
            type: 'string',
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
            type: 'string',
            description: 'Jurisdiction of incorporation or governing law (e.g. Jersey, BVI, Singapore)',
          },
          registrationNumber: {
            type: 'string',
            description: 'Registration or company number if shown',
          },
          taxId: {
            type: 'string',
            description: 'Tax identification or TIN if shown',
          },
          status: {
            type: 'string',
            description: 'Operational status of the entity',
            enum: ['Active', 'Dormant', 'In Liquidation', 'Nominee'],
          },
          associatedParties: {
            type: 'array',
            description: 'Associated parties (directors, trustees, settlors, protectors, enforcers, signatories)',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Full name of the party',
                },
                role: {
                  type: 'string',
                  description:
                    'Role: Director, Trustee, Settlor, Protector, Enforcer, Asset Contributor, Authorised Signatory, Fund Manager',
                },
                isCorporate: {
                  type: 'boolean',
                  description: 'True if party is a corporate entity',
                },
                isResident: {
                  type: 'boolean',
                  description: 'True if noted as resident/local',
                },
                appointmentDate: {
                  type: 'string',
                  description: 'Date of appointment if visible',
                },
              },
              required: ['name', 'role'],
            },
          },
          ubosOrBeneficiaries: {
            type: 'array',
            description: 'Names of UBOs or beneficiaries noted for this entity',
            items: {
              type: 'string',
            },
          },
          notes: {
            type: 'string',
            description: 'Additional notes or dates written inside or next to this entity',
          },
        },
        required: ['tempId', 'name', 'type', 'jurisdiction'],
      },
    },
    relationships: {
      type: 'array',
      description: 'Directional ownership or shareholding connections between entities',
      items: {
        type: 'object',
        properties: {
          sourceTempId: {
            type: 'string',
            description: 'tempId of the owner/parent entity (arrow tail / higher tier)',
          },
          targetTempId: {
            type: 'string',
            description: 'tempId of the owned subsidiary entity (arrow head / lower tier)',
          },
          ownershipPercentage: {
            type: 'number',
            description: 'Percentage of ownership as a number (0-100, e.g. 100 for 100%)',
          },
          shareClass: {
            type: 'string',
            description: 'Share class description (e.g. "Ordinary Shares", "Class A Shares")',
          },
        },
        required: ['sourceTempId', 'targetTempId', 'ownershipPercentage'],
      },
    },
    warnings: {
      type: 'array',
      description:
        'Explanations for inferred percentages (e.g. defaulting unlabeled direct line to 100%) or ambiguous text',
      items: {
        type: 'string',
      },
    },
  },
  required: ['entities', 'relationships'],
};
