import React, { useState } from 'react';
import { Channel, Folder as FolderType, Video } from '../types';
import {
  exportBackupJson,
  parseAndValidateImport,
  clearAllAndReset,
} from '../services/storage';
import {
  X,
  Download,
  Upload,
  RefreshCw,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';

interface ImportExportModalProps {
  folders: FolderType[];
  channels: Channel[];
  videos: Video[];
  onClose: () => void;
  onImportSuccess: (data: {
    folders: FolderType[];
    channels: Channel[];
    videos: Video[];
  }) => void;
  onResetToDefault: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  folders,
  channels,
  videos,
  onClose,
  onImportSuccess,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');
  const [jsonPasteText, setJsonPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [copiedClipboard, setCopiedClipboard] = useState(false);

  const handleExportDownload = () => {
    exportBackupJson(folders, channels, videos);
  };

  const handleCopyJsonToClipboard = () => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      folders,
      channels,
      videos,
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedClipboard(true);
    setTimeout(() => setCopiedClipboard(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonPasteText(content);
      executeImport(content);
    };
    reader.readAsText(file);
  };

  const executeImport = (text: string) => {
    const result = parseAndValidateImport(text);
    if (result.success && result.data) {
      onImportSuccess(result.data);
      setImportStatus({
        type: 'success',
        message: `Successfully restored ${result.data.folders.length} folders, ${result.data.channels.length} channels, and ${result.data.videos.length} videos!`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setImportStatus({
        type: 'error',
        message: result.error || 'Failed to parse JSON backup file.',
      });
    }
  };

  const handleResetConfirm = () => {
    if (
      confirm(
        'Are you sure you want to restore the default sample folders and channels? Your custom configurations will be overwritten.'
      )
    ) {
      onResetToDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#0f1013] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <FileJson className="w-4 h-4 text-red-500" />
            <span>Workspace Backup & JSON Sync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/[0.07] px-6">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors mr-4 ${
              activeTab === 'export'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Export Backup
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors mr-4 ${
              activeTab === 'import'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Import JSON
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'reset'
                ? 'border-red-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Reset Data
          </button>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Export your entire workspace including all folder trees, channel assignments,
                custom tags, and video feeds. Store the file safely or sync across browsers.
              </p>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono tabular-nums text-neutral-400">
                <div>
                  <span className="text-white font-semibold">{folders.length}</span> folders ·{' '}
                  <span className="text-white font-semibold">{channels.length}</span> channels ·{' '}
                  <span className="text-white font-semibold">{videos.length}</span> videos
                </div>
                <span className="text-[10px] text-emerald-400">Ready to save</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportDownload}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON Backup</span>
                </button>

                <button
                  onClick={handleCopyJsonToClipboard}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-neutral-200 rounded-lg text-xs font-medium transition-colors"
                >
                  {copiedClipboard ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Restore folders and subscriptions from a previously exported substarr JSON file.
              </p>

              {importStatus.type && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* File upload input */}
              <label className="border-2 border-dashed border-white/[0.15] hover:border-white/[0.3] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.02]">
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-medium text-white">
                  Choose a JSON file or drag here
                </span>
                <span className="text-[10px] text-neutral-500 mt-0.5">
                  tubedesk_backup_*.json
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Or paste JSON directly:
                </label>
                <textarea
                  rows={4}
                  value={jsonPasteText}
                  onChange={(e) => setJsonPasteText(e.target.value)}
                  placeholder='{"version": "1.0.0", "folders": [...], "channels": [...]}'
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg p-2.5 font-mono text-[11px] text-neutral-200 placeholder-neutral-600 focus:outline-hidden"
                />
              </div>

              <button
                disabled={!jsonPasteText.trim()}
                onClick={() => executeImport(jsonPasteText)}
                className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Validate & Restore Workspace
              </button>
            </div>
          )}

          {activeTab === 'reset' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white mb-0.5">
                    Restore Factory Sample Data
                  </span>
                  This will reset all folders back to standard defaults (Lego Experiments,
                  Chemistry, Hunting & Fishing, Video Games, Tech) and restore the original 10
                  curated channels.
                </div>
              </div>

              <button
                onClick={handleResetConfirm}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Factory Defaults</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
