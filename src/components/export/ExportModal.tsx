import React, { useRef, useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import {
  exportToImage,
  exportToPdf,
  exportToPptx,
  downloadJsonBackup,
  downloadEncryptedJsonBackup,
  downloadExcelStructure,
  parseJsonBackup,
} from '../../utils/exportService';
import { FEATURE_FLAGS } from '../../config/featureFlags';
import { encryptChart, decryptChart, isEncryptedEnvelope } from '../../utils/cryptoService';
import { FileDown, Image, FileText, Upload, Check, X, Presentation, FileSpreadsheet } from 'lucide-react';
import { AlertModal } from '../common/AlertModal';
import { PasswordPromptModal } from '../common/PasswordPromptModal';

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
  const stagedNodes = useStructureStore((state) => state.stagedNodes);
  const loadStructure = useStructureStore((state) => state.loadStructure);
  const setExportMode = useStructureStore((state) => state.setExportMode);
  const isReadOnly = useStructureStore((state) => state.isReadOnly);
  const allowJsonBackup = useStructureStore((state) => state.allowJsonBackup);

  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string } | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'export' | 'import'>('export');
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [isPasswordModalLoading, setIsPasswordModalLoading] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showError = (title: string, message: string) => {
    try {
      window.alert(message);
    } catch {
      // noop
    }
    setErrorAlert({ title, message });
  };

  const runExportWithMode = async (exportFn: () => Promise<void>, successMessage: string) => {
    setIsExporting(true);
    setExportMode(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await exportFn();
      setSuccessMsg(successMessage);
    } catch (err) {
      showError('Export Failed', `Export failed: ${formatExportError(err)}`);
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

  const handleExportExcel = async () => {
    await downloadExcelStructure({ metadata, entities, relationships });
    setSuccessMsg('Excel workbook (.xlsx) downloaded successfully.');
  };

  const handleDownloadBackup = () => {
    if (FEATURE_FLAGS.enableJsonEncryption) {
      setPasswordModalMode('export');
      setPasswordModalError(null);
      setIsPasswordModalOpen(true);
      return;
    }
    downloadJsonBackup({ metadata, entities, relationships, stagedNodes });
    setSuccessMsg('Structure backup (.json) saved.');
  };

  const handleExportPasswordSubmit = async (password: string) => {
    setIsPasswordModalLoading(true);
    setPasswordModalError(null);
    try {
      const encryptedJson = await encryptChart(
        { metadata, entities, relationships, stagedNodes },
        password
      );
      downloadEncryptedJsonBackup(encryptedJson, metadata.chartTitle);
      setIsPasswordModalOpen(false);
      setSuccessMsg('Structure backup (.json) encrypted and saved.');
    } catch (err) {
      setPasswordModalError(formatExportError(err));
    } finally {
      setIsPasswordModalLoading(false);
    }
  };

  const handleImportPasswordSubmit = async (password: string) => {
    setIsPasswordModalLoading(true);
    setPasswordModalError(null);
    try {
      const decryptedChart = await decryptChart(pendingImportContent, password);
      loadStructure(decryptedChart);
      setIsPasswordModalOpen(false);
      setPendingImportContent('');
      setSuccessMsg(`Loaded ${decryptedChart.entities.length} entities from encrypted backup.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Incorrect password or corrupted file';
      setPasswordModalError(message);
    } finally {
      setIsPasswordModalLoading(false);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (passwordModalMode === 'export') {
      void handleExportPasswordSubmit(password);
    } else {
      void handleImportPasswordSubmit(password);
    }
  };

  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordModalError(null);
    setPendingImportContent('');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          showError('Invalid Backup File', 'Invalid or corrupted structure file.');
          return;
        }

        if (isEncryptedEnvelope(parsed)) {
          setPendingImportContent(content);
          setPasswordModalMode('import');
          setPasswordModalError(null);
          setIsPasswordModalOpen(true);
          return;
        }

        const chart = parseJsonBackup(content);
        if (chart) {
          loadStructure(chart);
          setSuccessMsg(`Loaded ${chart.entities.length} entities from backup.`);
        } else {
          showError('Invalid Backup File', 'Invalid or corrupted structure file.');
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

        <div className="mt-4 space-y-4">
          {(FEATURE_FLAGS.enablePdfExport || FEATURE_FLAGS.enablePptxExport) && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Executive & Board Presentations
              </div>
              <div className="space-y-2">
                {FEATURE_FLAGS.enablePdfExport && (
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-rose-100 text-rose-700">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-900">
                            Print-Ready PDF (A4 Landscape)
                          </span>
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[9px] font-bold rounded">
                            Board Decks
                          </span>
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
                )}

                {FEATURE_FLAGS.enablePptxExport && (
                  <button
                    onClick={handleExportPptx}
                    disabled={isExporting}
                    className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-orange-500 hover:bg-orange-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Data, Spreadsheet & Vector Records
            </div>
            <div className="space-y-2">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="w-full p-2.5 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 flex items-center justify-between transition text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>

        {/* Local File Backup & Restore */}
        {allowJsonBackup && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Local File Backup & Restore
            </div>
            <div className={isReadOnly ? 'flex' : 'grid grid-cols-2 gap-2'}>
              <button
                onClick={handleDownloadBackup}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <FileDown className="w-3.5 h-3.5" /> Save JSON File
              </button>
              {!isReadOnly && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {errorAlert && (
        <AlertModal
          isOpen={true}
          title={errorAlert.title}
          message={errorAlert.message}
          buttonLabel="Acknowledge"
          onClose={() => setErrorAlert(null)}
        />
      )}

      <PasswordPromptModal
        isOpen={isPasswordModalOpen}
        mode={passwordModalMode}
        errorMessage={passwordModalError}
        isLoading={isPasswordModalLoading}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordModalClose}
      />
    </div>
  );
};
