import * as XLSX from 'xlsx';
import {
  Director,
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
  if (/^(entity|company|trust)?name$/i.test(h) || h === 'entity' || h === 'company') return 'name';
  if (/^(immediate)?parent(entity|company)?$/i.test(h) || h === 'owner' || h === 'parent') return 'parent';
  if (/^ownership(percentage)?$/i.test(h) || h === 'percentage' || h === 'sharespct' || h === 'holdingpct') return 'ownership';
  if (/^(entity|legal|structure)?type$/i.test(h)) return 'type';
  if (/^(jurisdiction|country|domicile|incorporation)$/i.test(h)) return 'jurisdiction';
  if (/^((entity)?status|state)$/i.test(h)) return 'status';
  if (/^(directors|board|officers|trustees)$/i.test(h)) return 'directors';
  if (/^(registration|reg|company)(number|no)?$/i.test(h)) return 'registrationNumber';
  if (/^(taxid|tin|ein|taxnumber)$/i.test(h)) return 'taxId';
  if (/^(ubos?|beneficiaries|settlor|beneficialowners?|ubosbeneficiaries)$/i.test(h) || h.includes('ubo') || h.includes('beneficiar')) return 'ubos';
  if (/^((share|shares)?class|sharetype)$/i.test(h)) return 'shareClass';
  if (/^(notes?|remarks?|comments?|description)$/i.test(h)) return 'notes';
  return 'unknown';
}

function splitTopLevel(raw: string): string[] {
  // If contains ; or \n, split by [;\n]
  if (/[;\n]/.test(raw)) {
    return raw.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  }
  // Otherwise split by commas not enclosed inside () or []
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

export function parseDirectorString(raw: string): Director[] {
  if (!raw || typeof raw !== 'string') return [];

  const items = splitTopLevel(raw);
  const directors: Director[] = [];

  items.forEach((item, index) => {
    const isCorporate = /[([][^()\[\]]*\b(corp|corporate)\b[^()\[\]]*[)\]]/i.test(item);
    const isResident = /[([][^()\[\]]*\b(res|resident)\b[^()\[\]]*[)\]]/i.test(item);

    // Clean name by stripping tag annotations like (Corp, Res), [Corporate], (Resident), etc.
    const cleanName = item
      .replace(/[([][^()\[\]]*\b(corp|corporate|res|resident)\b[^()\[\]]*[)\]]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName) {
      directors.push({
        id: `dir-parsed-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        isCorporate,
        isResident,
      });
    }
  });

  return directors;
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
    { entity: EntityNodeData; parentNames: { name: string; pct: number; shareClass?: string }[] }
  >();

  rawRows.forEach((row, idx) => {
    // Map normalized columns
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
    if (!entityName) return; // Skip empty rows

    const parentName = String(mapped.parent || '').trim();
    let ownershipPct = parseFloat(String(mapped.ownership));
    if (isNaN(ownershipPct)) ownershipPct = 100;

    const directors = parseDirectorString(String(mapped.directors || ''));
    const ubos = String(mapped.ubos || '')
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Validate type and status
    const validTypes: EntityType[] = [
      'Trust',
      'Holding Company',
      'Operating Company',
      'LLC',
      'Foundation',
      'Partnership',
      'Individual',
    ];
    const matchedType =
      validTypes.find((t) => t.toLowerCase() === String(mapped.type).trim().toLowerCase()) || 'Holding Company';

    const validStatuses: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];
    const matchedStatus =
      validStatuses.find((s) => s.toLowerCase() === String(mapped.status).trim().toLowerCase()) || 'Active';

    const existing = entityMap.get(entityName.toLowerCase());
    if (existing) {
      // Merge multiple rows for the same entity (e.g. multi-parent ownership)
      if (parentName) {
        existing.parentNames.push({
          name: parentName,
          pct: ownershipPct,
          shareClass: String(mapped.shareClass || 'Ordinary Shares'),
        });
      }
    } else {
      const newEntity: EntityNodeData = {
        id: `entity-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: entityName,
        type: matchedType,
        jurisdiction: String(mapped.jurisdiction || 'Unknown Jurisdiction').trim(),
        registrationNumber: String(mapped.registrationNumber || '').trim(),
        taxId: String(mapped.taxId || '').trim(),
        status: matchedStatus,
        directors,
        ubosOrBeneficiaries: ubos,
        notes: String(mapped.notes || '').trim(),
      };

      const parents = parentName
        ? [
            {
              name: parentName,
              pct: ownershipPct,
              shareClass: String(mapped.shareClass || 'Ordinary Shares'),
            },
          ]
        : [];

      entityMap.set(entityName.toLowerCase(), { entity: newEntity, parentNames: parents });
    }
  });

  const entities: EntityNodeData[] = Array.from(entityMap.values()).map((v) => v.entity);
  const relationships: OwnershipEdgeData[] = [];

  entityMap.forEach(({ entity: childEntity, parentNames }) => {
    parentNames.forEach(({ name: pName, pct, shareClass }) => {
      const parentRecord = entityMap.get(pName.toLowerCase());
      if (parentRecord) {
        relationships.push({
          id: `rel-${parentRecord.entity.id}-${childEntity.id}-${relationships.length + 1}`,
          source: parentRecord.entity.id,
          target: childEntity.id,
          ownershipPercentage: pct,
          shareClass,
        });
      } else {
        warnings.push(
          `Entity "${childEntity.name}" references parent "${pName}", but "${pName}" was not found in the spreadsheet.`
        );
      }
    });
  });

  const chartTitle = entities.find((e) => e.type === 'Trust')?.name
    ? `${entities.find((e) => e.type === 'Trust')!.name} Structure`
    : 'Imported Structure Chart';

  return {
    chart: {
      metadata: {
        chartTitle,
        effectiveDate: new Date().toISOString().split('T')[0],
        confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
      },
      entities,
      relationships,
    },
    warnings,
  };
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
      'Directors': 'Apex Trust Corp (Corp, Res); Julian Vance',
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
      'Directors': 'Julian Vance; Helena Sterling',
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
      'Directors': 'David Tan (Res); Helena Sterling',
      'Registration No': '202109124K',
      'Tax ID': 'T21CS0912K',
      'UBOs / Beneficiaries': 'Sterling Global Holdings Ltd',
      'Share Class': 'Ordinary Shares',
      'Notes': 'Operating advisory office',
    },
    {
      'Entity Name': 'Sterling Tech Ventures LLC',
      'Parent Entity': 'Sterling Global Holdings Ltd',
      'Ownership %': 75,
      'Entity Type': 'LLC',
      'Jurisdiction': 'Delaware, USA',
      'Status': 'Active',
      'Directors': 'Julian Vance',
      'Registration No': 'DE-SR-892019',
      'Tax ID': 'EIN-12-901829',
      'UBOs / Beneficiaries': 'Sterling Global Holdings Ltd',
      'Share Class': 'Class A Units',
      'Notes': 'US investment portfolio SPV',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 30 }, // Entity Name
    { wch: 28 }, // Parent Entity
    { wch: 14 }, // Ownership %
    { wch: 18 }, // Entity Type
    { wch: 25 }, // Jurisdiction
    { wch: 12 }, // Status
    { wch: 40 }, // Directors
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
