# Ponytail Audit Fixes (Fix 1 to Fix 8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all 8 security, correctness, functionality, packaging, performance, and testing findings identified in the Ponytail audit.

**Architecture:** 
1. Harden Electron network firewall with strict 4-octet IPv4 RFC 1918 parsing and enforce read-only mutation guards in the Zustand store.
2. Complete the Director Cap feature by plumbing `directorCap` and `isExportMode` through layout calculations, rendering satellite role overflow badges with interactive tooltips and navigation.
3. Propagate `AbortSignal` through Gemini vision OCR and configure `electron-builder.json` to exclude test files and development artifacts.
4. Convert heavy export and conversion libraries (`xlsx`, `jspdf`, `pptxgenjs`, `heic2any`) to dynamic lazy imports, optimize base64 crypto chunking, and wrap async settings test actions in `act(...)`.

**Tech Stack:** Electron 44, React 19, TypeScript 5.9, Zustand 5, @xyflow/react 12, @dagrejs/dagre, Vitest 5.

## Global Constraints
- All commands MUST be proxied with `rtk` (Rule 2).
- Cognitive complexity for every function must remain strictly below 15 (Rule 4).
- All regular expressions must run in guaranteed linear time $\mathcal{O}(n)$ without catastrophic backtracking (Rule 5).
- All unit, component, and integration tests must reside inside dedicated `__tests__/` folders (Rule 6).
- 100% test coverage threshold across lines, functions, statements, and branches must be maintained on `rtk npm run verify:pre-commit`.
- Zero moderate or higher security vulnerabilities on `rtk npm run audit:security`.

---

### Task 1: Firewall Private Subnet IPv4 Validation (Fix 1)

**Files:**
- Modify: `electron/main.cjs:26-36`
- Test: `src/__tests__/electron/main.test.ts`

**Interfaces:**
- Consumes: `isAllowedUrl(rawUrl, isDevelopment)`, `isPrivateOrLoopbackHost(hostname)`
- Produces: `isRfc1918Subnet(hostname: string): boolean` (strictly validates 4 decimal octets 0–255)

- [ ] **Step 1: Write the failing test**

Add tests to `src/__tests__/electron/main.test.ts` asserting that hostnames with domain suffixes starting with RFC 1918 prefixes are rejected:

```typescript
    // In src/__tests__/electron/main.test.ts inside isAllowedUrl test block:
    expect(isAllowedUrl('http://10.attacker.com/api/chat', false)).toBe(false);
    expect(isAllowedUrl('http://192.168.evil.org/api/tags', false)).toBe(false);
    expect(isAllowedUrl('http://172.20.attacker.com/api/chat', false)).toBe(false);
    expect(isAllowedUrl('http://10.0.0.1:11434/api/chat', false)).toBe(true);
    expect(isAllowedUrl('http://192.168.1.100:11434/api/tags', false)).toBe(true);
    expect(isAllowedUrl('http://172.16.0.5:11434/api/chat', false)).toBe(true);
    expect(isAllowedUrl('http://172.31.255.255:11434/api/chat', false)).toBe(true);
    expect(isAllowedUrl('http://172.15.0.1:11434/api/chat', false)).toBe(false);
    expect(isAllowedUrl('http://172.32.0.1:11434/api/chat', false)).toBe(false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/electron/main.test.ts`
Expected: FAIL with `expected false, received true` for `http://10.attacker.com/api/chat`.

- [ ] **Step 3: Implement strict 4-octet IPv4 RFC 1918 validation**

Replace `isRfc1918Subnet` in `electron/main.cjs`:

```javascript
function isRfc1918Subnet(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return false;
  }
  const parts = hostname.split('.');
  if (parts.length !== 4) {
    return false;
  }
  for (let i = 0; i < 4; i++) {
    if (!/^\d+$/.test(parts[i])) {
      return false;
    }
    const num = Number(parts[i]);
    if (num < 0 || num > 255) {
      return false;
    }
  }
  const first = Number(parts[0]);
  const second = Number(parts[1]);
  if (first === 10) {
    return true;
  } else if (first === 192 && second === 168) {
    return true;
  } else if (first === 172 && second >= 16 && second <= 31) {
    return true;
  } else {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/electron/main.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add electron/main.cjs src/__tests__/electron/main.test.ts
git commit -m "fix(security): strictly validate RFC 1918 IPv4 octets in electron firewall"
```

