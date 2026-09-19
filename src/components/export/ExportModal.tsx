import React from 'react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 text-white shadow-2xl">
        <h2 id="export-modal-title" className="text-lg font-bold">
          Export Structure Chart
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Export options (PDF, PNG, JSON) will be configured in Task 8.
        </p>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
