import * as XLSX from 'xlsx';
import {
  AssociatedParty,
  AssociatedRole,
  EntityNodeData,
  EntityStatus,
  EntityType,
  OwnershipEdgeData,
  TrustStructureChart,
} from '../types/structure';

export type NormalizedColumn =
  | 'name'
  | 'parent'
  | 'ownership'
  | 'type'
  | 'jurisdiction'
  | 'status'
  | 'directors'
  | 'registrationNumber'
  | 'taxId'
  | 'ubos'
  | 'shareClass'
  | 'notes'
  | 'unknown';

export function normalizeColumnHeader(header: string): NormalizedColumn {
  const h = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(?:entity|company|trust)?name$/i.test(h) || h === 'entity' || h === 'company') return 'name';
  if (/^(?:immediate)?parent(?:entity|company)?$/i.test(h) || h === 'owner' || h === 'parent') return 'parent';
  if (/^ownership(?:percentage)?$/i.test(h) || h === 'percentage' || h === 'sharespct' || h === 'holdingpct') return 'ownership';
  if (/^(?:entity|legal|structure)?type$/i.test(h)) return 'type';
  if (/^(?:jurisdiction|country|domicile|incorporation)$/i.test(h)) return 'jurisdiction';
  if (/^(?:(?:entity)?status|state)$/i.test(h)) return 'status';
  if (/^(?:directors|board|officers|trustees|parties|associatedparties)$/i.test(h)) return 'directors';
  if (/^(?:registration|reg|company)(?:number|no)?$/i.test(h)) return 'registrationNumber';
  if (/^(?:taxid|tin|ein|taxnumber)$/i.test(h)) return 'taxId';
  if (/^(?:ubos?|beneficiaries|settlor|beneficialowners?|ubosbeneficiaries)$/i.test(h) || h.includes('ubo') || h.includes('beneficiar')) return 'ubos';
  if (/^(?:(?:share|shares)?class|sharetype)$/i.test(h)) return 'shareClass';
  if (/^(?:notes?|remarks?|comments?|description)$/i.test(h)) return 'notes';
  return 'unknown';
}

