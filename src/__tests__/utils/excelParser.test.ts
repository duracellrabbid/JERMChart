import { describe, it, expect, vi } from 'vitest';
import {
  parseDirectorString,
  normalizeColumnHeader,
  parseExcelWorkbook,
  generateExcelTemplate,
} from '../../utils/excelParser';
import * as XLSX from 'xlsx';

const { setMockEmptySheets } = vi.hoisted(() => {
  let mockEmptySheets = false;
  return {
    setMockEmptySheets: (val: boolean) => {
      mockEmptySheets = val;
    },
    getMockEmptySheets: () => mockEmptySheets,
  };
});

vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  const { getMockEmptySheets } = await import('vitest').then(() => ({
    getMockEmptySheets: () => {
      try {
        return (globalThis as any).__mockEmptySheets;
      } catch {
        return false;
      }
    },
  }));

  return {
    ...actual,
    read: (...args: [any, any?]) => {
      if ((globalThis as any).__mockEmptySheets) {
        return { SheetNames: [], Sheets: {} };
      }
      return actual.read(args[0], args[1]);
    },
  };
});

describe('excelParser', () => {
  it('parses director string with corporate and resident tags', () => {
    const raw = 'Apex Trust Corp (Corp, Res); Julian Vance; Helena Sterling (Resident); Pacific Nominees [Corporate]';
    const directors = parseDirectorString(raw);

    expect(directors.length).toBe(4);
    expect(directors[0]).toMatchObject({ name: 'Apex Trust Corp', isCorporate: true, isResident: true });
    expect(directors[1]).toMatchObject({ name: 'Julian Vance', isCorporate: false, isResident: false });
    expect(directors[2]).toMatchObject({ name: 'Helena Sterling', isCorporate: false, isResident: true });
    expect(directors[3]).toMatchObject({ name: 'Pacific Nominees', isCorporate: true, isResident: false });
  });

  it('normalizes header column aliases', () => {
    expect(normalizeColumnHeader('Company Name')).toBe('name');
    expect(normalizeColumnHeader('Immediate Parent')).toBe('parent');
    expect(normalizeColumnHeader('Ownership %')).toBe('ownership');
    expect(normalizeColumnHeader('Legal Type')).toBe('type');
    expect(normalizeColumnHeader('Domicile')).toBe('jurisdiction');
    expect(normalizeColumnHeader('Status')).toBe('status');
    expect(normalizeColumnHeader('Directors')).toBe('directors');
    expect(normalizeColumnHeader('Registration No')).toBe('registrationNumber');
    expect(normalizeColumnHeader('Tax ID')).toBe('taxId');
    expect(normalizeColumnHeader('UBOs / Beneficiaries')).toBe('ubos');
    expect(normalizeColumnHeader('Share Class')).toBe('shareClass');
    expect(normalizeColumnHeader('Notes')).toBe('notes');
    expect(normalizeColumnHeader('Random Unrelated Column')).toBe('unknown');
  });

  it('generates a valid binary Excel template workbook', () => {
    const templateBytes = generateExcelTemplate();
    const wb = XLSX.read(templateBytes, { type: 'array' });
    expect(wb.SheetNames.length).toBeGreaterThan(0);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    // Verify template structure headers
    const firstRow = rows[0] as Record<string, any>;
    expect(firstRow).toHaveProperty('Entity Name');
    expect(firstRow).toHaveProperty('Entity Type');
    expect(firstRow).toHaveProperty('Jurisdiction');
  });

  it('parses a complete spreadsheet into entities and relationships', () => {
    const rows = [
      {
        'Entity Name': 'Heritage Family Trust',
        'Parent Entity': '',
        'Entity Type': 'Trust',
        'Jurisdiction': 'Jersey',
        'Directors': 'Jersey Fiduciary Services (Corp, Res); Alice Smith',
        'Status': 'Active',
      },
      {
        'Entity Name': 'Heritage Investments Ltd',
        'Parent Entity': 'Heritage Family Trust',
        'Ownership %': 100,
        'Entity Type': 'Holding Company',
        'Jurisdiction': 'BVI',
        'Directors': 'Alice Smith; Bob Jones',
        'Share Class': 'Ordinary Voting',
      },
      {
        'Entity Name': 'Heritage Tech Pte Ltd',
        'Parent Entity': 'Heritage Investments Ltd',
        'Ownership %': 80,
        'Entity Type': 'Operating Company',
        'Jurisdiction': 'Singapore',
        'Directors': 'Charlie Tan (Res)',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Structure');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { chart, warnings } = parseExcelWorkbook(buffer);
    expect(warnings).toEqual([]);
    expect(chart.entities.length).toBe(3);
    expect(chart.relationships.length).toBe(2);
    expect(chart.relationships[0].ownershipPercentage).toBe(100);
    expect(chart.relationships[1].ownershipPercentage).toBe(80);
    expect(chart.metadata.chartTitle).toBe('Heritage Family Trust Structure');
  });

  it('generates warnings for unlinked parent entities without failing', () => {
    const rows = [
      {
        'Entity Name': 'Isolated Subsidiary Ltd',
        'Parent Entity': 'Non Existent Parent Co',
      },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Structure');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { chart, warnings } = parseExcelWorkbook(buffer);
    expect(chart.entities.length).toBe(1);
    expect(chart.relationships.length).toBe(0);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toContain('Non Existent Parent Co');
  });

  it('handles multi-parent entities by merging rows', () => {
    const rows = [
      {
        'Entity Name': 'Parent Alpha',
        'Parent Entity': '',
        'Entity Type': 'Holding Company',
      },
      {
        'Entity Name': 'Parent Beta',
        'Parent Entity': '',
        'Entity Type': 'Holding Company',
      },
      {
        'Entity Name': 'Joint Venture Ltd',
        'Parent Entity': 'Parent Alpha',
        'Ownership %': 60,
        'Entity Type': 'Operating Company',
        'Share Class': 'Class A',
      },
      {
        'Entity Name': 'Joint Venture Ltd',
        'Parent Entity': 'Parent Beta',
        'Ownership %': 40,
        'Entity Type': 'Operating Company',
        'Share Class': 'Class B',
      },
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Structure');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { chart, warnings } = parseExcelWorkbook(buffer);
    expect(warnings).toEqual([]);
    expect(chart.entities.length).toBe(3);
    expect(chart.relationships.length).toBe(2);
    expect(chart.relationships[0].ownershipPercentage).toBe(60);
    expect(chart.relationships[1].ownershipPercentage).toBe(40);
  });

  it('parses CSV input buffer seamlessly', () => {
    const csvContent = [
      'Entity Name,Parent Entity,Ownership %,Entity Type,Jurisdiction',
      'Oceanic Trust,,,Trust,Cook Islands',
      'Oceanic Holdings,Oceanic Trust,100,Holding Company,Cayman Islands',
    ].join('\n');

    const encoder = new TextEncoder();
    const buffer = encoder.encode(csvContent);

    const { chart, warnings } = parseExcelWorkbook(buffer);
    expect(warnings).toEqual([]);
    expect(chart.entities.length).toBe(2);
    expect(chart.relationships.length).toBe(1);
    expect(chart.relationships[0].ownershipPercentage).toBe(100);
  });

  it('handles empty director string and malformed input gracefully', () => {
    expect(parseDirectorString('')).toEqual([]);
    expect(parseDirectorString(null as any)).toEqual([]);
    expect(parseDirectorString(undefined as any)).toEqual([]);
  });

  it('splits comma-delimited director strings while respecting nested parentheses and empty segments', () => {
    // Tests comma splitting at depth 0, empty segments, and stripping of standalone tag annotations
    const input = 'Alice Smith (Director, Res), , Bob Jones [Corp], (Resident)';
    const parsed = parseDirectorString(input);
    expect(parsed.length).toBe(2);
    expect(parsed[0].name).toBe('Alice Smith');
    expect(parsed[0].isResident).toBe(true);
    expect(parsed[1].name).toBe('Bob Jones');
    expect(parsed[1].isCorporate).toBe(true);
  });

  it('throws an error when workbook has no sheets', () => {
    (globalThis as any).__mockEmptySheets = true;
    try {
      expect(() => parseExcelWorkbook(new Uint8Array())).toThrow('Excel workbook contains no sheets.');
    } finally {
      (globalThis as any).__mockEmptySheets = false;
    }
  });

  it('handles empty rows, invalid ownership, fallback types, and fallback titles', () => {
    const rows = [
      {
        'Entity Name': '', // Should be skipped
        'Parent Entity': 'Something',
      },
      {
        'Entity Name': '   ', // Should also be skipped
      },
      {
        'Entity Name': 'Alpha Sub',
        'Parent Entity': '',
        'Ownership %': 'not-a-number', // NaN -> 100
        'Entity Type': 'Custom Unrecognized Type', // -> Holding Company
        'Status': 'Custom Status', // -> Active
        'Share Class': '',
      },
      {
        'Entity Name': 'Alpha Sub', // duplicate row without parent
        'Parent Entity': '',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { chart, warnings } = parseExcelWorkbook(buffer);
    expect(warnings).toEqual([]);
    expect(chart.entities.length).toBe(1);
    expect(chart.entities[0].type).toBe('Holding Company');
    expect(chart.entities[0].status).toBe('Active');
    expect(chart.metadata.chartTitle).toBe('Imported Structure Chart');
  });

  it('falls back to default jurisdiction and default shareClass when omitted', () => {
    const rows = [
      {
        'Entity Name': 'Parent Co',
        'Jurisdiction': '', // Fallback to 'Unknown Jurisdiction'
      },
      {
        'Entity Name': 'Child Co',
        'Parent Entity': 'Parent Co',
        'Share Class': '', // Fallback to 'Ordinary Shares'
      },
      {
        'Entity Name': 'Child Co', // Merged row with empty shareClass
        'Parent Entity': 'Parent Co',
        'Share Class': '',
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    const { chart } = parseExcelWorkbook(buffer);
    expect(chart.entities[0].jurisdiction).toBe('Unknown Jurisdiction');
    expect(chart.relationships[0].shareClass).toBe('Ordinary Shares');
    expect(chart.relationships[1].shareClass).toBe('Ordinary Shares');
  });
});
