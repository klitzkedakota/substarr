import React, { useState, useEffect } from 'react';
import { Channel, Folder as FolderType } from '../types';
import {
  googleSignIn,
  getAccessToken,
  setCachedAccessToken,
  logout,
  initAuth,
  firebaseConfig,
} from '../services/auth';
import {
  fetchUserSubscriptions,
  parseYouTubeTakeoutCsv,
} from '../services/youtubeApi';
import { User } from 'firebase/auth';
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Folder as FolderIconLucide,
  Users,
  LogOut,
  CheckSquare,
  Square,
  ShieldCheck,
  Tv,
  FileSpreadsheet,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Key,
} from 'lucide-react';

interface OAuthImportModalProps {
  folders: FolderType[];
  onClose: () => void;
  onImportChannels: (newChannels: Channel[]) => void;
}

export const OAuthImportModal: React.FC<OAuthImportModalProps> = ({
  folders,
  onClose,
  onImportChannels,
}) => {
  const [activeTab, setActiveTab] = useState<'oauth' | 'csv' | 'token'>('oauth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getAccessToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedChannels, setFetchedChannels] = useState<Channel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetFolderId, setTargetFolderId] = useState<string>('none');
  const [customTag, setCustomTag] = useState('youtube');
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');

  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info' | null;
    title?: string;
    text: string;
    hint?: string;
  }>({ type: null, text: '' });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMsg({ type: null, text: '' });
    try {
      const res = await googleSignIn();
      if (res) {
        if (res.user) setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setStatusMsg({
          type: 'success',
          text: `Connected with Google (${res.method.toUpperCase()}). Fetching your subscriptions now...`,
        });
        handleFetchSubscriptions(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let title = 'Google Authorization Issue';
      let text = err.message || 'OAuth popup failed or was cancelled.';
      let hint = '';

      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        title = 'Preview Domain Not Yet Authorized in Firebase';
        text = `This preview container origin (${window.location.origin}) needs to be authorized in Firebase Console.`;
        hint =
          'You can add this domain to Firebase Console > Authentication > Settings > Authorized domains, OR use the "CSV Import" tab below to load all your subscriptions instantly without OAuth configuration!';
      } else if (err.code === 'auth/operation-not-allowed') {
        title = 'Google Provider Not Enabled in Firebase';
        text = 'Google Sign-in provider is disabled in Firebase Authentication for this project.';
        hint =
          'Enable Google in Firebase Console > Authentication > Sign-in method, or use the CSV Import tab.';
      } else if (err.code === 'auth/popup-blocked') {
        title = 'Popup Blocked';
        text = 'The browser blocked the Google authorization window.';
        hint = 'Please click the icon in your address bar to allow popups for this site, then try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        title = 'Sign-in Cancelled';
        text = 'The authorization popup was closed before completing.';
      } else if (err.message?.includes('origin_mismatch')) {
        title = 'OAuth Client Origin Mismatch';
        text = `Google Cloud OAuth client does not have this origin in its Authorized JavaScript Origins.`;
        hint =
          'Add this URL to Google Cloud Console > Credentials > OAuth 2.0 Client IDs, or use the instant Subscriptions CSV import below.';
      }

      setStatusMsg({
        type: 'error',
        title,
        text,
        hint,
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setFetchedChannels([]);
    setSelectedIds(new Set());
    setStatusMsg({ type: 'info', text: 'Signed out successfully.' });
  };

  const handleFetchSubscriptions = async (tokenOverride?: string) => {
    const token = tokenOverride || accessToken || getAccessToken();
    if (!token) {
      setStatusMsg({
        type: 'error',
        text: 'No active Google session. Please sign in with Google or paste a Bearer token.',
      });
      return;
    }

    setIsFetching(true);
    setStatusMsg({ type: 'info', text: 'Fetching your subscribed channels from YouTube...' });
    try {
      const subs = await fetchUserSubscriptions(token, (count) => {
        setStatusMsg({ type: 'info', text: `Loaded ${count} subscriptions from YouTube...` });
      });

      if (subs.length === 0) {
        setStatusMsg({
          type: 'info',
          text: 'No subscriptions found on this YouTube account.',
        });
      } else {
        setFetchedChannels(subs);
        setSelectedIds(new Set(subs.map((s) => s.id)));
        setStatusMsg({
          type: 'success',
          text: `Found ${subs.length} subscribed channels! Review and import below.`,
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: 'error',
        text: err.message || 'Failed to fetch YouTube subscriptions with current token.',
        hint: 'Verify the token has the "https://www.googleapis.com/auth/youtube.readonly" scope.',
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTokenInput.trim()) return;
    const clean = manualTokenInput.trim().replace(/^Bearer\s+/i, '');
    setCachedAccessToken(clean);
    setAccessToken(clean);
    handleFetchSubscriptions(clean);
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseYouTubeTakeoutCsv(
        content,
        targetFolderId === 'none' ? null : targetFolderId
      );
      if (parsed.length > 0) {
        setFetchedChannels(parsed);
        setSelectedIds(new Set(parsed.map((p) => p.id)));
        setStatusMsg({
          type: 'success',
          text: `Parsed ${parsed.length} channels from ${file.name}! Ready to import into your workspace.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Could not find channels in this file. Make sure it is a subscriptions.csv from YouTube.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === fetchedChannels.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fetchedChannels.map((c) => c.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExecuteImport = () => {
    const toImport = fetchedChannels
      .filter((c) => selectedIds.has(c.id))
      .map((c) => ({
        ...c,
        folderId: targetFolderId === 'none' ? null : targetFolderId,
        tags: customTag.trim() ? [customTag.trim().toLowerCase()] : ['imported'],
      }));

    if (toImport.length === 0) {
      setStatusMsg({ type: 'error', text: 'Please select at least one channel to import.' });
      return;
    }

    onImportChannels(toImport);
    setStatusMsg({
      type: 'success',
      text: `Successfully imported ${toImport.length} channels into your workspace!`,
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#0f1013] border border-white/[0.1] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-white/[0.07] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span>1-Click YouTube Subscriptions Sync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-md hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.07] px-6 bg-[#0c0d10]">
          <button
            type="button"
            onClick={() => setActiveTab('oauth')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors mr-5 ${
              activeTab === 'oauth'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Google 1-Click OAuth
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors mr-5 flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>YouTube CSV Import (Instant)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'token'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Paste Token
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Status feedback banner */}
          {statusMsg.text && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : statusMsg.type === 'error'
                  ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                  : 'bg-white/[0.04] text-neutral-300 border border-white/[0.08]'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : statusMsg.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed min-w-0">
                {statusMsg.title && (
                  <strong className="block font-semibold mb-0.5 text-white">
                    {statusMsg.title}
                  </strong>
                )}
                <span>{statusMsg.text}</span>
                {statusMsg.hint && (
                  <p className="mt-1 text-[11px] text-neutral-400 leading-normal">
                    💡 {statusMsg.hint}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: GOOGLE OAUTH */}
          {activeTab === 'oauth' && (
            <div className="space-y-4">
              {!accessToken ? (
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.07] flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-600/15 border border-red-500/25 flex items-center justify-center text-red-500">
                    <Tv className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Sign in with your Google Account
                    </h3>
                    <p className="text-xs text-neutral-400 max-w-sm mt-1 leading-relaxed">
                      Authorizes substarr to query your subscribed YouTube channels in one click.
                    </p>
                  </div>

                  {/* Official Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-800 text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
                    ) : (
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                    )}
                    <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>

                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Read-only YouTube permission · In-memory token storage</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Google Session Connected
                      </span>
                      <span className="text-[11px] text-neutral-400 block font-mono">
                        OAuth token active
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleFetchSubscriptions()}
                      disabled={isFetching}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isFetching ? 'Fetching...' : 'Re-fetch Subscriptions'}</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      title="Clear session"
                      className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Origin Helper Card */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-neutral-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300 font-medium">
                    Current Preview Origin:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOrigin}
                    className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[10px]"
                  >
                    {copiedOrigin ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <code className="text-neutral-300 block truncate font-mono text-[10px] bg-black/30 p-1 rounded">
                  {window.location.origin}
                </code>
              </div>
            </div>
          )}

          {/* TAB 2: INSTANT YOUTUBE CSV IMPORT (Zero hurdle) */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    1-Click YouTube Subscriptions Export
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                    YouTube provides a direct download of all your subscribed channels in a CSV file.
                    No Google Cloud authentication, popups, or domain authorization required!
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-red-600/10 border border-red-500/20 text-xs text-red-300 flex items-center justify-between">
                  <span>1. Download your subscriptions file:</span>
                  <a
                    href="https://takeout.google.com/takeout/custom/youtube"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-[11px] flex items-center gap-1"
                  >
                    <span>Google Takeout</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* File drop zone */}
                <label className="border-2 border-dashed border-white/[0.15] hover:border-white/[0.3] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/[0.02]">
                  <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                  <span className="text-xs font-semibold text-white">
                    Drop or Choose `subscriptions.csv`
                  </span>
                  <span className="text-[10px] text-neutral-500 mt-0.5">
                    Exports from YouTube / Google Takeout
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PASTE TOKEN */}
          {activeTab === 'token' && (
            <form onSubmit={handleManualTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Google OAuth Bearer Access Token:
                </label>
                <input
                  type="password"
                  placeholder="ya29.a0AfH6SM..."
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg p-2.5 text-xs text-white font-mono placeholder-neutral-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Paste an OAuth token with `youtube.readonly` scope (e.g. from Google OAuth Playground).
                </span>
              </div>

              <button
                type="submit"
                disabled={!manualTokenInput.trim() || isFetching}
                className="w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {isFetching ? 'Fetching Subscriptions...' : 'Fetch Subscriptions with Token'}
              </button>
            </form>
          )}

          {/* Subscriptions Preview & Import Selection */}
          {fetchedChannels.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-white/[0.07]">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Assign all to Folder:
                  </label>
                  <select
                    value={targetFolderId}
                    onChange={(e) => setTargetFolderId(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-md px-2.5 py-1.5 text-white text-xs"
                  >
                    <option value="none">Uncategorized</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1 text-[11px]">
                    Default Tag:
                  </label>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="youtube"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-md px-2.5 py-1.5 text-white text-xs placeholder-neutral-500"
                  />
                </div>
              </div>

              {/* Selection Header */}
              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 text-neutral-300 hover:text-white font-medium transition-colors"
                >
                  {selectedIds.size === fetchedChannels.length ? (
                    <CheckSquare className="w-4 h-4 text-red-500" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-500" />
                  )}
                  <span>
                    Select All ({selectedIds.size}/{fetchedChannels.length})
                  </span>
                </button>

                <span className="text-[11px] text-neutral-500 font-mono">
                  {selectedIds.size} selected
                </span>
              </div>

              {/* Scrollable list of subscriptions */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1 rounded-xl bg-black/20 p-2 border border-white/[0.05]">
                {fetchedChannels.map((ch) => {
                  const isChecked = selectedIds.has(ch.id);
                  return (
                    <div
                      key={ch.id}
                      onClick={() => handleToggleSelectOne(ch.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isChecked
                          ? 'bg-white/[0.06] text-white'
                          : 'bg-white/[0.01] text-neutral-400 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-red-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                        )}
                        <img
                          src={ch.avatarUrl}
                          alt={ch.title}
                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/10"
                        />
                        <span className="truncate font-medium">{ch.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[120px] ml-2">
                        {ch.handle}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Import {selectedIds.size} Channels into Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