---

### Task 2: Read-Only Guard on `loadStructure` (Fix 2)

**Files:**
- Modify: `src/store/useStructureStore.ts:397-408`
- Test: `src/__tests__/store/useStructureStore.readOnly.test.ts`

**Interfaces:**
- Consumes: `useStructureStore.getState().isReadOnly`
- Produces: `loadStructure(chart: TrustStructureChart): void` (aborts if `isReadOnly` is true)

- [ ] **Step 1: Write the failing test**

Add a test in `src/__tests__/store/useStructureStore.readOnly.test.ts`:

```typescript
  it('prevents loadStructure from replacing entities when isReadOnly is true', () => {
    const { setReadOnly, loadStructure } = useStructureStore.getState();
    setReadOnly(true);

    const initialEntitiesCount = useStructureStore.getState().entities.length;
    const replacementChart: TrustStructureChart = {
      metadata: {
        chartTitle: 'Hacked Structure',
        effectiveDate: '2026-01-01',
        confidentialityNotice: 'NONE',
      },
      entities: [
        {
          id: 'hacked-1',
          name: 'Unauthorized HoldCo',
          type: 'Holding Company',
          jurisdiction: 'Unknown',
          status: 'Active',
          associatedParties: [],
        },
      ],
      relationships: [],
    };

    loadStructure(replacementChart);

    expect(useStructureStore.getState().entities.length).toBe(initialEntitiesCount);
    expect(useStructureStore.getState().metadata.chartTitle).not.toBe('Hacked Structure');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/store/useStructureStore.readOnly.test.ts`
Expected: FAIL with `expected initialEntitiesCount, received 1`.

- [ ] **Step 3: Add read-only guard to `loadStructure`**

Update `loadStructure` in `src/store/useStructureStore.ts`:

```typescript
  loadStructure: (chart) => {
    if (get().isReadOnly) return;
    get().pushHistory();
    set({
      metadata: { ...chart.metadata },
      entities: [...chart.entities],
      relationships: [...chart.relationships],
      stagedNodes: chart.stagedNodes ? [...chart.stagedNodes] : [],
      selectedEntityId: null,
      highlightedParty: null,
      highlightedDirector: null,
    });
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/store/useStructureStore.readOnly.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/useStructureStore.ts src/__tests__/store/useStructureStore.readOnly.test.ts
git commit -m "fix(store): enforce isReadOnly guard in loadStructure"
```

---

### Task 3: Plumb Director Cap and Render Overflow Badges (Fix 3)

**Files:**
- Modify: `src/utils/layoutEngine.ts:130-138,261-286,288-300`
- Modify: `src/components/nodes/EntityCardNode.tsx:9-17,328-434`
- Test: `src/__tests__/utils/layoutEngine.test.ts`
- Test: `src/__tests__/components/nodes/EntityCardNode.test.tsx`

**Interfaces:**
- Consumes: `useStructureStore((state) => state.directorCap)`, `useStructureStore((state) => state.isExportMode)`
- Produces: `getEffectiveSatellitePartyCount(total: number, cap?: number | 'all', isExportMode?: boolean): number`
- Produces: `SatelliteRoleCard` rendering `+N more <role>` overflow badge with progressive disclosure tooltip and navigation click handler when `parties.length > cap` and `!isExportMode`.

- [ ] **Step 1: Write failing tests for layout engine and SatelliteRoleCard overflow**

