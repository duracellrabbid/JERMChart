import React, { useState, useRef, useEffect } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { SiblingSortCriteria } from '../../types/structure';
import {
  Sparkles,
  FileDown,
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  FileSpreadsheet,
  Trash2,
  Upload,
  Camera,
  Settings,
  Undo2,
  Redo2,
  SlidersHorizontal,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface AppHeaderProps {
  onOpenExport: () => void;
  onOpenExcelImport: () => void;
  onOpenPhotoImport: () => void;
  onOpenSettings: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenExport,
  onOpenExcelImport,
  onOpenPhotoImport,
  onOpenSettings,
}) => {
  const metadata = useStructureStore((state) => state.metadata);
  const setMetadata = useStructureStore((state) => state.setMetadata);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const setSortCriteria = useStructureStore((state) => state.setSortCriteria);
  const directorCap = useStructureStore((state) => state.directorCap);
  const setDirectorCap = useStructureStore((state) => state.setDirectorCap);
  const associationLineStyle = useStructureStore((state) => state.associationLineStyle);
  const setAssociationLineStyle = useStructureStore((state) => state.setAssociationLineStyle);
  const resetToSample = useStructureStore((state) => state.resetToSample);
  const clearCanvas = useStructureStore((state) => state.clearCanvas);
  const undo = useStructureStore((state) => state.undo);
  const redo = useStructureStore((state) => state.redo);
  const undoHistory = useStructureStore((state) => state.undoHistory);
  const redoHistory = useStructureStore((state) => state.redoHistory);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const [isImportMenuOpen, setIsImportMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const resetMenuRef = useRef<HTMLDivElement>(null);
  const importMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (resetMenuRef.current && !resetMenuRef.current.contains(target)) {
        setIsResetMenuOpen(false);
      }
      if (importMenuRef.current && !importMenuRef.current.contains(target)) {
        setIsImportMenuOpen(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(target)) {
        setIsViewMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsResetMenuOpen(false);
        setIsImportMenuOpen(false);
        setIsViewMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStartEditing = () => {
    setInitialTitle(metadata.chartTitle);
    setIsEditingTitle(true);
  };

  const requestClearCanvas = () => {
    setIsResetMenuOpen(false);
    setConfirmModalConfig({
      title: 'Clear Structure Canvas',
      message: 'Are you sure you want to clear all entities, relationships, and parties? You will start with a blank canvas.',
      confirmLabel: 'Clear Canvas',
      onConfirm: () => {
        clearCanvas();
        setConfirmModalConfig(null);
      },
    });
  };

  const requestResetToSample = () => {
    setIsResetMenuOpen(false);
    setConfirmModalConfig({
      title: 'Load Sample Template',
      message: 'Reset current chart to the Aurelius Dynasty Trust structure? Any unsaved edits will be replaced by the default template.',
      confirmLabel: 'Load Template',
      onConfirm: () => {
        resetToSample();
        setConfirmModalConfig(null);
      },
    });
  };

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0 z-20">
      {/* Cluster 1: Document & Trust Metadata */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-black text-white text-sm shadow">
          JC
        </div>
        <div>
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={metadata.chartTitle}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setMetadata({ chartTitle: initialTitle });
                  setIsEditingTitle(false);
                }
              }}
              onChange={(e) => setMetadata({ chartTitle: e.target.value })}
              className="bg-slate-800 text-white font-bold text-sm px-2 py-0.5 rounded border border-sky-500 focus:outline-none"
            />
          ) : (
            <h1
              tabIndex={0}
              onClick={handleStartEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStartEditing();
                }
              }}
              title="Click to edit structure title"
              className="font-bold text-sm tracking-tight text-slate-100 hover:text-sky-300 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded px-1"
            >
              {metadata.chartTitle}
              <span className="text-xs text-slate-400 font-normal">
                ({metadata.clientReference || 'Ref: Trust'})
              </span>
            </h1>
          )}
          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
            <span className="font-tabular">Effective: {metadata.effectiveDate}</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/90 flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3 h-3 inline" /> Confidential Fiduciary Document
            </span>
          </div>
        </div>
      </div>

      {/* Center/Right Clusters: Undo/Redo History, View & Layout, Document Actions */}
      <div className="flex items-center gap-2">
        {/* History Controls (Undo / Redo) */}
        <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5 mr-1">
          <button
            onClick={() => undo()}
            disabled={undoHistory.length === 0}
            className={`p-1.5 rounded transition ${
              undoHistory.length > 0
                ? 'text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => redo()}
            disabled={redoHistory.length === 0}
            className={`p-1.5 rounded transition ${
              redoHistory.length > 0
                ? 'text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer'
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Layout & View Controls Cluster */}
        <div className="relative" ref={viewMenuRef}>
          <button
            onClick={() => setIsViewMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 transition cursor-pointer"
            title="Configure layout and display options"
            aria-expanded={isViewMenuOpen}
            aria-haspopup="true"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
            <span>View Options</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          <div
            className={
              isViewMenuOpen
                ? 'absolute right-0 mt-1 w-72 bg-slate-800 border border-slate-700 rounded-md shadow-2xl p-3 z-30 space-y-3 block'
                : 'sr-only'
            }
          >
            {/* Sibling Sorting */}
            <div>
              <label htmlFor="sibling-sort-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Sort Siblings:
              </label>
              <select
                id="sibling-sort-select"
                value={sortCriteria}
                onChange={(e) => setSortCriteria(e.target.value as SiblingSortCriteria)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="alphabetical" className="bg-slate-800 text-white">
                  Alphabetical (A-Z)
                </option>
                <option value="ownership" className="bg-slate-800 text-white">
                  Ownership % (High-Low)
                </option>
                <option value="jurisdiction" className="bg-slate-800 text-white">
                  Jurisdiction / Domicile
                </option>
                <option value="manual" className="bg-slate-800 text-white">
                  Manual Ordering
                </option>
              </select>
            </div>

            {/* Directors Cap */}
            <div>
              <label htmlFor="director-cap-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Directors:
              </label>
              <select
                id="director-cap-select"
                data-testid="director-cap-select"
                value={directorCap}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                  setDirectorCap(val);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value={2} className="bg-slate-800 text-white">2</option>
                <option value={3} className="bg-slate-800 text-white">3 (Default)</option>
                <option value={4} className="bg-slate-800 text-white">4</option>
                <option value={5} className="bg-slate-800 text-white">5</option>
                <option value="all" className="bg-slate-800 text-white">All (No Cap)</option>
              </select>
            </div>

            {/* Line Style Toggle */}
            <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Association Line Style:</span>
              <button
                data-testid="line-style-toggle-btn"
                onClick={() => setAssociationLineStyle(associationLineStyle === 'dotted' ? 'solid' : 'dotted')}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-700 text-xs rounded border border-slate-700 text-sky-400 font-semibold capitalize transition cursor-pointer"
                title={`Toggle association line style (Current: ${associationLineStyle})`}
              >
                Lines: {associationLineStyle}
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Tidy Layout Trigger */}
        <button
          onClick={() => {
            useStructureStore.setState((state) => ({
              sortCriteria: state.sortCriteria,
              entities: [...state.entities],
            }));
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-md shadow transition"
          title="Recalculate neat top-down layout"
        >
          <Sparkles className="w-3.5 h-3.5" /> Auto-Tidy
        </button>

        {/* Reset / New Dropdown */}
        <div className="relative" ref={resetMenuRef}>
          <button
            onClick={() => setIsResetMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition cursor-pointer"
            title="Reset or clear structure canvas"
            aria-expanded={isResetMenuOpen}
            aria-haspopup="true"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset / New</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isResetMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-30">
              <button
                onClick={requestClearCanvas}
                className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 flex items-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Clear Canvas (Blank)</span>
              </button>
              <button
                onClick={requestResetToSample}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Load Sample Template</span>
              </button>
            </div>
          )}
        </div>

        {/* Import Dropdown */}
        <div className="relative" ref={importMenuRef}>
          <button
            onClick={() => setIsImportMenuOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-md border border-slate-700 shadow transition cursor-pointer"
            title="Import structure into canvas"
            aria-expanded={isImportMenuOpen}
            aria-haspopup="true"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isImportMenuOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-30 animate-in fade-in duration-100">
              <button
                onClick={() => {
                  setIsImportMenuOpen(false);
                  onOpenExcelImport();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Import Excel (.xlsx)</div>
                  <div className="text-[10px] text-slate-400">Load structured table template</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setIsImportMenuOpen(false);
                  onOpenPhotoImport();
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 transition cursor-pointer border-t border-slate-700/60"
              >
                <Camera className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <span>Import from Photo</span>
                    <span className="px-1.5 py-0.2 bg-sky-500/20 text-sky-300 text-[9px] font-bold rounded">
                      AI OCR
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400">Transcribe hand-drawn chart photo</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Export Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md shadow transition cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" /> Export Chart
        </button>

        {/* Settings Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md border border-slate-700 shadow transition cursor-pointer"
          title="AI Provider & Settings"
          aria-label="AI Settings"
        >
          <Settings className="w-4 h-4 text-slate-400 hover:text-sky-400" />
        </button>
      </div>

      {confirmModalConfig && (
        <ConfirmationModal
          isOpen={true}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmLabel={confirmModalConfig.confirmLabel}
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={confirmModalConfig.onConfirm}
          onCancel={() => setConfirmModalConfig(null)}
        />
      )}
    </header>
  );
};
