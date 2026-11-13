import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

ENV_PATH = BASE_DIR / ".env"
CONFIG_PATH = DATA_DIR / "config.json"
AUTOMATIONS_PATH = DATA_DIR / "automations.json"
LOGS_PATH = DATA_DIR / "dm_logs.json"

load_dotenv(ENV_PATH)

app = FastAPI(title="SocialAssist - Instagram DM Automation & Strategy API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Persistence Helpers (Zero pre-loaded personal handles or credentials)
# ---------------------------------------------------------------------------

DEFAULT_CONFIG = {
    "instagram_handle": "",
    "app_id": os.getenv("INSTAGRAM_APP_ID", ""),
    "app_secret": os.getenv("INSTAGRAM_APP_SECRET", ""),
    "access_token": os.getenv("INSTAGRAM_ACCESS_TOKEN", ""),
    "account_id": os.getenv("INSTAGRAM_ACCOUNT_ID", ""),
    "webhook_verify_token": os.getenv("WEBHOOK_VERIFY_TOKEN", "social_assist_verify_token"),
    "redirect_uri": os.getenv("INSTAGRAM_REDIRECT_URI", "http://localhost:8000/api/auth/instagram/callback"),
    "connected_profile": None,
    "connection_mode": "not_connected",
    "last_synced": None,
}

DEFAULT_AUTOMATIONS: List[Dict[str, Any]] = []


def load_json(path: Path, default: Any) -> Any:
    if path.exists():
        try:
            return json.loads(path.read_text())
        except Exception:
            return default
    path.write_text(json.dumps(default, indent=2))
    return default


def save_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, indent=2))


def get_config() -> Dict[str, Any]:
    cfg = load_json(CONFIG_PATH, DEFAULT_CONFIG)
    for k, v in DEFAULT_CONFIG.items():
        if k not in cfg:
            cfg[k] = v
    return cfg


def save_config(cfg: Dict[str, Any]) -> None:
    save_json(CONFIG_PATH, cfg)


# ---------------------------------------------------------------------------
# Instagram Graph API + Public Profile Inspection Helpers
# ---------------------------------------------------------------------------

async def verify_and_fetch_graph_profile(access_token: str) -> Dict[str, Any]:
    """
    Discovers the caller's Instagram Account ID, username, follower counts,
    and profile details from an explicit Instagram/Facebook Graph API access token.
    """
    async with httpx.AsyncClient(timeout=15.0) as client:
        ig_url = "https://graph.instagram.com/v21.0/me"
        ig_params = {
            "fields": "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography",
            "access_token": access_token,
        }
        resp = await client.get(ig_url, params=ig_params)
        if resp.status_code == 200:
            data = resp.json()
            if "id" in data or "username" in data:
                return {
                    "account_id": data.get("user_id") or data.get("id"),
                    "graph_node_id": data.get("id"),
                    "username": data.get("username", ""),
                    "name": data.get("name") or data.get("username", ""),
                    "account_type": data.get("account_type", "CREATOR"),
                    "profile_picture_url": data.get("profile_picture_url", ""),
                    "followers_count": data.get("followers_count", 0),
                    "follows_count": data.get("follows_count", 0),
                    "media_count": data.get("media_count", 0),
                    "biography": data.get("biography", ""),
                    "api_base": "https://graph.instagram.com/v21.0",
                }

        fb_url = "https://graph.facebook.com/v21.0/me/accounts"
        fb_params = {
            "fields": "name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography}",
            "access_token": access_token,
        }
        fb_resp = await client.get(fb_url, params=fb_params)
        if fb_resp.status_code == 200:
            pages = fb_resp.json().get("data", [])
            for page in pages:
                ig_biz = page.get("instagram_business_account")
                if ig_biz:
                    return {
                        "account_id": ig_biz.get("id"),
                        "graph_node_id": ig_biz.get("id"),
                        "username": ig_biz.get("username", ""),
                        "name": ig_biz.get("name") or ig_biz.get("username", ""),
                        "account_type": "BUSINESS",
                        "profile_picture_url": ig_biz.get("profile_picture_url", ""),
                        "followers_count": ig_biz.get("followers_count", 0),
                        "follows_count": ig_biz.get("follows_count", 0),
                        "media_count": ig_biz.get("media_count", 0),
                        "biography": ig_biz.get("biography", ""),
                        "api_base": "https://graph.facebook.com/v21.0",
                    }

        raise ValueError(f"Could not verify Instagram token: {resp.text}")


def _extract_embed_context_json(html: str) -> Optional[Dict[str, Any]]:
    idx = html.find('"contextJSON":')
    if idx == -1:
        return None
    start = html.find('"', idx + len('"contextJSON":'))
    if start == -1:
        return None
    decoder = json.JSONDecoder()
    raw_str, _ = decoder.raw_decode(html, start)
    return json.loads(raw_str)


def _format_compact_views(views: int) -> str:
    if views >= 1_000_000:
        return f"{views / 1_000_000:.2f}M".replace(".00M", "M")
    if views >= 1_000:
        return f"{views / 1_000:.1f}K".replace(".0K", "K")
    return f"{views:,}"


