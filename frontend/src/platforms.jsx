import React from 'react';

export const PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    shortName: 'IG',
    audienceLabel: 'Followers',
    contentLabel: 'Reels & Posts',
    badgeBg: '#FF7EB6',
    badgeText: '#19154E',
    placeholder: 'https://www.instagram.com/your_handle/ or @your_handle',
    tokenLabel: 'Optional Instagram Graph API Token',
    tokenPlaceholder: 'IGQWR... or EAA...',
    buildProfileUrl: (h) => `https://www.instagram.com/${encodeURIComponent(h)}/`,
    buildLoginUrl: (h) =>
      `https://www.instagram.com/accounts/login/?next=%2F${encodeURIComponent(h)}%2F`,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    shortName: 'TikTok',
    audienceLabel: 'Followers',
    contentLabel: 'TikToks',
    badgeBg: '#C8F904',
    badgeText: '#19154E',
    placeholder: 'https://www.tiktok.com/@your_handle or @your_handle',
    tokenLabel: 'Optional TikTok Developer Access Token',
    tokenPlaceholder: 'act.example...',
    buildProfileUrl: (h) =>
      /^https?:\/\//i.test(h) ? h : `https://www.tiktok.com/@${encodeURIComponent(h)}`,
    buildLoginUrl: (h) =>
      /^https?:\/\//i.test(h)
        ? 'https://www.tiktok.com/login'
        : `https://www.tiktok.com/login?redirect_url=${encodeURIComponent(
            `https://www.tiktok.com/@${h}`
          )}`,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    shortName: 'YouTube',
    audienceLabel: 'Subscribers',
    contentLabel: 'Videos',
    badgeBg: '#FF6B6B',
    badgeText: '#19154E',
    placeholder: 'https://www.youtube.com/@your_channel or @your_channel',
    tokenLabel: 'Optional YouTube Data API Bearer Token',
    tokenPlaceholder: 'ya29...',
    buildProfileUrl: (h) =>
      /^UC[A-Za-z0-9_-]{20,}$/.test(h)
        ? `https://www.youtube.com/channel/${encodeURIComponent(h)}`
        : `https://www.youtube.com/@${encodeURIComponent(h)}`,
    buildLoginUrl: (h) =>
      `https://accounts.google.com/ServiceLogin?service=youtube&continue=${encodeURIComponent(
        `https://www.youtube.com/@${h}`
      )}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    shortName: 'FB',
    audienceLabel: 'Followers',
    contentLabel: 'Page Posts',
    badgeBg: '#7CC4FA',
    badgeText: '#19154E',
    placeholder: 'https://www.facebook.com/your_page or profile.php?id=... or @your_page',
    tokenLabel: 'Optional Facebook Page Graph Access Token',
    tokenPlaceholder: 'EAA...',
    buildProfileUrl: (h) =>
      /^https?:\/\//i.test(h)
        ? h
        : /^\d{8,}$/.test(h)
        ? `https://www.facebook.com/profile.php?id=${encodeURIComponent(h)}`
        : `https://www.facebook.com/${encodeURIComponent(h)}`,
    buildLoginUrl: (h) =>
      /^https?:\/\//i.test(h)
        ? 'https://www.facebook.com/login.php'
        : `https://www.facebook.com/login.php?next=${encodeURIComponent(
            /^\d{8,}$/.test(h)
              ? `https://www.facebook.com/profile.php?id=${h}`
              : `https://www.facebook.com/${h}`
          )}`,
  },
  {
    id: 'x',
    name: 'X',
    shortName: 'X',
    audienceLabel: 'Followers',
    contentLabel: 'Posts',
    badgeBg: '#19154E',
    badgeText: '#FFF8FC',
    placeholder: 'https://x.com/your_handle or @your_handle',
    tokenLabel: 'Optional X API v2 Bearer Token',
    tokenPlaceholder: 'AAAAAAAAAAAAAAAAAAAAA...',
    buildProfileUrl: (h) => `https://x.com/${encodeURIComponent(h)}`,
    buildLoginUrl: (h) =>
      `https://x.com/i/flow/login?redirect_after_login=${encodeURIComponent(`/${h}`)}`,
  },
  {
    id: 'threads',
    name: 'Threads',
    shortName: 'Threads',
    audienceLabel: 'Followers',
    contentLabel: 'Threads',
    badgeBg: '#B799E8',
    badgeText: '#19154E',
    placeholder: 'https://www.threads.com/@your_handle or @your_handle',
    tokenLabel: 'Optional Threads Graph API Token',
    tokenPlaceholder: 'THQW...',
    buildProfileUrl: (h) => `https://www.threads.com/@${encodeURIComponent(h)}`,
    buildLoginUrl: (h) =>
      h ? `https://www.threads.com/@${encodeURIComponent(h)}` : 'https://www.threads.com/login',
  },
];

