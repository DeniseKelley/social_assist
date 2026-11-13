import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Sparkles,
  Upload,
  Film,
  Images,
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
  Zap,
  X,
  CheckCircle2,
  Layers,
  Flame,
  Eye,
} from 'lucide-react';

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

// Metricool-inspired US Creator Peak Windows by Day of Week (0 = Sun ... 6 = Sat)
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
  const [mediaItems, setMediaItems] = useState([]); // [{ id, url, type: 'video'|'image', name, isRemote }]
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

  // Load saved scheduled posts & platform tokens from scoped storage (+ sync from local FastAPI if running)
  useEffect(() => {
    const savedPostsRaw = localStorage.getItem(scopedKey('sa_scheduled_posts'));
    if (savedPostsRaw) {
      try {
        const parsed = JSON.parse(savedPostsRaw);
        if (Array.isArray(parsed)) setPosts(parsed);
      } catch {
        // ignore malformed cache
      }
    } else {
      // Seed 2 helpful starter examples on upcoming peak slots so the calendar feels alive immediately
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const twoDaysOut = new Date(today);
      twoDaysOut.setDate(today.getDate() + 3);
      const starter = [
        {
          id: 'seed-post-1',
          title: 'Behind-the-scenes Reel: Building SocialAssist Studio ✨',
          caption:
            'How I plan & cross-post my Reels + automated DMs from one dashboard 🧚‍♀️✨\n\nComment "STUDIO" and I will DM you the workflow!',
          captions: {},
          format: 'video',
          platforms: ['instagram', 'tiktok', 'youtube'],
          media_items: [],
          media_urls: [],
          scheduled_date: toDateKey(tomorrow),
          scheduled_time: PEAK_WINDOWS_BY_DOW[tomorrow.getDay()]?.time || '18:00',
          status: 'scheduled',
          first_comment: 'Drop STUDIO below and check your DMs! 💌',
          auto_dm_keyword: 'STUDIO',
          created_at: new Date().toISOString(),
        },
        {
          id: 'seed-post-2',
          title: '5-Slide Carousel: Hook Formulas That Tripled Saves',
          caption:
            'Swipe through the 5 Reel & Carousel hook formulas driving our highest save-to-view ratio 📊👉',
          captions: {},
          format: 'carousel',
          platforms: ['instagram', 'linkedin', 'threads', 'x'],
          media_items: [],
          media_urls: [],
          scheduled_date: toDateKey(twoDaysOut),
          scheduled_time: PEAK_WINDOWS_BY_DOW[twoDaysOut.getDay()]?.time || '18:00',
          status: 'scheduled',
          first_comment: '',
          auto_dm_keyword: '',
          created_at: new Date().toISOString(),
        },
      ];
      setPosts(starter);
      localStorage.setItem(scopedKey('sa_scheduled_posts'), JSON.stringify(starter));
    }

    const savedTokensRaw = localStorage.getItem(scopedKey('sa_platform_tokens'));
    if (savedTokensRaw) {
      try {
        setPlatformTokens(JSON.parse(savedTokensRaw) || {});
      } catch {
        setPlatformTokens({});
      }
    }
  }, [scopedKey]);

  const persistPosts = (nextPosts) => {
    setPosts(nextPosts);
    // Avoid storing huge base64 blobs; keep metadata & remote URLs + session object URLs in state
    const serializable = nextPosts.map((p) => ({
      ...p,
      media_items: (p.media_items || []).map((m) => ({
        ...m,
        // blob: URLs only live for the current browser tab session, which is fine and lightweight
        url: m.url,
      })),
    }));
    localStorage.setItem(scopedKey('sa_scheduled_posts'), JSON.stringify(serializable));
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
    setMediaItems(post.media_items || []);
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
        if (prev.length === 1) return prev; // Keep at least 1 selected
        const next = prev.filter((p) => p !== platformId);
        if (previewPlatform === platformId) setPreviewPlatform(next[0]);
        return next;
      }
      return [...prev, platformId];
    });
  };

  const handleFilesSelected = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const added = files.map((file, idx) => {
      const isVid = file.type.startsWith('video/');
      return {
        id: `local-${Date.now()}-${idx}`,
        url: URL.createObjectURL(file),
        type: isVid ? 'video' : 'image',
        name: file.name,
        isRemote: false,
      };
    });

    setMediaItems((prev) => {
      const combined = [...prev, ...added];
      if (combined.length > 1 && format !== 'carousel') {
        setFormat('carousel');
      } else if (combined.length === 1 && added[0].type === 'video' && format === 'image') {
        setFormat('video');
      } else if (combined.length === 1 && added[0].type === 'image' && format === 'video') {
        setFormat('image');
      }
      return combined;
    });
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

  const removeSlide = (id) => {
    setMediaItems((prev) => {
      const next = prev.filter((m) => m.id !== id);
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
    const publicUrls = mediaItems.filter((m) => m.isRemote).map((m) => m.url);

    return {
      id,
      title: derivedTitle,
      caption: masterCaption,
      captions: captionOverrides,
      format,
      platforms: selectedPlatforms,
      media_items: mediaItems,
      media_urls: publicUrls,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      status: statusOverride,
      first_comment: firstComment,
      auto_dm_keyword: attachDmTrigger ? dmKeyword.trim().toUpperCase() : '',
      auto_dm_url: attachDmTrigger ? dmTargetUrl.trim() : '',
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
      // Safe fallback when deployed purely statically on Vercel without FastAPI /api/planner/posts
    }
  };

  const handleSaveScheduleOrDraft = async (targetStatus = 'scheduled') => {
    const record = buildPostRecord(targetStatus);
    const exists = posts.some((p) => p.id === record.id);
    const next = exists
      ? posts.map((p) => (p.id === record.id ? { ...p, ...record } : p))
      : [record, ...posts];
    persistPosts(next);
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

  const handlePublishNow = async (postInput) => {
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
        // Local fallback if offline
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

      const updatedRecord = {
        ...record,
        status: finalStatus,
        dispatch_results: results,
        last_dispatched_at: new Date().toISOString(),
      };

      const exists = posts.some((p) => p.id === updatedRecord.id);
      const next = exists
        ? posts.map((p) => (p.id === updatedRecord.id ? updatedRecord : p))
        : [updatedRecord, ...posts];
      persistPosts(next);
      await syncPostToBackend(updatedRecord);
      maybeRegisterDmTrigger(updatedRecord);
      triggerFairyWand?.();
      setComposerOpen(false);

      if (liveCount > 0) {
        showToast(
          `Published live to ${liveCount} platform(s) (${
            results.length - liveCount
          } queued in preview mode)!`
        );
      } else {
        showToast(
          `Queued across ${results.length} platform(s)! Connect API keys anytime for live auto-post.`
        );
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    const next = posts.filter((p) => p.id !== postId);
    persistPosts(next);
    fetch(`/api/planner/posts/${encodeURIComponent(postId)}`, { method: 'DELETE' }).catch(() => {});
    if (editingId === postId) setComposerOpen(false);
    showToast('Removed post from calendar.');
  };

  const handleDropOnDate = (targetDateKey) => {
    if (!draggedPostId) return;
    const next = posts.map((p) =>
      p.id === draggedPostId ? { ...p, scheduled_date: targetDateKey } : p
    );
    persistPosts(next);
    const moved = next.find((p) => p.id === draggedPostId);
    if (moved) {
      syncPostToBackend(moved);
      showToast(`Moved "${moved.title.slice(0, 28)}" to ${targetDateKey}!`);
    }
    setDraggedPostId(null);
  };

  const handleSaveTokens = (e) => {
    e.preventDefault();
    localStorage.setItem(scopedKey('sa_platform_tokens'), JSON.stringify(platformTokens));
    setShowTokensModal(false);
    showToast('Saved multi-platform API settings in your workspace!');
  };

  const copyCaptionToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text || '');
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
    showToast('Caption copied to clipboard!');
  };

  // Build Month Calendar Grid (42 cells / 6 weeks max)
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay(); // Sunday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const calendarCells = Array.from({ length: totalCells }, (_, idx) => {
    const cellDate = new Date(year, month, idx - startOffset + 1);
    const dateKey = toDateKey(cellDate);
    const inCurrentMonth = cellDate.getMonth() === month;
    return {
      date: cellDate,
      dateKey,
      dayNumber: cellDate.getDate(),
      inCurrentMonth,
      isToday: dateKey === todayKey,
      peak: PEAK_WINDOWS_BY_DOW[cellDate.getDay()],
    };
  });

  // Build 7-Day Week Strip centered on current week (or cursor month)
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

  const activePreviewCaption =
    captionOverrides[previewPlatform] ?? masterCaption ?? 'Your cross-platform caption preview...';
  const currentSlide = mediaItems[previewSlideIdx] || mediaItems[0] || null;

  return (
    <div className="space-y-6 panel-enter">
      {/* ============================================================
          TOP PLANNER COMMAND BAR
      ============================================================ */}
      <div className="editorial-card p-5 sm:p-6 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C8F904] border-2 border-[#19154E] text-xs font-bold mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Multi-Platform Content Calendar &amp; Cross-Poster</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
              Upload once. Schedule or post everywhere.
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
              Click any day slot to drop a <strong>Video/Reel</strong>, <strong>Carousel</strong>, or{' '}
              <strong>Post</strong> across Instagram, TikTok, YouTube Shorts, Threads, X, LinkedIn &amp; Facebook.
              Drag cards between days to reschedule.
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
        {/* Month Switcher Header */}
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
              Published / Live
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
            {/* Day-of-week Header */}
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

            {/* 7-Column Calendar Cells */}
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
                    {/* Top Row: Day number + Peak time hint */}
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

                    {/* Scheduled Post Pills inside Day */}
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
                                  ? `🖼️ ${post.media_items?.length || 'Multi'}`
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

                    {/* Subtle + Add footer */}
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
          /* ============================================================
             METRICOOL-STYLE 7x24 BEST-TIME HEATMAP + SLOT SCHEDULER
          ============================================================ */
          <div className="space-y-3 overflow-x-auto">
            <p className="text-xs font-medium text-neutral-600">
              Darker lime/pink cells mark peak follower scroll windows. Click any heatmap slot to schedule a multi-platform post directly into that window!
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
          UPCOMING CROSS-PLATFORM QUEUE & QUICK DISPATCH LIST
      ============================================================ */}
      <div className="editorial-card p-5 sm:p-6 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-display text-xl font-bold text-[#19154E]">
              Scheduled &amp; Cross-Posted Queue ({filteredPosts.length})
            </h4>
            <p className="text-xs text-neutral-600">
              One-click copy captions, inspect per-platform status, or push live right now.
            </p>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#FFF8FC] border-2 border-dashed border-[#19154E]/40">
            <p className="font-display font-bold text-base text-[#19154E]">
              No posts scheduled for this filter yet!
            </p>
            <button
              type="button"
              onClick={() => openComposerForSlot(todayKey, '18:00')}
              className="mt-3 editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-xs font-bold"
            >
              + Schedule Your First Multi-Platform Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => openComposerForEdit(post)}
                className="editorial-card-sm p-4 bg-[#FFFDF9] cursor-pointer hover:bg-[#FFF8FC] flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-code font-bold px-2.5 py-0.5 rounded-lg bg-[#F5EEFF] border border-[#19154E]">
                      📅 {post.scheduled_date} • {formatTime12h(post.scheduled_time)}
                    </span>
                    <div className="flex items-center gap-1.5">
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
                        title="Delete post"
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
                  <button
                    type="button"
                    onClick={() => copyCaptionToClipboard(post.caption, post.id)}
                    className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#19154E] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5EEFF]"
                  >
                    {copiedId === post.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === post.id ? 'Copied!' : 'Copy Caption'}</span>
                  </button>

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
            ))}
          </div>
        )}
      </div>

      {/* ============================================================
          MULTI-PLATFORM COMPOSER MODAL (VIDEO / CAROUSEL / IMAGE / TEXT)
      ============================================================ */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-[#19154E]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="editorial-card bg-[#FFF8FC] w-full max-w-6xl max-h-[92vh] overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Modal Header */}
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
              {/* LEFT 7 COLS: FORMAT, MEDIA, PLATFORMS, CAPTION, SCHEDULE */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Content Format Picker */}
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

                {/* 2. Target Platforms Multi-Select */}
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

                {/* 3. Multi-File Media Uploader (Video / Carousel Slides / Hosted URL) */}
                {format !== 'text' && (
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#19154E] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#19154E]">
                        3. Upload {format === 'carousel' ? 'Carousel Slides' : 'Video or Image'}
                      </span>
                      <span className="text-[11px] font-semibold text-neutral-500">
                        {mediaItems.length} file(s) attached
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
                        Click or drag &amp; drop video / image files here (select multiple for a Carousel!)
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        Supports MP4, MOV, PNG, JPG, WEBP — previews live on the phone right away →
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

                    {/* Optional Public Hosted URL for Graph / TikTok Direct Pull */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={remoteUrlInput}
                        onChange={(e) => setRemoteUrlInput(e.target.value)}
                        placeholder="Optional public https:// video or image URL (used by Meta/TikTok cloud auto-publish)"
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

                    {/* Slide Strip / Reorder */}
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
                            <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#19154E]/85 text-white text-[10px] font-bold">
                              #{idx + 1}
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
                                  removeSlide(m.id);
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

                {/* 4. Master Caption + Smart Per-Platform Adapter */}
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

                  {/* Caption Tabs: Master vs Per-Platform */}
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
                      placeholder="Write your hook, story, and CTA once here — then click ✨ Auto-Adapt to tailor length & hashtags for X, YouTube Shorts, LinkedIn, TikTok, and Instagram..."
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

                {/* 5. Date/Time + 1-Click Auto-DM Keyword Flow Linker */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border-2 border-[#19154E] space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#19154E]">
                      5. Schedule Date &amp; Peak Time
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
                    <p className="text-[11px] text-neutral-600">
                      🔥 Peak US window for this day:{' '}
                      <strong>
                        {
                          PEAK_WINDOWS_BY_DOW[new Date(`${scheduledDate}T12:00:00`).getDay()]
                            ?.label
                        }
                      </strong>
                    </p>
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

              {/* RIGHT 5 COLS: LIVE MULTI-PLATFORM MOBILE PHONE PREVIEW */}
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

                  {/* Tactile Phone Frame */}
                  <div className="rounded-[32px] border-[3px] border-[#19154E] bg-[#19154E] p-2.5 shadow-[6px_6px_0px_#19154E]">
                    <div className="rounded-[24px] bg-white overflow-hidden border border-[#19154E]">
                      {/* Phone Top Bar */}
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

                      {/* Media Viewport */}
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
                                Drop a {format === 'carousel' ? 'set of slides' : format} on the left to preview live!
                              </p>
                            </div>
                          )}

                          {/* Carousel Navigation Overlay */}
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
                              <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1">
                                {mediaItems.map((m, idx) => (
                                  <span
                                    key={m.id}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      idx === previewSlideIdx ? 'bg-[#C8F904]' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Caption Preview Box */}
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

                  {/* Quick Open Native Uploader Shortcuts */}
                  <div className="p-3 rounded-2xl bg-white border-2 border-[#19154E] space-y-2">
                    <div className="text-[11px] font-bold text-[#19154E]">
                      Quick-Open Web Studio Uploaders:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPlatforms.map((pid) => {
                        const meta = PLATFORMS.find((p) => p.id === pid);
                        if (!meta) return null;
                        return (
                          <a
                            key={pid}
                            href={meta.composerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#FFF8FC] border border-[#19154E] text-[10px] font-bold hover:bg-[#C8F904]"
                          >
                            <span>{meta.short}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action Footer */}
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
                  onClick={() => handleSaveScheduleOrDraft('scheduled')}
                  className="editorial-btn px-5 py-2.5 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs sm:text-sm font-bold flex items-center gap-2"
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    Schedule for {scheduledDate} @ {formatTime12h(scheduledTime)}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={publishing}
                  onClick={() => handlePublishNow()}
                  className="editorial-btn px-5 py-2.5 rounded-2xl bg-[#C8F904] text-[#19154E] text-xs sm:text-sm font-bold flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {publishing
                      ? 'Dispatching...'
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
          PLATFORM API CREDENTIALS MODAL (OPTIONAL LIVE PUSH KEYS)
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
                  Optional: connect OAuth tokens for live 1-click API publishing. Any platform left blank automatically uses Safe Queue &amp; Preview Mode!
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
