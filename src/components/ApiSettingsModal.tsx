import React, { useState } from 'react';
import {
  X,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Loader2,
} from 'lucide-react';

interface ApiSettingsModalProps {
  apiKey: string;
  onClose: () => void;
  onSaveApiKey: (key: string) => void;
}

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  apiKey,
  onClose,
  onSaveApiKey,
}) => {
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(currentKey.trim());
    onClose();
  };

  const handleTestKey = async () => {
    if (!currentKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter a key before testing.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      // Lightweight test query: fetch channel details for Google's own channel
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&forHandle=@Google&key=${encodeURIComponent(
          currentKey.trim()
        )}`
      );

      const json = await res.json();
      if (res.ok && json.items && json.items.length > 0) {
        setTestResult({
          success: true,
          message: 'Connection successful! YouTube Data API v3 is active and verified.',
        });
        onSaveApiKey(currentKey.trim());
      } else {
        setTestResult({
          success: false,
          message:
            json?.error?.message ||
            'API request failed. Verify that YouTube Data API v3 is enabled in Google Cloud Console.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while contacting Google APIs.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#0f1013] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>YouTube Data API v3 Integration</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Status banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              apiKey
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-white/[0.03] border-white/[0.08] text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiKey ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span>
                Active Mode:{' '}
                <strong className="text-white">
                  {apiKey ? 'Live YouTube API Connected' : 'No API Key — Videos Cannot Load'}
                </strong>
              </span>
            </div>
            {apiKey && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          </div>

          {/* Key input form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
                Google Cloud YouTube Data API v3 Key:
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={currentKey}
                  onChange={(e) => setCurrentKey(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-hidden focus:border-neutral-400"
                />
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !currentKey.trim()}
                  className="px-3 py-2 bg-white/[0.08] hover:bg-white/[0.12] disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {isTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentKey('');
                    onSaveApiKey('');
                    setTestResult(null);
                  }}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Clear Key
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Save & Apply Key
              </button>
            </div>
          </form>

          {/* Architecture & Transition Guide */}
          <div className="pt-4 border-t border-white/[0.07] space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
              Connecting to Live Data
            </span>

            <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="font-semibold text-white block">
                  1. Get a Free YouTube Data API v3 Key
                </span>
                <p className="text-neutral-400 text-[11px]">
                  Go to{' '}
                  <a
                    href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    Google Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  , create a project, enable "YouTube Data API v3", then go to "Credentials" → "Create
                  Credentials" → "API Key". Google includes 10,000 free quota units per day.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="font-semibold text-white block">
                  2. API Key vs. OAuth 2.0 Subscriptions
                </span>
                <p className="text-neutral-400 text-[11px]">
                  <strong>With an API Key (Current substarr Mode):</strong> You can fetch public
                  channel metadata, subscriber counts, and recent uploads playlist items without
                  forcing users to sign in.
                  <br />
                  <strong>With OAuth 2.0:</strong> To read private subscriptions automatically in a
                  single batch (endpoint: <code className="text-neutral-300">youtube/v3/subscriptions?mine=true</code>),
                  you configure OAuth with the scope <code className="text-neutral-300">https://www.googleapis.com/auth/youtube.readonly</code>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                <span className="font-semibold text-white block">
                  3. Zero-Backend Local Portability
                </span>
                <p className="text-neutral-400 text-[11px]">
                  substarr saves all your custom folder assignments, multi-tags, and notes in your
                  browser's <code className="text-neutral-300">localStorage</code>. Use the Backup / JSON
                  Sync modal at any time to export or import your workspace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
