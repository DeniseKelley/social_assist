// Hybrid Client-Side Engine for @techfairyanna (Real Instagram Insights & Video Dataset)

export const INITIAL_AUTOMATIONS = [
  {
    id: 'flow-1',
    name: 'Send Linux Command Cheat Sheet on Comment',
    active: true,
    trigger_type: 'comment_keyword',
    keywords: ['LINUX', 'PID', 'INIT', 'ENTER', 'CRY'],
    target_posts: 'all',
    public_comment_reply: 'Just sent the Linux visual & cheat sheet straight to your DMs! Check your message requests ✨🧚‍♀️',
    dm_message: 'Hey there! 👋 Thanks for commenting on my Linux reel! Here is the full interactive visual & command guide:',
    dm_button_text: 'Open TechFairy Linux Lab ✨',
    dm_button_url: 'https://techfairylab.com',
    stats: { triggered: 356, dms_sent: 356, link_clicks: 284 },
  },
  {
    id: 'flow-2',
    name: 'Cybersecurity & OSINT GitHub Repo Auto-DM',
    active: true,
    trigger_type: 'comment_keyword',
    keywords: ['REPO', 'SCRUB', 'CODE', 'GITHUB'],
    target_posts: 'all',
    public_comment_reply: 'Sent you the GitHub links & privacy toolkit in your DMs! 💻✨',
    dm_message: 'Hi! 🧚‍♀️ Here are the exact GitHub repositories and privacy tools from my post:',
    dm_button_text: 'Get the Links & Repos 💻',
    dm_button_url: 'https://github.com/DeniseKelley',
    stats: { triggered: 214, dms_sent: 214, link_clicks: 179 },
  },
  {
    id: 'flow-3',
    name: 'Story Reply Welcome & Freebie',
    active: true,
    trigger_type: 'story_reply',
    keywords: ['🔥', 'WANT', 'SEND', 'YES'],
    target_posts: 'stories',
    public_comment_reply: '',
    dm_message: "Thanks so much for replying to my story! 💜 Here's the exclusive Linux/CS resource I shared today:",
    dm_button_text: 'Claim Free Resource 🎁',
    dm_button_url: 'https://techfairylab.com',
    stats: { triggered: 83, dms_sent: 83, link_clicks: 64 },
  },
  {
    id: 'flow-4',
    name: "Direct DM Keyword ('COLLAB' / 'RATES')",
    active: true,
    trigger_type: 'dm_keyword',
    keywords: ['COLLAB', 'SPONSOR', 'WORK', 'RATES'],
    target_posts: 'dm',
    public_comment_reply: '',
    dm_message: 'Hey! ✨ Thanks for reaching out to @techfairyanna about a collaboration! You can view my official rate card and packages below:',
    dm_button_text: 'View @techfairyanna Rate Card 📊',
    dm_button_url: 'https://techfairylab.com/rate_card.html',
    stats: { triggered: 29, dms_sent: 29, link_clicks: 25 },
  },
];

