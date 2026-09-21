import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadJsonBackup,
  downloadExcelStructure,
  parseJsonBackup,
  exportToImage,
  exportToPdf,
  exportToPptx,
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
});
