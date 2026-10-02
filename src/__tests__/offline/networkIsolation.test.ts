import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStructureStore } from '../../store/useStructureStore';
import { calculateSortedLayout } from '../../utils/layoutEngine';
import { generateExcelTemplate, parseExcelWorkbook } from '../../utils/excelParser';
import {
  downloadJsonBackup,
  downloadExcelStructure,
  parseJsonBackup,
  exportToImage,
  exportToPdf,
  exportToPptx,
} from '../../utils/exportService';
import { sampleTrustStructure } from '../../data/sampleStructure';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpngdata'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;base64,mocksvgdata'),
}));

// Mock jsPDF
const { MockJsPDF } = vi.hoisted(() => {
  class MockJsPDF {
    save = vi.fn();
    setFont = vi.fn();
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setFillColor = vi.fn();
    text = vi.fn();
    line = vi.fn();
    rect = vi.fn();
    roundedRect = vi.fn();
    addImage = vi.fn();
    splitTextToSize = vi.fn((t: string) => [t]);
    internal = {
      pageSize: {
        getWidth: vi.fn(() => 297),
        getHeight: vi.fn(() => 210),
      },
    };
    getImageProperties = vi.fn().mockReturnValue({ width: 1000, height: 600 });
  }
  return { MockJsPDF };
});

vi.mock('jspdf', () => ({
  default: MockJsPDF,
  jsPDF: MockJsPDF,
}));

// Mock pptxgenjs
const { MockPptxGenJS } = vi.hoisted(() => {
  class MockPptxGenJS {
    addSlide = vi.fn(() => ({
      addText: vi.fn(),
      addShape: vi.fn(),
      addImage: vi.fn(),
    }));
    writeFile = vi.fn().mockResolvedValue('Structure.pptx');
    ShapeType = { rect: 'rect', roundRect: 'roundRect' };
  }
  return { MockPptxGenJS };
});

vi.mock('pptxgenjs', () => ({
  default: MockPptxGenJS,
}));