const REAL_POSTS = [
  {
    id: 'reel-sudo-rm',
    title: 'sudo rm -rf / — What Actually Happens Before rm Destroys Linux',
    type: 'REEL',
    thumbnail_url: './reels/reel_sudo_rm.png',
    published_label: 'Jun 15',
    caption:
      "SO BEFORE RM... What actually happens when you run sudo rm -rf / on Ubuntu Linux? 💻🔥 Watch what /proc and the kernel do before userland disappears! Comment 'LINUX' and I'll DM you my Linux command cheat sheet! #linux #ubuntu #commandline #cybersecurity #techfairyanna",
    timestamp: '2026-06-15T18:00:00Z',
    likes: 3420,
    comments: 418,
    saves: 1290,
    shares: 840,
    views: 46000,
    followers_gained: 642,
    follower_conversion_rate: 1.4,
    retention_pct: 71,
    duration_sec: 35,
    us_viewer_share_pct: 22,
    dm_triggers: 356,
    best_keyword: 'LINUX',
    engagement_rate: 12.97,
    PostingHour: '6:00 PM EST',
    video_summary_text:
      "HOOK (0-3s): Split-screen of Anna in her pink-lit studio with bold caption 'SO BEFORE RM' above an Ubuntu terminal executing 'sudo rm -rf /bin /boot /cdrom /dev...'. " +
      "BODY (3-28s): Live terminal flood of 'rm: cannot remove /proc/3003/task/3036/fdinfo/0: Operation not permitted', explaining why virtual kernel filesystems (/proc, /sys) reject unlink() syscalls while userland binaries get wiped. " +
      "CTA (28-35s): 'Follow @techfairyanna for stress-free Linux internals & comment LINUX for my command cheat sheet!' " +
      "WHY IT GAINED 46,000 VIEWS & +642 FOLLOWERS: #1 top-performing Reel on @techfairyanna—visceral terminal destruction visual in frame 1 + clear explanation of what the kernel protects during rm -rf.",
  },
  {
    id: 'reel-3-commands-cry',
    title: '3 Commands That Will Make You Cry (Comments Edition)',
    type: 'REEL',
    thumbnail_url: './reels/reel_3_commands_cry.png',
    published_label: 'Jun 30',
    caption:
      "3 Commands That Will Make You Cry (Comments Edition) 😭💻 You guys left the most evil terminal commands in my comments so let's test them in a sandbox! Drop 'CRY' for my safe VM lab setup! #linuxcommands #terminal #sysadmin #codinghumor #techfairyanna",
    timestamp: '2026-06-30T17:45:00Z',
    likes: 1680,
    comments: 294,
    saves: 640,
    shares: 410,
    views: 21000,
    followers_gained: 312,
    follower_conversion_rate: 1.49,
    retention_pct: 68,
    duration_sec: 38,
    us_viewer_share_pct: 26,
    dm_triggers: 248,
    best_keyword: 'CRY',
    engagement_rate: 14.39,
    PostingHour: '5:45 PM EST',
    video_summary_text:
      "HOOK (0-3s): Shocked reaction shot with on-screen title '3 Commands That Will Make You Cry (Comments Edition)', replying directly to dangerous/cursed Linux commands submitted by viewers. " +
      "BODY (3-31s): Breaks down 3 infamous terminal commands from the comment section (fork bomb :(){ :|:& };:, dd overwriting block devices, and chmod -R 000 /) and demonstrates what each one does at the OS level. " +
      "CTA (31-38s): 'Drop your most cursed command in the comments for Part 2 & comment CRY for my safe VM lab setup!' " +
      "WHY IT GAINED 21,000 VIEWS & +312 FOLLOWERS: #2 most-viewed Reel (19.8K–21K views)—'Comments Edition' format rewarded audience participation and drove a 1.49% follower conversion rate.",
  },
  {
    id: 'reel-pid-max',
    title: 'Why Your Linux Server Can Only Have 4,194,304 Processes (pid_max & echo $$)',
    type: 'REEL',
    thumbnail_url: './reels/reel_pid_max.png',
    published_label: 'Jun 17',
    caption:
      "Your Linux server can only have 4,194,304 processes. Here's why 🐧🔢 Checking /proc/sys/kernel/pid_max and echo $$ in Ubuntu! Comment 'PID' and I'll send you the interactive visual breakdown! #linuxkernel #processes #devops #computerscience #techfairyanna",
    timestamp: '2026-06-17T12:30:00Z',
    likes: 1190,
    comments: 176,
    saves: 520,
    shares: 235,
    views: 15000,
    followers_gained: 224,
    follower_conversion_rate: 1.49,
    retention_pct: 69,
    duration_sec: 41,
    us_viewer_share_pct: 29,
    dm_triggers: 152,
    best_keyword: 'PID',
    engagement_rate: 14.14,
    PostingHour: '12:30 PM EST',
    video_summary_text:
      "HOOK (0-3.8s): 'Your Linux server can only have 4 million processes. Here's why.' Ubuntu terminal top-half + circular facecam bottom-right. " +
      "BODY (3.8-36s): 'Every process gets a PID — Process ID. Linux uses a 22-bit number for this. That's 4,194,304 (2^22, or 4 × 1024 × 1024), shown via cat /proc/sys/kernel/pid_max and echo $$. Old 32-bit systems capped at 32,768 (2^15). Modern kernels? You'll hit memory limits first.' " +
      "CTA (36-41.3s): 'So unless you're running a data center, you're fine. That's the PID limit. Comment PID for the interactive visual!' " +
      "WHY IT GAINED 15,000 VIEWS & +224 FOLLOWERS: #3 top Reel (14.4K–15K views)—specific number hook ('4 million processes') + live /proc/sys/kernel/pid_max terminal proof.",
  },
  {
    id: 'reel-systemd-pid1',
    title: "PID 1 systemd Explained: What 'ps -p 1' Reveals About Linux Boot",
    type: 'REEL',
    thumbnail_url: './reels/reel_systemd_pid1.png',
    published_label: 'Jun 29',
    caption:
      "What is PID 1 in Linux? Running 'ps -p 1' shows systemd — the first process that starts everything else 🌱🐧 Comment 'INIT' for the full Linux boot & process tree diagram! #systemd #linux #operatingSystems #backend #techfairyanna",
    timestamp: '2026-06-29T18:15:00Z',
    likes: 1040,
    comments: 142,
    saves: 460,
    shares: 190,
    views: 13000,
    followers_gained: 186,
    follower_conversion_rate: 1.43,
    retention_pct: 66,
    duration_sec: 34,
    us_viewer_share_pct: 25,
    dm_triggers: 119,
    best_keyword: 'INIT',
    engagement_rate: 14.09,
    PostingHour: '6:15 PM EST',
    video_summary_text:
      "HOOK (0-3s): Cursor highlights 'systemd' in 'ps -p 1 -> PID 1 TTY ? TIME 00:00:07 CMD systemd' with caption 'you see so...'. " +
      "BODY (3-30s): Explains why PID 1 is the ancestor of every user process on Ubuntu/Linux, how the kernel hands off execution to systemd/init at boot, and why orphan processes get re-parented to PID 1. " +
      "CTA (30-34s): 'Follow @techfairyanna to understand Linux without the stress & comment INIT for the boot diagram!' " +
      "WHY IT GAINED 13,000 VIEWS & +186 FOLLOWERS: #4 top Reel (12.8K–13K views)—strong sequel synergy with the PID Max video.",
  },
  {
    id: 'reel-file-extensions',
    title: '10 Developer File Extensions Ranked (.py, .cpp, .php, .java, .json, .swift, .html, .md)',
    type: 'REEL',
    thumbnail_url: './reels/reel_file_extensions.png',
    published_label: 'Jun 23',
    caption:
      'Ranking 10 file extensions from 1 to 10: .py, .cpp, .php, .java, .json, .swift, .html, .pptx, .docs, .md 💻✨ Where would you rank .py and .cpp?! #python #cpp #programming #webdev #techfairyanna',
    timestamp: '2026-06-23T16:30:00Z',
    likes: 920,
    comments: 215,
    saves: 310,
    shares: 165,
    views: 11500,
    followers_gained: 148,
    follower_conversion_rate: 1.29,
    retention_pct: 63,
    duration_sec: 29,
    us_viewer_share_pct: 24,
    dm_triggers: 84,
    best_keyword: 'RANK',
    engagement_rate: 14.0,
    PostingHour: '4:30 PM EST',
    video_summary_text:
      "HOOK (0-3s): Vertical on-screen ranking list '1. .py, 2. .cpp, 3. .php, 4. .java, 5. .json, 6. .swift, 7. .html, 8. .pptx, 9. .docs, 10. .md' in Anna's pink neon studio. " +
      "BODY (3-25s): Rapid-fire reactions and developer hot takes on each file extension from Python and C++ to Markdown and JSON. " +
      "CTA (25-29s): 'Which file extension belongs at #1? Fight in the comments!' " +
      "WHY IT GAINED 11,500 VIEWS & +148 FOLLOWERS: #5 top Reel in Instagram Insights (11.5K views)—visible 1–10 ranking overlay on frame 1 drives high comment debate.",
  },
  {
    id: 'reel-inside-enter',
    title: 'Inside Enter: 6 Things That Happen in Linux Before Any Output ($PATH, fork, execve)',
    type: 'REEL',
    thumbnail_url: './reels/reel_inside_enter.png',
    published_label: 'Latest',
    caption:
      "You press Enter. Six things happen before any output ⌨️⚡ From $PATH lookup to fork(), execve(), and kernel syscalls in 36 seconds! Comment 'ENTER' and I'll DM you the interactive visual! #linux #shell #bash #cs #techfairyanna",
    timestamp: '2026-11-09T18:00:00Z',
    likes: 980,
    comments: 154,
    saves: 590,
    shares: 210,
    views: 10400,
    followers_gained: 162,
    follower_conversion_rate: 1.56,
    retention_pct: 74,
    duration_sec: 37,
    us_viewer_share_pct: 31,
    dm_triggers: 134,
    best_keyword: 'ENTER',
    engagement_rate: 18.59,
    PostingHour: '6:00 PM EST',
    video_summary_text:
      "HOOK (0-4.2s): 'You press Enter. Six things happen before any output.' " +
      "BODY (4.2-33.6s): '(1) The shell reads your line, splits it into words, and expands the wildcard. (2) It walks $PATH, one folder at a time. First match wins. (3) The shell can't become ls, so it clones itself first (fork). (4) The clone loads the program—same PID, brand new code (execve). (5) A program can't touch hardware, so it asks the kernel with system calls. (6) When the program ends, it returns a number. Zero means success.' " +
      "CTA (33.6-36.8s): 'Now you know what Enter does. Comment ENTER for the interactive slide deck!' " +
      "WHY IT GAINED +162 FOLLOWERS (1.56% CONVERSION): Highest follower conversion rate—tightly paced 36.8s animated systems breakdown.",
  },
  {
    id: 'carousel-sherlock-osint',
    title: 'GitHub Repos That Feel Almost Illegal to Know (Sherlock & OSINT Harvester)',
    type: 'CAROUSEL',
    thumbnail_url: './reels/reel_sherlock_osint.png',
    published_label: 'Aug 3',
    caption:
      "GITHUB REPOS THAT FEEL ALMOST ILLEGAL TO KNOW 🕵️‍♀️💻 How ethical hackers & security researchers use Sherlock and theHarvester for OSINT recon! Save this post 📌 or comment 'REPO' for the GitHub links! #github #cybersecurity #osint #ethicalhacking #techfairyanna",
    timestamp: '2026-08-03T12:30:00Z',
    likes: 860,
    comments: 138,
    saves: 630,
    shares: 175,
    views: 9800,
    followers_gained: 154,
    follower_conversion_rate: 1.57,
    retention_pct: 76,
    duration_sec: 0,
    us_viewer_share_pct: 28,
    dm_triggers: 118,
    best_keyword: 'REPO',
    engagement_rate: 18.4,
    PostingHour: '12:30 PM EST',
    video_summary_text:
      "SLIDE 1 HOOK: 'GITHUB REPOS THAT FEEL ALMOST ILLEGAL TO KNOW' (@techfairyanna high-contrast dark/pink cover). " +
      "SLIDES 2-5: Breakdown of open-source cybersecurity & OSINT recon repositories (Sherlock username hunting across 400+ sites & theHarvester domain recon) and how ethical hackers use them to audit exposure. " +
      "CTA: 'Save this post 📌 & comment REPO for the direct GitHub links in your DMs!' " +
      "WHY IT GAINED +154 FOLLOWERS: Curiosity-gap cover headline + 6.4% Save-to-View ratio.",
  },
  {
    id: 'carousel-scrub-data',
    title: 'Free Tools to Scrub Your Personal Data Off the Internet (JustDelete.me, HIBP, DuckDuckGo)',
    type: 'CAROUSEL',
    thumbnail_url: './reels/reel_scrub_data.png',
    published_label: 'Aug 6',
    caption:
      "FREE TOOLS TO SCRUB YOUR PERSONAL DATA OFF THE INTERNET 🔒🧹 Take back your privacy with JustDelete.me, HaveIBeenPwned, and DuckDuckGo Email Protection! Comment 'SCRUB' and I'll DM you all 3 links! #privacy #cybersecurity #infosec #techfairyanna",
    timestamp: '2026-08-06T17:30:00Z',
    likes: 790,
    comments: 112,
    saves: 540,
    shares: 160,
    views: 8900,
    followers_gained: 131,
    follower_conversion_rate: 1.47,
    retention_pct: 73,
    duration_sec: 0,
    us_viewer_share_pct: 27,
    dm_triggers: 96,
    best_keyword: 'SCRUB',
    engagement_rate: 18.0,
    PostingHour: '5:30 PM EST',
    video_summary_text:
      "SLIDE 1 HOOK: 'FREE TOOLS TO SCRUB YOUR PERSONAL DATA OFF THE INTERNET'. " +
      "SLIDES 2-5: Step-by-step digital cleanup toolkit: (1) JustDelete.me directory of direct account-deletion links, (2) HaveIBeenPwned breach checker, (3) DuckDuckGo Email Protection aliases. " +
      "CTA: 'Comment SCRUB and I will DM you all 3 official links!' " +
      "WHY IT GAINED +131 FOLLOWERS: High-utility privacy checklist with strong shareability.",
  },
];

