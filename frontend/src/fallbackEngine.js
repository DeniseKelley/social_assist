// Hybrid Client-Side Engine for when SocialAssist is served as a static page inside techfairylab

export const INITIAL_AUTOMATIONS = [
  {
    id: 'flow-1',
    name: 'Send AI Tool Link on Comment',
    active: true,
    trigger_type: 'comment_keyword',
    keywords: ['LINK', 'TOOL', 'AI', 'PROMPT'],
    target_posts: 'all',
    public_comment_reply: 'Just sent the link straight to your DMs! Check your message requests ✨🧚‍♀️',
    dm_message: 'Hey there! 👋 Thanks for commenting on my reel! Here is the full AI guide & tool link I mentioned:',
    dm_button_text: 'Open TechFairy Guide ✨',
    dm_button_url: 'https://labfae.com',
    stats: { triggered: 142, dms_sent: 142, link_clicks: 98 },
  },
  {
    id: 'flow-2',
    name: 'Source Code / Repo Auto-DM',
    active: true,
    trigger_type: 'comment_keyword',
    keywords: ['CODE', 'GITHUB', 'REPO', 'TUTORIAL', 'SCRIPT'],
    target_posts: 'all',
    public_comment_reply: 'Sent you the code repo in your DMs! 💻✨',
    dm_message: 'Hi! 🧚‍♀️ Here is the GitHub repository and step-by-step setup tutorial from the video:',
    dm_button_text: 'Get the Code 💻',
    dm_button_url: 'https://github.com/DeniseKelley',
    stats: { triggered: 87, dms_sent: 87, link_clicks: 64 },
  },
  {
    id: 'flow-3',
    name: 'Story Reply Welcome & Freebie',
    active: true,
    trigger_type: 'story_reply',
    keywords: ['🔥', 'WANT', 'SEND', 'YES'],
    target_posts: 'stories',
    public_comment_reply: '',
    dm_message: "Thanks so much for replying to my story! 💜 Here's the exclusive resource I shared today:",
    dm_button_text: 'Claim Free Resource 🎁',
    dm_button_url: 'https://labfae.com',
    stats: { triggered: 53, dms_sent: 53, link_clicks: 41 },
  },
  {
    id: 'flow-4',
    name: "Direct DM Keyword ('COLLAB' / 'WORK')",
    active: true,
    trigger_type: 'dm_keyword',
    keywords: ['COLLAB', 'SPONSOR', 'WORK', 'PARTNER'],
    target_posts: 'dm',
    public_comment_reply: '',
    dm_message: 'Hey! ✨ Thanks for reaching out to @techfairyanna about a collaboration! You can view my media kit and book a slot below:',
    dm_button_text: 'View Media Kit & Contact 📊',
    dm_button_url: 'https://labfae.com',
    stats: { triggered: 19, dms_sent: 19, link_clicks: 16 },
  },
];

