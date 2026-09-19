import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  downloadJsonBackup,
  parseJsonBackup,
  exportToImage,
  exportToPdf,
} from './exportService';
import { sampleTrustStructure } from '../data/sampleStructure';

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

  class MockJsPDF {
    constructor(...args: any[]) {
      mockConstructor(...args);
    }
    save = mockSave;
    setFont = mockSetFont;
    setFontSize = mockSetFontSize;
    setTextColor = mockSetTextColor;
    setDrawColor = mockSetDrawColor;
    text = mockText;
    line = mockLine;
    addImage = mockAddImage;
    getImageProperties = mockGetImageProperties;
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
  };
});

vi.mock('jspdf', () => {
  return {
    default: MockJsPDF,
    jsPDF: MockJsPDF,
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
  });
});
