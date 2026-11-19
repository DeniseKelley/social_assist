import React, { useMemo } from 'react';
import {
  Sparkles,
  ExternalLink,
  Calendar,
  TrendingUp,
  UserPlus,
  Check,
  Plus,
  Film,
  Layers,
} from 'lucide-react';
import { PLATFORMS, PLATFORM_BY_ID, PlatformIcon } from './platforms';

const METRIC_OPTIONS = [
  {
    id: 'views',
    label: 'Views ↓',
    shortLabel: 'Views',
    activeBg: 'bg-[#C8F904] text-[#19154E]',
    getValue: (p) => Number(p.views || 0),
    formatValue: (v) => v.toLocaleString(),
    formatBadge: (v) => `${v.toLocaleString()} views`,
  },
  {
    id: 'followers',
    label: '+Followers ↓',
    shortLabel: '+Followers',
    activeBg: 'bg-[#7CC4FA] text-[#19154E]',
    getValue: (p) => Number(p.followers_gained || 0),
    formatValue: (v) => `+${v.toLocaleString()}`,
    formatBadge: (v) => `+${v.toLocaleString()} followers`,
  },
  {
    id: 'likes',
    label: 'Likes ↓',
    shortLabel: 'Likes',
    activeBg: 'bg-[#FF7EB6] text-[#19154E]',
    getValue: (p) => Number(p.likes || 0),
    formatValue: (v) => v.toLocaleString(),
    formatBadge: (v) => `${v.toLocaleString()} likes`,
  },
  {
    id: 'engagement',
    label: 'Engagement % ↓',
    shortLabel: 'Engagement %',
    activeBg: 'bg-[#B799E8] text-[#19154E]',
    getValue: (p) => Number(p.engagement_rate || 0),
    formatValue: (v) => `${v.toFixed(2)}%`,
    formatBadge: (v) => `${v.toFixed(2)}% ER`,
  },
];

