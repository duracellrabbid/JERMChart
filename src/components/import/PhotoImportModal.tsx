import React, { useState, useRef, useEffect } from 'react';
import { hasValidApiKey, getAIConfig } from '../../services/ai/aiConfig';
import { preprocessImageFile } from '../../utils/imagePreprocessing';
import { analyzeChartImage } from '../../services/ai/chartVisionService';
import { useStructureStore } from '../../store/useStructureStore';
import {
  Camera,
  Upload,
  AlertTriangle,
  KeyRound,
  X,
  FileImage,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface PhotoImportModalProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export const PhotoImportModal: React.FC<PhotoImportModalProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const metadata = useStructureStore((state) => state.metadata);
  const entities = useStructureStore((state) => state.entities);
  const relationships = useStructureStore((state) => state.relationships);
  const loadStructure = useStructureStore((state) => state.loadStructure);
  const setUndoSnapshot = useStructureStore((state) => state.setUndoSnapshot);
  const setOcrReviewState = useStructureStore((state) => state.setOcrReviewState);

  const [hasKey, setHasKey] = useState(() => hasValidApiKey());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmReplace, setShowConfirmReplace] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasKey(hasValidApiKey());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isProcessing]);

  const handleSelectFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);

    // If it's a regular browser-displayable image, show preview
    if (!selectedFile.name.toLowerCase().endsWith('.heic') && !selectedFile.name.toLowerCase().endsWith('.heif')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleSelectFile(droppedFile);
  };

  const executeAnalysis = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Save current canvas to undo snapshot if existing entities
      if (entities.length > 0) {
        setUndoSnapshot({ metadata, entities, relationships });
      }

      setProgressStep('Optimizing photo & converting formats...');
      const preprocessed = await preprocessImageFile(file!);

      setProgressStep('Analyzing structure, entities & relationships with AI...');
      const config = getAIConfig();
      const result = await analyzeChartImage(
        preprocessed.base64Data,
        preprocessed.mimeType,
        config
      );

      setProgressStep('Generating chart layout...');
      loadStructure(result.chart);

      setOcrReviewState({
        summary: `Inferred ${result.chart.entities.length} entities and ${result.chart.relationships.length} relationships from photo.`,
        warnings: result.warnings,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to analyze photo. Please check your API key or image.');
      setShowConfirmReplace(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeClick = () => {
    if (entities.length > 0 && !showConfirmReplace) {
      setShowConfirmReplace(true);
      return;
    }
    executeAnalysis();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">Import from Photo / Hand-drawn Chart</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close"
            className="text-slate-400 hover:text-white p-1 rounded transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!hasKey ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-3">
              <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                <KeyRound className="w-4 h-4 text-amber-600" />
                <span>API Key Required</span>
              </div>
              <p className="leading-relaxed">
                To transcribe hand-drawn diagrams into digital structure charts, this feature uses
                multimodal vision AI (Google Gemini or OpenAI). Please configure your API key in Settings first.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 transition shadow"
              >
                <span>Configure API Key</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : showConfirmReplace ? (
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50 text-xs text-slate-800 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-sky-600" />
                <span>Replace Current Canvas Chart?</span>
              </div>
              <p className="leading-relaxed text-slate-600">
                You currently have {entities.length} entities on the canvas. Importing this new diagram
                will replace the current chart. Your previous chart will be preserved in an Undo snapshot.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmReplace(false)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeAnalysis}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 font-semibold shadow transition"
                >
                  Replace & Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="photo-upload-input"
                  aria-label="Upload photo of structure chart"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectFile(f);
                  }}
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selected diagram preview"
                        className="max-h-40 rounded-lg border border-slate-200 object-contain shadow-sm"
                      />
                    ) : (
                      <div className="p-4 rounded-lg bg-sky-100 text-sky-700">
                        <FileImage className="w-10 h-10" />
                      </div>
                    )}
                    <span className="font-semibold text-xs text-slate-800">{file.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Click or drop to replace
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-sky-100 text-sky-600 mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="font-semibold text-xs text-slate-900">
                      Upload Hand-Drawn Structure Chart
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Drag and drop phone photo or camera scan (.jpg, .png, .webp, .heic)
                    </div>
                  </>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="p-3 rounded-lg border border-sky-200 bg-sky-50 text-xs text-sky-900 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600 flex-shrink-0" />
                  <span className="font-medium">{progressStep}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzeClick}
                  disabled={!file || isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Analyzing...' : 'Analyze & Create Chart'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