const US_AUDIENCE_ACTIVITY = {
  us_audience_share_pct: 6.8,
  us_estimated_followers: 1150,
  primary_timezone: 'America/New_York (EST)',
  key_insight:
    "In your Instagram Insights, India is #1 (24.9%, UTC+5:30), United States is #2 (6.8%, ~1,150 followers), Iran is 4.3%, and Germany is 4.0%. Because India & Europe are 6 to 9.5 hours ahead of New York, Instagram's default 'All Followers' chart shows a massive global peak at 8:00 AM – 10:00 AM EST when your US West Coast audience is completely asleep! To grow your United States audience (and maximize US brand/sponsor reach), post in your isolated US peak windows: 12:00 PM – 1:15 PM EST or 5:30 PM – 8:30 PM EST (94%–98% of your US followers active).",
  hourly_est: [
    { hour: '6 AM', us_active: 12, global_active: 74, label: 'India/Europe Evening Peak (US Asleep)' },
    { hour: '8 AM', us_active: 24, global_active: 89, label: '⚠️ False Global Peak (India 5:30 PM IST / US West Asleep)' },
    { hour: '10 AM', us_active: 48, global_active: 84, label: 'India Night / US Morning Ramp' },
    { hour: '12 PM', us_active: 86, global_active: 78, label: '🇺🇸 US Peak #2 (East Lunch + West Standup)' },
    { hour: '2 PM', us_active: 64, global_active: 65, label: 'US Afternoon Coding Block' },
    { hour: '4 PM', us_active: 78, global_active: 62, label: 'US East Coast Wrap-Up' },
    { hour: '6 PM', us_active: 98, global_active: 76, label: '🇺🇸 US Peak #1 (East Evening + West Afternoon)' },
    { hour: '8 PM', us_active: 94, global_active: 71, label: '🇺🇸 US Prime Scroll Window (8 PM EST / 5 PM PST)' },
    { hour: '10 PM', us_active: 72, global_active: 58, label: 'US West Coast Evening' },
    { hour: '12 AM', us_active: 38, global_active: 52, label: 'Late Night West Coast / India Morning' },
  ],
  top_countries: [
    { country: '🇮🇳 India', share_pct: 24.9, tz_note: 'IST (EST + 9.5h)' },
    { country: '🇺🇸 United States', share_pct: 6.8, tz_note: 'EST / PST (~1,150 followers)' },
    { country: '🇮🇷 Iran', share_pct: 4.3, tz_note: 'IRST (EST + 8.5h)' },
    { country: '🇩🇪 Germany', share_pct: 4.0, tz_note: 'CET (EST + 6h)' },
  ],
  age_ranges: [
    { range: '18–24', share_pct: 39.6 },
    { range: '25–34', share_pct: 39.4 },
    { range: '35–44', share_pct: 10.2 },
    { range: '13–17', share_pct: 5.8 },
  ],
  gender_split: { men_pct: 94.9, women_pct: 5.1 },
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
      best_for: 'Flagship Linux/Kernel Reel (sudo rm, PID max)',
    },
    {
      day: 'Thursday',
      window_est: '5:30 PM – 8:00 PM EST',
      us_active_pct: 96,
      best_for: "'Comments Edition' / Terminal Demo Reel",
    },
    {
      day: 'Wednesday',
      window_est: '12:00 PM – 1:15 PM EST',
      us_active_pct: 86,
      best_for: 'Cybersecurity / OSINT Carousel (High US Lunch Saves)',
    },
    {
      day: 'Sunday',
      window_est: '6:00 PM – 8:30 PM EST',
      us_active_pct: 94,
      best_for: "Deep-Dive CS Explainer ('Inside Enter')",
    },
  ],
};