export const PLATFORM_BY_ID = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

const RESERVED_SOCIAL_PATHS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'watch',
  'login',
  'logout',
  'signup',
  'i',
  'home',
  'foryou',
  'following',
  'friends',
  'messages',
  'upload',
  'tiktokstudio',
  'creator-center',
  'business',
  'settings',
  'search',
  'tag',
  'music',
  'live',
  'about',
  'share',
  'profile.php',
  'people',
  'pages',
]);

const KNOWN_SOCIAL_DOMAINS = [
  'instagram.com',
  'instagr.am',
  'tiktok.com',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.com',
  'fb.watch',
  'x.com',
  'twitter.com',
  'threads.com',
  'threads.net',
];

function isBareSocialDomain(host) {
  const h = String(host || '')
    .toLowerCase()
    .replace(/^(www|m)\./, '');
  return KNOWN_SOCIAL_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
}

export function isShortSocialShareUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  try {
    const normalized = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(normalized);
    const h = u.hostname.toLowerCase();
    const parts = u.pathname.split('/').filter(Boolean);
    if ((h === 'vm.tiktok.com' || h === 'vt.tiktok.com') && parts.length >= 1) return true;
    if (h.endsWith('tiktok.com') && parts[0]?.toLowerCase() === 't' && parts[1]) return true;
    if (h === 'fb.me' && parts.length >= 1) return true;
    if ((h.endsWith('facebook.com') || h.endsWith('fb.com')) && parts[0]?.toLowerCase() === 'share' && parts[1]) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export const isShortTikTokShareUrl = isShortSocialShareUrl;

export function explainInvalidHandleInput(raw, platformName = 'Social') {
  const s = String(raw || '').trim();
  if (!s) {
    return `Please enter your ${platformName} @handle or profile link first.`;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return `That looks like an email address. Please enter your public ${platformName} @username (for example @your_handle) or profile URL instead.`;
  }
  if (extractHandleForPlatform(s) === '') {
    return `Please include your ${platformName} @username or full profile link (for example @your_handle), not just the ${platformName} homepage or login URL.`;
  }
  return '';
}

export function extractHandleForPlatform(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';

  // Reject email addresses (e.g. user@gmail.com) so they are never sent as @handles
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return '';
  }

  // Allow TikTok & Facebook short share links through so backend resolves redirect to real handle/ID
  if (isShortSocialShareUrl(s)) {
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  }

  // Support bare "profile.php?id=123456789" pasted without domain
  if (/^profile\.php\?/i.test(s)) {
    const idMatch = s.match(/[?&]id=(\d{6,})/);
    if (idMatch) return idMatch[1];
  }

  const looksLikeUrlOrDomain =
    /^https?:\/\//i.test(s) ||
    s.includes('.com') ||
    s.includes('.net') ||
    s.includes('fb.me') ||
    s.includes('x.com') ||
    s.includes('youtu.be');

  if (looksLikeUrlOrDomain) {
    try {
      const normalized = /^https?:\/\//i.test(s) ? s : `https://${s}`;
      const u = new URL(normalized);
      const hostLower = u.hostname.toLowerCase();
      const parts = u.pathname
        .split('/')
        .map((p) => decodeURIComponent(p).trim())
        .filter(Boolean);

      // Facebook special URL shapes: profile.php?id=..., /people/Name/123..., /p/Name-123..., /pages/.../123...
      if (hostLower.endsWith('facebook.com') || hostLower.endsWith('fb.com')) {
        const queryId = u.searchParams.get('id');
        if (queryId && /^\d{6,}$/.test(queryId.trim())) {
          return queryId.trim();
        }
        if (parts[0]?.toLowerCase() === 'people' && parts.length >= 2) {
          const numericPart = [...parts].reverse().find((seg) => /^\d{6,}$/.test(seg));
          if (numericPart) return numericPart;
        }
        if (parts[0]?.toLowerCase() === 'p' && parts[1]) {
          const trailingId = parts[1].match(/-(\d{6,})$/)?.[1];
          return trailingId || parts[1];
        }
        if (parts[0]?.toLowerCase() === 'pages' && parts.length >= 2) {
          const lastSeg = parts[parts.length - 1];
          const trailingId = lastSeg.match(/(\d{6,})$/)?.[1];
          if (trailingId) return trailingId;
        }
        if (parts[0]?.toLowerCase() === 'profile.php') {
          return '';
        }
      }

      if (isBareSocialDomain(u.hostname)) {
        if (parts.length === 0) {
          return '';
        }
        if (['c', 'channel', 'user'].includes(parts[0].toLowerCase()) && parts[1]) {
          const ch = parts[1].replace(/^@+\s*/, '').trim();
          return RESERVED_SOCIAL_PATHS.has(ch.toLowerCase()) ? '' : ch;
        }
        // Support URLs like https://www.tiktok.com/@username/video/123456 or https://www.threads.com/@username
        const first = parts[0].replace(/^@+\s*/, '').trim();
        if (!first || RESERVED_SOCIAL_PATHS.has(first.toLowerCase())) {
          return '';
        }
        return first;
      }
      // Universal fallback: any URL with an explicit /@handle segment
      const atSegment = parts.find((p) => p.startsWith('@') && p.length > 1);
      if (atSegment) {
        return atSegment.replace(/^@+\s*/, '').trim();
      }
    } catch {
      return '';
    }
  }

  const cleaned = s
    .replace(/^@+\s*/, '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')[0]
    .split('?')[0]
    .trim();

  if (
    !cleaned ||
    cleaned === 'http:' ||
    cleaned === 'https:' ||
    cleaned.includes('@') ||
    isBareSocialDomain(cleaned) ||
    RESERVED_SOCIAL_PATHS.has(cleaned.toLowerCase())
  ) {
    return '';
  }
  return cleaned;
}