describe('Offline Network Isolation Test Suite', () => {
  const networkCalls: Array<{ type: string; target: any }> = [];

  let originalFetch: typeof globalThis.fetch;
  let originalXhr: typeof globalThis.XMLHttpRequest;
  let originalWebSocket: typeof globalThis.WebSocket;
  let originalSendBeacon: typeof navigator.sendBeacon;

  beforeEach(() => {
    networkCalls.length = 0;

    // Save originals
    originalFetch = globalThis.fetch;
    originalXhr = globalThis.XMLHttpRequest;
    originalWebSocket = globalThis.WebSocket;
    originalSendBeacon = navigator.sendBeacon;

    // Intercept fetch
    globalThis.fetch = vi.fn((input: any) => {
      networkCalls.push({ type: 'fetch', target: input });
      return Promise.reject(new Error('Network access denied in offline isolation'));
    }) as any;

    // Intercept XMLHttpRequest
    class SpyXMLHttpRequest {
      open = vi.fn((_method: string, url: string) => {
        networkCalls.push({ type: 'xhr', target: url });
      });
      send = vi.fn();
      setRequestHeader = vi.fn();
    }
    (globalThis as any).XMLHttpRequest = SpyXMLHttpRequest;

    // Intercept WebSocket
    class SpyWebSocket {
      constructor(url: string) {
        networkCalls.push({ type: 'websocket', target: url });
      }
    }
    (globalThis as any).WebSocket = SpyWebSocket;

    // Intercept sendBeacon
    navigator.sendBeacon = vi.fn((url: any) => {
      networkCalls.push({ type: 'beacon', target: url });
      return false;
    });

    // Reset URL.createObjectURL and URL.revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();

    // Reset store state
    useStructureStore.getState().resetToSample();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).XMLHttpRequest = originalXhr;
    (globalThis as any).WebSocket = originalWebSocket;
    navigator.sendBeacon = originalSendBeacon;
    vi.restoreAllMocks();
  });

  it('guarantees zero network calls during structure store entity and relationship mutations', () => {
    const store = useStructureStore.getState();

    // Add entity
    store.addEntity({
      name: 'Offline Holdings Ltd',
      type: 'Holding Company',
      jurisdiction: 'Cayman Islands',
      status: 'Active',
      directors: [{ name: 'Director A', isCorporate: false, isResident: true }],
      ubos: ['Beneficiary X'],
    });

    // Update metadata
    store.setMetadata({ chartTitle: 'Secure Offline Structure' });

    // Update entity
    const added = useStructureStore.getState().entities.find((e) => e.name === 'Offline Holdings Ltd');
    expect(added).toBeDefined();
    if (added) {
      store.updateEntity(added.id, { notes: 'Completely offline' });
      store.deleteEntity(added.id);
    }

    expect(networkCalls).toHaveLength(0);
  });

  it('guarantees zero network calls during Dagre layout calculation', () => {
    const { entities, relationships } = useStructureStore.getState();

    const layouted = calculateSortedLayout(entities, relationships, 'alphabetical');
    expect(layouted.nodes.length).toBeGreaterThan(0);
    expect(layouted.edges.length).toBeGreaterThan(0);

    const layoutedByJurisdiction = calculateSortedLayout(entities, relationships, 'jurisdiction');
    expect(layoutedByJurisdiction.nodes.length).toBeGreaterThan(0);

    expect(networkCalls).toHaveLength(0);
  });

  it('guarantees zero network calls during Excel template generation and spreadsheet parsing', () => {
    const templateBytes = generateExcelTemplate();
    expect(templateBytes.length).toBeGreaterThan(0);

    const parseResult = parseExcelWorkbook(templateBytes.buffer as ArrayBuffer);
    expect(parseResult.chart.entities.length).toBeGreaterThan(0);

    expect(networkCalls).toHaveLength(0);
  });

  it('guarantees zero network calls during all document and image export operations', async () => {
    // 1. JSON Backup
    downloadJsonBackup(sampleTrustStructure);
    const parsedBackup = parseJsonBackup(JSON.stringify(sampleTrustStructure));
    expect(parsedBackup.metadata.chartTitle).toBe(sampleTrustStructure.metadata.chartTitle);

    // 2. Excel Structure
    downloadExcelStructure(sampleTrustStructure);

    // Setup DOM element for viewport exports
    const containerId = 'test-flow-container';
    const mockContainer = document.createElement('div');
    mockContainer.id = containerId;
    const viewport = document.createElement('div');
    viewport.className = 'react-flow__viewport';
    mockContainer.appendChild(viewport);
    document.body.appendChild(mockContainer);

    // 3. Image Export (PNG)
    await exportToImage(containerId, 'png', 'test-export');

    // 4. PDF Export
    await exportToPdf(containerId, sampleTrustStructure.metadata);

    // 5. PPTX Export
    await exportToPptx(containerId, sampleTrustStructure.metadata);

    document.body.removeChild(mockContainer);

    expect(networkCalls).toHaveLength(0);
  });

  it('guarantees zero network calls across complete application lifecycle', async () => {
    const store = useStructureStore.getState();

    // 1. Generate & parse Excel import
    const template = generateExcelTemplate();
    const parsed = parseExcelWorkbook(template.buffer as ArrayBuffer);
    store.loadStructure(parsed.chart);

    // 2. Layout computation
    const { entities, relationships } = useStructureStore.getState();
    const { nodes: layoutedNodes } = calculateSortedLayout(entities, relationships, 'alphabetical');
    expect(layoutedNodes.length).toBeGreaterThan(0);

    // 3. User adds entity
    store.addEntity({
      name: 'Airgapped SPV',
      type: 'LLC',
      jurisdiction: 'Delaware',
      status: 'Active',
      directors: [],
      ubos: [],
    });

    // 4. Exports
    const currentChart = {
      metadata: useStructureStore.getState().metadata,
      entities: useStructureStore.getState().entities,
      relationships: useStructureStore.getState().relationships,
    };
    downloadJsonBackup(currentChart);
    downloadExcelStructure(currentChart);

    // Strict zero-egress assertion
    expect(networkCalls).toEqual([]);
    expect(networkCalls).toHaveLength(0);
  });
});
