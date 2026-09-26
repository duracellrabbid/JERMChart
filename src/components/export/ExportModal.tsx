import React, { useRef, useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import {
  exportToImage,
  exportToPdf,
  exportToPptx,
  downloadJsonBackup,
  downloadExcelStructure,
  parseJsonBackup,
} from '../../utils/exportService';
import { FileDown, Image, FileText, Upload, Check, X, Presentation, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

function formatExportError(err: unknown): string {
  return err instanceof Error ? err.message : 'Unknown error';
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const metadata = useStructureStore((state) => state.metadata);
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const loadStructure = useStructureStore((state) => state.loadStructure);
  const setExportMode = useStructureStore((state) => state.setExportMode);

  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runExportWithMode = async (exportFn: () => Promise<void>, successMessage: string) => {
    setIsExporting(true);
    setExportMode(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await exportFn();
      setSuccessMsg(successMessage);
    } catch (err) {
      alert(`Export failed: ${formatExportError(err)}`);
    } finally {
      setExportMode(false);
      setIsExporting(false);
    }
  };

  const handleExportPng = async () => {
    await runExportWithMode(
      () => exportToImage('trust-structure-canvas', 'png', metadata.chartTitle),
      'High-Res PNG downloaded successfully.'
    );
  };

  const handleExportSvg = async () => {
    await runExportWithMode(
      () => exportToImage('trust-structure-canvas', 'svg', metadata.chartTitle),
      'Vector SVG downloaded successfully.'
    );
  };

  const handleExportPdf = async () => {
    await runExportWithMode(
      () => exportToPdf('trust-structure-canvas', metadata),
      'A4 Landscape PDF generated successfully.'
    );
  };

  const handleExportPptx = async () => {
    await runExportWithMode(
      () => exportToPptx('trust-structure-canvas', metadata),
      'PowerPoint presentation generated successfully.'
    );
  };

  const handleExportExcel = () => {
    downloadExcelStructure({ metadata, entities, relationships });
    setSuccessMsg('Excel workbook (.xlsx) downloaded successfully.');
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
      try {
        const content = ev.target?.result as string;
        const parsed = parseJsonBackup(content);
        if (parsed) {
          loadStructure(parsed);
          setSuccessMsg(`Loaded ${parsed.entities.length} entities from backup.`);
        } else {
          alert('Invalid or corrupted structure file.');
        }
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[480px] p-6 text-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2
            id="export-modal-title"
            className="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            <FileDown className="w-5 h-5 text-sky-600" /> Export Structure Chart & Backup
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-slate-100 rounded text-slate-400"
          >
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
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-rose-100 text-rose-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  Print-Ready PDF (A4 Landscape)
                </div>
                <div className="text-[11px] text-slate-500">
                  Includes trust header, date, and confidentiality notice
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">
              {isExporting ? 'Exporting...' : 'Download'}
            </span>
          </button>

          <button
            onClick={handleExportPptx}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-orange-100 text-orange-700">
                <Presentation className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  PowerPoint (.pptx)
                </div>
                <div className="text-[11px] text-slate-500">
                  Widescreen 16:9 slide with corporate branding & chart
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">
              {isExporting ? 'Exporting...' : 'Download'}
            </span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-100 text-emerald-700">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  Excel Spreadsheet (.xlsx)
                </div>
                <div className="text-[11px] text-slate-500">
                  Editable structure table matching import template
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">
              Download
            </span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-sky-100 text-sky-700">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">
                  High-Resolution PNG (2.5x DPI)
                </div>
                <div className="text-[11px] text-slate-500">
                  Crisp raster image for PowerPoint and Word decks
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">
              {isExporting ? 'Exporting...' : 'Download'}
            </span>
          </button>

          <button
            onClick={handleExportSvg}
            disabled={isExporting}
            className="w-full p-3 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-100 text-amber-700">
                <Image className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-xs text-slate-900">Vector SVG</div>
                <div className="text-[11px] text-slate-500">
                  Infinite scaling without quality loss
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-600 group-hover:underline">
              {isExporting ? 'Exporting...' : 'Download'}
            </span>
          </button>
        </div>

        {/* Local File Backup & Restore */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-700 mb-2">
            Local File Backup & Restore
          </div>
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
