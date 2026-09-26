import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import {
  AIConfig,
  AIProvider,
  getAIConfig,
  saveAIConfig,
} from '../../services/ai/aiConfig';
import {
  CUSTOM_MODEL_VALUE,
  getModelsForProvider,
  getDefaultModelForProvider,
  isCustomModel,
} from '../../services/ai/modelCatalog';
import { trimTrailingSlashes } from '../../utils/urlUtils';
import {
  Settings,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AIConfig>(() => getAIConfig());
  const [isCustom, setIsCustom] = useState<boolean>(() =>
    isCustomModel(config.provider, config.model)
  );
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleProviderChange = (newProvider: AIProvider) => {
    const defaultModel = getDefaultModelForProvider(newProvider);
    setConfig((prev) => ({
      ...prev,
      provider: newProvider,
      model: defaultModel,
    }));
    setIsCustom(false);
    setTestResult(null);
  };

  const handleModelChange = (selectedId: string) => {
    if (selectedId === CUSTOM_MODEL_VALUE) {
      setIsCustom(true);
      setConfig((prev) => ({
        ...prev,
        model: isCustomModel(prev.provider, prev.model) ? prev.model : '',
      }));
    } else {
      setIsCustom(false);
      setConfig((prev) => ({
        ...prev,
        model: selectedId,
      }));
    }
    setTestResult(null);
  };

  const handleCustomModelInputChange = (customId: string) => {
    setConfig((prev) => ({ ...prev, model: customId }));
    setTestResult(null);
  };

  const handleSave = () => {
    saveAIConfig(config);
    onClose();
  };

  const handleTestConnection = async () => {
    if (!config.apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      if (config.provider === 'gemini') {
        const model = config.model || 'gemini-3.8-flash';
        const ai = new GoogleGenAI({ apiKey: config.apiKey.trim() });
        await ai.models.generateContent({
          model,
          contents: 'Ping',
        });
      } else {
        const rawEndpoint = config.customEndpoint?.trim();
        const baseURL = rawEndpoint ? trimTrailingSlashes(rawEndpoint) : undefined;
        const client = new OpenAI({
          apiKey: config.apiKey.trim(),
          baseURL,
          dangerouslyAllowBrowser: true,
        });

        await client.chat.completions.create({
          model: config.model || 'gpt-5.2',
          messages: [{ role: 'user', content: 'Ping' }],
          max_tokens: 5,
        });
      }

      setTestResult({
        success: true,
        message: 'Connection verified successfully! The model is responsive.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message || 'Network error'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const availableModels = getModelsForProvider(config.provider);
  const currentModelDescription = availableModels.find((m) => m.id === config.model)?.description;

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
          {/* Provider */}
          <div>
            <label htmlFor="ai-provider" className="block font-semibold text-slate-800 mb-1">
              Provider
            </label>
            <select
              id="ai-provider"
              value={config.provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="gemini">Google Gemini (Default, Recommended)</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="ai-model" className="block font-semibold text-slate-800 mb-1">
              Model
            </label>
            <select
              id="ai-model"
              value={isCustom ? CUSTOM_MODEL_VALUE : config.model}
              onChange={(e) => handleModelChange(e.target.value)}
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
                ? 'Specify a custom or fine-tuned model identifier for your provider deployment.'
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
                onChange={(e) => handleCustomModelInputChange(e.target.value)}
                placeholder={config.provider === 'gemini' ? 'e.g. gemini-3.8-flash' : 'e.g. gpt-5.2'}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          )}

          {/* API Key */}
          <div>
            <label htmlFor="ai-apikey" className="block font-semibold text-slate-800 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                id="ai-apikey"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                placeholder="Enter API Key"
                onChange={(e) => {
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }));
                  setTestResult(null);
                }}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <button
                type="button"
                aria-label="Toggle API key visibility"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Stored locally on your device in your user profile. Never transmitted elsewhere.
            </p>
          </div>

          {/* Custom Endpoint (OpenAI only) */}
          {config.provider === 'openai' && (
            <div>
              <label htmlFor="ai-endpoint" className="block font-semibold text-slate-800 mb-1">
                Custom Endpoint (Optional)
              </label>
              <input
                id="ai-endpoint"
                type="text"
                value={config.customEndpoint || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, customEndpoint: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
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
