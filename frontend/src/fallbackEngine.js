// Generic empty workspace baseline & local OpenClaw strategy formatter for SocialAssist.
// Supports Instagram, TikTok, YouTube, Facebook, X, Threads, and All-Platforms mode.
// Contains ZERO personal accounts, tokens, or private Insights.

export const INITIAL_AUTOMATIONS = [];

export const GENERIC_US_BENCHMARK_ACTIVITY = {
  us_audience_share_pct: null,
  us_estimated_followers: null,
  primary_us_window_est: '5:30 PM – 8:30 PM EST (2:30 PM – 5:30 PM PST)',
  secondary_us_window_est: '12:00 PM – 1:15 PM EST (9:00 AM – 10:15 AM PST)',
  top_countries: null,
  age_ranges: null,
  gender_split: null,
  us_timezones: [
    { zone: 'Eastern (EST/EDT)', share_pct: 47, peak_local: '6:00 PM – 9:00 PM EST' },
    { zone: 'Central (CST/CDT)', share_pct: 29, peak_local: '5:30 PM – 8:30 PM CST (6:30–9:30 PM EST)' },
    { zone: 'Pacific (PST/PDT)', share_pct: 17, peak_local: '5:00 PM – 8:00 PM PST (8–11 PM EST)' },
    { zone: 'Mountain (MST/MDT)', share_pct: 7, peak_local: '5:30 PM – 8:30 PM MST' },
  ],
  us_cities: [
    { city: 'New York, NY', share_pct: 15.0, tz: 'EST' },
    { city: 'Los Angeles, CA', share_pct: 12.0, tz: 'PST' },
    { city: 'Chicago, IL', share_pct: 8.5, tz: 'CST' },
    { city: 'Dallas / Austin, TX', share_pct: 8.0, tz: 'CST' },
    { city: 'San Francisco / Seattle', share_pct: 7.5, tz: 'PST' },
  ],
  hourly_est: [
    { hour: '8 AM', us_active: 34, global_active: 72, label: 'US East Morning Commute' },
    { hour: '10 AM', us_active: 56, global_active: 75, label: 'Mid-Morning Scroll' },
    { hour: '12 PM', us_active: 86, global_active: 78, label: '🔥 US Lunch + West Coast Morning' },
    { hour: '2 PM', us_active: 65, global_active: 62, label: 'Mid-Afternoon Break' },
    { hour: '4 PM', us_active: 78, global_active: 58, label: 'US East Coast Wrap-Up' },
    { hour: '6 PM', us_active: 98, global_active: 68, label: '🚀 #1 US PEAK (East Evening + West Afternoon)' },
    { hour: '8 PM', us_active: 94, global_active: 63, label: '🔥 US Prime Evening Window' },
    { hour: '10 PM', us_active: 74, global_active: 54, label: 'West Coast Evening Scroll' },
  ],
  best_us_slots: [
    {
      day: 'Tuesday',
      window_est: '5:45 PM – 7:30 PM EST',
      us_active_pct: 98,
      best_for: 'Flagship Educational & Tutorial Videos',
    },
    {
      day: 'Thursday',
      window_est: '12:00 PM – 1:15 PM EST',
      us_active_pct: 92,
      best_for: 'Quick Checklists, Demos & Carousel Breakdowns',
    },
    {
      day: 'Wednesday',
      window_est: '6:00 PM – 8:30 PM EST',
      us_active_pct: 94,
      best_for: 'Comment-to-DM Resource & Lead Magnet Posts',
    },
    {
      day: 'Sunday',
      window_est: '4:30 PM – 7:00 PM EST',
      us_active_pct: 90,
      best_for: 'Behind-the-Scenes & Weekly Recap Content',
    },
  ],
  key_insight:
    'Publishing around 12:15 PM EST or 6:00 PM EST aligns US East Coast evening scroll time with US West Coast afternoon activity.',
};

