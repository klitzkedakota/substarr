import React, { useEffect, useState } from 'react';
import { Video, Folder as FolderType } from '../types';
import {
  X,
  ExternalLink,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Folder as FolderIconLucide,
  Share2,
  Check,
} from 'lucide-react';
import { FolderIcon } from './FolderIcon';

interface VideoModalProps {
  video: Video | null;
  folders: FolderType[];
  currentFolder?: FolderType | null;
  onClose: () => void;
  onPrevVideo?: () => void;
  onNextVideo?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onMoveChannelToFolder: (channelId: string, folderId: string | null) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  folders,
  currentFolder,
  onClose,
  onPrevVideo,
  onNextVideo,
  hasPrev,
  hasNext,
  onMoveChannelToFolder,
}) => {
  const [isTheater, setIsTheater] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard shortcut listener (Esc to close, Left/Right for prev/next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrevVideo) {
        onPrevVideo();
      } else if (e.key === 'ArrowRight' && hasNext && onNextVideo) {
        onNextVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, hasPrev, hasNext, onPrevVideo, onNextVideo]);

  if (!video) return null;

  const formattedDate = new Date(video.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://youtube.com/watch?v=${video.youtubeId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative z-10 w-full bg-[#0e0f12] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 max-h-[96vh] ${
          isTheater ? 'max-w-6xl h-[94vh]' : 'max-w-4xl'
        }`}
      >
        {/* Top Minimalist Header */}
        <div className="h-13 px-4 sm:px-6 bg-[#131418] border-b border-white/[0.07] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {video.channelAvatarUrl && (
              <img
                src={video.channelAvatarUrl}
                alt={video.channelTitle}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/10"
              />
            )}
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-200 block truncate leading-tight">
                {video.channelTitle}
              </span>
              <span className="text-[11px] text-neutral-400 block truncate leading-tight">
                {video.title}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Prev / Next controls */}
            {hasPrev && onPrevVideo && (
              <button
                onClick={onPrevVideo}
                title="Previous video (←)"
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {hasNext && onNextVideo && (
              <button
                onClick={onNextVideo}
                title="Next video (→)"
                className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Theater Mode Toggle */}
            <button
              onClick={() => setIsTheater(!isTheater)}
              title={isTheater ? 'Default view' : 'Theater view'}
              className="hidden sm:inline-flex p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
            >
              {isTheater ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Share / Copy link */}
            <button
              onClick={handleCopyLink}
              title="Copy link"
              className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Open on YouTube */}
            <a
              href={`https://youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open video on YouTube"
              className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.08] transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Video Player Frame */}
        <div className="relative w-full aspect-video bg-black shrink-0">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Video Details & Organization Controls */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug">
              {video.title}
            </h2>

            {/* Clean unboxed metadata (zero-pill) */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span className="text-white font-medium">{video.channelTitle}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{video.viewCount} views</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{formattedDate}</span>
              <span aria-hidden="true" className="text-neutral-600">·</span>
              <span className="font-mono tabular-nums">{video.duration}</span>
            </div>
          </div>

          {/* Folder Assignment for the Video's Channel */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <FolderIconLucide className="w-3.5 h-3.5 text-neutral-500" />
              <span>Folder for {video.channelTitle}:</span>
            </div>

            <select
              value={currentFolder?.id || 'uncategorized'}
              onChange={(e) => {
                const val = e.target.value;
                onMoveChannelToFolder(video.channelId, val === 'uncategorized' ? null : val);
              }}
              className="bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs rounded px-2.5 py-1 focus:outline-hidden"
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
          </div>

          {/* Video Description */}
          {video.description && (
            <div className="text-xs text-neutral-300 leading-relaxed bg-[#131418] p-3.5 rounded-lg border border-white/[0.05]">
              <div
                className={`whitespace-pre-line ${
                  !showFullDescription ? 'line-clamp-3' : ''
                }`}
              >
                {video.description}
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-red-400 hover:text-red-300 font-medium text-xs block"
              >
                {showFullDescription ? 'Show less' : 'Read full description'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
