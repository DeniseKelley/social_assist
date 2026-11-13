import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Upload,
  Film,
  Image as ImageIcon,
  FileText,
  Clock,
  Check,
  Copy,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  ExternalLink,
  X,
  Layers,
  Flame,
  Eye,
  Cloud,
  RefreshCw,
  Database,
} from 'lucide-react';
import { supabase } from './supabase';

const TEMP_BUCKET = 'scheduled-media';
const MAX_TEMP_FILE_BYTES = 50 * 1024 * 1024; // 50 MB Supabase Free Tier cap

export const SUPABASE_SETUP_SQL = `-- SocialAssist: Temporary Media Storage & Multi-Platform Scheduler Setup
-- Paste into Supabase SQL Editor -> Click "Run"

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scheduled-media',
  'scheduled-media',
  true,
  52428800,
  array['video/mp4','video/quicktime','video/webm','image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can fetch pending scheduled media" on storage.objects;
create policy "Public can fetch pending scheduled media"
  on storage.objects for select using (bucket_id = 'scheduled-media');

drop policy if exists "Users upload own temp scheduled media" on storage.objects;
create policy "Users upload own temp scheduled media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'scheduled-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own temp scheduled media" on storage.objects;
create policy "Users update own temp scheduled media"
  on storage.objects for update to authenticated
  using (bucket_id = 'scheduled-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own temp scheduled media" on storage.objects;
create policy "Users delete own temp scheduled media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'scheduled-media' and (storage.foldername(name))[1] = auth.uid()::text);

create table if not exists public.scheduled_posts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  caption text not null default '',
  captions jsonb not null default '{}'::jsonb,
  format text not null default 'video',
  platforms jsonb not null default '["instagram"]'::jsonb,
  media_urls jsonb not null default '[]'::jsonb,
  storage_paths jsonb not null default '[]'::jsonb,
  scheduled_date text not null default '',
  scheduled_time text not null default '18:00',
  scheduled_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  status text not null default 'scheduled',
  first_comment text not null default '',
  auto_dm_keyword text not null default '',
  auto_dm_url text not null default '',
  auto_cleanup boolean not null default true,
  media_cleaned_up boolean not null default false,
  dispatch_results jsonb not null default '[]'::jsonb,
  last_dispatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scheduled_posts_due on public.scheduled_posts (status, scheduled_at);
create index if not exists idx_scheduled_posts_expiry on public.scheduled_posts (media_cleaned_up, expires_at);
alter table public.scheduled_posts enable row level security;

drop policy if exists "Users manage own scheduled posts" on public.scheduled_posts;
create policy "Users manage own scheduled posts"
  on public.scheduled_posts for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.user_platform_tokens (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  tokens jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_platform_tokens enable row level security;

drop policy if exists "Users manage own platform tokens" on public.user_platform_tokens;
create policy "Users manage own platform tokens"
  on public.user_platform_tokens for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);`;

export const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    short: 'IG',
    sub: 'Reels • Carousel • Post',
    maxChars: 2200,
    badgeBg: 'bg-[#FF7EB6]',
    badgeText: 'text-[#19154E]',
    composerUrl: 'https://www.instagram.com/',
    tokenHint: 'Uses your Connect IG Graph API token automatically (or override here).',
    needsAccountId: false,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    short: 'TT',
    sub: '9:16 Video • Photo Mode',
    maxChars: 2200,
    badgeBg: 'bg-[#19154E]',
    badgeText: 'text-[#C8F904]',
    composerUrl: 'https://www.tiktok.com/tiktokstudio/upload',
    tokenHint: 'TikTok Content Posting API v2 OAuth Bearer token.',
    needsAccountId: false,
  },
  {
    id: 'youtube',
    name: 'YouTube Shorts',
    short: 'YT',
    sub: 'Shorts • Long Video',
    maxChars: 100,
    badgeBg: 'bg-[#FF5A5F]',
    badgeText: 'text-white',
    composerUrl: 'https://studio.youtube.com/',
    tokenHint: 'YouTube Data API v3 OAuth 2.0 Bearer token.',
    needsAccountId: false,
  },
  {
    id: 'threads',
    name: 'Threads',
    short: 'TH',
    sub: 'Threads • Media Post',
    maxChars: 500,
    badgeBg: 'bg-[#E2D4FF]',
    badgeText: 'text-[#19154E]',
    composerUrl: 'https://www.threads.net/',
    tokenHint: 'Meta Threads Graph API (graph.threads.net) user token.',
    needsAccountId: false,
  },
  {
    id: 'x',
    name: 'X / Twitter',
    short: 'X',
    sub: 'Post • Video • Images',
    maxChars: 280,
    badgeBg: 'bg-[#C8F904]',
    badgeText: 'text-[#19154E]',
    composerUrl: 'https://x.com/compose/post',
    tokenHint: 'X API v2 OAuth 2.0 User Access Token (tweet.write).',
    needsAccountId: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    short: 'IN',
    sub: 'Creator Post • Video',
    maxChars: 3000,
    badgeBg: 'bg-[#93C5FD]',
    badgeText: 'text-[#19154E]',
    composerUrl: 'https://www.linkedin.com/feed/',
    tokenHint: 'LinkedIn OAuth 2.0 token + Person/Org URN ID.',
    needsAccountId: true,
    accountIdLabel: 'Person or Org URN (e.g. urn:li:person:AbCdEf)',
  },
  {
    id: 'facebook',
    name: 'Facebook Page',
    short: 'FB',
    sub: 'Reels • Page Feed',
    maxChars: 5000,
    badgeBg: 'bg-[#BAE6FD]',
    badgeText: 'text-[#19154E]',
    composerUrl: 'https://business.facebook.com/latest/composer',
    tokenHint: 'Facebook Page Access Token + Page ID.',
    needsAccountId: true,
    accountIdLabel: 'Facebook Page ID',
  },
];

const FORMAT_OPTIONS = [
  { id: 'video', label: 'Video / Reel', sub: '9:16 or 16:9', icon: Film },
  { id: 'carousel', label: 'Carousel', sub: '2–10 slides', icon: Layers },
  { id: 'image', label: 'Single Image', sub: 'Photo / Graphic', icon: ImageIcon },
  { id: 'text', label: 'Text / Thread', sub: 'No media needed', icon: FileText },
];

const PEAK_WINDOWS_BY_DOW = {
  0: { time: '17:30', label: '5:30 PM EST', score: 96, tag: '🔥 Sun Prime' },
  1: { time: '12:15', label: '12:15 PM EST', score: 88, tag: '⚡ Lunch Scroll' },
  2: { time: '18:00', label: '6:00 PM EST', score: 98, tag: '🔥 #1 Peak' },
  3: { time: '18:30', label: '6:30 PM EST', score: 91, tag: '✨ Midweek Lift' },
  4: { time: '18:00', label: '6:00 PM EST', score: 97, tag: '🔥 Thu Spike' },
  5: { time: '12:00', label: '12:00 PM EST', score: 86, tag: '⚡ Fri Midday' },
  6: { time: '11:00', label: '11:00 AM EST', score: 89, tag: '✨ Sat Morning' },
};

const HEATMAP_HOURS = [
  { hour: '09:00', label: '9 AM', scores: [72, 78, 81, 79, 82, 80, 88] },
  { hour: '12:00', label: '12 PM', scores: [80, 89, 91, 88, 90, 87, 85] },
  { hour: '15:00', label: '3 PM', scores: [76, 82, 84, 85, 86, 83, 79] },
  { hour: '18:00', label: '6 PM', scores: [96, 92, 98, 93, 97, 84, 82] },
  { hour: '20:30', label: '8:30 PM', scores: [91, 87, 92, 89, 90, 78, 80] },
];

function toDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime12h(hhmm) {
  if (!hhmm || !hhmm.includes(':')) return '6:00 PM';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr} ${suffix}`;
}

function buildScheduledIso(dateStr, timeStr) {
  const cleanDate = dateStr || toDateKey(new Date());
  const cleanTime = timeStr && timeStr.includes(':') ? timeStr : '18:00';
  const dt = new Date(`${cleanDate}T${cleanTime}:00`);
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

function hydrateMediaItemsFromRow(row) {
  if (Array.isArray(row.media_items) && row.media_items.length > 0) {
    return row.media_items;
  }
  const urls = Array.isArray(row.media_urls) ? row.media_urls : [];
  const paths = Array.isArray(row.storage_paths) ? row.storage_paths : [];
  return urls.map((url, idx) => {
    const isVid =
      /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url) || (row.format === 'video' && urls.length === 1);
    return {
      id: `cloud-${row.id}-${idx}`,
      url,
      type: isVid ? 'video' : 'image',
      name: (paths[idx] || url).split('/').pop()?.split('?')[0] || `Slide ${idx + 1}`,
      isRemote: true,
      storagePath: paths[idx] || '',
    };
  });
}

function adaptCaptionForPlatform(platformId, baseCaption, dmKeyword) {
  const raw = (baseCaption || '').trim();
  if (!raw) return '';
  const lines = raw.split('\n').filter(Boolean);
  const hook = lines[0] || raw.slice(0, 90);
  const bodyNoTags = raw.replace(/#\S+/g, '').trim();
  const ctaLine = dmKeyword
    ? `\n\n💬 Comment "${dmKeyword.toUpperCase()}" and I'll DM you the link!`
    : '';

  switch (platformId) {
    case 'instagram':
      return `${bodyNoTags}${ctaLine}\n\n#creator #techfairylab #reels #buildinpublic`.slice(0, 2200);
    case 'tiktok':
      return `${hook}\n\n${lines.slice(1).join('\n').replace(/#\S+/g, '').trim()}${
        dmKeyword ? `\n\nDrop "${dmKeyword.toUpperCase()}" in the comments! ✨` : ''
      }\n#fyp #creatortips #tech`.slice(0, 2200);
    case 'youtube': {
      const cleanHook = hook.replace(/#\S+/g, '').trim();
      const suffix = ' #Shorts';
      return `${cleanHook.slice(0, 100 - suffix.length)}${suffix}`;
    }
    case 'threads':
      return `${bodyNoTags}${dmKeyword ? `\n\nReply "${dmKeyword.toUpperCase()}" if you want the link 👇` : ''}`.slice(
        0,
        500
      );
    case 'x': {
      const xSuffix = dmKeyword ? `\n\nReply "${dmKeyword.toUpperCase()}" for the link ✨` : '';
      const budget = 280 - xSuffix.length;
      const trimmed =
        bodyNoTags.length > budget ? `${bodyNoTags.slice(0, budget - 1).trim()}…` : bodyNoTags;
      return `${trimmed}${xSuffix}`;
    }
    case 'linkedin':
      return `${hook}\n\n${lines
        .slice(1)
        .join('\n\n')
        .replace(/#\S+/g, '')
        .trim()}\n\nWhat workflow are you testing this week? 👇\n\n#CreatorEconomy #Automation #SocialStrategy`.slice(
        0,
        3000
      );
    case 'facebook':
      return `${bodyNoTags}${ctaLine}`.slice(0, 5000);
    default:
      return raw;
  }
}

