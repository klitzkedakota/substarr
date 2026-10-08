import { Channel, Video } from '../types';

export interface ChannelFetchResult {
  channel: Channel;
  recentVideos: Video[];
}

/**
 * Upper bound for treating an upload as a Short.
 *
 * YouTube raised the Shorts ceiling to 3 minutes in late 2024, but a 3-minute
 * cutoff would also swallow plenty of genuine long-form uploads. 60s stays the
 * safe duration heuristic; the UULF playlist below does the precise filtering
 * and this only backstops it.
 */
export const SHORTS_MAX_SECONDS = 60;

/**
 * True when an upload looks like a Short.
 *
 * A zero duration means an upcoming premiere or a live stream, never a Short,
 * so it is excluded from the duration test.
 */
export function isShortVideo(
  video: Pick<Video, 'durationSeconds' | 'title' | 'description'>
): boolean {
  if (video.durationSeconds > 0 && video.durationSeconds <= SHORTS_MAX_SECONDS) return true;
  return /#shorts?\b/i.test((video.title || '') + ' ' + (video.description || ''));
}

/** Drops every Short from a video list. */
export function withoutShorts(videos: Video[]): Video[] {
  return videos.filter((v) => !isShortVideo(v));
}

/**
 * UU<id> is a channel's full uploads playlist, Shorts included. The
 * undocumented UULF<id> sibling holds long-form uploads only, which keeps
 * Shorts out server-side instead of spending quota to fetch and discard them.
 */
function longFormPlaylistId(channelId: string): string | null {
  return channelId.startsWith('UC') ? `UULF${channelId.slice(2)}` : null;
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

interface VideoChannelContext {
  channelId: string;
  channelTitle: string;
  channelAvatarUrl: string;
  tags: string[];
}

/**
 * Reverses formatCount() so a stored display string like "15.2M" stays sortable.
 * Channels only persist the formatted string, so this is the numeric sort key.
 */
export function parseCountToNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const trimmed = value.trim().replace(/,/g, '');
  const match = trimmed.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) {
    const plain = parseInt(trimmed, 10);
    return isNaN(plain) ? 0 : plain;
  }

  const base = parseFloat(match[1]);
  if (isNaN(base)) return 0;

  const suffix = (match[2] || '').toUpperCase();
  const multiplier = suffix === 'B' ? 1_000_000_000 : suffix === 'M' ? 1_000_000 : suffix === 'K' ? 1_000 : 1;
  return Math.round(base * multiplier);
}

/**
 * Maps raw videos.list items onto the Video shape.
 */
function mapVideoDetailItems(items: any[], ctx: VideoChannelContext): Video[] {
  const mapped: Video[] = [];

  for (const vItem of items || []) {
    const vSnippet = vItem.snippet;
    const vStats = vItem.statistics;
    const vContent = vItem.contentDetails;
    if (!vSnippet) continue;

    const durationInfo = parseIsoDuration(vContent?.duration || 'PT0S');

    mapped.push({
      id: `v-${vItem.id}`,
      youtubeId: vItem.id,
      title: vSnippet.title,
      channelId: ctx.channelId,
      channelTitle: ctx.channelTitle,
      channelAvatarUrl: ctx.channelAvatarUrl,
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
      tags: ctx.tags,
      description: vSnippet.description || '',
    });
  }

  // Shorts never enter the workspace, whichever playlist they arrived from.
  return withoutShorts(mapped);
}

/**
 * Resolves an uploads playlist into hydrated Video records.
 * Costs 2 quota units: one playlistItems.list plus one videos.list.
 *
 * Returns null when the playlist does not exist, which is how a missing UULF
 * long-form playlist is detected so the caller can fall back.
 */