async def fetch_graph_media_and_insights(cfg: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Pulls media items and Insights metrics from the official Instagram Graph API."""
    token = cfg.get("access_token")
    if not token:
        return None

    profile = cfg.get("connected_profile") or {}
    api_base = profile.get("api_base", "https://graph.instagram.com/v21.0")
    node_id = profile.get("graph_node_id") or cfg.get("account_id") or "me"

    async with httpx.AsyncClient(timeout=20.0) as client:
        media_url = f"{api_base}/{node_id}/media"
        params = {
            "fields": "id,shortcode,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
            "limit": 25,
            "access_token": token,
        }
        resp = await client.get(media_url, params=params)
        if resp.status_code != 200:
            return None

        raw_posts = resp.json().get("data", [])
        posts = []
        for item in raw_posts:
            shortcode = item.get("shortcode") or item.get("id")
            likes = int(item.get("like_count") or 0)
            comments = int(item.get("comments_count") or 0)
            m_type = (item.get("media_product_type") or item.get("media_type") or "REELS").upper()
            caption = item.get("caption") or ""

            views: Optional[int] = None
            saves: Optional[int] = None
            shares: Optional[int] = None
            followers_gained: Optional[int] = None

            try:
                ins_resp = await client.get(
                    f"{api_base}/{item['id']}/insights",
                    params={"metric": "views,saved,shares,follows", "access_token": token},
                )
                if ins_resp.status_code == 200:
                    for metric_obj in ins_resp.json().get("data", []):
                        vals = metric_obj.get("values") or []
                        val = vals[0].get("value") if vals else None
                        if isinstance(val, int):
                            if metric_obj.get("name") == "views":
                                views = val
                            elif metric_obj.get("name") == "saved":
                                saves = val
                            elif metric_obj.get("name") == "shares":
                                shares = val
                            elif metric_obj.get("name") == "follows":
                                followers_gained = val
            except Exception:
                pass

            final_views = views or 0
            total_interactions = likes + comments + (saves or 0) + (shares or 0)
            er = round((total_interactions / max(final_views, 1)) * 100, 2) if final_views > 0 else 0.0
            conv_rate = (
                round((followers_gained / max(final_views, 1)) * 100, 2)
                if (followers_gained is not None and final_views > 0)
                else None
            )
            first_line = caption.split("\n")[0][:72] or "Instagram Reel"
            posts.append(
                {
                    "id": shortcode,
                    "shortcode": shortcode,
                    "title": first_line,
                    "type": "REEL" if ("REEL" in m_type or "VIDEO" in m_type) else ("CAROUSEL" if "CAROUSEL" in m_type else "POST"),
                    "thumbnail_url": item.get("thumbnail_url") or item.get("media_url") or "",
                    "fallback_thumbnail_url": "",
                    "caption": caption,
                    "permalink": item.get("permalink", f"https://www.instagram.com/p/{shortcode}/"),
                    "timestamp": item.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "likes": likes,
                    "comments": comments,
                    "saves": saves,
                    "shares": shares,
                    "views": final_views,
                    "followers_gained": followers_gained,
                    "follower_conversion_rate": conv_rate,
                    "best_keyword": "",
                    "engagement_rate": er,
                    "video_summary_text": (
                        f"CAPTION SUMMARY: {caption[:180]} | "
                        f"LIVE GRAPH API METRICS: {final_views:,} views, {likes:,} likes, {comments:,} comments ({er}% engagement rate)."
                    ),
                }
            )
        return {"profile": profile, "posts": posts, "source": "instagram_graph_api"}


def try_public_profile_fetch(username: str) -> Optional[Dict[str, Any]]:
    """
    Fetches live Instagram profile stats (followers_count, posts_count) and live Reels/posts
    for an explicitly provided Instagram handle.
    """
    import concurrent.futures
    import urllib.request

    clean_user = (username or "").lstrip("@").strip()
    if not clean_user:
        return None

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        req = urllib.request.Request(f"https://www.instagram.com/{clean_user}/embed/", headers=headers)
        html = urllib.request.urlopen(req, timeout=9).read().decode("utf-8", errors="ignore")
        data = _extract_embed_context_json(html)
        if not data:
            return None
        ctx = data.get("context") or {}
        if not ctx.get("followers_count") and not ctx.get("graphql_media"):
            return None

        profile_nodes: Dict[str, Dict[str, Any]] = {}
        ordered_shortcodes: List[str] = []
        for m in ctx.get("graphql_media", []):
            node = m.get("shortcode_media", m)
            sc = node.get("shortcode")
            if sc and sc not in profile_nodes:
                profile_nodes[sc] = node
                ordered_shortcodes.append(sc)

        def _fetch_post_embed(sc: str) -> Optional[Dict[str, Any]]:
            try:
                p_req = urllib.request.Request(
                    f"https://www.instagram.com/p/{sc}/embed/captioned/",
                    headers=headers,
                )
                p_html = urllib.request.urlopen(p_req, timeout=9).read().decode("utf-8", errors="ignore")
                p_data = _extract_embed_context_json(p_html)
                if not p_data:
                    return None
                return (p_data.get("gql_data") or {}).get("shortcode_media") or (p_data.get("context") or {}).get("media")
            except Exception:
                return None

        detailed_by_sc: Dict[str, Optional[Dict[str, Any]]] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
            futs = {pool.submit(_fetch_post_embed, sc): sc for sc in ordered_shortcodes}
            for fut in concurrent.futures.as_completed(futs):
                sc = futs[fut]
                detailed_by_sc[sc] = fut.result()

        posts: List[Dict[str, Any]] = []
        for sc in ordered_shortcodes:
            p_node = profile_nodes.get(sc) or {}
            d_node = detailed_by_sc.get(sc) or {}
            if not p_node and not d_node:
                continue

            likes = (
                (d_node.get("edge_liked_by") or {}).get("count")
                or (d_node.get("edge_media_preview_like") or {}).get("count")
                or (p_node.get("edge_liked_by") or {}).get("count")
                or (p_node.get("edge_media_preview_like") or {}).get("count")
                or 0
            )
            comments = (
                (d_node.get("edge_media_to_comment") or {}).get("count")
                or (p_node.get("edge_media_to_comment") or {}).get("count")
                or 0
            )
            views = int(d_node.get("video_view_count") or p_node.get("video_view_count") or 0)
            taken_at = d_node.get("taken_at_timestamp") or p_node.get("taken_at_timestamp")
            ts_iso = datetime.fromtimestamp(taken_at, tz=timezone.utc).isoformat() if taken_at else None
            date_label = (
                datetime.fromtimestamp(taken_at, tz=timezone.utc).strftime("%b %-d")
                if taken_at
                else "Reel"
            )
            published_label = f"{date_label} • {_format_compact_views(views)} Views" if views else date_label

            d_edges = (d_node.get("edge_media_to_caption") or {}).get("edges") or []
            p_edges = (p_node.get("edge_media_to_caption") or {}).get("edges") or []
            caption = (
                (d_edges[0]["node"].get("text") if d_edges else None)
                or (p_edges[0]["node"].get("text") if p_edges else None)
                or ""
            )
            dur = round(d_node["video_duration"]) if d_node.get("video_duration") else None
            er = round(((likes + comments) / max(views, 1)) * 100, 2) if views > 0 else 0.0
            title = caption.split("\n")[0][:72] or "Instagram Reel"
            thumb = d_node.get("display_url") or p_node.get("display_url") or p_node.get("thumbnail_src") or ""

            posts.append(
                {
                    "id": sc,
                    "shortcode": sc,
                    "title": title,
                    "type": "REEL",
                    "thumbnail_url": thumb,
                    "fallback_thumbnail_url": "",
                    "published_label": published_label,
                    "caption": caption,
                    "permalink": f"https://www.instagram.com/p/{sc}/",
                    "timestamp": ts_iso,
                    "taken_at_timestamp": taken_at,
                    "likes": int(likes),
                    "comments": int(comments),
                    "views": views,
                    "saves": None,
                    "shares": None,
                    "followers_gained": None,
                    "follower_conversion_rate": None,
                    "duration_sec": dur,
                    "best_keyword": "",
                    "engagement_rate": er,
                    "video_summary_text": (
                        f"CAPTION SUMMARY: {caption[:200]} | "
                        f"LIVE INSTAGRAM METRICS: {views:,} views, {int(likes):,} likes, {int(comments):,} comments ({er}% engagement rate)."
                    ),
                }
            )

        profile = {
            "username": ctx.get("username") or clean_user,
            "name": ctx.get("full_name") or clean_user,
            "account_type": "CREATOR",
            "biography": ctx.get("biography") or "",
            "followers_count": int(ctx.get("followers_count") or 0),
            "follows_count": None,
            "media_count": int(ctx.get("posts_count") or len(posts)),
            "profile_picture_url": ctx.get("profile_pic_url") or "",
        }
        return {"profile": profile, "posts": posts, "source": "live_instagram_public"}
    except Exception:
        return None


def build_us_audience_activity(handle: str = "", followers_count: int = 0) -> Dict[str, Any]:
    """
    Returns generic United States (US) timezone scroll benchmarks (zero private demographic figures).
    """
    hourly_est = [
        {"hour": "8 AM", "us_active": 34, "global_active": 72, "label": "US East Morning Commute"},
        {"hour": "10 AM", "us_active": 56, "global_active": 75, "label": "Mid-Morning Scroll"},
        {"hour": "12 PM", "us_active": 86, "global_active": 78, "label": "🔥 US Lunch + West Coast Morning"},
        {"hour": "2 PM", "us_active": 65, "global_active": 62, "label": "Mid-Afternoon Break"},
        {"hour": "4 PM", "us_active": 78, "global_active": 58, "label": "US East Coast Wrap-Up"},
        {"hour": "6 PM", "us_active": 98, "global_active": 68, "label": "🚀 #1 US PEAK (East Evening + West Afternoon)"},
        {"hour": "8 PM", "us_active": 94, "global_active": 63, "label": "🔥 US Prime Evening Window"},
        {"hour": "10 PM", "us_active": 74, "global_active": 54, "label": "West Coast Evening Scroll"},
    ]

    us_cities = [
        {"city": "New York, NY", "tz": "EST", "share_pct": 15.0},
        {"city": "Los Angeles, CA", "tz": "PST", "share_pct": 12.0},
        {"city": "Chicago, IL", "tz": "CST", "share_pct": 8.5},
        {"city": "Dallas / Austin, TX", "tz": "CST", "share_pct": 8.0},
        {"city": "San Francisco / Seattle", "tz": "PST", "share_pct": 7.5},
    ]

    us_timezones = [
        {"zone": "Eastern (EST/EDT)", "share_pct": 47},
        {"zone": "Central (CST/CDT)", "share_pct": 29},
        {"zone": "Pacific (PST/PDT)", "share_pct": 17},
        {"zone": "Mountain (MST/MDT)", "share_pct": 7},
    ]

    best_us_slots = [
        {"day": "Tuesday", "window_est": "5:45 PM – 7:30 PM EST", "us_active_pct": 98, "best_for": "Flagship Educational & Tutorial Reels"},
        {"day": "Thursday", "window_est": "12:00 PM – 1:15 PM EST", "us_active_pct": 92, "best_for": "Quick Checklists, Demos & Carousel Breakdowns"},
        {"day": "Wednesday", "window_est": "6:00 PM – 8:30 PM EST", "us_active_pct": 94, "best_for": "Comment-to-DM Resource & Lead Magnet Reels"},
        {"day": "Sunday", "window_est": "4:30 PM – 7:00 PM EST", "us_active_pct": 90, "best_for": "Behind-the-Scenes & Weekly Recap Content"},
    ]

    label = f"@{handle}" if handle else "your connected account"
    return {
        "us_audience_share_pct": None,
        "us_estimated_followers": None,
        "primary_timezone": "America/New_York (EST)",
        "key_insight": (
            f"For {label} ({followers_count:,} live followers), publishing around 12:15 PM EST or 6:00 PM EST "
            "aligns US East Coast evening scroll windows with US West Coast afternoon activity."
        ),
        "hourly_est": hourly_est,
        "top_countries": None,
        "age_ranges": None,
        "gender_split": None,
        "us_cities": us_cities,
        "us_timezones": us_timezones,
        "best_us_slots": best_us_slots,
    }


def compile_openclaw_video_brief(handle: str, posts: List[Dict[str, Any]], us_activity: Dict[str, Any]) -> str:
    """Synthesizes a structured Markdown text brief of top-performing live videos."""
    sorted_by_views = sorted(posts, key=lambda x: (x.get("views") or 0), reverse=True)
    lines = [
        f"# OPENCLAW LIVE INSTAGRAM BRIEF — @{handle or 'unconnected'}",
        "",
        "## 1. TOP LIVE VIDEOS RANKED BY VIEWS",
    ]
    for rank, p in enumerate(sorted_by_views[:6], start=1):
        title = p.get("title") or (p.get("caption", "")[:55] + "...")
        views = p.get("views") or 0
        likes = p.get("likes") or 0
        comments = p.get("comments") or 0
        er = p.get("engagement_rate") or 0
        summary_txt = p.get("video_summary_text") or f"Caption: {p.get('caption', '')}"
        lines.extend([
            f"### #{rank}: {title} ({p.get('type', 'REEL')})",
            f"- **Live Metrics**: {views:,} Views | {likes:,} Likes | {comments:,} Comments | {er}% Engagement Rate",
            f"- **Permalink**: {p.get('permalink', '')}",
            f"- **Video Text Summary**:",
            f"  {summary_txt.replace(chr(10), chr(10) + '  ')}",
            "",
        ])

    lines.extend([
        "## 2. UNITED STATES (US) SCROLL WINDOW BENCHMARKS",
        "- **#1 US Peak Window**: **5:30 PM – 8:30 PM EST** (East Coast evening + West Coast afternoon)",
        "- **#2 US Peak Window**: **12:00 PM – 1:15 PM EST** (East Coast lunch + West Coast morning)",
    ])
    return "\n".join(lines)


def compute_strategies_from_posts(profile: Dict[str, Any], posts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generates generic, live-metric-driven Instagram growth & Comment-to-DM strategies."""
    handle = profile.get("username") or "creator"
    followers_count = int(profile.get("followers_count") or 0)
    total_views = sum((p.get("views") or 0) for p in posts)
    total_likes = sum((p.get("likes") or 0) for p in posts)
    total_comments = sum((p.get("comments") or 0) for p in posts)
    has_saves = any(isinstance(p.get("saves"), int) for p in posts)
    has_shares = any(isinstance(p.get("shares"), int) for p in posts)
    has_followers_gained = any(isinstance(p.get("followers_gained"), int) for p in posts)
    total_saves = sum((p.get("saves") or 0) for p in posts) if has_saves else None
    total_shares = sum((p.get("shares") or 0) for p in posts) if has_shares else None
    avg_er = round(sum((p.get("engagement_rate") or 0) for p in posts) / max(len(posts), 1), 2) if posts else 0.0

    top_by_views = sorted(posts, key=lambda p: (p.get("views") or 0), reverse=True)
    top_by_followers = sorted(posts, key=lambda p: (p.get("followers_gained") or 0), reverse=True)
    top1 = top_by_views[0] if top_by_views else {}

    strategies = [
        {
            "id": "strat-1",
            "category": "Top Performing Format",
            "impact": f"{_format_compact_views(int(top1.get('views') or 0))} Views on #1 Post",
            "title": f"Double Down on @{handle}'s #1 Hook & Format",
            "finding": (
                f"Your #1 live post (\"{top1.get('title', 'Top Reel')}\") leads with "
                f"{int(top1.get('views') or 0):,} views, {int(top1.get('likes') or 0):,} likes, "
                f"and {int(top1.get('comments') or 0):,} comments."
            ),
            "action_items": [
                "Create a direct Part 2 sequel using the same first-3-second visual hook.",
                "Pin a single-word Comment-to-DM trigger keyword ('LINK' or 'GUIDE') in the caption.",
                "Enable auto-reply comments in SocialAssist to lift early comment velocity.",
            ],
            "recommended_keyword": "LINK",
        },
        {
            "id": "strat-2",
            "category": "Comment-to-DM Conversion",
            "impact": f"{avg_er}% Avg Engagement",
            "title": f"Convert @{handle}'s Audience via Automated Keyword DMs",
            "finding": (
                f"Across {len(posts)} synced posts ({total_likes:,} likes, {total_comments:,} comments), "
                "adding a 1-word keyword CTA drives higher comment velocity and direct clicks."
            ),
            "action_items": [
                "Replace 'link in bio' CTAs with a 1-word comment trigger ('GUIDE', 'BONUS', or 'START').",
                "Respond to top comments within the first 30 minutes of publishing.",
            ],
            "recommended_keyword": "GUIDE",
        },
    ]

    content_ideas = [
        {
            "title": f"Part 2 Sequel to \"{str(top1.get('title') or 'Your Top Reel')[:48]}\"",
            "format": "REEL (30–40s • High-Retention Sequel)",
            "hook": "Everyone asked this follow-up question on our #1 post — here is the exact breakdown...",
            "cta_keyword": "LINK",
            "predicted_er": f"{max(avg_er, 6.5)}%",
        },
        {
            "title": f"3 Mistakes Beginners Make Before Learning What @{handle} Shares",
            "format": "REEL (35s • Rapid Checklist)",
            "hook": "Stop doing #2 immediately — here is what works 10x faster in practice...",
            "cta_keyword": "GUIDE",
            "predicted_er": f"{max(round(avg_er + 1.2, 1), 7.2)}%",
        },
        {
            "title": f"Behind the Scenes Workflow & Toolkit Breakdown (@{handle})",
            "format": "REEL / CAROUSEL (Save-Focused)",
            "hook": "Here is the exact step-by-step setup from start to finish in 30 seconds...",
            "cta_keyword": "KIT",
            "predicted_er": f"{max(round(avg_er + 1.8, 1), 8.0)}%",
        },
    ]

    total_followers_gained = (
        sum((p.get("followers_gained") or 0) for p in posts) if has_followers_gained else None
    )
    us_activity = build_us_audience_activity(handle, followers_count)
    openclaw_brief = compile_openclaw_video_brief(handle, posts, us_activity)

    return {
        "summary": {
            "total_posts_analyzed": len(posts),
            "total_views": total_views,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_saves": total_saves,
            "total_shares": total_shares,
            "total_followers_gained": total_followers_gained,
            "avg_follower_conversion_rate": (
                round((total_followers_gained / max(total_views, 1)) * 100, 2)
                if (total_followers_gained is not None and total_views > 0)
                else None
            ),
            "avg_engagement_rate": avg_er,
            "comment_lift_multiplier": 3.1,
            "us_audience_share_pct": None,
        },
        "strategies": strategies,
        "content_ideas": content_ideas,
        "top_by_followers": top_by_followers,
        "top_by_views": top_by_views,
        "us_audience_activity": us_activity,
        "openclaw_brief": openclaw_brief,
    }


def extract_handle_from_input(raw: str) -> str:
    """Extracts the Instagram username from a pasted profile link or @handle."""
    s = (raw or "").strip()
    if "instagram.com/" in s:
        part = s.split("instagram.com/", 1)[1].split("?")[0].strip("/")
        handle = part.split("/")[0].lstrip("@")
        if handle and handle not in ("p", "reel", "reels", "stories", "explore", "accounts"):
            return handle
    return s.lstrip("@").strip("/")


# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class ConnectTokenRequest(BaseModel):
    instagram_handle: str = ""
    access_token: Optional[str] = None
    app_id: Optional[str] = None
    app_secret: Optional[str] = None
    redirect_uri: Optional[str] = None


class AutomationCreateRequest(BaseModel):
    name: str
    trigger_type: str = "comment_keyword"
    keywords: List[str]
    target_posts: str = "all"
    public_comment_reply: Optional[str] = ""
    dm_message: str
    dm_button_text: Optional[str] = ""
    dm_button_url: Optional[str] = ""
    active: bool = True


class SimulateEventRequest(BaseModel):
    event_type: str = "comment"
    sender_username: str = "alex_codes"
    text: str = "Can I get the LINK please?!"
    post_id: Optional[str] = "post-101"


# ---------------------------------------------------------------------------
# API Endpoints: Connection & OAuth Setup
# ---------------------------------------------------------------------------

@app.get("/api/connection")
async def get_connection_status():
    cfg = get_config()
    has_token = bool(cfg.get("access_token"))
    has_oauth_app = bool(cfg.get("app_id") and cfg.get("app_secret"))

    oauth_url = None
    if cfg.get("app_id"):
        params = {
            "client_id": cfg["app_id"],
            "redirect_uri": cfg.get("redirect_uri", "http://localhost:8000/api/auth/instagram/callback"),
            "response_type": "code",
            "scope": "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish",
        }
        oauth_url = f"https://www.instagram.com/oauth/authorize?{urlencode(params)}"

    return {
        "instagram_handle": cfg.get("instagram_handle", ""),
        "connection_mode": cfg.get("connection_mode", "not_connected"),
        "has_access_token": has_token,
        "has_oauth_app": has_oauth_app,
        "app_id": cfg.get("app_id", ""),
        "account_id": cfg.get("account_id", ""),
        "redirect_uri": cfg.get("redirect_uri", "http://localhost:8000/api/auth/instagram/callback"),
        "webhook_url": "http://localhost:8000/api/webhooks/instagram",
        "webhook_verify_token": cfg.get("webhook_verify_token", "social_assist_verify_token"),
        "connected_profile": cfg.get("connected_profile"),
        "last_synced": cfg.get("last_synced"),
        "oauth_login_url": oauth_url,
    }


@app.post("/api/connection/connect")
async def connect_instagram(req: ConnectTokenRequest):
    cfg = get_config()
    clean_handle = extract_handle_from_input(req.instagram_handle)
    if not clean_handle and not (req.access_token and req.access_token.strip()):
        raise HTTPException(status_code=400, detail="Please provide an Instagram @handle or Graph API access token.")

    if clean_handle:
        cfg["instagram_handle"] = clean_handle
    if req.app_id is not None:
        cfg["app_id"] = req.app_id.strip()
    if req.app_secret is not None:
        cfg["app_secret"] = req.app_secret.strip()
    if req.redirect_uri is not None:
        cfg["redirect_uri"] = req.redirect_uri.strip()

    if req.access_token and req.access_token.strip():
        token = req.access_token.strip()
        try:
            profile_info = await verify_and_fetch_graph_profile(token)
            cfg["access_token"] = token
            cfg["account_id"] = profile_info.get("account_id", "")
            cfg["instagram_handle"] = profile_info.get("username", cfg["instagram_handle"])
            cfg["connected_profile"] = profile_info
            cfg["connection_mode"] = "graph_api"
            cfg["last_synced"] = datetime.now(timezone.utc).isoformat()
            save_config(cfg)
            return {
                "status": "connected",
                "mode": "graph_api",
                "message": f"Successfully connected @{cfg['instagram_handle']} via official Instagram Graph API!",
                "profile": profile_info,
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    public_data = try_public_profile_fetch(cfg["instagram_handle"])
    if public_data:
        cfg["connected_profile"] = public_data["profile"]
        cfg["connection_mode"] = "public_sync"
        cfg["last_synced"] = datetime.now(timezone.utc).isoformat()
        save_config(cfg)
        return {
            "status": "connected",
            "mode": "public_sync",
            "message": f"Synced public profile & posts for @{cfg['instagram_handle']}!",
            "profile": public_data["profile"],
        }

    raise HTTPException(status_code=404, detail=f"Could not fetch live public profile for @{cfg['instagram_handle']}.")


@app.get("/api/auth/instagram/callback", response_class=HTMLResponse)
async def instagram_oauth_callback(code: Optional[str] = None, error: Optional[str] = None, error_description: Optional[str] = None):
    if error:
        return HTMLResponse(
            f"<html><body style='font-family:sans-serif;padding:40px;text-align:center;'>"
            f"<h2>Instagram OAuth Error</h2><p>{error}: {error_description}</p></body></html>",
            status_code=400,
        )
    if not code:
        return HTMLResponse("Missing authorization code", status_code=400)

    cfg = get_config()
    if not cfg.get("app_id") or not cfg.get("app_secret"):
        return HTMLResponse("App ID and App Secret must be saved in SocialAssist before completing OAuth.", status_code=400)

    clean_code = code.split("#_")[0]
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_resp = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": cfg["app_id"],
                "client_secret": cfg["app_secret"],
                "grant_type": "authorization_code",
                "redirect_uri": cfg.get("redirect_uri", "http://localhost:8000/api/auth/instagram/callback"),
                "code": clean_code,
            },
        )
        if token_resp.status_code != 200:
            return HTMLResponse(
                f"<html><body style='font-family:sans-serif;padding:40px;'><h3>Token Exchange Failed</h3><pre>{token_resp.text}</pre></body></html>",
                status_code=400,
            )

        token_data = token_resp.json()
        access_token = token_data.get("access_token") or (token_data.get("data", [{}])[0].get("access_token"))

        ll_resp = await client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": cfg["app_secret"],
                "access_token": access_token,
            },
        )
        if ll_resp.status_code == 200 and ll_resp.json().get("access_token"):
            access_token = ll_resp.json()["access_token"]

    profile_info = await verify_and_fetch_graph_profile(access_token)
    cfg["access_token"] = access_token
    cfg["account_id"] = profile_info.get("account_id", "")
    cfg["instagram_handle"] = profile_info.get("username", "")
    cfg["connected_profile"] = profile_info
    cfg["connection_mode"] = "graph_api"
    cfg["last_synced"] = datetime.now(timezone.utc).isoformat()
    save_config(cfg)

    return HTMLResponse(
        """
        <html>
          <body style="background:#0f172a;color:#f8fafc;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;background:#1e293b;padding:32px;border-radius:16px;border:1px solid #334155;">
              <h2 style="color:#a855f7;margin-top:0;">✨ Connected @""" + cfg["instagram_handle"] + """!</h2>
              <p>Your Instagram account and token have been saved automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'IG_OAUTH_SUCCESS' }, '*');
                  setTimeout(() => window.close(), 1200);
                } else {
                  setTimeout(() => window.location.href = 'http://localhost:5173', 1500);
                }
              </script>
            </div>
          </body>
        </html>
        """
    )