const SAMPLE_POSTS = [
  {
    id: 'post-105',
    title: '3 Python Scripts That Save Me 5 Hours Every Week',
    type: 'REEL',
    caption:
      "3 Python scripts that save me 5 hours every single week 🐍⚡ Comment 'SCRIPT' and I'll DM you all 3 files for free! #python #automation #codinglife #tech",
    timestamp: '2026-10-21T17:30:00Z',
    likes: 2150,
    comments: 389,
    saves: 910,
    shares: 520,
    views: 34800,
    followers_gained: 492,
    follower_conversion_rate: 1.41,
    retention_pct: 68,
    duration_sec: 32,
    us_viewer_share_pct: 74,
    dm_triggers: 341,
    best_keyword: 'SCRIPT',
    engagement_rate: 11.41,
    video_summary_text:
      "HOOK (0-3s): Holds up laptop showing 3 automated terminal scripts running simultaneously with text 'Stop doing these 3 tasks manually in 2026'. " +
      "BODY (3-26s): Fast 7-second visual demo of each script: (1) Auto-renaming & sorting downloads/screenshots into project folders, (2) Extracting audio & clean markdown notes from YouTube lectures, (3) Bulk resizing & removing backgrounds from UI assets. " +
      "CTA (26-32s): 'Comment SCRIPT and my fairy bot will DM you all 3 Python files!' " +
      "WHY IT CONVERTED (+492 Followers / 34.8K Views): Quantified time-saved hook ('5 hours/week') + immediate visual proof + high-value tangible giveaway.",
  },
  {
    id: 'post-101',
    title: 'Automated My Coding Workflow with Local AI Agents in 10 Mins',
    type: 'REEL',
    caption:
      "How I automated my entire coding workflow with local AI agents in 10 minutes 🧚‍♀️✨ Comment 'LINK' and I'll DM you the exact setup guide! #ai #coding #techfairy #automation #developer",
    timestamp: '2026-11-04T21:30:00Z',
    likes: 1840,
    comments: 312,
    saves: 690,
    shares: 415,
    views: 28400,
    followers_gained: 384,
    follower_conversion_rate: 1.35,
    retention_pct: 64,
    duration_sec: 38,
    us_viewer_share_pct: 71,
    dm_triggers: 268,
    best_keyword: 'LINK',
    engagement_rate: 11.47,
    video_summary_text:
      "HOOK (0-3s): Split-screen of chaotic 12-tab browser vs. one clean local AI agent terminal running automatically. " +
      "BODY (3-31s): Step-by-step walkthrough connecting a local coding agent to Git + VS Code so it writes unit tests, fixes lint errors, and summarizes PRs automatically. " +
      "CTA (31-38s): 'Follow @techfairyanna for more AI dev setups & comment LINK for the full architecture diagram!' " +
      "WHY IT CONVERTED (+384 Followers / 28.4K Views): Explicit 'Follow + Comment LINK' combo paired with a relatable developer pain point.",
  },
  {
    id: 'post-102',
    title: 'Stop Writing Boilerplate UI: 3 Open-Source React + Python Templates',
    type: 'REEL',
    caption:
      "Stop writing boilerplate UI from scratch! Here are 3 open-source React + Python templates that look like magic 💻🪄 Drop 'CODE' in the comments and my bot will send you the GitHub repo!",
    timestamp: '2026-11-01T16:15:00Z',
    likes: 1490,
    comments: 245,
    saves: 580,
    shares: 310,
    views: 21900,
    followers_gained: 318,
    follower_conversion_rate: 1.45,
    retention_pct: 61,
    duration_sec: 29,
    us_viewer_share_pct: 76,
    dm_triggers: 204,
    best_keyword: 'CODE',
    engagement_rate: 11.99,
    video_summary_text:
      "HOOK (0-3s): 'Stop building ugly admin dashboards from scratch!' with a dramatic before/after UI transformation. " +
      "BODY (3-24s): Rapid showcase of 3 full-stack React + FastAPI starter templates with glassmorphic cards, auth, and live charts already wired up. " +
      "CTA (24-29s): 'Drop CODE in the comments and I'll send you the GitHub repos!' " +
      "WHY IT CONVERTED (+318 Followers / 21.9K Views): Highest follower conversion rate (1.45%) because US full-stack devs followed to keep up with future repo drops.",
  },
  {
    id: 'post-103',
    title: '7 AI Prompts Every Creator & Engineer Should Bookmark in 2026',
    type: 'CAROUSEL',
    caption:
      "7 AI prompts every creator & engineer should bookmark in 2026 📌 Save this post for later or comment 'PROMPT' to get the copy-paste Notion sheet in your DMs! #aiprompts #techcreator #womenintech",
    timestamp: '2026-10-28T22:00:00Z',
    likes: 1120,
    comments: 164,
    saves: 820,
    shares: 195,
    views: 15600,
    followers_gained: 214,
    follower_conversion_rate: 1.37,
    retention_pct: 72,
    duration_sec: 0,
    us_viewer_share_pct: 69,
    dm_triggers: 139,
    best_keyword: 'PROMPT',
    engagement_rate: 14.74,
    video_summary_text:
      "SLIDE 1 HOOK: '7 System Prompts That Make LLMs Write Senior-Level Code'. " +
      "SLIDES 2-6: Exact copy-paste prompt frameworks for architecture review, edge-case debugging, SQL optimization, and UI polish. " +
      "SLIDE 7 CTA: 'Save this post 📌 & comment PROMPT for the Notion database!' " +
      "WHY IT CONVERTED (+214 Followers / 15.6K Views): 5.25% Save-to-View ratio triggered Instagram's high-intent recommendation loop.",
  },
  {
    id: 'post-104',
    title: 'Behind the Scenes Building My Interactive 3D Web Portfolio (labfae.com)',
    type: 'REEL',
    caption:
      'Behind the scenes building my interactive 3D web portfolio at labfae.com 🧚‍♀️🌸 What feature should I add next? #webdev #threejs #creativecoding #techfairyanna',
    timestamp: '2026-10-25T13:00:00Z',
    likes: 890,
    comments: 68,
    saves: 210,
    shares: 94,
    views: 11200,
    followers_gained: 49,
    follower_conversion_rate: 0.44,
    retention_pct: 47,
    duration_sec: 41,
    us_viewer_share_pct: 52,
    dm_triggers: 12,
    best_keyword: 'None (No CTA)',
    engagement_rate: 11.27,
    video_summary_text:
      "HOOK (0-3s): Aesthetic desk shot panning to Three.js fairy portal on monitor. " +
      "BODY (3-35s): Ambient time-lapse of shader coding and blender lighting tweaks with lo-fi music. " +
      "CTA (35-41s): Open question 'What feature should I add next?' without a keyword DM trigger. " +
      "DIAGNOSIS (+49 Followers / 11.2K Views): Posted at 9:00 AM EST (missed US West Coast wake-up) and lacked a concrete resource giveaway or follow CTA.",
  },
  {
    id: 'post-106',
    title: 'My Cozy Night Coding Desk Tour & Mechanical Keyboard Sound Test',
    type: 'REEL',
    caption:
      'Cozy night coding session ✨ Pink keycaps + Matcha latte while debugging FastAPI endpoints 🌸 #desktour #setupinspiration #cozycoding #girlintech',
    timestamp: '2026-10-18T11:30:00Z',
    likes: 640,
    comments: 42,
    saves: 85,
    shares: 22,
    views: 6800,
    followers_gained: 19,
    follower_conversion_rate: 0.28,
    retention_pct: 43,
    duration_sec: 19,
    us_viewer_share_pct: 44,
    dm_triggers: 0,
    best_keyword: 'None (No CTA)',
    engagement_rate: 11.6,
    video_summary_text:
      "HOOK (0-3s): ASMR mechanical keyboard typing closeup. " +
      "BODY (3-19s): Panning shots of LED fairy lights, monitor arm, and aesthetic desk accessories. " +
      "DIAGNOSIS (+19 Followers / 6.8K Views): Lowest follower conversion (0.28%)—vibe/aesthetic reels without a specific coding takeaway or keyword DM trigger do not convert viewers into followers.",
  },
];

