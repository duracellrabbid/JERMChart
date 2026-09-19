import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import { SiblingSortCriteria } from '../../types/structure';
import {
  Sparkles,
  FileDown,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenExport: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenExport }) => {
  const metadata = useStructureStore((state) => state.metadata);
  const setMetadata = useStructureStore((state) => state.setMetadata);
  const sortCriteria = useStructureStore((state) => state.sortCriteria);
  const setSortCriteria = useStructureStore((state) => state.setSortCriteria);
  const resetToSample = useStructureStore((state) => state.resetToSample);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

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
                }
              }}
              onChange={(e) => setMetadata({ chartTitle: e.target.value })}
              className="bg-slate-800 text-white font-bold text-sm px-2 py-0.5 rounded border border-sky-500 focus:outline-none"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              title="Click to edit structure title"
              className="font-bold text-sm text-slate-100 hover:text-sky-300 cursor-pointer flex items-center gap-2"
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

        {/* Reset Sample */}
        <button
          onClick={() => {
            if (window.confirm('Reset chart to Aurelius Dynasty Trust sample template?')) {
              resetToSample();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition"
          title="Reset to sample template"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>

        {/* Export Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-md shadow transition"
        >
          <FileDown className="w-3.5 h-3.5" /> Export Chart
        </button>
      </div>
    </header>
  );
};