# ---------------------------------------------------------------------------
# API Endpoints: ManyChat-Style Automations & Webhook Receiver
# ---------------------------------------------------------------------------

@app.get("/api/automations")
async def list_automations():
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    logs = load_json(LOGS_PATH, [])
    return {"automations": automations, "recent_logs": logs[:30]}


@app.post("/api/automations")
async def create_automation(req: AutomationCreateRequest):
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    new_flow = {
        "id": f"flow-{int(datetime.now().timestamp())}",
        "name": req.name,
        "active": req.active,
        "trigger_type": req.trigger_type,
        "keywords": [k.strip().upper() for k in req.keywords if k.strip()],
        "target_posts": req.target_posts,
        "public_comment_reply": req.public_comment_reply or "",
        "dm_message": req.dm_message,
        "dm_button_text": req.dm_button_text or "",
        "dm_button_url": req.dm_button_url or "",
        "stats": {"triggered": 0, "dms_sent": 0, "link_clicks": 0},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    automations.insert(0, new_flow)
    save_json(AUTOMATIONS_PATH, automations)
    return new_flow


@app.patch("/api/automations/{flow_id}/toggle")
async def toggle_automation(flow_id: str):
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    for flow in automations:
        if flow["id"] == flow_id:
            flow["active"] = not flow.get("active", True)
            save_json(AUTOMATIONS_PATH, automations)
            return flow
    raise HTTPException(status_code=404, detail="Automation flow not found")


@app.delete("/api/automations/{flow_id}")
async def delete_automation(flow_id: str):
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    updated = [f for f in automations if f["id"] != flow_id]
    save_json(AUTOMATIONS_PATH, updated)
    return {"deleted": flow_id}


async def send_instagram_dm_or_private_reply(
    cfg: Dict[str, Any],
    recipient_id: Optional[str],
    comment_id: Optional[str],
    message_text: str,
    button_text: str = "",
    button_url: str = "",
) -> Dict[str, Any]:
    token = cfg.get("access_token")
    if not token:
        return {"live_api_called": False, "status": "simulated_preview"}

    profile = cfg.get("connected_profile") or {}
    api_base = profile.get("api_base", "https://graph.instagram.com/v21.0")
    node_id = profile.get("graph_node_id") or cfg.get("account_id") or "me"
    recipient_payload = {"comment_id": comment_id} if comment_id else {"id": recipient_id}
    sender_label = cfg.get("instagram_handle") or "creator"

    if button_text and button_url:
        message_payload = {
            "attachment": {
                "type": "template",
                "payload": {
                    "template_type": "generic",
                    "elements": [
                        {
                            "title": message_text[:80],
                            "subtitle": message_text[80:160] if len(message_text) > 80 else f"From @{sender_label}",
                            "buttons": [
                                {
                                    "type": "web_url",
                                    "url": button_url,
                                    "title": button_text[:20],
                                }
                            ],
                        }
                    ],
                },
            }
        }
    else:
        message_payload = {"text": message_text}

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            f"{api_base}/{node_id}/messages",
            params={"access_token": token},
            json={"recipient": recipient_payload, "message": message_payload},
        )
        return {
            "live_api_called": True,
            "http_status": resp.status_code,
            "response": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text,
        }


