# Trust Shapes & PowerPoint Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform 'Trust' and 'Trust Company' nodes into triangular cards, render subsidiary entities as 220x220 square cards, and add widescreen 16:9 PowerPoint (.pptx) export.

**Architecture:** Update `types/structure.ts` and `layoutEngine.ts` to calculate entity-specific dimensions (260x220 for triangular trusts, 220x220 for square subsidiaries); enhance `EntityCardNode.tsx` to render triangular SVG cards for trusts and square cards for subsidiaries; integrate `pptxgenjs` into `exportService.ts` and `ExportModal.tsx`.

**Tech Stack:** React 18, TypeScript 5.7, `@xyflow/react`, `@dagrejs/dagre`, `pptxgenjs`, `html-to-image`, Tailwind CSS, Vitest 3.

## Global Constraints

- Cognitive complexity for every function must be strictly `< 15` (SonarSource metric).
- All regular expressions must run in linear time $\mathcal{O}(n)$ with no catastrophic backtracking.
- All unit and component tests must reside in dedicated `src/__tests__/` directories and be excluded from production builds.
- Run commands with `rtk` prefix (`rtk npm test`, `rtk npm run build`).

---

### Task 1: Add 'Trust Company' Entity Type and Shape-Aware Dimensions in Layout Engine

**Files:**
- Modify: `src/types/structure.ts:1-10`
- Modify: `src/utils/layoutEngine.ts:8-16, 85-135`
- Modify: `src/components/sidebar/EntityDetailsTab.tsx:6-14`
- Test: `src/__tests__/utils/layoutEngine.test.ts`

**Interfaces:**
- Produces:
  - `EntityType`: includes `'Trust Company'`
  - `TRUST_CARD_WIDTH = 260`, `TRUST_CARD_HEIGHT = 220`, `SUBSIDIARY_CARD_SIZE = 220`
  - `getEntityDimensions(type: EntityType): { width: number; height: number }`

- [ ] **Step 1: Write the failing tests for entity dimensions in layoutEngine**

In `src/__tests__/utils/layoutEngine.test.ts`, add:
```typescript
import {
  calculateSortedLayout,
  sortSiblingEntities,
  calculateCardHeight,
  CARD_WIDTH,
  BASE_CARD_HEIGHT,
  DIRECTOR_ROW_HEIGHT,
  TRUST_CARD_WIDTH,
  TRUST_CARD_HEIGHT,
  SUBSIDIARY_CARD_SIZE,
  getEntityDimensions,
} from '../../utils/layoutEngine';

describe('getEntityDimensions', () => {
  it('returns triangular dimensions for Trust and Trust Company', () => {
    expect(getEntityDimensions('Trust')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
    expect(getEntityDimensions('Trust Company')).toEqual({ width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT });
  });

  it('returns square dimensions for subsidiary entity types', () => {
    expect(getEntityDimensions('Holding Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
    expect(getEntityDimensions('Operating Company')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
    expect(getEntityDimensions('LLC')).toEqual({ width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/layoutEngine.test.ts`  
Expected: FAIL with `getEntityDimensions is not a function` or import error.

- [ ] **Step 3: Implement EntityType and getEntityDimensions**

In `src/types/structure.ts`:
```typescript
export type EntityType = 
  | 'Trust' 
  | 'Trust Company'
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual';
```

In `src/utils/layoutEngine.ts`:
```typescript
export const TRUST_CARD_WIDTH = 260;
export const TRUST_CARD_HEIGHT = 220;
export const SUBSIDIARY_CARD_SIZE = 220;

export function getEntityDimensions(type: EntityType): { width: number; height: number } {
  if (type === 'Trust' || type === 'Trust Company') {
    return { width: TRUST_CARD_WIDTH, height: TRUST_CARD_HEIGHT };
  }
  return { width: SUBSIDIARY_CARD_SIZE, height: SUBSIDIARY_CARD_SIZE };
}
```
Update `calculateSortedLayout`:
```typescript
  // Register nodes with entity-specific dimensions
  entities.forEach((entity) => {
    const dims = getEntityDimensions(entity.type);
    dagreGraph.setNode(entity.id, {
      width: dims.width,
      height: dims.height,
    });
  });
```
And node position mapping:
```typescript
  const nodes: Node[] = entities.map((entity) => {
    const nodeWithPosition = dagreGraph.node(entity.id);
    const dims = getEntityDimensions(entity.type);

    return {
      id: entity.id,
      type: 'entityNode',
      position: {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
      data: {
        ...entity,
        computedHeight: dims.height,
        computedWidth: dims.width,
      },
    };
  });
```

