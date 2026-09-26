import * as XLSX from 'xlsx';
import { Director, TrustStructureChart } from '../types/structure';

export function formatDirectorsString(directors: Director[]): string {
  if (!Array.isArray(directors) || directors.length === 0) return '';
  return directors
    .map((d) => {
      const tags: string[] = [];
      if (d.isResident) tags.push('Res');
      if (d.isCorporate) tags.push('Corp');
      const tagStr = tags.length > 0 ? ` (${tags.join(', ')})` : '';
      return `${d.name}${tagStr}`;
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
    const baseFields = {
      'Entity Name': entity.name,
      'Entity Type': entity.type,
      'Jurisdiction': entity.jurisdiction,
      'Status': entity.status,
      'Directors': formatDirectorsString(entity.directors || []),
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

export function exportStructureToExcel(chart: TrustStructureChart): Uint8Array {
  const rows = buildExcelRowsFromChart(chart);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

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