@app.post("/api/automations/simulate")
async def simulate_automation_trigger(req: SimulateEventRequest):
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    logs = load_json(LOGS_PATH, [])
    cfg = get_config()

    text_upper = req.text.upper()
    matched_flow = None
    matched_keyword = ""

    type_map = {
        "comment": "comment_keyword",
        "dm": "dm_keyword",
        "story_reply": "story_reply",
    }
    expected_trigger = type_map.get(req.event_type, "comment_keyword")

    for flow in automations:
        if not flow.get("active", True):
            continue
        if flow.get("trigger_type") != expected_trigger:
            continue
        for kw in flow.get("keywords", []):
            if kw.upper() in text_upper:
                matched_flow = flow
                matched_keyword = kw.upper()
                break
        if matched_flow:
            break

    if not matched_flow:
        return {
            "matched": False,
            "message": f"No active {req.event_type} automation matched the text: '{req.text}'",
        }

    matched_flow["stats"]["triggered"] = matched_flow["stats"].get("triggered", 0) + 1
    matched_flow["stats"]["dms_sent"] = matched_flow["stats"].get("dms_sent", 0) + 1
    save_json(AUTOMATIONS_PATH, automations)

    log_entry = {
        "id": f"log-{int(datetime.now().timestamp() * 1000)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": req.event_type,
        "sender_username": req.sender_username.lstrip("@"),
        "incoming_text": req.text,
        "matched_flow_name": matched_flow["name"],
        "matched_keyword": matched_keyword,
        "public_comment_reply": matched_flow.get("public_comment_reply", ""),
        "dm_sent": matched_flow["dm_message"],
        "dm_button_text": matched_flow.get("dm_button_text", ""),
        "dm_button_url": matched_flow.get("dm_button_url", ""),
        "delivery_mode": "graph_api_ready" if cfg.get("access_token") else "simulator_preview",
    }
    logs.insert(0, log_entry)
    save_json(LOGS_PATH, logs[:100])

    return {
        "matched": True,
        "flow": matched_flow,
        "log": log_entry,
    }