const OPENCLAW_BRIEF = `# OPENCLAW AGENT BRIEF — @techfairyanna INSTAGRAM PERFORMANCE & US AUDIENCE
- **Account**: @techfairyanna (Anna The Tech Fairy) | **Followers**: 16,900 | **Posts**: 158
- **30-Day Account Views**: 469,204 (81.3% Non-Followers, 93.2% Reels) | **Accounts Reached**: 202,193 | **Interactions**: 40,487

## 1. TOP PERFORMING VIDEOS (RANKED BY VIEWS & FOLLOWERS GAINED)

### #1. sudo rm -rf / — What Actually Happens Before rm Destroys Linux (REEL, Jun 15)
- **Views**: 46,000 (45.8K) | **Followers Gained**: +642 (1.40% conversion)
- **Likes**: 3,420 | **Comments**: 418 | **Saves**: 1,290 | **Shares**: 840
- **Video Summary for Agent**: HOOK (0-3s): Split-screen of Anna in her pink-lit studio with bold caption 'SO BEFORE RM' above an Ubuntu terminal executing 'sudo rm -rf /bin /boot /cdrom /dev...'. BODY (3-28s): Live terminal flood of 'rm: cannot remove /proc/3003/task/3036/fdinfo/0: Operation not permitted', explaining why virtual kernel filesystems (/proc, /sys) reject unlink() syscalls while userland binaries get wiped. CTA (28-35s): 'Follow @techfairyanna for stress-free Linux internals & comment LINUX for my command cheat sheet!'

### #2. 3 Commands That Will Make You Cry (Comments Edition) (REEL, Jun 30)
- **Views**: 21,000 (19.8K) | **Followers Gained**: +312 (1.49% conversion)
- **Likes**: 1,680 | **Comments**: 294 | **Saves**: 640 | **Shares**: 410
- **Video Summary for Agent**: HOOK (0-3s): Shocked reaction shot with on-screen title '3 Commands That Will Make You Cry (Comments Edition)', replying directly to dangerous/cursed Linux commands submitted by viewers. BODY (3-31s): Breaks down 3 infamous terminal commands from the comment section (fork bomb :(){ :|:& };:, dd overwriting block devices, and chmod -R 000 /) and demonstrates what each one does at the OS level. CTA (31-38s): 'Drop your most cursed command in the comments for Part 2 & comment CRY for my safe VM lab setup!'

### #3. Why Your Linux Server Can Only Have 4,194,304 Processes (pid_max & echo $$) (REEL, Jun 17)
- **Views**: 15,000 (14.4K) | **Followers Gained**: +224 (1.49% conversion)
- **Likes**: 1,190 | **Comments**: 176 | **Saves**: 520 | **Shares**: 235
- **Video Summary for Agent**: HOOK (0-3.8s): 'Your Linux server can only have 4 million processes. Here's why.' Ubuntu terminal top-half + circular facecam bottom-right. BODY (3.8-36s): 'Every process gets a PID — Process ID. Linux uses a 22-bit number for this. That's 4,194,304 (2^22, or 4 × 1024 × 1024), shown via cat /proc/sys/kernel/pid_max and echo $$. Old 32-bit systems capped at 32,768 (2^15). Modern kernels? You'll hit memory limits first.' CTA (36-41.3s): 'So unless you're running a data center, you're fine. That's the PID limit. Comment PID for the interactive visual!'

### #4. PID 1 systemd Explained: What 'ps -p 1' Reveals About Linux Boot (REEL, Jun 29)
- **Views**: 13,000 (12.8K) | **Followers Gained**: +186 (1.43% conversion)
- **Video Summary for Agent**: HOOK (0-3s): Cursor highlights 'systemd' in 'ps -p 1 -> PID 1 TTY ? TIME 00:00:07 CMD systemd' with caption 'you see so...'. BODY (3-30s): Explains why PID 1 is the ancestor of every user process on Ubuntu/Linux and how the kernel hands off execution to systemd/init at boot.

### #5. 10 Developer File Extensions Ranked (.py, .cpp, .php, .java, .json, .swift, .html, .md) (REEL, Jun 23)
- **Views**: 11,500 | **Followers Gained**: +148 (1.29% conversion)
- **Video Summary for Agent**: HOOK (0-3s): Vertical on-screen ranking list '1. .py, 2. .cpp, 3. .php, 4. .java, 5. .json, 6. .swift, 7. .html, 8. .pptx, 9. .docs, 10. .md' in Anna's pink neon studio.

### #6. Inside Enter: 6 Things That Happen in Linux Before Any Output (REEL)
- **Views**: 10,400 | **Followers Gained**: +162 (1.56% conversion)
- **Video Summary for Agent**: HOOK: 'You press Enter. Six things happen before any output.' BODY: (1) Shell splits words & expands wildcards, (2) Walks $PATH, (3) Clones itself via fork(), (4) Loads program via execve()—same PID, brand new code, (5) Kernel syscalls, (6) Exit code 0.

## 2. AUDIENCE DEMOGRAPHICS & UNITED STATES (US) ACTIVITY ISOLATION
- **Top Countries**: India (24.9%), United States (#2 at 6.8% / ~1,150 followers), Iran (4.3%), Germany (4.0%)
- **Top Age Ranges**: 18–24 (39.6%), 25–34 (39.4%), 35–44 (10.2%), 13–17 (5.8%) | **Gender**: Men 94.9%, Women 5.1%
- **Isolated US Peak #1**: 5:30 PM – 8:30 PM EST (94%–98% US active)
- **Isolated US Peak #2**: 12:00 PM – 1:15 PM EST (86% US active)`;