In `src/__tests__/utils/layoutEngine.test.ts`:
```typescript
it('calculates capped satellite dimensions when directorCap is active and not in export mode', () => {
  const entity: EntityNodeData = {
    id: 'ent-1',
    name: 'HoldCo Alpha',
    type: 'Holding Company',
    jurisdiction: 'BVI',
    status: 'Active',
    associatedParties: [
      { id: 'p1', name: 'Director 1', role: 'Director' },
      { id: 'p2', name: 'Director 2', role: 'Director' },
      { id: 'p3', name: 'Director 3', role: 'Director' },
      { id: 'p4', name: 'Director 4', role: 'Director' },
      { id: 'p5', name: 'Director 5', role: 'Director' },
    ],
  };
  const cappedFlanks = calculateEntityFlanks(entity, 'balanced', 3, false);
  const uncappedFlanks = calculateEntityFlanks(entity, 'balanced', 'all', false);
  expect(cappedFlanks.totalHeight).toBeLessThan(uncappedFlanks.totalHeight);
});
```

In `src/__tests__/components/nodes/EntityCardNode.test.tsx`:
```typescript
it('renders overflow badge when party count exceeds directorCap and switches to directors tab on click', () => {
  useStructureStore.setState({ directorCap: 2, isExportMode: false });
  const data = {
    id: 'sat-1',
    parentEntityId: 'ent-1',
    role: 'Director',
    side: 'left' as const,
    parties: [
      { id: 'p1', name: 'Alice', role: 'Director' },
      { id: 'p2', name: 'Bob', role: 'Director' },
      { id: 'p3', name: 'Charlie', role: 'Director' },
    ],
  };
  render(<SatelliteRoleCard data={data} />);
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
  expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
  const overflowBtn = screen.getByText('+1 more directors...');
  expect(overflowBtn).toBeInTheDocument();

  fireEvent.click(overflowBtn);
  expect(useStructureStore.getState().activeSidebarTab).toBe('directors');
  expect(useStructureStore.getState().selectedEntityId).toBe('ent-1');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `rtk npm test src/__tests__/components/nodes/EntityCardNode.test.tsx`
Expected: FAIL with `Charlie` unexpectedly present and overflow button missing.

- [ ] **Step 3: Plumb cap into `layoutEngine.ts` and `EntityCardNode.tsx`**

In `src/utils/layoutEngine.ts`:
1. Add `getEffectiveSatellitePartyCount`:
```typescript
export function getEffectiveSatellitePartyCount(
  totalCount: number,
  cap?: number | 'all',
  isExportMode?: boolean
): number {
  if (isExportMode || cap === 'all' || cap === undefined) {
    return totalCount;
  }
  return totalCount > cap ? cap + 1 : totalCount;
}
```
2. Update `calculateColumnTotalHeight` to accept `cap` and `isExportMode`, passing effective count into `getSatelliteCardHeight`.
3. Update `calculateEntityFlanks` and `calculateSortedLayout` to pass `cap` and `isExportMode` down.

In `src/components/nodes/EntityCardNode.tsx`:
In `SatelliteRoleCard`:
1. Connect `directorCap = useStructureStore((state) => state.directorCap);`
2. Connect `isExportMode = useStructureStore((state) => state.isExportMode);`
3. Connect `setActiveSidebarTab = useStructureStore((state) => state.setActiveSidebarTab);`
4. Split parties:
```typescript
  const effectiveCap = isExportMode || directorCap === 'all' ? parties.length : directorCap;
  const visibleParties = parties.slice(0, effectiveCap);
  const hiddenParties = parties.slice(effectiveCap);
```
5. Render `visibleParties`, and if `hiddenParties.length > 0`, render:
```tsx
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      if (satData.parentEntityId) {
        setSelectedEntityId(satData.parentEntityId);
        setActiveSidebarTab('directors');
      }
    }}
    title={`Hidden: ${hiddenParties.map((p) => `${p.name} (${p.role})`).join(', ')}`}
    className="w-full text-left mt-1 pt-1 border-t border-slate-100 text-[9px] font-semibold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer flex items-center justify-between"
  >
    <span>+{hiddenParties.length} more {satData.role.toLowerCase()}...</span>
  </button>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `rtk npm test src/__tests__/components/nodes/EntityCardNode.test.tsx src/__tests__/utils/layoutEngine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/layoutEngine.ts src/components/nodes/EntityCardNode.tsx src/__tests__/utils/layoutEngine.test.ts src/__tests__/components/nodes/EntityCardNode.test.tsx
git commit -m "feat(canvas): wire directorCap to layout calculations and satellite overflow badges"
```

