# Excel Export & Handwritten Chart Photo LLM OCR Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add roundtrip Excel chart export (.xlsx) conforming to the import template, and an AI-driven photo import workflow using multimodal LLM vision to convert hand-drawn structure diagrams into interactive charts with undo/review safeguards.

**Architecture:** 
- Excel export uses `xlsx` to serialize entities, multi-parent relationships, and director flags into the standard 12-column sheet format.
- Photo OCR uses client-side HEIC conversion (`heic2any`) and image downscaling, calling Google Gemini (or OpenAI) with a strict JSON schema prompt to extract nodes, ownership percentages, roles, and warnings.
- The chart is loaded directly to canvas via Dagre layout, with a floating `OcrReviewBanner` providing undo restoration.

**Tech Stack:** React 18, TypeScript 5.7, Zustand 5, `xlsx`, `heic2any`, Lucide React, Tailwind CSS, Vitest 4.

## Global Constraints
- Cognitive complexity of every function and hook must remain strictly `< 15` (SonarSource metric).
- All regular expressions must run in linear time $\mathcal{O}(n)$ with bounded input length (ReDoS-free).
- All tests must reside in `src/__tests__/` and be excluded from production packaging.
- API keys must never be committed to git or leaked into production logs.
- Maintain 100% test pass rate across all existing (130+) and new test suites.

---

### Task 1: Excel Structure Exporter Utility & Tests

**Files:**
- Create: `src/utils/excelExporter.ts`
- Test: `src/__tests__/utils/excelExporter.test.ts`

**Interfaces:**
- Consumes: `TrustStructureChart`, `EntityNodeData`, `OwnershipEdgeData`, `Director` from `src/types/structure.ts`
- Produces:
  - `formatDirectorsString(directors: Director[]): string`
  - `buildExcelRowsFromChart(chart: TrustStructureChart): Record<string, any>[]`
  - `exportStructureToExcel(chart: TrustStructureChart): Uint8Array`

- [ ] **Step 1: Write the failing tests for Excel exporter**

Create `src/__tests__/utils/excelExporter.test.ts`:
```typescript
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/excelExporter.test.ts`
Expected: FAIL with "Cannot find module '../../utils/excelExporter'"

- [ ] **Step 3: Implement `src/utils/excelExporter.ts`**

```typescript
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
          'Ownership %': edge.ownershipPercentage !== undefined ? edge.ownershipPercentage : 100,
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/excelExporter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/utils/excelExporter.ts src/__tests__/utils/excelExporter.test.ts
rtk git commit -m "feat: implement excel structure export utility"
```

---

### Task 2: ExportModal Excel Download Integration & Tests

**Files:**
- Modify: `src/utils/exportService.ts`
- Modify: `src/components/export/ExportModal.tsx`
- Modify: `src/__tests__/components/export/ExportModal.test.tsx`

**Interfaces:**
- Consumes: `exportStructureToExcel` from `src/utils/excelExporter.ts`
- Produces: `downloadExcelStructure(chart: TrustStructureChart): void` in `src/utils/exportService.ts`

- [ ] **Step 1: Write test for Excel export in `ExportModal.test.tsx`**

Add test to `src/__tests__/components/export/ExportModal.test.tsx`:
```typescript
it('renders Excel export option and handles download', () => {
  render(<ExportModal onClose={mockOnClose} />);
  const excelBtn = screen.getByRole('button', { name: /excel spreadsheet/i });
  expect(excelBtn).toBeInTheDocument();
  fireEvent.click(excelBtn);
  expect(screen.getByText(/excel workbook \(\.xlsx\) downloaded/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `downloadExcelStructure` and update `ExportModal.tsx`**

In `src/utils/exportService.ts`:
```typescript
import { exportStructureToExcel } from './excelExporter';

