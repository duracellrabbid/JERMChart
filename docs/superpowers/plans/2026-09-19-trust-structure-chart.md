# Trust Management Structure Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% client-side web application for trust officers to key in, automatically sort, interactively edit, and export corporate and trust structure charts.

**Architecture:** React + Vite + TypeScript application using `@xyflow/react` for interactive canvas manipulation, `@dagrejs/dagre` for automated hierarchical tree layout calculation with sibling sorting rules, a lightweight reactive store (Zustand) syncing the visual canvas with a sidebar tree/form inspector, and `html-to-image` + `jspdf` for high-resolution PNG, SVG, and print-ready PDF export.

**Tech Stack:** React 18/19, TypeScript, Vite, Tailwind CSS, Lucide React, `@xyflow/react`, `@dagrejs/dagre`, `zustand`, `html-to-image`, `jspdf`, Vitest.

## Global Constraints

- 100% frontend client-side execution; no backend API or server database required.
- All layouts must run in-browser deterministically without NaN coordinates or overlapping nodes.
- Card dimensions: Fixed standard card width of 280px with dynamic height depending on director count.
- Sibling sorting rules: Alphabetical (A-Z), Ownership % (High to Low), Jurisdiction, and Manual.
- Export fidelity: High-DPI (2x minimum) PNG, vector SVG, and A4/A3 Landscape PDF with formal Trust metadata header and confidentiality footer.

---

### Task 1: Scaffolding, Dependencies & Testing Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: Runnable React + Vite application with Tailwind CSS and Vitest test runner.

- [ ] **Step 1: Create `package.json` with all required dependencies**

```json
{
  "name": "trust-management-utility",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@dagrejs/dagre": "^1.1.4",
    "@xyflow/react": "^12.4.2",
    "clsx": "^2.1.1",
    "html-to-image": "^1.11.11",
    "jspdf": "^2.5.2",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.0.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^26.0.0",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 2: Configure Vite, Tailwind, and PostCSS**

Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        trust: {
          50: '#f8fafc',
          100: '#f1f5f9',
          500: '#0f172a',
          600: '#0284c7',
          700: '#0369a1',
          gold: '#d97706',
          navy: '#0f172a',
          teal: '#0d9488',
        },
      },
    },
  },
  plugins: [],
};
```

Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `index.html`, `src/index.css`, `src/test/setup.ts`, and initial `App.tsx`**

Create `index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Trust Structure Chart Utility</title>
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

Create `src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

Create `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:
```tsx
import React from 'react';

