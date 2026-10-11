import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonLabel?: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  buttonLabel = 'Dismiss',
  onClose,
}) => {
  const dismissBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    dismissBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-modal-title"
      data-testid="alert-modal"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-5 text-slate-100 flex flex-col gap-4 relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close alert"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 pr-4">
            <h2 id="alert-modal-title" className="text-sm font-semibold text-white leading-snug">
              {title}
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-slate-800">
          <button
            ref={dismissBtnRef}
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
