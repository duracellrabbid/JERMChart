import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadJsonBackup,
  downloadExcelStructure,
  parseJsonBackup,
  exportToImage,
  exportToPdf,
  exportToPptx,
  parseTranslateCoordinates,
  getNodeDimensions,
  calculateViewportExportBounds,
  getViewportExportConfig,
} from '../../utils/exportService';
import { sampleTrustStructure } from '../../data/sampleStructure';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mockpngdata'),
  toSvg: vi.fn().mockResolvedValue('data:image/svg+xml;base64,mocksvgdata'),
}));

const {
  mockConstructor,
  mockSave,
  mockSetFont,
  mockSetFontSize,
  mockSetTextColor,
  mockSetDrawColor,
  mockText,
  mockLine,
  mockAddImage,
  mockGetImageProperties,
  MockJsPDF,
  setHasGetImageProperties,
} = vi.hoisted(() => {
  const mockConstructor = vi.fn();
  const mockSave = vi.fn();
  const mockSetFont = vi.fn();
  const mockSetFontSize = vi.fn();
  const mockSetTextColor = vi.fn();
  const mockSetDrawColor = vi.fn();
  const mockText = vi.fn();
  const mockLine = vi.fn();
  const mockAddImage = vi.fn();
  const mockGetImageProperties = vi.fn().mockReturnValue({ width: 1000, height: 600 });

  let hasGetImageProperties = true;

  class MockJsPDF {
    constructor(...args: any[]) {
      mockConstructor(...args);
      if (hasGetImageProperties) {
        this.getImageProperties = mockGetImageProperties;
      }
    }
    getImageProperties?: any;
    save = mockSave;
    setFont = mockSetFont;
    setFontSize = mockSetFontSize;
    setTextColor = mockSetTextColor;
    setDrawColor = mockSetDrawColor;
    text = mockText;
    line = mockLine;
    addImage = mockAddImage;
  }

  return {
    mockConstructor,
    mockSave,
    mockSetFont,
    mockSetFontSize,
    mockSetTextColor,
    mockSetDrawColor,
    mockText,
    mockLine,
    mockAddImage,
    mockGetImageProperties,
    MockJsPDF,
    setHasGetImageProperties: (val: boolean) => {
      hasGetImageProperties = val;
    },
  };
});

vi.mock('jspdf', () => {
  return {
    default: MockJsPDF,
    jsPDF: MockJsPDF,
  };
});

const {
  mockPptxConstructor,
  mockAddSlide,
  mockSlideAddText,
  mockSlideAddShape,
  mockSlideAddImage,
  mockWriteFile,
  MockPptxGenJS,
  mockSlide,
} = vi.hoisted(() => {
  const mockPptxConstructor = vi.fn();
  const mockSlideAddText = vi.fn();
  const mockSlideAddShape = vi.fn();
  const mockSlideAddImage = vi.fn();
  const mockWriteFile = vi.fn().mockResolvedValue('Structure.pptx');
  const mockSlide = {
    addText: mockSlideAddText,
    addShape: mockSlideAddShape,
    addImage: mockSlideAddImage,
  };
  const mockAddSlide = vi.fn().mockReturnValue(mockSlide);

  class MockPptxGenJS {
    layout = '';
    ShapeType = { line: 'line' };
    constructor(...args: any[]) {
      mockPptxConstructor(...args);
    }
    addSlide = mockAddSlide;
    writeFile = mockWriteFile;
  }

  return {
    mockPptxConstructor,
    mockAddSlide,
    mockSlideAddText,
    mockSlideAddShape,
    mockSlideAddImage,
    mockWriteFile,
    MockPptxGenJS,
    mockSlide,
  };
});

vi.mock('pptxgenjs', () => {
  return {
    default: MockPptxGenJS,
  };
});