export default function App() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
      <h1 className="text-2xl font-bold">Trust Structure Chart Utility</h1>
    </div>
  );
}
```

- [ ] **Step 4: Create failing/passing test for app scaffolding**

Create `src/App.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Scaffolding', () => {
  it('renders application header title', () => {
    render(<App />);
    expect(screen.getByText(/Trust Structure Chart Utility/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests and verify build**

Run: `npm install && npm test`  
Expected: 1 passing test suite.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold react vite tailwind project with vitest"
```

---

### Task 2: Core Data Types, Store & Sample Trust Template

**Files:**
- Create: `src/types/structure.ts`
- Create: `src/data/sampleStructure.ts`
- Create: `src/store/useStructureStore.ts`
- Test: `src/store/useStructureStore.test.ts`

**Interfaces:**
- Consumes: Zustand
- Produces: `useStructureStore` exposing `entities`, `relationships`, `metadata`, `selectedEntityId`, `highlightedDirector`, `sortCriteria`, and mutation actions.

- [ ] **Step 1: Define TypeScript models in `src/types/structure.ts`**

```typescript
export type EntityType = 
  | 'Trust' 
  | 'Holding Company' 
  | 'Operating Company' 
  | 'LLC' 
  | 'Foundation' 
  | 'Partnership' 
  | 'Individual';

export type EntityStatus = 'Active' | 'Dormant' | 'In Liquidation' | 'Nominee';

export type SiblingSortCriteria = 'alphabetical' | 'ownership' | 'jurisdiction' | 'manual';

export interface Director {
  id: string;
  name: string;
  isCorporate: boolean;
  appointmentDate?: string;
  isResident?: boolean;
}

export interface EntityNodeData {
  id: string;
  name: string;
  type: EntityType;
  jurisdiction: string;
  registrationNumber?: string;
  taxId?: string;
  status: EntityStatus;
  directors: Director[];
  ubosOrBeneficiaries?: string[];
  notes?: string;
}

export interface OwnershipEdgeData {
  id: string;
  source: string;
  target: string;
  ownershipPercentage?: number;
  shareClass?: string;
  isCrossLink?: boolean;
}

export interface ChartMetadata {
  chartTitle: string;
  clientReference?: string;
  effectiveDate: string;
  confidentialityNotice: string;
}

export interface TrustStructureChart {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
}
```

- [ ] **Step 2: Create realistic initial template in `src/data/sampleStructure.ts`**

```typescript
import { TrustStructureChart } from '../types/structure';

export const sampleTrustStructure: TrustStructureChart = {
  metadata: {
    chartTitle: 'The Aurelius Dynasty Trust Structure',
    clientReference: 'TRUST-2026-088',
    effectiveDate: '2026-09-19',
    confidentialityNotice: 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT & TRUSTEE REVIEW ONLY',
  },
  entities: [
    {
      id: 'entity-1',
      name: 'The Aurelius Dynasty Trust',
      type: 'Trust',
      jurisdiction: 'Jersey, Channel Islands',
      registrationNumber: 'TR-JER-2018-912',
      status: 'Active',
      directors: [
        { id: 'dir-1', name: 'Apex Trust Corp (Jersey) Ltd', isCorporate: true, isResident: true },
        { id: 'dir-2', name: 'Julian Vance', isCorporate: false, isResident: true },
      ],
      ubosOrBeneficiaries: ['Marcus Aurelius (Settlor)', 'Vance Family Descendants (Beneficiaries)'],
      notes: 'Discretionary irrevocable settlement governed by Jersey Law.',
    },
    {
      id: 'entity-2',
      name: 'Aurelius Global Holdings Ltd',
      type: 'Holding Company',
      jurisdiction: 'British Virgin Islands (BVI)',
      registrationNumber: 'BVI-BC-1849201',
      status: 'Active',
      directors: [
        { id: 'dir-2', name: 'Julian Vance', isCorporate: false, isResident: false },
        { id: 'dir-3', name: 'Helena Sterling', isCorporate: false, isResident: false },
      ],
      ubosOrBeneficiaries: ['The Aurelius Dynasty Trust (100% Beneficial Interest)'],
      notes: 'Primary offshore investment holding vehicle.',
    },
    {
      id: 'entity-3',
      name: 'Aurelius Capital Singapore Pte Ltd',
      type: 'Operating Company',
      jurisdiction: 'Singapore',
      registrationNumber: '202018492K',
      status: 'Active',
      directors: [
        { id: 'dir-3', name: 'Helena Sterling', isCorporate: false, isResident: false },
        { id: 'dir-4', name: 'David Tan Wei Ming', isCorporate: false, isResident: true },
      ],
      ubosOrBeneficiaries: ['Aurelius Global Holdings Ltd'],
      notes: 'APAC treasury and private equity management office.',
    },
    {
      id: 'entity-4',
      name: 'Aurelius Tech Ventures LLC',
      type: 'LLC',
      jurisdiction: 'Delaware, USA',
      registrationNumber: 'DE-SR-7829104',
      status: 'Active',
      directors: [
        { id: 'dir-2', name: 'Julian Vance', isCorporate: false, isResident: true },
      ],
      ubosOrBeneficiaries: ['Aurelius Global Holdings Ltd'],
      notes: 'US venture capital portfolio holding entity.',
    },
    {
      id: 'entity-5',
      name: 'Aurelius Maritime Holdings Corp',
      type: 'Holding Company',
      jurisdiction: 'Marshall Islands',
      registrationNumber: 'MI-108422',
      status: 'Dormant',
      directors: [
        { id: 'dir-5', name: 'Pacific Corporate Services Ltd', isCorporate: true, isResident: true },
      ],
      ubosOrBeneficiaries: ['Aurelius Global Holdings Ltd'],
      notes: 'Special purpose shipping SPV.',
    },
  ],
  relationships: [
    {
      id: 'rel-1-2',
      source: 'entity-1',
      target: 'entity-2',
      ownershipPercentage: 100,
      shareClass: 'Ordinary Voting Shares',
    },
    {
      id: 'rel-2-3',
      source: 'entity-2',
      target: 'entity-3',
      ownershipPercentage: 100,
      shareClass: 'Ordinary Shares',
    },
    {
      id: 'rel-2-4',
      source: 'entity-2',
      target: 'entity-4',
      ownershipPercentage: 75,
      shareClass: 'Class A Member Units',
    },
    {
      id: 'rel-2-5',
      source: 'entity-2',
      target: 'entity-5',
      ownershipPercentage: 100,
      shareClass: 'Ordinary Bearer Warrants',
    },
  ],
};
```

- [ ] **Step 3: Write tests for `useStructureStore`**

Create `src/store/useStructureStore.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useStructureStore } from './useStructureStore';
import { sampleTrustStructure } from '../data/sampleStructure';

describe('useStructureStore', () => {
  beforeEach(() => {
    useStructureStore.getState().resetToSample();
  });

  it('initializes with sample trust data', () => {
    const { entities, relationships, metadata } = useStructureStore.getState();
    expect(entities.length).toBe(5);
    expect(relationships.length).toBe(4);
    expect(metadata.chartTitle).toContain('Aurelius Dynasty Trust');
  });

  it('adds an entity and updates store', () => {
    useStructureStore.getState().addEntity({
      name: 'New Cayman SPV Ltd',
      type: 'Holding Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      directors: [],
    });

    const entities = useStructureStore.getState().entities;
    expect(entities.length).toBe(6);
    expect(entities[entities.length - 1].name).toBe('New Cayman SPV Ltd');
  });

  it('adds an ownership relationship between entities', () => {
    const state = useStructureStore.getState();
    const parentId = state.entities[0].id;
    const child = state.addEntity({
      name: 'Direct SPV',
      type: 'Operating Company',
      jurisdiction: 'UK',
      status: 'Active',
      directors: [],
    });

    state.addRelationship({
      source: parentId,
      target: child.id,
      ownershipPercentage: 50,
      shareClass: 'Ordinary',
    });

    const rels = useStructureStore.getState().relationships;
    expect(rels.some((r) => r.source === parentId && r.target === child.id && r.ownershipPercentage === 50)).toBe(true);
  });

  it('spotlights and clears a director', () => {
    useStructureStore.getState().setHighlightedDirector('Julian Vance');
    expect(useStructureStore.getState().highlightedDirector).toBe('Julian Vance');

    useStructureStore.getState().setHighlightedDirector(null);
    expect(useStructureStore.getState().highlightedDirector).toBeNull();
  });
});
```

- [ ] **Step 4: Implement `src/store/useStructureStore.ts`**

```typescript
import { create } from 'zustand';
import {
  ChartMetadata,
  Director,
  EntityNodeData,
  OwnershipEdgeData,
  SiblingSortCriteria,
  TrustStructureChart,
} from '../types/structure';
import { sampleTrustStructure } from '../data/sampleStructure';

interface StructureState {
  metadata: ChartMetadata;
  entities: EntityNodeData[];
  relationships: OwnershipEdgeData[];
  selectedEntityId: string | null;
  highlightedDirector: string | null;
  sortCriteria: SiblingSortCriteria;

  // Actions
  setMetadata: (meta: Partial<ChartMetadata>) => void;
  setSelectedEntityId: (id: string | null) => void;
  setHighlightedDirector: (directorName: string | null) => void;
  setSortCriteria: (criteria: SiblingSortCriteria) => void;

  // Entity mutations
  addEntity: (entity: Omit<EntityNodeData, 'id'>, parentId?: string, ownershipPct?: number) => EntityNodeData;
  updateEntity: (id: string, updates: Partial<EntityNodeData>) => void;
  deleteEntity: (id: string) => void;

  // Director mutations
  addDirector: (entityId: string, director: Omit<Director, 'id'>) => void;
  removeDirector: (entityId: string, directorId: string) => void;

  // Relationship mutations
  addRelationship: (rel: Omit<OwnershipEdgeData, 'id'>) => void;
  updateRelationship: (id: string, updates: Partial<OwnershipEdgeData>) => void;
  deleteRelationship: (id: string) => void;

  // Full state import/export
  loadStructure: (chart: TrustStructureChart) => void;
  resetToSample: () => void;
}

export const useStructureStore = create<StructureState>((set, get) => ({
  metadata: { ...sampleTrustStructure.metadata },
  entities: [...sampleTrustStructure.entities],
  relationships: [...sampleTrustStructure.relationships],
  selectedEntityId: null,
  highlightedDirector: null,
  sortCriteria: 'alphabetical',

  setMetadata: (meta) =>
    set((state) => ({ metadata: { ...state.metadata, ...meta } })),

  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setHighlightedDirector: (directorName) => set({ highlightedDirector: directorName }),
  setSortCriteria: (criteria) => set({ sortCriteria: criteria }),

  addEntity: (entityData, parentId, ownershipPct = 100) => {
    const newId = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEntity: EntityNodeData = {
      ...entityData,
      id: newId,
      directors: entityData.directors || [],
      ubosOrBeneficiaries: entityData.ubosOrBeneficiaries || [],
    };

    set((state) => {
      const nextEntities = [...state.entities, newEntity];
      let nextRels = state.relationships;
      if (parentId) {
        nextRels = [
          ...nextRels,
          {
            id: `rel-${parentId}-${newId}`,
            source: parentId,
            target: newId,
            ownershipPercentage: ownershipPct,
            shareClass: 'Ordinary Shares',
          },
        ];
      }
      return { entities: nextEntities, relationships: nextRels, selectedEntityId: newId };
    });

    return newEntity;
  },

  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  deleteEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      relationships: state.relationships.filter((r) => r.source !== id && r.target !== id),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    })),

  addDirector: (entityId, director) =>
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        const newDir: Director = {
          ...director,
          id: `dir-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`,
        };
        return { ...e, directors: [...e.directors, newDir] };
      }),
    })),

  removeDirector: (entityId, directorId) =>
    set((state) => ({
      entities: state.entities.map((e) => {
        if (e.id !== entityId) return e;
        return { ...e, directors: e.directors.filter((d) => d.id !== directorId) };
      }),
    })),

  addRelationship: (rel) =>
    set((state) => {
      // Avoid duplicate edges between same pair
      const exists = state.relationships.some((r) => r.source === rel.source && r.target === rel.target);
      if (exists) return state;
      const newRel: OwnershipEdgeData = {
        ...rel,
        id: `rel-${rel.source}-${rel.target}-${Date.now()}`,
      };
      return { relationships: [...state.relationships, newRel] };
    }),

  updateRelationship: (id, updates) =>
    set((state) => ({
      relationships: state.relationships.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    })),

  deleteRelationship: (id) =>
    set((state) => ({
      relationships: state.relationships.filter((r) => r.id !== id),
    })),

  loadStructure: (chart) =>
    set({
      metadata: { ...chart.metadata },
      entities: [...chart.entities],
      relationships: [...chart.relationships],
      selectedEntityId: null,
      highlightedDirector: null,
    }),

  resetToSample: () =>
    set({
      metadata: { ...sampleTrustStructure.metadata },
      entities: [...sampleTrustStructure.entities],
      relationships: [...sampleTrustStructure.relationships],
      selectedEntityId: null,
      highlightedDirector: null,
    }),
}));
```

- [ ] **Step 5: Run tests and verify**

Run: `npm test`  
Expected: All tests in `useStructureStore.test.ts` pass.

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/data/ src/store/
git commit -m "feat: implement trust data schema, sample structure, and zustand store"
```