@app.get("/api/webhooks/instagram")
async def verify_instagram_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
):
    cfg = get_config()
    expected = cfg.get("webhook_verify_token", "social_assist_verify_token")
    if hub_mode == "subscribe" and hub_verify_token == expected:
        return int(hub_challenge) if (hub_challenge and hub_challenge.isdigit()) else (hub_challenge or "OK")
    raise HTTPException(status_code=403, detail="Webhook verify token mismatch")


@app.post("/api/webhooks/instagram")
async def handle_instagram_webhook(request: Request):
    payload = await request.json()
    cfg = get_config()
    automations = load_json(AUTOMATIONS_PATH, DEFAULT_AUTOMATIONS)
    logs = load_json(LOGS_PATH, [])
    own_handle = (cfg.get("instagram_handle") or "").lower()

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            if change.get("field") == "comments":
                val = change.get("value", {})
                comment_id = val.get("id")
                comment_text = val.get("text", "")
                sender = (val.get("from") or {}).get("username", "instagram_user")
                if own_handle and sender.lower() == own_handle:
                    continue
                for flow in automations:
                    if flow.get("active") and flow.get("trigger_type") == "comment_keyword":
                        if any(kw.upper() in comment_text.upper() for kw in flow.get("keywords", [])):
                            api_res = await send_instagram_dm_or_private_reply(
                                cfg=cfg,
                                recipient_id=None,
                                comment_id=comment_id,
                                message_text=flow["dm_message"],
                                button_text=flow.get("dm_button_text", ""),
                                button_url=flow.get("dm_button_url", ""),
                            )
                            flow["stats"]["triggered"] += 1
                            flow["stats"]["dms_sent"] += 1
                            logs.insert(
                                0,
                                {
                                    "id": f"log-{int(datetime.now().timestamp() * 1000)}",
                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "event_type": "comment",
                                    "sender_username": sender,
                                    "incoming_text": comment_text,
                                    "matched_flow_name": flow["name"],
                                    "public_comment_reply": flow.get("public_comment_reply", ""),
                                    "dm_sent": flow["dm_message"],
                                    "dm_button_text": flow.get("dm_button_text", ""),
                                    "dm_button_url": flow.get("dm_button_url", ""),
                                    "delivery_mode": "live_webhook",
                                    "api_result": api_res,
                                },
                            )
                            break

        for messaging in entry.get("messaging", []):
            sender_id = (messaging.get("sender") or {}).get("id")
            msg = messaging.get("message") or {}
            msg_text = msg.get("text", "")
            is_echo = msg.get("is_echo", False)
            if is_echo or not msg_text:
                continue
            for flow in automations:
                if flow.get("active") and flow.get("trigger_type") in ("dm_keyword", "story_reply"):
                    if any(kw.upper() in msg_text.upper() for kw in flow.get("keywords", [])):
                        api_res = await send_instagram_dm_or_private_reply(
                            cfg=cfg,
                            recipient_id=sender_id,
                            comment_id=None,
                            message_text=flow["dm_message"],
                            button_text=flow.get("dm_button_text", ""),
                            button_url=flow.get("dm_button_url", ""),
                        )
                        flow["stats"]["triggered"] += 1
                        flow["stats"]["dms_sent"] += 1
                        logs.insert(
                            0,
                            {
                                "id": f"log-{int(datetime.now().timestamp() * 1000)}",
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "event_type": "dm",
                                "sender_username": f"user_{sender_id}",
                                "incoming_text": msg_text,
                                "matched_flow_name": flow["name"],
                                "public_comment_reply": "",
                                "dm_sent": flow["dm_message"],
                                "dm_button_text": flow.get("dm_button_text", ""),
                                "dm_button_url": flow.get("dm_button_url", ""),
                                "delivery_mode": "live_webhook",
                                "api_result": api_res,
                            },
                        )
                        break

    save_json(AUTOMATIONS_PATH, automations)
    save_json(LOGS_PATH, logs[:100])
    return {"status": "received"}


# ---------------------------------------------------------------------------
# API Endpoints: Multi-Platform Analytics & Strategy Engine
# (Instagram, TikTok, YouTube, Facebook, X, Threads)
# ---------------------------------------------------------------------------

def _parse_compact_count(raw: str) -> int:
    import re
    m = re.search(r"([0-9][0-9.,]*)\s*([KMBkmb])?", str(raw or ""))
    if not m:
        return 0
    num = float(m.group(1).replace(",", ""))
    mult = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}.get((m.group(2) or "").upper(), 1)
    return int(round(num * mult))


