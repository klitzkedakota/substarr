import { Channel, Video } from '../types';

export interface ChannelFetchResult {
  channel: Channel;
  recentVideos: Video[];
}

/**
 * Parses ISO 8601 duration format (e.g. PT14M26S or PT1H2M10S) to readable mm:ss or hh:mm:ss
 */
export function parseIsoDuration(durationStr: string): { formatted: string; seconds: number } {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return { formatted: '0:00', seconds: 0 };

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  if (hours > 0) {
    const formatted = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return { formatted, seconds: totalSeconds };
  } else {
    const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    return { formatted, seconds: totalSeconds };
  }
}

/**
 * Formats numeric count to human readable (e.g. 1420000 -> 1.4M)
 */
export function formatCount(countStr: string | number): string {
  const count = typeof countStr === 'string' ? parseInt(countStr, 10) : countStr;
  if (isNaN(count)) return '0';

  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

/**
 * Resolves channel ID or handle from user input (URL, @handle, or raw ID)
 */
export function extractChannelIdentifier(input: string): { type: 'handle' | 'id' | 'username'; value: string } {
  const trimmed = input.trim();

  // If user pasted full URL: https://youtube.com/@mkbhd
  const handleMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/i);
  if (handleMatch) {
    return { type: 'handle', value: `@${handleMatch[1]}` };
  }

  // https://youtube.com/channel/UC...
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (channelUrlMatch) {
    return { type: 'id', value: channelUrlMatch[1] };
  }

  // Handle direct input like "@Veritasium"
  if (trimmed.startsWith('@')) {
    return { type: 'handle', value: trimmed };
  }

  // Standard YouTube Channel ID starts with UC and is 24 chars
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: 'id', value: trimmed };
  }

  // Fallback to handle or username
  return { type: 'handle', value: trimmed.startsWith('@') ? trimmed : `@${trimmed}` };
}

/**
 * Fetch channel details and recent uploads via official YouTube Data API v3
 */
