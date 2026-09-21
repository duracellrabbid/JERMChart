import React, { useState } from 'react';
import { useStructureStore } from '../../store/useStructureStore';
import {
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const OcrReviewBanner: React.FC = () => {
  const ocrReviewState = useStructureStore((state) => state.ocrReviewState);
  const undoSnapshot = useStructureStore((state) => state.undoSnapshot);
  const restoreUndoSnapshot = useStructureStore((state) => state.restoreUndoSnapshot);
  const dismissOcrReview = useStructureStore((state) => state.dismissOcrReview);

  const [isWarningsOpen, setIsWarningsOpen] = useState(false);

  if (!ocrReviewState) return null;

  const { summary, warnings } = ocrReviewState;
  const hasWarnings = warnings && warnings.length > 0;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
      <div className="bg-slate-900/95 text-white backdrop-blur border border-sky-500/40 rounded-full px-4 py-2 shadow-xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Import:</span>
        </div>

        <span className="text-slate-200">{summary}</span>

        {hasWarnings && (
          <button
            type="button"
            onClick={() => setIsWarningsOpen(!isWarningsOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition text-[11px] font-medium"
          >
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>{warnings.length} Warnings</span>
            {isWarningsOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        )}

        <div className="h-4 w-px bg-slate-700 mx-0.5" />

        {undoSnapshot && (
          <button
            type="button"
            onClick={() => restoreUndoSnapshot()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition font-semibold text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Undo Import</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => dismissOcrReview()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-600 hover:bg-sky-500 text-white transition font-semibold text-xs shadow-sm"
        >
          <Check className="w-3 h-3" />
          <span>Keep</span>
        </button>
      </div>

      {hasWarnings && isWarningsOpen && (
        <div className="mt-2 w-80 max-w-[90vw] bg-white rounded-lg shadow-2xl border border-amber-200 p-3 text-slate-800 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Extraction Warnings</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside max-h-48 overflow-y-auto">
            {warnings.map((w, idx) => (
              <li key={idx} className="leading-snug">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
