import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { ChartMetadata, TrustStructureChart } from '../types/structure';

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
  const safeTitle = (chart.metadata?.chartTitle || 'Trust').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${safeTitle}_Structure.json`;
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

  const safeTitle = (metadata.chartTitle || 'Trust').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`${safeTitle}_Structure.pdf`);
}