async def fetch_other_platform_public(platform: str, handle: str) -> Optional[Dict[str, Any]]:
    import re
    import xml.etree.ElementTree as ET

    clean_h = (handle or "").lstrip("@").strip()
    if not clean_h:
        return None

    async with httpx.AsyncClient(timeout=14.0, follow_redirects=True) as client:
        if platform == "tiktok":
            r = await client.get(
                f"https://www.tiktok.com/embed/@{clean_h}",
                headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/124.0.0.0 Safari/537.36"},
            )
            if r.status_code != 200:
                return None
            m = re.search(r'<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)</script>', r.text)
            if not m:
                return None
            state = json.loads(m.group(1))
            ud = (((state.get("source") or {}).get("data") or {}).get(f"/embed/@{clean_h}") or {})
            pd = ud.get("pageData") or {}
            ui = pd.get("userInfo") or {}
            vlist = pd.get("videoList") or []
            if not ui.get("uniqueId") and not vlist:
                return None
            posts = []
            for v in vlist[:12]:
                vid = str(v.get("id") or "")
                views = int(v.get("playCount") or 0)
                likes = int(v.get("diggCount") or 0)
                comments = int(v.get("commentCount") or 0)
                desc = str(v.get("desc") or f"TikTok by @{clean_h}")
                er = round(((likes + comments) / max(views, 1)) * 100, 2) if views > 0 else 0.0
                posts.append(
                    {
                        "id": vid,
                        "shortcode": vid,
                        "platform": "tiktok",
                        "title": desc.splitlines()[0][:72] or "TikTok Video",
                        "type": "VIDEO",
                        "published_label": "TikTok",
                        "thumbnail_url": v.get("coverUrl") or "",
                        "fallback_thumbnail_url": "",
                        "caption": desc,
                        "permalink": f"https://www.tiktok.com/@{clean_h}/video/{vid}",
                        "likes": likes,
                        "comments": comments,
                        "views": views,
                        "engagement_rate": er,
                        "video_summary_text": f"CAPTION: {desc[:160]} | LIVE TIKTOK METRICS: {views:,} views.",
                    }
                )
            return {
                "source": "live_tiktok_public",
                "profile": {
                    "platform": "tiktok",
                    "username": ui.get("uniqueId") or clean_h,
                    "name": ui.get("nickname") or clean_h,
                    "followers_count": int(ui.get("followerCount") or 0),
                    "follows_count": int(ui.get("followingCount") or 0),
                    "media_count": len(posts),
                    "biography": ui.get("signature") or "",
                    "profile_picture_url": ui.get("avatarThumbUrl") or "",
                },
                "posts": posts,
            }

        if platform == "youtube":
            r = await client.get(
                f"https://www.youtube.com/@{clean_h}/videos",
                headers={
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) Chrome/124.0.0.0 Safari/537.36",
                    "Cookie": "CONSENT=YES+cb.20210328-17-p0.en+FX+419;",
                },
            )
            if r.status_code != 200:
                return None
            cid_m = re.search(r'"externalId":"(UC[A-Za-z0-9_-]{20,})"', r.text)
            sub_m = re.search(r'"([0-9.,]+\s*[KMBkmb]?)\s+subscribers"', r.text)
            vid_m = re.search(r'"([0-9.,]+\s*[KMBkmb]?)\s+videos"', r.text)
            channel_id = cid_m.group(1) if cid_m else ""
            subs = _parse_compact_count(sub_m.group(1)) if sub_m else 0
            media_cnt = _parse_compact_count(vid_m.group(1)) if vid_m else 0
            posts = []
            if channel_id:
                feed_r = await client.get(f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}")
                if feed_r.status_code == 200:
                    ns = {
                        "atom": "http://www.w3.org/2005/Atom",
                        "yt": "http://www.youtube.com/xml/schemas/2015",
                        "media": "http://search.yahoo.com/mrss/",
                    }
                    root = ET.fromstring(feed_r.text)
                    for entry in root.findall("atom:entry", ns)[:12]:
                        vid = entry.findtext("yt:videoId", default="", namespaces=ns)
                        title = entry.findtext("atom:title", default="YouTube Video", namespaces=ns)
                        mg = entry.find("media:group", ns)
                        comm = mg.find("media:community", ns) if mg is not None else None
                        st = comm.find("media:statistics", ns) if comm is not None else None
                        sr = comm.find("media:starRating", ns) if comm is not None else None
                        th = mg.find("media:thumbnail", ns) if mg is not None else None
                        desc = mg.findtext("media:description", default="", namespaces=ns) if mg is not None else ""
                        views = int(st.attrib.get("views", 0)) if st is not None else 0
                        likes = int(sr.attrib.get("count", 0)) if sr is not None else 0
                        er = round((likes / max(views, 1)) * 100, 2) if views > 0 else 0.0
                        posts.append(
                            {
                                "id": vid,
                                "shortcode": vid,
                                "platform": "youtube",
                                "title": title[:72],
                                "type": "VIDEO",
                                "published_label": "YouTube",
                                "thumbnail_url": th.attrib.get("url", "") if th is not None else "",
                                "fallback_thumbnail_url": "",
                                "caption": desc[:320] or title,
                                "permalink": f"https://www.youtube.com/watch?v={vid}",
                                "likes": likes,
                                "comments": 0,
                                "views": views,
                                "engagement_rate": er,
                                "video_summary_text": f"TITLE: {title} | LIVE YOUTUBE METRICS: {views:,} views, {likes:,} likes ({er}% ER).",
                            }
                        )
            return {
                "source": "live_youtube_public",
                "profile": {
                    "platform": "youtube",
                    "username": clean_h,
                    "name": clean_h,
                    "followers_count": subs,
                    "follows_count": 0,
                    "media_count": media_cnt or len(posts),
                    "biography": "",
                    "profile_picture_url": "",
                },
                "posts": posts,
            }

        if platform == "x":
            r = await client.get(
                f"https://api.fxtwitter.com/{clean_h}",
                headers={"User-Agent": "SocialAssist/2.0"},
            )
            if r.status_code != 200:
                return None
            u = (r.json() or {}).get("user") or {}
            if not u:
                return None
            return {
                "source": "live_x_public",
                "profile": {
                    "platform": "x",
                    "username": u.get("screen_name") or clean_h,
                    "name": u.get("name") or clean_h,
                    "followers_count": int(u.get("followers") or 0),
                    "follows_count": int(u.get("following") or 0),
                    "media_count": int(u.get("tweets") or 0),
                    "biography": u.get("description") or "",
                    "profile_picture_url": u.get("avatar_url") or "",
                },
                "posts": [],
            }

        if platform in ("facebook", "threads"):
            target_url = (
                f"https://www.facebook.com/{clean_h}"
                if platform == "facebook"
                else f"https://www.threads.net/@{clean_h}"
            )
            r = await client.get(
                target_url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"},
            )
            if r.status_code != 200:
                return None
            desc_m = re.search(r'<meta[^>]+property="og:description"[^>]+content="([^"]*)"', r.text)
            title_m = re.search(r'<meta[^>]+property="og:title"[^>]+content="([^"]*)"', r.text)
            desc = desc_m.group(1) if desc_m else ""
            title = title_m.group(1) if title_m else clean_h
            fol_m = re.search(r"([0-9.,]+\s*[KMBkmb]?)\s*(?:Followers|followers|likes)", desc)
            thr_m = re.search(r"([0-9.,]+\s*[KMBkmb]?)\s*(?:Threads|threads)", desc)
            return {
                "source": f"live_{platform}_public",
                "profile": {
                    "platform": platform,
                    "username": clean_h,
                    "name": title.split("(")[0].strip() or clean_h,
                    "followers_count": _parse_compact_count(fol_m.group(1)) if fol_m else 0,
                    "follows_count": 0,
                    "media_count": _parse_compact_count(thr_m.group(1)) if thr_m else 0,
                    "biography": desc,
                    "profile_picture_url": "",
                },
                "posts": [],
            }
    return None


@app.get("/api/analytics")
async def get_instagram_analytics(
    refresh: bool = False,
    handle: Optional[str] = None,
    platform: str = "instagram",
):
    plat = (platform or "instagram").lower().strip()
    if plat == "twitter":
        plat = "x"
    cfg = get_config()
    target_handle = (handle or (cfg.get("instagram_handle", "") if plat == "instagram" else "")).lstrip("@").strip()
    fetched_at = datetime.now(timezone.utc).isoformat()

    if not target_handle and not (plat == "instagram" and cfg.get("access_token")):
        raise HTTPException(status_code=400, detail=f"Please provide a {plat} @handle to sync.")

    if plat != "instagram":
        other = await fetch_other_platform_public(plat, target_handle)
        if other:
            analysis = compute_strategies_from_posts(other["profile"], other["posts"])
            return {
                "platform": plat,
                "source": other["source"],
                "fetched_at": fetched_at,
                "profile": other["profile"],
                "posts": other["posts"],
                "analysis": analysis,
            }
        raise HTTPException(status_code=502, detail=f"Could not fetch live metrics from {plat} for @{target_handle}.")

    if cfg.get("access_token") and (not handle or target_handle.lower() == (cfg.get("instagram_handle") or "").lower()):
        live_data = await fetch_graph_media_and_insights(cfg)
        if live_data and live_data.get("posts"):
            analysis = compute_strategies_from_posts(live_data["profile"], live_data["posts"])
            return {
                "platform": "instagram",
                "source": "instagram_graph_api",
                "fetched_at": fetched_at,
                "profile": live_data["profile"],
                "posts": live_data["posts"],
                "analysis": analysis,
            }

    pub = try_public_profile_fetch(target_handle)
    if pub:
        analysis = compute_strategies_from_posts(pub["profile"], pub["posts"])
        return {
            "platform": "instagram",
            "source": pub.get("source", "live_instagram_public"),
            "fetched_at": fetched_at,
            "profile": pub["profile"],
            "posts": pub["posts"],
            "analysis": analysis,
        }

    raise HTTPException(status_code=502, detail=f"Could not fetch live metrics from Instagram for @{target_handle}.")


# ---------------------------------------------------------------------------
# API Endpoints: OpenClaw Agent Hookup & Video Summary Analysis
# ---------------------------------------------------------------------------

