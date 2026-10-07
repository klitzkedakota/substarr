import React, { useState } from 'react';
import { Channel, Folder as FolderType, Video } from '../types';
import { fetchLiveChannelData } from '../services/youtubeApi';
import {
  X,
  Plus,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Tv,
} from 'lucide-react';

interface AddChannelModalProps {
  folders: FolderType[];
  apiKey: string;
  onClose: () => void;
  onAddChannel: (channel: Channel, recentVideos?: Video[]) => void;
  onOpenApiSettings: () => void;
  onOpenOAuthImport?: () => void;
}

const PRESET_QUICK_CHANNELS = [
  {
    title: 'SmarterEveryDay',
    handle: '@smartereveryday',
    subscriberCount: '11.5M',
    description: 'Exploring the world using science and high-speed photography.',
    tags: ['science', 'physics', 'highspeed'],
    avatarUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=150&auto=format&fit=crop&q=80',
    sampleVideoId: 'f47dX6Zws80',
  },
  {
    title: '3Blue1Brown',
    handle: '@3blue1brown',
    subscriberCount: '6.4M',
    description: 'Animated mathematics explaining linear algebra, neural networks, and calculus.',
    tags: ['math', 'education', 'animation'],
    avatarUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=150&auto=format&fit=crop&q=80',
    sampleVideoId: 'aircAruvnKk',
  },
  {
    title: 'Primitive Technology',
    handle: '@primitivetechnology',
    subscriberCount: '10.9M',
    description: 'Building huts, tools, and kilns from scratch in the wild with natural materials.',
    tags: ['bushcraft', 'outdoors', 'diy', 'survival'],
    avatarUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=150&auto=format&fit=crop&q=80',
    sampleVideoId: 'p3j2NYZ8FKs',
  },
];

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  folders,
  apiKey,
  onClose,
  onAddChannel,
  onOpenApiSettings,
  onOpenOAuthImport,
}) => {
  const [inputHandleOrId, setInputHandleOrId] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('none');
  const [tagsInput, setTagsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual fallback fields if no API key or manual mode
  const [isManualMode, setIsManualMode] = useState(!apiKey);
  const [manualTitle, setManualTitle] = useState('');
  const [manualHandle, setManualHandle] = useState('');
  const [manualSubs, setManualSubs] = useState('1.0M');
  const [manualDescription, setManualDescription] = useState('');

  const handleLiveFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!inputHandleOrId.trim()) {
      setErrorMsg('Please enter a channel handle (e.g. @Veritasium) or Channel ID');
      return;
    }

    if (!apiKey) {
      setErrorMsg('YouTube Data API v3 key is missing. Add your key in API Settings or switch to Manual Mode.');
      return;
    }

    setIsLoading(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const targetFolder = selectedFolderId === 'none' ? null : selectedFolderId;
      const result = await fetchLiveChannelData(inputHandleOrId, apiKey, targetFolder, parsedTags);
      
      onAddChannel(result.channel, result.recentVideos);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch channel from YouTube API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const handle = manualHandle.trim()
      ? manualHandle.startsWith('@')
        ? manualHandle
        : `@${manualHandle}`
      : `@${manualTitle.toLowerCase().replace(/\s+/g, '')}`;

    const newChannel: Channel = {
      id: `ch-custom-${Date.now()}`,
      title: manualTitle.trim(),
      handle,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      description: manualDescription.trim() || 'Custom subscribed channel in substarr.',
      subscriberCount: manualSubs.trim() || '1.0M',
      folderId: selectedFolderId === 'none' ? null : selectedFolderId,
      tags: parsedTags.length > 0 ? parsedTags : ['general'],
      youtubeUrl: `https://youtube.com/${handle}`,
    };

    onAddChannel(newChannel);
    onClose();
  };

  const handleApplyPreset = (preset: typeof PRESET_QUICK_CHANNELS[0]) => {
    const newChannel: Channel = {
      id: `ch-${preset.handle.replace('@', '')}-${Date.now()}`,
      title: preset.title,
      handle: preset.handle,
      avatarUrl: preset.avatarUrl,
      description: preset.description,
      subscriberCount: preset.subscriberCount,
      folderId: selectedFolderId === 'none' ? null : selectedFolderId,
      tags: preset.tags,
      youtubeUrl: `https://youtube.com/${preset.handle}`,
    };

    const sampleVideo: Video = {
      id: `v-sample-${Date.now()}`,
      youtubeId: preset.sampleVideoId,
      title: `Latest featured upload from ${preset.title}`,
      channelId: newChannel.id,
      channelTitle: preset.title,
      thumbnailUrl: preset.avatarUrl,
      publishedAt: new Date().toISOString(),
      duration: '18:30',
      durationSeconds: 1110,
      viewCount: '1.5M',
      viewCountNumber: 1500000,
      tags: preset.tags,
      description: preset.description,
    };

    onAddChannel(newChannel, [sampleVideo]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#0f1013] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Tv className="w-4 h-4 text-red-500" />
            <span>Add YouTube Channel Subscription</span>
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
          {/* OAuth 1-Click Import Feature Banner */}
          {onOpenOAuthImport && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-600/15 via-red-500/10 to-transparent border border-red-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Have many subscriptions?
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    Import all your YouTube channels in 1 click with Google OAuth.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOAuthImport();
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors"
              >
                1-Click Import
              </button>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 p-1 bg-neutral-900 border border-white/[0.06] rounded-lg">
            <button
              type="button"
              onClick={() => setIsManualMode(false)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                !isManualMode
                  ? 'bg-white/[0.1] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              YouTube API Live Search
            </button>
            <button
              type="button"
              onClick={() => setIsManualMode(true)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                isManualMode
                  ? 'bg-white/[0.1] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Manual / Mock Preset
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          {!isManualMode ? (
            <form onSubmit={handleLiveFetch} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Channel Handle, URL, or Channel ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. @Veritasium or https://youtube.com/@mkbhd"
                  value={inputHandleOrId}
                  onChange={(e) => setInputHandleOrId(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Assign to Folder:
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-white"
                  >
                    <option value="none">Uncategorized</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Custom Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="science, reviews, daily"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {!apiKey && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <span>No YouTube API Key set.</span>
                  <button
                    type="button"
                    onClick={onOpenApiSettings}
                    className="underline text-amber-200 hover:text-white"
                  >
                    Configure API Key
                  </button>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isLoading ? 'Fetching Channel & Uploads...' : 'Add Channel & Sync Videos'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Channel Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kurzgesagt – In a Nutshell"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-400"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">Handle:</label>
                  <input
                    type="text"
                    placeholder="@kurzgesagt"
                    value={manualHandle}
                    onChange={(e) => setManualHandle(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Subscribers Estimate:
                  </label>
                  <input
                    type="text"
                    placeholder="22.1M"
                    value={manualSubs}
                    onChange={(e) => setManualSubs(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Assign to Folder:
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1.5 text-white"
                  >
                    <option value="none">Uncategorized</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Tags (comma separated):
                  </label>
                  <input
                    type="text"
                    placeholder="animation, science"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1 text-[11px]">Description:</label>
                <textarea
                  placeholder="Short channel summary..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Add Custom Channel
                </button>
              </div>
            </form>
          )}

          {/* Quick 1-Click Presets */}
          <div className="pt-3 border-t border-white/[0.07]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block mb-2">
              Or Quick-Add Sample Channels:
            </span>
            <div className="space-y-1.5">
              {PRESET_QUICK_CHANNELS.map((preset) => (
                <div
                  key={preset.handle}
                  className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={preset.avatarUrl}
                      alt={preset.title}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <span className="text-xs font-medium text-white block">
                        {preset.title}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {preset.handle} · {preset.subscriberCount}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs rounded font-medium transition-colors"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