---

### Task 4: AbortSignal Handling in Gemini Vision OCR (Fix 4)

**Files:**
- Modify: `src/services/ai/chartVisionService.ts:164-216`
- Test: `src/__tests__/services/chartVisionService.test.ts`

**Interfaces:**
- Consumes: `signal?: AbortSignal`
- Produces: `callGeminiVision(base64Image: string, mimeType: string, config: AIConfig, signal?: AbortSignal): Promise<string>`

- [ ] **Step 1: Write the failing test**

Add a test in `src/__tests__/services/chartVisionService.test.ts` verifying that `analyzeChartImage` aborts when `signal` is aborted for Gemini:

```typescript
it('rejects with AbortError when signal is aborted during Gemini vision request', async () => {
  const controller = new AbortController();
  controller.abort();

  await expect(
    analyzeChartImage(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'image/png',
      { provider: 'gemini', apiKey: 'test-key', model: 'gemini-3.8-flash', ollamaUrl: '' },
      controller.signal
    )
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/services/chartVisionService.test.ts`
Expected: FAIL because `analyzeChartImage` does not check or pass `signal` to Gemini.

- [ ] **Step 3: Implement AbortSignal propagation in `callGeminiVision`**

Update `callGeminiVision` and `analyzeChartImage` in `src/services/ai/chartVisionService.ts`:

```typescript
async function callGeminiVision(
  base64Image: string,
  mimeType: string,
  config: AIConfig,
  signal?: AbortSignal
): Promise<string> {
  if (signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const model = config.model || 'gemini-3.8-flash';
  const ai = new GoogleGenAI({ apiKey: config.apiKey.trim() });

  const generatePromise = ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          mimeType,
          data: cleanBase64Image(base64Image),
        },
      },
      {
        text: VISION_USER_PROMPT,
      },
    ],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: CHART_VISION_RESPONSE_SCHEMA,
    },
  });

  let response: any;
  if (!signal) {
    response = await generatePromise;
  } else {
    response = await Promise.race([
      generatePromise,
      new Promise<never>((_, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new DOMException('The user aborted a request.', 'AbortError')),
          { once: true }
        );
      }),
    ]);
  }

  const text = response.text;
  if (!text) throw new Error('AI returned an empty response.');
  return text;
}
```
And pass `signal` into `callGeminiVision(base64Image, mimeType, config, signal)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/services/chartVisionService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/ai/chartVisionService.ts src/__tests__/services/chartVisionService.test.ts
git commit -m "fix(ai): propagate AbortSignal to cancel in-flight Gemini vision requests"
```

---

### Task 5: Electron-Builder Configuration File (Fix 5)

**Files:**
- Create: `electron-builder.json`
- Test: `src/__tests__/electron/preload.test.ts` (or dedicated packaging config assertion)

**Interfaces:**
- Produces: `electron-builder.json` with strict file inclusion (`dist/**/*`, `electron/**/*`, `package.json`), excluding `__tests__` and dev scripts.

- [ ] **Step 1: Write test verifying electron-builder configuration**

Add a test in `src/__tests__/electron/preload.test.ts` verifying `electron-builder.json` excludes tests:

```typescript
import fs from 'node:fs';
import path from 'node:path';

it('validates electron-builder.json excludes test directories from production release', () => {
  const configPath = path.resolve(__dirname, '../../../electron-builder.json');
  expect(fs.existsSync(configPath)).toBe(true);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  expect(config.files).toContain('dist/**/*');
  expect(config.files).toContain('electron/**/*');
  expect(config.files.some((f: string) => f.includes('__tests__'))).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/electron/preload.test.ts`