const US_AUDIENCE_ACTIVITY = {
  us_audience_share_pct: 68.4,
  primary_timezone: 'America/New_York (EST)',
  key_insight:
    'Global metrics show a false bump at 8:00 AM EST from Europe/India, where your follower conversion is only 0.45%. Waiting until 12:15 PM EST or 5:30 PM – 8:00 PM EST captures both US East Coast (46%) and US West Coast tech hubs (31%), boosting follower conversion to 1.44% (+3.2x higher new followers per 1,000 views).',
  hourly_est: [
    { hour: '6 AM', us_active: 14, global_active: 58, label: 'Europe Peak / US Asleep' },
    { hour: '8 AM', us_active: 24, global_active: 66, label: 'East Coast Wake / West Coast Asleep' },
    { hour: '10 AM', us_active: 48, global_active: 62, label: 'US Morning Ramp' },
    { hour: '12 PM', us_active: 86, global_active: 79, label: '🇺🇸 US Peak #2 (East Lunch + West Standup)' },
    { hour: '2 PM', us_active: 64, global_active: 70, label: 'US Afternoon Work Block' },
    { hour: '4 PM', us_active: 78, global_active: 74, label: 'East Coast Wrap-Up' },
    { hour: '6 PM', us_active: 98, global_active: 88, label: '🇺🇸 US Peak #1 (East Evening + West Afternoon)' },
    { hour: '8 PM', us_active: 94, global_active: 82, label: '🇺🇸 US Prime Scroll Window' },
    { hour: '10 PM', us_active: 72, global_active: 64, label: 'West Coast Evening' },
    { hour: '12 AM', us_active: 38, global_active: 49, label: 'Late Night West Coast' },
  ],
  us_cities: [
    { city: 'New York, NY', tz: 'EST', share_pct: 18.4 },
    { city: 'San Francisco / Bay Area, CA', tz: 'PST', share_pct: 16.2 },
    { city: 'Los Angeles, CA', tz: 'PST', share_pct: 11.5 },
    { city: 'Austin, TX', tz: 'CST', share_pct: 8.9 },
    { city: 'Seattle, WA', tz: 'PST', share_pct: 7.8 },
    { city: 'Chicago, IL', tz: 'CST', share_pct: 5.6 },
  ],
  us_timezones: [
    { zone: 'Eastern (EST/EDT)', share_pct: 46 },
    { zone: 'Pacific (PST/PDT)', share_pct: 31 },
    { zone: 'Central (CST/CDT)', share_pct: 15 },
    { zone: 'Mountain (MST/MDT)', share_pct: 8 },
  ],
  best_us_slots: [
    {
      day: 'Tuesday',
      window_est: '5:30 PM – 7:30 PM EST',
      us_active_pct: 98,
      best_for: 'Flagship Coding/AI Reel (Highest Follower Gain)',
    },
    {
      day: 'Thursday',
      window_est: '5:30 PM – 8:00 PM EST',
      us_active_pct: 96,
      best_for: 'Tool Demo + Comment Keyword Auto-DM',
    },
    {
      day: 'Wednesday',
      window_est: '12:00 PM – 1:15 PM EST',
      us_active_pct: 86,
      best_for: 'Educational Carousel (High US Lunch Saves)',
    },
    {
      day: 'Sunday',
      window_est: '6:00 PM – 8:30 PM EST',
      us_active_pct: 94,
      best_for: 'Weekly Workflow / Career Tech Reel',
    },
  ],
};

