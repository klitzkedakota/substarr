import React, { useState } from 'react';
import { Channel, Folder as FolderType, LayoutMode } from '../types';
import {
  GripVertical,
  ExternalLink,
  Folder as FolderIconLucide,
  Tag,
  Hash,
  Trash2,
  Tv,
  Users,
} from 'lucide-react';
import { FolderIcon } from './FolderIcon';

interface ChannelCardProps {
  channel: Channel;
  folder?: FolderType | null;
  folders: FolderType[];
  videoCount: number;
  layoutMode?: LayoutMode;
  onSelectChannel: (channel: Channel) => void;
  onMoveToFolder: (channelId: string, folderId: string | null) => void;
  onUpdateTags: (channelId: string, tags: string[]) => void;
  onDeleteChannel: (channelId: string) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  folder,
  folders,
  videoCount,
  layoutMode = 'large-grid',
  onSelectChannel,
  onMoveToFolder,
  onUpdateTags,
  onDeleteChannel,
}) => {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/channel-id', channel.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && !channel.tags.includes(trimmed)) {
      onUpdateTags(channel.id, [...channel.tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateTags(
      channel.id,
      channel.tags.filter((t) => t !== tagToRemove)
    );
  };

  const renderFolderSelector = () => (
    <select
      value={channel.folderId || 'uncategorized'}
      onChange={(e) => {
        const val = e.target.value;
        onMoveToFolder(channel.id, val === 'uncategorized' ? null : val);
      }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 text-xs rounded px-2 py-1 max-w-[150px] truncate focus:outline-hidden transition-colors"
    >
      <option value="uncategorized" className="bg-[#17181c] text-neutral-400">
        Uncategorized
      </option>
      {folders.map((f) => (
        <option key={f.id} value={f.id} className="bg-[#17181c] text-white">
          {f.name}
        </option>
      ))}
    </select>
  );

  // 1. SIMPLE LIST ROW
  if (layoutMode === 'simple-list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onClick={() => onSelectChannel(channel)}
        className="group flex items-center justify-between px-3.5 py-2.5 bg-[#121316] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-lg transition-colors cursor-pointer text-xs"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <div
            title="Drag to organize into folders"
            className="text-neutral-600 group-hover:text-neutral-400 cursor-grab"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <img
            src={channel.avatarUrl}
            alt={channel.title}
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full object-cover shrink-0 bg-neutral-800 border border-white/10"
          />

          <span className="font-semibold text-neutral-200 group-hover:text-white truncate">
            {channel.title}
          </span>
          <span className="text-neutral-500 font-mono text-[11px] truncate hidden sm:inline">
            {channel.handle}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-neutral-400">
          <span className="font-mono tabular-nums text-neutral-400 text-right min-w-[60px]">
            {channel.subscriberCount}
          </span>

          <span className="font-mono tabular-nums text-neutral-500 text-right min-w-[50px] hidden md:inline">
            {videoCount} vids
          </span>

          <div onClick={(e) => e.stopPropagation()}>
            {renderFolderSelector()}
          </div>

          <a
            href={channel.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open on YouTube"
            className="p-1 text-neutral-500 hover:text-white rounded hover:bg-white/[0.08]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteChannel(channel.id);
            }}
            title="Remove channel"
            className="p-1 text-neutral-600 hover:text-red-400 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 2. DETAILED LIST ROW
  if (layoutMode === 'detailed-list') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#121316] hover:bg-[#14151a] border border-white/[0.06] hover:border-white/[0.14] rounded-xl transition-all shadow-xs gap-3"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div
            title="Drag to sidebar folder"
            className="text-neutral-600 group-hover:text-neutral-400 cursor-grab shrink-0 pt-1 sm:pt-0"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <img
            src={channel.avatarUrl}
            alt={channel.title}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-full object-cover shrink-0 bg-neutral-800 border border-white/10"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                onClick={() => onSelectChannel(channel)}
                className="text-sm font-semibold text-white truncate hover:text-red-400 cursor-pointer transition-colors"
              >
                {channel.title}
              </h4>
              <span className="text-xs text-neutral-400 font-mono hidden md:inline">
                {channel.handle}
              </span>
              <span className="text-xs text-neutral-500 font-mono tabular-nums">
                · {channel.subscriberCount} subs
              </span>
            </div>

            <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
              {channel.description || 'No description available.'}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {channel.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] text-neutral-400 px-1.5 py-0.2 rounded bg-white/[0.03]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
          <span className="font-mono tabular-nums text-xs text-neutral-500">
            {videoCount} videos
          </span>

          <div onClick={(e) => e.stopPropagation()}>
            {renderFolderSelector()}
          </div>

          <button
            onClick={() => onSelectChannel(channel)}
            className="px-2.5 py-1 text-xs bg-white/[0.06] hover:bg-white/[0.12] text-white rounded font-medium transition-colors"
          >
            Videos →
          </button>

          <a
            href={channel.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
            className="p-1 text-neutral-500 hover:text-white"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => onDeleteChannel(channel.id)}
            title="Remove channel"
            className="p-1 text-neutral-600 hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3. BANNER VIEW
  if (layoutMode === 'banner') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="group relative h-48 sm:h-52 rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/[0.18] transition-all shadow-md bg-[#131418] flex flex-col justify-between p-5"
      >
        <div className="flex items-start justify-between z-10">
          <div className="flex items-center gap-3.5">
            <img
              src={channel.avatarUrl}
              alt={channel.title}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-white/20 shadow-lg"
            />
            <div>
              <h3
                onClick={() => onSelectChannel(channel)}
                className="text-base font-bold text-white hover:text-red-400 cursor-pointer transition-colors"
              >
                {channel.title}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-mono mt-0.5">
                <span>{channel.handle}</span>
                <span aria-hidden="true">·</span>
                <span>{channel.subscriberCount} subscribers</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              title="Drag channel"
              className="p-1 text-neutral-500 hover:text-neutral-300 cursor-grab"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <a
              href={channel.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Channel on YouTube"
              className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => onDeleteChannel(channel.id)}
              className="p-1.5 rounded-full bg-white/[0.06] hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-300 line-clamp-2 max-w-xl z-10 leading-relaxed">
          {channel.description || 'Custom channel subscription in your workspace.'}
        </p>

        <div className="flex items-center justify-between z-10 pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400">Folder:</span>
            {renderFolderSelector()}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono tabular-nums text-neutral-400">
              {videoCount} videos in feed
            </span>
            <button
              onClick={() => onSelectChannel(channel)}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Browse Videos →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. SMALL THUMBNAILS / CARDS
  if (layoutMode === 'small-grid') {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="group relative flex flex-col justify-between bg-[#121316] rounded-lg border border-white/[0.06] hover:border-white/[0.15] p-3 transition-all shadow-xs cursor-grab"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={channel.avatarUrl}
              alt={channel.title}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <h4
                onClick={() => onSelectChannel(channel)}
                className="text-xs font-semibold text-white truncate hover:text-red-400 cursor-pointer"
              >
                {channel.title}
              </h4>
              <span className="text-[10px] text-neutral-400 font-mono tabular-nums block truncate">
                {channel.subscriberCount}
              </span>
            </div>
            <div className="text-neutral-600 group-hover:text-neutral-400">
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
          {renderFolderSelector()}
          <button
            onClick={() => onSelectChannel(channel)}
            className="text-[10px] text-neutral-400 hover:text-white"
          >
            {videoCount} vids
          </button>
        </div>
      </div>
    );
  }

  // 5. LARGE THUMBNAILS / STANDARD GRID
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative flex flex-col justify-between bg-[#121316] rounded-xl border border-white/[0.06] hover:border-white/[0.16] p-4 transition-all shadow-xs cursor-grab active:cursor-grabbing"
    >
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <a
          href={channel.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open Channel on YouTube"
          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-white/[0.05]"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={() => onDeleteChannel(channel.id)}
          title="Remove channel from workspace"
          className="p-1 text-neutral-500 hover:text-red-400 rounded hover:bg-white/[0.05]"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        <div
          title="Drag this channel to any folder in sidebar"
          className="p-1 text-neutral-500 hover:text-neutral-300"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-start gap-3 pr-16">
          <img
            src={channel.avatarUrl}
            alt={channel.title}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-full object-cover bg-neutral-800 shrink-0 border border-white/10"
          />
          <div className="min-w-0">
            <h4
              onClick={() => onSelectChannel(channel)}
              className="text-sm font-semibold text-white truncate hover:text-red-400 cursor-pointer transition-colors"
            >
              {channel.title}
            </h4>
            <div className="flex items-center gap-1 text-xs text-neutral-400 truncate mt-0.5">
              <span>{channel.handle}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{channel.subscriberCount} subs</span>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {channel.description || 'No channel description provided.'}
        </p>

        <div className="mt-3.5 pt-3 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-medium">Assigned Folder:</span>
          {renderFolderSelector()}
        </div>

        <div className="mt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-neutral-500 font-medium flex items-center gap-1">
              <Tag className="w-3 h-3 opacity-60" />
              <span>Tags</span>
            </span>
            <button
              onClick={() => setIsEditingTags(!isEditingTags)}
              className="text-[10px] text-neutral-400 hover:text-white transition-colors"
            >
              {isEditingTags ? 'Done' : '+ Edit tags'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {channel.tags.length === 0 && !isEditingTags && (
              <span className="text-[11px] text-neutral-600 italic">No tags</span>
            )}
            {channel.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-white/[0.04] text-neutral-300 border border-white/[0.06]"
              >
                <span>#{t}</span>
                {isEditingTags && (
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="text-neutral-500 hover:text-red-400 text-xs ml-0.5"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditingTags && (
            <form onSubmit={handleAddTag} className="mt-2 flex gap-1.5">
              <input
                type="text"
                placeholder="Add tag (e.g. physics)..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white text-xs px-2 py-1 rounded focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-2 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded font-medium"
              >
                Add
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-neutral-500">
        <span className="font-mono tabular-nums">{videoCount} videos in feed</span>
        <button
          onClick={() => onSelectChannel(channel)}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          View videos →
        </button>
      </div>
    </div>
  );
};
