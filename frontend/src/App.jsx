import React, { useState, useEffect, useRef } from 'react';
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
  EyeOff,
  MessageCircle,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import {
  TechFairyCharacter,
  DataAstronomerCharacter,
  PlugMechanicCharacter,
} from './CartoonCharacters';
import {
  INITIAL_AUTOMATIONS,
  INITIAL_ANALYTICS,
  EMPTY_WORKSPACE_ANALYTICS,
  runLocalOpenClawAnalysis,
} from './fallbackEngine';
import {
  supabase,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  peekOAuthIntent,
  setOAuthIntent,
  clearOAuthIntent,
} from './supabase';
import PoliciesModal from './PoliciesModal';

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

  // Strict Sign-Up-Required Multi-Account Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [signupUsername, setSignupUsername] = useState('');
  const [loginUser, setLoginUser] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsHighlight, setTermsHighlight] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');
  const [policiesModal, setPoliciesModal] = useState({ open: false, section: 'terms' });
  const [loginError, setLoginError] = useState('');
  const [loginInfo, setLoginInfo] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const verifiedUserIdsRef = useRef(new Set());
  const signingOutGuardRef = useRef(false);

  // Connect form state
  const [handleInput, setHandleInput] = useState('');
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
    dm_button_url: 'https://example.com',
  });

  // Live Simulator state
  const [simType, setSimType] = useState('comment');
  const [simUser, setSimUser] = useState('sarah_builds');
  const [simText, setSimText] = useState('Wait this is awesome!! Can you send me the LINK please?');
  const [simResult, setSimResult] = useState(null);

  // Video Performance Ranking & OpenClaw Agent Hookup state
  const [videoSortBy, setVideoSortBy] = useState('views'); // 'views' | 'likes' | 'comments' | 'engagement' | 'recent' | 'followers'
  const [openclawGatewayUrl, setOpenclawGatewayUrl] = useState(
    'http://localhost:18789/v1/chat/completions'
  );
  const [openclawPrompt, setOpenclawPrompt] = useState(
    'Analyze my top-performing live Reels by Views, Likes, and Engagement Rate, break down the exact patterns in their text summaries, and write 3 new high-converting Reel scripts optimized for my US audience active window.'
  );
  const [openclawOutput, setOpenclawOutput] = useState(() =>
    runLocalOpenClawAnalysis(
      'Analyze my top-performing live Reels by Views, Likes, and Engagement Rate, break down the exact patterns in their text summaries, and write 3 new high-converting Reel scripts optimized for my US audience active window.',
      INITIAL_ANALYTICS
    )
  );
  const [openclawStatus, setOpenclawStatus] = useState('ready'); // 'ready' | 'running' | 'connected_gateway' | 'builtin_agent'
  const [showBriefPreview, setShowBriefPreview] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const triggerFairyWand = () => {
    setIsCastingWand(true);
    setTimeout(() => setIsCastingWand(false), 750);
  };

  const handleRunOpenClaw = async (customPromptText) => {
    const promptToUse = customPromptText || openclawPrompt;
    if (customPromptText) {
      setOpenclawPrompt(customPromptText);
    }
    setOpenclawStatus('running');
    triggerFairyWand();
    try {
      const res = await fetch('/api/openclaw/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
          gateway_url: openclawGatewayUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpenclawOutput(data.agent_response);
        setOpenclawStatus(
          data.status === 'connected_openclaw_gateway' ? 'connected_gateway' : 'builtin_agent'
        );
        showToast('OpenClaw Agent finished analyzing your live video stats!');
        return;
      }
      throw new Error('Fallback to local OpenClaw analyzer');
    } catch {
      const fallbackText = runLocalOpenClawAnalysis(promptToUse, analyticsData || INITIAL_ANALYTICS);
      setOpenclawOutput(fallbackText);
      setOpenclawStatus('builtin_agent');
      showToast('OpenClaw Agent finished analyzing your live video stats!');
    }
  };

  const getWorkspaceScope = (emailOverride) => {
    const raw = (emailOverride ?? currentUserEmail ?? sessionStorage.getItem('sa_user_email') ?? '').trim().toLowerCase();
    return raw || 'guest';
  };

  const scopedKey = (base, emailOverride) => `${base}_v2:${getWorkspaceScope(emailOverride)}`;

  const fetchLiveInstagramAnalytics = async ({
    forceRefresh = false,
    overrideHandle = '',
    emailOverride,
  } = {}) => {
    const connStr = localStorage.getItem(scopedKey('sa_connection', emailOverride)) || 'null';
    const savedConn = JSON.parse(connStr);
    const savedToken = localStorage.getItem(scopedKey('sa_ig_access_token', emailOverride)) || '';
    const targetHandle = (overrideHandle || savedConn?.instagram_handle || '')
      .replace(/^@/, '')
      .trim();

    if (!targetHandle) {
      setAnalyticsData(EMPTY_WORKSPACE_ANALYTICS);
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, EMPTY_WORKSPACE_ANALYTICS));
      return EMPTY_WORKSPACE_ANALYTICS;
    }

    const headers = {};
    if (savedToken) {
      headers.Authorization = `Bearer ${savedToken}`;
    }

    const qs = new URLSearchParams({ handle: targetHandle });
    if (forceRefresh) {
      qs.set('refresh', 'true');
    }

    const anaResp = await fetch(`/api/analytics?${qs.toString()}`, {
      headers,
      cache: forceRefresh ? 'no-store' : 'default',
    });
    if (!anaResp.ok) {
      throw new Error(`Analytics endpoint returned HTTP ${anaResp.status}`);
    }
    const anaRes = await anaResp.json();
    setAnalyticsData(anaRes);
    setOpenclawOutput((prev) =>
      openclawStatus === 'ready' ? runLocalOpenClawAnalysis(openclawPrompt, anaRes) : prev
    );
    return anaRes;
  };

  const fetchAll = async (emailOverride) => {
    // Purge legacy un-scoped cache keys so every user starts with a clean isolated workspace
    localStorage.removeItem('sa_analytics');
    localStorage.removeItem('sa_analytics_v4_real');
    localStorage.removeItem('sa_analytics_v5_live');
    localStorage.removeItem('sa_connection');
    localStorage.removeItem('sa_ig_access_token');

    const rawConn = localStorage.getItem(scopedKey('sa_connection', emailOverride));
    const savedToken = localStorage.getItem(scopedKey('sa_ig_access_token', emailOverride)) || '';
    const savedConn = JSON.parse(rawConn || 'null') || {
      instagram_handle: '',
      has_access_token: Boolean(savedToken),
      webhook_verify_token: 'social_assist_verify_token',
    };

    const resolvedHandle = (savedConn.instagram_handle || '').replace(/^@/, '').trim();
    const rawFlows = localStorage.getItem(scopedKey('sa_automations', emailOverride));
    const savedFlows = JSON.parse(rawFlows || 'null') || INITIAL_AUTOMATIONS;
    const savedLogs = JSON.parse(
      localStorage.getItem(scopedKey('sa_logs', emailOverride)) || '[]'
    );

    setConnection(savedConn);
    setHandleInput(resolvedHandle ? `https://www.instagram.com/${resolvedHandle}/` : '');
    setAutomations(savedFlows);
    setLogs(savedLogs);

    if (!resolvedHandle) {
      setActiveTab('connect');
      setAnalyticsData(EMPTY_WORKSPACE_ANALYTICS);
      setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, EMPTY_WORKSPACE_ANALYTICS));
      setLoading(false);
      return;
    }

    try {
      await fetchLiveInstagramAnalytics({
        forceRefresh: false,
        overrideHandle: resolvedHandle,
        emailOverride,
      });
    } catch {
      setAnalyticsData((prev) => prev || EMPTY_WORKSPACE_ANALYTICS);
    } finally {
      setLoading(false);
    }
  };

  const hasCompletedSignUp = (user) => {
    if (!user) return false;
    if (verifiedUserIdsRef.current.has(user.id)) return true;
    if (user.user_metadata?.sa_registered === true) return true;
    if (Array.isArray(user.identities) && user.identities.some((id) => id.provider === 'email')) {
      return true;
    }
    return false;
  };

  const cleanAuthUrlParams = () => {
    if (typeof window === 'undefined') return;
    const hasAuthParams =
      window.location.hash.includes('access_token') ||
      window.location.hash.includes('error') ||
      window.location.search.includes('code=') ||
      window.location.search.includes('error=') ||
      window.location.search.includes('auth_intent=');
    if (hasAuthParams) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.origin}${window.location.pathname}`
      );
    }
  };

  useEffect(() => {
    // Check if OAuth returned an explicit error/cancellation in URL
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const oauthErr =
        searchParams.get('error_description') ||
        hashParams.get('error_description') ||
        searchParams.get('error') ||
        hashParams.get('error');
      if (oauthErr) {
        clearOAuthIntent();
        cleanAuthUrlParams();
        setLoginError(
          oauthErr.includes('access_denied')
            ? 'Google authentication was cancelled.'
            : decodeURIComponent(oauthErr.replace(/\+/g, ' '))
        );
      }
    } catch {
      // ignore URL parse issues
    }

    const safetyTimer = setTimeout(() => {
      setAuthChecking(false);
    }, 4000);

    // Auto-refresh live Instagram numbers every 90 seconds while authenticated & visible
    const livePollTimer = setInterval(() => {
      const activeEmail = sessionStorage.getItem('sa_user_email') || '';
      if (document.visibilityState === 'visible' && activeEmail) {
        fetchLiveInstagramAnalytics({ forceRefresh: true, emailOverride: activeEmail }).catch(
          () => {}
        );
      }
    }, 90000);

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignore re-entrant sign-out events triggered by our own unregistered-user rejection
      if (signingOutGuardRef.current) {
        if (!session?.user) {
          signingOutGuardRef.current = false;
          setIsAuthenticated(false);
          setAuthChecking(false);
        }
        return;
      }

      const intent = peekOAuthIntent();
      cleanAuthUrlParams();

      if (!session?.user) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_OUT') {
          clearOAuthIntent();
        }
        sessionStorage.removeItem('sa_user_email');
        setCurrentUserEmail('');
        setCurrentUsername('');
        setIsAuthenticated(false);
        setAuthChecking(false);
        return;
      }

      const user = session.user;
      const email = (user.email || '').toLowerCase();
      const resolvedName =
        user.user_metadata?.username || user.user_metadata?.full_name || user.user_metadata?.name || '';

      // 0. Password Recovery Link Callback -> Let user choose a new password
      if (event === 'PASSWORD_RECOVERY' || intent === 'recovery') {
        clearOAuthIntent();
        setAuthMode('signin');
        setResetMode(false);
        setRecoveryMode(true);
        setIsAuthenticated(false);
        setAuthChecking(false);
        setLoginInfo(`Enter a new password for ${email}.`);
        return;
      }

      // 1. Explicit Sign-Up flow (Google Sign Up or Email Sign Up confirmation link)
      if (intent === 'signup') {
        const alreadyRegistered = user.user_metadata?.sa_registered === true;
        const nowIso = new Date().toISOString();
        verifiedUserIdsRef.current.add(user.id);
        clearOAuthIntent();
        sessionStorage.setItem('sa_user_email', email);
        setCurrentUserEmail(email);
        setCurrentUsername(resolvedName);
        setLoginError('');
        setLoginInfo('');
        setIsAuthenticated(true);
        setAuthChecking(false);
        fetchAll(email);

        if (!alreadyRegistered) {
          supabase.auth
            .updateUser({
              data: {
                sa_registered: true,
                sa_registered_at: nowIso,
                accepted_terms: true,
                accepted_terms_date: nowIso,
              },
            })
            .catch(() => {});
          showToast(`Account created! Welcome, ${resolvedName || email}`);
        } else {
          showToast(`Logged in as ${resolvedName || email}`);
        }
        return;
      }

      // 2. Sign-In or Session Reload — STRICTLY require prior Sign Up!
      if (!hasCompletedSignUp(user)) {
        clearOAuthIntent();
        signingOutGuardRef.current = true;
        sessionStorage.removeItem('sa_user_email');
        setCurrentUserEmail('');
        setCurrentUsername('');
        setIsAuthenticated(false);
        if (intent === 'signin') {
          setAuthMode('signup');
          setLoginInfo('');
          setLoginError(
            `No account found for ${email || 'that Google account'}. Only users who have signed up can log in — please agree to the Terms & Privacy Policy and sign up below first!`
          );
        }
        await supabase.auth.signOut().catch(() => {});
        signingOutGuardRef.current = false;
        setAuthChecking(false);
        return;
      }

      // 3. Verified Registered Account -> Log in to their isolated workspace
      verifiedUserIdsRef.current.add(user.id);
      clearOAuthIntent();
      if (user.user_metadata?.sa_registered !== true) {
        supabase.auth
          .updateUser({
            data: {
              sa_registered: true,
              sa_registered_at: new Date().toISOString(),
            },
          })
          .catch(() => {});
      }
      sessionStorage.setItem('sa_user_email', email);
      setCurrentUserEmail(email);
      setCurrentUsername(resolvedName);
      setLoginError('');
      setIsAuthenticated(true);
      setAuthChecking(false);
      fetchAll(email);
    });

    const handleOAuthMessage = (event) => {
      if (event.data && event.data.type === 'IG_OAUTH_SUCCESS') {
        showToast('Connected Instagram via OAuth!');
        fetchAll(sessionStorage.getItem('sa_user_email') || '');
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => {
      clearTimeout(safetyTimer);
      clearInterval(livePollTimer);
      window.removeEventListener('message', handleOAuthMessage);
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  const extractHandleFromLink = (raw) => {
    const s = (raw || '').trim();
    if (!s) return '';
    if (s.includes('instagram.com/')) {
      const after = s.split('instagram.com/')[1].split('?')[0].replace(/^\/+|\/+$/g, '');
      const seg = after.split('/')[0].replace(/^@/, '');
      if (seg && !['p', 'reel', 'reels', 'stories', 'explore', 'accounts'].includes(seg)) {
        return seg;
      }
    }
    return s.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  };

  const handleConnectAndRedirect = async (e) => {
    if (e) e.preventDefault();
    const extracted = extractHandleFromLink(handleInput);
    if (!extracted) {
      setConnectStatusMsg({
        type: 'error',
        text: 'Please enter your Instagram @handle or profile link first.',
      });
      showToast('Enter your Instagram @handle or profile link first!', 'error');
      return;
    }
    // Open Instagram login / profile authorization window immediately on the user's click gesture
    const targetUrl =
      connection?.oauth_login_url ||
      `https://www.instagram.com/accounts/login/?next=%2F${encodeURIComponent(extracted)}%2F`;
    window.open(targetUrl, 'ig_login_window', 'width=620,height=720');
    await handleConnectSubmit(null, extracted);
  };

  const handleConnectSubmit = async (e, overrideHandle) => {
    if (e) e.preventDefault();
    const cleanHandle = overrideHandle || extractHandleFromLink(handleInput);
    if (!cleanHandle && !(tokenInput && tokenInput.trim())) {
      setConnectStatusMsg({
        type: 'error',
        text: 'Please enter an Instagram @handle, profile URL, or Graph API token.',
      });
      return;
    }
    setSyncing(true);
    setConnectStatusMsg(null);
    try {
      if (tokenInput && tokenInput.trim()) {
        const cleanToken = tokenInput.trim();
        const verifyResp = await fetch(
          `/api/analytics?handle=${encodeURIComponent(cleanHandle || 'me')}&refresh=true&strict_token=true`,
          {
            headers: { Authorization: `Bearer ${cleanToken}` },
            cache: 'no-store',
          }
        );
        if (!verifyResp.ok) {
          const errJson = await verifyResp.json().catch(() => ({}));
          throw new Error(errJson.error || 'Invalid Instagram Graph API token');
        }
        const liveAna = await verifyResp.json();
        const finalHandle = liveAna.profile?.username || cleanHandle;
        localStorage.setItem(scopedKey('sa_ig_access_token'), cleanToken);
        const updatedConn = {
          instagram_handle: finalHandle,
          has_access_token: true,
          account_id: liveAna.profile?.account_id || '',
          webhook_verify_token: 'social_assist_verify_token',
        };
        localStorage.setItem(scopedKey('sa_connection'), JSON.stringify(updatedConn));
        setConnection(updatedConn);
        setHandleInput(`https://www.instagram.com/${finalHandle}/`);
        setAnalyticsData(liveAna);
        setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, liveAna));
        setConnectStatusMsg({
          type: 'success',
          text: `Connected @${finalHandle} via Official Instagram Graph API (live metrics synced)!`,
        });
        showToast(`Connected @${finalHandle} via Graph API!`);
        setTokenInput('');
        setActiveTab('analytics');
        triggerFairyWand();
      } else {
        const updatedConn = {
          instagram_handle: cleanHandle,
          has_access_token: Boolean(localStorage.getItem(scopedKey('sa_ig_access_token'))),
          webhook_verify_token: 'social_assist_verify_token',
        };
        localStorage.setItem(scopedKey('sa_connection'), JSON.stringify(updatedConn));
        setConnection(updatedConn);
        setHandleInput(`https://www.instagram.com/${cleanHandle}/`);
        await fetchLiveInstagramAnalytics({ forceRefresh: true, overrideHandle: cleanHandle });
        setConnectStatusMsg({
          type: 'success',
          text: `Redirected to Instagram & synced live stats for @${cleanHandle}!`,
        });
        showToast(`Connected & pulled live stats for @${cleanHandle}!`);
        setActiveTab('analytics');
        triggerFairyWand();
      }
    } catch (innerErr) {
      setConnectStatusMsg({ type: 'error', text: innerErr.message });
      showToast(innerErr.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectInstagram = () => {
    localStorage.removeItem(scopedKey('sa_connection'));
    localStorage.removeItem(scopedKey('sa_ig_access_token'));
    setConnection({ instagram_handle: '', has_access_token: false });
    setHandleInput('');
    setTokenInput('');
    setAnalyticsData(EMPTY_WORKSPACE_ANALYTICS);
    setOpenclawOutput(runLocalOpenClawAnalysis(openclawPrompt, EMPTY_WORKSPACE_ANALYTICS));
    setConnectStatusMsg({
      type: 'success',
      text: 'Disconnected Instagram account from your workspace.',
    });
    showToast('Instagram account disconnected');
  };

  const handleCreateFlow = async (e) => {
    e.preventDefault();
    const keywordsList = newFlow.keywords
      .split(',')
      .map((k) => k.trim().toUpperCase())
      .filter(Boolean);
    const created = {
      id: `flow-${Date.now()}`,
      ...newFlow,
      keywords: keywordsList,
      active: true,
      stats: { triggered: 0, dms_sent: 0, link_clicks: 0 },
    };
    const next = [created, ...automations];
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    showToast(`Created automation "${newFlow.name}"!`);
    setShowNewFlow(false);
    triggerFairyWand();
  };

  const handleToggleFlow = async (id) => {
    const next = automations.map((f) => (f.id === id ? { ...f, active: !f.active } : f));
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    triggerFairyWand();
  };

  const handleDeleteFlow = async (id) => {
    const next = automations.filter((f) => f.id !== id);
    setAutomations(next);
    localStorage.setItem(scopedKey('sa_automations'), JSON.stringify(next));
    showToast('Automation deleted');
  };

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    triggerFairyWand();
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
    localStorage.setItem(scopedKey('sa_logs'), JSON.stringify(nextLogs));
    setSimResult({ matched: true, flow: matchedFlow, log: logEntry });
  };

  const handleRefreshAnalytics = async () => {
    setSyncing(true);
    try {
      const fresh = await fetchLiveInstagramAnalytics({ forceRefresh: true });
      triggerFairyWand();
      const liveFollowers = (fresh?.profile?.followers_count || 0).toLocaleString();
      showToast(`Live Instagram sync complete! (${liveFollowers} followers)`);
    } catch {
      showToast('Could not reach live Instagram endpoint — showing last known snapshot.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleApplyStrategyKeyword = (keyword, title) => {
    const activeHandle = analyticsData?.profile?.username || connection?.instagram_handle || 'creator';
    setNewFlow({
      name: `${title.slice(0, 36)}...`,
      trigger_type: keyword === '🔥' ? 'story_reply' : 'comment_keyword',
      keywords: keyword,
      public_comment_reply:
        keyword === '🔥'
          ? ''
          : `Sent it straight to your DMs! Check your message requests ✨🧚‍♀️`,
      dm_message: `Hey! 👋 Thanks for engaging with @${activeHandle}! Here is the ${keyword} resource from my post:`,
      dm_button_text: `Get ${keyword} Resource ✨`,
      dm_button_url: 'https://techfairylab.com',
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

  const openPolicies = (section = 'terms') => {
    setPoliciesModal({ open: true, section });
  };

  const switchAuthTab = (nextMode) => {
    setAuthMode(nextMode);
    setResetMode(false);
    setRecoveryMode(false);
    setPendingConfirmEmail('');
    setTermsHighlight(false);
    setLoginError('');
    setLoginInfo('');
    setLoginPassword('');
    setConfirmPassword('');
  };

  const handleGoogleAuth = async (intent) => {
    setLoginError('');
    setLoginInfo('');
    setPendingConfirmEmail('');

    // Require legal terms agreement on Sign Up (same policy rule as labfae)
    if (intent === 'signup' && !agreedToTerms) {
      setTermsHighlight(true);
      setLoginError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setTermsHighlight(false);
    setAuthSubmitting(true);

    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const redirectUrl = `${baseUrl}?auth_intent=${intent}`;
    setOAuthIntent(intent);

    try {
      const settingsResp = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      });
      if (settingsResp.ok) {
        const settings = await settingsResp.json();
        if (settings?.external && settings.external.google === false) {
          clearOAuthIntent();
          setAuthSubmitting(false);
          setLoginError(
            'Google provider is not enabled yet in your Supabase project (Authentication → Sign In / Providers → Google).'
          );
          return;
        }
      }
    } catch {
      // Proceed to OAuth redirect if preflight settings check cannot reach endpoint
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      clearOAuthIntent();
      setAuthSubmitting(false);
      setLoginError(error.message);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    const normalizedEmail = loginUser.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setLoginError('Please enter your registered email address first.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${baseUrl}?auth_intent=recovery`,
      });
      if (error) {
        setLoginError(error.message);
      } else {
        setLoginInfo(`Password reset link sent to ${normalizedEmail}! Check your email inbox.`);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSaveRecoveredPassword = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    if (loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }
    if (loginPassword !== confirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: loginPassword,
      });
      if (error) {
        setLoginError(error.message);
        return;
      }
      const email = (data?.user?.email || loginUser || '').toLowerCase();
      setRecoveryMode(false);
      setLoginPassword('');
      setConfirmPassword('');
      if (data?.user) {
        verifiedUserIdsRef.current.add(data.user.id);
        sessionStorage.setItem('sa_user_email', email);
        setCurrentUserEmail(email);
        setCurrentUsername(data.user.user_metadata?.username || '');
        setIsAuthenticated(true);
        await fetchAll(email);
        showToast('Password updated! Welcome back.');
      } else {
        setLoginInfo('Password updated! You can now log in.');
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = pendingConfirmEmail || loginUser.trim().toLowerCase();
    if (!targetEmail) return;
    setAuthSubmitting(true);
    setLoginError('');
    try {
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
        options: {
          emailRedirectTo: `${baseUrl}?auth_intent=signup`,
        },
      });
      if (error) {
        setLoginError(error.message);
      } else {
        setPendingConfirmEmail('');
        setLoginInfo(`Sent a fresh verification link to ${targetEmail}! Check your inbox (and spam folder).`);
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginInfo('');
    setPendingConfirmEmail('');
    clearOAuthIntent();

    const normalizedEmail = loginUser.trim().toLowerCase();
    const trimmedUsername = signupUsername.trim();

    if (authMode === 'signup' && !trimmedUsername) {
      setLoginError('Please enter a username.');
      return;
    }

    if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    const baseUrl = `${window.location.origin}${window.location.pathname}`;

    if (authMode === 'signup') {
      if (loginPassword.length < 6) {
        setLoginError('Password must be at least 6 characters long.');
        return;
      }
      if (loginPassword !== confirmPassword) {
        setLoginError('Passwords do not match. Please double-check both password fields.');
        return;
      }
      if (!agreedToTerms) {
        setTermsHighlight(true);
        setLoginError('Please agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }

      setTermsHighlight(false);
      setAuthSubmitting(true);
      try {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: loginPassword,
          options: {
            emailRedirectTo: `${baseUrl}?auth_intent=signup`,
            data: {
              username: trimmedUsername,
              sa_registered: true,
              sa_registered_at: nowIso,
              accepted_terms: true,
              accepted_terms_date: nowIso,
            },
          },
        });

        if (error) {
          setLoginError(error.message);
          return;
        }

        // Supabase returns empty identities array if email is already registered (same check as labfae)
        if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setAuthMode('signin');
          setLoginPassword('');
          setConfirmPassword('');
          setLoginError(
            `An account with ${normalizedEmail} already exists. Please log in below (or click "Forgot password?" to reset access).`
          );
          return;
        }

        if (data?.session && data?.user) {
          verifiedUserIdsRef.current.add(data.user.id);
          sessionStorage.setItem('sa_user_email', normalizedEmail);
          setCurrentUserEmail(normalizedEmail);
          setCurrentUsername(trimmedUsername);
          setIsAuthenticated(true);
          setLoginPassword('');
          setConfirmPassword('');
          await fetchAll(normalizedEmail);
          triggerFairyWand();
          showToast(`Account created! Welcome, ${trimmedUsername}`);
          return;
        }

        setAuthMode('signin');
        setLoginPassword('');
        setConfirmPassword('');
        setLoginInfo(
          `Account created! Please check ${normalizedEmail} to confirm your email, then log in below.`
        );
      } finally {
        setAuthSubmitting(false);
      }
      return;
    }

    // Regular Log In Mode — strictly requires an existing registered account
    if (!loginPassword) {
      setLoginError('Please enter your password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: loginPassword,
      });

      if (error || !data?.user) {
        const msg = (error?.message || '').toLowerCase();
        if (msg.includes('email not confirmed')) {
          setPendingConfirmEmail(normalizedEmail);
          setLoginError(
            `Please confirm your email first — check ${normalizedEmail} for your verification link before logging in.`
          );
        } else {
          setLoginError(
            'No matching account or wrong password. Only users who have signed up can log in — switch to Sign Up above to create an account first!'
          );
        }
        return;
      }

      verifiedUserIdsRef.current.add(data.user.id);
      if (data.user.user_metadata?.sa_registered !== true) {
        supabase.auth
          .updateUser({
            data: {
              sa_registered: true,
              sa_registered_at: new Date().toISOString(),
            },
          })
          .catch(() => {});
      }

      sessionStorage.setItem('sa_user_email', normalizedEmail);
      setCurrentUserEmail(normalizedEmail);
      setCurrentUsername(
        data.user.user_metadata?.username || data.user.user_metadata?.full_name || ''
      );
      setIsAuthenticated(true);
      setLoginPassword('');
      setConfirmPassword('');
      await fetchAll(normalizedEmail);
      triggerFairyWand();
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    signingOutGuardRef.current = true;
    clearOAuthIntent();
    sessionStorage.removeItem('sa_authenticated');
    sessionStorage.removeItem('sa_user_email');
    setCurrentUserEmail('');
    setCurrentUsername('');
    await supabase.auth.signOut().catch(() => {});
    signingOutGuardRef.current = false;
    setIsAuthenticated(false);
    setAuthMode('signin');
    setResetMode(false);
    setRecoveryMode(false);
    setLoginPassword('');
    setConfirmPassword('');
    setLoginError('');
    setLoginInfo('You have been logged out.');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center p-4">
        <div className="editorial-card px-8 py-6 flex items-center gap-4 bg-white">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF7EB6]" />
          <span className="font-display text-lg font-bold">
            Verifying SocialAssist account...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isSignUp = authMode === 'signup';
    return (
      <div className="min-h-screen bg-[#FFF8FC] text-[#19154E] flex items-center justify-center p-4">
        <PoliciesModal
          isOpen={policiesModal.open}
          initialSection={policiesModal.section}
          onClose={() => setPoliciesModal((prev) => ({ ...prev, open: false }))}
        />

        <div className="editorial-card max-w-md w-full p-6 sm:p-7 bg-white space-y-4 panel-enter">
          {/* Compact Studio Header so Regular Form + Google Auth + Policies all fit cleanly */}
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] overflow-hidden flex items-center justify-center">
              <TechFairyCharacter isCasting={false} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE4F1] border border-[#19154E] text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#19154E]" />
                <span>SocialAssist Studio</span>
              </span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#19154E]">
                {recoveryMode
                  ? 'Set New Password'
                  : resetMode
                  ? 'Reset Password'
                  : isSignUp
                  ? 'Create Account'
                  : 'Log In'}
              </h1>
              <p className="text-xs text-neutral-600 font-medium leading-snug">
                {recoveryMode
                  ? 'Choose a new password for your SocialAssist account.'
                  : resetMode
                  ? "Enter your email and we'll send you a recovery link."
                  : isSignUp
                  ? 'Sign up with Email or Google to unlock your creator workspace.'
                  : 'Welcome back! Log in with a registered Email or Google account.'}
              </p>
            </div>
          </div>

          {/* Explicit Log In / Sign Up Tab Bar */}
          {!recoveryMode && (
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E]">
              <button
                type="button"
                data-testid="tab-login"
                onClick={() => switchAuthTab('signin')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-colors duration-150 ${
                  !isSignUp
                    ? 'bg-[#19154E] text-[#FFF8FC] shadow-[2px_2px_0px_#FF7EB6]'
                    : 'text-[#19154E] hover:bg-white/80'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </button>
              <button
                type="button"
                data-testid="tab-signup"
                onClick={() => switchAuthTab('signup')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-display font-bold transition-colors duration-150 ${
                  isSignUp
                    ? 'bg-[#19154E] text-[#FFF8FC] shadow-[2px_2px_0px_#C8F904]'
                    : 'text-[#19154E] hover:bg-white/80'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {loginError && (
            <div
              role="alert"
              data-testid="auth-error"
              className="p-3 rounded-xl bg-[#FFE4F1] border-2 border-[#19154E] text-xs font-bold text-[#19154E] text-center space-y-2"
            >
              <div>{loginError}</div>
              {pendingConfirmEmail && (
                <button
                  type="button"
                  disabled={authSubmitting}
                  onClick={handleResendConfirmation}
                  className="px-3 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold underline hover:bg-[#F5EEFF]"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          {loginInfo && (
            <div
              role="status"
              data-testid="auth-info"
              className="p-3 rounded-xl bg-[#E8FFF3] border-2 border-[#19154E] text-xs font-bold text-[#19154E] text-center"
            >
              {loginInfo}
            </div>
          )}

          {/* MODE A: Set New Password after clicking Email Recovery Link */}
          {recoveryMode ? (
            <form onSubmit={handleSaveRecoveredPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Enter new password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm"
              >
                {authSubmitting ? 'Saving...' : 'Save New Password →'}
              </button>
            </form>
          ) : resetMode ? (
            /* MODE B: Forgot Password Request (matches Labfae LogIn.jsx) */
            <form onSubmit={handlePasswordResetRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#19154E] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your registered email"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm"
              >
                {authSubmitting ? 'Sending link...' : 'Send Recovery Link →'}
              </button>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setLoginError('');
                    setLoginInfo('');
                  }}
                  className="text-xs font-bold text-[#19154E] underline hover:opacity-80"
                >
                  Remembered it? Back to Log In
                </button>
              </div>
            </form>
          ) : (
            /* MODE C: Regular Log In / Regular Sign Up + Google Log In / Google Sign Up */
            <>
              <form onSubmit={handleEmailAuth} noValidate className="space-y-3">
                {isSignUp && (
                  <div>
                    <label
                      htmlFor="sa-username"
                      className="block text-xs font-bold text-[#19154E] mb-1"
                    >
                      Username
                    </label>
                    <input
                      id="sa-username"
                      type="text"
                      required
                      placeholder="Enter your username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="sa-email" className="block text-xs font-bold text-[#19154E] mb-1">
                    Email
                  </label>
                  <input
                    id="sa-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="sa-password" className="block text-xs font-bold text-[#19154E]">
                      Password
                    </label>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetMode(true);
                          setLoginError('');
                          setLoginInfo('');
                        }}
                        className="text-[11px] font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="sa-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={isSignUp ? 6 : 1}
                      placeholder={isSignUp ? 'Min 6 characters' : 'Enter your password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#19154E]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label
                      htmlFor="sa-confirm-password"
                      className="block text-xs font-bold text-[#19154E] mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="sa-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-sm font-mono-code focus:outline-none focus:bg-white"
                    />
                  </div>
                )}

                {/* Legal Terms Agreement Checkbox on Sign Up (matches Labfae SignUpSupabase.jsx) */}
                {isSignUp && (
                  <div
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border-2 transition-colors ${
                      termsHighlight
                        ? 'bg-[#FFE4F1] border-[#FF2E88]'
                        : 'bg-[#F5EEFF]/60 border-[#19154E]/30'
                    }`}
                  >
                    <input
                      id="sa-policy-check"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked);
                        if (e.target.checked) {
                          setTermsHighlight(false);
                          if (loginError.includes('Terms of Service')) {
                            setLoginError('');
                          }
                        }
                      }}
                      className="mt-0.5 w-4 h-4 shrink-0 accent-[#FF7EB6] cursor-pointer"
                    />
                    <label
                      htmlFor="sa-policy-check"
                      className="text-xs text-[#19154E] font-medium leading-snug cursor-pointer"
                    >
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openPolicies('terms');
                        }}
                        className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Terms of Service
                      </button>{' '}
                      and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openPolicies('privacy');
                        }}
                        className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                      >
                        Privacy Policy
                      </button>
                      .
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  data-testid="submit-email-auth"
                  disabled={authSubmitting}
                  className="w-full editorial-btn py-3 rounded-2xl bg-[#FF7EB6] text-[#19154E] font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>
                    {authSubmitting
                      ? isSignUp
                        ? 'Creating account...'
                        : 'Logging in...'
                      : isSignUp
                      ? 'Complete Sign Up →'
                      : 'Log In →'}
                  </span>
                </button>
              </form>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t-2 border-dashed border-neutral-300" />
                <span className="flex-shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  or
                </span>
                <div className="flex-grow border-t-2 border-dashed border-neutral-300" />
              </div>

              {/* Dedicated Google Log In vs Google Sign Up Button */}
              <button
                type="button"
                data-testid="submit-google-auth"
                disabled={authSubmitting}
                onClick={() => handleGoogleAuth(isSignUp ? 'signup' : 'signin')}
                className={`w-full editorial-btn py-2.5 px-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-60 ${
                  isSignUp
                    ? 'bg-[#C8F904] hover:bg-[#d4ff2a] text-[#19154E]'
                    : 'bg-white hover:bg-[#FFF8FC] text-[#19154E]'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span>{isSignUp ? 'Sign up with Google' : 'Log in with Google'}</span>
              </button>

              <div className="text-center pt-0.5 space-y-1.5">
                <div>
                  <span className="text-xs text-neutral-600 font-medium">
                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchAuthTab(isSignUp ? 'signin' : 'signup')}
                    className="text-xs font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                  >
                    {isSignUp ? 'Log in' : 'Sign up'}
                  </button>
                </div>

                {!isSignUp && (
                  <p className="text-[11px] text-neutral-500">
                    Protected by our{' '}
                    <button
                      type="button"
                      onClick={() => openPolicies('terms')}
                      className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                    >
                      Terms of Service
                    </button>{' '}
                    &amp;{' '}
                    <button
                      type="button"
                      onClick={() => openPolicies('privacy')}
                      className="font-bold text-[#19154E] underline hover:text-[#FF7EB6]"
                    >
                      Privacy Policy
                    </button>
                    .
                  </p>
                )}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-bold text-neutral-500">
            <a href="../index.html" className="hover:text-[#19154E]">
              ← TechFairyLab
            </a>
            <button
              type="button"
              onClick={() => openPolicies('privacy')}
              className="hover:text-[#19154E] underline"
            >
              Legal &amp; Policies
            </button>
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
            Waking up SocialAssist Studio...
          </span>
        </div>
      </div>
    );
  }

  const baseFallback = EMPTY_WORKSPACE_ANALYTICS;
  const isUnconnected = analyticsData?.source === 'unconnected_workspace';
  const profile = analyticsData?.profile || baseFallback.profile;
  const summary = {
    ...baseFallback.analysis.summary,
    ...(analyticsData?.analysis?.summary || {}),
  };
  const strategies = analyticsData?.analysis?.strategies || baseFallback.analysis.strategies;
  const contentIdeas =
    analyticsData?.analysis?.content_ideas || baseFallback.analysis.content_ideas;
  const rawPosts = isUnconnected
    ? []
    : analyticsData?.posts && analyticsData.posts.length > 0
    ? analyticsData.posts
    : baseFallback.posts;
  const posts = rawPosts.map((p) => {
    const views = typeof p.views === 'number' ? p.views : 0;
    const likes = typeof p.likes === 'number' ? p.likes : 0;
    const comments = typeof p.comments === 'number' ? p.comments : 0;
    const saves = typeof p.saves === 'number' ? p.saves : null;
    const shares = typeof p.shares === 'number' ? p.shares : null;
    const followersGained =
      typeof p.followers_gained === 'number' ? p.followers_gained : null;
    const engagementRate =
      typeof p.engagement_rate === 'number'
        ? p.engagement_rate
        : views > 0
        ? Number((((likes + comments + (saves || 0) + (shares || 0)) / views) * 100).toFixed(2))
        : 0;
    return {
      ...p,
      views,
      likes,
      comments,
      saves,
      shares,
      followers_gained: followersGained,
      follower_conversion_rate:
        followersGained !== null && views > 0
          ? Number(((followersGained / views) * 100).toFixed(2))
          : null,
      engagement_rate: engagementRate,
      title: p.title || (p.caption || '').split('\n')[0].slice(0, 68) || 'Instagram Reel',
      published_label: p.published_label || 'Reel',
      thumbnail_url: p.thumbnail_url || '',
      fallback_thumbnail_url: p.fallback_thumbnail_url || '',
      video_summary_text:
        p.video_summary_text ||
        `CAPTION: ${(p.caption || '').slice(0, 140)} | LIVE METRICS: ${views.toLocaleString()} views, ${likes.toLocaleString()} likes, ${comments.toLocaleString()} comments (${engagementRate}% engagement rate).`,
    };
  });

  const hasFollowerInsights = posts.some((p) => typeof p.followers_gained === 'number');
  const sortedPosts = [...posts].sort((a, b) => {
    if (videoSortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
    if (videoSortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
    if (videoSortBy === 'engagement') return (b.engagement_rate || 0) - (a.engagement_rate || 0);
    if (videoSortBy === 'recent')
      return (b.taken_at_timestamp || 0) - (a.taken_at_timestamp || 0);
    if (videoSortBy === 'followers' && hasFollowerInsights)
      return (b.followers_gained || 0) - (a.followers_gained || 0);
    return (b.views || 0) - (a.views || 0);
  });

  const topByViews = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0))[0] || {};
  const topByComments = [...posts].sort((a, b) => (b.comments || 0) - (a.comments || 0))[0] || {};
  const avgLikesPerPost =
    posts.length > 0 ? Math.round((summary.total_likes || 0) / posts.length) : 0;

  const isLiveSynced =
    analyticsData?.source === 'live_instagram_public' ||
    analyticsData?.source === 'live_instagram_sync' ||
    analyticsData?.source === 'instagram_graph_api';
  const isGraphApiLive = analyticsData?.source === 'instagram_graph_api';
  const syncedTimeLabel = analyticsData?.fetched_at
    ? new Date(analyticsData.fetched_at).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const usActivity =
    analyticsData?.analysis?.us_audience_activity || INITIAL_ANALYTICS.analysis.us_audience_activity;
  const openclawBrief =
    analyticsData?.analysis?.openclaw_brief || INITIAL_ANALYTICS.analysis.openclaw_brief;

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
                <button
                  type="button"
                  onClick={() => setActiveTab('connect')}
                  title="Switch or connect an Instagram account"
                  className="text-xs px-2.5 py-0.5 rounded-full bg-[#C8F904] text-[#19154E] border-2 border-[#19154E] font-bold hover:opacity-90"
                >
                  {profile.username ? `@${profile.username}` : '+ Connect IG'}
                </button>
                <a
                  href="../index.html"
                  className="text-[11px] px-2 py-0.5 rounded-lg bg-white border border-[#19154E] font-bold text-neutral-700 hover:bg-[#B799E8] hover:text-[#19154E] transition-colors duration-150 hidden md:inline-block"
                  title="Return to TechFairyLab Home"
                >
                  ← TechFairyLab
                </a>
              </div>
              <p
                data-testid="signed-in-banner"
                className="text-xs font-medium text-neutral-600 hidden sm:block"
              >
                {currentUserEmail
                  ? currentUsername
                    ? `Signed in as ${currentUsername} (${currentUserEmail})`
                    : `Signed in as ${currentUserEmail}`
                  : 'Automated Instagram DM Studio & Growth Observatory'}
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
              onClick={handleSignOut}
              title={
                currentUserEmail
                  ? `Signed in as ${currentUserEmail} — click to sign out`
                  : 'Sign Out'
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#19154E] bg-white hover:bg-[#FFE4F1] border-2 border-[#19154E] transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF7EB6]" />
              <span>Sign Out</span>
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
                on <strong>{profile.username ? `@${profile.username}` : 'your Instagram account'}</strong>, our cartoon courier replies in the comments and
                drops your link straight into their DMs.
              </p>

              {/* Quick Editorial Pill Counters */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="editorial-card-sm px-4 py-2 bg-white flex items-center gap-2.5">
                  <span
                    className={`w-3 h-3 rounded-full border border-[#19154E] ${
                      isLiveSynced ? 'bg-emerald-400 animate-pulse' : 'bg-[#FF7EB6]'
                    }`}
                  />
                  <span className="text-xs font-semibold text-neutral-600">Live Followers:</span>
                  <span className="font-display font-bold text-sm">
                    {(profile.followers_count || 0).toLocaleString()}
                  </span>
                </div>

                <div className="editorial-card-sm px-4 py-2 bg-white flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#C8F904] border border-[#19154E]" />
                  <span className="text-xs font-semibold text-neutral-600">Posts:</span>
                  <span className="font-display font-bold text-sm">
                    {(profile.media_count || 0).toLocaleString()}
                  </span>
                </div>

                <div className="editorial-card-sm px-4 py-2 bg-white flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF7EB6] border border-[#19154E]" />
                  <span className="text-xs font-semibold text-neutral-600">#1 Reel Views:</span>
                  <span className="font-display font-bold text-sm">
                    {(topByViews.views || 0).toLocaleString()}
                  </span>
                </div>

                {!connection?.has_access_token && (
                  <button
                    onClick={() => setActiveTab('connect')}
                    className="editorial-btn px-4 py-2 rounded-2xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Connect Graph API</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Animated Studio Mascot */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center">
              <div
                onClick={triggerFairyWand}
                title="Click mascot to cast a DM spell!"
                className="w-60 h-60 sm:w-64 sm:h-64 cursor-pointer"
              >
                <TechFairyCharacter
                  isCasting={isCastingWand}
                  mood={isCastingWand ? 'excited' : 'happy'}
                />
              </div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                ↑ Click studio mascot or test a trigger below!
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
                        placeholder="https://example.com"
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
                                setSimText(
                                  `Can you send me ${kw} please?! ✨`
                                );
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
                      Click <strong>Fire Test</strong> above to watch SocialAssist reply in the comments &amp; send the DM card!
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
            1) Best Performing Videos by Views & Followers Gained + Text Summaries
            2) United States (US) Audience Activity Observatory
        ============================================================ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 panel-enter">
            {/* Astronomer Observatory Header Card */}
            <div className="editorial-card p-6 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE9FE] border-2 border-[#19154E] text-xs font-bold text-[#6D28D9]">
                    <span>🔭 @{profile.username || 'your_account'} Live Instagram Telemetry</span>
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#19154E] text-xs font-bold ${
                      isLiveSynced ? 'bg-[#C8F904] text-[#19154E]' : 'bg-[#FFE4F1] text-[#19154E]'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full border border-[#19154E] ${
                        isLiveSynced ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      {isGraphApiLive
                        ? 'Official Graph API Live'
                        : isLiveSynced
                        ? 'Live from Instagram'
                        : 'Offline Snapshot'}
                      {syncedTimeLabel ? ` • Synced ${syncedTimeLabel}` : ''}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                  Live Instagram Reels by{' '}
                  <span className="px-2.5 py-0.5 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E]">
                    Views, Likes &amp; Engagement
                  </span>{' '}
                  + US Active Windows
                </h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  Pulling real-time follower counts, post counts, and per-Reel views, likes, comments,
                  and engagement rates directly from <strong>@{profile.username || 'your_account'}</strong> on Instagram.
                  Auto-refreshes every 90s or click <strong>Sync Live Instagram Metrics</strong> anytime.
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleRefreshAnalytics}
                    disabled={syncing}
                    className="editorial-btn px-4 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold inline-flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Syncing Live from Instagram...' : 'Sync Live Instagram Metrics'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('strategy');
                      handleRunOpenClaw();
                    }}
                    className="editorial-btn px-4 py-2 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs font-bold inline-flex items-center gap-2"
                  >
                    <span>🦞 Analyze Live Stats in OpenClaw</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-center">
                <div className="w-60 h-44">
                  <DataAstronomerCharacter />
                </div>
              </div>
            </div>

            {/* 6 Bold Editorial Metric Cards — 100% Live Instagram Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>LIVE FOLLOWERS</span>
                  <Instagram className="w-4 h-4 text-[#FF7EB6]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(profile.followers_count || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1">
                  {(profile.media_count || 0).toLocaleString()} posts
                  {profile.follows_count ? ` • ${profile.follows_count} following` : ''}
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#FF7EB6]">
                <div className="text-xs font-bold text-[#19154E] flex items-center justify-between">
                  <span>#1 REEL VIEWS</span>
                  <Eye className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(topByViews.views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1 truncate">
                  {(topByViews.likes || 0).toLocaleString()} Likes • {(topByViews.comments || 0).toLocaleString()} Comments
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>TRACKED VIEWS</span>
                  <TrendingUp className="w-4 h-4 text-[#6D28D9]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(summary.total_views || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-1">
                  Across {posts.length} live Reels
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#C8F904]">
                <div className="text-xs font-bold text-[#19154E] flex items-center justify-between">
                  <span>LIVE LIKES</span>
                  <Sparkles className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(summary.total_likes || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1">
                  Avg {avgLikesPerPost.toLocaleString()} likes / Reel
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-[#B799E8]">
                <div className="text-xs font-bold text-[#19154E] flex items-center justify-between">
                  <span>LIVE COMMENTS</span>
                  <MessageCircle className="w-4 h-4 text-[#19154E]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#19154E] mt-1.5">
                  {(summary.total_comments || 0).toLocaleString()}
                </div>
                <div className="text-[11px] font-bold text-[#19154E] mt-1">
                  Top Reel: {(topByComments.comments || 0).toLocaleString()} comments
                </div>
              </div>

              <div className="editorial-card-sm p-4 bg-white">
                <div className="text-xs font-bold text-neutral-500 flex items-center justify-between">
                  <span>AVG ENGAGEMENT</span>
                  <Send className="w-4 h-4 text-[#FF7EB6]" />
                </div>
                <div className="font-display text-2xl font-bold text-[#6D28D9] mt-1.5">
                  {summary.avg_engagement_rate || 0}%
                </div>
                <div className="text-[11px] font-semibold text-neutral-600 mt-1">
                  {typeof summary.total_followers_gained === 'number'
                    ? `+${summary.total_followers_gained.toLocaleString()} followers (Graph API)`
                    : `(Likes + Comments) ÷ Views`}
                </div>
              </div>
            </div>

            {/* ============================================================
                GOAL 1 & 2: LIVE INSTAGRAM REELS RANKING
                & STRUCTURED TEXT SUMMARIES FOR OPENCLAW AGENT
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 border-b-2 border-[#19154E] bg-[#F5EEFF] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF7EB6] border border-[#19154E] text-[11px] font-bold text-[#19154E] mb-1">
                    <span>🎬 Live Instagram Reels Performance &amp; Agent Text Summaries</span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#19154E]">
                    Live Reels on @{profile.username || 'your_account'} (Direct from Instagram)
                  </h3>
                  <p className="text-xs font-medium text-neutral-700">
                    Live views, likes, comments, and engagement rates pulled directly from Instagram, paired with structured summaries for OpenClaw.
                  </p>
                </div>

                {/* Sort Selector Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-[#19154E]">Rank By:</span>
                  <button
                    onClick={() => setVideoSortBy('views')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors duration-150 ${
                      videoSortBy === 'views'
                        ? 'bg-[#C8F904] text-[#19154E]'
                        : 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                    }`}
                  >
                    👁️ Live Views
                  </button>
                  <button
                    onClick={() => setVideoSortBy('likes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors duration-150 ${
                      videoSortBy === 'likes'
                        ? 'bg-[#FF7EB6] text-[#19154E]'
                        : 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                    }`}
                  >
                    ❤️ Live Likes
                  </button>
                  <button
                    onClick={() => setVideoSortBy('engagement')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors duration-150 ${
                      videoSortBy === 'engagement'
                        ? 'bg-[#B799E8] text-[#19154E]'
                        : 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                    }`}
                  >
                    ⚡ Engagement %
                  </button>
                  <button
                    onClick={() => setVideoSortBy('recent')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors duration-150 ${
                      videoSortBy === 'recent'
                        ? 'bg-[#19154E] text-[#FFF8FC]'
                        : 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                    }`}
                  >
                    🕒 Newest
                  </button>
                  {hasFollowerInsights && (
                    <button
                      onClick={() => setVideoSortBy('followers')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-[#19154E] transition-colors duration-150 ${
                        videoSortBy === 'followers'
                          ? 'bg-[#FF7EB6] text-[#19154E]'
                          : 'bg-white text-[#19154E] hover:bg-[#FFF8FC]'
                      }`}
                    >
                      🏆 Followers Gained
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {sortedPosts.map((post, idx) => (
                  <div
                    key={post.id}
                    className={`rounded-2xl border-2 border-[#19154E] p-4 sm:p-5 transition-colors duration-150 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-[#FFF8FC] via-[#FFFDF9] to-[#F5EEFF] shadow-[4px_4px_0px_#19154E]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-dashed border-neutral-200 pb-3.5">
                      <div className="flex items-start gap-3.5">
                        {post.thumbnail_url && (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="relative shrink-0 group"
                            title="Open Reel on Instagram"
                          >
                            <img
                              src={post.thumbnail_url}
                              alt={post.title}
                              onError={(e) => {
                                if (
                                  post.fallback_thumbnail_url &&
                                  e.currentTarget.src !== post.fallback_thumbnail_url &&
                                  !e.currentTarget.dataset.fallbackApplied
                                ) {
                                  e.currentTarget.dataset.fallbackApplied = 'true';
                                  e.currentTarget.src = post.fallback_thumbnail_url;
                                }
                              }}
                              className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl border-2 border-[#19154E] object-cover shadow-[2px_2px_0px_#19154E] bg-[#19154E] group-hover:scale-[1.02] transition-transform duration-150"
                            />
                            <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] font-extrabold px-1 py-0.5 rounded bg-[#19154E]/90 text-[#C8F904]">
                              ▶ {(post.views || 0).toLocaleString()}
                            </span>
                          </a>
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border-2 border-[#19154E] ${
                                idx === 0
                                  ? 'bg-[#C8F904] text-[#19154E]'
                                  : idx === 1
                                  ? 'bg-[#FF7EB6] text-[#19154E]'
                                  : idx === 2
                                  ? 'bg-[#B799E8] text-[#19154E]'
                                  : 'bg-neutral-100 text-[#19154E]'
                              }`}
                            >
                              #{idx + 1} {idx === 0 ? 'TOP PERFORMER' : idx < 3 ? 'HIGH PERFORMER' : 'LIVE REEL'}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-[#19154E] bg-[#EDE9FE] text-[#6D28D9]">
                              {post.type} • {post.published_label || 'Reel'}
                              {post.duration_sec ? ` • ${post.duration_sec}s` : ''}
                            </span>
                            {post.best_keyword && !post.best_keyword.includes('None') && (
                              <span className="font-mono-code text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-[#C8F904] text-[#19154E] border border-[#19154E]">
                                Trigger: &quot;{post.best_keyword}&quot;
                              </span>
                            )}
                            {post.permalink && (
                              <a
                                href={post.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-white border border-[#19154E] text-[#19154E] hover:bg-[#C8F904] inline-flex items-center gap-1 transition-colors duration-150"
                              >
                                <span>Instagram</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-base sm:text-lg text-[#19154E]">
                            {post.title}
                          </h4>
                          <p className="text-xs text-neutral-600 line-clamp-2">{post.caption}</p>
                        </div>
                      </div>

                      {/* Key Live Performance Badges */}
                      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <div className="px-3.5 py-2 rounded-xl bg-[#C8F904] border-2 border-[#19154E] text-center">
                          <div className="text-[10px] font-extrabold uppercase text-[#19154E]">
                            Live Views
                          </div>
                          <div className="font-display font-bold text-base text-[#19154E]">
                            {(post.views || 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="px-3.5 py-2 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E] text-center">
                          <div className="text-[10px] font-extrabold uppercase text-[#19154E]">
                            Live Likes
                          </div>
                          <div className="font-display font-bold text-base text-[#19154E]">
                            {(post.likes || 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-[#F5EEFF] border-2 border-[#19154E] text-center">
                          <div className="text-[10px] font-bold uppercase text-[#6D28D9]">
                            Comments
                          </div>
                          <div className="font-display font-bold text-sm text-[#19154E]">
                            {(post.comments || 0).toLocaleString()}
                          </div>
                        </div>

                        <div className="px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-center">
                          <div className="text-[10px] font-bold uppercase text-neutral-500">
                            Eng. Rate
                          </div>
                          <div className="font-display font-bold text-sm text-[#19154E]">
                            {post.engagement_rate}%
                          </div>
                        </div>

                        {typeof post.followers_gained === 'number' && (
                          <div className="px-3 py-2 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E] text-center">
                            <div className="text-[10px] font-bold uppercase text-[#6D28D9]">
                              +Followers
                            </div>
                            <div className="font-display font-bold text-sm text-[#19154E]">
                              +{post.followers_gained.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Structured Text Summary Box for Agent Analysis */}
                    <div className="mt-3.5 p-3.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#6D28D9] flex items-center gap-1.5">
                          <span>📝 Video Text Summary &amp; Live Metrics (For AI Agent Analysis)</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                `${post.title}\nPermalink: ${post.permalink}\nLive Views: ${(post.views || 0).toLocaleString()} | Live Likes: ${(post.likes || 0).toLocaleString()} | Live Comments: ${(post.comments || 0).toLocaleString()} | ER: ${post.engagement_rate}%\nSummary: ${post.video_summary_text}`,
                                `summary-${post.id}`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold text-[#19154E] hover:bg-[#EDE9FE] inline-flex items-center gap-1"
                          >
                            {copiedField === `summary-${post.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-700" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Summary</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const customP = `Analyze this live Instagram Reel for "${post.title}" (${(post.views || 0).toLocaleString()} live views, ${(post.likes || 0).toLocaleString()} likes, ${(post.comments || 0).toLocaleString()} comments, ${post.engagement_rate}% engagement rate): ${post.video_summary_text} — Why did it perform this way and how can I replicate or improve it for my US audience?`;
                              setActiveTab('strategy');
                              handleRunOpenClaw(customP);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#19154E] text-[#FFF8FC] text-[11px] font-bold hover:bg-[#6D28D9] inline-flex items-center gap-1"
                          >
                            <span>🦞 Send to OpenClaw Agent</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#19154E] font-medium leading-relaxed">
                        {post.video_summary_text}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-4 text-[11px] font-bold text-neutral-600">
                        <span>👁️ Views: {(post.views || 0).toLocaleString()}</span>
                        <span>❤️ Likes: {(post.likes || 0).toLocaleString()}</span>
                        <span>💬 Comments: {(post.comments || 0).toLocaleString()}</span>
                        {typeof post.saves === 'number' && (
                          <span>📌 Saves: {post.saves.toLocaleString()}</span>
                        )}
                        {typeof post.shares === 'number' && (
                          <span>🔁 Shares: {post.shares.toLocaleString()}</span>
                        )}
                        {post.PostingHour && <span>🕒 Posted: {post.PostingHour}</span>}
                        <span>⚡ Eng. Rate: {post.engagement_rate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================
                GOAL 3: UNITED STATES (US) AUDIENCE ACTIVITY OBSERVATORY
                (Specifically isolating US followers vs. Global followers)
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 border-b-2 border-[#19154E] bg-gradient-to-r from-[#EDE9FE] via-[#FFF8FC] to-[#FFE4F1] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C8F904] border border-[#19154E] text-[11px] font-bold text-[#19154E] mb-1">
                    <span>🇺🇸 Goal #3: United States Audience Activity (Isolated from Global)</span>
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl text-[#19154E]">
                    When United States Followers Are Most Active (EST)
                  </h3>
                  <p className="text-xs font-medium text-neutral-700">
                    Peak US East &amp; West Coast scroll windows benchmarked for{' '}
                    <strong>@{profile.username || 'your_account'}</strong> (
                    <strong>{(profile.followers_count || 0).toLocaleString()}</strong> live followers).
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FF7EB6] border-2 border-[#19154E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#19154E]" />
                    🇺🇸 US Followers Active %
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B799E8]" />
                    🌍 All Global Followers %
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-6">
                {/* Key Diagnostic Callout */}
                <div className="p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs leading-relaxed font-medium text-[#19154E]">
                  <strong className="font-bold text-[#6D28D9]">🔎 US vs. Global Timing Insight: </strong>
                  {usActivity.key_insight}
                </div>

                {/* Optional Audience Demographics (Shown only when user connects their own Insights token) */}
                {usActivity.top_countries && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E] space-y-2">
                      <div className="text-xs font-extrabold uppercase text-[#19154E]">
                        🌍 Top Follower Countries (Instagram Insights)
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {usActivity.top_countries.map((c) => (
                          <div
                            key={c.country}
                            className={`p-2.5 rounded-xl border border-[#19154E] flex items-center justify-between text-xs font-bold ${
                              c.country.includes('United States')
                                ? 'bg-[#C8F904] text-[#19154E]'
                                : 'bg-white text-[#19154E]'
                            }`}
                          >
                            <span>
                              {c.flag} {c.country}
                            </span>
                            <span>{c.share_pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] space-y-2">
                      <div className="text-xs font-extrabold uppercase text-[#19154E]">
                        👥 Follower Age &amp; Gender Split ({(profile.followers_count || 0).toLocaleString()} Live Followers)
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {(usActivity.age_ranges || []).slice(0, 4).map((a) => (
                          <span
                            key={a.range}
                            className="px-2.5 py-1 rounded-xl bg-white border border-[#19154E] text-[#19154E]"
                          >
                            Age {a.range}: <strong className="text-[#6D28D9]">{a.pct ?? a.share_pct}%</strong>
                          </span>
                        ))}
                        {usActivity.gender_split && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#FF7EB6] border border-[#19154E] text-[#19154E]">
                            Men {usActivity.gender_split.men_pct}% • Women {usActivity.gender_split.women_pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hourly EST Bar Comparison: US Active % vs Global Active % */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-sm text-[#19154E]">
                    Hourly Activity Breakdown (Eastern Time — EST/EDT)
                  </h4>
                  <div className="space-y-2.5">
                    {(usActivity.hourly_est || []).map((slot) => {
                      const isPeak = slot.us_active >= 85;
                      return (
                        <div
                          key={slot.hour}
                          className={`p-3 rounded-xl border-2 border-[#19154E] ${
                            isPeak ? 'bg-[#FFFDF9] shadow-[2px_2px_0px_#19154E]' : 'bg-white'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-code font-bold text-[#19154E] w-14">
                                {slot.hour} EST
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                  isPeak
                                    ? 'bg-[#C8F904] text-[#19154E] border border-[#19154E]'
                                    : 'text-neutral-600'
                                }`}
                              >
                                {slot.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 font-bold">
                              <span className="text-[#19154E]">
                                🇺🇸 US Active: <strong>{slot.us_active}%</strong>
                              </span>
                              <span className="text-neutral-500">
                                🌍 Global: {slot.global_active}%
                              </span>
                            </div>
                          </div>

                          {/* Dual Progress Bars */}
                          <div className="space-y-1">
                            <div className="w-full h-3 rounded-full bg-neutral-100 border border-[#19154E] overflow-hidden">
                              <div
                                className={`h-full ${
                                  isPeak ? 'bg-[#FF7EB6]' : 'bg-[#B799E8]'
                                }`}
                                style={{ width: `${slot.us_active}%` }}
                              />
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className="h-full bg-neutral-400"
                                style={{ width: `${slot.global_active}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3-Column Grid: Best US Posting Slots, Top US Cities, US Timezones */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Column 1: Best US Posting Windows */}
                  <div className="p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      🎯 Best US Posting Windows (EST)
                    </h4>
                    <div className="space-y-2">
                      {(usActivity.best_us_slots || []).map((s) => (
                        <div
                          key={s.day}
                          className="p-2.5 rounded-xl bg-white border border-[#19154E] text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-[#19154E]">
                            <span>
                              {s.day} • {s.window_est}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#C8F904] text-[10px]">
                              {s.us_active_pct}% US Active
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-600 font-medium">{s.best_for}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Top United States Cities */}
                  <div className="p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      🏙️ Top United States Tech Hubs
                    </h4>
                    <div className="space-y-2">
                      {(usActivity.us_cities || []).map((c) => (
                        <div
                          key={c.city}
                          className="p-2.5 rounded-xl bg-white border border-[#19154E] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#19154E]">{c.city}</span>
                            <span className="ml-1.5 text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9]">
                              {c.tz}
                            </span>
                          </div>
                          <span className="font-display font-bold text-[#FF7EB6]">
                            {c.share_pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: US Follower Timezone Split */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] space-y-2.5">
                    <h4 className="font-display font-bold text-sm text-[#19154E]">
                      ⏰ US Follower Timezone Split
                    </h4>
                    <div className="space-y-2.5">
                      {(usActivity.us_timezones || []).map((tz) => (
                        <div key={tz.zone} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-[#19154E]">
                            <span>{tz.zone}</span>
                            <span>{tz.share_pct}% of US Followers</span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-white border border-[#19154E] overflow-hidden">
                            <div
                              className="h-full bg-[#FF7EB6]"
                              style={{ width: `${tz.share_pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      <div className="pt-2 text-[11px] text-neutral-600 font-medium leading-relaxed">
                        💡 <strong>77% of your US audience</strong> lives in Eastern (EST) or Pacific (PST) timezones — posting at <strong>6:00 PM EST (3:00 PM PST)</strong> reaches both coasts while awake!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 3: OPENCLAW AGENT HUB & AI STRATEGY ENGINE
        ============================================================ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6 panel-enter">
            {/* ============================================================
                OPENCLAW AGENT HOOKUP & VIDEO SUMMARY ANALYZER
            ============================================================ */}
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-5 sm:p-6 border-b-2 border-[#19154E] bg-gradient-to-r from-[#FF7EB6]/30 via-[#F5EEFF] to-[#FFF8FC] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#19154E] text-[#FFF8FC] text-xs font-bold">
                    <span>🦞 OpenClaw Agent Hookup</span>
                    <span>•</span>
                    <span className="text-[#C8F904]">
                      {openclawStatus === 'connected_gateway'
                        ? 'Connected to Live OpenClaw Gateway'
                        : 'OpenClaw Video Analyzer Ready'}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                    OpenClaw Video Summary Analyzer &amp; Agent Hub
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 max-w-3xl">
                    Your top-performing videos (by Views &amp; Followers Gained) and US audience activity
                    are automatically summarized into a structured text brief so your{' '}
                    <strong>OpenClaw Agent</strong> can analyze them right here on the site.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBriefPreview(!showBriefPreview)}
                    className="editorial-btn px-3.5 py-2 rounded-xl bg-white text-[#19154E] text-xs font-bold"
                  >
                    {showBriefPreview ? 'Hide Text Brief' : '📄 View Compiled Video Brief'}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(openclawBrief, 'openclaw-brief')}
                    className="editorial-btn px-3.5 py-2 rounded-xl bg-[#C8F904] text-[#19154E] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    {copiedField === 'openclaw-brief' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Brief Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Brief for Agent</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* OpenClaw Gateway Endpoint & Context Feed Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-4 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E]">
                  <div className="lg:col-span-6">
                    <label className="block text-[11px] font-extrabold uppercase text-[#19154E] mb-1">
                      🦞 OpenClaw Gateway / Agent Endpoint URL
                    </label>
                    <input
                      type="text"
                      value={openclawGatewayUrl}
                      onChange={(e) => setOpenclawGatewayUrl(e.target.value)}
                      placeholder="http://localhost:18789/v1/chat/completions"
                      className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code font-bold text-[#6D28D9]"
                    />
                  </div>
                  <div className="lg:col-span-6">
                    <label className="block text-[11px] font-extrabold uppercase text-[#19154E] mb-1">
                      📡 Live Instagram Telemetry Feed URL (For External OpenClaw Skills)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/analytics`}
                        className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code font-bold text-[#19154E]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            `${typeof window !== 'undefined' ? window.location.origin : 'https://www.techfairylab.com'}/api/analytics`,
                            'brief-url'
                          )
                        }
                        className="px-3 py-2 rounded-xl bg-[#EDE9FE] border-2 border-[#19154E] text-xs font-bold text-[#19154E]"
                      >
                        {copiedField === 'brief-url' ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional Collapsible Raw Text Brief */}
                {showBriefPreview && (
                  <div className="p-4 rounded-2xl bg-[#19154E] text-[#FFF8FC] border-2 border-[#19154E] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#C8F904]">
                        Compiled Live Instagram Metrics + US Active Hours Brief (Auto-fed to OpenClaw):
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(openclawBrief, 'openclaw-brief-inner')}
                        className="text-xs font-bold text-[#FF7EB6] underline"
                      >
                        {copiedField === 'openclaw-brief-inner' ? 'Copied!' : 'Copy All Text'}
                      </button>
                    </div>
                    <pre className="text-[11px] font-mono-code whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto text-neutral-200">
                      {openclawBrief}
                    </pre>
                  </div>
                )}

                {/* Agent Prompt & Quick Task Pills */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#19154E]">Quick Agent Tasks:</span>
                    {[
                      'Compare my top 3 live Reels by Views & Engagement Rate and write 3 new Reel scripts',
                      'Why did my #1 live Reel outperform my account average, and how do I build a Part 2 sequel?',
                      'Build a 7-day US Audience posting schedule (EST & PST) from my live Reel stats',
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleRunOpenClaw(preset)}
                        className="px-3 py-1 rounded-xl bg-[#F5EEFF] hover:bg-[#FF7EB6] border border-[#19154E] text-[11px] font-bold text-[#19154E] transition-colors duration-150"
                      >
                        ✨ {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      value={openclawPrompt}
                      onChange={(e) => setOpenclawPrompt(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#FFF8FC] border-2 border-[#19154E] text-xs sm:text-sm font-semibold text-[#19154E]"
                      placeholder="Ask your OpenClaw Agent anything about your video text summaries or US audience..."
                    />
                    <button
                      type="button"
                      onClick={() => handleRunOpenClaw()}
                      disabled={openclawStatus === 'running'}
                      className="editorial-btn px-5 py-2.5 rounded-xl bg-[#FF7EB6] text-[#19154E] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {openclawStatus === 'running'
                          ? 'Analyzing Summaries...'
                          : '🦞 Run OpenClaw Agent'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* OpenClaw Agent Analysis Output */}
                <div className="p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#19154E] shadow-[4px_4px_0px_#19154E] space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-dashed border-neutral-200 pb-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#6D28D9]">
                      🦞 OpenClaw Agent Response (Based on Your Top Video Summaries &amp; US Audience)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(openclawOutput, 'openclaw-output')}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#19154E] text-[11px] font-bold text-[#19154E]"
                    >
                      {copiedField === 'openclaw-output' ? 'Copied Analysis!' : 'Copy Analysis'}
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-[#19154E] whitespace-pre-wrap leading-relaxed font-medium">
                    {openclawOutput}
                  </div>
                </div>
              </div>
            </div>

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
                  Tailored for @{profile.username || 'your_account'}&apos;s live audience and content pillars:
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
            TAB 4: 1-STEP INSTAGRAM LINK + REDIRECT LOGIN
        ============================================================ */}
        {activeTab === 'connect' && (
          <div className="max-w-3xl mx-auto space-y-6 panel-enter">
            <div className="editorial-card p-6 sm:p-8 bg-white space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b-2 border-[#19154E] pb-5">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8F904] border-2 border-[#19154E] text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Isolated Workspace</span>
                    </span>
                    {currentUserEmail && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5EEFF] border-2 border-[#19154E] text-xs font-bold">
                        <span>{currentUserEmail}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#19154E]">
                    {profile.username
                      ? `Connected to @${profile.username}`
                      : 'Connect Your Instagram Account'}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-700 font-medium">
                    Enter your Instagram <strong>@handle</strong> or profile link below and click{' '}
                    <strong>Connect to Instagram</strong> to sign in on Instagram and pull your live
                    followers, posts, and Reel stats into your private workspace.
                  </p>
                </div>
                <div className="md:col-span-4 flex justify-center">
                  <div className="w-48 h-32">
                    <PlugMechanicCharacter connected={Boolean(profile.username)} />
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

              {/* Single Unified Connect & Redirect Form */}
              <form onSubmit={handleConnectAndRedirect} className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#FFF8FC] border-2 border-[#19154E] space-y-3">
                  <label className="block text-sm font-display font-bold text-[#19154E]">
                    Instagram Profile Link or @Username
                  </label>
                  <input
                    type="text"
                    required
                    data-testid="ig-handle-input"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder="https://www.instagram.com/your_handle/ or @your_handle"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#19154E] text-sm font-bold text-[#19154E] focus:outline-none"
                  />
                  <p className="text-xs text-neutral-600 font-medium">
                    Detected account:{' '}
                    <strong className="font-mono-code text-[#6D28D9]">
                      {extractHandleFromLink(handleInput)
                        ? `@${extractHandleFromLink(handleInput)}`
                        : 'Enter your Instagram handle above'}
                    </strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={syncing}
                  data-testid="single-connect-ig-btn"
                  className="w-full editorial-btn py-4 px-6 rounded-2xl bg-[#C8F904] text-[#19154E] font-display font-bold text-sm sm:text-base flex items-center justify-center gap-2.5"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Connecting to Instagram &amp; Pulling Live Stats...</span>
                    </>
                  ) : (
                    <>
                      <Instagram className="w-5 h-5" />
                      <span>Connect to Instagram &amp; Pull Stats ↗</span>
                    </>
                  )}
                </button>

                {profile.username && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleDisconnectInstagram}
                      className="text-xs font-bold text-neutral-500 hover:text-rose-600 underline"
                    >
                      Disconnect @{profile.username} from your workspace
                    </button>
                  </div>
                )}
              </form>

              {/* Optional Collapsed Advanced Section (Hidden by Default) */}
              <details className="pt-2 border-t border-neutral-200 text-xs">
                <summary className="cursor-pointer font-bold text-neutral-500 hover:text-[#19154E] select-none py-1">
                  ⚙️ Advanced Meta Webhook / API Token Settings (Optional)
                </summary>
                <form onSubmit={handleConnectSubmit} className="mt-4 space-y-4 p-4 rounded-2xl bg-[#F5EEFF] border-2 border-[#19154E]">
                  <div>
                    <label className="block text-xs font-bold text-[#19154E] mb-1">
                      Optional Meta Graph Access Token
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="IGQWR... or EAA..."
                      className="w-full px-3.5 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Optional Meta App ID
                      </label>
                      <input
                        type="text"
                        value={appIdInput}
                        onChange={(e) => setAppIdInput(e.target.value)}
                        placeholder="App ID"
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#19154E] mb-1">
                        Optional Meta App Secret
                      </label>
                      <input
                        type="password"
                        value={appSecretInput}
                        onChange={(e) => setAppSecretInput(e.target.value)}
                        placeholder="App Secret"
                        className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#19154E] text-xs font-mono-code"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="editorial-btn px-4 py-2 rounded-xl bg-[#19154E] text-white text-xs font-bold"
                  >
                    Save Advanced API Settings
                  </button>
                </form>
              </details>
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
