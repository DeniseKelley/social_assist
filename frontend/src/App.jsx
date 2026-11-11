import React, { useState, useEffect } from 'react';
import {
  Instagram,
  MessageSquare,
  BarChart3,
  Sparkles,
  Plus,
  Send,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Zap,
  KeyRound,
  Trash2,
  Play,
  ArrowUpRight,
  Copy,
  Check,
  ShieldCheck,
  TrendingUp,
  Bookmark,
  Share2,
  Eye,
  Heart,
  MessageCircle,
  Sliders,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('automations'); // 'automations' | 'analytics' | 'strategy' | 'connect'
  const [connection, setConnection] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);

  // Connect form state
  const [handleInput, setHandleInput] = useState('techfairyanna');
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [connectStatusMsg, setConnectStatusMsg] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // New Automation Modal / Drawer state
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [newFlow, setNewFlow] = useState({
    name: '',
    trigger_type: 'comment_keyword',
    keywords: 'LINK, GUIDE',
    public_comment_reply: 'Just sent it to your DMs! Check your message requests ✨🧚‍♀️',
    dm_message: 'Hey! 👋 Thanks for commenting! Tap the button below to grab the resource:',
    dm_button_text: 'Open Resource ✨',
    dm_button_url: 'https://labfae.com',
  });

  // Live Simulator state
  const [simType, setSimType] = useState('comment');
  const [simUser, setSimUser] = useState('sarah_builds');
  const [simText, setSimText] = useState('Wait this is awesome!! Can you send me the LINK please?');
  const [simResult, setSimResult] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAll = async () => {
    try {
      const [connRes, autoRes, anaRes] = await Promise.all([
        fetch('/api/connection').then((r) => r.json()),
        fetch('/api/automations').then((r) => r.json()),
        fetch('/api/analytics').then((r) => r.json()),
      ]);
      setConnection(connRes);
      setHandleInput(connRes.instagram_handle || 'techfairyanna');
      setAppIdInput(connRes.app_id || '');
      setAutomations(autoRes.automations || []);
      setLogs(autoRes.recent_logs || []);
      setAnalyticsData(anaRes);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'IG_OAUTH_SUCCESS') {
        showToast('Connected @techfairyanna via Instagram OAuth!');
        fetchAll();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleConnectSubmit = async (e) => {
    if (e) e.preventDefault();
    setSyncing(true);
    setConnectStatusMsg(null);
    try {
      const res = await fetch('/api/connection/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instagram_handle: handleInput,
          access_token: tokenInput || undefined,
          app_id: appIdInput || undefined,
          app_secret: appSecretInput || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to connect');
      }
      setConnectStatusMsg({ type: 'success', text: data.message });
      showToast(data.message);
      setTokenInput('');
      await fetchAll();
    } catch (err) {
      setConnectStatusMsg({ type: 'error', text: err.message });
      showToast(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleOAuthPopup = () => {
    if (!connection?.oauth_login_url) {
      showToast('Save your Meta App ID & Secret first to enable the 1-Click OAuth popup!', 'error');
      return;
    }
    window.open(connection.oauth_login_url, 'ig_oauth', 'width=620,height=720');
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    const keywordsList = newFlow.keywords
      .split(',')
      .map((k) => k.trim().toUpperCase())
      .filter(Boolean);
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newFlow,
        keywords: keywordsList,
        active: true,
      }),
    });
    if (res.ok) {
      showToast(`Created automation "${newFlow.name}"!`);
      setShowNewFlow(false);
      await fetchAll();
    }
  };

  const handleToggleFlow = async (id) => {
    await fetch(`/api/automations/${id}/toggle`, { method: 'PATCH' });
    await fetchAll();
  };

  const handleDeleteFlow = async (id) => {
    await fetch(`/api/automations/${id}`, { method: 'DELETE' });
    showToast('Automation deleted');
    await fetchAll();
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    const res = await fetch('/api/automations/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: simType,
        sender_username: simUser,
        text: simText,
      }),
    });
    const data = await res.json();
    setSimResult(data);
    await fetchAll();
  };

  const handleRefreshAnalytics = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/analytics?refresh=true');
      const data = await res.json();
      setAnalyticsData(data);
      showToast('Refreshed Instagram analytics & strategy insights!');
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyStrategyKeyword = (keyword, title) => {
    setNewFlow({
      name: `${title.slice(0, 36)}...`,
      trigger_type: keyword === '🔥' ? 'story_reply' : 'comment_keyword',
      keywords: keyword,
      public_comment_reply:
        keyword === '🔥'
          ? ''
          : `Sent it straight to your DMs! Check your message requests ✨🧚‍♀️`,
      dm_message: `Hey! 👋 Thanks for engaging with @techfairyanna! Here is the ${keyword} resource from my post:`,
      dm_button_text: `Get ${keyword} Resource ✨`,
      dm_button_url: 'https://labfae.com',
    });
    setActiveTab('automations');
    setShowNewFlow(true);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-purple-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg font-medium">Loading SocialAssist Studio for @techfairyanna...</span>
        </div>
      </div>
    );
  }

  const profile = analyticsData?.profile || {
    username: 'techfairyanna',
    name: 'Tech Fairy Anna ✨',
    followers_count: 14820,
    media_count: 94,
  };
  const summary = analyticsData?.analysis?.summary || {};
  const strategies = analyticsData?.analysis?.strategies || [];
  const contentIdeas = analyticsData?.analysis?.content_ideas || [];
  const posts = analyticsData?.posts || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-700 text-rose-200'
              : 'bg-purple-950/90 border-purple-600 text-purple-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  SocialAssist
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
                  @{profile.username || 'techfairyanna'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ManyChat-Style DM Automation & Instagram Strategy Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('automations')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === 'automations'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>DM Automations</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>IG Statistics</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === 'strategy'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Strategy</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                activeTab === 'connect'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Connect IG</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  connection?.has_access_token ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Banner showing quick status + 1-click jump to Connect Instagram */}
        {!connection?.has_access_token && activeTab !== 'connect' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-pink-950/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Workspace pre-loaded for @{profile.username} — Ready to link live Instagram API
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  You don&apos;t need to look up Account IDs or API endpoints manually! Use the built-in{' '}
                  <span className="text-purple-300 font-medium">Connect IG</span> wizard whenever you&apos;re ready to go live.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('connect')}
              className="shrink-0 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/25 transition"
            >
              <span>Open Connect Wizard</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================
            TAB 1: MANYCHAT-STYLE AUTOMATED DM STUDIO
        ============================================================ */}
        {activeTab === 'automations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Automation Flows List & Builder */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>Automated DM Flows</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                      {automations.filter((a) => a.active).length} Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatically reply to comments & send DMs with links when someone comments or messages a keyword.
                  </p>
                </div>
                <button
                  onClick={() => setShowNewFlow(!showNewFlow)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Automation</span>
                </button>
              </div>

              {/* Create New Automation Card */}
              {showNewFlow && (
                <form
                  onSubmit={handleCreateFlow}
                  className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="font-semibold text-sm text-purple-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Create ManyChat-Style Automation Flow</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowNewFlow(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Flow Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Send AI Workflow Guide"
                        value={newFlow.name}
                        onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">When Trigger Happens</label>
                      <select
                        value={newFlow.trigger_type}
                        onChange={(e) => setNewFlow({ ...newFlow, trigger_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="comment_keyword">User comments on a Post / Reel</option>
                        <option value="story_reply">User replies to your Story</option>
                        <option value="dm_keyword">User sends a Direct Message (DM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Trigger Keywords (comma-separated, case-insensitive)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="LINK, CODE, AI, PROMPT"
                      value={newFlow.keywords}
                      onChange={(e) => setNewFlow({ ...newFlow, keywords: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-purple-300 font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  {newFlow.trigger_type === 'comment_keyword' && (
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        Step 1: Public Comment Auto-Reply (boosts Reel engagement!)
                      </label>
                      <input
                        type="text"
                        placeholder="Just sent the link to your DMs! ✨"
                        value={newFlow.public_comment_reply}
                        onChange={(e) =>
                          setNewFlow({ ...newFlow, public_comment_reply: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Step 2: Private Automated DM Message
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newFlow.dm_message}
                      onChange={(e) => setNewFlow({ ...newFlow, dm_message: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        CTA Button Label (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Open Guide ✨"
                        value={newFlow.dm_button_text}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_text: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        CTA Button Destination URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://labfae.com"
                        value={newFlow.dm_button_url}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                    >
                      Save & Activate Automation
                    </button>
                  </div>
                </form>
              )}

              {/* Active Automation Flow Cards */}
              <div className="space-y-3">
                {automations.map((flow) => (
                  <div
                    key={flow.id}
                    className={`p-4 rounded-2xl border transition ${
                      flow.active
                        ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40'
                        : 'bg-slate-900/40 border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              flow.trigger_type === 'comment_keyword'
                                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                : flow.trigger_type === 'story_reply'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {flow.trigger_type === 'comment_keyword'
                              ? 'Reel / Post Comment → DM'
                              : flow.trigger_type === 'story_reply'
                              ? 'Story Reply → DM'
                              : 'Direct Message Keyword'}
                          </span>
                          <h3 className="font-semibold text-sm text-white">{flow.name}</h3>
                        </div>

                        {/* Keywords */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-xs text-slate-400">Triggers on:</span>
                          {flow.keywords.map((kw) => (
                            <button
                              key={kw}
                              onClick={() => {
                                setSimType(
                                  flow.trigger_type === 'comment_keyword'
                                    ? 'comment'
                                    : flow.trigger_type === 'story_reply'
                                    ? 'story_reply'
                                    : 'dm'
                                );
                                setSimText(`Hey @techfairyanna! Can you send me ${kw} please? ✨`);
                              }}
                              title="Click to test this keyword in the simulator"
                              className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition"
                            >
                              &quot;{kw}&quot;
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleFlow(flow.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                            flow.active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {flow.active ? '● Active' : 'Paused'}
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete flow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Preview of Public Reply + Private DM */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {flow.public_comment_reply ? (
                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <div className="text-[11px] text-slate-400 font-medium mb-1">
                            💬 Public Comment Auto-Reply:
                          </div>
                          <p className="text-slate-200">{flow.public_comment_reply}</p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/50 flex items-center text-slate-500">
                          Direct Private DM (No public comment reply)
                        </div>
                      )}

                      <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-500/20">
                        <div className="text-[11px] text-purple-300 font-medium mb-1">
                          ✉️ Automated Private DM:
                        </div>
                        <p className="text-slate-200 line-clamp-2">{flow.dm_message}</p>
                        {flow.dm_button_text && (
                          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600/30 border border-purple-500/40 text-purple-200 text-[11px] font-medium">
                            <span>{flow.dm_button_text}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flow Conversion Stats */}
                    <div className="mt-3 flex items-center gap-5 text-xs text-slate-400">
                      <span>
                        Triggered: <strong className="text-white">{flow.stats?.triggered || 0}</strong>
                      </span>
                      <span>
                        DMs Sent: <strong className="text-emerald-400">{flow.stats?.dms_sent || 0}</strong>
                      </span>
                      <span>
                        Link Clicks: <strong className="text-purple-400">{flow.stats?.link_clicks || 0}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Interactive ManyChat Phone Simulator & Live Activity Log */}
            <div className="lg:col-span-5 space-y-5">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-purple-400" />
                      <span>Interactive Comment-to-DM Simulator</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Test your keyword triggers right now—click any keyword on the left or type a comment below!
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Event Type</label>
                      <select
                        value={simType}
                        onChange={(e) => setSimType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      >
                        <option value="comment">Comment on Reel/Post</option>
                        <option value="story_reply">Story Reply</option>
                        <option value="dm">Incoming DM</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Follower Username</label>
                      <input
                        type="text"
                        value={simUser}
                        onChange={(e) => setSimUser(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Follower&apos;s Comment or Message
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Test Trigger</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Simulated Instagram Mobile Preview */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs text-slate-400">
                    <span>📱 Instagram DM Preview (@{profile.username})</span>
                    {simResult?.matched && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        ✓ Matched keyword &quot;{simResult.log.matched_keyword}&quot;
                      </span>
                    )}
                  </div>

                  {!simResult ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Click <strong>Test Trigger</strong> above to preview the instant comment reply & automated DM!
                    </div>
                  ) : !simResult.matched ? (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200">
                      {simResult.message}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      {/* Incoming comment/message */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[11px] font-bold text-slate-300 shrink-0">
                          {simResult.log.sender_username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="p-2.5 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-200">
                          <div className="text-[10px] text-slate-400 mb-0.5">
                            @{simResult.log.sender_username} ({simResult.log.event_type})
                          </div>
                          {simResult.log.incoming_text}
                        </div>
                      </div>

                      {/* Public comment reply if present */}
                      {simResult.log.public_comment_reply && (
                        <div className="ml-6 p-2.5 rounded-xl bg-slate-900/60 border border-pink-500/30 text-slate-200">
                          <div className="text-[10px] text-pink-300 font-medium mb-0.5">
                            ↪ Public Comment Reply by @{profile.username}:
                          </div>
                          {simResult.log.public_comment_reply}
                        </div>
                      )}

                      {/* Automated Private DM Bubble */}
                      <div className="flex items-start justify-end gap-2.5 pt-1">
                        <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-none bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg">
                          <div className="text-[10px] text-purple-100/90 font-medium mb-1">
                            ✨ Automated DM from @{profile.username}
                          </div>
                          <p className="leading-relaxed">{simResult.log.dm_sent}</p>
                          {simResult.log.dm_button_text && (
                            <a
                              href={simResult.log.dm_button_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2.5 w-full py-2 px-3 rounded-xl bg-white text-slate-900 font-semibold text-center flex items-center justify-center gap-1.5 hover:bg-slate-100 transition"
                            >
                              <span>{simResult.log.dm_button_text}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Automated DM Log */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white">Recent Automation Activity</h3>
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No triggers logged yet. Run a test in the simulator above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {logs.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-purple-300">
                            @{item.sender_username}
                          </span>{' '}
                          <span className="text-slate-400">said</span>{' '}
                          <span className="text-slate-200">&quot;{item.incoming_text}&quot;</span>
                        </div>
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          DM Sent ✓
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 2: INSTAGRAM STATISTICS & POST ANALYTICS
        ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>Instagram Statistics — @{profile.username}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                    {analyticsData?.source === 'instagram_graph_api'
                      ? 'Live Graph API'
                      : 'Creator Dataset'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Post performance, Reels engagement velocity, save-to-view ratios, and comment-to-DM conversions.
                </p>
              </div>
              <button
                onClick={handleRefreshAnalytics}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-2 self-start transition"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-purple-400' : ''}`} />
                <span>Sync Latest Stats</span>
              </button>
            </div>

            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Followers</span>
                  <Instagram className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-xl font-bold text-white mt-1.5">
                  {(profile.followers_count || 14820).toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1">+4.8% this month</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Total Views</span>
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-bold text-white mt-1.5">
                  {(summary.total_views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Across recent posts</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Avg Engagement</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1.5">
                  {summary.avg_engagement_rate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Likes + Saves + Shares</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Total Saves</span>
                  <Bookmark className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-bold text-white mt-1.5">
                  {(summary.total_saves || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-300 mt-1">High algorithm signal</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Comment Lift</span>
                  <MessageCircle className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-xl font-bold text-pink-400 mt-1.5">
                  {summary.comment_lift_multiplier}x
                </div>
                <div className="text-[11px] text-slate-400 mt-1">With DM Keyword CTA</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Auto-DMs Sent</span>
                  <Send className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-blue-400 mt-1.5">
                  {(summary.estimated_dm_conversions || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">From Reel comments</div>
              </div>
            </div>

            {/* Content Format Performance Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analyticsData?.analysis?.format_breakdown || {}).map(
                ([fmt, stats]) => (
                  <div
                    key={fmt}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {fmt}S ({stats.count})
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">
                        {stats.avg_engagement_rate}% Avg ER
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                      <div>
                        <div className="text-[11px] text-slate-400">Avg Views</div>
                        <div className="text-sm font-bold text-white">
                          {stats.avg_views.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Avg Comments</div>
                        <div className="text-sm font-bold text-pink-300">{stats.avg_comments}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Avg Saves</div>
                        <div className="text-sm font-bold text-amber-300">{stats.avg_saves}</div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Post-by-Post Analytics Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">
                  Recent Posts & Comment-to-DM Breakdown
                </h3>
                <span className="text-xs text-slate-400">
                  Notice how posts with a single-word keyword CTA generate 4x+ more comments & views
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/50">
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Post Caption & Hook</th>
                      <th className="py-3 px-4">Keyword CTA</th>
                      <th className="py-3 px-4 text-right">Views</th>
                      <th className="py-3 px-4 text-right">Likes</th>
                      <th className="py-3 px-4 text-right">Comments</th>
                      <th className="py-3 px-4 text-right">Saves</th>
                      <th className="py-3 px-4 text-right">Auto-DMs</th>
                      <th className="py-3 px-4 text-right">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              post.type === 'REEL'
                                ? 'bg-pink-500/15 text-pink-300'
                                : post.type === 'CAROUSEL'
                                ? 'bg-amber-500/15 text-amber-300'
                                : 'bg-blue-500/15 text-blue-300'
                            }`}
                          >
                            {post.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <p className="text-slate-200 line-clamp-2">{post.caption}</p>
                        </td>
                        <td className="py-3 px-4">
                          {post.best_keyword && !post.best_keyword.includes('None') ? (
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              &quot;{post.best_keyword}&quot;
                            </span>
                          ) : (
                            <span className="text-slate-500">No CTA</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-white">
                          {(post.views || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-300">
                          {(post.likes || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-pink-300">
                          {(post.comments || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-amber-300">
                          {(post.saves || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-purple-300">
                          {post.dm_triggers ?? intOrZero(post.comments * 0.7)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {post.engagement_rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: AI STRATEGY & CONTENT RECOMMENDATIONS
        ============================================================ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>Data-Driven Growth & ManyChat Strategy for @{profile.username}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Actionable recommendations computed from your post metrics, save ratios, and comment-to-DM conversion velocity.
              </p>
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        {strat.category}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-400">
                        ⚡ {strat.impact}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{strat.title}</h3>
                    <p className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                      📊 <strong>Data Finding:</strong> {strat.finding}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-slate-200">Action Plan:</div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {strat.action_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Recommended Trigger:{' '}
                      <strong className="text-purple-300 font-mono">
                        &quot;{strat.recommended_keyword}&quot;
                      </strong>
                    </span>
                    <button
                      onClick={() =>
                        handleApplyStrategyKeyword(strat.recommended_keyword, strat.title)
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Build This DM Flow</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Next High-Converting Reel & Carousel Ideas */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="font-bold text-base text-white">
                  Next 3 High-Converting Post Ideas + Paired ManyChat Triggers
                </h3>
                <p className="text-xs text-slate-400">
                  Designed specifically for @techfairyanna&apos;s AI, coding, and creative tech audience:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contentIdeas.map((idea, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 font-semibold">
                          {idea.format}
                        </span>
                        <span className="text-emerald-400 font-semibold">
                          Est. ER: {idea.predicted_er}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{idea.title}</h4>
                      <p className="text-xs text-slate-400 italic">
                        <strong>Hook:</strong> &quot;{idea.hook}&quot;
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        CTA Keyword:{' '}
                        <strong className="text-purple-300 font-mono">{idea.cta_keyword}</strong>
                      </span>
                      <button
                        onClick={() => handleApplyStrategyKeyword(idea.cta_keyword, idea.title)}
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                      >
                        + Create Trigger
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: BUILT-IN INSTAGRAM CONNECTION WIZARD
        ============================================================ */}
        {activeTab === 'connect' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-purple-400" />
                    <span>Connect @techfairyanna to SocialAssist</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    You don&apos;t need to manually search for your Instagram Account ID, Graph node IDs, or API endpoints!
                    Our backend automatically discovers everything as soon as you log in with OAuth or paste a token.
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    connection?.has_access_token
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  }`}
                >
                  {connection?.has_access_token
                    ? '✓ Official Graph API Connected'
                    : 'Workspace Active (@techfairyanna)'}
                </span>
              </div>

              {connectStatusMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium border ${
                    connectStatusMsg.type === 'error'
                      ? 'bg-rose-950/50 border-rose-700 text-rose-200'
                      : 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
                  }`}
                >
                  {connectStatusMsg.text}
                </div>
              )}

              {/* Connection Form */}
              <form onSubmit={handleConnectSubmit} className="space-y-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    1. Your Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="techfairyanna"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Fastest Method: Paste Access Token Only */}
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-purple-300">
                      Option A (Fastest): Paste Your Instagram Access Token
                    </label>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                    >
                      <span>Open Meta Developer Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400">
                    Just paste your token below—SocialAssist will automatically query Instagram to fetch your Account ID,
                    profile picture, follower count, and recent Reels!
                  </p>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="IGQWR... or EAA... (Paste token here)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Option B: 1-Click OAuth Login Popup */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200">
                      Option B: Enable the &quot;Login with Instagram&quot; OAuth Button
                    </label>
                    <span className="text-[11px] text-slate-400">Auto-refreshes 60-day tokens</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Instagram App ID
                      </label>
                      <input
                        type="text"
                        value={appIdInput}
                        onChange={(e) => setAppIdInput(e.target.value)}
                        placeholder="e.g. 123456789012345"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Instagram App Secret
                      </label>
                      <input
                        type="password"
                        value={appSecretInput}
                        onChange={(e) => setAppSecretInput(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400">
                      OAuth Redirect URI:{' '}
                      <code className="text-purple-300">
                        http://localhost:8000/api/auth/instagram/callback
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleOAuthPopup}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Login with Instagram Popup</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={syncing}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition"
                  >
                    {syncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Save & Auto-Sync @techfairyanna</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Step-by-Step Visual Cheat Sheet for Meta Portal */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="font-bold text-sm text-white">
                Where to Click on Meta (Takes 2 Minutes — Only Needed Once)
              </h3>
              <p className="text-xs text-slate-400">
                Why does Meta require this? Because Instagram blocks unofficial bots from sending automated DMs to protect creators.
                Apps like ManyChat registered a Meta Developer App so you can log in through them. Since <strong>SocialAssist is your own custom app</strong>, you register it once under your own account:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-400">Step 1: Create App</div>
                  <p className="text-slate-300">
                    Open{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-300 underline"
                    >
                      developers.facebook.com/apps
                    </a>{' '}
                    → Click <strong>Create App</strong> → Choose <strong>Other</strong> →{' '}
                    <strong>Business</strong> → Name it <code className="text-pink-300">SocialAssist</code>.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-400">Step 2: Add @techfairyanna</div>
                  <p className="text-slate-300">
                    Click <strong>Instagram → Set Up</strong>. In the left sidebar click{' '}
                    <strong>API setup with Instagram login</strong> → Click{' '}
                    <strong>Add account</strong> and log in as <strong>@techfairyanna</strong>.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-purple-400">Step 3: Click &quot;Generate Token&quot;</div>
                  <p className="text-slate-300">
                    Click <strong>Generate token</strong> next to <code className="text-pink-300">techfairyanna</code>, copy it, and paste it into <strong>Option A</strong> above. We do the rest automatically!
                  </p>
                </div>
              </div>

              {/* Copyable Webhook Values */}
              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Webhook Verify Token:</span>
                  <code className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-purple-300 font-mono">
                    {connection?.webhook_verify_token || 'social_assist_verify_token'}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        connection?.webhook_verify_token || 'social_assist_verify_token',
                        'verify_token'
                      )
                    }
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copiedField === 'verify_token' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="text-slate-400">
                  Webhook Endpoint:{' '}
                  <code className="text-slate-200 font-mono">/api/webhooks/instagram</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function intOrZero(val) {
  return Math.round(val || 0);
}