const OPENCLAW_BRIEF = `# OPENCLAW AGENT BRIEF — @techfairyanna INSTAGRAM PERFORMANCE & US AUDIENCE

## 1. TOP PERFORMING VIDEOS (RANKED BY FOLLOWERS GAINED & VIEWS)

### #1. 3 Python Scripts That Save Me 5 Hours Every Week (REEL)
- **Views**: 34,800 | **Followers Gained**: +492 (1.41% conversion)
- **Likes**: 2,150 | **Comments**: 389 | **Saves**: 910 | **Shares**: 520
- **US Viewer Share**: 74% | **Comment-to-DM Trigger**: \`SCRIPT\` (341 DMs sent)
- **Video Summary for Agent**: HOOK (0-3s): Holds up laptop showing 3 automated terminal scripts running simultaneously with text 'Stop doing these 3 tasks manually in 2026'. BODY (3-26s): Fast 7-second visual demo of each script: (1) Auto-renaming & sorting downloads/screenshots into project folders, (2) Extracting audio & clean markdown notes from YouTube lectures, (3) Bulk resizing & removing backgrounds from UI assets. CTA (26-32s): 'Comment SCRIPT and my fairy bot will DM you all 3 Python files!' WHY IT CONVERTED (+492 Followers / 34.8K Views): Quantified time-saved hook ('5 hours/week') + immediate visual proof + high-value tangible giveaway.

### #2. Automated My Coding Workflow with Local AI Agents in 10 Mins (REEL)
- **Views**: 28,400 | **Followers Gained**: +384 (1.35% conversion)
- **Likes**: 1,840 | **Comments**: 312 | **Saves**: 690 | **Shares**: 415
- **US Viewer Share**: 71% | **Comment-to-DM Trigger**: \`LINK\` (268 DMs sent)
- **Video Summary for Agent**: HOOK (0-3s): Split-screen of chaotic 12-tab browser vs. one clean local AI agent terminal running automatically. BODY (3-31s): Step-by-step walkthrough connecting a local coding agent to Git + VS Code so it writes unit tests, fixes lint errors, and summarizes PRs automatically. CTA (31-38s): 'Follow @techfairyanna for more AI dev setups & comment LINK for the full architecture diagram!' WHY IT CONVERTED (+384 Followers / 28.4K Views): Explicit 'Follow + Comment LINK' combo paired with a relatable developer pain point.

### #3. Stop Writing Boilerplate UI: 3 Open-Source React + Python Templates (REEL)
- **Views**: 21,900 | **Followers Gained**: +318 (1.45% conversion)
- **Likes**: 1,490 | **Comments**: 245 | **Saves**: 580 | **Shares**: 310
- **US Viewer Share**: 76% | **Comment-to-DM Trigger**: \`CODE\` (204 DMs sent)
- **Video Summary for Agent**: HOOK (0-3s): 'Stop building ugly admin dashboards from scratch!' with a dramatic before/after UI transformation. BODY (3-24s): Rapid showcase of 3 full-stack React + FastAPI starter templates with glassmorphic cards, auth, and live charts already wired up. CTA (24-29s): 'Drop CODE in the comments and I'll send you the GitHub repos!' WHY IT CONVERTED (+318 Followers / 21.9K Views): Highest follower conversion rate (1.45%) because US full-stack devs followed to keep up with future repo drops.

## 2. UNITED STATES (US) AUDIENCE ACTIVITY SUMMARY
- **US Share of Total Followers**: 68.4%
- **Peak #1 (US East Evening + West Coast Afternoon)**: 5:30 PM – 8:30 PM EST (94%–98% US active)
- **Peak #2 (US East Lunch + West Coast Standup)**: 12:00 PM – 1:30 PM EST (86% US active)
- **Core Insight**: Global metrics show a false bump at 8:00 AM EST from Europe/India (0.45% conversion). Posting at 12:15 PM EST or 5:30 PM – 8:00 PM EST captures US East + West Coast tech hubs and boosts follower conversion to 1.44% (+3.2x higher new followers per 1,000 views).`;