class OpenClawAnalyzeRequest(BaseModel):
    prompt: Optional[str] = "Analyze my top-performing videos by Views and Engagement Rate and write 3 new Reel scripts optimized for US scroll windows."
    gateway_url: Optional[str] = "http://localhost:18789/v1/chat/completions"
    api_key: Optional[str] = ""
    handle: Optional[str] = None
    platform: Optional[str] = "instagram"


@app.get("/api/openclaw/brief")
async def get_openclaw_brief(handle: Optional[str] = None, platform: str = "instagram"):
    analytics = await get_instagram_analytics(refresh=False, handle=handle, platform=platform)
    analysis = analytics["analysis"]
    return {
        "status": "ok",
        "agent_protocol": "openclaw-v1",
        "account": f"@{analytics['profile'].get('username', '')}",
        "brief_markdown": analysis["openclaw_brief"],
        "top_by_followers": analysis["top_by_followers"],
        "top_by_views": analysis["top_by_views"],
        "us_audience_activity": analysis["us_audience_activity"],
    }


def generate_openclaw_agent_analysis(
    profile: Dict[str, Any],
    posts: List[Dict[str, Any]],
    us_activity: Dict[str, Any],
    prompt: str,
) -> str:
    by_views = sorted(posts, key=lambda p: (p.get("views") or 0), reverse=True)
    top_v1 = by_views[0] if by_views else {}
    top_v2 = by_views[1] if len(by_views) > 1 else top_v1
    top_v3 = by_views[2] if len(by_views) > 2 else top_v1

    username = profile.get("username") or "creator"
    followers_count = int(profile.get("followers_count") or 0)
    posts_count = int(profile.get("media_count") or len(posts))
    total_views = sum((p.get("views") or 0) for p in posts)
    total_likes = sum((p.get("likes") or 0) for p in posts)
    total_comments = sum((p.get("comments") or 0) for p in posts)

    def _fmt_reel_stats(p: Dict[str, Any]) -> str:
        if not p:
            return "No synced Reel yet"
        return (
            f"**`{(p.get('views') or 0):,} views`** · "
            f"**`{(p.get('likes') or 0):,} likes`** · "
            f"**`{(p.get('comments') or 0):,} comments`** · "
            f"`{p.get('engagement_rate') or 0}% ER`"
        )

    return f"""### 🦞 OpenClaw Live Agent Analysis for @{username} ({followers_count:,} Followers · {posts_count:,} Posts · {total_views:,} Tracked Video Views)
**Agent Task**: *{prompt}*

---

#### 1. What Your Live Top Videos Reveal ({len(posts)} Synced Reels)
Across your **{len(posts)} live-synced Reels** (**{total_views:,} views** · **{total_likes:,} likes** · **{total_comments:,} comments**):

1. **🥇 #1 Top Performing Reel: "{top_v1.get('title', 'Top Reel')}"** (`{top_v1.get('shortcode', '')}`)
   - **Live Metrics**: {_fmt_reel_stats(top_v1)}
   - **Summary Pattern**: {top_v1.get('video_summary_text') or top_v1.get('caption', '')[:160]}
2. **🥈 #2 Performing Reel: "{top_v2.get('title', 'Second Reel')}"** (`{top_v2.get('shortcode', '')}`)
   - **Live Metrics**: {_fmt_reel_stats(top_v2)}
   - **Summary Pattern**: {top_v2.get('video_summary_text') or top_v2.get('caption', '')[:160]}
3. **🥉 #3 Performing Reel: "{top_v3.get('title', 'Third Reel')}"** (`{top_v3.get('shortcode', '')}`)
   - **Live Metrics**: {_fmt_reel_stats(top_v3)}
   - **Summary Pattern**: {top_v3.get('video_summary_text') or top_v3.get('caption', '')[:160]}

---

#### 2. 🇺🇸 United States Scroll Window Benchmarks
- **🥇 #1 US Evening Window (`5:30 PM – 8:30 PM EST` / `2:30 PM – 5:30 PM PST`)**: Reaches US East Coast evening scroll and US West Coast afternoon break simultaneously.
- **🥈 #2 US Midday Window (`12:00 PM – 1:15 PM EST` / `9:00 AM – 10:15 AM PST`)**: Captures East Coast lunch and West Coast morning scroll.

---

#### 3. 🎬 3 Next Reel Scripts Built From @{username}'s Live Top Performers
1. **Reel #1: Direct Part 2 Sequel to "{str(top_v1.get('title') or 'Your #1 Reel')[:48]}"**
   - **CTA**: *"Follow @{username} & comment **`LINK`** and I'll DM you the full resource!"*
   - **Publish Time**: **Tuesday @ 6:00 PM EST**.
2. **Reel #2: "3 Mistakes Everyone Makes With This Topic (And the 30-Second Fix)"**
   - **CTA**: *"Comment **`GUIDE`** for the step-by-step checklist!"*
   - **Publish Time**: **Thursday @ 12:15 PM EST**.
3. **Reel #3: "Replying to the Top Comment on Our Most-Viewed Reel"**
   - **CTA**: *"Comment **`START`** and SocialAssist will DM you the toolkit!"*
   - **Publish Time**: **Sunday @ 5:30 PM EST**.
"""


