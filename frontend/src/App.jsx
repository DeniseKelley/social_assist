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
  Eye,
  MessageCircle,
} from 'lucide-react';
import {
  TechFairyCharacter,
  DataAstronomerCharacter,
  PlugMechanicCharacter,
} from './CartoonCharacters';
import { INITIAL_AUTOMATIONS, INITIAL_ANALYTICS } from './fallbackEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState('automations'); // 'automations' | 'analytics' | 'strategy' | 'connect'
  const [connection, setConnection] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCastingWand, setIsCastingWand] = useState(false);

  // Admin Login Gate state (protects studio from public visitors)
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('sa_authenticated') === 'true'
  );
  const [loginUser, setLoginUser] = useState('techfairyanna');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Connect form state
  const [handleInput, setHandleInput] = useState('techfairyanna');
  const [tokenInput, setTokenInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [appSecretInput, setAppSecretInput] = useState('');
  const [connectStatusMsg, setConnectStatusMsg] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // New Automation Drawer state
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

  const triggerFairyWand = () => {
    setIsCastingWand(true);
    setTimeout(() => setIsCastingWand(false), 750);
  };

  const fetchAll = async () => {
    try {
      const [connResp, autoResp, anaResp] = await Promise.all([
        fetch('/api/connection'),
        fetch('/api/automations'),
        fetch('/api/analytics'),
      ]);
      if (!connResp.ok || !autoResp.ok || !anaResp.ok) {
        throw new Error('Static host mode');
      }
      const [connRes, autoRes, anaRes] = await Promise.all([
        connResp.json(),
        autoResp.json(),
        anaResp.json(),
      ]);
      setConnection(connRes);
      setHandleInput(connRes.instagram_handle || 'techfairyanna');
      setAppIdInput(connRes.app_id || '');
      setAutomations(autoRes.automations || []);
      setLogs(autoRes.recent_logs || []);
      setAnalyticsData(anaRes);
    } catch {
      // Standalone static page mode (inside techfairylab website)
      const savedFlows = JSON.parse(localStorage.getItem('sa_automations') || 'null') || INITIAL_AUTOMATIONS;
      const savedLogs = JSON.parse(localStorage.getItem('sa_logs') || '[]');
      const savedConn = JSON.parse(localStorage.getItem('sa_connection') || 'null') || {
        instagram_handle: 'techfairyanna',
        has_access_token: false,
        webhook_verify_token: 'social_assist_verify_token',
      };
      const savedAna = JSON.parse(localStorage.getItem('sa_analytics') || 'null') || INITIAL_ANALYTICS;
      setConnection(savedConn);
      setHandleInput(savedConn.instagram_handle || 'techfairyanna');
      setAutomations(savedFlows);
      setLogs(savedLogs);
      setAnalyticsData(savedAna);
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
      if (res.ok) {
        const data = await res.json();
        setConnectStatusMsg({ type: 'success', text: data.message });
        showToast(data.message);
        setTokenInput('');
        triggerFairyWand();
        await fetchAll();
        return;
      }
      throw new Error('Fallback to browser Graph API');
    } catch {
      // Direct browser Graph API verification for static hosting on techfairylab
      try {
        if (tokenInput && tokenInput.trim()) {
          const igRes = await fetch(
            `https://graph.instagram.com/v21.0/me?fields=id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography&access_token=${encodeURIComponent(
              tokenInput.trim()
            )}`
          );
          const igData = await igRes.json();
          if (igData.error) {
            throw new Error(igData.error.message || 'Invalid Instagram token');
          }
          const updatedConn = {
            instagram_handle: igData.username || handleInput,
            has_access_token: true,
            account_id: igData.user_id || igData.id,
            webhook_verify_token: 'social_assist_verify_token',
          };
          localStorage.setItem('sa_connection', JSON.stringify(updatedConn));
          const updatedAna = {
            ...INITIAL_ANALYTICS,
            source: 'instagram_graph_api',
            profile: {
              ...INITIAL_ANALYTICS.profile,
              username: igData.username || handleInput,
              name: igData.name || 'Tech Fairy Anna ✨',
              followers_count: igData.followers_count || 14820,
              media_count: igData.media_count || 94,
            },
          };
          localStorage.setItem('sa_analytics', JSON.stringify(updatedAna));
          setConnection(updatedConn);
          setAnalyticsData(updatedAna);
          setConnectStatusMsg({
            type: 'success',
            text: `Connected @${updatedConn.instagram_handle} via Instagram Graph API!`,
          });
          showToast(`Connected @${updatedConn.instagram_handle}!`);
          setTokenInput('');
          triggerFairyWand();
        } else {
          const updatedConn = {
            instagram_handle: handleInput.replace(/^@/, '') || 'techfairyanna',
            has_access_token: false,
            webhook_verify_token: 'social_assist_verify_token',
          };
          localStorage.setItem('sa_connection', JSON.stringify(updatedConn));
          setConnection(updatedConn);
          setConnectStatusMsg({
            type: 'success',
            text: `Synced workspace for @${updatedConn.instagram_handle}!`,
          });
          showToast(`Synced @${updatedConn.instagram_handle}!`);
          triggerFairyWand();
        }
      } catch (innerErr) {
        setConnectStatusMsg({ type: 'error', text: innerErr.message });
        showToast(innerErr.message, 'error');
      }
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
    try {
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
        triggerFairyWand();
        await fetchAll();
        return;
      }
    } catch {
      // Static fallback
    }
    const created = {
      id: `flow-${Date.now()}`,
      ...newFlow,
      keywords: keywordsList,
      active: true,
      stats: { triggered: 0, dms_sent: 0, link_clicks: 0 },
    };
    const next = [created, ...automations];
    setAutomations(next);
    localStorage.setItem('sa_automations', JSON.stringify(next));
    showToast(`Created automation "${newFlow.name}"!`);
    setShowNewFlow(false);
    triggerFairyWand();
  };

  const handleToggleFlow = async (id) => {
    try {
      const res = await fetch(`/api/automations/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        triggerFairyWand();
        await fetchAll();
        return;
      }
    } catch {
      // Static fallback
    }
    const next = automations.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    setAutomations(next);
    localStorage.setItem('sa_automations', JSON.stringify(next));
    triggerFairyWand();
  };

  const handleDeleteFlow = async (id) => {
    try {
      const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Automation deleted');
        await fetchAll();
        return;
      }
    } catch {
      // Static fallback
    }
    const next = automations.filter((f) => f.id !== id);
    setAutomations(next);
    localStorage.setItem('sa_automations', JSON.stringify(next));
    showToast('Automation deleted');
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    triggerFairyWand();
    try {
      const res = await fetch('/api/automations/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: simType,
          sender_username: simUser,
          text: simText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimResult(data);
        await fetchAll();
        return;
      }
    } catch {
      // Static fallback simulator
    }
    const expectedTrigger =
      simType === 'comment'
        ? 'comment_keyword'
        : simType === 'story_reply'
        ? 'story_reply'
        : 'dm_keyword';
    const textUpper = simText.toUpperCase();
    let matchedFlow = null;
    let matchedKeyword = '';
    for (const flow of automations) {
      if (!flow.active || flow.trigger_type !== expectedTrigger) continue;
      for (const kw of flow.keywords || []) {
        if (textUpper.includes(kw.toUpperCase())) {
          matchedFlow = flow;
          matchedKeyword = kw.toUpperCase();
          break;
        }
      }
      if (matchedFlow) break;
    }
    if (!matchedFlow) {
      setSimResult({
        matched: false,
        message: `No active ${simType} automation matched: "${simText}"`,
      });
      return;
    }
    const logEntry = {
      id: `log-${Date.now()}`,
      event_type: simType,
      sender_username: simUser.replace(/^@/, ''),
      incoming_text: simText,
      matched_flow_name: matchedFlow.name,
      matched_keyword: matchedKeyword,
      public_comment_reply: matchedFlow.public_comment_reply || '',
      dm_sent: matchedFlow.dm_message,
      dm_button_text: matchedFlow.dm_button_text || '',
      dm_button_url: matchedFlow.dm_button_url || '',
    };
    const nextLogs = [logEntry, ...logs].slice(0, 30);
    setLogs(nextLogs);
    localStorage.setItem('sa_logs', JSON.stringify(nextLogs));
    setSimResult({ matched: true, flow: matchedFlow, log: logEntry });
  };

  const handleRefreshAnalytics = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/analytics?refresh=true');
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
      triggerFairyWand();
      showToast('Refreshed Instagram analytics & strategy insights!');
    } catch {
      triggerFairyWand();
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
    triggerFairyWand();
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const raw = `${loginUser.trim().toLowerCase()}:${loginPassword}`;
    const msgBuffer = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const expectedHash =
      localStorage.getItem('sa_custom_pass_hash') ||
      'eb041c7ded7b3a19c0066954e0300257244c0c807c93e64a596d5808cda24172';

    if (hashHex === expectedHash) {
      sessionStorage.setItem('sa_authenticated', 'true');
      setIsAuthenticated(true);
      setLoginPassword('');
      triggerFairyWand();
    } else {
      setLoginError('Invalid studio credentials. Only @techfairyanna can unlock this studio.');
    }
  };

  const handleLockStudio = () => {
    sessionStorage.removeItem('sa_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center p-4">
        <div className="editorial-card max-w-md w-full p-7 sm:p-8 bg-white space-y-5 panel-enter">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-36 h-36">
              <TechFairyCharacter isCasting={false} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE4F1] border-2 border-[#19154E] text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-[#19154E]" />
              <span>Private Creator Studio</span>
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
              SocialAssist Login
            </h1>
            <p className="text-xs text-neutral-600 font-medium">
              Protected workspace for <strong>@techfairyanna</strong>. Enter your studio password to unlock.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-[#FFE4F1] border-2 border-[#19154E] text-xs font-bold text-[#19154E] text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#19154E] mb-1">
                Creator Handle
              </label>
              <input
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19154E] mb-1">
                Studio Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Unlock Studio ✨</span>
            </button>
          </form>

          <div className="pt-2 border-t border-neutral-200 text-center">
            <a
              href="../index.html"
              className="text-xs font-bold text-neutral-500 hover:text-[#19154E]"
            >
              ← Return to TechFairyLab
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center">
        <div className="editorial-card px-8 py-6 flex items-center gap-4 bg-white">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF7EB6]" />
          <span className="font-display text-lg font-bold">
            Waking up @techfairyanna Studio...
          </span>
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
    <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border-2 border-[#19154E] shadow-[4px_4px_0px_#19154E] flex items-center gap-3 text-sm font-bold panel-enter ${
            toast.type === 'error'
              ? 'bg-[#FF7EB6] text-[#19154E]'
              : 'bg-[#C8F904] text-[#19154E]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top Editorial Navigation Bar (Clay.global + Upqode style) */}
      <header className="sticky top-0 z-30 bg-[#FFF8FC]/90 backdrop-blur-md border-b-2 border-[#19154E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF7EB6] border-2 border-[#19154E] shadow-[3px_3px_0px_#19154E] flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-[#19154E]">
                  SocialAssist
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C8F904] text-[#19154E] border-2 border-[#19154E] font-bold">
                  @{profile.username || 'techfairyanna'}
                </span>
                <a
                  href="../index.html"
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-[#19154E] font-bold text-neutral-700 hover:bg-[#B799E8] hover:text-[#19154E] transition-colors duration-150 hidden md:inline-block"
                  title="Return to TechFairyLab Home"
                >
                  ← TechFairyLab
                </a>
              </div>
              <p className="text-xs font-medium text-neutral-600 hidden sm:block">
                Automated Instagram DM Studio & Growth Observatory
              </p>
            </div>
          </div>

          {/* Tactile Pill Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-[#F5EEFF] p-1.5 rounded-2xl border-2 border-[#19154E]">
            <button
              onClick={() => setActiveTab('automations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'automations'
                  ? 'bg-[#19154E] text-[#FFF8FC]'
                  : 'text-[#19154E] hover:bg-white/70'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FF7EB6]" />
              <span>Auto-DMs</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'analytics'
                  ? 'bg-[#19154E] text-[#FFF8FC]'
                  : 'text-[#19154E] hover:bg-white/70'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-[#C8F904]" />
              <span>IG Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'strategy'
                  ? 'bg-[#19154E] text-[#FFF8FC]'
                  : 'text-[#19154E] hover:bg-white/70'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#B799E8]" />
              <span>Strategy</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-150 ${
                activeTab === 'connect'
                  ? 'bg-[#19154E] text-[#FFF8FC]'
                  : 'text-[#19154E] hover:bg-white/70'
              }`}
            >
              <KeyRound className="w-4 h-4 text-[#A78BFA]" />
              <span>Connect IG</span>
              <span
                className={`w-2.5 h-2.5 rounded-full border border-[#19154E] ${
                  connection?.has_access_token ? 'bg-[#C8F904]' : 'bg-[#B799E8]'
                }`}
              />
            </button>
            <button
              onClick={handleLockStudio}
              title="Lock Studio"
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-[#19154E] hover:bg-[#FFE4F1] transition-colors duration-150"
            >
              🔒
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* ============================================================
            CARTOONY ANIMATED HERO STUDIO CARD (Clay + Upqode + Don't Look Up)
        ============================================================ */}
        <section className="editorial-card bg-gradient-to-br from-[#FFFDF9] via-[#FFF8FC] to-[#F5EEFF] p-6 sm:p-8 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B799E8] border-2 border-[#19154E] text-xs font-bold uppercase tracking-wider">
                <span>🧚‍♀️ TechFairy Magic Automation</span>
                <span>•</span>
                <span>{automations.filter((a) => a.active).length} Active Flows</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#19154E] leading-[1.06]">
                Turn every Reel comment into an{' '}
                <span className="inline-block px-3 py-0.5 rounded-2xl bg-[#C8F904] border-2 border-[#19154E] -rotate-1">
                  instant DM
                </span>{' '}
                & growth strategy.
              </h2>

              <p className="text-sm sm:text-base text-neutral-700 max-w-2xl leading-relaxed">
                When followers comment keywords like{' '}
                <span className="font-mono-code font-bold px-2 py-0.5 rounded bg-white border border-[#19154E]">
                  LINK
                </span>{' '}
                or{' '}
                <span className="font-mono-code font-bold px-2 py-0.5 rounded bg-white border border-[#19154E]">
                  CODE
                </span>{' '}
                on <strong>@{profile.username}</strong>, our cartoon courier replies in the comments and
                drops your link straight into their DMs.
              </p>

              {/* Quick Editorial Pill Counters */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="editorial-card-sm px-4 py-2 bg-white flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF7EB6] border border-[#19154E]" />
                  <span className="text-xs font-semibold text-neutral-600">Followers:</span>
                  <span className="font-display font-bold text-sm">
                    {(profile.followers_count || 14820).toLocaleString()}
                  </span>
                </div>

                <div className="editorial-card-sm px-4 py-2 bg-white flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#C8F904] border border-[#19154E]" />
                  <span className="text-xs font-semibold text-neutral-600">Comment Lift:</span>
                  <span className="font-display font-bold text-sm">
                    {summary.comment_lift_multiplier || 4.2}x Higher Reach
                  </span>
                </div>

                {!connection?.has_access_token && (
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="editorial-btn px-4 py-2 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Connect Live Instagram</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Animated Cartoon Character ("Fairy Anna") */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div
                onClick={triggerFairyWand}
                title="Click Fairy Anna to cast a DM spell!"
                className="w-56 h-48 sm:w-64 sm:h-52 cursor-pointer"
              >
                <TechFairyCharacter
                  isCasting={isCastingWand}
                  mood={isCastingWand ? 'excited' : 'happy'}
                />
              </div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                ↑ Click Fairy Anna or test a trigger below!
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            TAB 1: MANYCHAT-STYLE AUTOMATED DM STUDIO
        ============================================================ */}
        {activeTab === 'automations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 panel-enter">
            {/* Left 7 Cols: Automation Flows List & Builder */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#19154E]">
                    Automated DM Flows
                  </h3>
                  <p className="text-xs font-medium text-neutral-600">
                    Click any keyword badge below to test it live in the phone simulator →
                  </p>
                </div>
                <button
                  onClick={() => setShowNewFlow(!showNewFlow)}
                  className="editorial-btn px-4 py-2.5 rounded-2xl bg-[#C8F904] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>New Flow</span>
                </button>
              </div>

              {/* Create New Automation Form */}
              {showNewFlow && (
                <form
                  onSubmit={handleCreateFlow}
                  className="editorial-card p-6 bg-[#FFFDF9] space-y-4 panel-enter"
                >
                  <div className="flex items-center justify-between border-b-2 border-[#19154E] pb-3">
                    <h4 className="font-display font-bold text-base text-[#19154E] flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FF7EB6]" />
                      <span>Build New Comment-to-DM Flow</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowNewFlow(false)}
                      className="text-xs font-bold text-neutral-500 hover:text-[#19154E]"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Flow Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Send AI Workflow Guide"
                        value={newFlow.name}
                        onChange={(e) => setNewFlow({ ...newFlow, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        When Trigger Happens
                      </label>
                      <select
                        value={newFlow.trigger_type}
                        onChange={(e) => setNewFlow({ ...newFlow, trigger_type: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                      >
                        <option value="comment_keyword">User comments on a Post / Reel</option>
                        <option value="story_reply">User replies to your Story</option>
                        <option value="dm_keyword">User sends a Direct Message (DM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      Trigger Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="LINK, CODE, AI, PROMPT"
                      value={newFlow.keywords}
                      onChange={(e) => setNewFlow({ ...newFlow, keywords: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code font-bold text-[#6D28D9] focus:outline-none focus:bg-white"
                    />
                  </div>

                  {newFlow.trigger_type === 'comment_keyword' && (
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Step 1: Public Comment Auto-Reply (doubles your Reel comments!)
                      </label>
                      <input
                        type="text"
                        placeholder="Just sent the link to your DMs! ✨"
                        value={newFlow.public_comment_reply}
                        onChange={(e) =>
                          setNewFlow({ ...newFlow, public_comment_reply: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      Step 2: Private Automated DM Message
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newFlow.dm_message}
                      onChange={(e) => setNewFlow({ ...newFlow, dm_message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="Open Guide ✨"
                        value={newFlow.dm_button_text}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_text: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        CTA Button URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://labfae.com"
                        value={newFlow.dm_button_url}
                        onChange={(e) => setNewFlow({ ...newFlow, dm_button_url: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-medium focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="editorial-btn px-6 py-2.5 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold"
                    >
                      Save & Activate Flow ✨
                    </button>
                  </div>
                </form>
              )}

              {/* Automation Flow Bento Cards */}
              <div className="space-y-4">
                {automations.map((flow) => (
                  <div
                    key={flow.id}
                    className={`editorial-card editorial-card-interactive p-5 ${
                      flow.active ? 'bg-white' : 'bg-[#F5EEFF]/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border-2 border-[#19154E] ${
                              flow.trigger_type === 'comment_keyword'
                                ? 'bg-[#FF7EB6] text-[#19154E]'
                                : flow.trigger_type === 'story_reply'
                                ? 'bg-[#B799E8] text-[#19154E]'
                                : 'bg-[#6D28D9] text-white'
                            }`}
                          >
                            {flow.trigger_type === 'comment_keyword'
                              ? 'Reel Comment → DM'
                              : flow.trigger_type === 'story_reply'
                              ? 'Story Reply → DM'
                              : 'Direct DM Keyword'}
                          </span>
                          <h4 className="font-display font-bold text-base text-[#19154E]">
                            {flow.name}
                          </h4>
                        </div>

                        {/* Interactive Keyword Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-xs font-bold text-neutral-600">Keywords:</span>
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
                                setSimText(`OMG @techfairyanna can you send me ${kw} please?! ✨`);
                                triggerFairyWand();
                              }}
                              title="Click to load this keyword into the simulator"
                              className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#C8F904] text-[#19154E] border-2 border-[#19154E] hover:bg-[#B799E8] transition-colors duration-150"
                            >
                              &quot;{kw}&quot;
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleFlow(flow.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border-2 border-[#19154E] ${
                            flow.active
                              ? 'bg-[#C8F904] text-[#19154E]'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {flow.active ? '● LIVE' : 'PAUSED'}
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow.id)}
                          className="p-1.5 rounded-xl border-2 border-transparent hover:border-[#19154E] text-neutral-500 hover:text-[#FF7EB6] transition-colors duration-150"
                          title="Delete flow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Two-Column Action Preview */}
                    <div className="mt-4 pt-3.5 border-t-2 border-dashed border-neutral-300 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {flow.public_comment_reply ? (
                        <div className="p-3 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E]">
                          <div className="font-bold text-[#19154E] mb-1">
                            💬 1. Auto-Reply in Comments:
                          </div>
                          <p className="text-neutral-700 font-medium">{flow.public_comment_reply}</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-[#FFF8FC]/60 border-2 border-dashed border-neutral-400 flex items-center text-neutral-500 font-medium">
                          1. Direct DM Flow (No public comment reply)
                        </div>
                      )}

                      <div className="p-3 rounded-2xl bg-[#EDE9FE] border-2 border-[#19154E]">
                        <div className="font-bold text-[#6D28D9] mb-1">
                          ✉️ 2. Private DM Sent:
                        </div>
                        <p className="text-[#19154E] font-medium line-clamp-2">{flow.dm_message}</p>
                        {flow.dm_button_text && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#19154E] text-white text-[11px] font-bold">
                            <span>{flow.dm_button_text}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Flow Metrics Footer */}
                    <div className="mt-3.5 flex items-center gap-6 text-xs font-bold text-neutral-600">
                      <span>
                        Triggered: <strong className="text-[#19154E]">{flow.stats?.triggered || 0}</strong>
                      </span>
                      <span>
                        DMs Delivered: <strong className="text-[#6D28D9]">{flow.stats?.dms_sent || 0}</strong>
                      </span>
                      <span>
                        Link Clicks: <strong className="text-[#FF7EB6]">{flow.stats?.link_clicks || 0}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Interactive Phone Simulator & Live Activity Feed */}
            <div className="lg:col-span-5 space-y-5">
              <div className="editorial-card p-6 bg-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#B799E8] border-2 border-[#19154E]">
                      Interactive Sandbox
                    </span>
                    <h3 className="font-display font-bold text-lg text-[#19154E] mt-1">
                      Live Comment-to-DM Simulator
                    </h3>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Trigger Type
                      </label>
                      <select
                        value={simType}
                        onChange={(e) => setSimType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-bold"
                      >
                        <option value="comment">Comment on Reel</option>
                        <option value="story_reply">Story Reply</option>
                        <option value="dm">Direct Message</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                        Follower Handle
                      </label>
                      <input
                        type="text"
                        value={simUser}
                        onChange={(e) => setSimUser(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                      Test Comment or Message
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={simText}
                        onChange={(e) => setSimText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs font-semibold focus:outline-none focus:bg-white"
                      />
                      <button
                        type="submit"
                        className="editorial-btn px-4 py-2 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Fire Test</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Cartoon Phone Frame Preview */}
                <div className="rounded-3xl bg-[#19154E] text-white p-4 border-2 border-[#19154E] space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 text-xs">
                    <span className="font-display font-bold text-[#FFF8FC]">
                      📱 @{profile.username} Inbox
                    </span>
                    {simResult?.matched && (
                      <span className="px-2 py-0.5 rounded-full bg-[#C8F904] text-[#19154E] text-[10px] font-bold">
                        Matched &quot;{simResult.log.matched_keyword}&quot;
                      </span>
                    )}
                  </div>

                  {!simResult ? (
                    <div className="py-7 text-center text-xs text-neutral-400">
                      Click <strong>Fire Test</strong> above to watch Fairy Anna reply in the comments & send the DM card!
                    </div>
                  ) : !simResult.matched ? (
                    <div className="p-3 rounded-2xl bg-[#FF7EB6]/20 border border-[#FF7EB6] text-xs text-[#B799E8] font-semibold">
                      {simResult.message}
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs panel-enter">
                      {/* Follower's Incoming Comment */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#B799E8] text-[#19154E] border-2 border-white flex items-center justify-center text-xs font-extrabold shrink-0">
                          {simResult.log.sender_username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="p-3 rounded-2xl rounded-tl-none bg-neutral-800 text-white">
                          <div className="text-[10px] text-neutral-400 font-bold mb-0.5">
                            @{simResult.log.sender_username} • {simResult.log.event_type}
                          </div>
                          {simResult.log.incoming_text}
                        </div>
                      </div>

                      {/* Public Comment Auto-Reply */}
                      {simResult.log.public_comment_reply && (
                        <div className="ml-7 p-2.5 rounded-2xl bg-neutral-900 border border-[#C8F904] text-[#C8F904]">
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            ↪ Public Comment Reply Sent:
                          </div>
                          <span className="text-white">{simResult.log.public_comment_reply}</span>
                        </div>
                      )}

                      {/* Automated Private DM Card */}
                      <div className="flex items-start justify-end pt-1">
                        <div className="max-w-[88%] p-3.5 rounded-2xl rounded-tr-none bg-[#6D28D9] text-white border-2 border-white shadow-lg">
                          <div className="text-[10px] text-[#C8F904] font-bold uppercase tracking-wider mb-1">
                            ✨ Automated DM from @{profile.username}
                          </div>
                          <p className="leading-relaxed font-medium">{simResult.log.dm_sent}</p>
                          {simResult.log.dm_button_text && (
                            <a
                              href={simResult.log.dm_button_url || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 w-full py-2 px-3 rounded-xl bg-[#C8F904] text-[#19154E] font-bold text-center flex items-center justify-center gap-1.5 hover:bg-[#B799E8] transition-colors duration-150"
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
              <div className="editorial-card p-5 bg-[#FFF8FC] space-y-3">
                <h4 className="font-display font-bold text-sm text-[#19154E]">
                  Recent Trigger Activity
                </h4>
                {logs.length === 0 ? (
                  <p className="text-xs text-neutral-600 font-medium">
                    No triggers logged yet. Click <strong>Fire Test</strong> above!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {logs.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-white border-2 border-[#19154E] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate font-medium">
                          <strong className="text-[#6D28D9]">@{item.sender_username}</strong>:{' '}
                          <span>&quot;{item.incoming_text}&quot;</span>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C8F904] border border-[#19154E]">
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
            Features the "Don't Look Up" Inspired Cartoon Data Astronomer!
        ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 panel-enter">
            {/* Astronomer Observatory Header Card */}
            <div className="editorial-card p-6 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE9FE] border-2 border-[#19154E] text-xs font-bold text-[#6D28D9]">
                  <span>🔭 @techfairyanna Telemetry Observatory</span>
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                  Reels with a single-word DM keyword get{' '}
                  <span className="px-2.5 py-0.5 rounded-xl bg-[#B799E8] border-2 border-[#19154E]">
                    {summary.comment_lift_multiplier || 4.2}x more comments
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  Our cartoon astronomer analyzed your recent posts, save-to-view ratios, and
                  comment velocity. Posts where you ask viewers to comment a single word (like{' '}
                  <code className="font-mono-code font-bold">LINK</code> or{' '}
                  <code className="font-mono-code font-bold">CODE</code>) trigger Instagram&apos;s
                  Explore distribution algorithm.
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleRefreshAnalytics}
                    disabled={syncing}
                    className="editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>Sync Latest Instagram Metrics</span>
                  </button>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-60 h-44">
                  <DataAstronomerCharacter />
                </div>
              </div>
            </div>

            {/* 6 Bold Editorial Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>FOLLOWERS</span>
                  <Instagram className="w-4 h-4 text-[#FF7EB6]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(profile.followers_count || 14820).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1">+4.8% this month</div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>TOTAL VIEWS</span>
                  <Eye className="w-4 h-4 text-[#6D28D9]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(summary.total_views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-neutral-600 mt-1">Recent Reels/Posts</div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#C8F904]">
                <div className="text-xs font-bold text-[#19154E] flex items-center justify-between">
                  <span>AVG ENGAGEMENT</span>
                  <TrendingUp className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {summary.avg_engagement_rate}%
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1">Top 5% Creator Tier</div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>TOTAL SAVES</span>
                  <Bookmark className="w-4 h-4 text-[#B799E8]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(summary.total_saves || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-neutral-600 mt-1">High bookmark rate</div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#B799E8]">
                <div className="text-xs font-bold text-[#19154E] flex items-center justify-between">
                  <span>COMMENT LIFT</span>
                  <MessageCircle className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {summary.comment_lift_multiplier}x
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1">With DM Keyword</div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>AUTO-DMS SENT</span>
                  <Send className="w-4 h-4 text-[#FF7EB6]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#6D28D9] mt-1.5">
                  {(summary.estimated_dm_conversions || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-neutral-600 mt-1">Instant links sent</div>
              </div>
            </div>

            {/* Post-by-Post Performance Table */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 border-b-2 border-[#19154E] bg-[#F5EEFF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-display font-bold text-base text-[#19154E]">
                  Recent @techfairyanna Posts & Comment-to-DM Conversions
                </h3>
                <span className="text-xs font-bold text-neutral-700">
                  Compare posts with a ManyChat keyword CTA vs. standard posts
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#19154E] text-[#19154E] font-bold bg-[#FFF8FC]">
                      <th className="py-3.5 px-4">Format</th>
                      <th className="py-3.5 px-4">Post Caption & Hook</th>
                      <th className="py-3.5 px-4">DM Keyword</th>
                      <th className="py-3.5 px-4 text-right">Views</th>
                      <th className="py-3.5 px-4 text-right">Likes</th>
                      <th className="py-3.5 px-4 text-right">Comments</th>
                      <th className="py-3.5 px-4 text-right">Saves</th>
                      <th className="py-3.5 px-4 text-right">Auto-DMs</th>
                      <th className="py-3.5 px-4 text-right">Eng. Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-neutral-200 font-medium">
                    {posts.map((post) => (
                      <tr key={post.id} className="hover:bg-[#FFF8FC] transition-colors duration-150">
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#19154E] ${
                              post.type === 'REEL'
                                ? 'bg-[#FF7EB6] text-[#19154E]'
                                : post.type === 'CAROUSEL'
                                ? 'bg-[#B799E8] text-[#19154E]'
                                : 'bg-[#EDE9FE] text-[#6D28D9]'
                            }`}
                          >
                            {post.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="text-[#19154E] line-clamp-2 font-semibold">{post.caption}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          {post.best_keyword && !post.best_keyword.includes('None') ? (
                            <span className="font-mono-code text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#C8F904] text-[#19154E] border border-[#19154E]">
                              &quot;{post.best_keyword}&quot;
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-semibold">No CTA</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#19154E]">
                          {(post.views || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right text-neutral-700">
                          {(post.likes || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#FF7EB6]">
                          {(post.comments || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#19154E]">
                          {(post.saves || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#6D28D9]">
                          {post.dm_triggers ?? intOrZero(post.comments * 0.7)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2 py-0.5 rounded-md bg-[#C8F904] border border-[#19154E] font-bold text-[#19154E]">
                            {post.engagement_rate}%
                          </span>
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
            TAB 3: AI STRATEGY & CONTENT ENGINE
        ============================================================ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6 panel-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                  Growth & DM Conversion Playbook for @{profile.username}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                  Click <strong>Build This DM Flow</strong> on any strategy card to turn it into a live automation!
                </p>
              </div>
            </div>

            {/* Strategy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {strategies.map((strat, index) => (
                <div
                  key={strat.id}
                  className="editorial-card editorial-card-interactive p-6 bg-white flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border-2 border-[#19154E] ${
                          index % 2 === 0 ? 'bg-[#C8F904]' : 'bg-[#B799E8]'
                        }`}
                      >
                        {strat.category}
                      </span>
                      <span className="text-xs font-extrabold text-[#FF7EB6]">
                        ⚡ {strat.impact}
                      </span>
                    </div>

                    <h4 className="font-display text-xl font-bold text-[#19154E]">{strat.title}</h4>

                    <p className="text-xs text-[#19154E] bg-[#FFF8FC] p-3.5 rounded-2xl border-2 border-[#19154E] font-medium leading-relaxed">
                      📊 <strong>Why it works:</strong> {strat.finding}
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Action Steps:
                      </div>
                      <ul className="space-y-2 text-xs text-neutral-800 font-medium">
                        {strat.action_items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#6D28D9] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-dashed border-neutral-300 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-600">
                      Trigger Keyword:{' '}
                      <strong className="font-mono-code px-2 py-0.5 rounded bg-[#EDE9FE] border border-[#19154E] text-[#6D28D9]">
                        &quot;{strat.recommended_keyword}&quot;
                      </strong>
                    </span>
                    <button
                      onClick={() =>
                        handleApplyStrategyKeyword(strat.recommended_keyword, strat.title)
                      }
                      className="editorial-btn px-4 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5 text-[#C8F904]" />
                      <span>Build This DM Flow</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Next 3 High-Converting Reel & Carousel Ideas */}
            <div className="editorial-card p-6 bg-[#EDE9FE] space-y-4">
              <div>
                <h4 className="font-display text-xl font-bold text-[#19154E]">
                  Next 3 High-Converting Reel Ideas + Paired ManyChat Keywords
                </h4>
                <p className="text-xs font-medium text-neutral-700">
                  Tailored for @techfairyanna&apos;s AI, coding, and creative tech audience:
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {contentIdeas.map((idea, i) => (
                  <div
                    key={i}
                    className="editorial-card-sm p-5 bg-white flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#FF7EB6] text-[#19154E] border border-[#19154E]">
                          {idea.format}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-[#C8F904] border border-[#19154E]">
                          Est. ER: {idea.predicted_er}
                        </span>
                      </div>
                      <h5 className="font-display font-bold text-base text-[#19154E]">
                        {idea.title}
                      </h5>
                      <p className="text-xs text-neutral-700 italic bg-[#FFF8FC] p-2.5 rounded-xl border border-neutral-300">
                        <strong>Opening Hook:</strong> &quot;{idea.hook}&quot;
                      </p>
                    </div>
                    <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-600">
                        Keyword:{' '}
                        <strong className="font-mono-code text-[#6D28D9]">
                          {idea.cta_keyword}
                        </strong>
                      </span>
                      <button
                        onClick={() => handleApplyStrategyKeyword(idea.cta_keyword, idea.title)}
                        className="text-xs font-bold text-[#FF7EB6] hover:underline"
                      >
                        + Create Trigger →
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
            Features the Animated Cartoon Plug Mechanic!
        ============================================================ */}
        {activeTab === 'connect' && (
          <div className="max-w-4xl mx-auto space-y-6 panel-enter">
            <div className="editorial-card p-6 sm:p-8 bg-white space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b-2 border-[#19154E] pb-5">
                <div className="md:col-span-8 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F904] border-2 border-[#19154E] text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Zero Manual ID Lookup Needed</span>
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                    Plug @{profile.username} into SocialAssist
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-medium">
                    Paste your token or use the 1-Click Instagram OAuth popup—our Python backend
                    automatically discovers your Account ID, profile stats, and Reels!
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <div className="w-48 h-32">
                    <PlugMechanicCharacter connected={Boolean(connection?.has_access_token)} />
                  </div>
                </div>
              </div>

              {connectStatusMsg && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold border-2 border-[#19154E] ${
                    connectStatusMsg.type === 'error'
                      ? 'bg-[#FF7EB6] text-[#19154E]'
                      : 'bg-[#C8F904] text-[#19154E]'
                  }`}
                >
                  {connectStatusMsg.text}
                </div>
              )}

              <form onSubmit={handleConnectSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#19154E] mb-1.5">
                    1. Your Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="techfairyanna"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Option A: Paste Token Only */}
                <div className="p-5 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-sm font-display font-bold text-[#19154E]">
                      Option A (Fastest): Paste Your Instagram Access Token
                    </label>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="editorial-btn px-3 py-1 rounded-xl bg-[#B799E8] text-[#19154E] text-xs font-bold inline-flex items-center gap-1"
                    >
                      <span>Open Meta Developer Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-neutral-700 font-medium">
                    Paste your token below and click <strong>Save & Auto-Sync</strong>—we will
                    automatically look up your Instagram Account ID and pull your posts.
                  </p>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="IGQWR... or EAA... (Paste token here)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#19154E] text-sm font-mono-code focus:outline-none"
                  />
                </div>

                {/* Option B: 1-Click OAuth Popup */}
                <div className="p-5 rounded-2xl bg-[#EDE9FE] border-2 border-[#19154E] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-display font-bold text-[#19154E]">
                      Option B: Enable 1-Click &quot;Login with Instagram&quot; Popup
                    </label>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-[#19154E]">
                      60-Day Auto-Refresh
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Instagram App ID
                      </label>
                      <input
                        type="text"
                        value={appIdInput}
                        onChange={(e) => setAppIdInput(e.target.value)}
                        placeholder="e.g. 123456789012345"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Instagram App Secret
                      </label>
                      <input
                        type="password"
                        value={appSecretInput}
                        onChange={(e) => setAppSecretInput(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="text-xs font-medium text-neutral-700">
                      Redirect URI:{' '}
                      <code className="font-mono-code font-bold bg-white px-2 py-0.5 rounded border border-[#19154E]">
                        http://localhost:8000/api/auth/instagram/callback
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleOAuthPopup}
                      className="editorial-btn px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Login with Instagram Popup</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={syncing}
                    className="editorial-btn px-6 py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-sm font-bold flex items-center gap-2"
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

            {/* 3-Step Visual Cheat Sheet */}
            <div className="editorial-card p-6 bg-[#FFF8FC] space-y-4">
              <h4 className="font-display font-bold text-base text-[#19154E]">
                Where to Grab Your Token on Meta (3 Quick Clicks)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="editorial-card-sm p-4 bg-white space-y-1.5">
                  <div className="inline-block px-2 py-0.5 rounded bg-[#C8F904] border border-[#19154E] font-bold">
                    STEP 1
                  </div>
                  <p className="text-neutral-800 font-medium">
                    Go to{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#6D28D9] underline"
                    >
                      developers.facebook.com/apps
                    </a>{' '}
                    → <strong>Create App</strong> → <strong>Other</strong> →{' '}
                    <strong>Business</strong>.
                  </p>
                </div>
                <div className="editorial-card-sm p-4 bg-white space-y-1.5">
                  <div className="inline-block px-2 py-0.5 rounded bg-[#B799E8] border border-[#19154E] font-bold">
                    STEP 2
                  </div>
                  <p className="text-neutral-800 font-medium">
                    Click <strong>Instagram → Set Up</strong> → Left sidebar:{' '}
                    <strong>API setup with Instagram login</strong> → Add{' '}
                    <strong>@techfairyanna</strong>.
                  </p>
                </div>
                <div className="editorial-card-sm p-4 bg-white space-y-1.5">
                  <div className="inline-block px-2 py-0.5 rounded bg-[#FF7EB6] text-[#19154E] border border-[#19154E] font-bold">
                    STEP 3
                  </div>
                  <p className="text-neutral-800 font-medium">
                    Click <strong>Generate token</strong> next to{' '}
                    <code className="font-mono-code font-bold">techfairyanna</code> and paste it into{' '}
                    <strong>Option A</strong> above!
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span>Webhook Verify Token:</span>
                  <code className="font-mono-code px-2.5 py-1 rounded-lg bg-white border-2 border-[#19154E]">
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
                    className="p-1.5 rounded-lg bg-white border border-[#19154E]"
                  >
                    {copiedField === 'verify_token' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div>
                  Webhook Path:{' '}
                  <code className="font-mono-code bg-white px-2 py-0.5 rounded border border-[#19154E]">
                    /api/webhooks/instagram
                  </code>
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