function buildWinnerExplanation(post, rank, allPosts, activePlatformsList) {
  if (!post) return null;

  const count = Math.max(allPosts.length, 1);
  const avgViews = allPosts.reduce((s, p) => s + (p.views || 0), 0) / count;
  const avgLikes = allPosts.reduce((s, p) => s + (p.likes || 0), 0) / count;
  const avgComments = allPosts.reduce((s, p) => s + (p.comments || 0), 0) / count;
  const avgEr = allPosts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / count;
  const avgFollowers = allPosts.reduce((s, p) => s + (p.followers_gained || 0), 0) / count;

  const viewsMult = avgViews > 0 ? post.views / avgViews : 1;
  const followersMult = avgFollowers > 0 ? (post.followers_gained || 0) / avgFollowers : 1;
  const erDelta = Number(((post.engagement_rate || 0) - avgEr).toFixed(2));
  const followersPer1k =
    post.views > 0 ? Number((((post.followers_gained || 0) / post.views) * 1000).toFixed(1)) : 0;
  const avgFollowersPer1k =
    avgViews > 0 ? Number(((avgFollowers / avgViews) * 1000).toFixed(1)) : 0;

  const rawCaption = (post.caption || post.title || '').trim();
  const firstLine = (rawCaption.split('\n').find(Boolean) || post.title || '').trim();
  const wordCount = rawCaption ? rawCaption.split(/\s+/).filter(Boolean).length : 0;
  const hasQuestion = /\?/.test(firstLine);
  const hasNumber = /\b\d+\b/.test(firstLine);
  const hashtags = rawCaption.match(/#[A-Za-z0-9_]+/g) || [];

  // 1. Follower Conversion Explanation
  const followerInsight =
    (post.followers_gained || 0) > 0
      ? `Drove +${(post.followers_gained || 0).toLocaleString()} ${
          post.followers_source === 'api' ? 'verified API' : 'attributed'
        } followers (${followersPer1k} new followers per 1,000 views vs. your ${avgFollowersPer1k}/1K baseline — ${followersMult.toFixed(
          1
        )}× your average post).`
      : `Tracked baseline reach on ${post.platformName}; add a clear "Follow for Part 2" end-card CTA to lift profile-to-follow conversion.`;

  // 2. Hook & Topic Signal
  const hookTraits = [];
  if (hasNumber) hookTraits.push('specific number/listicle framing');
  if (hasQuestion) hookTraits.push('curiosity question hook');
  if (firstLine.length > 0 && firstLine.length <= 65) hookTraits.push('punchy <65-char opening line');
  if (wordCount >= 35) hookTraits.push(`educational ${wordCount}-word caption depth`);
  else if (wordCount > 0) hookTraits.push(`concise ${wordCount}-word caption`);
  if (hashtags.length > 0) hookTraits.push(`${hashtags.length} targeted topic tags (${hashtags.slice(0, 3).join(' ')})`);

  const hookInsight =
    hookTraits.length > 0
      ? `Opening line "${firstLine.slice(0, 78)}${firstLine.length > 78 ? '…' : ''}" uses ${hookTraits.join(
          ', '
        )}, helping viewers immediately grasp the payoff.`
      : `Clear direct title "${(post.title || '').slice(0, 72)}" — pairing this topic with a 3-word on-screen hook in the first 1.5s can push retention even higher.`;

  // 3. Reach & Engagement Velocity
  const reachInsight =
    viewsMult >= 1.25
      ? `Outperformed your selected channels' view average by ${Math.round(
          (viewsMult - 1) * 100
        )}% (${(post.views || 0).toLocaleString()} vs. ${Math.round(
          avgViews
        ).toLocaleString()} avg) with ${post.engagement_rate}% engagement (${
          erDelta >= 0 ? `+${erDelta}%` : `${erDelta}%`
        } vs. ${avgEr.toFixed(2)}% avg).`
      : erDelta > 0.3
      ? `High-intent sleeper hit: ${post.engagement_rate}% engagement (${
          erDelta >= 0 ? `+${erDelta}%` : `${erDelta}%`
        } above your ${avgEr.toFixed(
          2
        )}% average) with ${(post.likes || 0).toLocaleString()} likes and ${(
          post.comments || 0
        ).toLocaleString()} comments — prime candidate to re-hook for broader reach.`
      : `Recorded ${(post.views || 0).toLocaleString()} views, ${(
          post.likes || 0
        ).toLocaleString()} likes, and ${(post.comments || 0).toLocaleString()} comments (${
          post.engagement_rate
        }% ER vs. ${avgLikes.toFixed(0)} avg likes & ${avgComments.toFixed(0)} avg comments).`;

  // 4. Cross-Platform Next Move
  const otherPlatforms = activePlatformsList
    .filter((pid) => pid !== post.platform)
    .map((pid) => PLATFORM_BY_ID[pid]?.name || pid);
  const actionInsight =
    otherPlatforms.length > 0
      ? `Repurpose this exact "${firstLine.slice(0, 42) || post.title.slice(0, 42)}…" angle onto ${otherPlatforms.join(
          ' & '
        )}${post.PostingHour ? ` around ${post.PostingHour}` : ' at 6:00 PM EST'} with a 1-word comment keyword CTA.`
      : `Turn this #${rank} ${post.platformName} winner into a Part 2 follow-up Reel and cross-post it to your other connected channels in Planner.`;

  return {
    viewsMult,
    followersMult,
    erDelta,
    followersPer1k,
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgEr: Number(avgEr.toFixed(2)),
    avgFollowers: Math.round(avgFollowers),
    followerInsight,
    hookInsight,
    reachInsight,
    actionInsight,
  };
}

export default function OverviewWinnersStudio({
  posts,
  connectedPlatformIds,
  connectionsMap,
  activeComboIds,
  onToggleComboPlatform,
  onSelectAllCombo,
  onSelectSinglePlatform,
  onConnectPlatform,
  videoSortBy,
  onChangeSortBy,
  reelsOnly,
  onToggleReelsOnly,
  selectedWinnerKey,
  onSelectWinnerKey,
  onAnalyzePost,
  onOpenPlanner,
}) {
  const activeMetric =
    METRIC_OPTIONS.find((m) => m.id === videoSortBy) || METRIC_OPTIONS[0];

  const filteredRankedPosts = useMemo(() => {
    const base = reelsOnly
      ? posts.filter((p) => {
          const t = String(p.type || '').toUpperCase();
          return (
            t.includes('REEL') ||
            t.includes('VIDEO') ||
            t.includes('SHORT') ||
            t.includes('TIKTOK') ||
            p.platform === 'tiktok' ||
            p.platform === 'youtube'
          );
        })
      : posts;

    return [...base].sort((a, b) => activeMetric.getValue(b) - activeMetric.getValue(a));
  }, [posts, reelsOnly, activeMetric]);

  const chartWinners = filteredRankedPosts.slice(0, 12);
  const maxMetricVal = Math.max(
    1,
    ...chartWinners.map((p) => activeMetric.getValue(p))
  );
  const avgMetricVal =
    filteredRankedPosts.length > 0
      ? filteredRankedPosts.reduce((s, p) => s + activeMetric.getValue(p), 0) /
        filteredRankedPosts.length
      : 0;

  const selectedIndex = useMemo(() => {
    if (!filteredRankedPosts.length) return -1;
    if (selectedWinnerKey) {
      const idx = filteredRankedPosts.findIndex(
        (p) => `${p.platform}-${p.id}` === selectedWinnerKey
      );
      if (idx !== -1) return idx;
    }
    return 0;
  }, [filteredRankedPosts, selectedWinnerKey]);

  const selectedPost = selectedIndex >= 0 ? filteredRankedPosts[selectedIndex] : null;
  const selectedRank = selectedIndex >= 0 ? selectedIndex + 1 : 1;

  const explanation = useMemo(
    () =>
      buildWinnerExplanation(
        selectedPost,
        selectedRank,
        filteredRankedPosts,
        connectedPlatformIds
      ),
    [selectedPost, selectedRank, filteredRankedPosts, connectedPlatformIds]
  );

  // Per-platform share of active metric when 2+ platforms are combined
  const platformShareRows = useMemo(() => {
    if (activeComboIds.length <= 1 || filteredRankedPosts.length === 0) return [];
    const totalsByPlat = {};
    let grandTotal = 0;
    for (const pid of activeComboIds) totalsByPlat[pid] = 0;
    for (const p of filteredRankedPosts) {
      const v = activeMetric.getValue(p);
      totalsByPlat[p.platform] = (totalsByPlat[p.platform] || 0) + v;
      grandTotal += v;
    }
    if (grandTotal <= 0) return [];
    return activeComboIds
      .map((pid) => {
        const val = totalsByPlat[pid] || 0;
        const pct = Number(((val / grandTotal) * 100).toFixed(1));
        return {
          platform: pid,
          meta: PLATFORM_BY_ID[pid] || PLATFORM_BY_ID.instagram,
          val,
          pct,
        };
      })
      .sort((a, b) => b.val - a.val);
  }, [activeComboIds, filteredRankedPosts, activeMetric]);

  return (
    <div className="space-y-5">
      {/* ============================================================
          CUSTOM MULTI-PLATFORM COMBINER BAR (Pick Any Mix: IG+TT, IG+FB, etc.)
      ============================================================ */}
      {connectedPlatformIds.length > 0 && (
        <div className="editorial-card-sm p-4 bg-white space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold uppercase text-[#19154E] flex items-center gap-1.5">
                <Layers className="size-3.5 text-[#6D28D9]" />
                <span>Combine Platforms in Overview</span>
              </div>
              <p className="text-[11px] font-medium text-neutral-600 text-pretty mt-0.5">
                Toggle any mix of channels (e.g. Instagram + Facebook, or Instagram + TikTok + Threads) to combine their followers, views, likes, and top Reels.
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSelectAllCombo}
                className={`px-2.5 py-1 rounded-lg border-2 border-[#19154E] text-[11px] font-bold transition-colors duration-150 ${
                  activeComboIds.length === connectedPlatformIds.length &&
                  connectedPlatformIds.length > 1
                    ? 'bg-[#19154E] text-[#FFF8FC]'
                    : 'bg-[#FFF8FC] text-[#19154E] hover:bg-[#EDE9FE]'
                }`}
              >
                All Connected ({connectedPlatformIds.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PLATFORMS.map((p) => {
              const conn = connectionsMap?.[p.id];
              const isConnected = Boolean(conn?.handle);
              const isChecked = activeComboIds.includes(p.id);

              if (!isConnected) {
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onConnectPlatform(p.id)}
                    className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#19154E]/40 bg-neutral-50 text-neutral-500 hover:text-[#19154E] hover:bg-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors duration-150"
                    title={`Connect ${p.name} to include in combined stats`}
                  >
                    <PlatformIcon platform={p.id} className="size-3.5" />
                    <span>{p.name}</span>
                    <Plus className="size-3 text-[#6D28D9]" />
                  </button>
                );
              }

              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={isChecked}
                  onClick={() => onToggleComboPlatform(p.id)}
                  onDoubleClick={() => onSelectSinglePlatform(p.id)}
                  className={`px-3 py-1.5 rounded-xl border-2 border-[#19154E] text-xs font-bold inline-flex items-center gap-2 transition-colors duration-150 ${
                    isChecked
                      ? 'bg-[#FFFDF9] text-[#19154E] shadow-[2px_2px_0px_#19154E]'
                      : 'bg-neutral-100/80 text-neutral-500 hover:bg-white hover:text-[#19154E]'
                  }`}
                  title="Click to toggle in combined stats (double-click to solo)"
                >
                  <span
                    className="size-5 rounded-md border border-[#19154E] inline-flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: isChecked ? p.badgeBg : '#FFFFFF',
                      color: isChecked ? p.badgeText : '#19154E',
                    }}
                  >
                    {isChecked ? (
                      <Check className="size-3 stroke-[3]" />
                    ) : (
                      <PlatformIcon platform={p.id} className="size-3" />
                    )}
                  </span>
                  <PlatformIcon platform={p.id} className="size-3.5" />
                  <span>{p.name}</span>
                  <span className="text-[10px] font-mono-code text-neutral-500 hidden sm:inline">
                    @{conn.handle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          INTERACTIVE WINNERS CHART (LEFT) + EXPLANATION INSPECTOR (RIGHT)
      ============================================================ */}
      <div className="editorial-card bg-white overflow-hidden">
        <div className="p-4 sm:p-5 border-b-2 border-[#19154E] bg-[#F5EEFF] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-[#19154E] text-balance">
              Winning Reels &amp; Posts Visualizer
            </h3>
            <p className="text-xs font-medium text-neutral-600 text-pretty">
              Click any bar on the left chart to inspect why it won and how many followers, views, and engagements it drove.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Reels Only Filter */}
            <div className="inline-flex items-center bg-white p-0.5 rounded-xl border-2 border-[#19154E]">
              <button
                type="button"
                onClick={() => onToggleReelsOnly(false)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors duration-150 ${
                  !reelsOnly ? 'bg-[#19154E] text-[#FFF8FC]' : 'text-[#19154E] hover:bg-[#F5EEFF]'
                }`}
              >
                All Posts
              </button>
              <button
                type="button"
                onClick={() => onToggleReelsOnly(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors duration-150 ${
                  reelsOnly ? 'bg-[#19154E] text-[#FFF8FC]' : 'text-[#19154E] hover:bg-[#F5EEFF]'
                }`}
              >
                <Film className="size-3" />
                <span>Reels / Videos</span>
              </button>
            </div>

            {/* Decreasing Metric Selector */}
            <div className="inline-flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#19154E]">
              {METRIC_OPTIONS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChangeSortBy(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors duration-150 ${
                    activeMetric.id === m.id
                      ? m.activeBg
                      : 'text-[#19154E] hover:bg-[#F5EEFF]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartWinners.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <p className="font-display font-bold text-base text-[#19154E]">
              No synced Reels or posts match this filter yet.
            </p>
            {reelsOnly && (
              <button
                type="button"
                onClick={() => onToggleReelsOnly(false)}
                className="editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold"
              >
                Show All Post Formats
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT 7 COLS: INTERACTIVE RANKED BAR CHART */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Stacked Platform Share Strip (When 2+ Platforms Combined) */}
              {platformShareRows.length > 1 && (
                <div className="p-3 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#19154E]">
                    <span>Combined {activeMetric.shortLabel} Share by Platform</span>
                    <span className="tabular-nums text-neutral-600">
                      {activeComboIds.length} channels combined
                    </span>
                  </div>
                  <div className="w-full h-3.5 rounded-full border border-[#19154E] overflow-hidden flex bg-white">
                    {platformShareRows.map((row) => (
                      <div
                        key={row.platform}
                        style={{
                          width: `${Math.max(row.pct, 3)}%`,
                          backgroundColor: row.meta.badgeBg,
                        }}
                        title={`${row.meta.name}: ${row.pct}%`}
                        className="h-full border-r border-[#19154E]/30 last:border-r-0"
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold tabular-nums">
                    {platformShareRows.map((row) => (
                      <span key={row.platform} className="inline-flex items-center gap-1.5 text-[#19154E]">
                        <span
                          className="size-2.5 rounded-sm border border-[#19154E]"
                          style={{ backgroundColor: row.meta.badgeBg }}
                        />
                        <span>{row.meta.name}:</span>
                        <span>{row.pct}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-bold text-neutral-600 px-1">
                <span>
                  Top {chartWinners.length} of {filteredRankedPosts.length} Ranked by{' '}
                  <strong className="text-[#19154E]">{activeMetric.shortLabel}</strong> (Decreasing)
                </span>
                <span className="tabular-nums">
                  Avg: {activeMetric.formatValue(Math.round(avgMetricVal * 100) / 100)}
                </span>
              </div>

              <div className="space-y-2">
                {chartWinners.map((post, idx) => {
                  const itemKey = `${post.platform}-${post.id}`;
                  const isSelected =
                    selectedPost && `${selectedPost.platform}-${selectedPost.id}` === itemKey;
                  const pMeta = PLATFORM_BY_ID[post.platform] || PLATFORM_BY_ID.instagram;
                  const val = activeMetric.getValue(post);
                  const widthPct = Math.max(6, Math.round((val / maxMetricVal) * 100));
                  const mult = avgMetricVal > 0 ? val / avgMetricVal : 1;

                  return (
                    <button
                      key={itemKey}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelectWinnerKey(itemKey)}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border-2 transition-colors duration-150 ${
                        isSelected
                          ? 'bg-[#FFFDF9] border-[#19154E] shadow-[3px_3px_0px_#19154E]'
                          : 'bg-white border-[#19154E]/30 hover:border-[#19154E] hover:bg-[#FFF8FC]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-[#19154E] tabular-nums shrink-0 ${
                              idx === 0
                                ? 'bg-[#C8F904] text-[#19154E]'
                                : idx === 1
                                ? 'bg-[#FF7EB6] text-[#19154E]'
                                : idx === 2
                                ? 'bg-[#B799E8] text-[#19154E]'
                                : 'bg-neutral-100 text-[#19154E]'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <span
                            className="size-5 rounded-md border border-[#19154E] inline-flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: pMeta.badgeBg,
                              color: pMeta.badgeText,
                            }}
                            title={pMeta.name}
                          >
                            <PlatformIcon platform={pMeta.id} className="size-3" />
                          </span>
                          <span className="text-xs font-bold text-[#19154E] truncate">
                            {post.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                          {mult >= 1.2 && (
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-[#C8F904]/60 border border-[#19154E]/40 text-[#19154E] hidden sm:inline">
                              {mult.toFixed(1)}× avg
                            </span>
                          )}
                          <span className="font-display font-bold text-xs sm:text-sm text-[#19154E]">
                            {activeMetric.formatValue(val)}
                          </span>
                        </div>
                      </div>

                      {/* Proportional Visual Winner Bar */}
                      <div className="w-full h-3 rounded-full bg-neutral-100 border border-[#19154E]/60 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor:
                              pMeta.id === 'x' ? '#6D28D9' : pMeta.badgeBg,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT 5 COLS: SELECTED WINNER EXPLANATION INSPECTOR */}
            {selectedPost && explanation && (
              <div className="lg:col-span-5 lg:sticky lg:top-16 rounded-2xl border-2 border-[#19154E] bg-[#FFF8FC] p-4 sm:p-5 shadow-[4px_4px_0px_#19154E] space-y-4">
                {(() => {
                  const pMeta =
                    PLATFORM_BY_ID[selectedPost.platform] || PLATFORM_BY_ID.instagram;
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#C8F904] border border-[#19154E] text-[11px] font-extrabold text-[#19154E] tabular-nums">
                              Winner #{selectedRank}
                            </span>
                            <span
                              className="px-2 py-0.5 rounded-md border border-[#19154E] text-[11px] font-extrabold inline-flex items-center gap-1"
                              style={{
                                backgroundColor: pMeta.badgeBg,
                                color: pMeta.badgeText,
                              }}
                            >
                              <PlatformIcon platform={pMeta.id} className="size-3" />
                              <span>{pMeta.name}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-neutral-600">
                              {selectedPost.type || 'REEL'}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-base text-[#19154E] text-balance">
                            {selectedPost.title}
                          </h4>
                          <div className="text-[11px] font-medium text-neutral-600">
                            {selectedPost.published_label}
                            {selectedPost.PostingHour ? ` • Posted ${selectedPost.PostingHour}` : ''}
                          </div>
                        </div>

                        {selectedPost.thumbnail_url && (
                          <a
                            href={selectedPost.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0"
                            title={`Open on ${pMeta.name}`}
                          >
                            <img
                              src={selectedPost.thumbnail_url}
                              alt={selectedPost.title}
                              className="w-14 h-20 rounded-xl border-2 border-[#19154E] object-cover bg-[#19154E]"
                            />
                          </a>
                        )}
                      </div>

                      {/* 4-Metric Scorecard */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 tabular-nums">
                        <div className="p-2.5 rounded-xl bg-white border-2 border-[#19154E]">
                          <div className="text-[10px] font-extrabold uppercase text-neutral-500">
                            Views
                          </div>
                          <div className="font-display font-bold text-base text-[#19154E]">
                            {(selectedPost.views || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-700">
                            {explanation.viewsMult.toFixed(1)}× your avg ({explanation.avgViews.toLocaleString()})
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#7CC4FA]/35 border-2 border-[#19154E]">
                          <div className="text-[10px] font-extrabold uppercase text-[#19154E] flex items-center justify-between">
                            <span>+Followers</span>
                            <UserPlus className="size-3 text-[#19154E]" />
                          </div>
                          <div className="font-display font-bold text-base text-[#19154E]">
                            +{(selectedPost.followers_gained || 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-bold text-[#19154E]">
                            {explanation.followersPer1k}/1K views
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border-2 border-[#19154E]">
                          <div className="text-[10px] font-extrabold uppercase text-neutral-500">
                            Likes &amp; Comments
                          </div>
                          <div className="font-display font-bold text-base text-[#19154E]">
                            {(selectedPost.likes || 0).toLocaleString()}{' '}
                            <span className="text-xs font-semibold text-neutral-500">
                              • {(selectedPost.comments || 0).toLocaleString()} 💬
                            </span>
                          </div>
                          <div className="text-[10px] font-bold text-neutral-600">
                            Avg {explanation.avgLikes.toLocaleString()} likes
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border-2 border-[#19154E]">
                          <div className="text-[10px] font-extrabold uppercase text-neutral-500">
                            Engagement %
                          </div>
                          <div className="font-display font-bold text-base text-[#6D28D9]">
                            {selectedPost.engagement_rate}%
                          </div>
                          <div className="text-[10px] font-bold text-neutral-600">
                            {explanation.erDelta >= 0
                              ? `+${explanation.erDelta}% vs avg`
                              : `${explanation.erDelta}% vs avg`}
                          </div>
                        </div>
                      </div>

                      {/* Data-Backed Explanation Breakdown */}
                      <div className="p-3.5 rounded-2xl bg-white border-2 border-[#19154E] space-y-2.5 text-xs">
                        <div className="font-display font-bold text-sm text-[#19154E] flex items-center gap-1.5">
                          <TrendingUp className="size-4 text-[#6D28D9]" />
                          <span>Why This Reel Performed</span>
                        </div>

                        <div className="space-y-2 text-[#19154E] leading-relaxed text-pretty">
                          <p>
                            <strong className="text-[#19154E]">1. Follower Growth:</strong>{' '}
                            {explanation.followerInsight}
                          </p>
                          <p>
                            <strong className="text-[#19154E]">2. Hook &amp; Caption:</strong>{' '}
                            {explanation.hookInsight}
                          </p>
                          <p>
                            <strong className="text-[#19154E]">3. Velocity vs. Avg:</strong>{' '}
                            {explanation.reachInsight}
                          </p>
                          <p>
                            <strong className="text-[#6D28D9]">4. Next Move:</strong>{' '}
                            {explanation.actionInsight}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onAnalyzePost(selectedPost, pMeta)}
                          className="flex-1 editorial-btn px-3 py-2 rounded-xl bg-[#19154E] text-[#FFF8FC] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="size-3.5 text-[#C8F904]" />
                          <span>AI Deep Dive</span>
                        </button>

                        <button
                          type="button"
                          onClick={onOpenPlanner}
                          className="editorial-btn px-3 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                        >
                          <Calendar className="size-3.5" />
                          <span>Repurpose in Planner</span>
                        </button>

                        {selectedPost.permalink && (
                          <a
                            href={selectedPost.permalink}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open live post on ${pMeta.name}`}
                            title={`Open live post on ${pMeta.name}`}
                            className="editorial-btn p-2 rounded-xl bg-white text-[#19154E] text-xs font-bold inline-flex items-center justify-center"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