---

### Task 3: Algorithmic Sibling Sorting & Dagre Hierarchy Layout Engine

**Files:**
- Create: `src/utils/layoutEngine.ts`
- Test: `src/utils/layoutEngine.test.ts`

**Interfaces:**
- Consumes: `@dagrejs/dagre`, `EntityNodeData`, `OwnershipEdgeData`, `SiblingSortCriteria`
- Produces: `calculateSortedLayout(entities, relationships, sortCriteria)` returning nodes with deterministic `(x, y)` positions and calculated heights, and formatted edges.

- [ ] **Step 1: Write failing test in `src/utils/layoutEngine.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSortedLayout, sortSiblingEntities } from './layoutEngine';
import { EntityNodeData, OwnershipEdgeData } from '../types/structure';

describe('layoutEngine', () => {
  const mockEntities: EntityNodeData[] = [
    { id: '1', name: 'Parent Trust', type: 'Trust', jurisdiction: 'Jersey', status: 'Active', directors: [] },
    { id: '2', name: 'Zeta Subsidiary', type: 'Operating Company', jurisdiction: 'Singapore', status: 'Active', directors: [] },
    { id: '3', name: 'Alpha Subsidiary', type: 'Operating Company', jurisdiction: 'Cayman Islands', status: 'Active', directors: [] },
  ];

  const mockEdges: OwnershipEdgeData[] = [
    { id: 'e1', source: '1', target: '2', ownershipPercentage: 50 },
    { id: 'e2', source: '1', target: '3', ownershipPercentage: 100 },
  ];

  it('sorts sibling entities alphabetically A-Z', () => {
    const siblings = [mockEntities[1], mockEntities[2]]; // Zeta, Alpha
    const sorted = sortSiblingEntities(siblings, mockEdges, 'alphabetical');
    expect(sorted[0].name).toBe('Alpha Subsidiary');
    expect(sorted[1].name).toBe('Zeta Subsidiary');
  });

  it('sorts sibling entities by ownership percentage descending', () => {
    const siblings = [mockEntities[1], mockEntities[2]]; // 50%, 100%
    const sorted = sortSiblingEntities(siblings, mockEdges, 'ownership');
    expect(sorted[0].id).toBe('3'); // 100%
    expect(sorted[1].id).toBe('2'); // 50%
  });

  it('calculates deterministic layout positions with Dagre', () => {
    const { nodes, edges } = calculateSortedLayout(mockEntities, mockEdges, 'alphabetical');
    expect(nodes.length).toBe(3);
    expect(edges.length).toBe(2);

    // Parent is in top rank (lower y coordinate than children)
    const parentNode = nodes.find((n) => n.id === '1');
    const childNode = nodes.find((n) => n.id === '2');
    expect(parentNode!.position.y).toBeLessThan(childNode!.position.y);

    // No NaN coordinates
    nodes.forEach((n) => {
      expect(Number.isNaN(n.position.x)).toBe(false);
      expect(Number.isNaN(n.position.y)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL with `calculateSortedLayout is not a function`.

- [ ] **Step 3: Implement `src/utils/layoutEngine.ts`**

```typescript
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import {
  EntityNodeData,
  OwnershipEdgeData,
  SiblingSortCriteria,
} from '../types/structure';

export const CARD_WIDTH = 280;
export const BASE_CARD_HEIGHT = 160;
export const DIRECTOR_ROW_HEIGHT = 24;

export function calculateCardHeight(directorCount: number): number {
  return BASE_CARD_HEIGHT + Math.max(0, directorCount) * DIRECTOR_ROW_HEIGHT;
}

export function sortSiblingEntities(
  siblings: EntityNodeData[],
  relationships: OwnershipEdgeData[],
  criteria: SiblingSortCriteria
): EntityNodeData[] {
  const result = [...siblings];

  switch (criteria) {
    case 'alphabetical':
      return result.sort((a, b) => a.name.localeCompare(b.name));

    case 'ownership': {
      // Find incoming ownership percentage
      const getPct = (id: string) => {
        const edge = relationships.find((r) => r.target === id);
        return edge?.ownershipPercentage ?? 0;
      };
      return result.sort((a, b) => getPct(b.id) - getPct(a.id));
    }

    case 'jurisdiction':
      return result.sort((a, b) => a.jurisdiction.localeCompare(b.jurisdiction));

    case 'manual':
    default:
      return result;
  }
}