export function downloadExcelStructure(chart: TrustStructureChart): void {
  const bytes = exportStructureToExcel(chart);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (chart.metadata?.chartTitle || 'Trust').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${safeTitle}_Structure.xlsx`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

In `src/components/export/ExportModal.tsx`:
Add `downloadExcelStructure`, `FileSpreadsheet` icon from `lucide-react`, and the Excel Export card button.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/utils/exportService.ts src/components/export/ExportModal.tsx src/__tests__/components/export/ExportModal.test.tsx
rtk git commit -m "feat: add excel export card to export modal"
```

---

### Task 3: AI Configuration & Storage Service (`src/services/ai/aiConfig.ts`) & Tests

**Files:**
- Create: `src/services/ai/aiConfig.ts`
- Test: `src/__tests__/services/aiConfig.test.ts`

**Interfaces:**
- Produces:
  - `type AIProvider = 'gemini' | 'openai'`
  - `interface AIConfig`
  - `getAIConfig(): AIConfig`
  - `saveAIConfig(config: Partial<AIConfig>): AIConfig`
  - `hasValidApiKey(): boolean`
  - `clearAIConfig(): void`

- [ ] **Step 1: Write tests for AI config storage**

Create `src/__tests__/services/aiConfig.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAIConfig,
  saveAIConfig,
  hasValidApiKey,
  clearAIConfig,
} from '../../services/ai/aiConfig';

describe('aiConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default gemini configuration when empty', () => {
    const config = getAIConfig();
    expect(config.provider).toBe('gemini');
    expect(config.model).toBe('gemini-2.5-flash');
    expect(config.apiKey).toBe('');
    expect(hasValidApiKey()).toBe(false);
  });

  it('saves and retrieves updated configuration', () => {
    saveAIConfig({
      provider: 'openai',
      apiKey: 'sk-test-key-12345',
      model: 'gpt-4o',
    });

    const config = getAIConfig();
    expect(config.provider).toBe('openai');
    expect(config.apiKey).toBe('sk-test-key-12345');
    expect(config.model).toBe('gpt-4o');
    expect(hasValidApiKey()).toBe(true);
  });

  it('clears configuration accurately', () => {
    saveAIConfig({ apiKey: 'some-key' });
    expect(hasValidApiKey()).toBe(true);
    clearAIConfig();
    expect(getAIConfig().apiKey).toBe('');
    expect(hasValidApiKey()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/services/aiConfig.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/services/ai/aiConfig.ts`**

```typescript
export type AIProvider = 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

const STORAGE_KEY = 'tmu_ai_config';

const DEFAULT_CONFIG: AIConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.5-flash',
};

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider === 'openai' ? 'openai' : 'gemini',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '',
      model: typeof parsed.model === 'string' && parsed.model.trim() ? parsed.model.trim() : (parsed.provider === 'openai' ? 'gpt-4o' : 'gemini-2.5-flash'),
      customEndpoint: parsed.customEndpoint || '',
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveAIConfig(patch: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function hasValidApiKey(): boolean {
  return getAIConfig().apiKey.length > 5;
}

export function clearAIConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/services/aiConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/services/ai/aiConfig.ts src/__tests__/services/aiConfig.test.ts
rtk git commit -m "feat: add ai configuration and storage service"
```

---

### Task 4: Image Preprocessing & HEIC Converter (`src/utils/imagePreprocessing.ts`) & Tests

**Files:**
- Create: `src/utils/imagePreprocessing.ts`
- Test: `src/__tests__/utils/imagePreprocessing.test.ts`

**Interfaces:**
- Produces:
  - `isHeicFile(file: File | Blob, filename?: string): boolean`
  - `calculateOptimalDimensions(width: number, height: number, maxDim?: number): { width: number; height: number }`
  - `preprocessImageFile(file: File): Promise<{ base64Data: string; mimeType: string; previewUrl: string }>`

- [ ] **Step 1: Install `heic2any` dependency**

Run: `rtk npm install heic2any`

- [ ] **Step 2: Write tests for image preprocessing**

Create `src/__tests__/utils/imagePreprocessing.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  isHeicFile,
  calculateOptimalDimensions,
} from '../../utils/imagePreprocessing';

describe('imagePreprocessing', () => {
  it('identifies heic files by mime type or extension', () => {
    const heicBlob = new Blob([], { type: 'image/heic' });
    expect(isHeicFile(heicBlob, 'photo.heic')).toBe(true);

    const heifFile = new File([], 'chart.HEIF', { type: '' });
    expect(isHeicFile(heifFile)).toBe(true);

    const pngFile = new File([], 'chart.png', { type: 'image/png' });
    expect(isHeicFile(pngFile)).toBe(false);
  });

  it('scales dimensions down when exceeding max dimension', () => {
    const res1 = calculateOptimalDimensions(4000, 2000, 2000);
    expect(res1).toEqual({ width: 2000, height: 1000 });

    const res2 = calculateOptimalDimensions(1500, 3000, 2000);
    expect(res2).toEqual({ width: 1000, height: 2000 });

    const res3 = calculateOptimalDimensions(800, 600, 2000);
    expect(res3).toEqual({ width: 800, height: 600 });
  });
});
```

- [ ] **Step 3: Implement `src/utils/imagePreprocessing.ts`**

```typescript
import heic2any from 'heic2any';

export function isHeicFile(file: Blob, filename?: string): boolean {
  const name = filename || (file instanceof File ? file.name : '');
  const lowerName = name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lowerName.endsWith('.heic') ||
    lowerName.endsWith('.heif')
  );
}

export function calculateOptimalDimensions(
  width: number,
  height: number,
  maxDim = 2048
): { width: number; height: number } {
  if (width <= maxDim && height <= maxDim) {
    return { width, height };
  }
  if (width > height) {
    return {
      width: maxDim,
      height: Math.round((height * maxDim) / width),
    };
  }
  return {
    width: Math.round((width * maxDim) / height),
    height: maxDim,
  };
}

export async function convertHeicIfNeeded(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.88,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

export async function resizeImageToJpegBase64(
  blob: Blob,
  maxDim = 2048
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = calculateOptimalDimensions(img.width, img.height, maxDim);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context'));
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

      resolve({
        base64Data,
        mimeType: 'image/jpeg',
        previewUrl: dataUrl,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image'));
    };

    img.src = objectUrl;
  });
}

export async function preprocessImageFile(
  file: File
): Promise<{ base64Data: string; mimeType: string; previewUrl: string }> {
  const normalizedBlob = await convertHeicIfNeeded(file);
  return resizeImageToJpegBase64(normalizedBlob, 2048);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/imagePreprocessing.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add package.json package-lock.json src/utils/imagePreprocessing.ts src/__tests__/utils/imagePreprocessing.test.ts
rtk git commit -m "feat: add image preprocessing and heic conversion utility"
```

---

### Task 5: Multimodal LLM Vision Service (`src/services/ai/chartVisionService.ts`) & Tests

**Files:**
- Create: `src/services/ai/chartVisionService.ts`
- Test: `src/__tests__/services/chartVisionService.test.ts`

**Interfaces:**
- Consumes: `AIConfig` from `src/services/ai/aiConfig.ts`, `TrustStructureChart` types
- Produces:
  - `parseRawAiResponse(jsonText: string): { chart: TrustStructureChart; warnings: string[] }`
  - `analyzeChartImage(base64Image: string, mimeType: string, config: AIConfig): Promise<{ chart: TrustStructureChart; warnings: string[] }>`

- [ ] **Step 1: Write tests for raw response parsing and API formatting**

Create `src/__tests__/services/chartVisionService.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseRawAiResponse,
  analyzeChartImage,
} from '../../services/ai/chartVisionService';

describe('chartVisionService', () => {
  it('parses valid AI structured output and sanitizes node types and UUIDs', () => {
    const rawAiOutput = JSON.stringify({
      chartTitle: 'The Wellington Trust Structure',
      entities: [
        {
          tempId: 't1',
          name: 'The Wellington Trust',
          type: 'Trust',
          jurisdiction: 'Jersey',
          status: 'Active',
          directors: [],
          notes: 'Settled 2015',
        },
        {
          tempId: 't2',
          name: 'Wellington Holding Ltd',
          type: 'Holding Company',
          jurisdiction: 'BVI',
          status: 'Active',
          directors: [{ name: 'Arthur Pendelton', isResident: true }],
        },
      ],
      relationships: [
        {
          sourceTempId: 't1',
          targetTempId: 't2',
          ownershipPercentage: 100,
          shareClass: 'Ordinary Shares',
        },
      ],
      warnings: ['Assumed 100% ownership based on vertical hierarchy line'],
    });

    const result = parseRawAiResponse(rawAiOutput);
    expect(result.chart.entities).toHaveLength(2);
    expect(result.chart.relationships).toHaveLength(1);
    expect(result.chart.metadata.chartTitle).toBe('The Wellington Trust Structure');
    expect(result.warnings).toContain('Assumed 100% ownership based on vertical hierarchy line');

    const sourceId = result.chart.relationships[0].source;
    const targetId = result.chart.relationships[0].target;
    expect(result.chart.entities.find((e) => e.id === sourceId)?.name).toBe('The Wellington Trust');
    expect(result.chart.entities.find((e) => e.id === targetId)?.name).toBe('Wellington Holding Ltd');
  });

  it('throws helpful error on malformed JSON payload', () => {
    expect(() => parseRawAiResponse('Invalid raw text without json')).toThrow(
      /failed to extract valid structure/i
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/services/chartVisionService.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `src/services/ai/chartVisionService.ts`**

Implement `chartVisionService.ts` with:
- System prompt defining structure diagram extraction rules.
- JSON schema for Google Gemini REST API `/v1beta/models/{model}:generateContent?key={apiKey}`.
- OpenAI compatible `/v1/chat/completions` fallback.
- Sanitization helper ensuring valid `EntityType`, `EntityStatus`, and connecting mapped IDs.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/services/chartVisionService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/services/ai/chartVisionService.ts src/__tests__/services/chartVisionService.test.ts
rtk git commit -m "feat: implement multimodal llm chart vision service"
```

---

### Task 6: Store Updates for Snapshot & OCR Review (`src/store/useStructureStore.ts`) & Tests

**Files:**
- Modify: `src/store/useStructureStore.ts`
- Modify: `src/__tests__/store/useStructureStore.test.ts`

**Interfaces:**
- Produces in Zustand store:
  - `undoSnapshot: TrustStructureChart | null`
  - `setUndoSnapshot: (snapshot: TrustStructureChart | null) => void`
  - `restoreUndoSnapshot: () => boolean`
  - `ocrReviewState: { summary: string; warnings: string[] } | null`
  - `setOcrReviewState: (state: { summary: string; warnings: string[] } | null) => void`
  - `dismissOcrReview: () => void`

- [ ] **Step 1: Write store unit tests for snapshot undo and OCR review**

In `src/__tests__/store/useStructureStore.test.ts`:
```typescript
it('manages undo snapshots and restores previous structure state', () => {
  const store = useStructureStore.getState();
  const originalCount = store.entities.length;
  
  store.setUndoSnapshot({
    metadata: store.metadata,
    entities: store.entities,
    relationships: store.relationships,
  });

  store.clearCanvas();
  expect(useStructureStore.getState().entities).toHaveLength(0);

  const restored = useStructureStore.getState().restoreUndoSnapshot();
  expect(restored).toBe(true);
  expect(useStructureStore.getState().entities).toHaveLength(originalCount);
  expect(useStructureStore.getState().undoSnapshot).toBeNull();
});

it('handles ocr review state and dismissal', () => {
  const store = useStructureStore.getState();
  store.setOcrReviewState({
    summary: 'Inferred 4 entities and 3 relationships',
    warnings: ['Illegible jurisdiction'],
  });

  expect(useStructureStore.getState().ocrReviewState?.summary).toBe('Inferred 4 entities and 3 relationships');
  useStructureStore.getState().dismissOcrReview();
  expect(useStructureStore.getState().ocrReviewState).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/store/useStructureStore.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/store/useStructureStore.ts`**

Add `undoSnapshot`, `ocrReviewState`, `setUndoSnapshot`, `restoreUndoSnapshot`, `setOcrReviewState`, `dismissOcrReview` actions.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/store/useStructureStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/store/useStructureStore.ts src/__tests__/store/useStructureStore.test.ts
rtk git commit -m "feat: add undo snapshot and ocr review state to store"
```

---

### Task 7: Settings Modal Component (`src/components/settings/SettingsModal.tsx`) & Tests

**Files:**
- Create: `src/components/settings/SettingsModal.tsx`
- Test: `src/__tests__/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- Produces: `<SettingsModal onClose={() => void} />`

- [ ] **Step 1: Write test for SettingsModal**

Create `src/__tests__/components/settings/SettingsModal.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../../components/settings/SettingsModal';
import * as aiConfig from '../../services/ai/aiConfig';

describe('SettingsModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders provider selection, api key input, and model fields', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    expect(screen.getByText(/ai provider & api keys/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter api key/i)).toBeInTheDocument();
  });

  it('saves configuration when Save Settings clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);

    const keyInput = screen.getByPlaceholderText(/enter api key/i);
    fireEvent.change(keyInput, { target: { value: 'AIzaSy12345Test' } });

    const saveBtn = screen.getByRole('button', { name: /save settings/i });
    fireEvent.click(saveBtn);

    expect(aiConfig.getAIConfig().apiKey).toBe('AIzaSy12345Test');
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/settings/SettingsModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/settings/SettingsModal.tsx`**

Implement modal with:
- Provider select (`Google Gemini`, `OpenAI`).
- Password/text visibility toggle for API key.
- Model input with defaults (`gemini-2.5-flash` / `gpt-4o`).
- Test connection button with status feedback.
- Save / Close buttons.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/settings/SettingsModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/settings/SettingsModal.tsx src/__tests__/components/settings/SettingsModal.test.tsx
rtk git commit -m "feat: implement settings modal for ai api configuration"
```

---

### Task 8: OCR Review Banner Component (`src/components/canvas/OcrReviewBanner.tsx`) & Tests

**Files:**
- Create: `src/components/canvas/OcrReviewBanner.tsx`
- Modify: `src/components/canvas/StructureCanvas.tsx`
- Test: `src/__tests__/components/canvas/OcrReviewBanner.test.tsx`

**Interfaces:**
- Produces: `<OcrReviewBanner />` embedded in `StructureCanvas.tsx`

- [ ] **Step 1: Write test for OcrReviewBanner**

Create `src/__tests__/components/canvas/OcrReviewBanner.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OcrReviewBanner } from '../../components/canvas/OcrReviewBanner';
import { useStructureStore } from '../../store/useStructureStore';

