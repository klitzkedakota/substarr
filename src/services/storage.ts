import { AppState, Channel, Folder, Video, LayoutMode } from '../types';
import { INITIAL_CHANNELS, INITIAL_FOLDERS, INITIAL_VIDEOS } from '../data/mockData';

const STORAGE_KEY_FOLDERS = 'substarr_folders_v1';
const STORAGE_KEY_CHANNELS = 'substarr_channels_v1';
const STORAGE_KEY_VIDEOS = 'substarr_videos_v1';
const STORAGE_KEY_API_KEY = 'substarr_api_key_v1';
const STORAGE_KEY_VIDEO_LAYOUT = 'substarr_video_layout_v1';
const STORAGE_KEY_CHANNEL_LAYOUT = 'substarr_channel_layout_v1';

export interface ExportData {
  version: string;
  app: string;
  exportedAt: string;
  folders: Folder[];
  channels: Channel[];
  videos: Video[];
}

export function loadInitialData(): {
  folders: Folder[];
  channels: Channel[];
  videos: Video[];
  apiKey: string;
} {
  try {
    const rawFolders = localStorage.getItem(STORAGE_KEY_FOLDERS) || localStorage.getItem('tubedesk_folders_v1');
    const rawChannels = localStorage.getItem(STORAGE_KEY_CHANNELS) || localStorage.getItem('tubedesk_channels_v1');
    const rawVideos = localStorage.getItem(STORAGE_KEY_VIDEOS) || localStorage.getItem('tubedesk_videos_v1');
    const rawApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || localStorage.getItem('tubedesk_api_key_v1');

    const folders: Folder[] = rawFolders ? JSON.parse(rawFolders) : INITIAL_FOLDERS;
    const channels: Channel[] = rawChannels ? JSON.parse(rawChannels) : INITIAL_CHANNELS;
    const videos: Video[] = rawVideos ? JSON.parse(rawVideos) : INITIAL_VIDEOS;
    const apiKey: string = rawApiKey || '';

    return { folders, channels, videos, apiKey };
  } catch (error) {
    console.error('Error loading data from localStorage, falling back to mock defaults:', error);
    return {
      folders: INITIAL_FOLDERS,
      channels: INITIAL_CHANNELS,
      videos: INITIAL_VIDEOS,
      apiKey: '',
    };
  }
}

export function loadLayoutPreferences(): {
  videoLayout: LayoutMode;
  channelLayout: LayoutMode;
} {
  try {
    const videoLayout = (localStorage.getItem(STORAGE_KEY_VIDEO_LAYOUT) as LayoutMode) || 'large-grid';
    const channelLayout = (localStorage.getItem(STORAGE_KEY_CHANNEL_LAYOUT) as LayoutMode) || 'large-grid';
    return { videoLayout, channelLayout };
  } catch {
    return { videoLayout: 'large-grid', channelLayout: 'large-grid' };
  }
}

export function persistVideoLayout(mode: LayoutMode) {
  try {
    localStorage.setItem(STORAGE_KEY_VIDEO_LAYOUT, mode);
  } catch (e) {
    console.warn('Failed to save video layout:', e);
  }
}

export function persistChannelLayout(mode: LayoutMode) {
  try {
    localStorage.setItem(STORAGE_KEY_CHANNEL_LAYOUT, mode);
  } catch (e) {
    console.warn('Failed to save channel layout:', e);
  }
}

export function persistFolders(folders: Folder[]) {
  try {
    localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
  } catch (e) {
    console.warn('Failed to save folders to localStorage:', e);
  }
}

export function persistChannels(channels: Channel[]) {
  try {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
  } catch (e) {
    console.warn('Failed to save channels to localStorage:', e);
  }
}

export function persistVideos(videos: Video[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VIDEOS, JSON.stringify(videos));
  } catch (e) {
    console.warn('Failed to save videos to localStorage:', e);
  }
}

export function persistApiKey(apiKey: string) {
  try {
    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  } catch (e) {
    console.warn('Failed to save apiKey to localStorage:', e);
  }
}

export function exportBackupJson(folders: Folder[], channels: Channel[], videos: Video[]) {
  const exportPayload: ExportData = {
    version: '1.0.0',
    app: 'substarr',
    exportedAt: new Date().toISOString(),
    folders,
    channels,
    videos,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `substarr_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseAndValidateImport(rawJson: string): {
  success: boolean;
  data?: { folders: Folder[]; channels: Channel[]; videos: Video[] };
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'File content must be a valid JSON object.' };
    }

    if (!Array.isArray(parsed.folders) || !Array.isArray(parsed.channels)) {
      return {
        success: false,
        error: 'Invalid schema: Expected "folders" and "channels" arrays in JSON root.',
      };
    }

    return {
      success: true,
      data: {
        folders: parsed.folders,
        channels: parsed.channels,
        videos: Array.isArray(parsed.videos) ? parsed.videos : [],
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'JSON parse failed.' };
  }
}

export function clearAllAndReset(): {
  folders: Folder[];
  channels: Channel[];
  videos: Video[];
} {
  localStorage.removeItem(STORAGE_KEY_FOLDERS);
  localStorage.removeItem(STORAGE_KEY_CHANNELS);
  localStorage.removeItem(STORAGE_KEY_VIDEOS);
  return {
    folders: INITIAL_FOLDERS,
    channels: INITIAL_CHANNELS,
    videos: INITIAL_VIDEOS,
  };
}