export async function fetchLiveChannelData(
  identifierInput: string,
  apiKey: string,
  targetFolderId: string | null = null,
  tags: string[] = []
): Promise<ChannelFetchResult> {
  if (!apiKey) {
    throw new Error('Please configure a valid YouTube Data API v3 key in API Settings.');
  }

  const { type, value } = extractChannelIdentifier(identifierInput);
  let channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&key=${apiKey}`;

  if (type === 'handle') {
    channelUrl += `&forHandle=${encodeURIComponent(value.startsWith('@') ? value : `@${value}`)}`;
  } else {
    channelUrl += `&id=${encodeURIComponent(value)}`;
  }

  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) {
    const errJson = await channelRes.json().catch(() => null);
    throw new Error(
      errJson?.error?.message || `YouTube API returned status ${channelRes.status} for channel query.`
    );
  }

  const channelJson = await channelRes.json();
  const items = channelJson.items;
  if (!items || items.length === 0) {
    throw new Error(`Channel not found for "${value}". Check handle or channel ID.`);
  }

  const item = items[0];
  const channelId = item.id;
  const snippet = item.snippet;
  const statistics = item.statistics;
  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;

  const channel: Channel = {
    id: channelId,
    title: snippet.title,
    handle: snippet.customUrl || value,
    avatarUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    description: snippet.description || '',
    subscriberCount: formatCount(statistics.subscriberCount),
    folderId: targetFolderId,
    tags: tags.length > 0 ? tags : ['subscription'],
    youtubeUrl: `https://youtube.com/${snippet.customUrl || `channel/${channelId}`}`,
  };

  const recentVideos: Video[] = [];

  // Fetch recent uploads from the uploads playlist
  if (uploadsPlaylistId) {
    try {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=8&key=${apiKey}`;
      const playlistRes = await fetch(playlistUrl);
      if (playlistRes.ok) {
        const playlistJson = await playlistRes.json();
        const videoIds = (playlistJson.items || [])
          .map((pItem: any) => pItem.contentDetails?.videoId)
          .filter(Boolean);

        if (videoIds.length > 0) {
          // Fetch full video details for duration and views
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
          const videoDetailsRes = await fetch(videoDetailsUrl);
          if (videoDetailsRes.ok) {
            const videoDetailsJson = await videoDetailsRes.json();
            for (const vItem of videoDetailsJson.items || []) {
              const vSnippet = vItem.snippet;
              const vStats = vItem.statistics;
              const vContent = vItem.contentDetails;
              const durationInfo = parseIsoDuration(vContent.duration || 'PT0S');

              recentVideos.push({
                id: `v-${vItem.id}`,
                youtubeId: vItem.id,
                title: vSnippet.title,
                channelId: channelId,
                channelTitle: channel.title,
                channelAvatarUrl: channel.avatarUrl,
                thumbnailUrl:
                  vSnippet.thumbnails?.maxres?.url ||
                  vSnippet.thumbnails?.high?.url ||
                  vSnippet.thumbnails?.medium?.url ||
                  '',
                publishedAt: vSnippet.publishedAt,
                duration: durationInfo.formatted,
                durationSeconds: durationInfo.seconds,
                viewCount: formatCount(vStats?.viewCount || 0),
                viewCountNumber: parseInt(vStats?.viewCount || '0', 10),
                tags: channel.tags,
                description: vSnippet.description || '',
              });
            }
          }
        }
      }
    } catch (vErr) {
      console.warn('Could not fetch uploads playlist for channel:', vErr);
    }
  }

  return { channel, recentVideos };
}

/**
 * Fetch the authenticated user's private YouTube subscriptions using OAuth Bearer access token
 */
export async function fetchUserSubscriptions(
  accessToken: string,
  onProgress?: (count: number) => void
): Promise<Channel[]> {
  if (!accessToken) {
    throw new Error('OAuth access token is missing. Please sign in with Google.');
  }

  const channels: Channel[] = [];
  let nextPageToken: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 4; // Fetch up to 200 subscriptions in 1-click

  do {
    let url = `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet,contentDetails&mine=true&maxResults=50`;
    if (nextPageToken) {
      url += `&pageToken=${encodeURIComponent(nextPageToken)}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      throw new Error(
        errJson?.error?.message ||
          `YouTube API returned error (${res.status}): Failed to fetch subscriptions.`
      );
    }

    const data = await res.json();
    const items = data.items || [];

    for (const item of items) {
      const snippet = item.snippet;
      const channelId = snippet?.resourceId?.channelId;
      if (!channelId) continue;

      const title = snippet.title || 'Untitled Channel';
      const avatarUrl =
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

      const handle = `@${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      channels.push({
        id: channelId,
        title,
        handle,
        avatarUrl,
        description: snippet.description || '',
        subscriberCount: 'Subscribed',
        folderId: null, // Initial uncategorized
        tags: ['youtube'],
        youtubeUrl: `https://youtube.com/channel/${channelId}`,
      });
    }

    if (onProgress) {
      onProgress(channels.length);
    }

    nextPageToken = data.nextPageToken;
    pageCount++;
  } while (nextPageToken && pageCount < maxPages);

  return channels;
}

/**
 * Parses YouTube subscriptions.csv (from Google Takeout or YouTube subscription manager)
 */
export function parseYouTubeTakeoutCsv(csvText: string, targetFolderId: string | null = null): Channel[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const channels: Channel[] = [];

  const headerCols = header.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  const idIdx = headerCols.findIndex((c) => c.includes('channel id') || c === 'id');
  const urlIdx = headerCols.findIndex((c) => c.includes('channel url') || c === 'url');
  const titleIdx = headerCols.findIndex(
    (c) => c.includes('channel title') || c.includes('title') || c.includes('name')
  );

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // CSV column parser supporting quotes
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line))) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    const channelId = idIdx !== -1 && matches[idIdx] ? matches[idIdx] : `ch-takeout-${i}`;
    const channelUrl =
      urlIdx !== -1 && matches[urlIdx]
        ? matches[urlIdx]
        : `https://youtube.com/channel/${channelId}`;
    const title =
      titleIdx !== -1 && matches[titleIdx]
        ? matches[titleIdx]
        : matches[2] || matches[0] || `Subscribed Channel ${i}`;

    if (!title || title.toLowerCase() === 'channel title') continue;

    const handle = `@${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    channels.push({
      id: channelId,
      title,
      handle,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      description: 'Imported from YouTube subscriptions file.',
      subscriberCount: 'Subscribed',
      folderId: targetFolderId,
      tags: ['youtube', 'takeout'],
      youtubeUrl: channelUrl,
    });
  }

  return channels;
}