export function calculateSortedLayout(
  entities: EntityNodeData[],
  relationships: OwnershipEdgeData[],
  sortCriteria: SiblingSortCriteria = 'alphabetical'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 90,
    align: 'DL',
  });

  // Group children by parent to order siblings
  const parentToChildren = new Map<string, EntityNodeData[]>();
  const entityMap = new Map<string, EntityNodeData>();
  entities.forEach((e) => entityMap.set(e.id, e));

  relationships.forEach((rel) => {
    const child = entityMap.get(rel.target);
    if (child) {
      const existing = parentToChildren.get(rel.source) || [];
      existing.push(child);
      parentToChildren.set(rel.source, existing);
    }
  });

  // Sort siblings under each parent
  parentToChildren.forEach((children, parentId) => {
    parentToChildren.set(
      parentId,
      sortSiblingEntities(children, relationships, sortCriteria)
    );
  });

  // Register nodes with dynamic dimensions
  entities.forEach((entity) => {
    const height = calculateCardHeight(entity.directors.length);
    dagreGraph.setNode(entity.id, {
      width: CARD_WIDTH,
      height,
    });
  });

  // Register sorted edges into Dagre
  const registeredEdgeKeys = new Set<string>();

  // Add edges parent by parent in sorted order
  entities.forEach((parent) => {
    const sortedChildren = parentToChildren.get(parent.id) || [];
    sortedChildren.forEach((child) => {
      dagreGraph.setEdge(parent.id, child.id);
      registeredEdgeKeys.add(`${parent.id}->${child.id}`);
    });
  });

  // Add remaining cross-links or edges
  relationships.forEach((rel) => {
    const key = `${rel.source}->${rel.target}`;
    if (!registeredEdgeKeys.has(key)) {
      dagreGraph.setEdge(rel.source, rel.target);
    }
  });

  // Run dagre layout calculation
  dagre.layout(dagreGraph);

  // Map to React Flow Nodes
  const nodes: Node[] = entities.map((entity) => {
    const nodeWithPosition = dagreGraph.node(entity.id);
    const height = calculateCardHeight(entity.directors.length);

    return {
      id: entity.id,
      type: 'entityNode',
      position: {
        x: nodeWithPosition.x - CARD_WIDTH / 2,
        y: nodeWithPosition.y - height / 2,
      },
      data: {
        ...entity,
        computedHeight: height,
      },
    };
  });

  // Map to React Flow Edges
  const edges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: 'ownershipEdge',
    data: {
      ownershipPercentage: rel.ownershipPercentage,
      shareClass: rel.shareClass,
      isCrossLink: rel.isCrossLink,
    },
  }));

  return { nodes, edges };
}
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `npm test`  
Expected: PASS all tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: implement sibling sorting and dagre hierarchy layout engine"
```

---

### Task 4: Custom Executive Entity Card & Orthogonal Edge Components

**Files:**
- Create: `src/components/nodes/EntityCardNode.tsx`
- Create: `src/components/edges/OwnershipEdge.tsx`
- Create: `src/utils/entityStyle.ts`
- Test: `src/components/nodes/EntityCardNode.test.tsx`

**Interfaces:**
- Consumes: `@xyflow/react` NodeProps, `EntityNodeData`, `useStructureStore`
- Produces: Executive presentation card node with jurisdiction flag/badge, director tags, status indicator, and orthogonal stepped edge with ownership badge.

- [ ] **Step 1: Create styling utilities in `src/utils/entityStyle.ts`**

```typescript
import { EntityType, EntityStatus } from '../types/structure';

export function getEntityTypeColor(type: EntityType): {
  border: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
} {
  switch (type) {
    case 'Trust':
      return {
        border: 'border-amber-400',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        accentBar: 'bg-amber-500',
      };
    case 'Holding Company':
      return {
        border: 'border-sky-500',
        badgeBg: 'bg-sky-100',
        badgeText: 'text-sky-800',
        accentBar: 'bg-sky-600',
      };
    case 'Operating Company':
      return {
        border: 'border-emerald-500',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        accentBar: 'bg-emerald-600',
      };
    case 'Foundation':
      return {
        border: 'border-indigo-400',
        badgeBg: 'bg-indigo-100',
        badgeText: 'text-indigo-800',
        accentBar: 'bg-indigo-600',
      };
    case 'LLC':
    case 'Partnership':
      return {
        border: 'border-purple-400',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        accentBar: 'bg-purple-600',
      };
    case 'Individual':
    default:
      return {
        border: 'border-slate-300',
        badgeBg: 'bg-slate-100',
        badgeText: 'text-slate-800',
        accentBar: 'bg-slate-500',
      };
  }
}

export function getStatusDotClass(status: EntityStatus): string {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500';
    case 'Dormant':
      return 'bg-amber-400';
    case 'In Liquidation':
      return 'bg-rose-500';
    case 'Nominee':
      return 'bg-sky-400';
    default:
      return 'bg-slate-300';
  }
}
```

- [ ] **Step 2: Create `src/components/nodes/EntityCardNode.tsx`**

```tsx
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { EntityNodeData } from '../../types/structure';
import { getEntityTypeColor, getStatusDotClass } from '../../utils/entityStyle';
import { useStructureStore } from '../../store/useStructureStore';
import { Building2, User, Landmark, ShieldCheck } from 'lucide-react';