Expected: FAIL because `electron-builder.json` does not exist.

- [ ] **Step 3: Create `electron-builder.json`**

Create `electron-builder.json` in the project root:

```json
{
  "$schema": "https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json",
  "appId": "com.duracellrabbid.jermchart",
  "productName": "JERMChart",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*",
    "package.json"
  ],
  "extraMetadata": {
    "main": "electron/main.cjs"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/electron/preload.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add electron-builder.json src/__tests__/electron/preload.test.ts
git commit -m "build(electron): add electron-builder.json to isolate release binaries from test code"
```

---

### Task 6: Code-Split Heavy Export & Conversion Libraries (Fix 6)

**Files:**
- Modify: `src/utils/imagePreprocessing.ts:1,34-43`
- Modify: `src/utils/exportService.ts:1-5,206-320`
- Modify: `src/utils/excelParser.ts:1,157-166,289-300`
- Modify: `src/utils/excelExporter.ts:1,87-113`
- Modify: `src/components/import/ExcelImportModal.tsx:120-145`
- Test: `src/__tests__/utils/imagePreprocessing.test.ts`
- Test: `src/__tests__/utils/exportService.test.ts`
- Test: `src/__tests__/utils/excelParser.test.ts`

**Interfaces:**
- Produces: `convertHeicIfNeeded(file: File): Promise<Blob>` (lazily loads `heic2any`)
- Produces: `exportToPdf(elementId, metadata): Promise<void>` (lazily loads `jspdf`)
- Produces: `exportToPptx(elementId, metadata): Promise<void>` (lazily loads `pptxgenjs`)
- Produces: `parseExcelWorkbook(buffer): Promise<{ chart, warnings }>` (lazily loads `xlsx`)
- Produces: `exportChartToExcel(chart): Promise<Uint8Array>` (lazily loads `xlsx`)

- [ ] **Step 1: Write test verifying lazy loading behavior**

In `src/__tests__/utils/exportService.test.ts`, confirm `exportToPdf` and `exportToPptx` resolve correctly with dynamic imports. In `src/__tests__/utils/excelParser.test.ts`, update callers to `await parseExcelWorkbook(...)`.

- [ ] **Step 2: Update `imagePreprocessing.ts` to dynamically import `heic2any`**

Remove top-level `import heic2any from 'heic2any';`. In `convertHeicIfNeeded`:

```typescript
export async function convertHeicIfNeeded(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  const mod = await import('heic2any');
  const heic2any = (mod as any).default || mod;
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.88,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}
```

- [ ] **Step 3: Update `exportService.ts` to dynamically import `jspdf` and `pptxgenjs`**

Remove top-level `import { jsPDF } from 'jspdf';` and `import pptxgen from 'pptxgenjs';`.
In `exportToPdf`:
```typescript
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
```
In `exportToPptx`:
```typescript
  const pptxMod = await import('pptxgenjs');
  const pptxgen = (pptxMod as any).default || pptxMod;
  const pptx = new pptxgen();
```

- [ ] **Step 4: Update `excelParser.ts` and `excelExporter.ts` to lazily import `xlsx`**

In `excelParser.ts`:
Change `parseExcelWorkbook` and `generateExcelTemplate` to `async`:
```typescript
export async function parseExcelWorkbook(fileBuffer: ArrayBuffer | Uint8Array) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(fileBuffer, { type: 'array' });
  ...
}
```
In `excelExporter.ts`:
```typescript
export async function exportChartToExcel(chart: TrustStructureChart): Promise<Uint8Array> {
  const XLSX = await import('xlsx');
  const rows = buildExcelRowsFromChart(chart);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  ...
}
```
Update callers in `ExcelImportModal.tsx` and `ExportModal.tsx` to `await` the async calls.

- [ ] **Step 5: Run tests and verify bundle size reduction**

