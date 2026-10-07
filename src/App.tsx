/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Channel, Folder, Video, SortOption, ViewTab, LayoutMode } from './types';
import {
  loadInitialData,
  loadLayoutPreferences,
  persistVideoLayout,
  persistChannelLayout,
  persistFolders,
  persistChannels,
  persistVideos,
  persistApiKey,
  clearAllAndReset,
} from './services/storage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { ChannelCard } from './components/ChannelCard';
import { VideoModal } from './components/VideoModal';
import { FolderManagerModal } from './components/FolderManagerModal';
import { AddChannelModal } from './components/AddChannelModal';
import { ImportExportModal } from './components/ImportExportModal';
import { ApiSettingsModal } from './components/ApiSettingsModal';
import { OAuthImportModal } from './components/OAuthImportModal';
import {
  FolderPlus,
  Plus,
  Search,
  Sparkles,
  Layers,
  Inbox,
  FilterX,
  Tv,
} from 'lucide-react';

export default function App() {
  const initialData = useMemo(() => loadInitialData(), []);
  const initialLayouts = useMemo(() => loadLayoutPreferences(), []);

  const [folders, setFolders] = useState<Folder[]>(initialData.folders);
  const [channels, setChannels] = useState<Channel[]>(initialData.channels);
  const [videos, setVideos] = useState<Video[]>(initialData.videos);
  const [apiKey, setApiKey] = useState<string>(initialData.apiKey);

  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all' | 'uncategorized'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewTab>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Display Layout Modes for Videos and Channels
  const [videoLayoutMode, setVideoLayoutMode] = useState<LayoutMode>(initialLayouts.videoLayout);
  const [channelLayoutMode, setChannelLayoutMode] = useState<LayoutMode>(initialLayouts.channelLayout);

  const activeLayoutMode = activeView === 'videos' ? videoLayoutMode : channelLayoutMode;

  const handleLayoutModeChange = (mode: LayoutMode) => {
    if (activeView === 'videos') {
      setVideoLayoutMode(mode);
      persistVideoLayout(mode);
    } else {
      setChannelLayoutMode(mode);
      persistChannelLayout(mode);
    }
  };

  // Modal states
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isOAuthImportOpen, setIsOAuthImportOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auto-persist changes to localStorage
  useEffect(() => {
    persistFolders(folders);
  }, [folders]);

  useEffect(() => {
    persistChannels(channels);
  }, [channels]);

  useEffect(() => {
    persistVideos(videos);
  }, [videos]);

  useEffect(() => {
    persistApiKey(apiKey);
  }, [apiKey]);

  // Current folder lookup
  const currentFolder = useMemo(() => {
    if (selectedFolderId === 'all' || selectedFolderId === 'uncategorized') return null;
    return folders.find((f) => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  const parentFolder = useMemo(() => {
    if (!currentFolder || !currentFolder.parentId) return null;
    return folders.find((f) => f.id === currentFolder.parentId) || null;
  }, [folders, currentFolder]);

  // Folder and subfolder ID collector
  const relevantFolderIds = useMemo(() => {
    if (selectedFolderId === 'all' || selectedFolderId === 'uncategorized') return [];
    
    // Include current folder and all descendants
    const ids = new Set<string>([selectedFolderId]);
    const addChildren = (pId: string) => {
      folders.filter((f) => f.parentId === pId).forEach((child) => {
        ids.add(child.id);
        addChildren(child.id);
      });
    };
    addChildren(selectedFolderId);
    return Array.from(ids);
  }, [folders, selectedFolderId]);

  // Filter channels based on active folder, tag, and search query
  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Folder check
      if (selectedFolderId === 'uncategorized') {
        if (channel.folderId !== null) return false;
      } else if (selectedFolderId !== 'all') {
        if (!channel.folderId || !relevantFolderIds.includes(channel.folderId)) return false;
      }

      // Tag check
      if (selectedTag && !channel.tags.includes(selectedTag)) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = channel.title.toLowerCase().includes(q);
        const matchesHandle = channel.handle.toLowerCase().includes(q);
        const matchesTags = channel.tags.some((t) => t.toLowerCase().includes(q));
        const matchesDesc = channel.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesHandle && !matchesTags && !matchesDesc) return false;
      }

      return true;
    });
  }, [channels, selectedFolderId, relevantFolderIds, selectedTag, searchQuery]);

  // Filtered channel IDs for video filtering
  const matchingChannelIds = useMemo(() => {
    return new Set(filteredChannels.map((c) => c.id));
  }, [filteredChannels]);

  // Filter and sort videos
  const filteredVideos = useMemo(() => {
    let result = videos.filter((video) => {
      // Must belong to one of the matched channels
      if (!matchingChannelIds.has(video.channelId)) {
        return false;
      }

      // Search query on video level
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesVideoTitle = video.title.toLowerCase().includes(q);
        const matchesChannel = video.channelTitle.toLowerCase().includes(q);
        const matchesTags = video.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesVideoTitle && !matchesChannel && !matchesTags) return false;
      }

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
        break;
      case 'duration_desc':
        result.sort((a, b) => b.durationSeconds - a.durationSeconds);
        break;
      case 'duration_asc':
        result.sort((a, b) => a.durationSeconds - b.durationSeconds);
        break;
      case 'views_desc':
        result.sort((a, b) => b.viewCountNumber - a.viewCountNumber);
        break;
      case 'channel_asc':
        result.sort((a, b) => a.channelTitle.localeCompare(b.channelTitle));
        break;
    }

    return result;
  }, [videos, matchingChannelIds, searchQuery, sortBy]);

  // Channel lookup map
  const channelMap = useMemo(() => {
    const map = new Map<string, Channel>();
    channels.forEach((c) => map.set(c.id, c));
    return map;
  }, [channels]);

  // Folder lookup map
  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  // Actions
  const handleMoveChannelToFolder = (channelId: string, folderId: string | null) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, folderId } : c))
    );
  };

  const handleUpdateChannelTags = (channelId: string, tags: string[]) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, tags } : c))
    );
  };

  const handleDeleteChannel = (channelId: string) => {
    if (confirm('Remove channel and its videos from your workspace?')) {
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      setVideos((prev) => prev.filter((v) => v.channelId !== channelId));
    }
  };

  const handleCreateFolder = (folderData: Omit<Folder, 'id'>) => {
    const newFolder: Folder = {
      ...folderData,
      id: `f-${Date.now()}`,
    };
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    setSelectedTag(null);
  };

  const handleUpdateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const handleDeleteFolder = (id: string) => {
    // Reassign all channels in this folder to null (uncategorized)
    setChannels((prev) =>
      prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c))
    );
    // Remove the folder and reset selection
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (selectedFolderId === id) {
      setSelectedFolderId('all');
    }
  };

  const handleAddChannel = (channel: Channel, recentVideos: Video[] = []) => {
    setChannels((prev) => {
      const exists = prev.some((c) => c.id === channel.id);
      if (exists) {
        return prev.map((c) => (c.id === channel.id ? channel : c));
      }
      return [channel, ...prev];
    });

    if (recentVideos.length > 0) {
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v.id));
        const newOnes = recentVideos.filter((v) => !existingIds.has(v.id));
        return [...newOnes, ...prev];
      });
    }
  };

  const handleBatchImportChannels = (newChannels: Channel[]) => {
    setChannels((prev) => {
      const existingIds = new Set(prev.map((c) => c.id));
      const toAdd = newChannels.filter((c) => !existingIds.has(c.id));
      const updated = prev.map((c) => {
        const match = newChannels.find((n) => n.id === c.id);
        return match ? { ...c, ...match } : c;
      });
      return [...toAdd, ...updated];
    });
    setActiveView('channels');
  };

  const handleImportSuccess = (data: { folders: Folder[]; channels: Channel[]; videos: Video[] }) => {
    setFolders(data.folders);
    setChannels(data.channels);
    setVideos(data.videos);
    setSelectedFolderId('all');
    setSelectedTag(null);
  };

  const handleResetToDefault = () => {
    const reset = clearAllAndReset();
    setFolders(reset.folders);
    setChannels(reset.channels);
    setVideos(reset.videos);
    setSelectedFolderId('all');
    setSelectedTag(null);
  };

  // Video Navigation in Modal
  const activeVideoIndex = activeVideo
    ? filteredVideos.findIndex((v) => v.id === activeVideo.id)
    : -1;
  const hasPrevVideo = activeVideoIndex > 0;
  const hasNextVideo = activeVideoIndex >= 0 && activeVideoIndex < filteredVideos.length - 1;

  const handlePrevVideo = () => {
    if (hasPrevVideo) {
      setActiveVideo(filteredVideos[activeVideoIndex - 1]);
    }
  };

  const handleNextVideo = () => {
    if (hasNextVideo) {
      setActiveVideo(filteredVideos[activeVideoIndex + 1]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0b0c0e] text-neutral-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        folders={folders}
        channels={channels}
        selectedFolderId={selectedFolderId}
        selectedTag={selectedTag}
        onSelectFolder={(fId) => setSelectedFolderId(fId)}
        onSelectTag={(t) => setSelectedTag(t)}
        onOpenCreateFolder={(pId) => {
          setCreateFolderParentId(pId || null);
          setIsFolderManagerOpen(true);
        }}
        onOpenFolderManager={() => setIsFolderManagerOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenApiSettings={() => setIsApiSettingsOpen(true)}
        onOpenOAuthImport={() => setIsOAuthImportOpen(true)}
        onMoveChannelToFolder={handleMoveChannelToFolder}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#0b0c0e]">
        {/* Top Header */}
        <Header
          currentFolder={currentFolder}
          parentFolder={parentFolder}
          selectedFolderId={selectedFolderId}
          selectedTag={selectedTag}
          activeView={activeView}
          onChangeView={(v) => setActiveView(v)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          sortBy={sortBy}
          onSortChange={(s) => setSortBy(s)}
          layoutMode={activeLayoutMode}
          onChangeLayoutMode={handleLayoutModeChange}
          onOpenAddChannel={() => setIsAddChannelOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          itemCount={activeView === 'videos' ? filteredVideos.length : filteredChannels.length}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Active Filter Bar if a tag or search is applied */}
          {(selectedTag || searchQuery) && (
            <div className="mb-5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-neutral-500">Filtered by:</span>
                {selectedTag && (
                  <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/[0.08]">
                    #{selectedTag}
                  </span>
                )}
                {searchQuery && (
                  <span className="text-neutral-300">
                    "{searchQuery}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setSearchQuery('');
                }}
                className="text-red-400 hover:text-red-300 flex items-center gap-1 font-medium transition-colors"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}

          {/* Videos Grid / Feed */}
          {activeView === 'videos' && (
            <>
              {filteredVideos.length > 0 ? (
                <div
                  className={
                    videoLayoutMode === 'small-grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
                      : videoLayoutMode === 'detailed-list'
                      ? 'flex flex-col gap-3.5 max-w-5xl'
                      : videoLayoutMode === 'simple-list'
                      ? 'flex flex-col gap-1.5 max-w-5xl'
                      : videoLayoutMode === 'banner'
                      ? 'flex flex-col gap-5 max-w-4xl'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
                  }
                >
                  {filteredVideos.map((video) => {
                    const ch = channelMap.get(video.channelId);
                    const folder = ch?.folderId ? folderMap.get(ch.folderId) : null;
                    return (
                      <VideoCard
                        key={video.id}
                        video={video}
                        folder={folder}
                        folders={folders}
                        layoutMode={videoLayoutMode}
                        onPlay={(v) => setActiveVideo(v)}
                        onMoveChannelToFolder={handleMoveChannelToFolder}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <Inbox className="w-10 h-10 text-neutral-600 mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">
                    No videos match your active view
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                    {searchQuery || selectedTag
                      ? 'Try clearing the search query or tag filter to reveal videos.'
                      : selectedFolderId === 'uncategorized'
                      ? 'All your subscribed channels are currently organized into folders!'
                      : 'There are no subscribed channels assigned to this folder yet.'}
                  </p>
                  <div className="flex items-center gap-2">
                    {searchQuery || selectedTag ? (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedTag(null);
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-md text-xs font-medium"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsAddChannelOpen(true)}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Channel to Workspace</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Channels Grid / Directory */}
          {activeView === 'channels' && (
            <>
              {filteredChannels.length > 0 ? (
                <div
                  className={
                    channelLayoutMode === 'small-grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'
                      : channelLayoutMode === 'detailed-list'
                      ? 'flex flex-col gap-3 max-w-5xl'
                      : channelLayoutMode === 'simple-list'
                      ? 'flex flex-col gap-1.5 max-w-5xl'
                      : channelLayoutMode === 'banner'
                      ? 'flex flex-col gap-4 max-w-4xl'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
                  }
                >
                  {filteredChannels.map((channel) => {
                    const folder = channel.folderId ? folderMap.get(channel.folderId) : null;
                    const channelVideos = videos.filter((v) => v.channelId === channel.id);
                    return (
                      <ChannelCard
                        key={channel.id}
                        channel={channel}
                        folder={folder}
                        folders={folders}
                        videoCount={channelVideos.length}
                        layoutMode={channelLayoutMode}
                        onSelectChannel={(ch) => {
                          setSearchQuery(ch.title);
                          setActiveView('videos');
                        }}
                        onMoveToFolder={handleMoveChannelToFolder}
                        onUpdateTags={handleUpdateChannelTags}
                        onDeleteChannel={handleDeleteChannel}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="h-96 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
                  <Tv className="w-10 h-10 text-neutral-600 mb-3" />
                  <h3 className="text-sm font-semibold text-white mb-1">
                    No channels in this view
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                    Add new subscriptions or drag uncategorized channels from the sidebar.
                  </p>
                  <button
                    onClick={() => setIsAddChannelOpen(true)}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Channel</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Video Playback Modal */}
      {activeVideo && (
        <VideoModal
          video={activeVideo}
          folders={folders}
          currentFolder={
            channelMap.get(activeVideo.channelId)?.folderId
              ? folderMap.get(channelMap.get(activeVideo.channelId)!.folderId!)
              : null
          }
          onClose={() => setActiveVideo(null)}
          onPrevVideo={handlePrevVideo}
          onNextVideo={handleNextVideo}
          hasPrev={hasPrevVideo}
          hasNext={hasNextVideo}
          onMoveChannelToFolder={handleMoveChannelToFolder}
        />
      )}

      {/* Folder Manager Modal */}
      {isFolderManagerOpen && (
        <FolderManagerModal
          folders={folders}
          initialParentId={createFolderParentId}
          onClose={() => {
            setIsFolderManagerOpen(false);
            setCreateFolderParentId(null);
          }}
          onCreateFolder={handleCreateFolder}
          onUpdateFolder={handleUpdateFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      )}

      {/* Add Channel Modal */}
      {isAddChannelOpen && (
        <AddChannelModal
          folders={folders}
          apiKey={apiKey}
          onClose={() => setIsAddChannelOpen(false)}
          onAddChannel={handleAddChannel}
          onOpenApiSettings={() => {
            setIsAddChannelOpen(false);
            setIsApiSettingsOpen(true);
          }}
          onOpenOAuthImport={() => {
            setIsAddChannelOpen(false);
            setIsOAuthImportOpen(true);
          }}
        />
      )}

      {/* 1-Click YouTube OAuth Import Modal */}
      {isOAuthImportOpen && (
        <OAuthImportModal
          folders={folders}
          onClose={() => setIsOAuthImportOpen(false)}
          onImportChannels={handleBatchImportChannels}
        />
      )}

      {/* Import / Export JSON Backup Modal */}
      {isImportExportOpen && (
        <ImportExportModal
          folders={folders}
          channels={channels}
          videos={videos}
          onClose={() => setIsImportExportOpen(false)}
          onImportSuccess={handleImportSuccess}
          onResetToDefault={handleResetToDefault}
        />
      )}

      {/* YouTube Data API v3 Settings & Guide Modal */}
      {isApiSettingsOpen && (
        <ApiSettingsModal
          apiKey={apiKey}
          onClose={() => setIsApiSettingsOpen(false)}
          onSaveApiKey={(key) => setApiKey(key)}
        />
      )}
    </div>
  );
}
