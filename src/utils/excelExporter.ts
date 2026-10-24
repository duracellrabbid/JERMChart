import * as XLSX from 'xlsx';
import { AssociatedParty, TrustStructureChart } from '../types/structure';

export function formatAssociatedPartiesString(parties: AssociatedParty[]): string {
  if (!Array.isArray(parties) || parties.length === 0) return '';
  return parties
    .map((p) => {
      const tags: string[] = [];
      if (p.isResident) tags.push('Res');
      if (p.isCorporate) tags.push('Corp');
      const rolePrefix = p.role ? `[${p.role}] ` : '';
      const tagStr = tags.length > 0 ? ` (${tags.join(', ')})` : '';
      return `${rolePrefix}${p.name}${tagStr}`;
    })
    .join('; ');
}

export function buildExcelRowsFromChart(chart: TrustStructureChart): Record<string, any>[] {
  const entityIdMap = new Map(chart.entities.map((e) => [e.id, e]));
  const incomingEdgesMap = new Map<string, typeof chart.relationships>();

  chart.relationships.forEach((edge) => {
    const list = incomingEdgesMap.get(edge.target) || [];
    list.push(edge);
    incomingEdgesMap.set(edge.target, list);
  });

  const rows: Record<string, any>[] = [];

  chart.entities.forEach((entity) => {
    const incomingEdges = incomingEdgesMap.get(entity.id) || [];
    const partiesStr = formatAssociatedPartiesString(entity.associatedParties || []);
    const baseFields = {
      'Entity Name': entity.name,
      'Entity Type': entity.type,
      'Jurisdiction': entity.jurisdiction,
      'Status': entity.status,
      'Associated Parties': partiesStr,
      'Directors': partiesStr,
      'Registration No': entity.registrationNumber || '',
      'Tax ID': entity.taxId || '',
      'UBOs / Beneficiaries': (entity.ubosOrBeneficiaries || []).join('; '),
      'Notes': entity.notes || '',
    };

    if (incomingEdges.length === 0) {
      rows.push({
        'Entity Name': baseFields['Entity Name'],
        'Parent Entity': '',
        'Ownership %': 100,
        'Entity Type': baseFields['Entity Type'],
        'Jurisdiction': baseFields['Jurisdiction'],
        'Status': baseFields['Status'],
        'Associated Parties': baseFields['Associated Parties'],
        'Directors': baseFields['Directors'],
        'Registration No': baseFields['Registration No'],
        'Tax ID': baseFields['Tax ID'],
        'UBOs / Beneficiaries': baseFields['UBOs / Beneficiaries'],
        'Share Class': '',
        'Notes': baseFields['Notes'],
      });
    } else {
      incomingEdges.forEach((edge) => {
        const parentEntity = entityIdMap.get(edge.source);
        rows.push({
          'Entity Name': baseFields['Entity Name'],
          'Parent Entity': parentEntity ? parentEntity.name : '',
          'Ownership %': edge.ownershipPercentage ?? 100,
          'Entity Type': baseFields['Entity Type'],
          'Jurisdiction': baseFields['Jurisdiction'],
          'Status': baseFields['Status'],
          'Associated Parties': baseFields['Associated Parties'],
          'Directors': baseFields['Directors'],
          'Registration No': baseFields['Registration No'],
          'Tax ID': baseFields['Tax ID'],
          'UBOs / Beneficiaries': baseFields['UBOs / Beneficiaries'],
          'Share Class': edge.shareClass || 'Ordinary Shares',
          'Notes': baseFields['Notes'],
        });
      });
    }
  });

  return rows;
}

export function exportChartToExcel(chart: TrustStructureChart): Uint8Array {
  const rows = buildExcelRowsFromChart(chart);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  const colWidths = [
    { wch: 32 }, // Entity Name
    { wch: 32 }, // Parent Entity
    { wch: 14 }, // Ownership %
    { wch: 20 }, // Entity Type
    { wch: 24 }, // Jurisdiction
    { wch: 14 }, // Status
    { wch: 40 }, // Associated Parties
    { wch: 35 }, // Directors
    { wch: 20 }, // Registration No
    { wch: 16 }, // Tax ID
    { wch: 35 }, // UBOs / Beneficiaries
    { wch: 24 }, // Share Class
    { wch: 30 }, // Notes
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Trust Structure');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBuffer);
}