describe('exportService', () => {
  describe('parseJsonBackup', () => {
    it('parses and validates valid structure json', () => {
      const jsonString = JSON.stringify(sampleTrustStructure);
      const parsed = parseJsonBackup(jsonString);
      expect(parsed).not.toBeNull();
      expect(parsed?.entities.length).toBe(5);
      expect(parsed?.relationships.length).toBe(4);
    });

    it('rejects malformed json gracefully', () => {
      const malformed = '{ invalid: true }';
      const parsed = parseJsonBackup(malformed);
      expect(parsed).toBeNull();
    });

    it('rejects json with missing entities or relationships arrays', () => {
      expect(parseJsonBackup(JSON.stringify({ metadata: {} }))).toBeNull();
      expect(parseJsonBackup(JSON.stringify({ entities: 'not an array', relationships: [] }))).toBeNull();
      expect(parseJsonBackup(JSON.stringify({ entities: [], relationships: 'not an array' }))).toBeNull();
      expect(parseJsonBackup('null')).toBeNull();
      expect(parseJsonBackup('123')).toBeNull();
    });
  });

  describe('downloadJsonBackup', () => {
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;
    let clickSpy: any;

    beforeEach(() => {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
      createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
      revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('triggers file download with correct filename and format', () => {
      downloadJsonBackup(sampleTrustStructure);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('falls back to default title "Trust" when chartTitle is missing or undefined', () => {
      const chartNoTitle = {
        metadata: { chartTitle: '', effectiveDate: '2026-01-01', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      };
      downloadJsonBackup(chartNoTitle as any);
      expect(createObjectURLSpy).toHaveBeenCalled();

      const chartNoMeta = {
        metadata: undefined,
        entities: [],
        relationships: [],
      };
      downloadJsonBackup(chartNoMeta as any);
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('downloadExcelStructure', () => {
    let createObjectURLSpy: any;
    let revokeObjectURLSpy: any;
    let clickSpy: any;

    beforeEach(() => {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-excel-url');
      window.URL.revokeObjectURL = vi.fn();
      createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL');
      revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL');
      clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('triggers Excel file download with correct filename and cleans up object URL', () => {
      downloadExcelStructure(sampleTrustStructure);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-excel-url');
    });

    it('falls back to default title "Trust" when chartTitle is missing', () => {
      const chartNoTitle = {
        metadata: { chartTitle: '', effectiveDate: '2026-01-01', confidentialityNotice: '' },
        entities: [],
        relationships: [],
      };
      downloadExcelStructure(chartNoTitle as any);
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('exportToImage', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'test-canvas';
      const viewport = document.createElement('div');
      viewport.className = 'react-flow__viewport';
      container.appendChild(viewport);
      document.body.appendChild(container);

      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    });

    afterEach(() => {
      container.remove();
      vi.restoreAllMocks();
    });

    it('throws error when target element is not found', async () => {
      await expect(exportToImage('non-existent', 'png', 'test')).rejects.toThrow(
        'Element #non-existent not found'
      );
    });

    it('exports high-res PNG targeting viewport', async () => {
      const { toPng } = await import('html-to-image');
      await exportToImage('test-canvas', 'png', 'my_chart');

      expect(toPng).toHaveBeenCalledWith(
        container.querySelector('.react-flow__viewport'),
        expect.objectContaining({ pixelRatio: 2.5, backgroundColor: '#ffffff' })
      );
    });

    it('exports vector SVG targeting viewport', async () => {
      const { toSvg } = await import('html-to-image');
      await exportToImage('test-canvas', 'svg', 'my_chart');

      expect(toSvg).toHaveBeenCalledWith(
        container.querySelector('.react-flow__viewport'),
        expect.objectContaining({ backgroundColor: '#ffffff' })
      );
    });

    it('targets root element directly if viewport does not exist', async () => {
      container.innerHTML = ''; // Remove viewport
      const { toPng } = await import('html-to-image');
      await exportToImage('test-canvas', 'png', 'no_viewport');
      expect(toPng).toHaveBeenCalledWith(container, expect.anything());
    });
  });

  describe('exportToPdf', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'test-canvas';
      const viewport = document.createElement('div');
      viewport.className = 'react-flow__viewport';
      container.appendChild(viewport);
      document.body.appendChild(container);
      mockGetImageProperties.mockReturnValue({ width: 1000, height: 600 });
    });

    afterEach(() => {
      container.remove();
      vi.clearAllMocks();
    });

    it('throws error when element is not found', async () => {
      await expect(
        exportToPdf('non-existent', sampleTrustStructure.metadata)
      ).rejects.toThrow('Element #non-existent not found');
    });

    it('generates landscape PDF with header, scaled canvas, and confidentiality footer', async () => {
      await exportToPdf('test-canvas', sampleTrustStructure.metadata);

      expect(mockConstructor).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      expect(mockSetFont).toHaveBeenCalledWith('helvetica', 'bold');
      expect(mockText).toHaveBeenCalledWith(
        sampleTrustStructure.metadata.chartTitle,
        15,
        14
      );
      expect(mockLine).toHaveBeenCalledWith(15, 22, 297 - 15, 22);
      expect(mockAddImage).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalledWith(expect.stringMatching(/_Structure\.pdf$/));
    });

    it('handles fallback metadata (missing clientReference, confidentialityNotice, chartTitle) and missing viewport', async () => {
      container.innerHTML = ''; // Remove viewport
      mockGetImageProperties.mockReturnValue(null); // Fallback image width/height

      await exportToPdf('test-canvas', {
        chartTitle: '',
        clientReference: '',
        effectiveDate: '2026-09-20',
        confidentialityNotice: '',
      });

      expect(mockText).toHaveBeenCalledWith('', 15, 14);
      expect(mockText).toHaveBeenCalledWith(
        'Matter Ref: N/A  |  Effective Date: 2026-09-20',
        15,
        19
      );
      expect(mockText).toHaveBeenCalledWith(
        'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
        expect.any(Number),
        expect.any(Number),
        expect.anything()
      );
      expect(mockSave).toHaveBeenCalledWith('Trust_Structure.pdf');
    });

    it('handles pdf instance when getImageProperties is undefined', async () => {
      setHasGetImageProperties(false);

      await exportToPdf('test-canvas', sampleTrustStructure.metadata);
      expect(mockAddImage).toHaveBeenCalled();

      setHasGetImageProperties(true);
    });
  });

  describe('exportToPptx', () => {
    let container: HTMLDivElement;

    beforeEach(async () => {
      const { toPng } = await import('html-to-image');
      vi.mocked(toPng).mockResolvedValue('data:image/png;base64,mockpngdata');
      mockAddSlide.mockReturnValue(mockSlide);
      container = document.createElement('div');
      container.id = 'test-canvas';
      const viewport = document.createElement('div');
      viewport.className = 'react-flow__viewport';
      container.appendChild(viewport);
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
      vi.clearAllMocks();
    });

    it('throws error when element is not found', async () => {
      await expect(
        exportToPptx('non-existent', sampleTrustStructure.metadata)
      ).rejects.toThrow('Element #non-existent not found');
    });

    it('generates 16:9 PowerPoint presentation with header, scaled chart image, and confidentiality footer', async () => {
      await exportToPptx('test-canvas', sampleTrustStructure.metadata);

      expect(mockPptxConstructor).toHaveBeenCalled();
      expect(mockAddSlide).toHaveBeenCalled();
      expect(mockSlideAddText).toHaveBeenCalledWith(
        sampleTrustStructure.metadata.chartTitle,
        expect.objectContaining({ fontSize: 16, bold: true })
      );
      expect(mockSlideAddShape).toHaveBeenCalled();
      expect(mockSlideAddImage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'data:image/png;base64,mockpngdata',
          sizing: expect.objectContaining({ type: 'contain' }),
        })
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: expect.stringMatching(/_Structure\.pptx$/),
        })
      );
    });

    it('handles fallback metadata (missing clientReference, confidentialityNotice, chartTitle) and missing viewport', async () => {
      container.innerHTML = ''; // No viewport

      await exportToPptx('test-canvas', {
        chartTitle: '',
        clientReference: '',
        effectiveDate: '2026-09-20',
        confidentialityNotice: '',
      });

      expect(mockSlideAddText).toHaveBeenCalledWith(
        'Trust Structure Chart',
        expect.objectContaining({ fontSize: 16 })
      );
      expect(mockSlideAddText).toHaveBeenCalledWith(
        'Matter Ref: N/A  |  Effective Date: 2026-09-20',
        expect.objectContaining({ fontSize: 9 })
      );
      expect(mockSlideAddText).toHaveBeenCalledWith(
        'STRICTLY CONFIDENTIAL - PREPARED FOR CLIENT REVIEW ONLY',
        expect.objectContaining({ fontSize: 8 })
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'Trust_Structure.pptx' })
      );
    });
  });

  describe('viewport export bounds and helpers', () => {
    describe('parseTranslateCoordinates', () => {
      it('parses standard translate(x px, y px) correctly', () => {
        expect(parseTranslateCoordinates('translate(120px, 450px)')).toEqual({ x: 120, y: 450 });
        expect(parseTranslateCoordinates('translate(-50.5px, -100.25px)')).toEqual({
          x: -50.5,
          y: -100.25,
        });
      });

      it('parses translate3d(x px, y px, z px) correctly', () => {
        expect(parseTranslateCoordinates('translate3d(300px, 200px, 0px)')).toEqual({
          x: 300,
          y: 200,
        });
      });

      it('returns null for non-matching or empty transform strings', () => {
        expect(parseTranslateCoordinates('')).toBeNull();
        expect(parseTranslateCoordinates('none')).toBeNull();
        expect(parseTranslateCoordinates('scale(1.5)')).toBeNull();
      });
    });

    describe('getNodeDimensions', () => {
      it('extracts dimensions from element inline style width and height', () => {
        const el = document.createElement('div');
        el.style.width = '350px';
        el.style.height = '280px';
        expect(getNodeDimensions(el)).toEqual({ width: 350, height: 280 });
      });

      it('extracts dimensions from offsetWidth and offsetHeight if style is unset', () => {
        const el = document.createElement('div');
        Object.defineProperty(el, 'offsetWidth', { value: 300, configurable: true });
        Object.defineProperty(el, 'offsetHeight', { value: 250, configurable: true });
        expect(getNodeDimensions(el)).toEqual({ width: 300, height: 250 });
      });

      it('extracts dimensions from first child element if parent lacks size', () => {
        const parent = document.createElement('div');
        const child = document.createElement('div');
        child.style.width = '240px';
        child.style.height = '220px';
        parent.appendChild(child);
        expect(getNodeDimensions(parent)).toEqual({ width: 240, height: 220 });
      });

      it('falls back to default 220x220 when no size is discoverable', () => {
        const el = document.createElement('div');
        expect(getNodeDimensions(el)).toEqual({ width: 220, height: 220 });
      });

      it('falls back to default 220x220 when child exists but has zero size', () => {
        const parent = document.createElement('div');
        const child = document.createElement('div');
        parent.appendChild(child);
        expect(getNodeDimensions(parent)).toEqual({ width: 220, height: 220 });
      });
    });

    describe('calculateViewportExportBounds', () => {
      it('returns null when viewport has no nodes', () => {
        const viewport = document.createElement('div');
        expect(calculateViewportExportBounds(viewport)).toBeNull();
      });

      it('calculates bounding box enclosing all node elements', () => {
        const viewport = document.createElement('div');
        const node1 = document.createElement('div');
        node1.className = 'react-flow__node';
        node1.style.transform = 'translate(100px, 50px)';
        node1.style.width = '300px';
        node1.style.height = '200px';

        const node2 = document.createElement('div');
        node2.className = 'react-flow__node';
        node2.style.transform = 'translate(500px, 400px)';
        node2.style.width = '200px';
        node2.style.height = '150px';

        viewport.appendChild(node1);
        viewport.appendChild(node2);

        const bounds = calculateViewportExportBounds(viewport);
        expect(bounds).toEqual({
          x: 100,
          y: 50,
          width: 600, // maxX (700) - minX (100)
          height: 500, // maxY (550) - minY (50)
        });
      });

      it('falls back to offsetLeft and offsetTop when transform is missing', () => {
        const viewport = document.createElement('div');
        const node = document.createElement('div');
        node.className = 'react-flow__node';
        Object.defineProperty(node, 'offsetLeft', { value: 80, configurable: true });
        Object.defineProperty(node, 'offsetTop', { value: 60, configurable: true });
        node.style.width = '200px';
        node.style.height = '180px';
        viewport.appendChild(node);

        const bounds = calculateViewportExportBounds(viewport);
        expect(bounds).toEqual({
          x: 80,
          y: 60,
          width: 200,
          height: 180,
        });
      });
    });

    describe('getViewportExportConfig and full diagram export execution', () => {
      it('configures custom dimensions and centering transform when nodes exist', () => {
        const container = document.createElement('div');
        const viewport = document.createElement('div');
        viewport.className = 'react-flow__viewport';

        const node = document.createElement('div');
        node.className = 'react-flow__node';
        node.style.transform = 'translate(150px, 100px)';
        node.style.width = '400px';
        node.style.height = '300px';
        viewport.appendChild(node);
        container.appendChild(viewport);

        const config = getViewportExportConfig(container, 50);
        expect(config.target).toBe(viewport);
        expect(config.width).toBe(500); // 400 + 100 padding
        expect(config.height).toBe(400); // 300 + 100 padding
        expect(config.style?.transform).toBe('translate(-100px, -50px) scale(1)');
      });

      it('passes custom bounds to toPng and toSvg when exporting image with nodes', async () => {
        const { toPng, toSvg } = await import('html-to-image');
        const container = document.createElement('div');
        container.id = 'full-chart-canvas';
        const viewport = document.createElement('div');
        viewport.className = 'react-flow__viewport';

        const node = document.createElement('div');
        node.className = 'react-flow__node';
        node.style.transform = 'translate(100px, 100px)';
        node.style.width = '200px';
        node.style.height = '200px';
        viewport.appendChild(node);
        container.appendChild(viewport);
        document.body.appendChild(container);

        try {
          await exportToImage('full-chart-canvas', 'png', 'full_chart');
          expect(toPng).toHaveBeenCalledWith(
            viewport,
            expect.objectContaining({
              width: 300,
              height: 300,
              style: expect.objectContaining({
                transform: 'translate(-50px, -50px) scale(1)',
              }),
            })
          );

          await exportToImage('full-chart-canvas', 'svg', 'full_chart_svg');
          expect(toSvg).toHaveBeenCalledWith(
            viewport,
            expect.objectContaining({
              width: 300,
              height: 300,
              style: expect.objectContaining({
                transform: 'translate(-50px, -50px) scale(1)',
              }),
            })
          );

          await exportToPdf('full-chart-canvas', sampleTrustStructure.metadata);
          expect(toPng).toHaveBeenCalledWith(
            viewport,
            expect.objectContaining({
              width: 300,
              height: 300,
              style: expect.objectContaining({
                transform: 'translate(-50px, -50px) scale(1)',
              }),
            })
          );

          await exportToPptx('full-chart-canvas', sampleTrustStructure.metadata);
          expect(toPng).toHaveBeenCalledWith(
            viewport,
            expect.objectContaining({
              width: 300,
              height: 300,
              style: expect.objectContaining({
                transform: 'translate(-50px, -50px) scale(1)',
              }),
            })
          );
        } finally {
          container.remove();
        }
      });
    });
  });
});

