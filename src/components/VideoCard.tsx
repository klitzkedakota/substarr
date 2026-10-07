import React, { useState } from 'react';
import { Video, Folder as FolderType, LayoutMode } from '../types';
import {
  Play,
  ExternalLink,
  Folder as FolderIconLucide,
  MoreVertical,
  Clock,
  Eye,
  Calendar,
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  folder?: FolderType | null;
  folders: FolderType[];
  layoutMode?: LayoutMode;
  onPlay: (video: Video) => void;
  onMoveChannelToFolder: (channelId: string, folderId: string | null) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  folder,
  folders,
  layoutMode = 'large-grid',
  onPlay,
  onMoveChannelToFolder,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const formattedDate = new Date(video.publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const renderFolderDropdown = () => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
        title="Change channel folder"
      >
        <FolderIconLucide className="w-3 h-3 text-neutral-500" />
        <span className="truncate max-w-[100px]">
          {folder ? folder.name : 'Uncategorized'}
        </span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 bottom-full mb-1 z-40 w-48 bg-[#17181c] border border-white/[0.1] rounded-lg shadow-xl py-1 text-xs text-neutral-300"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-white/[0.06]">
              Assign Channel Folder
            </div>
            <button
              onClick={() => {
                onMoveChannelToFolder(video.channelId, null);
                setShowMenu(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 hover:bg-white/[0.06] transition-colors flex items-center justify-between ${
                !folder ? 'text-red-400 font-semibold' : ''
              }`}
            >
              <span>Uncategorized</span>
              {!folder && <span className="text-[10px]">✓</span>}
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  onMoveChannelToFolder(video.channelId, f.id);
                  setShowMenu(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-white/[0.06] transition-colors flex items-center justify-between ${
                  folder?.id === f.id ? 'text-red-400 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: f.color }}
                  />
                  <span className="truncate">{f.name}</span>
                </div>
                {folder?.id === f.id && <span className="text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // 1. SIMPLE LIST VIEW (Compact single line tabular row)
  if (layoutMode === 'simple-list') {
    return (
      <div
        onClick={() => onPlay(video)}
        className="group flex items-center justify-between px-3.5 py-2.5 bg-[#121316] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/[0.12] rounded-lg transition-colors cursor-pointer text-xs"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <button
            type="button"
            className="w-6 h-6 rounded-full bg-white/[0.06] group-hover:bg-red-600 text-neutral-300 group-hover:text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </button>

          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="w-12 h-7 rounded object-cover shrink-0 bg-neutral-900 border border-white/10"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
            }}
          />

          <span className="font-medium text-neutral-200 group-hover:text-white truncate">
            {video.title}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-neutral-400">
          <span className="text-neutral-300 truncate max-w-[130px] hidden md:inline">
            {video.channelTitle}
          </span>

          {folder && (
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color }} />
              <span className="truncate max-w-[80px]">{folder.name}</span>
            </div>
          )}

          <span className="font-mono tabular-nums text-neutral-400 min-w-[40px] text-right">
            {video.duration}
          </span>

          <span className="font-mono tabular-nums text-neutral-500 min-w-[55px] text-right hidden sm:inline">
            {video.viewCount}
          </span>

          <span className="font-mono tabular-nums text-neutral-500 min-w-[80px] text-right hidden lg:inline">
            {formattedDate}
          </span>

          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open on YouTube"
            className="p-1 text-neutral-500 hover:text-white rounded hover:bg-white/[0.08]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  // 2. DETAILED LIST VIEW (Horizontal row card with excerpt & full info)
  if (layoutMode === 'detailed-list') {
    return (
      <div className="group flex flex-col sm:flex-row bg-[#121316] hover:bg-[#14151a] border border-white/[0.06] hover:border-white/[0.14] rounded-xl overflow-hidden transition-all shadow-xs">
        {/* Left: Thumbnail (w-64 on desktop) */}
        <div
          onClick={() => onPlay(video)}
          className="relative sm:w-60 md:w-72 aspect-video bg-neutral-900 cursor-pointer overflow-hidden shrink-0"
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[11px] tabular-nums text-white">
            {video.duration}
          </div>
        </div>

        {/* Right: Rich content & controls */}
        <div className="p-4 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3
                onClick={() => onPlay(video)}
                className="text-sm sm:text-base font-semibold text-neutral-100 hover:text-red-400 cursor-pointer transition-colors line-clamp-2 leading-snug"
              >
                {video.title}
              </h3>
              <a
                href={`https://youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open on YouTube"
                className="p-1 text-neutral-500 hover:text-white shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-400">
              <span className="text-white font-medium">{video.channelTitle}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{video.viewCount} views</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{formattedDate}</span>
            </div>

            <p className="mt-2 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {video.description || 'No description provided.'}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {renderFolderDropdown()}
              {video.tags && video.tags.length > 0 && (
                <div className="hidden sm:flex items-center gap-1">
                  {video.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] text-neutral-500 px-1.5 py-0.2 rounded bg-white/[0.03]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => onPlay(video)}
              className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Watch Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. BANNER VIEW (Wide hero-style cinematic card)
  if (layoutMode === 'banner') {
    return (
      <div className="group relative h-60 sm:h-64 rounded-2xl overflow-hidden border border-white/[0.08] hover:border-white/[0.18] transition-all shadow-md bg-neutral-900 cursor-pointer"
        onClick={() => onPlay(video)}
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
          }}
        />

        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e] via-[#0b0c0e]/60 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {folder && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white border border-white/10">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                <span>{folder.name}</span>
              </div>
            )}
            <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono tabular-nums text-white">
              {video.duration}
            </span>
          </div>

          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Open on YouTube"
            className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-2 text-xs text-neutral-300 mb-1.5">
            <span className="font-semibold text-white">{video.channelTitle}</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="font-mono tabular-nums">{video.viewCount} views</span>
            <span aria-hidden="true" className="text-neutral-500">·</span>
            <span className="font-mono tabular-nums">{formattedDate}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
            {video.title}
          </h3>

          <div className="mt-3 flex items-center justify-between">
            <div onClick={(e) => e.stopPropagation()}>
              {renderFolderDropdown()}
            </div>

            <div className="flex items-center gap-1 px-3 py-1 bg-red-600 group-hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow-xs">
              <Play className="w-3 h-3 fill-current" />
              <span>Watch</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. SMALL THUMBNAILS GRID (Compact card for high-density multi-column wall)
  if (layoutMode === 'small-grid') {
    return (
      <div className="group relative flex flex-col bg-[#121316] rounded-lg border border-white/[0.06] hover:border-white/[0.14] transition-all overflow-hidden shadow-xs">
        <div
          onClick={() => onPlay(video)}
          className="relative aspect-video w-full bg-neutral-900 cursor-pointer overflow-hidden"
        >
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
            }}
          />
          <div className="absolute bottom-1.5 right-1.5 px-1 py-0.2 rounded bg-black/80 font-mono text-[10px] tabular-nums text-white">
            {video.duration}
          </div>
        </div>

        <div className="p-2.5 flex flex-col flex-1 justify-between gap-1.5">
          <div>
            <h4
              onClick={() => onPlay(video)}
              title={video.title}
              className="text-xs font-medium text-neutral-100 line-clamp-2 leading-snug cursor-pointer hover:text-red-400 transition-colors"
            >
              {video.title}
            </h4>

            <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400 truncate">
              <span className="truncate">{video.channelTitle}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{video.viewCount}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
            {renderFolderDropdown()}
            <a
              href={`https://youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-neutral-500 hover:text-white p-0.5"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 5. LARGE THUMBNAILS (Default Grid)
  return (
    <div className="group relative flex flex-col bg-[#121316] rounded-xl border border-white/[0.06] hover:border-white/[0.14] transition-all overflow-hidden shadow-xs hover:shadow-md">
      <div
        onClick={() => onPlay(video)}
        className="relative aspect-video w-full bg-neutral-900 cursor-pointer overflow-hidden"
      >
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
          }}
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-xs">
          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs font-mono text-[11px] tabular-nums text-white font-medium">
          {video.duration}
        </div>

        {folder && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[11px] text-neutral-200 border border-white/10">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
            <span className="truncate max-w-[110px]">{folder.name}</span>
          </div>
        )}
      </div>

      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <h3
            onClick={() => onPlay(video)}
            title={video.title}
            className="text-sm font-semibold text-neutral-100 line-clamp-2 leading-snug cursor-pointer hover:text-red-400 transition-colors"
          >
            {video.title}
          </h3>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="text-neutral-300 font-medium truncate max-w-[140px]">
              {video.channelTitle}
            </span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums">{video.viewCount}</span>
            <span aria-hidden="true" className="text-neutral-600">·</span>
            <span className="font-mono tabular-nums whitespace-nowrap">{formattedDate}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs">
          {renderFolderDropdown()}
          <a
            href={`https://youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
            className="text-neutral-500 hover:text-white p-1 rounded hover:bg-white/[0.05] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
