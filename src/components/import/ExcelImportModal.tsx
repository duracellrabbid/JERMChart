import React, { useState, useRef, useEffect } from 'react';
import {
  parseExcelWorkbook,
  generateExcelTemplate,
} from '../../utils/excelParser';
import { useStructureStore } from '../../store/useStructureStore';
import { TrustStructureChart } from '../../types/structure';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';

interface ExcelImportModalProps {
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ onClose }) => {
  const loadStructure = useStructureStore((state) => state.loadStructure);

  const [parsedData, setParsedData] = useState<{
    chart: TrustStructureChart;
    warnings: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleDownloadTemplate = () => {
    const bytes = generateExcelTemplate();
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Trust_Structure_Template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const result = parseExcelWorkbook(buffer);
      if (result.chart.entities.length === 0) {
        setErrorMsg('No valid entities found in the file. Ensure "Entity Name" column is filled.');
        setParsedData(null);
      } else {
        setParsedData(result);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse file. Please upload a valid .xlsx or .csv.');
      setParsedData(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleApplyToCanvas = () => {
    loadStructure(parsedData!.chart);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="excel-import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 id="excel-import-modal-title" className="text-base font-bold text-slate-900">
                Import Structure from Excel
              </h2>
              <p className="text-xs text-slate-500">
                Upload a single-sheet .xlsx or .csv to generate the chart
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 hover:bg-slate-100 rounded text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Template Guidance Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-800">Need the standardized Excel template?</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Download our pre-formatted spreadsheet with column guides and sample rows.
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium text-xs rounded-md shadow-sm transition whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Download Excel Template
            </button>
          </div>

          {/* Dropzone */}
          <div
            data-testid="excel-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              isDragging
                ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-300'
                : 'border-slate-300 hover:border-sky-500 bg-slate-50/50 hover:bg-sky-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-slate-700">
              {fileName ? fileName : 'Click to browse or drop your Excel/CSV file here'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Supports Microsoft Excel (.xlsx, .xls) and .csv</div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview & Validation Summary */}
          {parsedData && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-emerald-800">{parsedData.chart.entities.length}</div>
                  <div className="text-[10px] font-semibold text-emerald-600 uppercase">Entities Found</div>
                </div>
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-sky-800">{parsedData.chart.relationships.length}</div>
                  <div className="text-[10px] font-semibold text-sky-600 uppercase">Ownership Links</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-purple-800">
                    {parsedData.chart.entities.reduce((acc, e) => acc + e.directors.length, 0)}
                  </div>
                  <div className="text-[10px] font-semibold text-purple-600 uppercase">Total Directors</div>
                </div>
              </div>

              {/* Warnings if any */}
              {parsedData.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                  <div className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Validation Warnings ({parsedData.warnings.length})
                  </div>
                  <ul className="text-[11px] text-amber-800 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {parsedData.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-amber-700 italic">
                    Unlinked entities will still be imported as independent top-level cards.
                  </div>
                </div>
              )}

              {/* Entities Table Preview */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 sticky top-0 text-[11px] font-semibold">
                    <tr>
                      <th className="p-2">Entity Name</th>
                      <th className="p-2">Type</th>
                      <th className="p-2">Jurisdiction</th>
                      <th className="p-2">Directors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {parsedData.chart.entities.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900 truncate max-w-[180px]">{e.name}</td>
                        <td className="p-2">{e.type}</td>
                        <td className="p-2 truncate max-w-[140px]">{e.jurisdiction}</td>
                        <td className="p-2 text-slate-500">{e.directors.length} recorded</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-end gap-2 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyToCanvas}
            disabled={!parsedData}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-md shadow transition"
          >
            Apply to Canvas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