describe('OcrReviewBanner', () => {
  it('renders nothing when ocrReviewState is null', () => {
    useStructureStore.setState({ ocrReviewState: null });
    const { container } = render(<OcrReviewBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders summary and triggers undo and dismiss', () => {
    useStructureStore.setState({
      ocrReviewState: {
        summary: 'Inferred 5 entities from photo',
        warnings: ['Low confidence on ownership % of SubCo'],
      },
      undoSnapshot: {
        metadata: { chartTitle: 'Old', effectiveDate: '', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      },
    });

    render(<OcrReviewBanner />);
    expect(screen.getByText(/inferred 5 entities from photo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo import/i })).toBeInTheDocument();

    const dismissBtn = screen.getByRole('button', { name: /keep/i });
    fireEvent.click(dismissBtn);
    expect(useStructureStore.getState().ocrReviewState).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/canvas/OcrReviewBanner.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/canvas/OcrReviewBanner.tsx` and attach in `StructureCanvas.tsx`**

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/canvas/OcrReviewBanner.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/canvas/OcrReviewBanner.tsx src/components/canvas/StructureCanvas.tsx src/__tests__/components/canvas/OcrReviewBanner.test.tsx
rtk git commit -m "feat: add ocr review banner with undo action to canvas"
```

---

### Task 9: Photo Upload & Analysis Modal (`src/components/import/PhotoImportModal.tsx`) & Tests

**Files:**
- Create: `src/components/import/PhotoImportModal.tsx`
- Test: `src/__tests__/components/import/PhotoImportModal.test.tsx`

**Interfaces:**
- Produces: `<PhotoImportModal onClose={() => void} onOpenSettings={() => void} />`

- [ ] **Step 1: Write test for PhotoImportModal**

Create `src/__tests__/components/import/PhotoImportModal.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoImportModal } from '../../components/import/PhotoImportModal';
import * as aiConfig from '../../services/ai/aiConfig';

describe('PhotoImportModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prompts to configure API key when none exists', () => {
    const onOpenSettings = vi.fn();
    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={onOpenSettings} />);
    expect(screen.getByText(/api key required/i)).toBeInTheDocument();
    const configBtn = screen.getByRole('button', { name: /configure api key/i });
    fireEvent.click(configBtn);
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('shows upload dropzone when API key is present', () => {
    aiConfig.saveAIConfig({ apiKey: 'valid-test-key-12345' });
    render(<PhotoImportModal onClose={vi.fn()} onOpenSettings={vi.fn()} />);
    expect(screen.getByText(/upload hand-drawn structure chart/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/import/PhotoImportModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement `src/components/import/PhotoImportModal.tsx`**

Implement modal with:
- Drag & Drop zone supporting images.
- Image thumbnail preview.
- Canvas replacement check if `entities.length > 0`.
- Loading spinner with phase indicator.
- Analysis execution calling `preprocessImageFile` and `analyzeChartImage`.
- Auto-layout invocation (`calculateSortedLayout`) before loading into store.
- Sets `undoSnapshot` and `ocrReviewState` on completion.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/import/PhotoImportModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/import/PhotoImportModal.tsx src/__tests__/components/import/PhotoImportModal.test.tsx
rtk git commit -m "feat: implement photo import modal with ai ocr pipeline"
```

---

### Task 10: AppHeader Import Dropdown & Settings Trigger Integration & Tests

**Files:**
- Modify: `src/components/header/AppHeader.tsx`
- Modify: `src/App.tsx`
- Modify: `src/__tests__/components/header/AppHeader.test.tsx`
- Modify: `src/__tests__/App.test.tsx`

**Interfaces:**
- Updates `AppHeaderProps`:
  - `onOpenExport: () => void`
  - `onOpenExcelImport: () => void`
  - `onOpenPhotoImport: () => void`
  - `onOpenSettings: () => void`

- [ ] **Step 1: Update header tests in `AppHeader.test.tsx`**

Add tests checking:
- Import dropdown button renders.
- Clicking dropdown reveals "Import from Excel" and "Import from Photo (AI OCR)".
- Clicking Settings gear button triggers `onOpenSettings`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/header/AppHeader.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement Import dropdown and Settings button in `AppHeader.tsx` and wire in `App.tsx`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/header/AppHeader.test.tsx src/__tests__/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/header/AppHeader.tsx src/App.tsx src/__tests__/components/header/AppHeader.test.tsx src/__tests__/App.test.tsx
rtk git commit -m "feat: add import dropdown and settings trigger in app header"
```

---

### Task 11: End-to-End Verification & Build Check

**Files:**
- None (verification task)

- [ ] **Step 1: Run complete test suite**

Run: `rtk npm test`
Expected: All test suites pass (100% pass rate).

- [ ] **Step 2: Run TypeScript check and production build**

Run: `rtk npm run build`
Expected: Zero TypeScript errors, bundle successfully generated in `dist/`.

- [ ] **Step 3: Verify test exclusion from build**

Ensure `dist/` contains no `__tests__` or test fixtures.