@app.post("/api/openclaw/analyze")
async def run_openclaw_analysis(req: OpenClawAnalyzeRequest):
    analytics = await get_instagram_analytics(
        refresh=False,
        handle=req.handle,
        platform=req.platform or "instagram",
    )
    profile = analytics["profile"]
    posts = analytics["posts"]
    analysis = analytics["analysis"]
    brief = analysis["openclaw_brief"]
    us_activity = analysis["us_audience_activity"]

    prompt_text = (req.prompt or "").strip() or (
        "Analyze my top-performing videos by Views and Engagement Rate and recommend 3 new Reels."
    )
    gw_url = (req.gateway_url or "http://localhost:18789/v1/chat/completions").strip()

    if gw_url.startswith("http"):
        try:
            headers = {"Content-Type": "application/json"}
            if req.api_key:
                headers["Authorization"] = f"Bearer {req.api_key.strip()}"
            payload = {
                "model": "openclaw-agent",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are an OpenClaw Instagram Growth & Video Analyst Agent connected to SocialAssist. "
                            "Use the creator's live video summaries and US scroll window benchmarks below:\n\n"
                            + brief
                        ),
                    },
                    {"role": "user", "content": prompt_text},
                ],
                "temperature": 0.4,
            }
            async with httpx.AsyncClient(timeout=4.5) as client:
                resp = await client.post(gw_url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    reply = (
                        data.get("choices", [{}])[0].get("message", {}).get("content")
                        or data.get("reply")
                        or data.get("output")
                    )
                    if reply:
                        return {
                            "status": "connected_openclaw_gateway",
                            "gateway_url": gw_url,
                            "agent_response": reply,
                            "brief_used": brief,
                        }
        except Exception:
            pass

    agent_output = generate_openclaw_agent_analysis(profile, posts, us_activity, prompt_text)
    return {
        "status": "builtin_openclaw_engine",
        "gateway_url": gw_url,
        "agent_response": agent_output,
        "brief_used": brief,
    }


# ---------------------------------------------------------------------------
# API Endpoints: Multi-Platform Content Planning Calendar & Cross-Publisher
# ---------------------------------------------------------------------------

SCHEDULED_POSTS_PATH = DATA_DIR / "scheduled_posts.json"


class ScheduledPostPayload(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = ""
    caption: str = ""
    captions: Dict[str, str] = {}
    format: str = "video"  # 'video' | 'carousel' | 'image' | 'text'
    platforms: List[str] = ["instagram"]
    media_urls: List[str] = []
    scheduled_date: str = ""
    scheduled_time: str = "18:00"
    status: str = "scheduled"  # 'draft' | 'scheduled' | 'queued' | 'published' | 'failed'
    first_comment: Optional[str] = ""
    auto_dm_keyword: Optional[str] = ""
    auto_dm_url: Optional[str] = ""


class PublishDispatchRequest(BaseModel):
    post: Dict[str, Any]
    platform_tokens: Dict[str, Dict[str, Any]] = {}


@app.get("/api/planner/posts")
async def list_scheduled_posts():
    posts = load_json(SCHEDULED_POSTS_PATH, [])
    return {"posts": posts}


@app.post("/api/planner/posts")
async def save_scheduled_post(req: ScheduledPostPayload):
    posts = load_json(SCHEDULED_POSTS_PATH, [])
    now_iso = datetime.now(timezone.utc).isoformat()
    post_id = req.id or f"post-{int(datetime.now().timestamp() * 1000)}"
    record = {
        "id": post_id,
        "title": req.title or (req.caption.splitlines()[0][:64] if req.caption else "Untitled Post"),
        "caption": req.caption,
        "captions": req.captions,
        "format": req.format,
        "platforms": req.platforms,
        "media_urls": req.media_urls,
        "scheduled_date": req.scheduled_date,
        "scheduled_time": req.scheduled_time,
        "status": req.status,
        "first_comment": req.first_comment or "",
        "auto_dm_keyword": req.auto_dm_keyword or "",
        "auto_dm_url": req.auto_dm_url or "",
        "updated_at": now_iso,
    }
    existing_idx = next((i for i, p in enumerate(posts) if p.get("id") == post_id), -1)
    if existing_idx >= 0:
        record["created_at"] = posts[existing_idx].get("created_at", now_iso)
        posts[existing_idx] = record
    else:
        record["created_at"] = now_iso
        posts.insert(0, record)
    save_json(SCHEDULED_POSTS_PATH, posts)
    return record


@app.delete("/api/planner/posts/{post_id}")
async def delete_scheduled_post(post_id: str):
    posts = load_json(SCHEDULED_POSTS_PATH, [])
    updated = [p for p in posts if p.get("id") != post_id]
    save_json(SCHEDULED_POSTS_PATH, updated)
    return {"deleted": post_id}


async def _dispatch_single_platform(
    platform_id: str,
    post: Dict[str, Any],
    token_cfg: Dict[str, Any],
    fallback_ig_cfg: Dict[str, Any],
) -> Dict[str, Any]:
    key = platform_id.lower().strip()
    token = (token_cfg.get("access_token") or "").strip()
    account_id = (token_cfg.get("account_id") or "").strip()
    if key == "instagram" and not token:
        token = (fallback_ig_cfg.get("access_token") or "").strip()
        account_id = account_id or (fallback_ig_cfg.get("account_id") or "").strip()

    captions_map = post.get("captions") or {}
    caption = captions_map.get(key) or post.get("caption") or ""
    public_urls = [
        u for u in (post.get("media_urls") or []) if isinstance(u, str) and u.startswith(("http://", "https://"))
    ]
    fmt = post.get("format", "video")

    if not token:
        return {
            "platform": key,
            "mode": "queued_preview",
            "status": "queued",
            "message": f"Queued in Safe Preview Mode (connect {key.title()} API token for live auto-push).",
        }

    async with httpx.AsyncClient(timeout=25.0) as client:
        if key == "instagram":
            if not public_urls:
                return {
                    "platform": "instagram",
                    "mode": "queued_preview",
                    "status": "queued",
                    "message": "Instagram token verified — add a public https:// media URL for Graph container pull.",
                }
            api_base = "https://graph.instagram.com/v21.0"
            if not account_id:
                me_r = await client.get(f"{api_base}/me", params={"fields": "id,user_id", "access_token": token})
                if me_r.status_code == 200:
                    me_d = me_r.json()
                    account_id = me_d.get("user_id") or me_d.get("id") or ""
            if not account_id:
                return {
                    "platform": "instagram",
                    "mode": "live_error",
                    "status": "failed",
                    "message": "Could not resolve Instagram Account ID from token.",
                }

            if fmt == "carousel" and len(public_urls) > 1:
                child_ids: List[str] = []
                for url in public_urls[:10]:
                    is_vid = url.lower().split("?")[0].endswith((".mp4", ".mov", ".m4v"))
                    c_payload = (
                        {"media_type": "VIDEO", "video_url": url, "is_carousel_item": True, "access_token": token}
                        if is_vid
                        else {"image_url": url, "is_carousel_item": True, "access_token": token}
                    )
                    cr = await client.post(f"{api_base}/{account_id}/media", json=c_payload)
                    cd = cr.json()
                    if cr.status_code != 200 or not cd.get("id"):
                        return {
                            "platform": "instagram",
                            "mode": "live_error",
                            "status": "failed",
                            "message": (cd.get("error") or {}).get("message", "Carousel item container failed."),
                        }
                    child_ids.append(cd["id"])
                pr = await client.post(
                    f"{api_base}/{account_id}/media",
                    json={
                        "media_type": "CAROUSEL",
                        "children": ",".join(child_ids),
                        "caption": caption,
                        "access_token": token,
                    },
                )
                pd = pr.json()
                creation_id = pd.get("id")
            else:
                first_url = public_urls[0]
                is_vid = fmt == "video" or first_url.lower().split("?")[0].endswith((".mp4", ".mov", ".m4v"))
                c_payload = (
                    {
                        "media_type": "REELS",
                        "video_url": first_url,
                        "caption": caption,
                        "share_to_feed": True,
                        "access_token": token,
                    }
                    if is_vid
                    else {"image_url": first_url, "caption": caption, "access_token": token}
                )
                cr = await client.post(f"{api_base}/{account_id}/media", json=c_payload)
                cd = cr.json()
                creation_id = cd.get("id")
                if not creation_id:
                    return {
                        "platform": "instagram",
                        "mode": "live_error",
                        "status": "failed",
                        "message": (cd.get("error") or {}).get("message", "Instagram container creation failed."),
                    }

            pub_r = await client.post(
                f"{api_base}/{account_id}/media_publish",
                json={"creation_id": creation_id, "access_token": token},
            )
            pub_d = pub_r.json()
            if pub_r.status_code == 200 and pub_d.get("id"):
                return {
                    "platform": "instagram",
                    "mode": "live_published",
                    "status": "published",
                    "external_id": pub_d["id"],
                    "message": f"Published live to Instagram (ID: {pub_d['id']})!",
                }
            return {
                "platform": "instagram",
                "mode": "live_error",
                "status": "failed",
                "message": (pub_d.get("error") or {}).get("message", "Instagram media_publish failed."),
            }

        if key == "x":
            xr = await client.post(
                "https://api.x.com/2/tweets",
                headers={"Authorization": f"Bearer {token}"},
                json={"text": caption[:280]},
            )
            xd = xr.json() if xr.headers.get("content-type", "").startswith("application/json") else {}
            if xr.status_code in (200, 201) and (xd.get("data") or {}).get("id"):
                tid = xd["data"]["id"]
                return {
                    "platform": "x",
                    "mode": "live_published",
                    "status": "published",
                    "external_id": tid,
                    "message": f"Published live on X (Tweet ID: {tid})!",
                }
            return {
                "platform": "x",
                "mode": "live_error",
                "status": "failed",
                "message": xd.get("detail") or "X API rejected tweet.",
            }

        if key == "threads":
            first_url = public_urls[0] if public_urls else ""
            is_vid = bool(first_url) and (fmt == "video" or first_url.lower().endswith((".mp4", ".mov")))
            t_payload = (
                {"media_type": "VIDEO", "video_url": first_url, "text": caption[:500], "access_token": token}
                if is_vid
                else {"media_type": "IMAGE", "image_url": first_url, "text": caption[:500], "access_token": token}
                if first_url
                else {"media_type": "TEXT", "text": caption[:500], "access_token": token}
            )
            tr = await client.post("https://graph.threads.net/v1.0/me/threads", json=t_payload)
            td = tr.json()
            if tr.status_code == 200 and td.get("id"):
                pr = await client.post(
                    "https://graph.threads.net/v1.0/me/threads_publish",
                    json={"creation_id": td["id"], "access_token": token},
                )
                pd = pr.json()
                if pr.status_code == 200 and pd.get("id"):
                    return {
                        "platform": "threads",
                        "mode": "live_published",
                        "status": "published",
                        "external_id": pd["id"],
                        "message": f"Published live to Threads (ID: {pd['id']})!",
                    }
            return {
                "platform": "threads",
                "mode": "live_error",
                "status": "failed",
                "message": (td.get("error") or {}).get("message", "Threads publish failed."),
            }

        return {
            "platform": key,
            "mode": "queued_preview",
            "status": "queued",
            "message": f"{key.title()} token saved — queued in Planner Studio.",
        }


@app.post("/api/publish")
async def dispatch_multiplatform_publish(req: PublishDispatchRequest):
    cfg = get_config()
    platforms = req.post.get("platforms") or []
    if not platforms:
        raise HTTPException(status_code=400, detail="Select at least one platform.")

    results = []
    for p in platforms:
        res = await _dispatch_single_platform(
            str(p),
            req.post,
            (req.platform_tokens or {}).get(str(p).lower(), {}),
            cfg,
        )
        results.append(res)

    any_live = any(r["mode"] == "live_published" for r in results)
    all_failed = all(r["mode"] == "live_error" for r in results)
    return {
        "ok": True,
        "dispatched_at": datetime.now(timezone.utc).isoformat(),
        "overall_status": "failed" if all_failed else ("published" if any_live else "queued"),
        "results": results,
    }