export function PlatformIcon({ platform, className = 'w-4 h-4' }) {
  if (platform === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }
  if (platform === 'tiktok') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .6.05.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-.02a6.28 6.28 0 0 0 1.86-4.47V8.76a8.26 8.26 0 0 0 4.84 1.55V6.86a4.8 4.8 0 0 1-.97-.17Z" />
      </svg>
    );
  }
  if (platform === 'youtube') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
      </svg>
    );
  }
  if (platform === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
      </svg>
    );
  }
  if (platform === 'x') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (platform === 'threads') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M19 12a7 7 0 1 0-2.05 4.95" />
        <path d="M15.5 11.5c0 2-1.3 3.5-3.2 3.5-1.8 0-3.1-1.2-3.1-2.8 0-1.6 1.3-2.7 3.2-2.7 2.2 0 3.6 1.3 3.6 3.7 0 2.6-1.2 4.3-3.1 4.3-1.2 0-2.1-.6-2.5-1.5" />
        <path d="M12.2 7.2c1.8 0 3.3.9 3.8 2.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function buildCombinedPlatformAnalytics(analyticsMap, connectionsMap, defaultBenchmark) {
  const connectedIds = PLATFORMS.map((p) => p.id).filter(
    (pid) => connectionsMap?.[pid]?.handle && analyticsMap?.[pid]?.profile?.username
  );

  if (connectedIds.length === 0) {
    return null;
  }

  let totalFollowers = 0;
  let totalMedia = 0;
  let allPosts = [];
  const platformBreakdown = [];

  for (const pid of connectedIds) {
    const data = analyticsMap[pid];
    const pMeta = PLATFORM_BY_ID[pid];
    const followers = Number(data?.profile?.followers_count || 0);
    const media = Number(data?.profile?.media_count || 0);
    totalFollowers += followers;
    totalMedia += media;

    const pPosts = (data?.posts || []).map((post) => ({
      ...post,
      platform: pid,
      platformName: pMeta.name,
    }));
    allPosts = allPosts.concat(pPosts);

    platformBreakdown.push({
      platform: pid,
      platformName: pMeta.name,
      handle: data.profile.username,
      followers_count: followers,
      media_count: media,
      posts_synced: pPosts.length,
      total_views: pPosts.reduce((s, x) => s + (x.views || 0), 0),
      total_likes: pPosts.reduce((s, x) => s + (x.likes || 0), 0),
      profile_url: data.profile.profile_url || pMeta.buildProfileUrl(data.profile.username),
    });
  }

  const totalViews = allPosts.reduce((s, x) => s + (x.views || 0), 0);
  const totalLikes = allPosts.reduce((s, x) => s + (x.likes || 0), 0);
  const totalComments = allPosts.reduce((s, x) => s + (x.comments || 0), 0);
  const withViews = allPosts.filter((p) => (p.views || 0) > 0);
  const avgEr =
    withViews.length > 0
      ? Number(
          (
            withViews.reduce((s, p) => s + (p.engagement_rate || 0), 0) / withViews.length
          ).toFixed(2)
        )
      : 0;

  const byViews = [...allPosts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const top1 = byViews[0] || {};

  const handlesSummary = platformBreakdown
    .map((b) => `${b.platformName}: @${b.handle} (${b.followers_count.toLocaleString()})`)
    .join(' · ');

  const strategies = [
    {
      id: 'all-strat-1',
      category: 'Cross-Platform Repurposing',
      impact: `${connectedIds.length} Connected Platforms`,
      title: `Syndicate Your #1 Post Across All ${connectedIds.length} Channels`,
      finding: top1.title
        ? `Your #1 post overall is on ${top1.platformName || 'Social'} ("${top1.title}") with ${(top1.views || 0).toLocaleString()} views. Repurposing top hooks across Instagram, TikTok, YouTube Shorts, X, Facebook, and Threads compounds reach.`
        : `Connected across ${handlesSummary}.`,
      action_items: [
        'Adapt your #1 short-form video hook natively (no watermarks) across Instagram Reels, TikTok, and YouTube Shorts.',
        'Turn the key takeaways into a text thread on X and Threads within 2 hours of video publish.',
        'Attach a unified 1-word keyword CTA ("LINK" or "GUIDE") across every platform.',
      ],
      recommended_keyword: 'LINK',
    },
    {
      id: 'all-strat-2',
      category: 'Unified Comment-to-DM Funnel',
      impact: `${totalFollowers.toLocaleString()} Total Audience`,
      title: 'Run One Shared Keyword Trigger Across All Connected Platforms',
      finding: `Across ${totalFollowers.toLocaleString()} combined followers/subscribers and ${allPosts.length} synced items, a single consistent CTA keyword makes cross-platform conversion effortless.`,
      action_items: [
        'Create an "All Platforms" keyword flow in Auto-Replies & DMs so followers get the same instant link everywhere.',
        'Publish during 12:15 PM EST or 6:00 PM EST to hit peak US East & West Coast windows simultaneously.',
      ],
      recommended_keyword: 'GUIDE',
    },
  ];

  const contentIdeas = [
    {
      title: `Omnichannel Sequel to "${(top1.title || 'Your #1 Post').slice(0, 44)}"`,
      format: 'REELS + TIKTOK + SHORTS + THREADS',
      hook: 'Part 2 of our most-watched breakdown — plus the written checklist in Threads & X...',
      cta_keyword: 'LINK',
      predicted_er: `${Math.max(avgEr, 6.8)}%`,
    },
    {
      title: '3 Fast Fixes Checklist (Video + Carousel + Thread)',
      format: 'CROSS-PLATFORM BUNDLE',
      hook: 'Save this 30-second checklist before your next project...',
      cta_keyword: 'GUIDE',
      predicted_er: `${Math.max(Number((avgEr + 1.4).toFixed(1)), 7.5)}%`,
    },
    {
      title: 'Behind-the-Scenes Toolkit Breakdown',
      format: 'YOUTUBE + IG + TIKTOK',
      hook: 'Here is the exact setup from start to finish...',
      cta_keyword: 'KIT',
      predicted_er: `${Math.max(Number((avgEr + 1.9).toFixed(1)), 8.2)}%`,
    },
  ];

  const briefLines = [
    `# OPENCLAW ALL-PLATFORMS BRIEF (${connectedIds.length} Connected Networks)`,
    `- **Connected Accounts**: ${handlesSummary}`,
    `- **Combined Audience**: ${totalFollowers.toLocaleString()} | **Combined Posts/Videos**: ${totalMedia.toLocaleString()}`,
    `- **Tracked Items**: ${allPosts.length} | **Combined Views**: ${totalViews.toLocaleString()} | **Combined Likes**: ${totalLikes.toLocaleString()}`,
    '',
    '## TOP PERFORMING CONTENT ACROSS ALL PLATFORMS',
    ...byViews.slice(0, 8).map(
      (p, i) =>
        `${i + 1}. [${p.platformName || p.platform}] **${p.title}** (${p.permalink})\n   - Metrics: ${(p.views || 0).toLocaleString()} views | ${(p.likes || 0).toLocaleString()} likes | ${p.engagement_rate || 0}% ER`
    ),
  ];

  return {
    platform: 'all',
    source: 'live_multi_platform',
    fetched_at: new Date().toISOString(),
    platform_breakdown: platformBreakdown,
    profile: {
      username: `${connectedIds.length} platforms`,
      name: 'All Connected Platforms',
      account_type: 'OMNICHANNEL',
      followers_count: totalFollowers,
      follows_count: null,
      media_count: totalMedia,
      biography: handlesSummary,
      profile_picture_url: '',
    },
    posts: allPosts,
    analysis: {
      summary: {
        total_posts_analyzed: allPosts.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_saves: null,
        total_shares: null,
        total_followers_gained: null,
        avg_engagement_rate: avgEr,
        overall_engagement_rate: avgEr,
        comment_lift_multiplier: 3.1,
        us_audience_share_pct: null,
        top_reel_views: top1.views || 0,
        top_reel_likes: top1.likes || 0,
        top_reel_title: top1.title || '',
      },
      us_audience_activity: {
        ...defaultBenchmark,
        key_insight: `Across your ${connectedIds.length} connected platforms (${totalFollowers.toLocaleString()} combined audience), publishing at 12:15 PM EST or 6:00 PM EST synchronizes reach across US East & West Coast scroll peaks.`,
      },
      strategies,
      content_ideas: contentIdeas,
      openclaw_brief: briefLines.join('\n'),
      top_by_views: byViews.slice(0, 3),
    },
  };
}
