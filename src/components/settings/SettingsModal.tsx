import React, { useState, useEffect, useCallback } from 'react';
import {
  AIConfig,
  AIProvider,
  getAIConfig,
  saveAIConfig,
} from '../../services/ai/aiConfig';
import { testAIConnection } from '../../services/ai/connectionTestService';
import {
  CUSTOM_MODEL_VALUE,
  getModelsForProvider,
  isCustomModel,
} from '../../services/ai/modelCatalog';
import {
  fetchOllamaModels,
  isVisionModel,
  OllamaModelItem,
} from '../../services/ai/ollamaService';
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

interface ProviderSwitcherProps {
  provider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
}

export const ProviderSwitcher: React.FC<ProviderSwitcherProps> = ({
  provider,
  onProviderChange,
}) => (
  <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200" role="group" aria-label="AI Provider">
    <button
      type="button"
      onClick={() => onProviderChange('gemini')}
      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
        provider === 'gemini'
          ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      Google Gemini
    </button>
    <button
      type="button"
      onClick={() => onProviderChange('ollama')}
      className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
        provider === 'ollama'
          ? 'bg-white text-sky-700 shadow-sm border border-slate-200'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      Ollama (Local / Private)
    </button>
  </div>
);

interface GeminiSettingsSectionProps {
  config: AIConfig;
  isCustom: boolean;
  showApiKey: boolean;
  onModelChange: (selectedId: string) => void;
  onCustomModelInputChange: (customId: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onToggleShowApiKey: () => void;
}

export const GeminiSettingsSection: React.FC<GeminiSettingsSectionProps> = ({
  config,
  isCustom,
  showApiKey,
  onModelChange,
  onCustomModelInputChange,
  onApiKeyChange,
  onToggleShowApiKey,
}) => {
  const availableModels = getModelsForProvider('gemini');
  const currentModelDescription = availableModels.find((m) => m.id === config.model)?.description;

  return (
    <>
      {/* Fiduciary Privacy Notice */}
      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Fiduciary Privacy & Enterprise Disclaimer</span>
        </div>
        <p>
          JERMChart operates 100% locally and never sends structure chart data to any external server. When using Vision OCR, chart images are transmitted directly to Google Gemini using your personal API key.
        </p>
        <p className="font-medium text-amber-950">
          Important: You must ensure your API key belongs to a paid/enterprise Google Cloud project with prompt logging disabled. Consumer/free-tier Google AI keys may use prompt data for model training. JERMChart disclaims liability for data processed under non-enterprise terms.
        </p>
      </div>

      {/* Model Selection */}
      <div>
        <label htmlFor="ai-model" className="block font-semibold text-slate-800 mb-1">
          Google Gemini Vision Model
        </label>
        <select
          id="ai-model"
          value={isCustom ? CUSTOM_MODEL_VALUE : config.model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
          <option value={CUSTOM_MODEL_VALUE}>Custom Model...</option>
        </select>
        <p className="text-[10px] text-slate-500 mt-1">
          {isCustom
            ? 'Specify a custom or fine-tuned model identifier for your enterprise Gemini deployment.'
            : currentModelDescription}
        </p>
      </div>

      {/* Custom Model Input */}
      {isCustom && (
        <div>
          <label htmlFor="custom-ai-model" className="block font-semibold text-slate-800 mb-1">
            Custom Model Identifier
          </label>
          <input
            id="custom-ai-model"
            type="text"
            value={config.model}
            onChange={(e) => onCustomModelInputChange(e.target.value)}
            placeholder="e.g. gemini-3.8-flash"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </div>
      )}

      {/* API Key */}
      <div>
        <label htmlFor="ai-apikey" className="block font-semibold text-slate-800 mb-1">
          Google Gemini API Key
        </label>
        <div className="relative">
          <input
            id="ai-apikey"
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            placeholder="Enter Gemini API Key"
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
          <button
            type="button"
            aria-label="Toggle API key visibility"
            onClick={onToggleShowApiKey}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Stored locally on your device in your user profile. Never transmitted elsewhere.
        </p>
      </div>
    </>
  );
};

interface OllamaSettingsSectionProps {
  config: AIConfig;
  models: OllamaModelItem[];
  isLoadingModels: boolean;
  isCustom: boolean;
  onUrlChange: (url: string) => void;
  onModelChange: (model: string) => void;
  onCustomModelChange: (model: string) => void;
  onRefreshModels: () => void;
}

export const OllamaSettingsSection: React.FC<OllamaSettingsSectionProps> = ({
  config,
  models,
  isLoadingModels,
  isCustom,
  onUrlChange,
  onModelChange,
  onCustomModelChange,
  onRefreshModels,
}) => {
  const modelItem = models.find((m) => m.name === config.model);
  const isSelectedVision = modelItem
    ? modelItem.isVisionCapable
    : isVisionModel(config.model);

  return (
    <>
      {/* Local Privacy Notice */}
      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Local Privacy & Zero Egress</span>
        </div>
        <p>
          Zero cloud egress: diagram images and structure chart data are processed 100% locally on your machine/private network.
        </p>
      </div>

      {/* Ollama Server URL */}
      <div>
        <label htmlFor="ollama-url" className="block font-semibold text-slate-800 mb-1">
          Ollama Server URL
        </label>
        <div className="flex gap-2 items-center">
          <input
            id="ollama-url"
            type="text"
            value={config.ollamaUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="http://localhost:11434"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
          <button
            type="button"
            onClick={onRefreshModels}
            disabled={isLoadingModels}
            aria-label="Refresh Models"
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${isLoadingModels ? 'animate-spin' : ''}`} />
            <span>{isLoadingModels ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Default local endpoint: http://localhost:11434 (or local network IP).
        </p>
      </div>

      {/* Models dynamic dropdown or fallback input */}
      {models.length > 0 ? (
        <div>
          <label htmlFor="ollama-model" className="block font-semibold text-slate-800 mb-1">
            Ollama Model
          </label>
          <select
            id="ollama-model"
            value={isCustom ? CUSTOM_MODEL_VALUE : config.model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}{m.isVisionCapable ? ' [Vision]' : ''}
              </option>
            ))}
            <option value={CUSTOM_MODEL_VALUE}>Custom Model...</option>
          </select>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span className="leading-snug">No models found at this URL. Ensure Ollama is running.</span>
          </div>
          <div>
            <label htmlFor="ollama-model-fallback" className="block font-semibold text-slate-800 mb-1">
              Ollama Model Name
            </label>
            <input
              id="ollama-model-fallback"
              type="text"
              value={config.model}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder="e.g. llama3.2-vision"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>
        </div>
      )}

      {/* Custom Model Input when models list is populated */}
      {models.length > 0 && isCustom && (
        <div>
          <label htmlFor="custom-ollama-model" className="block font-semibold text-slate-800 mb-1">
            Custom Model Identifier
          </label>
          <input
            id="custom-ollama-model"
            type="text"
            value={config.model}
            onChange={(e) => onCustomModelChange(e.target.value)}
            placeholder="e.g. llama3.2-vision"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
          />
        </div>
      )}

      {/* Vision Warning Banner if selected model lacks vision */}
      {!isSelectedVision && config.model.trim().length > 0 && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>
            Selected model may lack image-understanding capabilities. For best diagram transcription, we recommend installing a vision model (e.g.{' '}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">
              ollama pull llama3.2-vision
            </code>
            ).
          </span>
        </div>
      )}
    </>
  );
};

export function resolveRestoredGeminiModel(config: AIConfig): string {
  if (config.geminiModel && config.geminiModel !== 'gemini-3.8-flash') {
    return config.geminiModel;
  }
  if (config.model.startsWith('gemini')) {
    return config.model;
  }
  return config.geminiModel || 'gemini-3.8-flash';
}

export function resolveRestoredOllamaModel(
  config: AIConfig,
  models: OllamaModelItem[]
): string {
  if (config.ollamaModel && config.ollamaModel.length > 0) {
    return config.ollamaModel;
  }
  if (!config.model.startsWith('gemini') && config.model.length > 0) {
    return config.model;
  }
  if (models.length > 0) {
    const firstVision = models.find((m) => m.isVisionCapable)?.name;
    return firstVision || models[0].name;
  }
  return '';
}

export function resolveIsCustomOllama(targetModel: string, models: OllamaModelItem[]): boolean {
  if (!targetModel || models.length === 0) {
    return false;
  }
  return !models.some((m) => m.name === targetModel);
}

export interface OllamaModelResolution {
  model: string;
  ollamaModel: string;
  isCustom: boolean;
}

export function resolveOllamaModelOnFetch(
  prev: AIConfig,
  fetched: OllamaModelItem[]
): OllamaModelResolution | null {
  if (prev.provider !== 'ollama') return null;
  const currentModel = prev.ollamaModel || prev.model;
  if (fetched.some((m) => m.name === currentModel)) {
    return { model: currentModel, ollamaModel: currentModel, isCustom: false };
  }
  if (fetched.length === 0) {
    return null;
  }
  const matchingTagged = fetched.find(
    (m) => m.name.split(':')[0] === currentModel || m.name === `${currentModel}:latest`
  );
  if (matchingTagged) {
    return { model: matchingTagged.name, ollamaModel: matchingTagged.name, isCustom: false };
  }
  if (!currentModel || currentModel.startsWith('gemini')) {
    const firstVision = fetched.find((m) => m.isVisionCapable)?.name || fetched[0].name;
    return { model: firstVision, ollamaModel: firstVision, isCustom: false };
  }
  return { model: currentModel, ollamaModel: currentModel, isCustom: true };
}

export function getCurrentGeminiModel(config: AIConfig): string {
  if (config.geminiModel) return config.geminiModel;
  if (config.model) return config.model;
  return 'gemini-3.8-flash';
}

export function getCurrentOllamaModel(config: AIConfig): string {
  if (config.ollamaModel) return config.ollamaModel;
  if (config.model) return config.model;
  return '';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AIConfig>(() => getAIConfig());
  const [isCustom, setIsCustom] = useState<boolean>(() =>
    config.provider === 'gemini' ? isCustomModel('gemini', config.model) : false
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [ollamaModels, setOllamaModels] = useState<OllamaModelItem[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const loadOllamaModels = useCallback(async (url: string) => {
    setHasAttemptedFetch(true);
    setIsLoadingModels(true);
    try {
      const fetched = await fetchOllamaModels(url);
      setOllamaModels(fetched);
      setConfig((prev) => {
        const resolved = resolveOllamaModelOnFetch(prev, fetched);
        if (!resolved) return prev;
        setIsCustom(resolved.isCustom);
        return {
          ...prev,
          model: resolved.model,
          ollamaModel: resolved.ollamaModel,
        };
      });
    } catch {
      setOllamaModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (config.provider === 'ollama' && !hasAttemptedFetch) {
      loadOllamaModels(config.ollamaUrl);
    }
  }, [config.provider, config.ollamaUrl, hasAttemptedFetch, loadOllamaModels]);

  const handleProviderChange = (newProvider: AIProvider) => {
    if (newProvider === config.provider) return;
    setTestResult(null);

    if (newProvider === 'ollama') {
      const currentGemini = getCurrentGeminiModel(config);
      const restoredOllama = resolveRestoredOllamaModel(config, ollamaModels);
      setIsCustom(resolveIsCustomOllama(restoredOllama, ollamaModels));
      setConfig((prev) => ({
        ...prev,
        provider: 'ollama',
        geminiModel: currentGemini,
        ollamaModel: restoredOllama,
        model: restoredOllama,
      }));
      return;
    }

    const currentOllama = getCurrentOllamaModel(config);
    const restoredGemini = resolveRestoredGeminiModel(config);
    setIsCustom(isCustomModel('gemini', restoredGemini));
    setConfig((prev) => ({
      ...prev,
      provider: 'gemini',
      ollamaModel: currentOllama,
      geminiModel: restoredGemini,
      model: restoredGemini,
    }));
  };

  const handleGeminiModelChange = (selectedId: string) => {
    setTestResult(null);
    if (selectedId === CUSTOM_MODEL_VALUE) {
      setIsCustom(true);
      setConfig((prev) => {
        const currentModel = prev.geminiModel as string;
        const customModel = isCustomModel('gemini', currentModel) ? currentModel : '';
        return {
          ...prev,
          geminiModel: customModel,
          model: customModel,
        };
      });
      return;
    }

    setIsCustom(false);
    setConfig((prev) => ({
      ...prev,
      geminiModel: selectedId,
      model: selectedId,
    }));
  };

  const handleOllamaModelChange = (selected: string) => {
    setTestResult(null);
    if (selected === CUSTOM_MODEL_VALUE) {
      setIsCustom(true);
      setConfig((prev) => {
        const currentModel = prev.ollamaModel as string;
        const isKnown = ollamaModels.some((m) => m.name === currentModel);
        const customModel = isKnown ? '' : currentModel;
        return {
          ...prev,
          ollamaModel: customModel,
          model: customModel,
        };
      });
      return;
    }

    setIsCustom(false);
    setConfig((prev) => ({
      ...prev,
      ollamaModel: selected,
      model: selected,
    }));
  };

  const handleCustomModelChange = (customId: string) => {
    setTestResult(null);
    setConfig((prev) => ({
      ...prev,
      model: customId,
      ...(prev.provider === 'gemini'
        ? { geminiModel: customId }
        : { ollamaModel: customId }),
    }));
  };

  const handleApiKeyChange = (apiKey: string) => {
    setConfig((prev) => ({ ...prev, apiKey }));
    setTestResult(null);
  };

  const handleToggleShowApiKey = () => {
    setShowApiKey((prev) => !prev);
  };

  const handleOllamaUrlChange = (url: string) => {
    setConfig((prev) => ({ ...prev, ollamaUrl: url }));
    setTestResult(null);
  };

  const handleRefreshOllamaModels = () => {
    setTestResult(null);
    loadOllamaModels(config.ollamaUrl);
  };

  const handleSave = () => {
    saveAIConfig(config);
    onClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testAIConnection(config.apiKey, config.model, config);
    setTestResult(result);
    setIsTesting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">AI Provider & API Keys</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-4 text-xs text-slate-700">
          {/* Provider Switcher */}
          <ProviderSwitcher
            provider={config.provider}
            onProviderChange={handleProviderChange}
          />

          {config.provider === 'gemini' ? (
            <GeminiSettingsSection
              config={config}
              isCustom={isCustom}
              showApiKey={showApiKey}
              onModelChange={handleGeminiModelChange}
              onCustomModelInputChange={handleCustomModelChange}
              onApiKeyChange={handleApiKeyChange}
              onToggleShowApiKey={handleToggleShowApiKey}
            />
          ) : (
            <OllamaSettingsSection
              config={config}
              models={ollamaModels}
              isLoadingModels={isLoadingModels}
              isCustom={isCustom}
              onUrlChange={handleOllamaUrlChange}
              onModelChange={handleOllamaModelChange}
              onCustomModelChange={handleCustomModelChange}
              onRefreshModels={handleRefreshOllamaModels}
            />
          )}

          {/* Test Status feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              )}
              <span className="leading-snug">{testResult.message}</span>
            </div>
          )}

          {/* Action buttons inside form */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-500 font-semibold shadow transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
