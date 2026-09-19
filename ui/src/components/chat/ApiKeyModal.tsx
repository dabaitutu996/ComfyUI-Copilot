// Copyright (C) 2025 AIDC-AI
// Licensed under the MIT License.

import { useEffect, useState } from 'react';
import { WorkflowChatAPI } from '../../apis/workflowChatApi';
import { verifyOpenAiApiKey } from '../../utils/crypto';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
    initialApiKey?: string;
    onConfigurationUpdated?: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSave, onConfigurationUpdated }: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('');
    const [models, setModels] = useState<string[]>([]);
    const [showApiKey, setShowApiKey] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        setApiKey(localStorage.getItem('workflowLLMApiKey') || localStorage.getItem('openaiApiKey') || '');
        setBaseUrl(localStorage.getItem('workflowLLMBaseUrl') || localStorage.getItem('openaiBaseUrl') || '');
        setModel(localStorage.getItem('workflowLLMModel') || '');
        setVerificationResult(null);
    }, [isOpen]);

    const handleVerify = async () => {
        const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
        const isLocal = normalizedBaseUrl.includes('localhost') || normalizedBaseUrl.includes('127.0.0.1');

        if (!normalizedBaseUrl) {
            setVerificationResult({ success: false, message: 'Please enter an OpenAI-compatible Server URL.' });
            return;
        }
        if (!apiKey.trim() && !isLocal) {
            setVerificationResult({ success: false, message: 'Please enter an API key.' });
            return;
        }

        setVerifying(true);
        setVerificationResult(null);
        try {
            const valid = await verifyOpenAiApiKey(apiKey.trim(), normalizedBaseUrl);
            if (!valid) {
                setVerificationResult({ success: false, message: 'Connection failed. Check the URL and API key.' });
                return;
            }

            const availableModels = await WorkflowChatAPI.listModelsFromLLM(normalizedBaseUrl, apiKey.trim() || undefined);
            setModels(availableModels);
            setVerificationResult({ success: true, message: 'Connection successful.' });
        } catch (error) {
            setVerificationResult({
                success: false,
                message: error instanceof Error ? error.message : 'Connection failed.',
            });
        } finally {
            setVerifying(false);
        }
    };

    const handleSave = () => {
        const normalizedApiKey = apiKey.trim();
        const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
        const normalizedModel = model.trim();
        const previous = [
            localStorage.getItem('workflowLLMApiKey') || '',
            localStorage.getItem('workflowLLMBaseUrl') || '',
            localStorage.getItem('workflowLLMModel') || '',
        ];

        const values = {
            openaiApiKey: normalizedApiKey,
            openaiBaseUrl: normalizedBaseUrl,
            workflowLLMApiKey: normalizedApiKey,
            workflowLLMBaseUrl: normalizedBaseUrl,
            workflowLLMModel: normalizedModel,
        };

        Object.entries(values).forEach(([key, value]) => {
            if (value) localStorage.setItem(key, value);
            else localStorage.removeItem(key);
        });

        onSave(normalizedApiKey);
        if (previous[0] !== normalizedApiKey || previous[1] !== normalizedBaseUrl || previous[2] !== normalizedModel) {
            onConfigurationUpdated?.();
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 w-[480px] max-h-[80vh] shadow-2xl overflow-y-auto">
                <h2 className="text-xl text-gray-900 dark:text-white font-semibold mb-2">AI Configuration</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                    Chat, node assistance, workflow generation and workflow editing all use this model directly.
                </p>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">API Key</label>
                    <div className="relative">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(event) => setApiKey(event.target.value)}
                            placeholder="Leave empty only for a local server without authentication"
                            className="w-full px-4 py-3 pr-16 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey((visible) => !visible)}
                            className="absolute inset-y-0 right-3 bg-transparent border-none text-xs text-gray-500"
                        >
                            {showApiKey ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Server URL</label>
                    <input
                        type="text"
                        value={baseUrl}
                        onChange={(event) => setBaseUrl(event.target.value)}
                        placeholder="https://api.openai.com/v1 or http://localhost:1234/v1"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
                    <input
                        list="copilot-models"
                        type="text"
                        value={model}
                        onChange={(event) => setModel(event.target.value)}
                        placeholder="Select or enter the exact model ID"
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                    <datalist id="copilot-models">
                        {models.map((availableModel) => <option value={availableModel} key={availableModel} />)}
                    </datalist>
                </div>

                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying}
                    className="px-4 py-2 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
                >
                    {verifying ? 'Verifying...' : 'Verify and load models'}
                </button>

                {verificationResult && (
                    <div className={`mt-3 text-xs p-2 rounded-md ${verificationResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {verificationResult.message}
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-700 bg-white hover:bg-gray-100 rounded-lg font-medium">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
