import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const FiduciaryLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      data-testid="fiduciary-legend"
      className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-lg text-slate-800 transition-all duration-150 max-w-xs"
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>Fiduciary Notation Key</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100 text-[11px] space-y-2">
          {/* Entity Geometries */}
          <div className="space-y-1.5">
            <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider text-slate-400">
              Entity Shapes
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-amber-600 bg-amber-50 inline-block rotate-45 transform scale-75" />
              <span><strong>Trust / Foundation</strong> (Apex Triangle)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-600 bg-cyan-50 inline-block" />
              <span><strong>Bank / Custodian</strong> (Circle)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2.5 rounded-sm border border-slate-400 bg-white inline-block" />
              <span><strong>Corporate SPV / OpCo</strong> (Card)</span>
            </div>
          </div>

          {/* Connectors & Governance */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="font-bold text-slate-900 text-[10px] uppercase tracking-wider text-slate-400">
              Lines & Roles
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 bg-sky-600 inline-block" />
              <span><strong>Solid Line:</strong> Equity Ownership %</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
              <span><strong>Dashed Line:</strong> Fiduciary Role / Seat</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                RES
              </span>
              <span>Resident Director Governance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