In `src/components/sidebar/EntityDetailsTab.tsx`:
Add `'Trust Company'` to `ENTITY_TYPES` array.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/layoutEngine.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/types/structure.ts src/utils/layoutEngine.ts src/components/sidebar/EntityDetailsTab.tsx src/__tests__/utils/layoutEngine.test.ts
rtk git commit -m "feat: add Trust Company type and shape-aware layout dimensions"
```

---

### Task 2: Implement Triangular Trust Card and Square Subsidiary Card Components

**Files:**
- Modify: `src/components/nodes/EntityCardNode.tsx`
- Modify: `src/utils/entityStyle.ts`
- Test: `src/__tests__/components/nodes/EntityCardNode.test.tsx`
- Test: `src/__tests__/utils/entityStyle.test.ts`

**Interfaces:**
- Consumes:
  - `EntityNodeData` from `src/types/structure.ts`
  - `getEntityTypeColor` from `src/utils/entityStyle.ts`
- Produces:
  - Triangular UI layout with apex top handle and base bottom handle for `Trust` / `Trust Company`.
  - 220x220 square UI layout with header, body, compact directors list, and UBO indicator for subsidiaries.

- [ ] **Step 1: Write failing tests for triangle trust node and square subsidiary node**

In `src/__tests__/components/nodes/EntityCardNode.test.tsx`, add tests:
```tsx
it('renders triangular shape styling for Trust and Trust Company entities', () => {
  const { container } = render(
    <ReactFlowProvider>
      <EntityCardNode {...(createProps({ data: { ...baseEntityData, type: 'Trust' } }) as any)} />
    </ReactFlowProvider>
  );
  expect(container.querySelector('svg.triangle-shape-bg')).toBeInTheDocument();
});