export const INITIAL_ANALYTICS = {
  source: 'instagram_insights_synced',
  profile: {
    username: 'techfairyanna',
    name: 'Anna The Tech Fairy',
    account_type: 'CREATOR',
    biography:
      "Hi everyone! I'm Anna🧚‍♀️ I explain tech without the stress. Find me on YouTube and TikTok @ techfairyanna | Linux • Cybersecurity • Systems | techfairylab.com",
    followers_count: 16900,
    follows_count: 67,
    media_count: 158,
    profile_picture_url: './reels/anna_profile.png',
    account_views_30d: 469204,
    accounts_reached_30d: 202193,
    interactions_30d: 40487,
    accounts_engaged_30d: 19401,
    non_follower_views_pct: 81.3,
    reels_views_share_pct: 93.2,
    profile_activity_30d: 5135,
    profile_visits_30d: 4999,
    external_link_taps_30d: 136,
  },
  posts: REAL_POSTS,
  analysis: {
    summary: {
      total_views: 135600,
      account_views_30d: 469204,
      accounts_reached_30d: 202193,
      interactions_30d: 40487,
      accounts_engaged_30d: 19401,
      non_follower_views_pct: 81.3,
      reels_views_share_pct: 93.2,
      profile_activity_30d: 5135,
      profile_visits_30d: 4999,
      external_link_taps_30d: 136,
      total_likes: 10880,
      total_comments: 1649,
      total_saves: 4980,
      total_shares: 2385,
      total_followers_gained: 1959,
      avg_follower_conversion_rate: 1.44,
      avg_engagement_rate: 15.57,
      comment_lift_multiplier: 4.2,
      estimated_dm_conversions: 1307,
    },
    top_by_followers: [...REAL_POSTS].sort((a, b) => (b.followers_gained || 0) - (a.followers_gained || 0)),
    top_by_views: [...REAL_POSTS].sort((a, b) => (b.views || 0) - (a.views || 0)),
    us_audience_activity: US_AUDIENCE_ACTIVITY,
    openclaw_brief: OPENCLAW_BRIEF,
    strategies: [
      {
        id: 'strat-1',
        category: 'Terminal Destruction & Kernel Hooks',
        impact: 'HIGH (46K Views on #1 Reel)',
        title: "Lead With Live Ubuntu Terminal Output ('sudo rm -rf /', 'pid_max') in Frame 1",
        finding:
          "Your top 4 Reels ('sudo rm -rf /' 46K, '3 Commands That Will Make You Cry' 21K, 'pid_max 4,194,304' 15K, and 'PID 1 systemd' 13K) all show real Ubuntu terminal commands or cursed command reactions in the first 1.5 seconds.",
        action_items: [
          'Use split-screen (pink studio camera top + high-contrast Ubuntu terminal bottom) so viewers immediately see real command output.',
          "Pair every terminal explainer with a 1-word ManyChat trigger ('LINUX', 'PID', 'ENTER') to convert the 81.3% non-follower viewers into followers.",
        ],
        recommended_keyword: 'LINUX',
      },
      {
        id: 'strat-2',
        category: 'Audience-Driven Sequels',
        impact: 'HIGH (21K Views + 1.49% Conversion)',
        title: "Turn Top Comment Debates Into '(Comments Edition)' Sequel Reels",
        finding:
          "'3 Commands That Will Make You Cry (Comments Edition)' hit 21,000 views and +312 followers because viewers saw you testing commands from the comment section.",
        action_items: [
          'Pin a comment on every Reel asking: "Drop the most cursed command you know—I will test the top 3 in a VM next week!"',
          "Auto-DM everyone who comments 'CRY' or 'VM' with your disposable Linux VM setup guide.",
        ],
        recommended_keyword: 'CRY',
      },
      {
        id: 'strat-3',
        category: 'US Audience Growth Window',
        impact: 'HIGH (Isolating US 6.8% from India 24.9%)',
        title: 'Post at 12:15 PM EST or 5:30 PM – 8:00 PM EST to Grow Your US Follower Share',
        finding:
          'Because India (24.9% of followers) is 9.5 hours ahead of EST, posting in the early morning EST only reaches India/Europe. Posting at 5:30 PM – 8:00 PM EST hits 98% of your US East & West Coast audience while awake.',
        action_items: [
          'Publish flagship Linux & CS Reels at 6:00 PM EST (3:00 PM PST) on Tuesdays, Thursdays, and Sundays.',
          'Publish OSINT / Cybersecurity Carousels at 12:15 PM EST on Wednesdays for US lunch saves.',
        ],
        recommended_keyword: 'ENTER',
      },
      {
        id: 'strat-4',
        category: 'Cybersecurity & Privacy Carousels',
        impact: 'HIGH (6.4% Save-to-View Ratio)',
        title: "Pair 'Almost Illegal GitHub Repos' & 'Data Scrub' Carousels with DM Links",
        finding:
          'Your Sherlock OSINT and JustDelete.me/HIBP carousels drive high bookmark rates because viewers save tool lists for later.',
        action_items: [
          "End slide 5 of every tool carousel with: 'Comment REPO or SCRUB and my bot will DM you all direct links!'",
        ],
        recommended_keyword: 'REPO',
      },
    ],
    content_ideas: [
      {
        title: 'What Happens If You kill -9 1 in Linux? (PID 1 systemd vs Kernel Panic)',
        format: 'REEL (36s)',
        hook: 'You saw what sudo rm -rf / does... now watch what happens when you try to kill PID 1.',
        cta_keyword: 'KERNEL',
        predicted_er: '15.4%',
      },
      {
        title: '3 More Cursed Commands From My Comments Tested in a VM (Part 2)',
        format: 'REEL (38s)',
        hook: 'You guys left even worse Linux commands in my comments—let us run them live...',
        cta_keyword: 'CRY',
        predicted_er: '14.8%',
      },
      {
        title: 'Inside Ctrl+C: What Actually Happens in the Kernel When You Stop a Program',
        format: 'REEL (35s)',
        hook: 'You press Ctrl+C. It does not actually kill your program—it sends a polite signal...',
        cta_keyword: 'SIGNAL',
        predicted_er: '15.9%',
      },
    ],
  },
};