async function fetchUploadsFromPlaylist(
  uploadsPlaylistId: string,
  apiKey: string,
  ctx: VideoChannelContext,
  maxResults: number = 8
): Promise<Video[] | null> {
  // Ask for extra rows so a Shorts-heavy playlist still yields maxResults
  // long-form videos after filtering. 50 is the API's per-page ceiling.
  const fetchCount = Math.min(50, Math.max(maxResults, maxResults * 3));

  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
    uploadsPlaylistId
  )}&maxResults=${fetchCount}&key=${apiKey}`;

  const playlistRes = await fetch(playlistUrl);
  if (playlistRes.status === 404) return null;
  if (!playlistRes.ok) {
    const errJson = await playlistRes.json().catch(() => null);
    throw new Error(
      errJson?.error?.message || `YouTube API returned status ${playlistRes.status} for uploads playlist.`
    );
  }

  const playlistJson = await playlistRes.json();
  const videoIds = (playlistJson.items || [])
    .map((pItem: any) => pItem.contentDetails?.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return [];

  const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(
    ','
  )}&key=${apiKey}`;
  const videoDetailsRes = await fetch(videoDetailsUrl);
  if (!videoDetailsRes.ok) {
    const errJson = await videoDetailsRes.json().catch(() => null);
    throw new Error(
      errJson?.error?.message || `YouTube API returned status ${videoDetailsRes.status} for video details.`
    );
  }

  const videoDetailsJson = await videoDetailsRes.json();
  return mapVideoDetailItems(videoDetailsJson.items, ctx).slice(0, maxResults);
}

/**
 * Pulls long-form uploads for a channel, preferring the UULF playlist and
 * falling back to the full UU uploads playlist when it is unavailable.
 */
async function fetchLongFormUploads(
  channelId: string,
  fallbackPlaylistId: string,
  apiKey: string,
  ctx: VideoChannelContext,
  maxResults: number
): Promise<Video[]> {
  const longForm = longFormPlaylistId(channelId);

  if (longForm) {
    const viaLongForm = await fetchUploadsFromPlaylist(longForm, apiKey, ctx, maxResults);
    if (viaLongForm !== null) return viaLongForm;
  }

  // No long-form playlist for this channel: fall back to all uploads, where
  // mapVideoDetailItems still strips anything that looks like a Short.
  const viaUploads = await fetchUploadsFromPlaylist(fallbackPlaylistId, apiKey, ctx, maxResults);
  if (viaUploads === null) {
    throw new Error(`Uploads playlist not found for channel "${ctx.channelTitle || channelId}".`);
  }
  return viaUploads;
}

/**
 * Refreshes recent uploads for an already-imported channel.
 *
 * A channel's uploads playlist is its ID with the leading `UC` swapped for `UU`,
 * so the usual channels.list lookup is skipped — 2 quota units instead of 3.
 * Non-standard IDs fall back to resolving the playlist explicitly.
 */
export async function fetchChannelUploads(
  channel: Channel,
  apiKey: string,
  maxResults: number = 8
): Promise<Video[]> {
  if (!apiKey) {
    throw new Error('Please configure a valid YouTube Data API v3 key in API Settings.');
  }

  const ctx: VideoChannelContext = {
    channelId: channel.id,
    channelTitle: channel.title,
    channelAvatarUrl: channel.avatarUrl,
    tags: channel.tags,
  };

  if (channel.id.startsWith('UC')) {
    return fetchLongFormUploads(channel.id, `UU${channel.id.slice(2)}`, apiKey, ctx, maxResults);
  }

  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(
    channel.id
  )}&key=${apiKey}`;
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) {
    const errJson = await channelRes.json().catch(() => null);
    throw new Error(
      errJson?.error?.message || `YouTube API returned status ${channelRes.status} for channel query.`
    );
  }

  const channelJson = await channelRes.json();
  const uploadsPlaylistId = channelJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error(`No uploads playlist found for "${channel.title}".`);
  }

  return fetchLongFormUploads(channel.id, uploadsPlaylistId, apiKey, ctx, maxResults);
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

  let recentVideos: Video[] = [];

  // Fetch recent uploads from the uploads playlist
  if (uploadsPlaylistId) {
    try {
      recentVideos = await fetchLongFormUploads(
        channelId,
        uploadsPlaylistId,
        apiKey,
        {
          channelId,
          channelTitle: channel.title,
          channelAvatarUrl: channel.avatarUrl,
          tags: channel.tags,
        },
        8
      );
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
  // A YouTube account caps out around 2,000 subscriptions; 50 pages x 50 rows
  // covers that with headroom and exists only as a runaway-loop guard.
  const maxPages = 50;

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


