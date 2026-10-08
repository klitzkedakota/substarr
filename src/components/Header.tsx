import React, { useState } from 'react';
import { Folder as FolderType, SortOption, ChannelSortOption, ViewTab, LayoutMode } from '../types';
import {
  Search,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  Video as VideoIcon,
  Users,
  Menu,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  X,
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  AlignJustify,
  List,
  RectangleHorizontal,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { FolderIcon } from './FolderIcon';

interface HeaderProps {
  currentFolder: FolderType | null;
  parentFolder?: FolderType | null;
  selectedFolderId: string | 'all' | 'uncategorized';
  selectedTag: string | null;
  activeView: ViewTab;
  onChangeView: (view: ViewTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  layoutMode: LayoutMode;
  onChangeLayoutMode: (mode: LayoutMode) => void;
  onOpenAddChannel: () => void;
  onToggleMobileSidebar: () => void;
  itemCount: number;
  channelSortBy: ChannelSortOption;
  onChannelSortChange: (sort: ChannelSortOption) => void;
  onSyncVideos: () => void;
  syncRunning: boolean;
  syncDone: number;
  syncTotal: number;
  canSync: boolean;
}

const LAYOUT_OPTIONS: {
  id: LayoutMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'large-grid',
    label: 'Large Thumbnails',
    icon: LayoutGrid,
    description: 'Cinematic visual cards with large preview frames',
  },
  {
    id: 'small-grid',
    label: 'Small Thumbnails',
    icon: Grid3X3,
    description: 'High-density multi-column grid wall',
  },
  {
    id: 'detailed-list',
    label: 'Detailed List',
    icon: AlignJustify,
    description: 'Horizontal rows with excerpts and full metadata',
  },
  {
    id: 'simple-list',
    label: 'Simple List',
    icon: List,
    description: 'Ultra-compact single-line tabular rows',
  },
  {
    id: 'banner',
    label: 'Banners',
    icon: RectangleHorizontal,
    description: 'Wide hero-style banner cards',
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentFolder,
  parentFolder,
  selectedFolderId,
  selectedTag,
  activeView,
  onChangeView,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  layoutMode,
  onChangeLayoutMode,
  onOpenAddChannel,
  onToggleMobileSidebar,
  itemCount,
  channelSortBy,
  onChannelSortChange,
  onSyncVideos,
  syncRunning,
  syncDone,
  syncTotal,
  canSync,
}) => {
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const currentLayoutObj = LAYOUT_OPTIONS.find((o) => o.id === layoutMode) || LAYOUT_OPTIONS[0];
  const CurrentLayoutIcon = currentLayoutObj.icon;

  const getContextTitle = () => {
    if (selectedTag) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 font-mono text-xs">#</span>
          <span className="font-semibold text-white tracking-tight">{selectedTag}</span>
        </div>
      );
    }

    if (selectedFolderId === 'all') {
      return <span className="font-semibold text-white tracking-tight">All Subscriptions</span>;
    }

    if (selectedFolderId === 'uncategorized') {
      return <span className="font-semibold text-white tracking-tight">Uncategorized Channels</span>;
    }

    if (currentFolder) {
      return (
        <div className="flex items-center gap-2">
          {parentFolder && (
            <>
              <span className="text-neutral-400 font-normal hover:text-white transition-colors cursor-pointer">
                {parentFolder.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
            </>
          )}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: currentFolder.color || '#e50914' }}
          />
          <span className="font-semibold text-white tracking-tight truncate">
            {currentFolder.name}
          </span>
        </div>
      );
    }

    return <span className="font-semibold text-white tracking-tight">Feed</span>;
  };

  return (
    <header className="h-14 border-b border-white/[0.07] bg-[#0c0d10]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-20">
      {/* Zone 1: Context & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05]"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 min-w-0 text-sm">
          {getContextTitle()}
          <span className="hidden sm:inline-block text-xs font-mono tabular-nums text-neutral-500 px-1.5 py-0.5 rounded bg-white/[0.04]">
            {itemCount} {activeView === 'videos' ? 'videos' : 'channels'}
          </span>
        </div>
      </div>

      {/* Zone 2: View Switcher & Search Bar */}
      <div className="flex items-center gap-3 max-w-md w-full justify-center">
        {/* View Switcher: Videos / Channels */}
        <div className="flex items-center p-0.5 bg-neutral-900 border border-white/[0.06] rounded-md shrink-0">
          <button
            onClick={() => onChangeView('videos')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeView === 'videos'
                ? 'bg-white/[0.12] text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <VideoIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Videos</span>
          </button>
          <button
            onClick={() => onChangeView('channels')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeView === 'channels'
                ? 'bg-white/[0.12] text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Channels</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeView === 'videos'
                ? 'Filter videos by title or tags...'
                : 'Filter channels...'
            }
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-md pl-8 pr-7 py-1 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 focus:bg-white/[0.06] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Zone 3: Display Mode, Sort & Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Display / Layout Mode Selector */}
        <div className="relative">
          <button
            onClick={() => setShowLayoutMenu(!showLayoutMenu)}
            title={`Display layout: ${currentLayoutObj.label}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-neutral-200 text-xs rounded-md transition-colors"
          >
            <CurrentLayoutIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden xl:inline text-xs">{currentLayoutObj.label}</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showLayoutMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowLayoutMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 z-40 w-56 bg-[#16171b] border border-white/[0.1] rounded-xl shadow-2xl py-1.5 text-xs text-neutral-300">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-white/[0.06] mb-1">
                  Display Layout
                </div>
                {LAYOUT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = layoutMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onChangeLayoutMode(opt.id);
                        setShowLayoutMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 hover:bg-white/[0.06] transition-colors flex items-start gap-2.5 ${
                        isSelected ? 'bg-white/[0.08] text-white font-medium' : 'text-neutral-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-red-400' : 'text-neutral-500'}`} />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span>{opt.label}</span>
                          {isSelected && <span className="text-[10px] text-red-400">✓</span>}
                        </div>
                        <span className="text-[10px] text-neutral-500 block leading-tight mt-0.5">
                          {opt.description}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sort Selector */}
        {activeView === 'videos' && (
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs rounded-md pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-hidden focus:border-neutral-500 transition-colors"
            >
              <option value="newest" className="bg-[#121316] text-white">
                Newest First
              </option>
              <option value="oldest" className="bg-[#121316] text-white">
                Oldest First
              </option>
              <option value="duration_desc" className="bg-[#121316] text-white">
                Longest Duration
              </option>
              <option value="duration_asc" className="bg-[#121316] text-white">
                Shortest Duration
              </option>
              <option value="views_desc" className="bg-[#121316] text-white">
                Most Popular
              </option>
              <option value="channel_asc" className="bg-[#121316] text-white">
                Channel (A-Z)
              </option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Sort Selector (Channels) */}
        {activeView === 'channels' && (
          <div className="relative">
            <select
              value={channelSortBy}
              onChange={(e) => onChannelSortChange(e.target.value as ChannelSortOption)}
              className="appearance-none bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs rounded-md pl-2.5 pr-7 py-1.5 cursor-pointer focus:outline-hidden focus:border-neutral-500 transition-colors"
            >
              <option value="recently_added" className="bg-[#121316] text-white">
                Recently Added
              </option>
              <option value="title_asc" className="bg-[#121316] text-white">
                Name (A-Z)
              </option>
              <option value="title_desc" className="bg-[#121316] text-white">
                Name (Z-A)
              </option>
              <option value="subs_desc" className="bg-[#121316] text-white">
                Most Subscribers
              </option>
              <option value="subs_asc" className="bg-[#121316] text-white">
                Fewest Subscribers
              </option>
              <option value="videos_desc" className="bg-[#121316] text-white">
                Most Videos Synced
              </option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-neutral-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {/* Sync Videos Button */}
        <button
          onClick={onSyncVideos}
          disabled={!canSync || syncRunning}
          title={
            canSync
              ? 'Fetch recent uploads for every channel'
              : 'Add channels first, then sync their videos'
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-200 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncRunning ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {syncRunning ? `Syncing ${syncDone}/${syncTotal}` : 'Sync Videos'}
          </span>
        </button>

        {/* Add Channel Button */}
        <button
          onClick={onOpenAddChannel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Channel</span>
        </button>
      </div>
    </header>
  );
};