export const EntityCardNode = memo(({ id, data, selected }: NodeProps) => {
  const entity = data as unknown as EntityNodeData;
  const colors = getEntityTypeColor(entity.type);
  const statusDot = getStatusDotClass(entity.status);

  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const highlightedDirector = useStructureStore((state) => state.highlightedDirector);
  const setHighlightedDirector = useStructureStore((state) => state.setHighlightedDirector);

  const isSelected = selected || selectedEntityId === id;
  const containsHighlightedDirector =
    highlightedDirector && entity.directors.some((d) => d.name === highlightedDirector);
  const isDimmed = highlightedDirector && !containsHighlightedDirector;

  return (
    <div
      onClick={() => setSelectedEntityId(id)}
      className={`relative w-[280px] rounded-lg bg-white shadow-md border-2 transition-all duration-150 cursor-pointer ${
        colors.border
      } ${isSelected ? 'ring-4 ring-sky-400 ring-offset-1 shadow-lg' : ''} ${
        containsHighlightedDirector ? 'ring-4 ring-amber-500 shadow-xl scale-[1.02]' : ''
      } ${isDimmed ? 'opacity-40 grayscale-[20%]' : 'opacity-100'}`}
    >
      {/* Top Handle for Parent Inflow */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />

      {/* Top Accent Strip */}
      <div className={`h-1.5 w-full rounded-t-sm ${colors.accentBar}`} />

      {/* Card Header */}
      <div className="p-3 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <span
            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${colors.badgeBg} ${colors.badgeText}`}
          >
            {entity.type}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot}`} />
            <span className="text-[11px] font-medium">{entity.status}</span>
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 text-sm leading-snug break-words">
          {entity.name}
        </h3>

        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-600 truncate max-w-[150px]">
            {entity.jurisdiction}
          </span>
          {entity.registrationNumber && (
            <span className="font-mono text-[10px] text-slate-400">
              {entity.registrationNumber}
            </span>
          )}
        </div>
      </div>

      {/* Directors Section */}
      <div className="p-3 pt-2 bg-slate-50/70 rounded-b-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Directors ({entity.directors.length})
          </span>
        </div>

        <div className="space-y-1">
          {entity.directors.length === 0 ? (
            <div className="text-[11px] italic text-slate-400">No directors recorded</div>
          ) : (
            entity.directors.map((dir) => {
              const isTargeted = highlightedDirector === dir.name;
              return (
                <div
                  key={dir.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setHighlightedDirector(isTargeted ? null : dir.name);
                  }}
                  className={`flex items-center justify-between text-xs px-2 py-1 rounded transition-colors ${
                    isTargeted
                      ? 'bg-amber-200 text-amber-900 font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                  }`}
                  title="Click to spotlight this director across all entities"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {dir.isCorporate ? (
                      <Landmark className="w-3 h-3 text-sky-600 flex-shrink-0" />
                    ) : (
                      <User className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate text-[11px]">{dir.name}</span>
                  </div>

                  {dir.isResident && (
                    <span
                      title="Resident Director"
                      className="ml-1 text-[9px] px-1 bg-emerald-100 text-emerald-700 font-bold rounded"
                    >
                      RES
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* UBO / Settlor badge if present */}
        {entity.ubosOrBeneficiaries && entity.ubosOrBeneficiaries.length > 0 && (
          <div className="mt-2 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-600 flex-shrink-0" />
            <span className="truncate font-medium">
              {entity.ubosOrBeneficiaries[0]}
              {entity.ubosOrBeneficiaries.length > 1 ? ` +${entity.ubosOrBeneficiaries.length - 1}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Handle for Child Outflow */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-slate-700 !border-2 !border-white"
      />
    </div>
  );
});
```

- [ ] **Step 3: Create `src/components/edges/OwnershipEdge.tsx`**

```tsx
import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';

export const OwnershipEdge = memo((props: EdgeProps) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const ownership = data?.ownershipPercentage as number | undefined;
  const shareClass = data?.shareClass as string | undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke: '#475569',
          strokeWidth: 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex flex-col items-center justify-center bg-white border border-slate-300 px-2 py-0.5 rounded-full shadow-sm text-[10px] font-semibold text-slate-700 hover:border-sky-500 hover:shadow transition-all cursor-default"
        >
          <span>{ownership !== undefined ? `${ownership}%` : 'Owns'}</span>
          {shareClass && (
            <span className="text-[8px] text-slate-400 -mt-0.5 font-normal max-w-[90px] truncate">
              {shareClass}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});
```

- [ ] **Step 4: Create tests in `src/components/nodes/EntityCardNode.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EntityCardNode } from './EntityCardNode';
import { ReactFlowProvider } from '@xyflow/react';

describe('EntityCardNode', () => {
  const mockNodeProps: any = {
    id: 'test-1',
    data: {
      id: 'test-1',
      name: 'Pacific Heritage Trust',
      type: 'Trust',
      jurisdiction: 'Cook Islands',
      status: 'Active',
      directors: [
        { id: 'd1', name: 'Sophia Sterling', isCorporate: false, isResident: true },
      ],
      ubosOrBeneficiaries: ['Sterling Family'],
    },
    selected: false,
  };

  it('renders entity name, jurisdiction, and type badge', () => {
    render(
      <ReactFlowProvider>
        <EntityCardNode {...mockNodeProps} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Pacific Heritage Trust')).toBeInTheDocument();
    expect(screen.getByText('Cook Islands')).toBeInTheDocument();
    expect(screen.getByText('Trust')).toBeInTheDocument();
    expect(screen.getByText('Sophia Sterling')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run tests and verify**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/utils/
git commit -m "feat: implement executive entity card node and orthogonal ownership edge"
```

---

### Task 5: Interactive Canvas Component (`StructureCanvas`) with Controls & Director Spotlight

**Files:**
- Create: `src/components/canvas/StructureCanvas.tsx`
- Test: `src/components/canvas/StructureCanvas.test.tsx`

**Interfaces:**
- Consumes: `@xyflow/react`, `useStructureStore`, `calculateSortedLayout`
- Produces: Interactive zoomable/pannable React Flow canvas registered with `EntityCardNode` and `OwnershipEdge`, responding dynamically to layout and store changes.

- [ ] **Step 1: Implement `src/components/canvas/StructureCanvas.tsx`**

```tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStructureStore } from '../../store/useStructureStore';
import { EntityCardNode } from '../nodes/EntityCardNode';
import { OwnershipEdge } from '../edges/OwnershipEdge';
import { calculateSortedLayout } from '../../utils/layoutEngine';

const nodeTypes = {
  entityNode: EntityCardNode,
};

const edgeTypes = {
  ownershipEdge: OwnershipEdge,
};

export const StructureCanvas: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const addRelationship = useStructureStore((state) => state.addRelationship);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Calculate layout on structure or sort criteria change
  const refreshLayout = useCallback(() => {
    const layout = calculateSortedLayout(entities, relationships, sortCriteria);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [entities, relationships, sortCriteria, setNodes, setEdges]);

  useEffect(() => {
    refreshLayout();
  }, [refreshLayout]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addRelationship({
          source: connection.source,
          target: connection.target,
          ownershipPercentage: 100,
          shareClass: 'Ordinary Shares',
        });
      }
    },
    [addRelationship]
  );

  const onPaneClick = useCallback(() => {
    setSelectedEntityId(null);
  }, [setSelectedEntityId]);

  return (
    <div className="relative w-full h-full bg-slate-100" id="trust-structure-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="!bg-white !border !border-slate-300 !shadow-md !rounded-lg" />
        <MiniMap
          nodeColor="#0284c7"
          maskColor="rgba(241, 245, 249, 0.7)"
          className="!border !border-slate-300 !rounded-lg !bg-white"
        />
      </ReactFlow>
    </div>
  );
};
```

- [ ] **Step 2: Test `StructureCanvas` mounting**

Create `src/components/canvas/StructureCanvas.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StructureCanvas } from './StructureCanvas';

describe('StructureCanvas', () => {
  it('mounts the canvas container cleanly', () => {
    const { container } = render(<StructureCanvas />);
    expect(container.querySelector('#trust-structure-canvas')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests and verify**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/canvas/
git commit -m "feat: implement structure canvas component with auto-layout and react-flow"
```

---

### Task 6: Sidebar Inspector: Tree Outliner, Entity Edit Form & Director Cross-Directory

**Files:**
- Create: `src/components/sidebar/SidebarInspector.tsx`
- Create: `src/components/sidebar/TreeOutlineTab.tsx`
- Create: `src/components/sidebar/EntityDetailsTab.tsx`
- Create: `src/components/sidebar/DirectorsDirectoryTab.tsx`
- Test: `src/components/sidebar/SidebarInspector.test.tsx`

**Interfaces:**
- Consumes: `useStructureStore`
- Produces: Collapsible 3-tab sidebar enabling fast tree hierarchy navigation, full entity attribute editing with director tagging, and cross-structure director auditing.

- [ ] **Step 1: Implement `TreeOutlineTab.tsx`**

```tsx
import React from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { Plus, Trash2, ChevronRight, FolderTree } from 'lucide-react';
import { EntityType } from '../../types/structure';

export const TreeOutlineTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const setSelectedEntityId = useStructureStore((state) => state.setSelectedEntityId);
  const addEntity = useStructureStore((state) => state.addEntity);
  const deleteEntity = useStructureStore((state) => state.deleteEntity);

  const handleAddChild = (parentId: string) => {
    addEntity(
      {
        name: 'New Subsidiary Entity',
        type: 'Operating Company',
        jurisdiction: 'Cayman Islands',
        status: 'Active',
        directors: [],
      },
      parentId,
      100
    );
  };

  const handleAddNewRoot = () => {
    addEntity({
      name: 'New Holding Entity',
      type: 'Holding Company',
      jurisdiction: 'BVI',
      status: 'Active',
      directors: [],
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Entities ({entities.length})
        </span>
        <button
          onClick={handleAddNewRoot}
          className="flex items-center gap-1 text-xs bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded font-medium transition"
        >
          <Plus className="w-3 h-3" /> Add Entity
        </button>
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {entities.map((entity) => {
          const isSelected = selectedEntityId === entity.id;
          const incoming = relationships.find((r) => r.target === entity.id);

          return (
            <div
              key={entity.id}
              onClick={() => setSelectedEntityId(entity.id)}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                isSelected
                  ? 'bg-sky-50 border-sky-400 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="truncate pr-2">
                <div className="font-semibold text-slate-800 truncate">{entity.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-medium text-sky-700">{entity.type}</span>
                  <span>•</span>
                  <span>{entity.jurisdiction}</span>
                  {incoming && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-700 font-bold">{incoming.ownershipPercentage}%</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  title="Add Subsidiary to this entity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddChild(entity.id);
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-sky-600"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  title="Delete Entity"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${entity.name}?`)) deleteEntity(entity.id);
                  }}
                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Implement `EntityDetailsTab.tsx`**

```tsx
import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { EntityType, EntityStatus } from '../../types/structure';
import { Plus, Trash2, UserPlus, Building, Shield } from 'lucide-react';

const ENTITY_TYPES: EntityType[] = [
  'Trust',
  'Holding Company',
  'Operating Company',
  'LLC',
  'Foundation',
  'Partnership',
  'Individual',
];

const ENTITY_STATUSES: EntityStatus[] = ['Active', 'Dormant', 'In Liquidation', 'Nominee'];

const COMMON_JURISDICTIONS = [
  'BVI',
  'Cayman Islands',
  'Channel Islands (Jersey)',
  'Channel Islands (Guernsey)',
  'Singapore',
  'Hong Kong',
  'Delaware, USA',
  'United Kingdom',
  'Switzerland',
  'Cook Islands',
  'Marshall Islands',
  'Liechtenstein',
];

export const EntityDetailsTab: React.FC = () => {
  const selectedEntityId = useStructureStore((state) => state.selectedEntityId);
  const entities = useStructureStore((state) => state.entities);
  const updateEntity = useStructureStore((state) => state.updateEntity);
  const addDirector = useStructureStore((state) => state.addDirector);
  const removeDirector = useStructureStore((state) => state.removeDirector);

  const [newDirectorName, setNewDirectorName] = useState('');
  const [isCorporate, setIsCorporate] = useState(false);
  const [isResident, setIsResident] = useState(false);

  const entity = entities.find((e) => e.id === selectedEntityId);

  if (!entity) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Select an entity from the canvas or outliner to edit its details and directors.
      </div>
    );
  }

  const handleAddDirectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirectorName.trim()) return;
    addDirector(entity.id, {
      name: newDirectorName.trim(),
      isCorporate,
      isResident,
    });
    setNewDirectorName('');
    setIsCorporate(false);
    setIsResident(false);
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 text-xs">
      {/* Name */}
      <div>
        <label className="block font-medium text-slate-700 mb-1">Entity Name</label>
        <input
          type="text"
          value={entity.name}
          onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 font-medium"
        />
      </div>

      {/* Type & Status */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Entity Type</label>
          <select
            value={entity.type}
            onChange={(e) => updateEntity(entity.id, { type: e.target.value as EntityType })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-700 mb-1">Status</label>
          <select
            value={entity.status}
            onChange={(e) => updateEntity(entity.id, { status: e.target.value as EntityStatus })}
            className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white"
          >
            {ENTITY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jurisdiction */}
      <div>
        <label className="block font-medium text-slate-700 mb-1">Jurisdiction</label>
        <input
          type="text"
          list="jurisdictions-list"
          value={entity.jurisdiction}
          onChange={(e) => updateEntity(entity.id, { jurisdiction: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
        />
        <datalist id="jurisdictions-list">
          {COMMON_JURISDICTIONS.map((j) => (
            <option key={j} value={j} />
          ))}
        </datalist>
      </div>

      {/* Registration & Tax Number */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-medium text-slate-700 mb-1">Registration / Reg No</label>
          <input
            type="text"
            value={entity.registrationNumber || ''}
            onChange={(e) => updateEntity(entity.id, { registrationNumber: e.target.value })}
            placeholder="e.g. BVI-BC-123"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
          />
        </div>
        <div>
          <label className="block font-medium text-slate-700 mb-1">Tax ID / TIN</label>
          <input
            type="text"
            value={entity.taxId || ''}
            onChange={(e) => updateEntity(entity.id, { taxId: e.target.value })}
            placeholder="Optional"
            className="w-full px-2 py-1.5 border border-slate-300 rounded font-mono text-[11px]"
          />
        </div>
      </div>

      {/* Directors Manager */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-semibold text-slate-800 mb-2">
          Board of Directors ({entity.directors.length})
        </label>

        <div className="space-y-1.5 mb-3">
          {entity.directors.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px]"
            >
              <div className="truncate">
                <span className="font-medium text-slate-800">{d.name}</span>
                <span className="ml-1 text-slate-400">
                  ({d.isCorporate ? 'Corporate' : 'Individual'}
                  {d.isResident ? ', Resident' : ''})
                </span>
              </div>
              <button
                onClick={() => removeDirector(entity.id, d.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Director Form */}
        <form onSubmit={handleAddDirectorSubmit} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-2">
          <input
            type="text"
            placeholder="New Director or Trustee Name"
            value={newDirectorName}
            onChange={(e) => setNewDirectorName(e.target.value)}
            className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
          />
          <div className="flex items-center gap-3 text-[11px] text-slate-600">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isCorporate}
                onChange={(e) => setIsCorporate(e.target.checked)}
              />
              Corporate
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isResident}
                onChange={(e) => setIsResident(e.target.checked)}
              />
              Resident Director
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-1 bg-slate-800 hover:bg-slate-900 text-white rounded font-medium text-xs flex items-center justify-center gap-1"
          >
            <UserPlus className="w-3 h-3" /> Add to Board
          </button>
        </form>
      </div>

      {/* Notes */}
      <div className="pt-2 border-t border-slate-200">
        <label className="block font-medium text-slate-700 mb-1">Notes / Legal Specifics</label>
        <textarea
          rows={2}
          value={entity.notes || ''}
          onChange={(e) => updateEntity(entity.id, { notes: e.target.value })}
          placeholder="e.g. Settlor, protector, or governing trust deed dates"
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-[11px]"
        />
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Implement `DirectorsDirectoryTab.tsx`**

```tsx
import React, { useMemo } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { User, Landmark, Search } from 'lucide-react';

export const DirectorsDirectoryTab: React.FC = () => {
  const entities = useStructureStore((state) => state.entities);
  const highlightedDirector = useStructureStore((state) => state.highlightedDirector);
  const setHighlightedDirector = useStructureStore((state) => state.setHighlightedDirector);

  const directorsSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        isCorporate: boolean;
        entities: { id: string; name: string }[];
      }
    >();

    entities.forEach((entity) => {
      entity.directors.forEach((dir) => {
        const existing = map.get(dir.name) || {
          name: dir.name,
          isCorporate: dir.isCorporate,
          entities: [],
        };
        existing.entities.push({ id: entity.id, name: entity.name });
        map.set(dir.name, existing);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  return (
    <div className="space-y-3 text-xs">
      <div className="text-slate-500 text-[11px]">
        Click any director below to highlight and track all their directorships across the chart.
      </div>

      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
        {directorsSummary.length === 0 ? (
          <div className="text-center text-slate-400 py-4 italic">No directors recorded.</div>
        ) : (
          directorsSummary.map((item) => {
            const isHighlighted = highlightedDirector === item.name;
            return (
              <div
                key={item.name}
                onClick={() => setHighlightedDirector(isHighlighted ? null : item.name)}
                className={`p-2 rounded-lg border cursor-pointer transition ${
                  isHighlighted
                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    {item.isCorporate ? (
                      <Landmark className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                    {item.entities.length}
                  </span>
                </div>

                <div className="mt-1 text-[10px] text-slate-500 truncate">
                  Boards: {item.entities.map((e) => e.name).join(', ')}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Combine tabs in `src/components/sidebar/SidebarInspector.tsx`**

```tsx
import React, { useState } from 'react';
import { TreeOutlineTab } from './TreeOutlineTab';
import { EntityDetailsTab } from './EntityDetailsTab';
import { DirectorsDirectoryTab } from './DirectorsDirectoryTab';
import { FolderTree, FileEdit, Users, ChevronLeft, ChevronRight } from 'lucide-react';

type Tab = 'tree' | 'details' | 'directors';

export const SidebarInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tree');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-16 left-2 z-10 p-2 bg-white rounded-lg shadow-md border border-slate-200 text-slate-600 hover:text-slate-900"
        title="Open Sidebar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-[340px] h-full bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-2 pt-2 bg-slate-50">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('tree')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'tree'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" /> Tree
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'details'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" /> Details
          </button>
          <button
            onClick={() => setActiveTab('directors')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-md border-b-2 transition ${
              activeTab === 'directors'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Directors
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="p-3 flex-1 overflow-hidden">
        {activeTab === 'tree' && <TreeOutlineTab />}
        {activeTab === 'details' && <EntityDetailsTab />}
        {activeTab === 'directors' && <DirectorsDirectoryTab />}
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Test SidebarInspector rendering**

Create `src/components/sidebar/SidebarInspector.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarInspector } from './SidebarInspector';

describe('SidebarInspector', () => {
  it('renders tabs: Tree, Details, Directors', () => {
    render(<SidebarInspector />);
    expect(screen.getByText(/Tree/i)).toBeInTheDocument();
    expect(screen.getByText(/Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Directors/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests and verify**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/sidebar/
git commit -m "feat: implement sidebar inspector with tree outline, entity editor, and director cross-directory"
```

---

### Task 7: Top Action Bar (`AppHeader`) & Store Layout Synchronization

**Files:**
- Create: `src/components/header/AppHeader.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/header/AppHeader.test.tsx`

**Interfaces:**
- Consumes: `useStructureStore`, `SiblingSortCriteria`
- Produces: Header bar with editable matter title, sibling sorting dropdown (A-Z, Ownership %, Jurisdiction), "Auto-Tidy" button, and export trigger.

- [ ] **Step 1: Implement `src/components/header/AppHeader.tsx`**

```tsx
import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { SiblingSortCriteria } from '../../types/structure';
import {
  Sparkles,
  ArrowDownAZ,
  Percent,
  Globe2,
  FileDown,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenExport: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenExport }) => {
  const metadata = useStructureStore((state) => state.metadata);
  const setMetadata = useStructureStore((state) => state.setMetadata);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const setSortCriteria = useStructureStore((state) => state.setSortCriteria);
  const resetToSample = useStructureStore((state) => state.resetToSample);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0 z-20">
      {/* Title & Reference */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-black text-white text-sm shadow">
          TM
        </div>
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={metadata.chartTitle}
              onBlur={() => setIsEditingTitle(false)}
              onChange={(e) => setMetadata({ chartTitle: e.target.value })}
              className="bg-slate-800 text-white font-bold text-sm px-2 py-0.5 rounded border border-sky-500 focus:outline-none"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit structure title"
              className="font-bold text-sm text-slate-100 hover:text-sky-300 cursor-pointer flex items-center gap-2"
            >
              {metadata.chartTitle}
              <span className="text-[10px] text-slate-400 font-normal">
                ({metadata.clientReference || 'Ref: Trust'})
              </span>
            </h1>
          )}
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Effective: {metadata.effectiveDate}</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">Confidential Fiduciary Document</span>
          </div>
        </div>
      </div>

      {/* Sorting Controls & Actions */}
      <div className="flex items-center gap-2">
        {/* Sibling Sort Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 text-xs">
          <span className="text-slate-400 font-medium">Sort Siblings:</span>
          <select
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value as SiblingSortCriteria)}
            className="bg-transparent text-sky-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="alphabetical" className="bg-slate-800 text-white">
              Alphabetical (A-Z)
            </option>
            <option value="ownership" className="bg-slate-800 text-white">
              Ownership % (High → Low)
            </option>
            <option value="jurisdiction" className="bg-slate-800 text-white">
              Jurisdiction Group
            </option>
            <option value="manual" className="bg-slate-800 text-white">
              Manual Ordering
            </option>
          </select>
        </div>

        {/* Auto-Tidy Layout Trigger */}
        <button
          onClick={() => {
            // Re-trigger layout engine
            useStructureStore.setState({ sortCriteria: sortCriteria });
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-md shadow transition"
          title="Recalculate neat top-down layout"
        >
          <Sparkles className="w-3.5 h-3.5" /> Auto-Tidy
        </button>

        {/* Reset Sample */}
        <button
          onClick={() => {
            if (confirm('Reset chart to Aurelius Dynasty Trust sample template?')) {
              resetToSample();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition"
          title="Reset to sample template"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>

        {/* Export Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md shadow transition"
        >
          <FileDown className="w-3.5 h-3.5" /> Export Chart
        </button>
      </div>
    </header>
  );
};
```

- [ ] **Step 2: Update `src/App.tsx` to integrate Header, Sidebar, and Canvas**

```tsx
import React, { useState } from 'react';
import { AppHeader } from './components/header/AppHeader';
import { SidebarInspector } from './components/sidebar/SidebarInspector';
import { StructureCanvas } from './components/canvas/StructureCanvas';
import { ExportModal } from './components/export/ExportModal';

export default function App() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
      <AppHeader onOpenExport={() => setIsExportOpen(true)} />
      <div className="flex-1 flex overflow-hidden relative">
        <SidebarInspector />
        <main className="flex-1 h-full relative">
          <StructureCanvas />
        </main>
      </div>
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 3: Run tests and verify**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/header/ src/App.tsx
git commit -m "feat: implement header action bar with sibling sorting and layout triggers"
```

---

### Task 8: Export Service (High-Res PNG, SVG & Print-Ready PDF) and File Backup

**Files:**
- Create: `src/utils/exportService.ts`
- Create: `src/components/export/ExportModal.tsx`
- Test: `src/utils/exportService.test.ts`

**Interfaces:**
- Consumes: `html-to-image`, `jspdf`, `TrustStructureChart`
- Produces: Vector SVG, high-DPI 2x PNG, and formatted A4 Landscape PDF with fiduciary headers and footers; plus JSON file import/export.

- [ ] **Step 1: Write test for export utility in `src/utils/exportService.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { downloadJsonBackup, parseJsonBackup } from './exportService';
import { sampleTrustStructure } from '../data/sampleStructure';

describe('exportService', () => {
  it('parses and validates valid structure json', () => {
    const jsonString = JSON.stringify(sampleTrustStructure);
    const parsed = parseJsonBackup(jsonString);
    expect(parsed).not.toBeNull();
    expect(parsed?.entities.length).toBe(5);
  });

  it('rejects malformed json gracefully', () => {
    const malformed = '{ invalid: true }';
    const parsed = parseJsonBackup(malformed);
    expect(parsed).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `src/utils/exportService.ts`**

```typescript
import { toPng, toSvg } from 'html-to-image';
import jsPDF from 'jspdf';
import { ChartMetadata, TrustStructureChart } from '../types/structure';

export function parseJsonBackup(jsonString: string): TrustStructureChart | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.entities) && Array.isArray(data.relationships)) {
      return data as TrustStructureChart;
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadJsonBackup(chart: TrustStructureChart) {
  const blob = new Blob([JSON.stringify(chart, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${chart.metadata.chartTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Structure.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportToImage(
  elementId: string,
  format: 'png' | 'svg',
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  // Target the React Flow viewport
  const viewport = element.querySelector('.react-flow__viewport') as HTMLElement;
  const target = viewport || element;

  let dataUrl: string;
  if (format === 'svg') {
    dataUrl = await toSvg(target, { backgroundColor: '#ffffff' });
  } else {
    dataUrl = await toPng(target, {
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
    });
  }

  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataUrl;
  link.click();
}

export async function exportToPdf(
  elementId: string,
  metadata: ChartMetadata
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const viewport = element.querySelector('.react-flow__viewport') as HTMLElement;
  const target = viewport || element;

  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  // Create A4 Landscape PDF (297 x 210 mm)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Header Banner
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42); // slate-900
  pdf.text(metadata.chartTitle, 15, 14);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139); // slate-500
  pdf.text(
    `Matter Ref: ${metadata.clientReference || 'N/A'}  |  Effective Date: ${metadata.effectiveDate}`,
    15,
    19
  );

  // Line separator
  pdf.setDrawColor(226, 232, 240);
  pdf.line(15, 22, pageWidth - 15, 22);

  // Embed Canvas Image scaled to page
  const imgProps = pdf.getImageProperties(dataUrl);
  const availWidth = pageWidth - 30;
  const availHeight = pageHeight - 40;
  const scale = Math.min(availWidth / imgProps.width, availHeight / imgProps.height);
  const imgWidth = imgProps.width * scale;
  const imgHeight = imgProps.height * scale;
  const posX = (pageWidth - imgWidth) / 2;
  const posY = 26 + (availHeight - imgHeight) / 2;

  pdf.addImage(dataUrl, 'PNG', posX, posY, imgWidth, imgHeight);

  // Footer Confidentiality Notice
  pdf.setFontSize(8);
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.text(
    metadata.confidentialityNotice || 'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  pdf.save(`${metadata.chartTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Structure.pdf`);
}
```

- [ ] **Step 3: Implement `src/components/export/ExportModal.tsx`**

```tsx
import React, { useRef, useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import {
  exportToImage,
  exportToPdf,
  downloadJsonBackup,
  parseJsonBackup,
} from '../../utils/exportService';
import { FileDown, Image, FileText, Upload, Check, X } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const metadata = useStructureStore((state) => state.metadata);
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const loadStructure = useStructureStore((state) => state.loadStructure);

  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPng = async () => {
    setIsExporting(true);
    try {
      await exportToImage('trust-structure-canvas', 'png', metadata.chartTitle);
      setSuccessMsg('High-Res PNG downloaded successfully.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSvg = async () => {
    setIsExporting(true);
    try {
      await exportToImage('trust-structure-canvas', 'svg', metadata.chartTitle);
      setSuccessMsg('Vector SVG downloaded successfully.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportToPdf('trust-structure-canvas', metadata);
      setSuccessMsg('A4 Landscape PDF generated successfully.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadBackup = () => {
    downloadJsonBackup({ metadata, entities, relationships });
    setSuccessMsg('Structure backup (.json) saved.');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const parsed = parseJsonBackup(content);
      if (parsed) {
        loadStructure(parsed);
        setSuccessMsg(`Loaded ${parsed.entities.length} entities from backup.`);
      } else {
        alert('Invalid or corrupted structure file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[480px] p-6 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileDown className="w-5 h-5 text-sky-600" /> Export & Backup Structure Chart
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMsg && (
          <div className="my-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-rose-100 text-rose-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">Print-Ready PDF (A4 Landscape)</div>
                <div className="text-[11px] text-slate-500">Includes trust header, date, and confidentiality notice</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">Download</span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-sky-100 text-sky-700">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">High-Resolution PNG (2.5x DPI)</div>
                <div className="text-[11px] text-slate-500">Crisp raster image for PowerPoint and Word decks</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">Download</span>
          </button>

          <button
            onClick={handleExportSvg}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-100 text-amber-700">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">Vector SVG</div>
                <div className="text-[11px] text-slate-500">Infinite scaling without quality loss</div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">Download</span>
          </button>
        </div>

        {/* Local File Backup & Restore */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2">Local File Backup & Restore</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadBackup}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <FileDown className="w-3.5 h-3.5" /> Save JSON File
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" /> Load JSON File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleUploadBackup}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run tests and verify**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/exportService.ts src/components/export/
git commit -m "feat: implement high-res png, svg, pdf export and json backup services"
```

---

### Task 9: End-to-End Build Verification & Final Polish

**Files:**
- Test: Full build and test suite execution

- [ ] **Step 1: Run comprehensive tests**

Run: `npm test`  
Expected: All tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`  
Expected: Clean build in `dist/` with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "chore: verify tests and production build"
```