export default function PlannerCalendar({
  scopedKey,
  igHandle,
  igAccessToken,
  igAccountId,
  sharedTokensMap = {},
  onCreateAutoDmFlow,
  showToast,
  triggerFairyWand,
}) {
  const today = new Date();
  const todayKey = toDateKey(today);

  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week'
  const [cursorDate, setCursorDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [platformFilter, setPlatformFilter] = useState('all');
  const [posts, setPosts] = useState([]);
  const [platformTokens, setPlatformTokens] = useState({});
  const [showTokensModal, setShowTokensModal] = useState(false);

  // Supabase Temporary Cloud Storage & Queue state
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [supabaseStatus, setSupabaseStatus] = useState('checking'); // 'checking' | 'connected' | 'needs_setup'
  const [showSetupSqlModal, setShowSetupSqlModal] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  // Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [format, setFormat] = useState('video');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['instagram', 'tiktok', 'youtube']);
  const [title, setTitle] = useState('');
  const [masterCaption, setMasterCaption] = useState('');
  const [captionOverrides, setCaptionOverrides] = useState({});
  const [activeCaptionTab, setActiveCaptionTab] = useState('master');
  const [firstComment, setFirstComment] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayKey);
  const [scheduledTime, setScheduledTime] = useState('18:00');
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [mediaItems, setMediaItems] = useState([]); // [{ id, url, type, name, isRemote, storagePath, uploading }]
  const [remoteUrlInput, setRemoteUrlInput] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState('instagram');
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // Optional 1-click Auto-DM integration
  const [attachDmTrigger, setAttachDmTrigger] = useState(false);
  const [dmKeyword, setDmKeyword] = useState('LINK');
  const [dmTargetUrl, setDmTargetUrl] = useState('https://techfairylab.com');

  const [publishing, setPublishing] = useState(false);
  const [draggedPostId, setDraggedPostId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);
  const autoDispatchingIdsRef = useRef(new Set());
  const postsRef = useRef(posts);
  postsRef.current = posts;

  const checkAndLoadSupabase = async () => {
    setSupabaseStatus('checking');
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user || null;
      setSupabaseUser(user);

      if (!user) {
        setSupabaseStatus('needs_setup');
        return;
      }

      const { data: rows, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) {
        setSupabaseStatus('needs_setup');
        return;
      }

      setSupabaseStatus('connected');
      if (Array.isArray(rows) && rows.length > 0) {
        const hydrated = rows.map((r) => ({
          ...r,
          media_items: hydrateMediaItemsFromRow(r),
        }));
        setPosts(hydrated);
        localStorage.setItem(scopedKey('sa_scheduled_posts'), JSON.stringify(hydrated));
      }

      const { data: tokRow } = await supabase
        .from('user_platform_tokens')
        .select('tokens')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tokRow?.tokens && typeof tokRow.tokens === 'object') {
        setPlatformTokens((prev) => {
          const merged = { ...prev, ...tokRow.tokens };
          localStorage.setItem(scopedKey('sa_platform_tokens'), JSON.stringify(merged));
          return merged;
        });
      }
    } catch {
      setSupabaseStatus('needs_setup');
    }
  };

  useEffect(() => {
    const savedPostsRaw = localStorage.getItem(scopedKey('sa_scheduled_posts'));
    if (savedPostsRaw) {
      try {
        const parsed = JSON.parse(savedPostsRaw);
        if (Array.isArray(parsed)) setPosts(parsed);
      } catch {
        // ignore malformed local cache
      }
    }

    const savedTokensRaw = localStorage.getItem(scopedKey('sa_platform_tokens'));
    if (savedTokensRaw) {
      try {
        setPlatformTokens(JSON.parse(savedTokensRaw) || {});
      } catch {
        setPlatformTokens({});
      }
    }

    checkAndLoadSupabase();
  }, [scopedKey]);

  // Live Browser Auto-Scheduler: checks every 25s for due `scheduled` posts & fires them automatically!
  useEffect(() => {
    const checkDuePosts = () => {
      const nowMs = Date.now();
      const currentList = postsRef.current || [];
      currentList.forEach((p) => {
        if (p.status !== 'scheduled') return;
        if (autoDispatchingIdsRef.current.has(p.id)) return;
        const targetIso = p.scheduled_at || buildScheduledIso(p.scheduled_date, p.scheduled_time);
        const dueMs = new Date(targetIso).getTime();
        if (!Number.isNaN(dueMs) && dueMs <= nowMs) {
          autoDispatchingIdsRef.current.add(p.id);
          handlePublishNow(p, { isAutoScheduled: true }).finally(() => {
            autoDispatchingIdsRef.current.delete(p.id);
          });
        }
      });
    };

    const timer = setInterval(checkDuePosts, 25000);
    return () => clearInterval(timer);
  }, [platformTokens, sharedTokensMap, igAccessToken]);

  const persistPostsLocal = (nextPosts) => {
    setPosts(nextPosts);
    localStorage.setItem(scopedKey('sa_scheduled_posts'), JSON.stringify(nextPosts));
  };

  const upsertPostInSupabase = async (record) => {
    if (!supabaseUser) return false;
    try {
      const dbRow = {
        id: record.id,
        user_id: supabaseUser.id,
        title: record.title || '',
        caption: record.caption || '',
        captions: record.captions || {},
        format: record.format || 'video',
        platforms: record.platforms || ['instagram'],
        media_urls: record.media_urls || [],
        storage_paths: record.storage_paths || [],
        scheduled_date: record.scheduled_date || todayKey,
        scheduled_time: record.scheduled_time || '18:00',
        scheduled_at:
          record.scheduled_at || buildScheduledIso(record.scheduled_date, record.scheduled_time),
        expires_at:
          record.expires_at ||
          new Date(
            new Date(
              record.scheduled_at || buildScheduledIso(record.scheduled_date, record.scheduled_time)
            ).getTime() +
              48 * 3600 * 1000
          ).toISOString(),
        status: record.status || 'scheduled',
        first_comment: record.first_comment || '',
        auto_dm_keyword: record.auto_dm_keyword || '',
        auto_dm_url: record.auto_dm_url || '',
        auto_cleanup: record.auto_cleanup !== false,
        media_cleaned_up: Boolean(record.media_cleaned_up),
        dispatch_results: record.dispatch_results || [],
        last_dispatched_at: record.last_dispatched_at || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('scheduled_posts').upsert(dbRow, { onConflict: 'id' });
      if (!error) {
        setSupabaseStatus('connected');
        return true;
      }
    } catch {
      // fallback to local
    }
    return false;
  };

  const deleteTempStoragePaths = async (paths) => {
    const cleanPaths = (paths || []).filter((p) => typeof p === 'string' && p.trim().length > 0);
    if (cleanPaths.length === 0) return 0;
    try {
      const { error } = await supabase.storage.from(TEMP_BUCKET).remove(cleanPaths);
      if (!error) return cleanPaths.length;
    } catch {
      // ignore if already removed
    }
    return 0;
  };

  const isPlatformLiveReady = (platformId) => {
    const sharedTok = (sharedTokensMap?.[platformId] || '').trim();
    if (platformId === 'instagram') {
      return Boolean(
        platformTokens?.instagram?.access_token?.trim() ||
          sharedTok ||
          (igAccessToken && igAccessToken.trim())
      );
    }
    const cfg = platformTokens?.[platformId];
    if (!cfg?.access_token?.trim() && !sharedTok) return false;
    const meta = PLATFORMS.find((p) => p.id === platformId);
    if (meta?.needsAccountId && !cfg?.account_id?.trim()) return false;
    return true;
  };

  const openComposerForSlot = (dateKey, defaultTime) => {
    const dt = new Date(`${dateKey}T12:00:00`);
    const peak = PEAK_WINDOWS_BY_DOW[dt.getDay()]?.time || '18:00';
    setEditingId(null);
    setFormat('video');
    setSelectedPlatforms(['instagram', 'tiktok', 'youtube']);
    setTitle('');
    setMasterCaption('');
    setCaptionOverrides({});
    setActiveCaptionTab('master');
    setFirstComment('');
    setScheduledDate(dateKey || todayKey);
    setScheduledTime(defaultTime || peak);
    setAutoCleanup(true);
    setMediaItems([]);
    setRemoteUrlInput('');
    setPreviewPlatform('instagram');
    setPreviewSlideIdx(0);
    setAttachDmTrigger(false);
    setDmKeyword('LINK');
    setComposerOpen(true);
  };

  const openComposerForEdit = (post) => {
    setEditingId(post.id);
    setFormat(post.format || 'video');
    const plats = post.platforms?.length ? post.platforms : ['instagram'];
    setSelectedPlatforms(plats);
    setTitle(post.title || '');
    setMasterCaption(post.caption || '');
    setCaptionOverrides(post.captions || {});
    setActiveCaptionTab('master');
    setFirstComment(post.first_comment || '');
    setScheduledDate(post.scheduled_date || todayKey);
    setScheduledTime(post.scheduled_time || '18:00');
    setAutoCleanup(post.auto_cleanup !== false);
    setMediaItems(hydrateMediaItemsFromRow(post));
    setRemoteUrlInput('');
    setPreviewPlatform(plats[0] || 'instagram');
    setPreviewSlideIdx(0);
    setAttachDmTrigger(Boolean(post.auto_dm_keyword));
    setDmKeyword(post.auto_dm_keyword || 'LINK');
    setDmTargetUrl(post.auto_dm_url || 'https://techfairylab.com');
    setComposerOpen(true);
  };

  const togglePlatform = (platformId) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platformId)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((p) => p !== platformId);
        if (previewPlatform === platformId) setPreviewPlatform(next[0]);
        return next;
      }
      return [...prev, platformId];
    });
  };

  // Upload files directly to Supabase temporary `scheduled-media` bucket!
  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const oversized = files.find((f) => f.size > MAX_TEMP_FILE_BYTES);
    if (oversized) {
      showToast(
        `"${oversized.name}" exceeds Supabase Free Tier's 50 MB file limit — compress slightly or paste a hosted link.`,
        'error'
      );
      return;
    }

    const batchTs = Date.now();
    const initialSlides = files.map((file, idx) => {
      const isVid = file.type.startsWith('video/');
      return {
        id: `upload-${batchTs}-${idx}`,
        url: URL.createObjectURL(file),
        type: isVid ? 'video' : 'image',
        name: file.name,
        isRemote: false,
        storagePath: '',
        uploading: Boolean(supabaseUser),
        _rawFile: file,
      };
    });

    setMediaItems((prev) => {
      const combined = [...prev, ...initialSlides];
      if (combined.length > 1 && format !== 'carousel') {
        setFormat('carousel');
      } else if (combined.length === 1 && initialSlides[0].type === 'video' && format === 'image') {
        setFormat('video');
      } else if (combined.length === 1 && initialSlides[0].type === 'image' && format === 'video') {
        setFormat('image');
      }
      return combined;
    });

    if (!supabaseUser) return;

    setUploadingCount((c) => c + initialSlides.length);
    for (let i = 0; i < initialSlides.length; i++) {
      const slide = initialSlides[i];
      const file = slide._rawFile;
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
      const storagePath = `${supabaseUser.id}/${batchTs}-${i}-${safeName}`;

      try {
        const { error: upErr } = await supabase.storage
          .from(TEMP_BUCKET)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || undefined,
          });

        if (upErr) {
          setSupabaseStatus('needs_setup');
          setMediaItems((prev) =>
            prev.map((m) => (m.id === slide.id ? { ...m, uploading: false } : m))
          );
          showToast(
            'Temp bucket not initialized yet — click "Setup Temp Cloud" above to enable Supabase uploads!',
            'error'
          );
        } else {
          const { data: pubUrlData } = supabase.storage
            .from(TEMP_BUCKET)
            .getPublicUrl(storagePath);
          const publicUrl = pubUrlData?.publicUrl || slide.url;
          setSupabaseStatus('connected');
          setMediaItems((prev) =>
            prev.map((m) =>
              m.id === slide.id
                ? {
                    ...m,
                    url: publicUrl,
                    isRemote: true,
                    storagePath,
                    uploading: false,
                    _rawFile: undefined,
                  }
                : m
            )
          );
        }
      } catch {
        setMediaItems((prev) =>
          prev.map((m) => (m.id === slide.id ? { ...m, uploading: false } : m))
        );
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const handleAddRemoteUrl = () => {
    const clean = remoteUrlInput.trim();
    if (!clean) return;
    const isVid = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(clean) || format === 'video';
    const item = {
      id: `remote-${Date.now()}`,
      url: clean,
      type: isVid ? 'video' : 'image',
      name: clean.split('/').pop()?.split('?')[0] || 'Hosted Media',
      isRemote: true,
      storagePath: '',
      uploading: false,
    };
    setMediaItems((prev) => {
      const next = [...prev, item];
      if (next.length > 1) setFormat('carousel');
      return next;
    });
    setRemoteUrlInput('');
  };

  const moveSlide = (idx, dir) => {
    setMediaItems((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const removeSlide = async (slide) => {
    if (slide?.storagePath) {
      await deleteTempStoragePaths([slide.storagePath]);
    }
    setMediaItems((prev) => {
      const next = prev.filter((m) => m.id !== slide.id);
      if (previewSlideIdx >= next.length) {
        setPreviewSlideIdx(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleAutoAdaptCaptions = () => {
    if (!masterCaption.trim()) {
      showToast('Write a master caption or hook first so I can adapt it!', 'error');
      return;
    }
    const nextOverrides = { ...captionOverrides };
    selectedPlatforms.forEach((pid) => {
      nextOverrides[pid] = adaptCaptionForPlatform(
        pid,
        masterCaption,
        attachDmTrigger ? dmKeyword : ''
      );
    });
    setCaptionOverrides(nextOverrides);
    triggerFairyWand?.();
    showToast(`Adapted captions for ${selectedPlatforms.length} platforms!`);
  };

  const buildPostRecord = (statusOverride) => {
    const id = editingId || `post-${Date.now()}`;
    const derivedTitle =
      title.trim() ||
      masterCaption.trim().split('\n')[0]?.slice(0, 60) ||
      `${format.toUpperCase()} Cross-Post`;
    const cleanSlides = mediaItems.map(({ _rawFile, ...rest }) => rest);
    const publicUrls = cleanSlides
      .filter((m) => m.isRemote && /^https?:\/\//i.test(m.url))
      .map((m) => m.url);
    const storagePaths = cleanSlides.map((m) => m.storagePath).filter(Boolean);
    const schedIso = buildScheduledIso(scheduledDate, scheduledTime);

    return {
      id,
      title: derivedTitle,
      caption: masterCaption,
      captions: captionOverrides,
      format,
      platforms: selectedPlatforms,
      media_items: cleanSlides,
      media_urls: publicUrls,
      storage_paths: storagePaths,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      scheduled_at: schedIso,
      expires_at: new Date(new Date(schedIso).getTime() + 48 * 3600 * 1000).toISOString(),
      status: statusOverride,
      first_comment: firstComment,
      auto_dm_keyword: attachDmTrigger ? dmKeyword.trim().toUpperCase() : '',
      auto_dm_url: attachDmTrigger ? dmTargetUrl.trim() : '',
      auto_cleanup: autoCleanup,
      media_cleaned_up: false,
      updated_at: new Date().toISOString(),
    };
  };

  const maybeRegisterDmTrigger = (record) => {
    if (
      attachDmTrigger &&
      record.auto_dm_keyword &&
      record.platforms.includes('instagram') &&
      typeof onCreateAutoDmFlow === 'function'
    ) {
      onCreateAutoDmFlow({
        name: `Planner: "${record.title.slice(0, 32)}" (${record.auto_dm_keyword})`,
        keyword: record.auto_dm_keyword,
        url: record.auto_dm_url || 'https://techfairylab.com',
      });
    }
  };

  const syncPostToBackend = async (record) => {
    await upsertPostInSupabase(record);
    try {
      await fetch('/api/planner/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          title: record.title,
          caption: record.caption,
          captions: record.captions,
          format: record.format,
          platforms: record.platforms,
          media_urls: record.media_urls,
          scheduled_date: record.scheduled_date,
          scheduled_time: record.scheduled_time,
          status: record.status,
          first_comment: record.first_comment,
          auto_dm_keyword: record.auto_dm_keyword,
          auto_dm_url: record.auto_dm_url,
        }),
      });
    } catch {
      // Safe fallback when deployed on Vercel without FastAPI local server
    }
  };

  const handleSaveScheduleOrDraft = async (targetStatus = 'scheduled') => {
    if (uploadingCount > 0) {
      showToast('Hang tight — temporary media is still uploading to Supabase!', 'error');
      return;
    }
    const record = buildPostRecord(targetStatus);
    const exists = posts.some((p) => p.id === record.id);
    const next = exists
      ? posts.map((p) => (p.id === record.id ? { ...p, ...record } : p))
      : [record, ...posts];
    persistPostsLocal(next);
    await syncPostToBackend(record);
    if (targetStatus === 'scheduled') {
      maybeRegisterDmTrigger(record);
    }
    triggerFairyWand?.();
    setComposerOpen(false);
    showToast(
      targetStatus === 'draft'
        ? 'Saved draft in Planning Calendar!'
        : `Scheduled across ${record.platforms.length} platform(s) for ${record.scheduled_date} @ ${formatTime12h(
            record.scheduled_time
          )}!`
    );
  };

  const handlePublishNow = async (postInput, { isAutoScheduled = false } = {}) => {
    if (!postInput && uploadingCount > 0) {
      showToast('Wait a moment for your video/slides to finish uploading to Supabase!', 'error');
      return;
    }
    const record = postInput || buildPostRecord('publishing');
    setPublishing(true);
    try {
      const mergedTokens = {};
      PLATFORMS.forEach((pl) => {
        const localCfg = platformTokens?.[pl.id] || {};
        const sharedTok = (sharedTokensMap?.[pl.id] || '').trim();
        mergedTokens[pl.id] = {
          access_token:
            (localCfg.access_token || '').trim() ||
            sharedTok ||
            (pl.id === 'instagram' ? (igAccessToken || '').trim() : ''),
          account_id:
            (localCfg.account_id || '').trim() ||
            (pl.id === 'instagram' ? (igAccountId || '').trim() : ''),
        };
      });

      let dispatchData = null;
      try {
        const resp = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post: {
              id: record.id,
              title: record.title,
              caption: record.caption,
              captions: record.captions,
              format: record.format,
              platforms: record.platforms,
              media_urls: record.media_urls,
              first_comment: record.first_comment,
            },
            platform_tokens: mergedTokens,
          }),
        });
        if (resp.ok) {
          dispatchData = await resp.json();
        }
      } catch {
        // Offline fallback
      }

      const results =
        dispatchData?.results ||
        record.platforms.map((pid) => ({
          platform: pid,
          mode: 'queued_preview',
          status: 'queued',
          message: `Queued in Safe Preview Mode (connect ${pid} token for live auto-push).`,
        }));

      const liveCount = results.filter((r) => r.mode === 'live_published').length;
      const finalStatus =
        dispatchData?.overall_status || (liveCount > 0 ? 'published' : 'queued');

      // Automatically purge temporary Supabase Storage files once live publish completes!
      let cleanedUp = Boolean(record.media_cleaned_up);
      if (
        record.auto_cleanup !== false &&
        finalStatus === 'published' &&
        Array.isArray(record.storage_paths) &&
        record.storage_paths.length > 0
      ) {
        const removed = await deleteTempStoragePaths(record.storage_paths);
        if (removed > 0) cleanedUp = true;
      }

      const updatedRecord = {
        ...record,
        status: finalStatus,
        dispatch_results: results,
        last_dispatched_at: new Date().toISOString(),
        media_cleaned_up: cleanedUp,
        ...(cleanedUp ? { media_urls: [], storage_paths: [], media_items: [] } : {}),
      };

      const prevList = postsRef.current || posts;
      const exists = prevList.some((p) => p.id === updatedRecord.id);
      const next = exists
        ? prevList.map((p) => (p.id === updatedRecord.id ? updatedRecord : p))
        : [updatedRecord, ...prevList];
      persistPostsLocal(next);
      await syncPostToBackend(updatedRecord);
      if (!postInput) {
        maybeRegisterDmTrigger(updatedRecord);
        setComposerOpen(false);
      }
      triggerFairyWand?.();

      const prefix = isAutoScheduled ? '⏰ Scheduled Auto-Post: ' : '';
      if (liveCount > 0) {
        showToast(
          `${prefix}Published live to ${liveCount} platform(s)${
            cleanedUp ? ' & purged temp Supabase media!' : '!'
          }`
        );
      } else {
        showToast(
          `${prefix}Queued across ${results.length} platform(s)! Connect API keys anytime for live auto-post.`
        );
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleManualPurgeMedia = async (post, e) => {
    if (e) e.stopPropagation();
    const paths = post.storage_paths || [];
    if (paths.length === 0) return;
    await deleteTempStoragePaths(paths);
    const updated = {
      ...post,
      media_cleaned_up: true,
      storage_paths: [],
      media_urls: [],
      media_items: [],
    };
    const next = posts.map((p) => (p.id === post.id ? updated : p));
    persistPostsLocal(next);
    await upsertPostInSupabase(updated);
    showToast('Purged temporary media files from Supabase Storage!');
  };

  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    const target = posts.find((p) => p.id === postId);
    if (target?.storage_paths?.length) {
      await deleteTempStoragePaths(target.storage_paths);
    }
    const next = posts.filter((p) => p.id !== postId);
    persistPostsLocal(next);
    if (supabaseUser) {
      supabase.from('scheduled_posts').delete().eq('id', postId).then(() => {});
    }
    fetch(`/api/planner/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }).catch(() => {});
    if (editingId === postId) setComposerOpen(false);
    showToast('Removed post & cleaned up any temporary cloud files.');
  };

  const handleDropOnDate = (targetDateKey) => {
    if (!draggedPostId) return;
    const next = posts.map((p) =>
      p.id === draggedPostId
        ? {
            ...p,
            scheduled_date: targetDateKey,
            scheduled_at: buildScheduledIso(targetDateKey, p.scheduled_time),
          }
        : p
    );
    persistPostsLocal(next);
    const moved = next.find((p) => p.id === draggedPostId);
    if (moved) {
      syncPostToBackend(moved);
      showToast(`Rescheduled "${moved.title.slice(0, 28)}" to ${targetDateKey}!`);
    }
    setDraggedPostId(null);
  };

  const handleSaveTokens = async (e) => {
    e.preventDefault();
    localStorage.setItem(scopedKey('sa_platform_tokens'), JSON.stringify(platformTokens));
    if (supabaseUser) {
      await supabase
        .from('user_platform_tokens')
        .upsert(
          {
            user_id: supabaseUser.id,
            tokens: platformTokens,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .catch(() => {});
    }
    setShowTokensModal(false);
    showToast('Saved multi-platform API settings to your workspace!');
  };

  const copyText = (text, key, msg = 'Copied to clipboard!') => {
    navigator.clipboard?.writeText(text || '');
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
    showToast(msg);
  };

  // Build Month Calendar Grid
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const calendarCells = Array.from({ length: totalCells }, (_, idx) => {
    const cellDate = new Date(year, month, idx - startOffset + 1);
    const dateKey = toDateKey(cellDate);
    return {
      date: cellDate,
      dateKey,
      dayNumber: cellDate.getDate(),
      inCurrentMonth: cellDate.getMonth() === month,
      isToday: dateKey === todayKey,
      peak: PEAK_WINDOWS_BY_DOW[cellDate.getDay()],
    };
  });

  const startOfCurrentWeek = (() => {
    const base =
      cursorDate.getMonth() === today.getMonth() && cursorDate.getFullYear() === today.getFullYear()
        ? new Date(today)
        : new Date(cursorDate);
    base.setDate(base.getDate() - base.getDay());
    return base;
  })();

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfCurrentWeek);
    d.setDate(startOfCurrentWeek.getDate() + i);
    return {
      date: d,
      dateKey: toDateKey(d),
      dowLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: toDateKey(d) === todayKey,
      peak: PEAK_WINDOWS_BY_DOW[d.getDay()],
    };
  });

  const filteredPosts = posts.filter((p) =>
    platformFilter === 'all' ? true : (p.platforms || []).includes(platformFilter)
  );

  const postsByDate = filteredPosts.reduce((acc, post) => {
    const k = post.scheduled_date || todayKey;
    if (!acc[k]) acc[k] = [];
    acc[k].push(post);
    return acc;
  }, {});

  const monthLabel = cursorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const activeTempFilesCount = posts.reduce(
    (sum, p) => sum + ((p.storage_paths || []).length || 0),
    0
  );
  const activePreviewCaption =
    captionOverrides[previewPlatform] ?? masterCaption ?? 'Your cross-platform caption preview...';
  const currentSlide = mediaItems[previewSlideIdx] || mediaItems[0] || null;

  return (
    <div className="space-y-6 panel-enter">
      {/* ============================================================
          SUPABASE TEMP CLOUD STORAGE STATUS / 1-CLICK SQL SETUP BAR
      ============================================================ */}
      {supabaseStatus === 'needs_setup' ? (
        <div className="editorial-card p-4 sm:p-5 bg-[#FFF0F7] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C8F904] border-2 border-[#19154E] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-[#19154E]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm sm:text-base text-[#19154E]">
                ⚡ Enable Supabase Temporary Video Storage &amp; Cloud Scheduler (1-Time SQL)
              </h4>
              <p className="text-xs text-neutral-700 mt-0.5">
                Creates your private <code className="font-mono-code font-bold">scheduled-media</code> bucket &amp;{' '}
                <code className="font-mono-code font-bold">scheduled_posts</code> queue. Videos upload temporarily so Instagram/TikTok can pull them, then <strong>auto-delete right after publishing</strong>!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                copyText(
                  SUPABASE_SETUP_SQL,
                  'setup-sql',
                  'Copied Supabase Setup SQL! Paste it into Supabase SQL Editor & click Run.'
                )
              }
              className="editorial-btn px-3.5 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
            >
              {copiedId === 'setup-sql' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedId === 'setup-sql' ? 'Copied SQL!' : '1. Copy Setup SQL'}</span>
            </button>

            <a
              href="https://supabase.com/dashboard/project/ttmtmsafqmfjdkbtjglv/sql/new"
              target="_blank"
              rel="noreferrer"
              className="editorial-btn px-3.5 py-2 rounded-xl bg-white text-[#19154E] text-xs font-bold flex items-center gap-1.5"
            >
              <span>2. Open SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={checkAndLoadSupabase}
              className="editorial-btn px-3 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verify</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSetupSqlModal(true)}
              className="text-xs font-bold underline text-[#19154E] px-1"
            >
              View SQL
            </button>
          </div>
        </div>
      ) : supabaseStatus === 'connected' ? (
        <div className="editorial-card-sm px-4 py-2.5 bg-[#F5EEFF] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#19154E]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#19154E]" />
            <Cloud className="w-4 h-4 text-[#19154E]" />
            <span>Supabase Temp Storage &amp; Auto-Scheduler Connected</span>
            <span className="text-neutral-600 font-medium">
              • {activeTempFilesCount} temp file(s) currently staged (auto-purged after live publish)
            </span>
          </div>
          <button
            type="button"
            onClick={checkAndLoadSupabase}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#19154E] font-bold hover:bg-[#C8F904] flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync Queue</span>
          </button>
        </div>
      ) : null}

      {/* ============================================================
          TOP PLANNER COMMAND BAR
      ============================================================ */}
      <div className="editorial-card p-5 sm:p-6 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8F904] border-2 border-[#19154E] text-xs font-bold mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Multi-Platform Content Calendar &amp; Temp Cloud Auto-Poster</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
              Upload once. Schedule &amp; auto-post everywhere.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Drop a <strong>Video/Reel</strong>, <strong>Carousel</strong>, or <strong>Post</strong> — files stage temporarily in Supabase so platforms can ingest them at your scheduled time, then auto-delete to save storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowTokensModal(true)}
              className="editorial-btn px-3.5 py-2.5 rounded-2xl bg-[#F5EEFF] text-[#19154E] text-xs font-bold flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-[#19154E]" />
              <span>Platform APIs</span>
              <span className="px-2 py-0.5 rounded-full bg-white border border-[#19154E] text-[11px]">
                {PLATFORMS.filter((p) => isPlatformLiveReady(p.id)).length}/{PLATFORMS.length} Live
              </span>
            </button>

            <button
              type="button"
              onClick={() => openComposerForSlot(todayKey, '18:00')}
              className="editorial-btn px-5 py-2.5 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs sm:text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Cross-Platform Post</span>
            </button>
          </div>
        </div>

        {/* Platform Filter Pills + View Switcher */}
        <div className="mt-5 pt-4 border-t-2 border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors ${
                platformFilter === 'all'
                  ? 'bg-[#19154E] text-white'
                  : 'bg-white text-[#19154E] hover:bg-[#F5EEFF]'
              }`}
            >
              All ({posts.length})
            </button>
            {PLATFORMS.map((p) => {
              const count = posts.filter((item) => (item.platforms || []).includes(p.id)).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatformFilter(p.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] flex items-center gap-1.5 transition-colors ${
                    platformFilter === p.id
                      ? 'bg-[#19154E] text-white'
                      : 'bg-white text-[#19154E] hover:bg-[#F5EEFF]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPlatformLiveReady(p.id) ? 'bg-[#C8F904]' : 'bg-[#B799E8]'
                    }`}
                  />
                  <span>{p.short}</span>
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="inline-flex bg-[#F5EEFF] p-1 rounded-xl border-2 border-[#19154E]">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  viewMode === 'month' ? 'bg-[#19154E] text-white' : 'text-[#19154E]'
                }`}
              >
                Month Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                  viewMode === 'week' ? 'bg-[#19154E] text-white' : 'text-[#19154E]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#FF7EB6]" />
                <span>Best-Time Heatmap</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          CALENDAR BODY (MONTH GRID OR 7-DAY BEST-TIME HEATMAP)
      ============================================================ */}
      <div className="editorial-card p-4 sm:p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCursorDate(new Date(year, month - 1, 1))}
              className="editorial-btn p-2 rounded-xl bg-white hover:bg-[#F5EEFF]"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h4 className="font-display text-xl sm:text-2xl font-bold text-[#19154E] px-2">
              {monthLabel}
            </h4>
            <button
              type="button"
              onClick={() => setCursorDate(new Date(year, month + 1, 1))}
              className="editorial-btn p-2 rounded-xl bg-white hover:bg-[#F5EEFF]"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursorDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="ml-1 px-2.5 py-1 rounded-lg border-2 border-[#19154E] bg-[#FFF8FC] text-xs font-bold hover:bg-[#C8F904]"
            >
              Today
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-neutral-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8F904] border border-[#19154E]" />
              Published Live
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7EB6] border border-[#19154E]" />
              Scheduled
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B799E8] border border-[#19154E]" />
              Queued Preview
            </span>
          </div>
        </div>

        {viewMode === 'month' ? (
          <>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-bold uppercase tracking-wider text-neutral-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
              {calendarCells.map((cell) => {
                const dayPosts = (postsByDate[cell.dateKey] || []).sort((a, b) =>
                  (a.scheduled_time || '').localeCompare(b.scheduled_time || '')
                );
                return (
                  <div
                    key={cell.dateKey}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnDate(cell.dateKey)}
                    onClick={() => openComposerForSlot(cell.dateKey, cell.peak?.time)}
                    className={`min-h-[138px] rounded-2xl border-2 p-2.5 flex flex-col justify-between cursor-pointer transition-colors ${
                      cell.isToday
                        ? 'bg-[#FFF0F7] border-[#19154E] shadow-[3px_3px_0px_#19154E]'
                        : cell.inCurrentMonth
                        ? 'bg-[#FFFDF9] border-[#19154E]/80 hover:bg-[#F5EEFF]/60'
                        : 'bg-neutral-100/70 border-neutral-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`w-7 h-7 rounded-xl text-xs font-bold flex items-center justify-center border ${
                          cell.isToday
                            ? 'bg-[#FF7EB6] text-[#19154E] border-[#19154E]'
                            : 'bg-white text-[#19154E] border-[#19154E]/30'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      <span
                        title={`Recommended US audience slot: ${cell.peak?.label} (${cell.peak?.score}% activity index)`}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F5EEFF] text-[#19154E] border border-[#19154E]/30 truncate"
                      >
                        {cell.peak?.tag}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1">
                      {dayPosts.map((post) => {
                        const statusColor =
                          post.status === 'published'
                            ? 'bg-[#C8F904]'
                            : post.status === 'queued'
                            ? 'bg-[#E2D4FF]'
                            : post.status === 'draft'
                            ? 'bg-neutral-200'
                            : 'bg-[#FFE4F1]';
                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={() => setDraggedPostId(post.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              openComposerForEdit(post);
                            }}
                            className={`p-2 rounded-xl border-2 border-[#19154E] ${statusColor} shadow-[2px_2px_0px_#19154E] hover:-translate-y-0.5 transition-transform`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-[#19154E]">
                              <span className="font-mono-code">
                                {formatTime12h(post.scheduled_time)}
                              </span>
                              <span className="uppercase px-1 rounded bg-white/80 border border-[#19154E]/40">
                                {post.format === 'carousel'
                                  ? `🖼️ ${post.media_items?.length || post.media_urls?.length || 'Multi'}`
                                  : post.format === 'video'
                                  ? '🎬 Video'
                                  : post.format === 'image'
                                  ? '📸 Photo'
                                  : '✍️ Text'}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-[#19154E] truncate mt-1">
                              {post.title}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {(post.platforms || []).map((pid) => {
                                const meta = PLATFORMS.find((pl) => pl.id === pid);
                                if (!meta) return null;
                                return (
                                  <span
                                    key={pid}
                                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border border-[#19154E] ${meta.badgeBg} ${meta.badgeText}`}
                                  >
                                    {meta.short}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1.5 mt-1 flex items-center justify-between text-[10px] font-bold text-neutral-500 hover:text-[#19154E]">
                      <span>+ Add post</span>
                      <span>{formatTime12h(cell.peak?.time)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-3 overflow-x-auto">
            <p className="text-xs font-medium text-neutral-600">
              Darker lime/pink cells mark peak follower scroll windows. Click any heatmap slot to schedule directly into that window!
            </p>
            <div className="min-w-[680px]">
              <div className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-xs font-bold text-neutral-500 py-2">EST Slot</div>
                {weekDays.map((wd) => (
                  <div
                    key={wd.dateKey}
                    className={`text-center py-1.5 rounded-xl border-2 border-[#19154E] text-xs font-bold ${
                      wd.isToday ? 'bg-[#FF7EB6]' : 'bg-[#F5EEFF]'
                    }`}
                  >
                    <div>{wd.dowLabel}</div>
                    <div className="font-mono-code text-[11px]">{wd.dayNum}</div>
                  </div>
                ))}
              </div>

              {HEATMAP_HOURS.map((row) => (
                <div key={row.hour} className="grid grid-cols-8 gap-2 mb-2 items-stretch">
                  <div className="flex items-center text-xs font-mono-code font-bold text-[#19154E]">
                    {row.label}
                  </div>
                  {weekDays.map((wd, dowIdx) => {
                    const score = row.scores[dowIdx];
                    const bgClass =
                      score >= 94
                        ? 'bg-[#C8F904]'
                        : score >= 88
                        ? 'bg-[#FFE4F1]'
                        : 'bg-[#FFFDF9]';
                    const slotPosts = (postsByDate[wd.dateKey] || []).filter(
                      (p) => (p.scheduled_time || '').slice(0, 2) === row.hour.slice(0, 2)
                    );
                    return (
                      <div
                        key={`${wd.dateKey}-${row.hour}`}
                        onClick={() => openComposerForSlot(wd.dateKey, row.hour)}
                        className={`p-2.5 rounded-xl border-2 border-[#19154E] ${bgClass} cursor-pointer hover:-translate-y-0.5 transition-transform min-h-[72px] flex flex-col justify-between`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>{score >= 94 ? '🔥 Peak' : `${score}% active`}</span>
                          <span>+</span>
                        </div>
                        {slotPosts.map((sp) => (
                          <div
                            key={sp.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              openComposerForEdit(sp);
                            }}
                            className="mt-1 px-2 py-1 rounded-lg bg-white border border-[#19154E] text-[10px] font-bold truncate"
                          >
                            {sp.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          UPCOMING CROSS-PLATFORM QUEUE & TEMP STORAGE STATUS LIST
      ============================================================ */}
      <div className="editorial-card p-5 sm:p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-xl font-bold text-[#19154E]">
              Scheduled &amp; Cross-Posted Queue ({filteredPosts.length})
            </h4>
            <p className="text-xs text-neutral-600">
              Due <code className="font-mono-code font-bold">scheduled</code> posts fire automatically on time and clean up temporary Supabase files after publishing.
            </p>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#FFF8FC] border-2 border-dashed border-[#19154E]/40">
            <p className="font-display font-bold text-base text-[#19154E]">
              No posts scheduled yet — click any day on the calendar to schedule your first Video or Carousel!
            </p>
            <button
              type="button"
              onClick={() => openComposerForSlot(todayKey, '18:00')}
              className="mt-3 editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-xs font-bold"
            >
              + Schedule Multi-Platform Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => {
              const hasTempFiles = (post.storage_paths || []).length > 0;
              return (
                <div
                  key={post.id}
                  onClick={() => openComposerForEdit(post)}
                  className="editorial-card-sm p-4 bg-[#FFFDF9] cursor-pointer hover:bg-[#FFF8FC] flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono-code font-bold px-2.5 py-0.5 rounded-lg bg-[#F5EEFF] border border-[#19154E]">
                        📅 {post.scheduled_date} • {formatTime12h(post.scheduled_time)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasTempFiles && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#19154E]">
                            ☁️ {post.storage_paths.length} temp file(s)
                          </span>
                        )}
                        {post.media_cleaned_up && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 border border-[#19154E]">
                            🧹 Temp Purged
                          </span>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#19154E] uppercase ${
                            post.status === 'published'
                              ? 'bg-[#C8F904]'
                              : post.status === 'queued'
                              ? 'bg-[#E2D4FF]'
                              : 'bg-[#FF7EB6]'
                          }`}
                        >
                          {post.status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-1.5 rounded-lg bg-white border border-[#19154E] hover:bg-[#FFE4F1]"
                          title="Delete post & temporary cloud media"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#19154E]" />
                        </button>
                      </div>
                    </div>

                    <h5 className="font-display font-bold text-base text-[#19154E]">{post.title}</h5>
                    <p className="text-xs text-neutral-600 line-clamp-2">{post.caption}</p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {(post.platforms || []).map((pid) => {
                        const meta = PLATFORMS.find((p) => p.id === pid);
                        if (!meta) return null;
                        return (
                          <span
                            key={pid}
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border border-[#19154E] ${meta.badgeBg} ${meta.badgeText}`}
                          >
                            {meta.name}
                          </span>
                        );
                      })}
                      {post.auto_dm_keyword && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg border border-[#19154E] bg-[#C8F904] text-[#19154E]">
                          🧚‍♀️ Auto-DM: &ldquo;{post.auto_dm_keyword}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="pt-2.5 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(post.caption, post.id, 'Caption copied!')}
                        className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#19154E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5EEFF]"
                      >
                        {copiedId === post.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === post.id ? 'Copied!' : 'Copy'}</span>
                      </button>

                      {hasTempFiles && (
                        <button
                          type="button"
                          onClick={(e) => handleManualPurgeMedia(post, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-[11px] font-bold hover:bg-[#FFE4F1]"
                          title="Delete temporary files from Supabase Storage now"
                        >
                          🧹 Free Storage
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={publishing}
                      onClick={() => handlePublishNow(post)}
                      className="editorial-btn px-3.5 py-1.5 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish / Push Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================
          MULTI-PLATFORM COMPOSER MODAL (VIDEO / CAROUSEL / IMAGE / TEXT)
      ============================================================ */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-[#19154E]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="editorial-card bg-[#FFF8FC] w-full max-w-6xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b-2 border-[#19154E]">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF7EB6] border border-[#19154E] text-[11px] font-bold">
                  ✨ Cross-Platform Studio Composer
                </span>
                <h3 className="font-display text-2xl font-bold text-[#19154E] mt-1">
                  {editingId ? 'Edit Scheduled Cross-Post' : 'Create Multi-Platform Post'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="editorial-btn p-2 rounded-xl bg-white hover:bg-[#FFE4F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT 7 COLS */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Content Format */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                    1. Choose Format (Video, Carousel, Photo, or Thread)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {FORMAT_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = format === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormat(opt.id)}
                          className={`p-3 rounded-2xl border-2 border-[#19154E] text-left transition-colors ${
                            active
                              ? 'bg-[#C8F904] shadow-[3px_3px_0px_#19154E]'
                              : 'bg-white hover:bg-[#F5EEFF]'
                          }`}
                        >
                          <Icon className="w-5 h-5 text-[#19154E] mb-1" />
                          <div className="text-xs font-bold text-[#19154E]">{opt.label}</div>
                          <div className="text-[10px] text-neutral-600">{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Target Platforms */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                      2. Post To Platforms ({selectedPlatforms.length} Selected)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlatforms(['instagram', 'tiktok', 'youtube']);
                          setPreviewPlatform('instagram');
                        }}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-[#19154E] hover:bg-[#C8F904]"
                      >
                        🎬 Video Trio (IG+TT+YT)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlatforms(PLATFORMS.map((p) => p.id))}
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-[#19154E] hover:bg-[#FF7EB6]"
                      >
                        Select All 7
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PLATFORMS.map((plat) => {
                      const isSelected = selectedPlatforms.includes(plat.id);
                      const liveReady = isPlatformLiveReady(plat.id);
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => togglePlatform(plat.id)}
                          className={`p-2.5 rounded-2xl border-2 border-[#19154E] text-left flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-[#19154E] text-white shadow-[3px_3px_0px_#FF7EB6]'
                              : 'bg-white text-[#19154E] hover:bg-[#F5EEFF]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-[#19154E] ${plat.badgeBg} ${plat.badgeText}`}
                              >
                                {plat.short}
                              </span>
                              <span className="text-xs font-bold truncate">{plat.name}</span>
                            </div>
                            <div
                              className={`text-[10px] truncate mt-0.5 ${
                                isSelected ? 'text-neutral-300' : 'text-neutral-500'
                              }`}
                            >
                              {liveReady ? '🟢 Live API Ready' : '🟣 Queue / Preview'}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#C8F904] border-[#C8F904] text-[#19154E]'
                                : 'border-[#19154E]/40'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Supabase Temp Cloud Media Uploader */}
                {format !== 'text' && (
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#19154E] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#19154E]">
                        3. Upload {format === 'carousel' ? 'Carousel Slides' : 'Video or Image'} (Temp Supabase Bucket)
                      </span>
                      <span className="text-[11px] font-bold text-neutral-600">
                        {uploadingCount > 0
                          ? `☁️ Uploading ${uploadingCount} file(s) to Supabase...`
                          : `${mediaItems.length} file(s) staged`}
                      </span>
                    </div>

                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFilesSelected(e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-5 rounded-2xl bg-[#F5EEFF]/70 border-2 border-dashed border-[#19154E] text-center cursor-pointer hover:bg-[#FFE4F1]/60 transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto text-[#19154E] mb-1.5" />
                      <p className="text-xs font-bold text-[#19154E]">
                        Click or drag &amp; drop MP4 / MOV / PNG / JPG here (max 50 MB per file)
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Uploads straight to your temporary Supabase bucket to generate a live <code className="font-mono-code">https://</code> URL, then auto-deletes after posting!
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="video/*,image/*"
                        onChange={(e) => handleFilesSelected(e.target.files)}
                        className="hidden"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={remoteUrlInput}
                        onChange={(e) => setRemoteUrlInput(e.target.value)}
                        placeholder="Or paste an existing public https:// video or image URL"
                        className="flex-1 px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddRemoteUrl}
                        className="px-3.5 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold shrink-0"
                      >
                        + Add URL
                      </button>
                    </div>

                    {mediaItems.length > 0 && (
                      <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1">
                        {mediaItems.map((m, idx) => (
                          <div
                            key={m.id}
                            onClick={() => setPreviewSlideIdx(idx)}
                            className={`relative w-24 shrink-0 rounded-xl border-2 border-[#19154E] overflow-hidden bg-black cursor-pointer ${
                              previewSlideIdx === idx ? 'ring-2 ring-[#FF7EB6]' : ''
                            }`}
                          >
                            {m.type === 'video' ? (
                              <video src={m.url} className="w-24 h-24 object-cover" muted />
                            ) : (
                              <img src={m.url} alt={m.name} className="w-24 h-24 object-cover" />
                            )}
                            <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#19154E]/90 text-white text-[9px] font-bold">
                              {m.uploading
                                ? '⏳...'
                                : m.storagePath
                                ? `☁️ #${idx + 1}`
                                : `#${idx + 1}`}
                            </div>
                            <div className="absolute bottom-1 inset-x-1 flex items-center justify-between gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSlide(idx, -1);
                                }}
                                className="px-1 rounded bg-white/90 text-[10px] font-bold"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSlide(m);
                                }}
                                className="px-1 rounded bg-[#FF7EB6] text-[10px] font-bold"
                              >
                                ✕
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSlide(idx, 1);
                                }}
                                className="px-1 rounded bg-white/90 text-[10px] font-bold"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Master Caption + Smart Adapter */}
                <div className="p-4 rounded-2xl bg-white border-2 border-[#19154E] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#19154E]">
                      4. Caption &amp; Per-Platform Overrides
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoAdaptCaptions}
                      className="editorial-btn px-3 py-1.5 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>✨ Auto-Adapt for All {selectedPlatforms.length} Platforms</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Internal calendar label (e.g. Tuesday Studio Launch Reel)"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-semibold"
                  />

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveCaptionTab('master')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border border-[#19154E] ${
                        activeCaptionTab === 'master'
                          ? 'bg-[#19154E] text-white'
                          : 'bg-[#F5EEFF] text-[#19154E]'
                      }`}
                    >
                      Master Caption
                    </button>
                    {selectedPlatforms.map((pid) => {
                      const meta = PLATFORMS.find((p) => p.id === pid);
                      const hasCustom = Boolean(captionOverrides[pid]);
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => {
                            setActiveCaptionTab(pid);
                            setPreviewPlatform(pid);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border border-[#19154E] ${
                            activeCaptionTab === pid
                              ? 'bg-[#19154E] text-white'
                              : 'bg-white text-[#19154E]'
                          }`}
                        >
                          {meta?.short} {hasCustom ? '•' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {activeCaptionTab === 'master' ? (
                    <textarea
                      rows={4}
                      value={masterCaption}
                      onChange={(e) => setMasterCaption(e.target.value)}
                      placeholder="Write your hook, story, and CTA once here — then click ✨ Auto-Adapt to tailor length & hashtags for each selected platform..."
                      className="w-full p-3 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs sm:text-sm leading-relaxed"
                    />
                  ) : (
                    (() => {
                      const meta = PLATFORMS.find((p) => p.id === activeCaptionTab);
                      const currentVal = captionOverrides[activeCaptionTab] ?? masterCaption;
                      const limit = meta?.maxChars || 2200;
                      return (
                        <div className="space-y-1.5">
                          <textarea
                            rows={4}
                            value={currentVal}
                            onChange={(e) =>
                              setCaptionOverrides((prev) => ({
                                ...prev,
                                [activeCaptionTab]: e.target.value,
                              }))
                            }
                            className="w-full p-3 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs sm:text-sm leading-relaxed"
                          />
                          <div className="flex items-center justify-between text-[11px] font-mono-code text-neutral-600">
                            <span>Custom {meta?.name} caption</span>
                            <span className={currentVal.length > limit ? 'text-red-600 font-bold' : ''}>
                              {currentVal.length} / {limit} chars
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {selectedPlatforms.includes('instagram') && (
                    <input
                      type="text"
                      value={firstComment}
                      onChange={(e) => setFirstComment(e.target.value)}
                      placeholder="Optional Instagram Auto First-Comment (e.g. Comment LINK below and I'll DM it! 👇)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs"
                    />
                  )}
                </div>

                {/* 5. Schedule Time + Auto-Cleanup + Auto-DM Trigger */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#19154E] space-y-2.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#19154E]">
                      5. Schedule Date, Time &amp; Cleanup
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-2.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-mono-code font-bold"
                      />
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="px-2.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-mono-code font-bold"
                      />
                    </div>
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCleanup}
                        onChange={(e) => setAutoCleanup(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#19154E]"
                      />
                      <span className="text-[11px] font-semibold text-neutral-700 leading-snug">
                        🧹 Auto-delete temp files from Supabase right after live publish (48h max TTL)
                      </span>
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E] space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attachDmTrigger}
                        onChange={(e) => setAttachDmTrigger(e.target.checked)}
                        className="w-4 h-4 accent-[#19154E]"
                      />
                      <span className="text-xs font-bold text-[#19154E]">
                        🧚‍♀️ Pair Comment-to-DM Trigger
                      </span>
                    </label>
                    {attachDmTrigger ? (
                      <div className="space-y-1.5 pt-1">
                        <input
                          type="text"
                          value={dmKeyword}
                          onChange={(e) => setDmKeyword(e.target.value.toUpperCase())}
                          placeholder="Keyword (e.g. LINK)"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#19154E] text-xs font-mono-code font-bold"
                        />
                        <input
                          type="url"
                          value={dmTargetUrl}
                          onChange={(e) => setDmTargetUrl(e.target.value)}
                          placeholder="https://resource-link..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#19154E] text-xs"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-neutral-600">
                        Automatically creates a matching keyword DM flow in your Auto-DMs tab!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT 5 COLS: LIVE PHONE PREVIEW */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Live Network Preview</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlatforms.map((pid) => {
                        const meta = PLATFORMS.find((p) => p.id === pid);
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setPreviewPlatform(pid)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border border-[#19154E] ${
                              previewPlatform === pid
                                ? 'bg-[#FF7EB6] text-[#19154E]'
                                : 'bg-white text-neutral-600'
                            }`}
                          >
                            {meta?.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[32px] border-[3px] border-[#19154E] bg-[#19154E] p-2.5 shadow-[6px_6px_0px_#19154E]">
                    <div className="rounded-[24px] bg-white overflow-hidden border border-[#19154E]">
                      <div className="px-3.5 py-2.5 bg-[#FFF8FC] border-b border-neutral-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#FF7EB6] border border-[#19154E] flex items-center justify-center text-[10px] font-bold">
                            ✨
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#19154E]">
                              @{igHandle || 'your_studio'}
                            </div>
                            <div className="text-[10px] text-neutral-500">
                              {PLATFORMS.find((p) => p.id === previewPlatform)?.name} Preview
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full bg-[#C8F904] border border-[#19154E]">
                          {format.toUpperCase()}
                        </span>
                      </div>

                      {format !== 'text' && (
                        <div className="relative bg-[#120F38] aspect-[4/5] flex items-center justify-center overflow-hidden">
                          {currentSlide ? (
                            currentSlide.type === 'video' ? (
                              <video
                                key={currentSlide.url}
                                src={currentSlide.url}
                                controls
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                src={currentSlide.url}
                                alt="Slide preview"
                                className="w-full h-full object-cover"
                              />
                            )
                          ) : (
                            <div className="text-center p-6 text-white/80 space-y-2">
                              <Film className="w-10 h-10 mx-auto text-[#FF7EB6]" />
                              <p className="text-xs font-bold">
                                Drop a {format === 'carousel' ? 'set of slides' : format} on the left to stage in Supabase &amp; preview!
                              </p>
                            </div>
                          )}

                          {mediaItems.length > 1 && (
                            <>
                              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-bold">
                                {previewSlideIdx + 1} / {mediaItems.length}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewSlideIdx((i) => (i > 0 ? i - 1 : mediaItems.length - 1))
                                }
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 border border-[#19154E] flex items-center justify-center text-xs font-bold"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewSlideIdx((i) => (i + 1) % mediaItems.length)
                                }
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 border border-[#19154E] flex items-center justify-center text-xs font-bold"
                              >
                                ›
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      <div className="p-3.5 bg-white space-y-2">
                        <p className="text-xs text-[#19154E] whitespace-pre-line line-clamp-5 leading-relaxed">
                          <span className="font-bold mr-1.5">@{igHandle || 'your_studio'}</span>
                          {activePreviewCaption}
                        </p>
                        {firstComment && previewPlatform === 'instagram' && (
                          <div className="p-2 rounded-xl bg-[#F5EEFF] text-[11px] text-[#19154E]">
                            <span className="font-bold">Pinned 1st Comment:</span> {firstComment}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t-2 border-[#19154E] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSaveScheduleOrDraft('draft')}
                className="editorial-btn px-4 py-2.5 rounded-2xl bg-white text-[#19154E] text-xs font-bold"
              >
                Save as Draft
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={uploadingCount > 0}
                  onClick={() => handleSaveScheduleOrDraft('scheduled')}
                  className="editorial-btn px-5 py-2.5 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {uploadingCount > 0
                      ? 'Uploading Media...'
                      : `Schedule for ${scheduledDate} @ ${formatTime12h(scheduledTime)}`}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={publishing || uploadingCount > 0}
                  onClick={() => handlePublishNow()}
                  className="editorial-btn px-5 py-2.5 rounded-2xl bg-[#C8F904] text-[#19154E] text-xs sm:text-sm font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {publishing
                      ? 'Publishing...'
                      : `Publish Now to ${selectedPlatforms.length} Platform${
                          selectedPlatforms.length > 1 ? 's' : ''
                        }`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW SUPABASE SQL MODAL
      ============================================================ */}
      {showSetupSqlModal && (
        <div className="fixed inset-0 z-50 bg-[#19154E]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="editorial-card bg-[#FFF8FC] w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#19154E]">
              <h4 className="font-display text-lg font-bold text-[#19154E]">
                Supabase Temporary Storage &amp; Scheduler SQL
              </h4>
              <button
                type="button"
                onClick={() => setShowSetupSqlModal(false)}
                className="p-1.5 rounded-xl bg-white border-2 border-[#19154E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-[#19154E] text-[#FFF8FC] text-[11px] font-mono-code overflow-x-auto max-h-96">
              {SUPABASE_SETUP_SQL}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    SUPABASE_SETUP_SQL,
                    'modal-sql',
                    'Copied SQL! Paste into Supabase SQL Editor & click Run.'
                  )
                }
                className="editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-xs font-bold"
              >
                {copiedId === 'modal-sql' ? 'Copied!' : 'Copy SQL'}
              </button>
              <a
                href="https://supabase.com/dashboard/project/ttmtmsafqmfjdkbtjglv/sql/new"
                target="_blank"
                rel="noreferrer"
                className="editorial-btn px-4 py-2 rounded-xl bg-[#FF7EB6] text-xs font-bold flex items-center gap-1.5"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          PLATFORM API CREDENTIALS MODAL
      ============================================================ */}
      {showTokensModal && (
        <div className="fixed inset-0 z-50 bg-[#19154E]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveTokens}
            className="editorial-card bg-[#FFF8FC] w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#19154E]">
              <div>
                <h4 className="font-display text-xl font-bold text-[#19154E]">
                  🔑 Multi-Platform Live API Connections
                </h4>
                <p className="text-xs text-neutral-600">
                  Saved encrypted in your RLS-isolated Supabase row so scheduled posts can publish automatically!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTokensModal(false)}
                className="p-2 rounded-xl bg-white border-2 border-[#19154E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {PLATFORMS.map((plat) => {
                const cfg = platformTokens[plat.id] || {};
                const inheritedIg = plat.id === 'instagram' && Boolean(igAccessToken);
                return (
                  <div
                    key={plat.id}
                    className="p-3.5 rounded-2xl bg-white border-2 border-[#19154E] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold px-2 py-0.5 rounded-lg border border-[#19154E] ${plat.badgeBg} ${plat.badgeText}`}
                        >
                          {plat.short}
                        </span>
                        <span className="font-display font-bold text-sm text-[#19154E]">
                          {plat.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold">
                        {isPlatformLiveReady(plat.id) ? (
                          <span className="text-emerald-700">🟢 Live Token Ready</span>
                        ) : (
                          <span className="text-neutral-500">🟣 Safe Queue Mode</span>
                        )}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">{plat.tokenHint}</p>
                    <input
                      type="password"
                      value={cfg.access_token || ''}
                      onChange={(e) =>
                        setPlatformTokens((prev) => ({
                          ...prev,
                          [plat.id]: { ...(prev[plat.id] || {}), access_token: e.target.value },
                        }))
                      }
                      placeholder={
                        inheritedIg
                          ? 'Using connected Instagram Graph token (paste here to override)'
                          : `Optional ${plat.name} Access Token`
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-mono-code"
                    />
                    {plat.needsAccountId && (
                      <input
                        type="text"
                        value={cfg.account_id || ''}
                        onChange={(e) =>
                          setPlatformTokens((prev) => ({
                            ...prev,
                            [plat.id]: { ...(prev[plat.id] || {}), account_id: e.target.value },
                          }))
                        }
                        placeholder={plat.accountIdLabel}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-mono-code"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t-2 border-[#19154E] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTokensModal(false)}
                className="px-4 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="editorial-btn px-5 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold"
              >
                Save Platform Connections
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