function splitTopLevel(raw: string): string[] {
  if (/[;\n]/.test(raw)) {
    return raw.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (char === '(' || char === '[') {
      depth++;
    } else if (char === ')' || char === ']') {
      depth = Math.max(0, depth - 1);
    }

    if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function generateSecureId(prefix: string, index = 1): string {
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);
  return `${prefix}-${index}-${Date.now()}-${suffix}`;
}

function extractRoleFromItem(item: string): { role: string; stripped: string } {
  const roleMatch = item.match(/\[([^[\]]+)\]/);
  if (roleMatch) {
    const candidate = roleMatch[1].trim();
    if (!/^(?:corp|corporate|res|resident)$/i.test(candidate)) {
      return {
        role: candidate,
        stripped: item.replace(roleMatch[0], '').trim(),
      };
    }
  }
  return { role: 'Director', stripped: item };
}

export function parseAssociatedPartiesString(raw: string): AssociatedParty[] {
  if (!raw || typeof raw !== 'string') return [];

  const items = splitTopLevel(raw);
  const parties: AssociatedParty[] = [];

  items.forEach((item, index) => {
    const isCorporate = /[([][^()[\]]*\b(?:corp|corporate)\b[^()[\]]*[)\]]/i.test(item);
    const isResident = /[([][^()[\]]*\b(?:res|resident)\b[^()[\]]*[)\]]/i.test(item);

    const { role, stripped } = extractRoleFromItem(item);

    const cleanName = stripped
      .replace(/[([][^()[\]]*\b(?:corp|corporate|res|resident)\b[^()[\]]*[)\]]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName) {
      parties.push({
        id: generateSecureId('party-parsed', index),
        name: cleanName,
        role: role as AssociatedRole,
        isCorporate,
        isResident,
      });
    }
  });

  return parties;
}

export function parseDirectorString(raw: string): AssociatedParty[] {
  return parseAssociatedPartiesString(raw);
}

function resolveEntityType(rawType: any): EntityType {
  const str = String(rawType || '').trim().toLowerCase();
  if (str.includes('bank')) return 'Bank';
  if (str === 'trust company') return 'Trust Company';
  if (str.includes('trust')) return 'Trust';
  if (str.includes('holding')) return 'Holding Company';
  if (str.includes('operating')) return 'Operating Company';
  if (str.includes('llc')) return 'LLC';
  if (str.includes('foundation')) return 'Foundation';
  if (str.includes('partnership')) return 'Partnership';
  if (str.includes('individual')) return 'Individual';
  return 'Holding Company';
}

function resolveEntityStatus(rawStatus: any): EntityStatus {
  const str = String(rawStatus || '').trim().toLowerCase();
  if (str === 'dormant') return 'Dormant';
  if (str.includes('liquidation')) return 'In Liquidation';
  if (str === 'nominee') return 'Nominee';
  return 'Active';
}

export function parseExcelWorkbook(
  fileBuffer: ArrayBuffer | Uint8Array
): { chart: TrustStructureChart; warnings: string[] } {
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('Excel workbook contains no sheets.');

  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const warnings: string[] = [];
  const entityMap = new Map<
    string,
    { entity: EntityNodeData; parentNames: { name: string; pct: number; shareClass: string }[] }
  >();

  rawRows.forEach((row, idx) => {
    const mapped: Record<NormalizedColumn, any> = {
      name: '',
      parent: '',
      ownership: 100,
      type: 'Holding Company',
      jurisdiction: 'Unknown Jurisdiction',
      status: 'Active',
      directors: '',
      registrationNumber: '',
      taxId: '',
      ubos: '',
      shareClass: 'Ordinary Shares',
      notes: '',
      unknown: '',
    };

    Object.entries(row).forEach(([colHeader, val]) => {
      const norm = normalizeColumnHeader(colHeader);
      mapped[norm] = val;
    });

    const entityName = String(mapped.name || '').trim();
    if (!entityName) return;

    const parentName = String(mapped.parent || '').trim();
    let ownershipPct = Number.parseFloat(String(mapped.ownership));
    if (Number.isNaN(ownershipPct)) ownershipPct = 100;

    const parties = parseAssociatedPartiesString(String(mapped.directors || ''));
    const ubos = String(mapped.ubos || '')
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const matchedType = resolveEntityType(mapped.type);
    const matchedStatus = resolveEntityStatus(mapped.status);

    const existing = entityMap.get(entityName.toLowerCase());
    if (existing) {
      if (parentName) {
        existing.parentNames.push({
          name: parentName,
          pct: ownershipPct,
          shareClass: String(mapped.shareClass || 'Ordinary Shares'),
        });
      }
    } else {
      const newEntity: EntityNodeData = {
        id: generateSecureId('entity', idx + 1),
        name: entityName,
        type: matchedType,
        jurisdiction: String(mapped.jurisdiction || 'Unknown Jurisdiction').trim(),
        registrationNumber: String(mapped.registrationNumber || '').trim(),
        taxId: String(mapped.taxId || '').trim(),
        status: matchedStatus,
        associatedParties: parties,
        ubosOrBeneficiaries: ubos,
        notes: String(mapped.notes || '').trim(),
      };

      entityMap.set(entityName.toLowerCase(), {
        entity: newEntity,
        parentNames: parentName
          ? [
              {
                name: parentName,
                pct: ownershipPct,
                shareClass: String(mapped.shareClass || 'Ordinary Shares'),
              },
            ]
          : [],
      });
    }
  });

  const entities: EntityNodeData[] = [];
  const relationships: OwnershipEdgeData[] = [];

  entityMap.forEach(({ entity, parentNames }) => {
    entities.push(entity);

    parentNames.forEach((parent) => {
      const parentEntry = entityMap.get(parent.name.toLowerCase());
      if (parentEntry) {
        relationships.push({
          id: `rel-${parentEntry.entity.id}-${entity.id}-${relationships.length}`,
          source: parentEntry.entity.id,
          target: entity.id,
          ownershipPercentage: parent.pct,
          shareClass: parent.shareClass,
        });
      } else {
        warnings.push(
          `Entity "${entity.name}" specified parent "${parent.name}", but "${parent.name}" was not found in the spreadsheet.`
        );
      }
    });
  });

  const chartTitle = entities.find((e) => e.type === 'Trust')?.name
    ? `${entities.find((e) => e.type === 'Trust')!.name} Structure`
    : 'Imported Structure Chart';

  const chart: TrustStructureChart = {
    metadata: {
      chartTitle,
      effectiveDate: new Date().toISOString().split('T')[0],
      confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
    },
    entities,
    relationships,
  };

  return { chart, warnings };
}

export function generateExcelTemplate(): Uint8Array {
  const sampleRows = [
    {
      'Entity Name': 'The Sterling Family Trust',
      'Parent Entity': '',
      'Ownership %': '',
      'Entity Type': 'Trust',
      'Jurisdiction': 'Jersey, Channel Islands',
      'Status': 'Active',
      'Directors': '[Trustee] Apex Trust Corp (Corp, Res); [Settlor] Marcus Sterling',
      'Registration No': 'TR-JER-9120',
      'Tax ID': 'TIN-00192',
      'UBOs / Beneficiaries': 'Marcus Sterling (Settlor)',
      'Share Class': '',
      'Notes': 'Discretionary irrevocable trust governed by Jersey Law',
    },
    {
      'Entity Name': 'Sterling Global Holdings Ltd',
      'Parent Entity': 'The Sterling Family Trust',
      'Ownership %': 100,
      'Entity Type': 'Holding Company',
      'Jurisdiction': 'British Virgin Islands (BVI)',
      'Status': 'Active',
      'Directors': '[Director] Julian Vance; [Director] Helena Sterling',
      'Registration No': 'BVI-BC-109281',
      'Tax ID': '',
      'UBOs / Beneficiaries': 'The Sterling Family Trust',
      'Share Class': 'Ordinary Voting Shares',
      'Notes': 'Primary holding vehicle',
    },
    {
      'Entity Name': 'Sterling Asia Capital Pte Ltd',
      'Parent Entity': 'Sterling Global Holdings Ltd',
      'Ownership %': 100,
      'Entity Type': 'Operating Company',
      'Jurisdiction': 'Singapore',
      'Status': 'Active',
      'Directors': '[Director] David Tan (Res); [Fund Manager] Alpha Asset Advisors (Corp)',
      'Registration No': '202109124K',
      'Tax ID': 'T21CS0912K',
      'UBOs / Beneficiaries': 'Sterling Global Holdings Ltd',
      'Share Class': 'Ordinary Shares',
      'Notes': 'Operating advisory office',
    },
    {
      'Entity Name': 'Sterling Private Bank',
      'Parent Entity': 'Sterling Asia Capital Pte Ltd',
      'Ownership %': 100,
      'Entity Type': 'Bank',
      'Jurisdiction': 'Singapore',
      'Status': 'Active',
      'Directors': '[Authorised Signatory] David Tan (Res)',
      'Registration No': 'ACC-99120',
      'Tax ID': '',
      'UBOs / Beneficiaries': 'Sterling Asia Capital Pte Ltd',
      'Share Class': 'Depository Account',
      'Notes': 'Primary treasury bank',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);

  ws['!cols'] = [
    { wch: 30 }, // Entity Name
    { wch: 28 }, // Parent Entity
    { wch: 14 }, // Ownership %
    { wch: 18 }, // Entity Type
    { wch: 25 }, // Jurisdiction
    { wch: 12 }, // Status
    { wch: 45 }, // Directors / Associated Parties
    { wch: 20 }, // Registration No
    { wch: 16 }, // Tax ID
    { wch: 28 }, // UBOs
    { wch: 22 }, // Share Class
    { wch: 40 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Structure');
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buffer);
}
