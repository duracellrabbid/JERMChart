# Excel Import & Canvas Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement client-side Excel/CSV spreadsheet upload with automated chart generation, downloadable Excel template with fiduciary dropdown validations, pre-import preview/validation, and a dual reset dropdown (Clear Blank Canvas vs. Load Sample).

**Architecture:** Add `xlsx` (SheetJS) for client-side workbook parsing and generation; implement an `excelParser` utility with fuzzy header normalization, flexible director tag parsing `(Corp, Res)`, and parent-subsidiary graph linking; build a pre-import validation modal; update `useStructureStore` with a `clearCanvas()` action; and enhance `AppHeader` with a Reset dropdown menu.

**Tech Stack:** React 18, TypeScript, `xlsx` (SheetJS), Lucide Icons, Tailwind CSS, Zustand, Vitest.

## Global Constraints

- 100% client-side execution; no Excel files or corporate data sent to any remote server.
- Supported file types: `.xlsx`, `.xls`, and `.csv`.
- Sibling sorting rules (Alphabetical, Ownership %, Jurisdiction, Manual) must immediately apply when the parsed Excel data is loaded.
- Zero data loss on typos: If a row references a non-existent parent, warn the user and import as an independent root node rather than crashing or dropping the row.

---

### Task 1: Install `xlsx` Dependency & Extend Zustand Store with `clearCanvas`

**Files:**
- Modify: `package.json`
- Modify: `src/store/useStructureStore.ts`
- Modify: `src/store/useStructureStore.test.ts`

**Interfaces:**
- Produces: `xlsx` installed, `useStructureStore.getState().clearCanvas()` resetting entities to `[]`, relationships to `[]`, `selectedEntityId: null`, `highlightedDirector: null`, and `chartTitle: 'New Trust Structure'`.

- [ ] **Step 1: Install `xlsx`**

Run: `npm install xlsx@^0.18.5`

- [ ] **Step 2: Write failing test in `src/store/useStructureStore.test.ts`**

```typescript
it('clears canvas to an empty state with clearCanvas', () => {
  const state = useStructureStore.getState();
  expect(state.entities.length).toBeGreaterThan(0);

  state.clearCanvas();

  const cleared = useStructureStore.getState();
  expect(cleared.entities).toEqual([]);
  expect(cleared.relationships).toEqual([]);
  expect(cleared.selectedEntityId).toBeNull();
  expect(cleared.highlightedDirector).toBeNull();
  expect(cleared.metadata.chartTitle).toBe('New Trust Structure');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL with `clearCanvas is not a function`.

- [ ] **Step 4: Implement `clearCanvas` in `src/store/useStructureStore.ts`**

Add `clearCanvas: () => void;` to `StructureState` interface:
```typescript
clearCanvas: () =>
  set({
    metadata: {
      chartTitle: 'New Trust Structure',
      effectiveDate: new Date().toISOString().split('T')[0],
      confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
    },
    entities: [],
    relationships: [],
    selectedEntityId: null,
    highlightedDirector: null,
  }),
```

- [ ] **Step 5: Run tests to verify it passes**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/store/
git commit -m "feat: install xlsx and add clearCanvas store action"
```

---

### Task 2: Excel / CSV Parser & Smart Normalizer Engine

**Files:**
- Create: `src/utils/excelParser.ts`
- Create: `src/utils/excelParser.test.ts`

**Interfaces:**
- Consumes: `xlsx`, `EntityNodeData`, `OwnershipEdgeData`, `TrustStructureChart`
- Produces:
  - `parseDirectorString(directorCell: string): Director[]`
  - `parseExcelWorkbook(fileBuffer: ArrayBuffer | Uint8Array): { chart: TrustStructureChart; warnings: string[] }`
  - `generateExcelTemplate(): Uint8Array`

- [ ] **Step 1: Write tests in `src/utils/excelParser.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import {
  parseDirectorString,
  normalizeColumnHeader,
  parseExcelWorkbook,
  generateExcelTemplate,
} from './excelParser';
import * as XLSX from 'xlsx';

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
  });

  it('generates a valid binary Excel template workbook', () => {
    const templateBytes = generateExcelTemplate();
    const wb = XLSX.read(templateBytes, { type: 'array' });
    expect(wb.SheetNames.length).toBeGreaterThan(0);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBeGreaterThanOrEqual(3);
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL with module `./excelParser` not found.

- [ ] **Step 3: Implement `src/utils/excelParser.ts`**

```typescript
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
  if (/^(entity)?status|state$/i.test(h)) return 'status';
  if (/^(directors|board|officers|trustees)$/i.test(h)) return 'directors';
  if (/^(registration|reg|company)(number|no)?$/i.test(h)) return 'registrationNumber';
  if (/^(taxid|tin|ein|taxnumber)$/i.test(h)) return 'taxId';
  if (/^(ubos?|beneficiaries|settlor|beneficialowners?)$/i.test(h)) return 'ubos';
  if (/^(share|shares)?class|sharetype$/i.test(h)) return 'shareClass';
  if (/^(notes?|remarks?|comments?|description)$/i.test(h)) return 'notes';
  return 'unknown';
}