export const EMPTY_WORKSPACE_ANALYTICS = {
  source: 'unconnected_workspace',
  fetched_at: null,
  profile: {
    username: '',
    name: 'No Social Account Connected Yet',
    account_type: 'CREATOR',
    followers_count: 0,
    follows_count: 0,
    media_count: 0,
    biography:
      'Connect Instagram, TikTok, YouTube, Facebook, X, or Threads in the Connect Accounts tab to pull live stats.',
    profile_picture_url: '',
    fallback_profile_picture_url: '',
  },
  posts: [],
  analysis: {
    summary: {
      total_posts_analyzed: 0,
      total_views: 0,
      total_likes: 0,
      total_comments: 0,
      total_saves: null,
      total_shares: null,
      total_followers_gained: null,
      avg_engagement_rate: 0,
      overall_engagement_rate: 0,
      comment_lift_multiplier: 3.1,
      us_audience_share_pct: null,
      top_reel_views: 0,
      top_reel_likes: 0,
      top_reel_title: '',
    },
    us_audience_activity: GENERIC_US_BENCHMARK_ACTIVITY,
    strategies: [],
    content_ideas: [],
    openclaw_brief:
      '# Connect Instagram, TikTok, YouTube, Facebook, X, or Threads in the Connect Accounts tab to generate a live OpenClaw brief.',
  },
};

export const INITIAL_ANALYTICS = EMPTY_WORKSPACE_ANALYTICS;

export function runLocalOpenClawAnalysis(prompt, analyticsData = EMPTY_WORKSPACE_ANALYTICS) {
  const posts = analyticsData?.posts || [];
  const profile = analyticsData?.profile || {};
  const username = profile.username || '';
  const platformLabel =
    analyticsData?.platform === 'all'
      ? 'All Connected Platforms'
      : (analyticsData?.platform || 'Social').replace(/^\w/, (c) => c.toUpperCase());

  if (!username || posts.length === 0) {
    return `### 🦞 OpenClaw Omnichannel Social Agent\nConnect **Instagram, TikTok, YouTube, Facebook, X, or Threads** in the **Connect** tab first to analyze live videos, posts, views, likes, and engagement patterns!`;
  }

  const byViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const top1 = byViews[0] || {};
  const top2 = byViews[1] || top1;
  const top3 = byViews[2] || top1;

  const followersCount = profile.followers_count || 0;
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.comments || 0), 0);
  const handleTitle = analyticsData?.platform === 'all' ? username : `@${username}`;

  return `### 🦞 OpenClaw Live ${platformLabel} Analysis — ${handleTitle} (${followersCount.toLocaleString()} Audience · ${totalViews.toLocaleString()} Tracked Views)
**Agent Task**: *${prompt}*

---

#### 1. What Your Live Content Reveals (${posts.length} Synced Items)
Across **${posts.length} live items** (**${totalViews.toLocaleString()} views** · **${totalLikes.toLocaleString()} likes** · **${totalComments.toLocaleString()} comments**):

1. **🥇 #1 Top Performing Item: "${top1.title || 'Post #1'}"** (*${top1.platformName || platformLabel} · ${top1.published_label || 'Live'}*)
   - **Live Metrics**: **\`${(top1.views || 0).toLocaleString()} views\`** · **\`${(top1.likes || 0).toLocaleString()} likes\`** · **\`${top1.engagement_rate || 0}% ER\`**
   - **Link**: ${top1.permalink || ''}
2. **🥈 #2 Performing Item: "${top2.title || 'Post #2'}"** (*${top2.platformName || platformLabel} · ${top2.published_label || 'Live'}*)
   - **Live Metrics**: **\`${(top2.views || 0).toLocaleString()} views\`** · **\`${(top2.likes || 0).toLocaleString()} likes\`** · **\`${top2.engagement_rate || 0}% ER\`**
   - **Link**: ${top2.permalink || ''}
3. **🥉 #3 Performing Item: "${top3.title || 'Post #3'}"** (*${top3.platformName || platformLabel} · ${top3.published_label || 'Live'}*)
   - **Live Metrics**: **\`${(top3.views || 0).toLocaleString()} views\`** · **\`${(top3.likes || 0).toLocaleString()} likes\`** · **\`${top3.engagement_rate || 0}% ER\`**
   - **Link**: ${top3.permalink || ''}

---

#### 2. 🎬 3 Next High-Converting Ideas (${platformLabel})
1. **Direct Part 2 Sequel to "${(top1.title || 'Your #1 Post').slice(0, 56)}"** — Reuse the exact first-3-second hook format and add a 1-word Comment/DM trigger (**\`LINK\`**).
2. **Cross-Platform Native Adaptation** — Publish the short video cut to Instagram Reels, TikTok, and YouTube Shorts, and post the written summary thread on X, Facebook, and Threads (**\`GUIDE\`**).
3. **Peak Window Publishing** — Test publishing at **12:15 PM EST** and **6:00 PM EST** to capture simultaneous US East & West Coast scroll windows.`;
}
