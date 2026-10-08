export interface Folder {
  id: string;
  name: string;
  color: string; // hex or tailwind token
  icon: string;
  parentId: string | null;
  order: number;
}

export interface Channel {
  id: string;
  title: string;
  handle: string;
  avatarUrl: string;
  description: string;
  subscriberCount: string;
  folderId: string | null;
  tags: string[];
  customNotes?: string;
  pinned?: boolean;
  youtubeUrl: string;
}

export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  channelAvatarUrl?: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  durationSeconds: number;
  viewCount: string;
  viewCountNumber: number;
  tags: string[];
  description: string;
}

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'duration_desc'
  | 'duration_asc'
  | 'channel_asc'
  | 'views_desc';

export type ChannelSortOption =
  | 'recently_added'
  | 'title_asc'
  | 'title_desc'
  | 'subs_desc'
  | 'subs_asc'
  | 'videos_desc';

export type ViewTab = 'videos' | 'channels';

export type LayoutMode = 'large-grid' | 'small-grid' | 'detailed-list' | 'simple-list' | 'banner';

export interface AppState {
  folders: Folder[];
  channels: Channel[];
  videos: Video[];
  selectedFolderId: string | 'all' | 'uncategorized';
  selectedTag: string | null;
  activeView: ViewTab;
  searchQuery: string;
  sortBy: SortOption;
  apiKey: string;
}