export const INITIAL_ANALYTICS = {
  source: 'calibrated_preview',
  profile: {
    username: 'techfairyanna',
    name: 'Tech Fairy Anna ✨ AI & Creative Tech',
    account_type: 'CREATOR',
    followers_count: 14820,
    follows_count: 412,
    media_count: 94,
  },
  posts: SAMPLE_POSTS,
  analysis: {
    summary: {
      total_views: 118700,
      total_likes: 8130,
      total_comments: 1220,
      total_saves: 3295,
      total_shares: 1556,
      total_followers_gained: 1476,
      avg_follower_conversion_rate: 1.24,
      avg_engagement_rate: 12.08,
      comment_lift_multiplier: 4.2,
      estimated_dm_conversions: 964,
    },
    top_by_followers: [...SAMPLE_POSTS].sort((a, b) => (b.followers_gained || 0) - (a.followers_gained || 0)),
    top_by_views: [...SAMPLE_POSTS].sort((a, b) => (b.views || 0) - (a.views || 0)),
    us_audience_activity: US_AUDIENCE_ACTIVITY,
    openclaw_brief: OPENCLAW_BRIEF,
    strategies: [
      {
        id: 'strat-1',
        category: 'Comment-to-DM Multiplier',
        impact: 'HIGH (+320% Comments & Reach)',
        title: 'Add Single-Word Keyword Triggers to Every Reel Hook',
        finding:
          'Your posts with a ManyChat keyword CTA average 277.5 comments vs 55 comments on regular posts (4.2x higher comment velocity, pushing Reels into Explore).',
        action_items: [
          "Put the keyword trigger on-screen in the first 3 seconds (e.g., 'Comment CODE and I'll DM you the repo').",
          "Use 1-word uppercase triggers ('LINK', 'CODE', 'AI', 'PROMPT')—single words convert 38% better than phrases.",
          "Enable 'Auto-reply to public comment' in your flow so every trigger doubles your total comment count instantly.",
        ],
        recommended_keyword: 'CODE',
      },
      {
        id: 'strat-2',
        category: 'Content Format Mix',
        impact: 'HIGH (Save-to-View Boost)',
        title: "Pair '3-Tool / 5-Script' Reels with Deep-Dive Carousels",
        finding:
          "Your numbered list Reels ('3 Python scripts', '10-minute AI agent setup') drive the highest reach (28k–34k views), while Educational Carousels drive your highest Save rate (5.2% save-to-view ratio).",
        action_items: [
          'Post 3 Reels per week showing a fast visual demo + result in the first 2.5 seconds.',
          'Post 1 Carousel per week with copy-paste prompts/commands to maximize Saves.',
          "End Carousels on Slide 7 with: 'Comment PROMPT and I'll DM you the Notion template.'",
        ],
        recommended_keyword: 'PROMPT',
      },
      {
        id: 'strat-3',
        category: 'Follow-Gate & Lead Capture',
        impact: 'MEDIUM (+28% Follower Conversion)',
        title: "Use a Two-Step 'Follow Check' DM Before Sending the Resource",
        finding:
          "Over 65% of viewers who comment 'LINK' on viral Reels are non-followers discovering @techfairyanna from Reels/Explore.",
        action_items: [
          'Configure your DM message to remind users to follow @techfairyanna so links land in their primary inbox.',
          'Include a direct link to labfae.com to capture audience traffic directly.',
        ],
        recommended_keyword: 'LINK',
      },
      {
        id: 'strat-4',
        category: 'US Audience Optimal Posting Windows',
        impact: 'HIGH (+3.2x US Follower Conversion)',
        title: 'Best US Windows: Tue/Thu/Sun 5:30 PM – 8:00 PM EST & Wed 12:15 PM EST',
        finding:
          '68.4% of your audience is in the United States (NYC, Bay Area, LA, Austin). Posting at 5:30 PM – 8:00 PM EST hits both East Coast evening and West Coast afternoon simultaneously (98% US active).',
        action_items: [
          'Schedule flagship AI/Coding Reels at 5:30 PM – 7:30 PM EST on Tuesdays and Thursdays for maximum US reach.',
          'Use the 12:15 PM EST lunch slot on Wednesdays for high-save Carousels.',
        ],
        recommended_keyword: 'SCRIPT',
      },
    ],
    content_ideas: [
      {
        title: 'I Built an AI Agent That Answers My Instagram DMs (Python + React)',
        format: 'REEL (45s)',
        hook: 'Stop paying $65/mo for automation tools when you can build your own in Python...',
        cta_keyword: 'AGENT',
        predicted_er: '12.8%',
      },
      {
        title: '5 VS Code / Cursor Shortcuts That Feel Like Illegal Tech Fairy Magic 🧚‍♀️',
        format: 'CAROUSEL (7 Slides)',
        hook: '90% of developers still do these 5 tasks manually...',
        cta_keyword: 'SETUP',
        predicted_er: '14.2%',
      },
      {
        title: 'How to Turn Any GitHub Repo Into an Interactive Diagram in 10 Seconds',
        format: 'REEL (35s)',
        hook: "If you ever get lost reading someone else's codebase, bookmark this tool...",
        cta_keyword: 'TOOL',
        predicted_er: '11.9%',
      },
    ],
  },
};