export function runLocalOpenClawAnalysis(prompt, analyticsData = INITIAL_ANALYTICS) {
  const posts = analyticsData?.posts || REAL_POSTS;
  const byViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0));
  const top1 = byViews[0] || REAL_POSTS[0];
  const top2 = byViews[1] || REAL_POSTS[1];
  const top3 = byViews[2] || REAL_POSTS[2];

  return `### 🦞 OpenClaw Agent Analysis for @${analyticsData?.profile?.username || 'techfairyanna'} (469,204 Account Views · 16.9K Followers)
**Agent Prompt**: *${prompt}*

---

#### 1. Your Real Top-Performing Videos (Views & Followers Gained)
- **🥇 #1 Top Reel — "${top1.title}"** (*${top1.published_label || 'Jun 15'}*)
  - **Performance**: **\`${(top1.views || 0).toLocaleString()} views\`** · **\`+${top1.followers_gained} new followers\`** (\`${top1.follower_conversion_rate}%\` conversion) · \`${(top1.saves || 0).toLocaleString()} saves\`
  - **Why It Worked (From Text Summary)**: Split-screen hook (*"SO BEFORE RM"*) executing \`sudo rm -rf /\` live on Ubuntu while explaining why \`/proc\` throws \`Operation not permitted\`.
- **🥈 #2 Community Hit — "${top2.title}"** (*${top2.published_label || 'Jun 30'}*)
  - **Performance**: **\`${(top2.views || 0).toLocaleString()} views\`** · **\`+${top2.followers_gained} new followers\`** (\`${top2.follower_conversion_rate}%\` conversion) · \`${(top2.comments || 0).toLocaleString()} comments\`
  - **Why It Worked (From Text Summary)**: Replying to viewer-submitted cursed commands (*"Comments Edition"*) turned the comment section into a game for Part 2.
- **🥉 #3 Kernel Deep-Dive — "${top3.title}"** (*${top3.published_label || 'Jun 17'}*)
  - **Performance**: **\`${(top3.views || 0).toLocaleString()} views\`** · **\`+${top3.followers_gained} new followers\`** (\`${top3.follower_conversion_rate}%\` conversion)
  - **Why It Worked (From Text Summary)**: Concrete number hook (*"Your Linux server can only have 4 million processes"*) + live \`cat /proc/sys/kernel/pid_max\` (\`4,194,304 = 2^22\`) and \`echo $$\` terminal proof, followed by your \`ps -p 1 systemd\` sequel (**13,000 views**).

> **💡 Core Pattern Discovered by OpenClaw**: **93.2% of your 469,204 views come from Reels** and **81.3% are Non-Followers**. Videos showing live Ubuntu terminal execution or system-call breakdowns (\`sudo rm -rf /\`, \`pid_max\`, \`ps -p 1\`, \`Inside Enter\`) convert viewers into followers at **1.40%–1.56%**.

---

#### 2. 🇺🇸 United States Audience Timing Plan (Isolating US 6.8% from India 24.9%)
- **Your Real Country Split**: **🇮🇳 India (24.9%)**, **🇺🇸 United States (#2 at 6.8% / ~1,150 followers)**, **🇮🇷 Iran (4.3%)**, **🇩🇪 Germany (4.0%)**.
- **Why Global Active Times Are Misleading**: India (\`UTC+5:30\`) is 9.5 hours ahead of EST, causing your overall active chart to spike at **8:00 AM EST** when the US West Coast is asleep.
- **🇺🇸 Isolated US Peak #1 (98% US Active)**: **5:30 PM – 8:30 PM EST** (*2:30 PM – 5:30 PM PST*) — reaches both NYC/East Coast evening and SF/LA/Seattle afternoon simultaneously.
- **🇺🇸 Isolated US Peak #2 (86% US Active)**: **12:00 PM – 1:15 PM EST** (*9:00 AM – 10:15 AM PST*).

---

#### 3. 🎬 3 Ready-to-Film Reel Scripts Based on Your Top Video Summaries
1. **"What Happens If You \`kill -9 1\` in Linux? (PID 1 vs Kernel Panic)"** → Direct sequel to *\`sudo rm -rf /\`* (46K) and *\`PID 1 systemd\`* (13K) · CTA: *"Comment **\`KERNEL\`** for my process signals sheet"* · Post **Tuesday @ 6:00 PM EST**.
2. **"3 More Commands From My Comments That Will Make You Cry (Part 2)"** → Sequel to your 21K *Comments Edition* Reel · CTA: *"Comment **\`CRY\`** for my disposable VM setup"* · Post **Thursday @ 6:30 PM EST**.
3. **"Inside \`Ctrl+C\`: 5 Things That Happen When You Stop a Running Program"** → Direct follow-up to *\`Inside Enter\`* (\`SIGINT\` vs \`SIGKILL\`) · CTA: *"Comment **\`SIGNAL\`** for the interactive slide deck"* · Post **Wednesday @ 12:15 PM EST**.`;
}