it('renders square 220px styling for subsidiary entities', () => {
  const { container } = render(
    <ReactFlowProvider>
      <EntityCardNode
        {...(createProps({
          data: { ...baseEntityData, type: 'Holding Company', name: 'HoldCo 1' },
        }) as any)}
      />
    </ReactFlowProvider>
  );
  const cardElement = container.querySelector('[data-testid="subsidiary-card-node"]');
  expect(cardElement).toBeInTheDocument();
  expect(cardElement?.className).toContain('w-[220px]');
  expect(cardElement?.className).toContain('h-[220px]');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/nodes/EntityCardNode.test.tsx`  
Expected: FAIL with missing svg or subsidiary testid.

- [ ] **Step 3: Implement Triangular Trust and Square Subsidiary rendering**

In `src/utils/entityStyle.ts`, support `'Trust Company'`:
```typescript
case 'Trust':
case 'Trust Company':
  return {
    border: 'border-amber-400',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    accentBar: 'bg-amber-500',
  };
```

In `src/components/nodes/EntityCardNode.tsx`:
Decompose into:
1. `TrustTriangleCard`: Renders 260px $\times$ 220px triangular card with an SVG background polygon (`points="130,4 256,216 4,216"`), top handle at $(50\%, 0)$, bottom handle at $(50\%, 100\%)$, centered structured text for Badge, Name, Jurisdiction, and Trustee/Settlor summary.
2. `SubsidiarySquareCard`: Renders 220px $\times$ 220px square card (`w-[220px] h-[220px] rounded-lg bg-white border-2 flex flex-col justify-between overflow-hidden shadow-md`), with compact header, body, scrollable director chips, and UBO footer.
3. `EntityCardNode`: Dispatches to `TrustTriangleCard` if `entity.type === 'Trust' || entity.type === 'Trust Company'`, else `SubsidiarySquareCard`.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/nodes/EntityCardNode.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/utils/entityStyle.ts src/components/nodes/EntityCardNode.tsx src/__tests__/components/nodes/EntityCardNode.test.tsx src/__tests__/utils/entityStyle.test.ts
rtk git commit -m "feat: render triangular cards for trusts and square cards for subsidiaries"
```

---

### Task 3: Implement PowerPoint (.pptx) Export Service

**Files:**
- Modify: `package.json`
- Modify: `src/utils/exportService.ts`
- Test: `src/__tests__/utils/exportService.test.ts`

**Interfaces:**
- Produces: `exportToPptx(elementId: string, metadata: ChartMetadata): Promise<void>`

- [ ] **Step 1: Install `pptxgenjs`**

Run: `rtk npm install pptxgenjs`

- [ ] **Step 2: Write failing test for `exportToPptx`**

In `src/__tests__/utils/exportService.test.ts`, add test for `exportToPptx`:
```typescript
describe('exportToPptx', () => {
  it('generates 16:9 PowerPoint presentation with header, scaled chart image, and confidentiality footer', async () => {
    const dummyEl = document.createElement('div');
    dummyEl.id = 'pptx-canvas';
    document.body.appendChild(dummyEl);

    await exportToPptx('pptx-canvas', sampleTrustStructure.metadata);
    // Verifies pptx generation and save
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `rtk npm test src/__tests__/utils/exportService.test.ts`  
Expected: FAIL with `exportToPptx is not defined`.

- [ ] **Step 4: Implement `exportToPptx` in `src/utils/exportService.ts`**

```typescript
import pptxgen from 'pptxgenjs';

export async function exportToPptx(
  elementId: string,
  metadata: ChartMetadata
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const viewport = element.querySelector('.react-flow__viewport') as HTMLElement;
  const target = viewport || element;

  const dataUrl = await toPng(target, {
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
  });

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches

  const slide = pptx.addSlide();

  // Header Title
  slide.addText(metadata.chartTitle || 'Trust Structure Chart', {
    x: 0.5,
    y: 0.3,
    w: 9.0,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: '0F172A',
  });

  // Metadata Subtitle
  slide.addText(
    `Matter Ref: ${metadata.clientReference || 'N/A'}  |  Effective Date: ${metadata.effectiveDate}`,
    {
      x: 0.5,
      y: 0.7,
      w: 9.0,
      h: 0.3,
      fontSize: 9,
      color: '64748B',
    }
  );

  // Line separator
  slide.addShape(pptx.ShapeType.line, {
    x: 0.5,
    y: 1.05,
    w: 9.0,
    h: 0,
    line: { color: 'E2E8F0', width: 1 },
  });

  // Main Chart Image (centered in 9.0 x 4.0 area)
  slide.addImage({
    data: dataUrl,
    x: 0.5,
    y: 1.2,
    w: 9.0,
    h: 3.9,
    sizing: { type: 'contain', w: 9.0, h: 3.9 },
  });

  // Footer Confidentiality
  slide.addText(
    metadata.confidentialityNotice || 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
    {
      x: 0.5,
      y: 5.25,
      w: 9.0,
      h: 0.25,
      fontSize: 8,
      color: '94A3B8',
      align: 'center',
    }
  );

  const safeTitle = (metadata.chartTitle || 'Trust').replace(/[^a-zA-Z0-9]/g, '_');
  await pptx.writeFile({ fileName: `${safeTitle}_Structure.pptx` });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `rtk npm test src/__tests__/utils/exportService.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
rtk git add package.json package-lock.json src/utils/exportService.ts src/__tests__/utils/exportService.test.ts
rtk git commit -m "feat: implement PowerPoint (.pptx) export service"
```

---

### Task 4: Integrate PowerPoint Export in ExportModal UI

**Files:**
- Modify: `src/components/export/ExportModal.tsx`
- Test: `src/__tests__/components/export/ExportModal.test.tsx`

**Interfaces:**
- Consumes: `exportToPptx` from `src/utils/exportService.ts`
- Produces: Export modal button for PowerPoint presentation export with status message.

- [ ] **Step 1: Write failing test for PowerPoint export button in ExportModal**

In `src/__tests__/components/export/ExportModal.test.tsx`, add:
```tsx
it('triggers PowerPoint export and displays success feedback', async () => {
  render(<ExportModal onClose={mockOnClose} />);

  const pptxBtn = screen.getByRole('button', { name: /PowerPoint/i });
  fireEvent.click(pptxBtn);

  await waitFor(() => {
    expect(exportService.exportToPptx).toHaveBeenCalledWith(
      'trust-structure-canvas',
      expect.objectContaining({ chartTitle: expect.any(String) })
    );
    expect(screen.getByText(/PowerPoint slide generated successfully/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`  
Expected: FAIL with unable to find PowerPoint button.

- [ ] **Step 3: Implement PowerPoint button and handler in ExportModal**

In `src/components/export/ExportModal.tsx`:
- Import `exportToPptx` and `Presentation` icon from `lucide-react`.
- Add `handleExportPptx` handler.
- Add PowerPoint option button in the export grid.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test src/__tests__/components/export/ExportModal.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
rtk git add src/components/export/ExportModal.tsx src/__tests__/components/export/ExportModal.test.tsx
rtk git commit -m "feat: add PowerPoint export option to ExportModal"
```

---

### Task 5: End-to-End Verification & Build Check

**Files:**
- All touched files

- [ ] **Step 1: Run full test suite**

Run: `rtk npm test`  
Expected: All test suites pass (100% pass rate).

- [ ] **Step 2: Run TypeScript check and production build**

Run: `rtk npm run build`  
Expected: TypeScript compilation succeeds with zero errors, Vite build succeeds.

- [ ] **Step 3: Final commit and verify git status**

Run: `rtk git status`  
Expected: Clean working tree.
