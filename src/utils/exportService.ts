import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import { ChartMetadata, TrustStructureChart } from '../types/structure';
import { exportStructureToExcel } from './excelExporter';

export function parseJsonBackup(jsonString: string): TrustStructureChart | null {
  try {
    const data = JSON.parse(jsonString);
    if (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.entities) &&
      Array.isArray(data.relationships)
    ) {
      return data as TrustStructureChart;
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadJsonBackup(chart: TrustStructureChart): void {
  const blob = new Blob([JSON.stringify(chart, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (chart.metadata?.chartTitle || 'Trust').replace(/[^a-z0-9]/gi, '_');
  link.download = `${safeTitle}_Structure.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadExcelStructure(chart: TrustStructureChart): void {
  const bytes = exportStructureToExcel(chart);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (chart.metadata?.chartTitle || 'Trust').replace(/[^a-z0-9]/gi, '_');
  link.download = `${safeTitle}_Structure.xlsx`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export interface ExportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function parseTranslateCoordinates(transform: string): { x: number; y: number } | null {
  const match = /translate(?:3d)?\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px/i.exec(transform);
  if (!match) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

export function getNodeDimensions(el: HTMLElement): { width: number; height: number } {
  const styleW = parseFloat(el.style.width);
  const styleH = parseFloat(el.style.height);
  if (styleW > 0 && styleH > 0) {
    return { width: styleW, height: styleH };
  }
  const offsetW = el.offsetWidth;
  const offsetH = el.offsetHeight;
  if (offsetW > 0 && offsetH > 0) {
    return { width: offsetW, height: offsetH };
  }
  const firstChild = el.firstElementChild as HTMLElement | null;
  if (firstChild) {
    const childW = parseFloat(firstChild.style.width) || firstChild.offsetWidth;
    const childH = parseFloat(firstChild.style.height) || firstChild.offsetHeight;
    if (childW > 0 && childH > 0) {
      return { width: childW, height: childH };
    }
  }
  return { width: 220, height: 220 };
}

export function calculateViewportExportBounds(viewport: HTMLElement): ExportBounds | null {
  const nodeEls = viewport.querySelectorAll('.react-flow__node');
  if (nodeEls.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodeEls.forEach((node) => {
    const el = node as HTMLElement;
    const coords = parseTranslateCoordinates(el.style.transform);
    const x = coords ? coords.x : el.offsetLeft;
    const y = coords ? coords.y : el.offsetTop;
    const dims = getNodeDimensions(el);

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + dims.width);
    maxY = Math.max(maxY, y + dims.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export interface ViewportExportConfig {
  target: HTMLElement;
  width?: number;
  height?: number;
  style?: Record<string, string>;
}

export function getViewportExportConfig(element: HTMLElement, padding = 50): ViewportExportConfig {
  const viewport = element.querySelector('.react-flow__viewport') as HTMLElement | null;
  const target = viewport || element;
  const bounds = calculateViewportExportBounds(target);

  if (!bounds) {
    return { target };
  }

  const width = Math.round(bounds.width + padding * 2);
  const height = Math.round(bounds.height + padding * 2);
  const translateX = Math.round(-bounds.x + padding);
  const translateY = Math.round(-bounds.y + padding);

  return {
    target,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${translateX}px, ${translateY}px) scale(1)`,
      transformOrigin: '0 0',
    },
  };
}

export async function exportToImage(
  elementId: string,
  format: 'png' | 'svg',
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const { target, width, height, style } = getViewportExportConfig(element);

  let dataUrl: string;
  if (format === 'svg') {
    dataUrl = await toSvg(target, {
      backgroundColor: '#ffffff',
      ...(width && height ? { width, height, style } : {}),
    });
  } else {
    dataUrl = await toPng(target, {
      pixelRatio: 2.5,
      backgroundColor: '#ffffff',
      ...(width && height ? { width, height, style } : {}),
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

  const { target, width, height, style } = getViewportExportConfig(element);

  const dataUrl = await toPng(target, {
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    ...(width && height ? { width, height, style } : {}),
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
  const availWidth = pageWidth - 30;
  const availHeight = pageHeight - 40;
  const imgProps = pdf.getImageProperties ? pdf.getImageProperties(dataUrl) : { width: 1000, height: 600 };
  const rawWidth = imgProps?.width || 1000;
  const rawHeight = imgProps?.height || 600;
  const scale = Math.min(availWidth / rawWidth, availHeight / rawHeight);
  const imgWidth = rawWidth * scale;
  const imgHeight = rawHeight * scale;
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

  const safeTitle = (metadata.chartTitle || 'Trust').replace(/[^a-z0-9]/gi, '_');
  pdf.save(`${safeTitle}_Structure.pdf`);
}

export async function exportToPptx(
  elementId: string,
  metadata: ChartMetadata
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Element #${elementId} not found`);

  const { target, width, height, style } = getViewportExportConfig(element);

  const dataUrl = await toPng(target, {
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    ...(width && height ? { width, height, style } : {}),
  });

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

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
    y: 1.15,
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

  const safeTitle = (metadata.chartTitle || 'Trust').replace(/[^a-z0-9]/gi, '_');
  await pptx.writeFile({ fileName: `${safeTitle}_Structure.pptx` });
}

