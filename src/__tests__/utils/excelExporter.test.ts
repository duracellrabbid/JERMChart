import { describe, it, expect } from 'vitest';
import {
  formatDirectorsString,
  buildExcelRowsFromChart,
  exportStructureToExcel,
} from '../../utils/excelExporter';
import { parseExcelWorkbook } from '../../utils/excelParser';
import { TrustStructureChart } from '../../types/structure';

describe('excelExporter', () => {
  it('formats directors into standard delimited strings with flags', () => {
    const directors = [
      { id: '1', name: 'Jane Doe', isCorporate: false, isResident: true },
      { id: '2', name: 'Acme Corp', isCorporate: true, isResident: false },
      { id: '3', name: 'John Smith', isCorporate: false, isResident: false },
    ];
    const formatted = formatDirectorsString(directors);
    expect(formatted).toBe('Jane Doe (Res); Acme Corp (Corp); John Smith');
  });

  it('formats directors with both flags (Res, Corp)', () => {
    const directors = [
      { id: '1', name: 'Alpha Trust Co', isCorporate: true, isResident: true },
    ];
    const formatted = formatDirectorsString(directors);
    expect(formatted).toBe('Alpha Trust Co (Res, Corp)');
  });

  it('handles empty or non-array directors gracefully', () => {
    expect(formatDirectorsString([])).toBe('');
    expect(formatDirectorsString(null as any)).toBe('');
  });

  it('builds excel rows correctly for root entities and multi-parent entities', () => {
    const chart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Test Trust',
        effectiveDate: '2026-09-21',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-1',
          name: 'The Alpha Trust',
          type: 'Trust',
          jurisdiction: 'Jersey',
          status: 'Active',
          directors: [],
          notes: 'Top level trust',
        },
        {
          id: 'ent-2',
          name: 'Beta Holdings Ltd',
          type: 'Holding Company',
          jurisdiction: 'BVI',
          status: 'Active',
          directors: [{ id: 'd1', name: 'Alice', isCorporate: false, isResident: true }],
        },
        {
          id: 'ent-3',
          name: 'Gamma JV Ltd',
          type: 'Operating Company',
          jurisdiction: 'Singapore',
          status: 'Active',
          directors: [],
        },
      ],
      relationships: [
        { id: 'e1', source: 'ent-1', target: 'ent-2', ownershipPercentage: 100 },
        { id: 'e2', source: 'ent-1', target: 'ent-3', ownershipPercentage: 50 },
        { id: 'e3', source: 'ent-2', target: 'ent-3', ownershipPercentage: 50 },
      ],
    };

    const rows = buildExcelRowsFromChart(chart);
    // ent-1 has 0 parents -> 1 row
    // ent-2 has 1 parent -> 1 row
    // ent-3 has 2 parents -> 2 rows
    expect(rows).toHaveLength(4);

    const rootRow = rows.find((r) => r['Entity Name'] === 'The Alpha Trust');
    expect(rootRow?.['Parent Entity']).toBe('');
    expect(rootRow?.['Ownership %']).toBe(100);

    const jvRows = rows.filter((r) => r['Entity Name'] === 'Gamma JV Ltd');
    expect(jvRows).toHaveLength(2);
    expect(jvRows.map((r) => r['Parent Entity']).sort()).toEqual([
      'Beta Holdings Ltd',
      'The Alpha Trust',
    ]);
  });

  it('produces an XLSX binary buffer that parses back accurately', () => {
    const chart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Roundtrip Test',
        effectiveDate: '2026-09-21',
        confidentialityNotice: 'Confidential',
      },
      entities: [
        {
          id: 'ent-1',
          name: 'Summit Trust',
          type: 'Trust',
          jurisdiction: 'Cayman Islands',
          status: 'Active',
          directors: [],
        },
        {
          id: 'ent-2',
          name: 'Summit Operating Co',
          type: 'Operating Company',
          jurisdiction: 'Singapore',
          status: 'Active',
          directors: [{ id: 'd1', name: 'Bob Lee', isCorporate: false, isResident: true }],
        },
      ],
      relationships: [
        { id: 'e1', source: 'ent-1', target: 'ent-2', ownershipPercentage: 100 },
      ],
    };

    const bytes = exportStructureToExcel(chart);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);

    const { chart: parsedChart } = parseExcelWorkbook(bytes);
    expect(parsedChart.entities).toHaveLength(2);
    expect(parsedChart.relationships).toHaveLength(1);
    expect(parsedChart.relationships[0].ownershipPercentage).toBe(100);
  });

  it('handles entities with undefined directors, unknown source entity, and undefined ownership %', () => {
    const chart: TrustStructureChart = {
      metadata: { chartTitle: 'Edge Case Chart' },
      entities: [
        {
          id: 'child-1',
          name: 'Orphan Corp',
          type: 'Operating Company',
          jurisdiction: 'BVI',
          status: 'Active',
          directors: undefined as any,
          ubosOrBeneficiaries: undefined,
        },
      ],
      relationships: [
        {
          id: 'edge-orphan',
          source: 'non-existent-parent',
          target: 'child-1',
          ownershipPercentage: undefined as any,
          shareClass: '',
        },
      ],
    };

    const rows = buildExcelRowsFromChart(chart);
    expect(rows).toHaveLength(1);
    expect(rows[0]['Directors']).toBe('');
    expect(rows[0]['Parent Entity']).toBe('');
    expect(rows[0]['Ownership %']).toBe(100);
    expect(rows[0]['Share Class']).toBe('Ordinary Shares');
  });
});
