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
} from 'lucide-react';

interface AppHeaderProps {
  onOpenExport: () => void;
  onOpenExcelImport: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenExport, onOpenExcelImport }) => {
  const metadata = useStructureStore((state) => state.metadata);
  const setMetadata = useStructureStore((state) => state.setMetadata);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const setSortCriteria = useStructureStore((state) => state.setSortCriteria);
  const resetToSample = useStructureStore((state) => state.resetToSample);
  const clearCanvas = useStructureStore((state) => state.clearCanvas);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [initialTitle, setInitialTitle] = useState('');
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const resetMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isResetMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (resetMenuRef.current && !resetMenuRef.current.contains(event.target as Node)) {
        setIsResetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isResetMenuOpen]);

  const handleStartEditing = () => {
    setInitialTitle(metadata.chartTitle);
    setIsEditingTitle(true);
  };

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 border-b border-slate-800 flex-shrink-0 z-20">
      {/* Title & Reference */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-black text-white text-sm shadow">
          TM
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
              className="font-bold text-sm text-slate-100 hover:text-sky-300 cursor-pointer flex items-center gap-2 focus:outline-none focus:ring-1 focus:ring-sky-400 rounded px-1"
            >
              {metadata.chartTitle}
              <span className="text-[10px] text-slate-400 font-normal">
                ({metadata.clientReference || 'Ref: Trust'})
              </span>
            </h1>
          )}
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>Effective: {metadata.effectiveDate}</span>
            <span>•</span>
            <span className="text-amber-400 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              Confidential Fiduciary Document
            </span>
          </div>
        </div>
      </div>

      {/* Sorting Controls & Actions */}
      <div className="flex items-center gap-2">
        {/* Sibling Sort Dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 text-xs">
          <span className="text-slate-400 font-medium">Sort Siblings:</span>
          <select
            value={sortCriteria}
            onChange={(e) => setSortCriteria(e.target.value as SiblingSortCriteria)}
            className="bg-transparent text-sky-400 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="alphabetical" className="bg-slate-800 text-white">
              Alphabetical (A-Z)
            </option>
            <option value="ownership" className="bg-slate-800 text-white">
              Ownership % (High → Low)
            </option>
            <option value="jurisdiction" className="bg-slate-800 text-white">
              Jurisdiction Group
            </option>
            <option value="manual" className="bg-slate-800 text-white">
              Manual Ordering
            </option>
          </select>
        </div>

        {/* Auto-Tidy Layout Trigger */}
        <button
          onClick={() => {
            // Re-trigger layout engine
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
                onClick={() => {
                  setIsResetMenuOpen(false);
                  if (window.confirm('Clear all entities and start with a blank canvas?')) {
                    clearCanvas();
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 flex items-center gap-2 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Clear Canvas (Blank)</span>
              </button>
              <button
                onClick={() => {
                  setIsResetMenuOpen(false);
                  if (window.confirm('Reset chart to Aurelius Dynasty Trust sample template?')) {
                    resetToSample();
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span>Load Sample Template</span>
              </button>
            </div>
          )}
        </div>

        {/* Import Excel Trigger */}
        <button
          onClick={onOpenExcelImport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-md border border-slate-700 shadow transition cursor-pointer"
          title="Import structure from Excel workbook"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Import Excel
        </button>

        {/* Export Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md shadow transition cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" /> Export Chart
        </button>
      </div>
    </header>
  );
};
