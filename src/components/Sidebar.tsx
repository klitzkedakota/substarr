import React, { useState } from 'react';
import {
  Folder as FolderType,
  Channel,
} from '../types';
import { FolderIcon } from './FolderIcon';
import {
  FolderPlus,
  FolderTree,
  Tag as TagIcon,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Hash,
  Download,
  KeyRound,
  MoreVertical,
  Check,
  Plus,
  Compass,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  folders: FolderType[];
  channels: Channel[];
  selectedFolderId: string | 'all' | 'uncategorized';
  selectedTag: string | null;
  onSelectFolder: (folderId: string | 'all' | 'uncategorized') => void;
  onSelectTag: (tag: string | null) => void;
  onOpenCreateFolder: (parentId?: string | null) => void;
  onOpenFolderManager: () => void;
  onOpenImportExport: () => void;
  onOpenApiSettings: () => void;
  onOpenOAuthImport: () => void;
  onMoveChannelToFolder: (channelId: string, folderId: string | null) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  folders,
  channels,
  selectedFolderId,
  selectedTag,
  onSelectFolder,
  onSelectTag,
  onOpenCreateFolder,
  onOpenFolderManager,
  onOpenImportExport,
  onOpenApiSettings,
  onOpenOAuthImport,
  onMoveChannelToFolder,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const toggleCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Build folder hierarchy
  const rootFolders = folders.filter((f) => !f.parentId).sort((a, b) => a.order - b.order);
  const childFoldersMap = new Map<string, FolderType[]>();
  folders.forEach((f) => {
    if (f.parentId) {
      const list = childFoldersMap.get(f.parentId) || [];
      list.push(f);
      childFoldersMap.set(f.parentId, list.sort((a, b) => a.order - b.order));
    }
  });

  // Calculate channel counts per folder (including subfolders)
  const getChannelCountForFolder = (folderId: string): number => {
    const directCount = channels.filter((c) => c.folderId === folderId).length;
    const children = childFoldersMap.get(folderId) || [];
    const childrenCount = children.reduce((acc, child) => acc + getChannelCountForFolder(child.id), 0);
    return directCount + childrenCount;
  };

  const uncategorizedCount = channels.filter((c) => !c.folderId).length;
  const totalChannelsCount = channels.length;

  // Extract all unique tags
  const tagCounts = new Map<string, number>();
  channels.forEach((c) => {
    c.tags.forEach((t) => {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    });
  });
  const allTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent, folderId: string | 'uncategorized') => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFolderId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | 'uncategorized') => {
    e.preventDefault();
    setDragOverFolderId(null);
    const channelId = e.dataTransfer.getData('text/channel-id');
    if (channelId) {
      onMoveChannelToFolder(channelId, folderId === 'uncategorized' ? null : folderId);
    }
  };

  const renderFolderItem = (folder: FolderType, depth: number = 0) => {
    const children = childFoldersMap.get(folder.id) || [];
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedFolderIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id && selectedTag === null;
    const isDragOver = dragOverFolderId === folder.id;
    const count = getChannelCountForFolder(folder.id);

    return (
      <div key={folder.id} className="select-none">
        <div
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          onClick={() => {
            onSelectFolder(folder.id);
            onSelectTag(null);
            onCloseMobile();
          }}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
          className={`group flex items-center justify-between pr-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all ${
            isSelected
              ? 'bg-white/[0.08] text-white shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
          } ${isDragOver ? 'ring-2 ring-red-500/80 bg-red-500/10 text-white' : ''}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(folder.id, e)}
                className="p-0.5 text-neutral-500 hover:text-neutral-300 rounded transition-colors"
                title={isCollapsed ? 'Expand folder' : 'Collapse folder'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className="w-3 inline-block" />
            )}

            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: folder.color || '#e50914' }}
            />
            <FolderIcon
              iconName={folder.icon}
              className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100"
              color={folder.color}
            />
            <span className="truncate">{folder.name}</span>
          </div>

          <span
            className={`font-mono text-[11px] tabular-nums shrink-0 ml-1.5 px-1.5 py-0.2 rounded ${
              isSelected ? 'text-white/90 bg-white/10' : 'text-neutral-500'
            }`}
          >
            {count}
          </span>
        </div>

        {/* Nested Child Folders */}
        {hasChildren && !isCollapsed && (
          <div className="mt-0.5 space-y-0.5">
            {children.map((child) => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0e0f12] border-r border-white/[0.07] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:w-64 lg:shrink-0`}
      >
        {/* Workspace Brand / Header */}
        <div className="h-14 px-4 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white block leading-none">
                  substarr
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              </div>
              <span className="text-[10px] text-neutral-400 leading-none">
                YouTube Workspace
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenCreateFolder(null)}
            title="Create new folder"
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable folder tree & tags */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {/* Main Views */}
          <div className="space-y-0.5">
            <div
              onClick={() => {
                onSelectFolder('all');
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                selectedFolderId === 'all' && selectedTag === null
                  ? 'bg-white/[0.08] text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-3.5 h-3.5 opacity-80" />
                <span>All Subscriptions</span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-neutral-500">
                {totalChannelsCount}
              </span>
            </div>

            <div
              onDragOver={(e) => handleDragOver(e, 'uncategorized')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'uncategorized')}
              onClick={() => {
                onSelectFolder('uncategorized');
                onSelectTag(null);
                onCloseMobile();
              }}
              className={`flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                selectedFolderId === 'uncategorized' && selectedTag === null
                  ? 'bg-white/[0.08] text-white'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
              } ${dragOverFolderId === 'uncategorized' ? 'ring-2 ring-red-500/80 bg-red-500/10 text-white' : ''}`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-3.5 h-3.5 opacity-80 text-amber-400/80" />
                <span>Uncategorized</span>
              </div>
              <span
                className={`font-mono text-[11px] tabular-nums px-1.5 py-0.2 rounded ${
                  uncategorizedCount > 0 ? 'text-amber-300/90 bg-amber-500/10' : 'text-neutral-500'
                }`}
              >
                {uncategorizedCount}
              </span>
            </div>
          </div>

          {/* Custom Folders Section */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Custom Folders
              </span>
              <button
                onClick={onOpenFolderManager}
                title="Manage & reorder folders"
                className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
              >
                <FolderTree className="w-3 h-3" />
                <span>Organize</span>
              </button>
            </div>

            <div className="space-y-0.5">
              {rootFolders.map((folder) => renderFolderItem(folder, 0))}
            </div>

            {/* Quick Add folder button */}
            <button
              onClick={() => onOpenCreateFolder(null)}
              className="w-full mt-1.5 flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Folder</span>
            </button>
          </div>

          {/* Tags Section */}
          {allTags.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-3 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Tags & Categories
                </span>
                {selectedTag && (
                  <button
                    onClick={() => onSelectTag(null)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear tag
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1 px-3">
                {allTags.map(([tag, count]) => {
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        onSelectTag(isActive ? null : tag);
                        onCloseMobile();
                      }}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
                        isActive
                          ? 'bg-neutral-200 text-neutral-900 font-semibold'
                          : 'bg-white/[0.04] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.08]'
                      }`}
                    >
                      <Hash className="w-2.5 h-2.5 opacity-60" />
                      <span>{tag}</span>
                      <span className="text-[10px] opacity-60 font-mono tabular-nums">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tip card */}
          <div className="mx-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] text-[11px] text-neutral-400 leading-relaxed">
            <span className="text-neutral-300 font-medium block mb-1">
              💡 Drag & Drop
            </span>
            Drag any channel card onto a folder in this sidebar to instantly reorganize it.
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="p-2 border-t border-white/[0.07] bg-[#0c0d10] space-y-1">
          <button
            onClick={onOpenOAuthImport}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-white bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
              <span className="font-semibold text-red-200">1-Click YouTube Sync</span>
            </div>
            <span className="text-[10px] text-red-400 font-mono">OAuth</span>
          </button>

          <button
            onClick={onOpenImportExport}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05] rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              <span>Backup / JSON Sync</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Local</span>
          </button>

          <button
            onClick={onOpenApiSettings}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05] rounded-md transition-colors"
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>YouTube API Key</span>
            </div>
            <span className="text-[10px] text-emerald-500/90 font-mono">v3</span>
          </button>
        </div>
      </aside>
    </>
  );
};