Run: `rtk npm test`
Run: `rtk npm run build`
Expected: All tests pass. Vite build shows code-split chunks for `heic2any`, `xlsx`, `jspdf`, `pptxgenjs`, and initial bundle drops dramatically from 3.6 MB down to under 500 kB.

- [ ] **Step 6: Commit**

```bash
git add src/utils/imagePreprocessing.ts src/utils/exportService.ts src/utils/excelParser.ts src/utils/excelExporter.ts src/components/import/ExcelImportModal.tsx src/components/export/ExportModal.tsx src/__tests__/
git commit -m "perf: code-split heavy export and image libraries to reduce initial bundle"
```

---

### Task 7: Chunked Base64 Encoding in Crypto Service (Fix 7)

**Files:**
- Modify: `src/utils/cryptoService.ts:22-29`
- Test: `src/__tests__/utils/cryptoService.test.ts`

**Interfaces:**
- Produces: `arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string` using 8 KB chunking to prevent quadratic string concatenation.

- [ ] **Step 1: Write test verifying chunked base64 output matches for small and large buffers**

In `src/__tests__/utils/cryptoService.test.ts`:
```typescript
it('efficiently encodes large buffers (>64KB) to base64 and roundtrips with base64ToArrayBuffer', () => {
  const largeBuffer = new Uint8Array(100 * 1024);
  for (let i = 0; i < largeBuffer.length; i++) {
    largeBuffer[i] = i % 256;
  }
  const b64 = arrayBufferToBase64(largeBuffer);
  const restored = new Uint8Array(base64ToArrayBuffer(b64));
  expect(restored.length).toBe(largeBuffer.length);
  expect(restored[500]).toBe(500 % 256);
  expect(restored[65536]).toBe(65536 % 256);
});
```

- [ ] **Step 2: Run test to verify baseline**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`

- [ ] **Step 3: Implement chunked arrayBufferToBase64**

In `src/utils/cryptoService.ts`:
```typescript
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const CHUNK_SIZE = 8192;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.byteLength; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    chunks.push(String.fromCharCode.apply(null, chunk as unknown as number[]));
  }
  return btoa(chunks.join(''));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/cryptoService.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/cryptoService.ts src/__tests__/utils/cryptoService.test.ts
git commit -m "perf(crypto): use 8KB chunks in arrayBufferToBase64 to eliminate string loop churn"
```

---

### Task 8: Wrap Async State Updates in Settings Modal Tests (Fix 8)

**Files:**
- Modify: `src/__tests__/components/settings/SettingsModal.test.tsx`

**Interfaces:**
- Produces: Zero React 19 `act(...)` warning logs in stderr during test runs.

- [ ] **Step 1: Identify and wrap simulated input events in `act(...)`**

In `src/__tests__/components/settings/SettingsModal.test.tsx`:
Import `act` from `@testing-library/react`. Wrap user event fire calls:

```typescript
await act(async () => {
  fireEvent.change(screen.getByLabelText(/Ollama Server URL/i), {
    target: { value: 'http://192.168.1.50:11434' },
  });
});
```
Wrap all provider switching and model input change handlers across the tests that emitted stderr warnings.

- [ ] **Step 2: Run test and verify clean output**

Run: `rtk npm test src/__tests__/components/settings/SettingsModal.test.tsx`
Expected: All 45 tests PASS with zero `not wrapped in act(...)` warnings.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/settings/SettingsModal.test.tsx
git commit -m "test(settings): wrap input changes in act to eliminate React 19 test warnings"
```

---

### Task 9: Full Lifecycle Gate Verification

- [ ] **Step 1: Run pre-commit gate**
Run: `rtk npm run verify:pre-commit`
Expected: ESLint passes with 0 warnings/errors, 100% test coverage maintained across all metrics.

- [ ] **Step 2: Run pre-push gate**
Run: `rtk npm run verify:pre-push`
Expected: Production Vite build succeeds, security audit reports 0 vulnerabilities.

- [ ] **Step 3: Confirm repository clean state**
Run: `rtk git status`
Expected: Clean working tree.