export function parseDirectorString(raw: string): Director[] {
  if (!raw || typeof raw !== 'string') return [];

  // Split on semicolons, commas, or linebreaks
  const items = raw.split(/[;\n]/).map((s) => s.trim()).filter(Boolean);
  const directors: Director[] = [];

  items.forEach((item, index) => {
    // If multiple comma-separated names are in one item without semicolons
    const subItems = item.includes(';') ? [item] : item.split(',').map((s) => s.trim()).filter(Boolean);

    subItems.forEach((subItem, subIdx) => {
      const isCorporate = /\((corp|corporate)\)|\[(corp|corporate)\]/i.test(subItem);
      const isResident = /\((res|resident)\)|\[(res|resident)\]/i.test(subItem);

      // Clean name
      const cleanName = subItem
        .replace(/\((corp|corporate|res|resident)\s*(,\s*(corp|corporate|res|resident))?\)/gi, '')
        .replace(/\[(corp|corporate|res|resident)\s*(,\s*(corp|corporate|res|resident))?\]/gi, '')
        .trim();

      if (cleanName) {
        directors.push({
          id: `dir-parsed-${index}-${subIdx}-${Date.now()}`,
          name: cleanName,
          isCorporate,
          isResident,
        });
      }
    });
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
  const entityMap = new Map<string, { entity: EntityNodeData; parentNames: { name: string; pct: number; shareClass?: string }[] }>();

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
    const validTypes: EntityType[] = ['Trust', 'Holding Company', 'Operating Company', 'LLC', 'Foundation', 'Partnership', 'Individual'];
    const matchedType = validTypes.find((t) => t.toLowerCase() === String(mapped.type).trim().toLowerCase()) || 'Holding Company';

    const validStatuses: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];
    const matchedStatus = validStatuses.find((s) => s.toLowerCase() === String(mapped.status).trim().toLowerCase()) || 'Active';

    const existing = entityMap.get(entityName.toLowerCase());
    if (existing) {
      // Merge multiple rows for the same entity (e.g. multi-parent ownership)
      if (parentName) {
        existing.parentNames.push({ name: parentName, pct: ownershipPct, shareClass: String(mapped.shareClass || 'Ordinary Shares') });
      }
    } else {
      const newEntity: EntityNodeData = {
        id: `entity-${idx + 1}-${Date.now()}`,
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
        ? [{ name: parentName, pct: ownershipPct, shareClass: String(mapped.shareClass || 'Ordinary Shares') }]
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
          id: `rel-${parentRecord.entity.id}-${childEntity.id}-${Date.now()}`,
          source: parentRecord.entity.id,
          target: childEntity.id,
          ownershipPercentage: pct,
          shareClass: shareClass || 'Ordinary Shares',
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
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm test`  
Expected: PASS all tests in `excelParser.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/excelParser.ts src/utils/excelParser.test.ts
git commit -m "feat: implement excel and csv parser with smart normalizer and template generator"
```

---

### Task 3: Excel Import & Template Modal (`ExcelImportModal`)

**Files:**
- Create: `src/components/import/ExcelImportModal.tsx`
- Create: `src/components/import/ExcelImportModal.test.tsx`

**Interfaces:**
- Consumes: `parseExcelWorkbook`, `generateExcelTemplate`, `useStructureStore`
- Produces: Modal with template download button, drag-and-drop file upload, parsed entities/relationships summary table with warning badges, and "Apply to Canvas" trigger.

- [ ] **Step 1: Write tests in `src/components/import/ExcelImportModal.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExcelImportModal } from './ExcelImportModal';
import { useStructureStore } from '../../store/useStructureStore';

describe('ExcelImportModal', () => {
  it('renders modal header, template download button, and dropzone', () => {
    render(<ExcelImportModal onClose={vi.fn()} />);
    expect(screen.getByText(/Import Structure from Excel/i)).toBeInTheDocument();
    expect(screen.getByText(/Download Excel Template/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to browse/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement `src/components/import/ExcelImportModal.tsx`**

```tsx
import React, { useState, useRef } from 'react';
import {
  parseExcelWorkbook,
  generateExcelTemplate,
} from '../../utils/excelParser';
import { useStructureStore } from '../../store/useStructureStore';
import { TrustStructureChart } from '../../types/structure';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ExcelImportModalProps {
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ onClose }) => {
  const loadStructure = useStructureStore((state) => state.loadStructure);

  const [parsedData, setParsedData] = useState<{
    chart: TrustStructureChart;
    warnings: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const bytes = generateExcelTemplate();
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trust_Structure_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelWorkbook(buffer);
      if (result.chart.entities.length === 0) {
        setErrorMsg('No valid entities found in the file. Ensure "Entity Name" column is filled.');
        setParsedData(null);
      } else {
        setParsedData(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file. Please upload a valid .xlsx or .csv.');
      setParsedData(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyToCanvas = () => {
    if (!parsedData) return;
    loadStructure(parsedData.chart);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Structure from Excel</h2>
              <p className="text-xs text-slate-500">Upload a single-sheet .xlsx or .csv to generate the chart</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Template Guidance Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-800">Need the standardized Excel template?</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Download our pre-formatted spreadsheet with column guides and sample rows.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium text-xs rounded-md shadow-sm transition whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Download Excel Template
            </button>
          </div>

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/20 rounded-xl p-6 text-center cursor-pointer transition"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700">
              {fileName ? fileName : 'Click to browse or drop your Excel/CSV file here'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Supports Microsoft Excel (.xlsx, .xls) and .csv</div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview & Validation Summary */}
          {parsedData && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-emerald-800">{parsedData.chart.entities.length}</div>
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase">Entities Found</div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-sky-800">{parsedData.chart.relationships.length}</div>
                  <div className="text-[10px] font-semibold text-sky-600 uppercase">Ownership Links</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-purple-800">
                    {parsedData.chart.entities.reduce((acc, e) => acc + e.directors.length, 0)}
                  </div>
                  <div className="text-[10px] font-semibold text-purple-600 uppercase">Total Directors</div>
                </div>
              </div>

              {/* Warnings if any */}
              {parsedData.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Validation Warnings ({parsedData.warnings.length})
                  </div>
                  <ul className="text-[11px] text-amber-800 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {parsedData.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-amber-700 italic">
                    Unlinked entities will still be imported as independent top-level cards.
                  </div>
                </div>
              )}

              {/* Entities Table Preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[11px] font-semibold">
                    <tr>
                      <th className="p-2">Entity Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Jurisdiction</th>
                      <th className="p-2">Directors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {parsedData.chart.entities.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900 truncate max-w-[180px]">{e.name}</td>
                        <td className="p-2">{e.type}</td>
                        <td className="p-2 truncate max-w-[140px]">{e.jurisdiction}</td>
                        <td className="p-2 text-slate-500">{e.directors.length} recorded</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyToCanvas}
            disabled={!parsedData}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-md shadow transition"
          >
            Apply to Canvas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Run tests to verify it passes**

Run: `npm test`  
Expected: PASS all tests in `ExcelImportModal.test.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/import/
git commit -m "feat: implement excel import modal with template download and validation preview"
```

---

### Task 4: Header Actions & Reset Dropdown Integration (`AppHeader` & `App`)

**Files:**
- Modify: `src/components/header/AppHeader.tsx`
- Modify: `src/components/header/AppHeader.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Produces:
  - "Import Excel" button in `AppHeader` calling `onOpenExcelImport()`.
  - Upgraded "Reset" button with dropdown menu:
    - "Clear Canvas (Blank)" calling `clearCanvas()` with confirmation.
    - "Load Sample (Aurelius Dynasty Trust)" calling `resetToSample()` with confirmation.
  - App state wire-up for `ExcelImportModal`.

- [ ] **Step 1: Update `src/components/header/AppHeader.tsx`**

Add `onOpenExcelImport: () => void;` to `AppHeaderProps`.
Replace single Reset button with dropdown state `isResetMenuOpen`:
- "Clear Canvas (Blank)" triggers `confirm('Clear all entities and start with a blank canvas?') && clearCanvas()`
- "Load Sample Template" triggers `confirm('Reset chart to Aurelius Dynasty Trust sample template?') && resetToSample()`
Add "Import Excel" button next to "Export Chart".

- [ ] **Step 2: Update `src/components/header/AppHeader.test.tsx`**

Add tests for:
- Rendering "Import Excel" button and triggering `onOpenExcelImport`.
- Opening Reset dropdown, clicking "Clear Canvas (Blank)", confirming, and ensuring store entities are cleared.
- Clicking "Load Sample Template" and verifying sample data restored.

- [ ] **Step 3: Update `src/App.tsx`**

Import `ExcelImportModal` and manage state `isExcelImportOpen`. Pass `onOpenExcelImport={() => setIsExcelImportOpen(true)}` to `AppHeader`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS all 11+ test suites.

- [ ] **Step 5: Commit**

```bash
git add src/components/header/ src/App.tsx src/App.test.tsx
git commit -m "feat: integrate excel import trigger and reset canvas dropdown into header"
```

---

### Task 5: End-to-End Build & Desktop Verification

**Files:**
- Full test and production build check

- [ ] **Step 1: Run comprehensive tests**

Run: `npm test`  
Expected: 100% tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: Clean build in `dist/` with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: verify tests and production build for excel import and canvas reset"
```