export function runLocalOpenClawAnalysis(prompt, analyticsData = INITIAL_ANALYTICS) {
  const posts = analyticsData?.posts || SAMPLE_POSTS;
  const byFollowers = [...posts].sort((a, b) => (b.followers_gained || 0) - (a.followers_gained || 0));
  const top1 = byFollowers[0] || SAMPLE_POSTS[0];
  const top2 = byFollowers[1] || SAMPLE_POSTS[1];
  const top3 = byFollowers[2] || SAMPLE_POSTS[2];

  return `### 🦞 OpenClaw Agent Analysis for @${analyticsData?.profile?.username || 'techfairyanna'}
**Agent Prompt**: *${prompt}*

---

#### 1. Top Videos Breakdown (Views & Followers Gained)
- **🥇 #1 Follower Magnet — "${top1.title}"**
  - **Performance**: \`${(top1.views || 0).toLocaleString()} views\` · **\`+${top1.followers_gained} new followers\`** (\`${top1.follower_conversion_rate}%\` conversion) · \`${top1.us_viewer_share_pct}% US viewers\`
  - **Why It Worked (From Text Summary)**: Opened with a quantified time-saved hook (*"5 hours every week"*), showed 3 rapid terminal demos in 23 seconds, and gated all 3 Python files behind the single-word trigger **\`${top1.best_keyword}\`**.
- **🥈 #2 Workflow Transformation — "${top2.title}"**
  - **Performance**: \`${(top2.views || 0).toLocaleString()} views\` · **\`+${top2.followers_gained} new followers\`** (\`${top2.follower_conversion_rate}%\` conversion) · \`${top2.us_viewer_share_pct}% US viewers\`
  - **Why It Worked (From Text Summary)**: Visual contrast hook (12 messy tabs vs. 1 clean local AI terminal) + explicit *"Follow @techfairyanna & comment **\`${top2.best_keyword}\`**"* CTA.
- **🥉 #3 Highest Conversion Rate — "${top3.title}"**
  - **Performance**: \`${(top3.views || 0).toLocaleString()} views\` · **\`+${top3.followers_gained} new followers\`** (\`${top3.follower_conversion_rate}%\` conversion — highest of all posts!)
  - **Why It Worked (From Text Summary)**: US developers followed specifically to get future React + FastAPI template drops via the **\`${top3.best_keyword}\`** keyword.

> **💡 Core Pattern Discovered by OpenClaw**: Reels with a **quantified problem hook + 3-part visual demo + 1-word DM trigger (\`SCRIPT\`, \`LINK\`, \`CODE\`)** generate **5.0× more followers per view** (1.41% vs 0.28%) than passive desk/vibe Reels.

---

#### 2. 🇺🇸 United States Audience Timing Plan (68.4% of Followers)
- **Peak Window #1 (98% US Active)**: **5:30 PM – 8:00 PM EST** (*2:30 PM – 5:00 PM PST*) — simultaneous East Coast evening scroll + West Coast afternoon break.
- **Peak Window #2 (86% US Active)**: **12:00 PM – 1:15 PM EST** (*9:00 AM – 10:15 AM PST*) — East Coast lunch + West Coast morning standup.
- **Avoid**: **6:00 AM – 9:30 AM EST** (West Coast is asleep; follower conversion drops by 68%).

---

#### 3. 🎬 3 Ready-to-Film Reel Scripts Based on Your Best Video Summaries
1. **"3 Local Terminal AI Commands That Feel Illegal"** → Hook: Hold up laptop with 3 split terminals · CTA: *"Follow & comment **\`TERMINAL\`** for my dotfiles"* · Post **Tuesday @ 6:00 PM EST**.
2. **"Watch Me Hook Up an OpenClaw AI Agent to My Instagram in 45s"** → Hook: Before/after of raw IG metrics turning into your pink fairy dashboard · CTA: *"Comment **\`CLAW\`** for the Python + React repo"* · Post **Thursday @ 6:30 PM EST**.
3. **"Stop Writing Messy Prompts: 5 System Prompts for Clean Python"** → Hook: Side-by-side spaghetti code vs. clean modular FastAPI · CTA: *"Comment **\`PROMPT\`** for the Notion sheet"* · Post **Wednesday @ 12:15 PM EST**.`;
}
